/**
 * Dispatcher - 调度器核心
 * 负责任务分配和执行协调
 */

const IntentGate = require('./intent-gate');
const ModelRouter = require('./model-router');
const TaskQueue = require('./task-queue');

const Dispatcher = {
  config: null,

  /**
   * 初始化调度器
   * @param {object} config - 配置对象
   */
  init(config) {
    this.config = config;
    TaskQueue.init(config);
  },

  /**
   * 处理用户请求
   * @param {string} request - 用户请求
   * @param {object} context - 上下文
   * @returns {object} - 执行结果
   */
  async process(request, context = {}) {
    console.log(`[Sisyphus] 收到请求: ${request}`);

    // 1. 意图分析
    const intent = IntentGate.analyze(request, context);
    console.log(`[Sisyphus] 意图分析完成:`, intent.category.name);

    // 2. 检查是否需要澄清
    if (intent.confidence < this.config.intentGate.clarificationThreshold) {
      if (this.config.intentGate.askForClarification) {
        return {
          status: 'clarification_needed',
          questions: intent.questions,
          intent: intent
        };
      }
    }

    // 3. 选择模型
    const model = ModelRouter.select(intent.category.name, this.config);
    console.log(`[Sisyphus] 选择模型: ${model}`);

    // 4. 分配任务给专家
    const assignments = this._assignAgents(intent, context);
    console.log(`[Sisyphus] 分配任务:`, assignments.map(a => a.agent));

    // 5. 执行任务
    const results = await this._execute(assignments, model);

    // 6. 汇总结果
    return this._aggregateResults(results, intent);
  },

  /**
   * 分配 Agent
   */
  _assignAgents(intent, context) {
    const assignments = [];
    const category = intent.category.name;

    // 根据类别分配主要执行者
    switch (category) {
      case 'visual-engineering':
        assignments.push({
          agent: 'hephaestus',
          task: '实现前端功能',
          priority: 1
        });
        assignments.push({
          agent: 'explorer',
          task: '搜索现有组件和模式',
          priority: 2
        });
        break;

      case 'deep':
        assignments.push({
          agent: 'hephaestus',
          task: '深度执行任务',
          priority: 1
        });
        assignments.push({
          agent: 'explorer',
          task: '探索代码库',
          priority: 2
        });
        break;

      case 'quick':
        assignments.push({
          agent: 'hephaestus',
          task: '快速修复',
          priority: 1
        });
        break;

      case 'ultrabrain':
        assignments.push({
          agent: 'prometheus',
          task: '战略规划',
          priority: 1
        });
        break;

      default:
        assignments.push({
          agent: 'hephaestus',
          task: '执行任务',
          priority: 1
        });
    }

    return assignments;
  },

  /**
   * 执行任务
   */
  async _execute(assignments, model) {
    const results = [];
    const maxConcurrent = this.config.parallelExecution.maxConcurrentAgents;

    // 按优先级分组
    const prioritized = this._groupByPriority(assignments);

    for (const [priority, tasks] of Object.entries(prioritized)) {
      // 同优先级任务并行执行
      const batch = tasks.slice(0, maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(task => this._executeAgent(task, model))
      );
      results.push(...batchResults);
    }

    return results;
  },

  /**
   * 执行单个 Agent
   */
  async _executeAgent(assignment, model) {
    return {
      agent: assignment.agent,
      task: assignment.task,
      model: model,
      status: 'completed',
      result: `Agent ${assignment.agent} 完成了任务: ${assignment.task}`,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 按优先级分组
   */
  _groupByPriority(assignments) {
    return assignments.reduce((groups, assignment) => {
      const priority = assignment.priority;
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(assignment);
      return groups;
    }, {});
  },

  /**
   * 汇总结果
   */
  _aggregateResults(results, intent) {
    return {
      status: 'completed',
      intent: intent.interpretedIntent,
      category: intent.category.name,
      model: results[0]?.model || 'glm-5',
      agentResults: results,
      summary: this._generateSummary(results),
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 生成摘要
   */
  _generateSummary(results) {
    const successful = results.filter(r => r.status === 'completed').length;
    return `${results.length} 个 Agent 执行任务，${successful} 个成功完成`;
  }
};

module.exports = Dispatcher;