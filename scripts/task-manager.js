/**
 * TaskManager - 任务管理器
 * 支持子任务拆分、并行执行状态、任务队列显示
 * 
 * 参考: oh-my-openagent TaskToastManager
 */

const path = require('path');

// TTY 检测
const isTTY = process.stdin.isTTY && process.stdout.isTTY;

// 尝试加载依赖
let p = null;
let color = null;

const loadDependencies = () => {
  const possiblePaths = [
    path.join(__dirname, '..', 'node_modules'),
    path.join(__dirname, '..', '..', '..', '..', 'node_modules'),
    'D:\\his\\node_modules',
    require.resolve.paths('@clack/prompts')?.[0],
  ].filter(Boolean);

  for (const nodeModulesPath of possiblePaths) {
    try {
      const clackPath = path.join(nodeModulesPath, '@clack', 'prompts');
      const picocolorsPath = path.join(nodeModulesPath, 'picocolors');
      
      p = require(clackPath);
      color = require(picocolorsPath);
      
      if (p && color) return true;
    } catch (e) {}
  }
  return false;
};

const depsLoaded = loadDependencies();

// ============================================================================
// 类型定义
// ============================================================================

/**
 * @typedef {'running' | 'queued' | 'completed' | 'error'} TaskStatus
 */

/**
 * @typedef {'primary' | 'support' | 'subtask'} TaskType
 */

/**
 * @typedef {Object} SubTask
 * @property {string} id - 任务ID
 * @property {string} description - 任务描述
 * @property {string} agent - 执行将领
 * @property {string} agentAlias - 将领字号
 * @property {TaskStatus} status - 任务状态
 * @property {TaskType} type - 任务类型
 * @property {Date} startedAt - 开始时间
 * @property {Date} completedAt - 完成时间
 * @property {string} model - 使用的模型
 * @property {string} category - 任务类别
 * @property {string} parentId - 父任务ID
 */

/**
 * @typedef {Object} Task
 * @property {string} id - 任务ID
 * @property {string} description - 任务描述
 * @property {TaskStatus} status - 任务状态
 * @property {Date} startedAt - 开始时间
 * @property {Date} completedAt - 完成时间
 * @property {SubTask[]} subTasks - 子任务列表
 * @property {number} progress - 进度百分比
 * @property {string} primaryAgent - 主将
 * @property {string[]} supportAgents - 副将
 */

// ============================================================================
// TaskManager 类
// ============================================================================

class TaskManager {
  constructor() {
    /** @type {Map<string, Task>} */
    this.tasks = new Map();
    
    /** @type {Map<string, SubTask>} */
    this.subTasks = new Map();
    
    /** @type {number} */
    this.maxConcurrent = 5;
    
    this.useClack = isTTY && p !== null;
  }

  /**
   * 创建新任务
   * @param {Object} options
   * @returns {Task}
   */
  createTask({ id, description, primaryAgent, supportAgents = [] }) {
    const task = {
      id: id || `task-${Date.now()}`,
      description,
      status: 'running',
      startedAt: new Date(),
      completedAt: null,
      subTasks: [],
      progress: 0,
      primaryAgent,
      supportAgents,
    };
    
    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * 添加子任务
   * @param {Object} options
   * @returns {SubTask}
   */
  addSubTask({ 
    id, 
    parentId, 
    description, 
    agent, 
    agentAlias, 
    type = 'subtask',
    category = '',
    model = ''
  }) {
    const subTask = {
      id: id || `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      parentId,
      description,
      agent,
      agentAlias,
      status: 'queued',
      type,
      startedAt: null,
      completedAt: null,
      category,
      model,
    };
    
    this.subTasks.set(subTask.id, subTask);
    
    // 添加到父任务的子任务列表
    const parentTask = this.tasks.get(parentId);
    if (parentTask) {
      parentTask.subTasks.push(subTask);
    }
    
    return subTask;
  }

  /**
   * 启动子任务
   * @param {string} subTaskId
   */
  startSubTask(subTaskId) {
    const subTask = this.subTasks.get(subTaskId);
    if (subTask) {
      subTask.status = 'running';
      subTask.startedAt = new Date();
      this._updateParentProgress(subTask.parentId);
    }
    return this;
  }

  /**
   * 完成子任务
   * @param {string} subTaskId
   * @param {boolean} success
   */
  completeSubTask(subTaskId, success = true) {
    const subTask = this.subTasks.get(subTaskId);
    if (subTask) {
      subTask.status = success ? 'completed' : 'error';
      subTask.completedAt = new Date();
      this._updateParentProgress(subTask.parentId);
    }
    return this;
  }

  /**
   * 更新父任务进度
   * @param {string} parentId
   */
  _updateParentProgress(parentId) {
    const task = this.tasks.get(parentId);
    if (!task) return;
    
    const total = task.subTasks.length;
    if (total === 0) return;
    
    const completed = task.subTasks.filter(st => st.status === 'completed').length;
    const running = task.subTasks.filter(st => st.status === 'running').length;
    
    task.progress = Math.round((completed / total) * 100);
    
    // 检查是否全部完成
    if (completed === total) {
      task.status = 'completed';
      task.completedAt = new Date();
    }
  }

  /**
   * 获取运行中的子任务
   * @returns {SubTask[]}
   */
  getRunningSubTasks() {
    return Array.from(this.subTasks.values())
      .filter(st => st.status === 'running')
      .sort((a, b) => (a.startedAt?.getTime() || 0) - (b.startedAt?.getTime() || 0));
  }

  /**
   * 获取排队的子任务
   * @returns {SubTask[]}
   */
  getQueuedSubTasks() {
    return Array.from(this.subTasks.values())
      .filter(st => st.status === 'queued')
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * 获取并发信息
   * @returns {string}
   */
  getConcurrencyInfo() {
    const running = this.getRunningSubTasks().length;
    const queued = this.getQueuedSubTasks().length;
    const limit = this.maxConcurrent;
    
    if (limit === Infinity) return '';
    return ` [${running}/${limit}]`;
  }

  /**
   * 格式化持续时间
   * @param {Date} startedAt
   * @returns {string}
   */
  formatDuration(startedAt) {
    if (!startedAt) return '-';
    const seconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  /**
   * 构建任务列表消息
   * @param {Task} task
   * @returns {string}
   */
  buildTaskListMessage(task) {
    const running = this.getRunningSubTasks();
    const queued = this.getQueuedSubTasks();
    const concurrencyInfo = this.getConcurrencyInfo();
    
    const lines = [];
    
    // 任务标题
    lines.push(`📋 ${task.description}`);
    lines.push(`主将: ${task.primaryAgent} | 副将: ${task.supportAgents.join(', ') || '无'}`);
    lines.push('');
    
    // 进度条
    const filled = Math.round(task.progress / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    lines.push(`进度: ${bar} ${task.progress}%`);
    lines.push('');
    
    // 运行中的子任务
    if (running.length > 0) {
      lines.push(`🔄 运行中 (${running.length})${concurrencyInfo}:`);
      for (const st of running) {
        const typeIcon = st.type === 'primary' ? '[主]' : 
                         st.type === 'support' ? '[副]' : '[子]';
        const duration = this.formatDuration(st.startedAt);
        const categoryInfo = st.category ? `/${st.category}` : '';
        lines.push(`  ${typeIcon} ${st.description} (${st.agent}${categoryInfo}) - ${duration}`);
      }
    }
    
    // 排队中的子任务
    if (queued.length > 0) {
      if (lines.length > 0) lines.push('');
      lines.push(`⏳ 排队中 (${queued.length}):`);
      for (const st of queued) {
        const typeIcon = st.type === 'primary' ? '[主]' : 
                         st.type === 'support' ? '[副]' : '[子]';
        const categoryInfo = st.category ? `/${st.category}` : '';
        lines.push(`  ${typeIcon} ${st.description} (${st.agent}${categoryInfo})`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * 渲染任务面板
   * @param {string} taskId
   */
  renderTaskPanel(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return '';
    
    if (!this.useClack) {
      return this._renderAnsiPanel(task);
    }
    
    // 使用 @clack/prompts
    const message = this.buildTaskListMessage(task);
    p.note(message, '🏰 UltraWork 三国军团');
  }

  /**
   * ANSI 面板渲染
   * @param {Task} task
   * @returns {string}
   */
  _renderAnsiPanel(task) {
    const lines = [];
    const w = 60;
    
    lines.push('┌' + '─'.repeat(w - 2) + '┐');
    lines.push('│ 🏰 UltraWork 三国军团' + ' '.repeat(w - 24) + '│');
    lines.push('├' + '─'.repeat(w - 2) + '┤');
    
    // 任务描述
    const desc = task.description.slice(0, w - 6);
    lines.push('│ 📋 ' + desc.padEnd(w - 6) + '│');
    
    // 主将/副将
    const agents = `主将: ${task.primaryAgent} | 副将: ${task.supportAgents.join(', ') || '无'}`;
    lines.push('│ ' + agents.slice(0, w - 4).padEnd(w - 4) + '│');
    
    // 进度条
    const filled = Math.round(task.progress / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    lines.push('│ 进度: ' + `${bar} ${task.progress}%`.padEnd(w - 8) + '│');
    
    lines.push('├' + '─'.repeat(w - 2) + '┤');
    
    // 运行中的子任务
    const running = task.subTasks.filter(st => st.status === 'running');
    const queued = task.subTasks.filter(st => st.status === 'queued');
    const completed = task.subTasks.filter(st => st.status === 'completed');
    
    lines.push('│ 🔄 运行中 (' + `${running.length}):`.padEnd(w - 4) + '│');
    for (const st of running.slice(0, 4)) {
      const typeIcon = st.type === 'primary' ? '[主]' : st.type === 'support' ? '[副]' : '[子]';
      const duration = this.formatDuration(st.startedAt);
      const line = `  ${typeIcon} ${st.description.slice(0, 20)} (${st.agent}) - ${duration}`;
      lines.push('│ ' + line.padEnd(w - 4) + '│');
    }
    
    if (queued.length > 0) {
      lines.push('├' + '─'.repeat(w - 2) + '┤');
      lines.push('│ ⏳ 排队中 (' + `${queued.length}):`.padEnd(w - 4) + '│');
      for (const st of queued.slice(0, 3)) {
        const typeIcon = st.type === 'primary' ? '[主]' : st.type === 'support' ? '[副]' : '[子]';
        const line = `  ${typeIcon} ${st.description.slice(0, 25)} (${st.agent})`;
        lines.push('│ ' + line.padEnd(w - 4) + '│');
      }
    }
    
    // 统计
    lines.push('├' + '─'.repeat(w - 2) + '┤');
    const stats = `✅ 完成: ${completed.length} | 🔄 运行: ${running.length} | ⏳ 排队: ${queued.length}`;
    lines.push('│ ' + stats.padEnd(w - 4) + '│');
    
    lines.push('└' + '─'.repeat(w - 2) + '┘');
    
    return lines.join('\n');
  }

  /**
   * 清理任务
   * @param {string} taskId
   */
  clearTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      // 清理子任务
      for (const st of task.subTasks) {
        this.subTasks.delete(st.id);
      }
      this.tasks.delete(taskId);
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

const taskManager = new TaskManager();

module.exports = {
  TaskManager,
  taskManager,
  
  // 便捷方法
  createTask: (options) => taskManager.createTask(options),
  addSubTask: (options) => taskManager.addSubTask(options),
  startSubTask: (id) => taskManager.startSubTask(id),
  completeSubTask: (id, success) => taskManager.completeSubTask(id, success),
  renderTaskPanel: (id) => taskManager.renderTaskPanel(id),
  buildTaskListMessage: (task) => taskManager.buildTaskListMessage(task),
};

// 测试
if (require.main === module) {
  console.log('TTY:', isTTY);
  console.log('Clack available:', depsLoaded);
  console.log('');
  
  // 创建主任务
  const task = taskManager.createTask({
    description: '实现用户登录模块',
    primaryAgent: '赵云',
    supportAgents: ['高顺', '陈到'],
  });
  
  // 添加子任务
  taskManager.addSubTask({
    parentId: task.id,
    description: '分析现有登录逻辑',
    agent: '司马懿',
    agentAlias: '仲达',
    type: 'support',
    category: 'explore',
  });
  
  taskManager.addSubTask({
    parentId: task.id,
    description: '实现前端登录组件',
    agent: '高顺',
    agentAlias: '-',
    type: 'support',
    category: 'visual-engineering',
  });
  
  taskManager.addSubTask({
    parentId: task.id,
    description: '实现后端认证接口',
    agent: '陈到',
    agentAlias: '-',
    type: 'support',
    category: 'deep',
  });
  
  taskManager.addSubTask({
    parentId: task.id,
    description: '集成测试',
    agent: '张飞',
    agentAlias: '翼德',
    type: 'subtask',
    category: 'quick',
  });
  
  // 启动子任务
  const subTasks = Array.from(taskManager.subTasks.values());
  taskManager.startSubTask(subTasks[0].id);
  taskManager.startSubTask(subTasks[1].id);
  
  // 显示面板
  console.log(taskManager._renderAnsiPanel(task));
  console.log('');
  
  // 模拟进度
  setTimeout(() => {
    taskManager.completeSubTask(subTasks[0].id);
    taskManager.startSubTask(subTasks[2].id);
    console.log(taskManager._renderAnsiPanel(task));
  }, 1000);
  
  setTimeout(() => {
    taskManager.completeSubTask(subTasks[1].id);
    taskManager.completeSubTask(subTasks[2].id);
    taskManager.startSubTask(subTasks[3].id);
    console.log(taskManager._renderAnsiPanel(task));
  }, 2000);
  
  setTimeout(() => {
    taskManager.completeSubTask(subTasks[3].id);
    console.log(taskManager._renderAnsiPanel(task));
    console.log('\n✅ 所有子任务完成！');
  }, 3000);
}