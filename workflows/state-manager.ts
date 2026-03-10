/**
 * UltraWork SanGuo - Workflow State Manager
 * 
 * 工作流状态管理器 - 负责状态的持久化、恢复和查询
 */

import type { 
  WorkflowState, 
  WorkflowContext, 
  WorkflowStatus,
  PhaseResult,
  PhaseStatus,
  WorkflowLogEntry
} from './types'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 状态存储目录
const STATE_DIR = join(process.env.HOME || process.env.USERPROFILE || '.', '.opencode', 'ultrawork-states')

// 确保目录存在
function ensureStateDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true })
  }
}

/**
 * 生成唯一的工作流ID
 */
export function generateWorkflowId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `wf_${timestamp}_${random}`
}

/**
 * 创建初始工作流状态
 */
export function createWorkflowState(
  workflowType: string,
  originalTask: string,
  directory: string,
  parentSessionId: string,
  maxRetries: number = 3
): WorkflowState {
  const workflowId = generateWorkflowId()
  
  const context: WorkflowContext = {
    originalTask,
    directory,
    parentSessionId,
    retryCount: 0,
    maxRetries,
    phaseResults: new Map(),
    globals: {},
    validationHistory: []
  }
  
  return {
    workflowId,
    workflowType,
    status: 'initialized',
    currentPhaseIndex: 0,
    startTime: new Date().toISOString(),
    context,
    logs: []
  }
}

/**
 * 保存工作流状态到文件
 */
export function saveWorkflowState(state: WorkflowState): void {
  ensureStateDir()
  
  const statePath = join(STATE_DIR, `${state.workflowId}.json`)
  
  // 转换 Map 为普通对象以便序列化
  const serializableState = {
    ...state,
    context: {
      ...state.context,
      phaseResults: Object.fromEntries(state.context.phaseResults)
    }
  }
  
  writeFileSync(statePath, JSON.stringify(serializableState, null, 2), 'utf-8')
}

/**
 * 加载工作流状态
 */
export function loadWorkflowState(workflowId: string): WorkflowState | null {
  const statePath = join(STATE_DIR, `${workflowId}.json`)
  
  if (!existsSync(statePath)) {
    return null
  }
  
  try {
    const content = readFileSync(statePath, 'utf-8')
    const parsed = JSON.parse(content)
    
    // 转换回 Map
    parsed.context.phaseResults = new Map(Object.entries(parsed.context.phaseResults || {}))
    
    return parsed as WorkflowState
  } catch {
    return null
  }
}

/**
 * 删除工作流状态
 */
export function deleteWorkflowState(workflowId: string): void {
  const statePath = join(STATE_DIR, `${workflowId}.json`)
  if (existsSync(statePath)) {
    // 使用 unlinkSync 但需要先导入
    import('fs').then(fs => fs.unlinkSync(statePath))
  }
}

/**
 * 更新工作流状态
 */
export function updateWorkflowState(
  state: WorkflowState,
  updates: Partial<WorkflowState>
): WorkflowState {
  const newState = { ...state, ...updates }
  saveWorkflowState(newState)
  return newState
}

/**
 * 更新阶段结果
 */
export function updatePhaseResult(
  state: WorkflowState,
  phaseId: string,
  result: Partial<PhaseResult>
): WorkflowState {
  const existing = state.context.phaseResults.get(phaseId) || {
    phaseId,
    status: 'pending' as PhaseStatus,
    agent: '',
    startTime: new Date().toISOString(),
    outputs: {},
    logs: []
  }
  
  const updated: PhaseResult = {
    ...existing,
    ...result
  }
  
  state.context.phaseResults.set(phaseId, updated)
  saveWorkflowState(state)
  
  return state
}

/**
 * 添加日志条目
 */
export function addLogEntry(
  state: WorkflowState,
  level: WorkflowLogEntry['level'],
  message: string,
  phase?: string,
  details?: unknown
): WorkflowState {
  const entry: WorkflowLogEntry = {
    timestamp: new Date().toISOString(),
    phase,
    level,
    message,
    details
  }
  
  state.logs.push(entry)
  saveWorkflowState(state)
  
  return state
}

/**
 * 更新工作流状态并记录日志
 */
export function setWorkflowStatus(
  state: WorkflowState,
  status: WorkflowStatus,
  message?: string
): WorkflowState {
  const logLevel: WorkflowLogEntry['level'] = 
    status === 'completed' ? 'success' :
    status === 'failed' ? 'error' :
    'info'
  
  let newState = addLogEntry(state, logLevel, message || `工作流状态变更为: ${status}`)
  newState = updateWorkflowState(newState, { status })
  
  return newState
}

/**
 * 获取阶段输出
 */
export function getPhaseOutput(
  state: WorkflowState,
  phaseId: string,
  outputName: string
): unknown {
  const result = state.context.phaseResults.get(phaseId)
  return result?.outputs?.[outputName]
}

/**
 * 获取所有阶段的输出摘要
 */
export function getPhaseOutputsSummary(state: WorkflowState): Record<string, Record<string, unknown>> {
  const summary: Record<string, Record<string, unknown>> = {}
  
  for (const [phaseId, result] of state.context.phaseResults) {
    summary[phaseId] = result.outputs
  }
  
  return summary
}

/**
 * 检查是否可以重试
 */
export function canRetry(state: WorkflowState): boolean {
  return state.context.retryCount < state.context.maxRetries
}

/**
 * 增加重试计数
 */
export function incrementRetry(state: WorkflowState): WorkflowState {
  state.context.retryCount++
  saveWorkflowState(state)
  return state
}

/**
 * 重置到指定阶段（用于重试）
 */
export function resetToPhase(state: WorkflowState, phaseIndex: number): WorkflowState {
  state.currentPhaseIndex = phaseIndex
  state.status = 'running'
  
  // 清除该阶段之后的所有结果
  const phasesToKeep = new Map<string, PhaseResult>()
  const phaseIds = Array.from(state.context.phaseResults.keys())
  
  for (let i = 0; i < phaseIndex && i < phaseIds.length; i++) {
    const result = state.context.phaseResults.get(phaseIds[i])
    if (result) {
      phasesToKeep.set(phaseIds[i], result)
    }
  }
  
  state.context.phaseResults = phasesToKeep
  saveWorkflowState(state)
  
  return state
}

/**
 * 格式化工作流状态报告
 */
export function formatWorkflowReport(state: WorkflowState): string {
  const statusEmoji = {
    'initialized': '⏳',
    'running': '🔄',
    'paused': '⏸️',
    'completed': '✅',
    'failed': '❌',
    'retrying': '🔁'
  }
  
  const lines: string[] = [
    `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`,
    `┃  🏰 UltraWork 工作流状态                              [${statusEmoji[state.status]} ${state.status}]  ┃`,
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`,
    `┃  📋 工作流ID: ${state.workflowId}`,
    `┃  📝 类型: ${state.workflowType}`,
    `┃  🎯 任务: ${state.context.originalTask.substring(0, 40)}...`,
    `┃  🔄 重试: ${state.context.retryCount}/${state.context.maxRetries}`,
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`,
    `┃  📊 阶段执行状态:`
  ]
  
  for (const [phaseId, result] of state.context.phaseResults) {
    const statusIcon = {
      'pending': '⏳',
      'running': '🔄',
      'completed': '✅',
      'failed': '❌',
      'skipped': '⏭️'
    }[result.status]
    
    lines.push(`┃    ${statusIcon} ${phaseId}: ${result.status}`)
    if (result.error) {
      lines.push(`┃       ⚠️ ${result.error.substring(0, 50)}`)
    }
  }
  
  lines.push(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`)
  
  return lines.join('\n')
}

export type { WorkflowState, WorkflowContext, PhaseResult }