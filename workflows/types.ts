/**
 * UltraWork SanGuo - Workflow Type Definitions
 * 
 * 工作流类型定义 - 定义工作流的基本结构、阶段、状态流转
 */

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 工作流阶段状态
 */
export type PhaseStatus = 
  | 'pending'      // 等待执行
  | 'running'      // 执行中
  | 'completed'    // 已完成
  | 'failed'       // 失败
  | 'skipped'      // 跳过

/**
 * 工作流整体状态
 */
export type WorkflowStatus = 
  | 'initialized'  // 初始化
  | 'running'      // 运行中
  | 'paused'       // 暂停
  | 'completed'    // 完成
  | 'failed'       // 失败
  | 'retrying'     // 重试中

/**
 * 验收结果
 */
export type ValidationResult = 
  | 'pass'         // 通过
  | 'fail'         // 不通过
  | 'warning'      // 警告但可通过

// ============================================================================
// 阶段定义
// ============================================================================

/**
 * 工作流阶段定义
 */
export interface WorkflowPhase {
  /** 阶段ID */
  id: string
  /** 阶段名称 */
  name: string
  /** 阶段描述 */
  description: string
  /** 负责的将领 */
  agent: string
  /** 可选的副将 */
  supportAgents?: string[]
  /** 该阶段是否可选 */
  optional?: boolean
  /** 失败时是否可以跳过 */
  skippable?: boolean
  /** 阶段输入定义 */
  inputs?: PhaseInput[]
  /** 阶段输出定义 */
  outputs?: PhaseOutput[]
  /** 超时时间(ms) */
  timeout?: number
  /** 重试次数 */
  maxRetries?: number
}

/**
 * 阶段输入定义
 */
export interface PhaseInput {
  name: string
  description: string
  required: boolean
  /** 从哪个阶段的输出获取 */
  fromPhase?: string
  fromOutput?: string
}

/**
 * 阶段输出定义
 */
export interface PhaseOutput {
  name: string
  description: string
  type: 'text' | 'json' | 'code' | 'report'
}

// ============================================================================
// 状态与上下文
// ============================================================================

/**
 * 阶段执行结果
 */
export interface PhaseResult {
  phaseId: string
  status: PhaseStatus
  agent: string
  startTime: string
  endTime?: string
  /** 输出内容 */
  outputs: Record<string, unknown>
  /** 执行日志 */
  logs: string[]
  /** 错误信息 */
  error?: string
  /** 会话ID（用于追踪） */
  sessionId?: string
}

/**
 * 工作流上下文 - 在阶段间传递
 */
export interface WorkflowContext {
  /** 原始任务描述 */
  originalTask: string
  /** 任务类别 */
  category?: string
  /** 项目目录 */
  directory: string
  /** 父会话ID */
  parentSessionId: string
  /** 当前重试次数 */
  retryCount: number
  /** 最大重试次数 */
  maxRetries: number
  /** 阶段结果记录 */
  phaseResults: Map<string, PhaseResult>
  /** 全局变量（阶段间共享） */
  globals: Record<string, unknown>
  /** 验收历史 */
  validationHistory: ValidationResult[]
}

/**
 * 工作流执行状态
 */
export interface WorkflowState {
  /** 工作流ID */
  workflowId: string
  /** 工作流类型 */
  workflowType: string
  /** 当前状态 */
  status: WorkflowStatus
  /** 当前阶段索引 */
  currentPhaseIndex: number
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime?: string
  /** 上下文 */
  context: WorkflowContext
  /** 执行日志 */
  logs: WorkflowLogEntry[]
}

/**
 * 工作流日志条目
 */
export interface WorkflowLogEntry {
  timestamp: string
  phase?: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  details?: unknown
}

// ============================================================================
// 工作流定义
// ============================================================================

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  /** 工作流类型ID */
  type: string
  /** 工作流名称 */
  name: string
  /** 描述 */
  description: string
  /** 触发关键词 */
  keywords: string[]
  /** 阶段列表 */
  phases: WorkflowPhase[]
  /** 验收阶段（通常是最后一个阶段） */
  validationPhase?: string
  /** 失败时回退到的阶段 */
  failureRetryPhase?: string
  /** 默认最大重试次数 */
  defaultMaxRetries: number
  /** 总超时时间(ms) */
  totalTimeout?: number
  /** 是否支持并行阶段 */
  supportsParallel?: boolean
}

// ============================================================================
// 预定义工作流类型
// ============================================================================

/**
 * Bug修复工作流
 */
export const BUGFIX_WORKFLOW: WorkflowDefinition = {
  type: 'bugfix-workflow',
  name: 'Bug修复工作流',
  description: '完整的Bug修复流程：分析→规划→修复→审查→测试→监控→验收',
  keywords: ['bug', '修复', 'fix', '问题', '错误', '报错', '异常'],
  phases: [
    {
      id: 'analysis',
      name: '问题分析',
      description: '深度分析Bug根因，定位问题代码',
      agent: 'simayi',
      supportAgents: ['simashi'],
      inputs: [
        { name: 'task', description: '任务描述', required: true }
      ],
      outputs: [
        { name: 'analysisReport', description: '分析报告', type: 'report' },
        { name: 'affectedFiles', description: '受影响的文件列表', type: 'json' },
        { name: 'rootCause', description: '根本原因', type: 'text' }
      ],
      timeout: 120000,
      maxRetries: 1
    },
    {
      id: 'planning',
      name: '修复规划',
      description: '制定修复方案和实施计划',
      agent: 'zhouyu',
      supportAgents: ['lusu', 'huanggai'],
      inputs: [
        { name: 'analysisReport', description: '分析报告', required: true, fromPhase: 'analysis', fromOutput: 'analysisReport' },
        { name: 'affectedFiles', description: '受影响文件', required: true, fromPhase: 'analysis', fromOutput: 'affectedFiles' }
      ],
      outputs: [
        { name: 'fixPlan', description: '修复计划', type: 'report' },
        { name: 'implementationSteps', description: '实施步骤', type: 'json' }
      ],
      timeout: 90000,
      maxRetries: 1
    },
    {
      id: 'fix',
      name: '代码修复',
      description: '执行代码修复',
      agent: 'zhangfei',
      supportAgents: ['leixu', 'wulan'],
      inputs: [
        { name: 'fixPlan', description: '修复计划', required: true, fromPhase: 'planning', fromOutput: 'fixPlan' },
        { name: 'implementationSteps', description: '实施步骤', required: true, fromPhase: 'planning', fromOutput: 'implementationSteps' }
      ],
      outputs: [
        { name: 'codeChanges', description: '代码变更', type: 'code' },
        { name: 'changedFiles', description: '变更的文件', type: 'json' }
      ],
      timeout: 180000,
      maxRetries: 2
    },
    {
      id: 'review',
      name: '代码审查',
      description: '审查修复代码的质量和安全性',
      agent: 'guanyu',
      supportAgents: ['guanping', 'zhoucang'],
      inputs: [
        { name: 'codeChanges', description: '代码变更', required: true, fromPhase: 'fix', fromOutput: 'codeChanges' }
      ],
      outputs: [
        { name: 'reviewReport', description: '审查报告', type: 'report' },
        { name: 'issues', description: '发现的问题', type: 'json' },
        { name: 'approved', description: '是否通过', type: 'json' }
      ],
      timeout: 90000,
      maxRetries: 1
    },
    {
      id: 'test',
      name: '测试验证',
      description: '运行测试确保修复有效',
      agent: 'xushu',
      supportAgents: ['panglin', 'yanyan', 'liuye'],
      inputs: [
        { name: 'changedFiles', description: '变更的文件', required: true, fromPhase: 'fix', fromOutput: 'changedFiles' }
      ],
      outputs: [
        { name: 'testReport', description: '测试报告', type: 'report' },
        { name: 'testResults', description: '测试结果', type: 'json' },
        { name: 'coverage', description: '覆盖率', type: 'json' }
      ],
      timeout: 180000,
      maxRetries: 1
    },
    {
      id: 'monitor',
      name: '监控检查',
      description: '检查修复后的日志和监控',
      agent: 'manchong',
      supportAgents: ['chengyu', 'jiaxu'],
      inputs: [
        { name: 'changedFiles', description: '变更的文件', required: true, fromPhase: 'fix', fromOutput: 'changedFiles' }
      ],
      outputs: [
        { name: 'monitorReport', description: '监控报告', type: 'report' },
        { name: 'errors', description: '发现的错误', type: 'json' }
      ],
      timeout: 60000,
      maxRetries: 1,
      optional: true
    }
  ],
  validationPhase: 'validation',
  failureRetryPhase: 'fix',
  defaultMaxRetries: 3
}

/**
 * 新功能开发工作流
 */
export const FEATURE_WORKFLOW: WorkflowDefinition = {
  type: 'feature-workflow',
  name: '新功能开发工作流',
  description: '完整的功能开发流程：需求分析→架构设计→前端开发→后端开发→审查→测试→验收',
  keywords: ['功能', 'feature', '开发', '实现', '新增', '添加'],
  phases: [
    {
      id: 'requirement',
      name: '需求分析',
      description: '访谈式需求澄清和分析',
      agent: 'zhouyu',
      supportAgents: ['lusu'],
      outputs: [
        { name: 'requirements', description: '需求文档', type: 'report' },
        { name: 'acceptance', description: '验收标准', type: 'json' }
      ],
      timeout: 120000
    },
    {
      id: 'architecture',
      name: '架构设计',
      description: '设计技术方案和架构',
      agent: 'zhouyu',
      supportAgents: ['huanggai', 'lusu'],
      inputs: [
        { name: 'requirements', description: '需求文档', required: true, fromPhase: 'requirement', fromOutput: 'requirements' }
      ],
      outputs: [
        { name: 'designDoc', description: '设计文档', type: 'report' },
        { name: 'apiSpec', description: 'API规范', type: 'json' },
        { name: 'dataModel', description: '数据模型', type: 'json' }
      ],
      timeout: 150000
    },
    {
      id: 'frontend',
      name: '前端开发',
      description: '实现前端界面和交互',
      agent: 'zhaoyun',
      supportAgents: ['gaoshun'],
      inputs: [
        { name: 'designDoc', description: '设计文档', required: true, fromPhase: 'architecture', fromOutput: 'designDoc' },
        { name: 'apiSpec', description: 'API规范', required: true, fromPhase: 'architecture', fromOutput: 'apiSpec' }
      ],
      outputs: [
        { name: 'frontendCode', description: '前端代码', type: 'code' },
        { name: 'frontendFiles', description: '前端文件列表', type: 'json' }
      ],
      timeout: 300000
    },
    {
      id: 'backend',
      name: '后端开发',
      description: '实现后端接口和逻辑',
      agent: 'zhaoyun',
      supportAgents: ['chendao'],
      inputs: [
        { name: 'designDoc', description: '设计文档', required: true, fromPhase: 'architecture', fromOutput: 'designDoc' },
        { name: 'apiSpec', description: 'API规范', required: true, fromPhase: 'architecture', fromOutput: 'apiSpec' },
        { name: 'dataModel', description: '数据模型', required: true, fromPhase: 'architecture', fromOutput: 'dataModel' }
      ],
      outputs: [
        { name: 'backendCode', description: '后端代码', type: 'code' },
        { name: 'backendFiles', description: '后端文件列表', type: 'json' }
      ],
      timeout: 300000
    },
    {
      id: 'review',
      name: '代码审查',
      description: '审查所有代码变更',
      agent: 'guanyu',
      supportAgents: ['guanping', 'zhoucang'],
      inputs: [
        { name: 'frontendFiles', description: '前端文件', required: true, fromPhase: 'frontend', fromOutput: 'frontendFiles' },
        { name: 'backendFiles', description: '后端文件', required: true, fromPhase: 'backend', fromOutput: 'backendFiles' }
      ],
      outputs: [
        { name: 'reviewReport', description: '审查报告', type: 'report' }
      ],
      timeout: 120000
    },
    {
      id: 'test',
      name: '测试验证',
      description: '运行完整测试',
      agent: 'xushu',
      supportAgents: ['panglin', 'yanyan', 'liuye'],
      outputs: [
        { name: 'testReport', description: '测试报告', type: 'report' }
      ],
      timeout: 180000
    }
  ],
  failureRetryPhase: 'frontend',
  defaultMaxRetries: 2
}

/**
 * 代码重构工作流
 */
export const REFACTOR_WORKFLOW: WorkflowDefinition = {
  type: 'refactor-workflow',
  name: '重构工作流',
  description: '安全的代码重构流程：分析→规划→重构→审查→测试',
  keywords: ['重构', 'refactor', '优化', '改进', '重写'],
  phases: [
    {
      id: 'analysis',
      name: '代码分析',
      description: '分析现有代码结构和依赖关系',
      agent: 'simayi',
      supportAgents: ['simashi'],
      outputs: [
        { name: 'codeStructure', description: '代码结构', type: 'json' },
        { name: 'dependencies', description: '依赖关系', type: 'json' },
        { name: 'smells', description: '代码异味', type: 'json' }
      ],
      timeout: 120000
    },
    {
      id: 'planning',
      name: '重构规划',
      description: '制定重构策略和步骤',
      agent: 'zhouyu',
      supportAgents: ['huanggai'],
      inputs: [
        { name: 'codeStructure', description: '代码结构', required: true, fromPhase: 'analysis', fromOutput: 'codeStructure' },
        { name: 'smells', description: '代码异味', required: true, fromPhase: 'analysis', fromOutput: 'smells' }
      ],
      outputs: [
        { name: 'refactorPlan', description: '重构计划', type: 'report' },
        { name: 'steps', description: '重构步骤', type: 'json' }
      ],
      timeout: 90000
    },
    {
      id: 'refactor',
      name: '执行重构',
      description: '按计划执行重构',
      agent: 'zhaoyun',
      supportAgents: ['gaoshun', 'chendao'],
      inputs: [
        { name: 'refactorPlan', description: '重构计划', required: true, fromPhase: 'planning', fromOutput: 'refactorPlan' }
      ],
      outputs: [
        { name: 'changes', description: '变更内容', type: 'code' },
        { name: 'changedFiles', description: '变更文件', type: 'json' }
      ],
      timeout: 240000
    },
    {
      id: 'review',
      name: '代码审查',
      description: '审查重构后的代码',
      agent: 'guanyu',
      supportAgents: ['guanping'],
      outputs: [
        { name: 'reviewReport', description: '审查报告', type: 'report' }
      ],
      timeout: 90000
    },
    {
      id: 'test',
      name: '回归测试',
      description: '确保重构未破坏功能',
      agent: 'xushu',
      supportAgents: ['panglin', 'yanyan'],
      outputs: [
        { name: 'testReport', description: '测试报告', type: 'report' }
      ],
      timeout: 180000
    }
  ],
  failureRetryPhase: 'refactor',
  defaultMaxRetries: 2
}

/**
 * 代码审查工作流
 */
export const REVIEW_WORKFLOW: WorkflowDefinition = {
  type: 'review-workflow',
  name: '代码审查工作流',
  description: '全面的代码审查流程：静态分析→安全检查→质量评估→报告生成',
  keywords: ['审查', 'review', '检查', '质量', '安全'],
  phases: [
    {
      id: 'static-analysis',
      name: '静态分析',
      description: '分析代码结构和复杂度',
      agent: 'simayi',
      supportAgents: ['simashi'],
      outputs: [
        { name: 'metrics', description: '代码指标', type: 'json' },
        { name: 'complexity', description: '复杂度分析', type: 'json' }
      ],
      timeout: 60000
    },
    {
      id: 'security-check',
      name: '安全检查',
      description: '检查安全漏洞和风险',
      agent: 'guanyu',
      supportAgents: ['zhoucang'],
      outputs: [
        { name: 'vulnerabilities', description: '安全漏洞', type: 'json' },
        { name: 'risks', description: '风险项', type: 'json' }
      ],
      timeout: 90000
    },
    {
      id: 'quality-review',
      name: '质量评估',
      description: '评估代码质量和最佳实践',
      agent: 'guanyu',
      supportAgents: ['guanping'],
      outputs: [
        { name: 'qualityReport', description: '质量报告', type: 'report' },
        { name: 'suggestions', description: '改进建议', type: 'json' }
      ],
      timeout: 90000
    },
    {
      id: 'report',
      name: '报告生成',
      description: '生成综合审查报告',
      agent: 'simazhao',
      inputs: [
        { name: 'metrics', description: '代码指标', required: true, fromPhase: 'static-analysis', fromOutput: 'metrics' },
        { name: 'vulnerabilities', description: '安全漏洞', required: true, fromPhase: 'security-check', fromOutput: 'vulnerabilities' },
        { name: 'qualityReport', description: '质量报告', required: true, fromPhase: 'quality-review', fromOutput: 'qualityReport' }
      ],
      outputs: [
        { name: 'finalReport', description: '最终报告', type: 'report' }
      ],
      timeout: 60000
    }
  ],
  defaultMaxRetries: 1
}

/**
 * 监控诊断工作流
 */
export const MONITOR_WORKFLOW: WorkflowDefinition = {
  type: 'monitor-workflow',
  name: '监控诊断工作流',
  description: '系统监控和问题诊断流程',
  keywords: ['监控', '日志', '诊断', '异常', '错误', 'log', 'monitor'],
  phases: [
    {
      id: 'frontend-monitor',
      name: '前端监控',
      description: '收集和分析前端日志',
      agent: 'chengyu',
      outputs: [
        { name: 'consoleLogs', description: '控制台日志', type: 'json' },
        { name: 'networkErrors', description: '网络错误', type: 'json' },
        { name: 'jsErrors', description: 'JS错误', type: 'json' }
      ],
      timeout: 60000
    },
    {
      id: 'backend-monitor',
      name: '后端监控',
      description: '收集和分析后端日志',
      agent: 'jiaxu',
      outputs: [
        { name: 'apiErrors', description: 'API错误', type: 'json' },
        { name: 'slowQueries', description: '慢查询', type: 'json' },
        { name: 'systemMetrics', description: '系统指标', type: 'json' }
      ],
      timeout: 60000
    },
    {
      id: 'diagnosis',
      name: '综合诊断',
      description: '汇总分析所有监控数据',
      agent: 'manchong',
      inputs: [
        { name: 'consoleLogs', description: '控制台日志', required: true, fromPhase: 'frontend-monitor', fromOutput: 'consoleLogs' },
        { name: 'apiErrors', description: 'API错误', required: true, fromPhase: 'backend-monitor', fromOutput: 'apiErrors' }
      ],
      outputs: [
        { name: 'diagnosisReport', description: '诊断报告', type: 'report' },
        { name: 'recommendations', description: '修复建议', type: 'json' }
      ],
      timeout: 90000
    }
  ],
  supportsParallel: true,
  defaultMaxRetries: 1
}

// 所有预定义工作流
export const WORKFLOW_DEFINITIONS: Record<string, WorkflowDefinition> = {
  'bugfix-workflow': BUGFIX_WORKFLOW,
  'feature-workflow': FEATURE_WORKFLOW,
  'refactor-workflow': REFACTOR_WORKFLOW,
  'review-workflow': REVIEW_WORKFLOW,
  'monitor-workflow': MONITOR_WORKFLOW
}

/**
 * 根据任务描述检测工作流类型
 */
export function detectWorkflowType(taskDescription: string): string | null {
  const lowerTask = taskDescription.toLowerCase()
  
  for (const [type, workflow] of Object.entries(WORKFLOW_DEFINITIONS)) {
    for (const keyword of workflow.keywords) {
      if (lowerTask.includes(keyword.toLowerCase())) {
        return type
      }
    }
  }
  
  return null
}

/**
 * 获取工作流定义
 */
export function getWorkflowDefinition(type: string): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS[type]
}