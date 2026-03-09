/**
 * ClackStatusBar - 现代化状态栏
 * 使用 @clack/prompts 提供更好的 TUI 体验
 * 
 * 参考: oh-my-openagent (https://github.com/code-yeongyu/oh-my-openagent)
 */

const path = require('path');

// TTY 检测
const isTTY = process.stdin.isTTY && process.stdout.isTTY;

// 尝试从多个路径加载依赖（处理 npm hoisting）
let p = null;
let color = null;

const loadDependencies = () => {
  // 可能的 node_modules 路径
  const possiblePaths = [
    // 当前目录
    path.join(__dirname, '..', 'node_modules'),
    // 父目录 (npm hoisting)
    path.join(__dirname, '..', '..', '..', '..', 'node_modules'),
    // D:\his\node_modules (项目根目录)
    'D:\\his\\node_modules',
    // 全局安装
    require.resolve.paths('@clack/prompts')?.[0],
  ].filter(Boolean);

  for (const nodeModulesPath of possiblePaths) {
    try {
      const clackPath = path.join(nodeModulesPath, '@clack', 'prompts');
      const picocolorsPath = path.join(nodeModulesPath, 'picocolors');
      
      p = require(clackPath);
      color = require(picocolorsPath);
      
      if (p && color) {
        return true;
      }
    } catch (e) {
      // 继续尝试下一个路径
    }
  }
  
  return false;
};

const depsLoaded = loadDependencies();

// 将领信息
const AGENTS = {
  zhugeliang: { name: '诸葛亮', alias: '孔明', role: '主帅' },
  zhouyu: { name: '周瑜', alias: '公瑾', role: '大都督' },
  zhaoyun: { name: '赵云', alias: '子龙', role: '大将' },
  simayi: { name: '司马懿', alias: '仲达', role: '谋士' },
  guanyu: { name: '关羽', alias: '云长', role: '大将' },
  zhangfei: { name: '张飞', alias: '翼德', role: '猛将' },
  gaoshun: { name: '高顺', alias: '-', role: '陷阵营' },
  chendao: { name: '陈到', alias: '-', role: '白耳兵' },
  machao: { name: '马超', alias: '孟起', role: '西凉猛将' },
  lusu: { name: '鲁肃', alias: '子敬', role: '资源规划' },
  huanggai: { name: '黄盖', alias: '-', role: '执行落地' },
  simashi: { name: '司马师', alias: '-', role: '深度分析' },
  simazhao: { name: '司马昭', alias: '-', role: '信息整理' },
  guanping: { name: '关平', alias: '-', role: '代码审查' },
  zhoucang: { name: '周仓', alias: '-', role: '安全检查' },
  leixu: { name: '雷绪', alias: '-', role: '快速定位' },
  wulan: { name: '吴兰', alias: '-', role: '即时修复' },
  madai: { name: '马岱', alias: '-', role: '稳健支援' },
  pangde: { name: '庞德', alias: '-', role: '特殊任务' },
};

// 状态图标
const STATUS_ICONS = {
  IDLE: '⏸️',
  RUN: '🔄',
  OK: '✅',
  FAIL: '❌',
};

/**
 * 现代化状态栏类
 */
class ClackStatusBar {
  constructor() {
    this.state = {
      task: '',
      progress: 0,
      agents: [],
      logs: [],
      status: 'idle',
      startTime: null,
    };
    
    this.spinner = null;
    this.useClack = isTTY && p !== null;
  }

  /**
   * 开始任务
   */
  start(task) {
    this.state.task = task;
    this.state.status = 'running';
    this.state.startTime = Date.now();
    this.state.agents = [];
    this.state.logs = [];
    this.state.progress = 0;

    if (this.useClack) {
      p.intro(color.bgMagenta(color.white(' 🏰 UltraWork 三国军团 ')));
      this.spinner = p.spinner();
      this.spinner.start(`📋 ${task}`);
    } else {
      console.log('\n' + '═'.repeat(50));
      console.log('🏰 UltraWork 三国军团');
      console.log('═'.repeat(50));
      console.log(`📋 任务: ${task}`);
      console.log('─'.repeat(50));
    }
    
    return this;
  }

  /**
   * 添加将领
   */
  addAgent(agentId, status = 'IDLE', task = '') {
    const agentInfo = AGENTS[agentId] || { name: agentId, alias: '-', role: '未知' };
    this.state.agents.push({
      id: agentId,
      ...agentInfo,
      status,
      task,
    });
    
    if (!this.useClack) {
      const icon = STATUS_ICONS[status] || '⏸️';
      console.log(`  ${icon} ${agentInfo.name}(${agentInfo.alias}): ${task || '待命'}`);
    }
    
    return this;
  }

  /**
   * 更新将领状态
   */
  updateAgent(agentId, status, task = '') {
    const agent = this.state.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = status;
      agent.task = task;
      
      if (this.useClack && status === 'RUN') {
        this.spinner.message(`${agent.name}: ${task}`);
      }
    }
    return this;
  }

  /**
   * 设置进度
   */
  setProgress(percent) {
    this.state.progress = Math.min(100, Math.max(0, percent));
    return this;
  }

  /**
   * 添加日志
   */
  log(message, type = 'info') {
    const time = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    this.state.logs.push({ time, message, type });
    if (this.state.logs.length > 5) this.state.logs.shift();
    
    if (this.useClack) {
      if (type === 'success') {
        p.log.success(message);
      } else if (type === 'error') {
        p.log.error(message);
      } else if (type === 'warn') {
        p.log.warn(message);
      } else {
        p.log.message(color.dim(`${time} ${message}`));
      }
    }
    
    return this;
  }

  /**
   * 完成将领任务
   */
  completeAgent(agentId, success = true) {
    const agent = this.state.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = success ? 'OK' : 'FAIL';
      
      if (this.useClack) {
        const icon = success ? color.green('✓') : color.red('✗');
        p.log.message(`  ${icon} ${agent.name}(${agent.alias}) 完成`);
      }
    }
    return this;
  }

  /**
   * 结束任务
   */
  complete(success = true) {
    this.state.status = success ? 'completed' : 'failed';
    this.state.progress = 100;
    
    const elapsed = this.state.startTime 
      ? Math.round((Date.now() - this.state.startTime) / 1000) 
      : 0;
    
    if (this.useClack) {
      if (this.spinner) {
        this.spinner.stop(success ? '任务完成' : '任务失败', success ? 0 : 1);
      }
      
      const completed = this.state.agents.filter(a => a.status === 'OK').length;
      const total = this.state.agents.length;
      
      p.note(
        `将领执行: ${completed}/${total} 完成\n耗时: ${elapsed}s`,
        '执行统计'
      );
      
      p.outro(
        success 
          ? color.green('🎉 任务完成！鞠躬尽瘁，死而后已') 
          : color.red('❌ 任务失败，请检查日志')
      );
    } else {
      console.log('─'.repeat(50));
      console.log('\n🎖️  将领状态:');
      for (const agent of this.state.agents) {
        const icon = STATUS_ICONS[agent.status] || '⏸️';
        console.log(`  ${icon} ${agent.name}(${agent.alias}): ${agent.task || '待命'}`);
      }
      console.log('\n' + '═'.repeat(50));
      console.log(success ? '🎉 任务完成！' : '❌ 任务失败');
      console.log(`⏱️  耗时: ${elapsed}s`);
      console.log('═'.repeat(50) + '\n');
    }
    
    return this;
  }

  /**
   * 显示任务面板
   */
  renderPanel() {
    if (!this.useClack) {
      return this._renderAnsiPanel();
    }
    
    const agentLines = this.state.agents.slice(0, 6).map(agent => {
      const icon = STATUS_ICONS[agent.status] || '⏸️';
      return `${icon} ${agent.name}(${agent.alias}): ${agent.task || '待命'}`;
    }).join('\n');
    
    const progress = '█'.repeat(Math.round(this.state.progress / 5)) + 
                     '░'.repeat(20 - Math.round(this.state.progress / 5));
    
    p.note(
      `📋 任务: ${this.state.task}\n` +
      `📊 进度: ${progress} ${this.state.progress}%\n\n` +
      `🎖️  将领:\n${agentLines}`,
      '🏰 UltraWork 三国军团'
    );
  }

  /**
   * ANSI 面板 (fallback)
   */
  _renderAnsiPanel() {
    const lines = [];
    const w = 50;
    
    lines.push('┌' + '─'.repeat(w - 2) + '┐');
    lines.push('│ 🏰 UltraWork 三国军团' + ' '.repeat(w - 25) + '│');
    lines.push('├' + '─'.repeat(w - 2) + '┤');
    lines.push('│ 📋 ' + (this.state.task || '待命中...').slice(0, w - 8).padEnd(w - 8) + '│');
    
    const filled = Math.round(this.state.progress / 100 * 20);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    lines.push('│ 📊 ' + `进度: ${bar} ${this.state.progress}%`.padEnd(w - 6) + '│');
    
    lines.push('├' + '─'.repeat(w - 2) + '┤');
    lines.push('│ 🎖️  将领状态' + ' '.repeat(w - 14) + '│');
    
    for (const agent of this.state.agents.slice(0, 6)) {
      const icon = STATUS_ICONS[agent.status] || '⏸️';
      const line = `  ${icon} ${agent.name}(${agent.alias}): ${(agent.task || '待命').slice(0, 15)}`;
      lines.push('│' + line.padEnd(w - 2) + '│');
    }
    
    lines.push('└' + '─'.repeat(w - 2) + '┘');
    
    return lines.join('\n');
  }
}

// 导出单例
const statusBar = new ClackStatusBar();

// 导入任务管理器
let TaskManager = null;
let taskManager = null;

try {
  const taskModule = require('./task-manager.js');
  TaskManager = taskModule.TaskManager;
  taskManager = taskModule.taskManager;
} catch (e) {
  // task-manager.js 不可用
}

// 兼容旧 API
module.exports = {
  ClackStatusBar,
  statusBar,
  TaskManager,
  taskManager,
  
  // 兼容旧 API
  init: () => statusBar,
  setTask: (task) => statusBar.start(task),
  setProgress: (percent) => statusBar.setProgress(percent),
  addAgent: (name, alias, model, status, task) => statusBar.addAgent(name, status, task),
  updateAgent: (name, status, task) => statusBar.updateAgent(name, status, task),
  addLog: (message) => statusBar.log(message),
  render: () => statusBar.renderPanel(),
  clear: () => {},
  agentStart: (name, task) => statusBar.updateAgent(name, 'RUN', task),
  agentProgress: (name, percent) => statusBar.updateAgent(name, 'RUN'),
  agentComplete: (name, success) => statusBar.completeAgent(name, success),
  
  // 新方法
  start: (task) => statusBar.start(task),
  complete: (success) => statusBar.complete(success),
  log: (message, type) => statusBar.log(message, type),
  
  // 任务管理方法
  createTask: (options) => taskManager?.createTask(options),
  addSubTask: (options) => taskManager?.addSubTask(options),
  startSubTask: (id) => taskManager?.startSubTask(id),
  completeSubTask: (id, success) => taskManager?.completeSubTask(id, success),
  renderTaskPanel: (id) => taskManager?.renderTaskPanel(id),
};

// 测试
if (require.main === module) {
  console.log('TTY:', isTTY);
  console.log('Clack available:', depsLoaded);
  console.log('TaskManager available:', taskManager !== null);
  console.log('');
  
  // 测试任务管理器
  if (taskManager) {
    console.log('=== 测试任务管理器 ===\n');
    
    // 创建主任务
    const task = taskManager.createTask({
      description: '实现用户登录模块',
      primaryAgent: '赵云',
      supportAgents: ['高顺', '陈到'],
    });
    
    // 添加子任务
    const subTasks = [];
    subTasks.push(taskManager.addSubTask({
      parentId: task.id,
      description: '分析现有登录逻辑',
      agent: '司马懿',
      agentAlias: '仲达',
      type: 'support',
      category: 'explore',
    }));
    
    subTasks.push(taskManager.addSubTask({
      parentId: task.id,
      description: '实现前端登录组件',
      agent: '高顺',
      agentAlias: '-',
      type: 'support',
      category: 'visual-engineering',
    }));
    
    subTasks.push(taskManager.addSubTask({
      parentId: task.id,
      description: '实现后端认证接口',
      agent: '陈到',
      agentAlias: '-',
      type: 'support',
      category: 'deep',
    }));
    
    subTasks.push(taskManager.addSubTask({
      parentId: task.id,
      description: '集成测试',
      agent: '张飞',
      agentAlias: '翼德',
      type: 'subtask',
      category: 'quick',
    }));
    
    // 启动部分子任务
    taskManager.startSubTask(subTasks[0].id);
    taskManager.startSubTask(subTasks[1].id);
    
    // 显示初始状态
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
  } else {
    // 原始测试
    statusBar
      .start('实现用户登录功能')
      .addAgent('zhugeliang', 'RUN', '意图分析')
      .addAgent('zhaoyun', 'IDLE')
      .addAgent('simayi', 'IDLE');
    
    setTimeout(() => {
      statusBar
        .completeAgent('zhugeliang')
        .updateAgent('zhaoyun', 'RUN', '代码实现')
        .log('诸葛亮: 分析完成', 'success')
        .setProgress(30);
    }, 1000);
    
    setTimeout(() => {
      statusBar
        .completeAgent('zhaoyun')
        .log('赵云: 实现完成', 'success')
        .setProgress(80);
    }, 2000);
    
    setTimeout(() => {
      statusBar.complete(true);
    }, 3000);
  }
}