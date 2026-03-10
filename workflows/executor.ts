/**
 * UltraWork SanGuo - Workflow Executor
 * 
 * 工作流执行引擎 - 负责执行完整的工作流，管理阶段调度、上下文传递和循环机制
 */

import type { 
  WorkflowDefinition,
  WorkflowPhase,
  WorkflowState,
  WorkflowContext,
  PhaseResult,
  ValidationResult
} from './types'
import {
  createWorkflowState,
  updateWorkflowState,
  updatePhaseResult,
  addLogEntry,
  setWorkflowStatus,
  getPhaseOutput,
  canRetry,
  incrementRetry,
  resetToPhase,
  formatWorkflowReport,
  saveWorkflowState,
  loadWorkflowState
} from './state-manager'
import type { UltraWorkSanguoConfig, AgentConfig } from '../src/config/schema'

// ============================================================================
// 执行上下文
// ============================================================================

export interface WorkflowExecutionContext {
  client: {
    session: {
      get: (args: { path: { id: string } }) => Promise<{ data?: { directory?: string; status?: string; busy?: boolean } }>
      create: (args: { body: Record<string, unknown>; query?: Record<string, unknown> }) => Promise<{ data: { id: string }; error?: unknown }>
    }
    prompt: {
      create: (args: {
        path: { id: string }
        body: {
          agent?: string
          system?: string
          parts: Array<{ type: string; text: string }>
          model?: { providerID: string; modelID: string }
          variant?: string
          tools?: Record<string, boolean>
        }
      }) => Promise<{ error?: unknown }>
    }
    message: {
      list: (args: { path: { id: string }; query?: { limit?: number } }) => Promise<{
        data?: Array<{ role: string; content?: Array<{ type: string; text?: string }> }>
      }>
    }
  }
  sessionID: string
  directory: string
}

// ============================================================================
// 阶段执行器
// ============================================================================

/**
 * 构建阶段的输入内容
 */
function buildPhasePrompt(
  phase: WorkflowPhase,
  context: WorkflowContext
): string {
  const parts: string[] = []
  
  // 添加原始任务
  parts.push(`## 原始任务\n\n${context.originalTask}`)
  
  // 添加来自前序阶段的输入
  if (phase.inputs) {
    parts.push(`\n## 输入数据\n`)
    
    for (const input of phase.inputs) {
      let value: unknown
      
      if (input.fromPhase && input.fromOutput) {
        value = context.phaseResults.get(input.fromPhase)?.outputs?.[input.fromOutput]
      } else if (context.globals[input.name] !== undefined) {
        value = context.globals[input.name]
      }
      
      if (value !== undefined) {
        parts.push(`\n### ${input.name}\n${input.description}`)
        parts.push(`\n\`\`\`\n${JSON.stringify(value, null, 2)}\n\`\`\``)
      } else if (input.required) {
        parts.push(`\n### ⚠️ ${input.name} (缺失)\n必需的输入数据未找到`)
      }
    }
  }
  
  // 添加阶段说明
  parts.push(`\n## 你的任务\n\n你正在执行工作流的"${phase.name}"阶段。`)
  parts.push(`\n${phase.description}`)
  
  // 添加输出要求
  if (phase.outputs) {
    parts.push(`\n\n## 输出要求\n\n请提供以下输出：`)
    for (const output of phase.outputs) {
      parts.push(`\n- **${output.name}**: ${output.description} (${output.type})`)
    }
  }
  
  return parts.join('\n')
}

/**
 * 解析阶段输出
 */
function parsePhaseOutput(responseText: string, phase: WorkflowPhase): Record<string, unknown> {
  const outputs: Record<string, unknown> = {}
  
  if (!phase.outputs) {
    outputs['response'] = responseText
    return outputs
  }
  
  // 尝试提取结构化输出
  for (const outputDef of phase.outputs) {
    const patterns = [
      // 尝试匹配 ```name ... ```
      new RegExp(`\`\`\`${outputDef.name}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i'),
      // 尝试匹配 ### name ... (下一个标题前)
      new RegExp(`### ${outputDef.name}\\s*\\n([\\s\\S]*?)(?=###|\n## |$)`, 'i'),
      // 尝试匹配 **name**: ...
      new RegExp(`\\*\\*${outputDef.name}\\*\\*:\\s*([\\s\\S]*?)(?=\\*\\*|$)`, 'i')
    ]
    
    for (const pattern of patterns) {
      const match = responseText.match(pattern)
      if (match) {
        let value: unknown = match[1].trim()
        
        // 如果是 JSON 类型，尝试解析
        if (outputDef.type === 'json') {
          try {
            value = JSON.parse(value as string)
          } catch {
            // 保持字符串
          }
        }
        
        outputs[outputDef.name] = value
        break
      }
    }
  }
  
  // 如果没有提取到任何输出，将整个响应作为默认输出
  if (Object.keys(outputs).length === 0) {
    outputs['response'] = responseText
  }
  
  return outputs
}

/**
 * 执行单个阶段
 */
async function executePhase(
  phase: WorkflowPhase,
  state: WorkflowState,
  ctx: WorkflowExecutionContext,
  config: UltraWorkSanguoConfig
): Promise<PhaseResult> {
  const startTime = new Date().toISOString()
  const logs: string[] = []
  
  logs.push(`[${startTime}] 开始执行阶段: ${phase.name}`)
  
  try {
    // 1. 构建阶段提示
    const prompt = buildPhasePrompt(phase, state.context)
    
    // 2. 获取将领配置
    const agents = config.agents ?? {}
    const agentConfig = agents[phase.agent] as AgentConfig | undefined
    const systemPrompt = agentConfig?.prompt_append ?? `你是${agentConfig?.description ?? phase.agent}。`
    
    // 3. 创建子会话
    const sessionResult = await ctx.client.session.create({
      body: {
        parentID: ctx.sessionID,
        title: `[${phase.agent}] ${phase.name}`
      },
      query: {
        directory: state.context.directory
      }
    })
    
    if (sessionResult.error) {
      throw new Error(`创建会话失败: ${sessionResult.error}`)
    }
    
    const childSessionId = sessionResult.data.id
    logs.push(`会话已创建: ${childSessionId}`)
    
    // 4. 发送提示
    const modelStr = agentConfig?.model ?? 'default'
    const modelParts = modelStr.split('/')
    
    await ctx.client.prompt.create({
      path: { id: childSessionId },
      body: {
        agent: 'Sisyphus',
        system: systemPrompt,
        parts: [{ type: 'text', text: prompt }],
        ...(modelParts.length >= 2 ? {
          model: {
            providerID: modelParts[0],
            modelID: modelParts.slice(1).join('/')
          }
        } : {})
      }
    })
    
    logs.push(`提示已发送，等待响应...`)
    
    // 5. 轮询等待完成
    const timeout = phase.timeout ?? 120000
    const startTime2 = Date.now()
    
    while (Date.now() - startTime2 < timeout) {
      const sessionStatus = await ctx.client.session.get({ path: { id: childSessionId } })
      
      if (sessionStatus.data?.status === 'completed' || sessionStatus.data?.busy === false) {
        break
      }
      
      await new Promise(r => setTimeout(r, 2000))
    }
    
    // 6. 获取结果
    const messages = await ctx.client.message.list({
      path: { id: childSessionId },
      query: { limit: 10 }
    })
    
    const assistantMessages = (messages.data ?? []).filter(m => m.role === 'assistant')
    const responseText = assistantMessages
      .flatMap(m => (m.content ?? []).filter(c => c.type === 'text').map(c => c.text ?? ''))
      .join('\n')
    
    // 7. 解析输出
    const outputs = parsePhaseOutput(responseText, phase)
    
    logs.push(`阶段完成`)
    
    return {
      phaseId: phase.id,
      status: 'completed',
      agent: phase.agent,
      startTime,
      endTime: new Date().toISOString(),
      outputs,
      logs,
      sessionId: childSessionId
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logs.push(`阶段失败: ${errorMsg}`)
    
    return {
      phaseId: phase.id,
      status: 'failed',
      agent: phase.agent,
      startTime,
      endTime: new Date().toISOString(),
      outputs: {},
      logs,
      error: errorMsg
    }
  }
}

// ============================================================================
// 工作流执行器
// ============================================================================

/**
 * 执行工作流
 */
export async function executeWorkflow(
  workflowDef: WorkflowDefinition,
  task: string,
  ctx: WorkflowExecutionContext,
  config: UltraWorkSanguoConfig
): Promise<WorkflowState> {
  // 1. 初始化状态
  let state = createWorkflowState(
    workflowDef.type,
    task,
    ctx.directory,
    ctx.sessionID,
    workflowDef.defaultMaxRetries
  )
  
  state = setWorkflowStatus(state, 'running', '工作流开始执行')
  
  console.log(formatWorkflowReport(state))
  
  // 2. 执行各个阶段
  for (let i = 0; i < workflowDef.phases.length; i++) {
    const phase = workflowDef.phases[i]
    
    state = updateWorkflowState(state, { currentPhaseIndex: i })
    state = addLogEntry(state, 'info', `开始执行阶段: ${phase.name}`, phase.id)
    
    // 检查是否可以跳过
    if (phase.optional && state.context.globals[`skip_${phase.id}`]) {
      state = updatePhaseResult(state, phase.id, {
        phaseId: phase.id,
        status: 'skipped',
        agent: phase.agent,
        startTime: new Date().toISOString(),
        outputs: {},
        logs: ['阶段被跳过']
      })
      continue
    }
    
    // 执行阶段
    let result = await executePhase(phase, state, ctx, config)
    
    // 处理失败
    if (result.status === 'failed') {
      const canRetryResult = canRetry(state)
      
      if (canRetryResult && phase.maxRetries && phase.maxRetries > 0) {
        state = incrementRetry(state)
        state = setWorkflowStatus(state, 'retrying', `阶段失败，准备重试 (${state.context.retryCount}/${state.context.maxRetries})`)
        
        // 重试执行
        result = await executePhase(phase, state, ctx, config)
      }
      
      if (result.status === 'failed') {
        // 检查是否可以跳过
        if (phase.skippable) {
          state = addLogEntry(state, 'warn', `阶段失败但可跳过: ${phase.name}`, phase.id)
          result.status = 'skipped'
        } else {
          state = updatePhaseResult(state, phase.id, result)
          state = setWorkflowStatus(state, 'failed', `工作流失败于阶段: ${phase.name}`)
          return state
        }
      }
    }
    
    state = updatePhaseResult(state, phase.id, result)
    state = addLogEntry(state, 'success', `阶段完成: ${phase.name}`, phase.id)
    
    console.log(formatWorkflowReport(state))
  }
  
  // 3. 验收阶段
  const validation = await validateWorkflow(state, workflowDef, ctx, config)
  
  if (validation === 'fail') {
    // 检查是否可以重试整个工作流
    if (canRetry(state) && workflowDef.failureRetryPhase) {
      state = setWorkflowStatus(state, 'retrying', '验收不通过，准备重新执行')
      state = incrementRetry(state)
      
      // 找到失败重试阶段的索引
      const retryIndex = workflowDef.phases.findIndex(p => p.id === workflowDef.failureRetryPhase)
      
      if (retryIndex >= 0) {
        // 递归执行（带重试计数）
        state = resetToPhase(state, retryIndex)
        return executeWorkflowFromPhase(workflowDef, state, retryIndex, ctx, config)
      }
    }
    
    state = setWorkflowStatus(state, 'failed', '验收不通过')
    return state
  }
  
  // 4. 完成
  state = setWorkflowStatus(state, 'completed', '工作流执行完成')
  
  console.log(formatWorkflowReport(state))
  
  return state
}

/**
 * 从指定阶段开始执行工作流（用于重试）
 */
async function executeWorkflowFromPhase(
  workflowDef: WorkflowDefinition,
  state: WorkflowState,
  startIndex: number,
  ctx: WorkflowExecutionContext,
  config: UltraWorkSanguoConfig
): Promise<WorkflowState> {
  state = setWorkflowStatus(state, 'running', '从失败阶段重新执行')
  
  for (let i = startIndex; i < workflowDef.phases.length; i++) {
    const phase = workflowDef.phases[i]
    
    state = updateWorkflowState(state, { currentPhaseIndex: i })
    
    const result = await executePhase(phase, state, ctx, config)
    state = updatePhaseResult(state, phase.id, result)
    
    if (result.status === 'failed') {
      if (canRetry(state)) {
        state = incrementRetry(state)
        return executeWorkflowFromPhase(workflowDef, state, i, ctx, config)
      }
      
      state = setWorkflowStatus(state, 'failed', `工作流失败于阶段: ${phase.name}`)
      return state
    }
  }
  
  // 再次验收
  const validation = await validateWorkflow(state, workflowDef, ctx, config)
  
  if (validation === 'fail' && canRetry(state)) {
    state = incrementRetry(state)
    return executeWorkflowFromPhase(workflowDef, state, startIndex, ctx, config)
  }
  
  state = setWorkflowStatus(
    state,
    validation === 'pass' ? 'completed' : 'failed',
    validation === 'pass' ? '工作流执行完成' : '验收不通过'
  )
  
  return state
}

/**
 * 验收工作流结果
 */
async function validateWorkflow(
  state: WorkflowState,
  workflowDef: WorkflowDefinition,
  ctx: WorkflowExecutionContext,
  config: UltraWorkSanguoConfig
): Promise<ValidationResult> {
  // 检查所有必需阶段是否完成
  for (const phase of workflowDef.phases) {
    if (phase.optional) continue
    
    const result = state.context.phaseResults.get(phase.id)
    if (!result || result.status !== 'completed') {
      state.context.validationHistory.push('fail')
      return 'fail'
    }
  }
  
  // 如果有测试阶段，检查测试结果
  const testResult = state.context.phaseResults.get('test')
  if (testResult?.outputs?.testResults) {
    const testResults = testResult.outputs.testResults as { passed?: number; failed?: number }
    if (testResults.failed && testResults.failed > 0) {
      state.context.validationHistory.push('fail')
      return 'fail'
    }
  }
  
  // 如果有审查阶段，检查是否通过
  const reviewResult = state.context.phaseResults.get('review')
  if (reviewResult?.outputs?.approved === false) {
    state.context.validationHistory.push('fail')
    return 'fail'
  }
  
  state.context.validationHistory.push('pass')
  return 'pass'
}

/**
 * 恢复工作流执行
 */
export async function resumeWorkflow(
  workflowId: string,
  ctx: WorkflowExecutionContext,
  config: UltraWorkSanguoConfig
): Promise<WorkflowState | null> {
  const state = loadWorkflowState(workflowId)
  
  if (!state) {
    return null
  }
  
  // 获取工作流定义
  const { getWorkflowDefinition } = await import('./types')
  const workflowDef = getWorkflowDefinition(state.workflowType)
  
  if (!workflowDef) {
    return null
  }
  
  // 从当前阶段继续执行
  return executeWorkflowFromPhase(
    workflowDef,
    state,
    state.currentPhaseIndex,
    ctx,
    config
  )
}

/**
 * 获取工作流最终报告
 */
export function getFinalReport(state: WorkflowState): string {
  const lines: string[] = [
    `# 🏰 UltraWork 工作流执行报告`,
    ``,
    `## 基本信息`,
    `- **工作流ID**: ${state.workflowId}`,
    `- **类型**: ${state.workflowType}`,
    `- **状态**: ${state.status}`,
    `- **执行时间**: ${state.startTime} ~ ${state.endTime ?? '进行中'}`,
    `- **重试次数**: ${state.context.retryCount}/${state.context.maxRetries}`,
    ``,
    `## 原始任务`,
    ``,
    `${state.context.originalTask}`,
    ``,
    `## 阶段执行详情`
  ]
  
  for (const [phaseId, result] of state.context.phaseResults) {
    lines.push(`\n### ${phaseId}`)
    lines.push(`- **状态**: ${result.status}`)
    lines.push(`- **将领**: ${result.agent}`)
    lines.push(`- **时间**: ${result.startTime} ~ ${result.endTime ?? '进行中'}`)
    
    if (Object.keys(result.outputs).length > 0) {
      lines.push(`\n**输出:**`)
      for (const [key, value] of Object.entries(result.outputs)) {
        lines.push(`\n- **${key}**: ${typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100)}...`)
      }
    }
    
    if (result.error) {
      lines.push(`\n**错误**: ${result.error}`)
    }
  }
  
  lines.push(`\n---`)
  lines.push(`\n*鞠躬尽瘁，死而后已 - UltraWork 三国军团*`)
  
  return lines.join('\n')
}