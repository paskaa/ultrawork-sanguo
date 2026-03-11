/**
 * UltraWork State Server - 增强版状态服务器
 * 支持完整的API端点和26位将领的状态同步
 * 
 * API Endpoints:
 * - GET  /api/status          - 获取完整状态
 * - POST /api/agents/:id/log  - 添加将领日志
 * - POST /api/agents/:id/status - 更新将领状态
 * - POST /api/task/progress   - 更新任务进度
 * - POST /api/task/complete   - 标记任务完成
 * - GET  /                    - Web 面板页面
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const STATE_DIR = path.join(__dirname, '..', '..', '.ultrawork');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const LOG_FILE = path.join(STATE_DIR, 'execution.log');
const PORT = 3459;

// 事件发射器用于实时推送
const events = new EventEmitter();

// 26位将领的完整配置
const AGENTS_CONFIG = {
  // 主帅
  zhugeliang: { name: '诸葛亮', role: '主帅/调度器', icon: '🎯', model: 'GLM-5', level: '主帅', leader: null },
  // 大都督
  zhouyu: { name: '周瑜', role: '大都督/战略规划', icon: '📜', model: 'GLM-5', level: '大都督', leader: 'zhugeliang' },
  // 五虎大将
  zhaoyun: { name: '赵云', role: '大将/深度执行', icon: '⚔️', model: 'Qwen3.5-Plus', level: '五虎大将', leader: 'zhugeliang' },
  simayi: { name: '司马懿', role: '大将/情报侦察', icon: '🔍', model: 'MiniMax-M2.5', level: '五虎大将', leader: 'zhugeliang' },
  guanyu: { name: '关羽', role: '大将/质量守护', icon: '🛡️', model: 'Qwen3.5-Plus', level: '五虎大将', leader: 'zhugeliang' },
  zhangfei: { name: '张飞', role: '大将/快速突击', icon: '🔥', model: 'MiniMax-M2.5', level: '五虎大将', leader: 'zhugeliang' },
  machao: { name: '马超', role: '大将/后备统领', icon: '🏇', model: 'GLM-5', level: '五虎大将', leader: 'zhugeliang' },
  // 诸葛亮部将
  lusu: { name: '鲁肃', role: '部将/资源规划', icon: '📦', model: 'MiniMax-M2.5', level: '诸葛亮部将', leader: 'zhugeliang' },
  huanggai: { name: '黄盖', role: '部将/执行落地', icon: '🚀', model: 'Qwen3.5-Plus', level: '诸葛亮部将', leader: 'zhugeliang' },
  // 赵云部将
  gaoshun: { name: '高顺', role: '部将/前端开发', icon: '🎨', model: 'Qwen-Coder-Plus', level: '赵云部将', leader: 'zhaoyun' },
  chendao: { name: '陈到', role: '部将/后端开发', icon: '🔧', model: 'Qwen-Coder-Plus', level: '赵云部将', leader: 'zhaoyun' },
  // 司马懿部将
  simashi: { name: '司马师', role: '部将/深度分析', icon: '🔬', model: 'MiniMax-M2.5', level: '司马懿部将', leader: 'simayi' },
  simazhao: { name: '司马昭', role: '部将/信息整理', icon: '📝', model: 'KIMI-2.5', level: '司马懿部将', leader: 'simayi' },
  // 关羽部将
  guanping: { name: '关平', role: '部将/代码审查', icon: '📋', model: 'Qwen3.5-Plus', level: '关羽部将', leader: 'guanyu' },
  zhoucang: { name: '周仓', role: '部将/安全检查', icon: '🔒', model: 'MiniMax-M2.5', level: '关羽部将', leader: 'guanyu' },
  // 张飞部将
  leixu: { name: '雷绪', role: '部将/快速定位', icon: '🔎', model: 'MiniMax-M2.5', level: '张飞部将', leader: 'zhangfei' },
  wulan: { name: '吴兰', role: '部将/即时修复', icon: '⚡', model: 'Qwen3.5-Plus', level: '张飞部将', leader: 'zhangfei' },
  // 马超部将
  madai: { name: '马岱', role: '部将/稳健支援', icon: '🛡️', model: 'MiniMax-M2.5', level: '马超部将', leader: 'machao' },
  pangde: { name: '庞德', role: '部将/特殊任务', icon: '💪', model: 'Qwen3.5-Plus', level: '马超部将', leader: 'machao' },
  // 监察团队
  manchong: { name: '满宠', role: '监察指挥官', icon: '👁️', model: 'GLM-5', level: '监察团队', leader: 'zhugeliang' },
  chengyu: { name: '程昱', role: '前端监控专家', icon: '📱', model: 'MiniMax-M2.5', level: '监察团队', leader: 'manchong' },
  jiaxu: { name: '贾诩', role: '后端监控专家', icon: '💻', model: 'MiniMax-M2.5', level: '监察团队', leader: 'manchong' },
  // 测试团队
  xushu: { name: '徐庶', role: '测试专家', icon: '✅', model: 'Qwen3.5-Plus', level: '测试团队', leader: 'zhugeliang' },
  panglin: { name: '庞林', role: '前端测试专家', icon: '🧪', model: 'Qwen3.5-Plus', level: '测试团队', leader: 'xushu' },
  yanyan: { name: '严颜', role: '后端测试专家', icon: '🔍', model: 'Qwen3.5-Plus', level: '测试团队', leader: 'xushu' },
  liuye: { name: '刘晔', role: 'E2E测试专家', icon: '🎯', model: 'Qwen3.5-Plus', level: '测试团队', leader: 'xushu' }
};

// 默认状态
const defaultState = {
  id: Date.now(),
  title: '等待任务...',
  progress: 0,
  status: 'idle',
  agents: {},
  logs: [],
  phases: {},
  startTime: null,
  endTime: null,
  elapsedTime: 0
};

// 当前状态
let currentState = { ...defaultState };

// 初始化状态
function initState() {
  // 确保目录存在
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }

  // 初始化所有将领状态
  Object.keys(AGENTS_CONFIG).forEach(id => {
    currentState.agents[id] = {
      id,
      ...AGENTS_CONFIG[id],
      status: 'idle',
      task: '',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: []
    };
  });

  // 初始化阶段
  currentState.phases = {
    analysis: { name: '分析阶段', status: 'pending', agent: null, order: 1 },
    planning: { name: '规划阶段', status: 'pending', agent: null, order: 2 },
    fix: { name: '修复阶段', status: 'pending', agent: null, order: 3 },
    review: { name: '审查阶段', status: 'pending', agent: null, order: 4 },
    test: { name: '测试阶段', status: 'pending', agent: null, order: 5 },
    monitor: { name: '监控阶段', status: 'pending', agent: null, order: 6 }
  };

  // 加载已有状态（如果有）
  if (fs.existsSync(STATE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      currentState = { ...currentState, ...saved };
    } catch (e) {
      console.log('状态文件加载失败，使用默认状态');
    }
  }

  saveState();
}

// 保存状态到文件
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2));
  } catch (e) {
    console.error('保存状态失败:', e.message);
  }
}

// 追加日志到文件
function appendLog(logEntry) {
  try {
    const logLine = `[${new Date(logEntry.time).toISOString()}] [${logEntry.agent}] ${logEntry.message}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (e) {
    // 忽略日志写入错误
  }
}

// API 处理函数
const apiHandlers = {
  // 获取状态
  'GET /api/status': (req, res) => {
    res.json(currentState);
  },

  // 开始新任务
  'POST /api/task/start': (req, res, body) => {
    const { title } = body;
    currentState.id = Date.now();
    currentState.title = title || '未命名任务';
    currentState.progress = 0;
    currentState.status = 'running';
    currentState.startTime = Date.now();
    currentState.endTime = null;
    currentState.logs = [];
    currentState.elapsedTime = 0;
    
    // 重置所有将领状态
    Object.keys(currentState.agents).forEach(id => {
      currentState.agents[id].status = 'idle';
      currentState.agents[id].task = '';
      currentState.agents[id].progress = 0;
      currentState.agents[id].startTime = null;
      currentState.agents[id].endTime = null;
      currentState.agents[id].logs = [];
    });

    // 重置阶段
    Object.keys(currentState.phases).forEach(key => {
      currentState.phases[key].status = 'pending';
      currentState.phases[key].agent = null;
    });

    addLog('系统', `🚀 任务开始: ${currentState.title}`, 'info');
    saveState();
    events.emit('stateChange', currentState);
    res.json({ success: true, taskId: currentState.id });
  },

  // 更新任务进度
  'POST /api/task/progress': (req, res, body) => {
    const { progress } = body;
    currentState.progress = Math.min(100, Math.max(0, progress));
    currentState.elapsedTime = Date.now() - (currentState.startTime || Date.now());
    saveState();
    events.emit('stateChange', currentState);
    res.json({ success: true, progress: currentState.progress });
  },

  // 完成任务
  'POST /api/task/complete': (req, res, body) => {
    const { status = 'completed' } = body;
    currentState.status = status;
    currentState.progress = 100;
    currentState.endTime = Date.now();
    currentState.elapsedTime = currentState.endTime - (currentState.startTime || currentState.endTime);
    
    addLog('系统', status === 'completed' ? '✅ 任务完成' : '❌ 任务失败', 'info');
    saveState();
    events.emit('stateChange', currentState);
    res.json({ success: true });
  },

  // 更新将领状态
  'POST /api/agents/:id/status': (req, res, body, params) => {
    const { id } = params;
    const { status, task, progress } = body;
    
    if (!currentState.agents[id]) {
      res.status(404).json({ error: '将领不存在' });
      return;
    }

    const agent = currentState.agents[id];
    const oldStatus = agent.status;
    
    if (status) agent.status = status;
    if (task !== undefined) agent.task = task;
    if (progress !== undefined) agent.progress = progress;
    
    if (status === 'running' && oldStatus !== 'running') {
      agent.startTime = Date.now();
      addLog(id, `🟢 ${AGENTS_CONFIG[id].name} 开始执行: ${task || ''}`, 'action');
    } else if (status === 'completed' && oldStatus === 'running') {
      agent.endTime = Date.now();
      addLog(id, `✅ ${AGENTS_CONFIG[id].name} 执行完成`, 'action');
    }

    saveState();
    events.emit('agentChange', { agentId: id, agent });
    res.json({ success: true, agent });
  },

  // 添加将领日志
  'POST /api/agents/:id/log': (req, res, body, params) => {
    const { id } = params;
    const { message, type = 'action' } = body;
    
    if (!currentState.agents[id]) {
      res.status(404).json({ error: '将领不存在' });
      return;
    }

    const agentName = AGENTS_CONFIG[id]?.name || id;
    addLog(id, `[${agentName}] ${message}`, type);
    
    // 同时保存到将领自己的日志
    currentState.agents[id].logs.push({
      time: Date.now(),
      message,
      type
    });

    saveState();
    events.emit('log', { agentId: id, message, type });
    res.json({ success: true });
  },

  // 更新阶段状态
  'POST /api/phases/:name': (req, res, body, params) => {
    const { name } = params;
    const { status, agentId } = body;
    
    if (!currentState.phases[name]) {
      res.status(404).json({ error: '阶段不存在' });
      return;
    }

    currentState.phases[name].status = status;
    if (agentId) currentState.phases[name].agent = agentId;
    
    addLog('系统', `📋 ${currentState.phases[name].name}: ${status}`, 'info');
    saveState();
    events.emit('phaseChange', { phase: name, status, agentId });
    res.json({ success: true });
  }
};

// 添加日志
function addLog(agentId, message, type = 'action') {
  const logEntry = {
    time: Date.now(),
    agent: AGENTS_CONFIG[agentId]?.name || agentId,
    message,
    type
  };
  
  currentState.logs.push(logEntry);
  // 只保留最近 1000 条日志
  if (currentState.logs.length > 1000) {
    currentState.logs = currentState.logs.slice(-1000);
  }
  
  appendLog(logEntry);
}

// 解析请求体
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch (e) {
      callback({});
    }
  });
}

// 匹配路由
function matchRoute(method, path) {
  for (const [route, handler] of Object.entries(apiHandlers)) {
    const [routeMethod, routePath] = route.split(' ');
    if (routeMethod !== method) continue;
    
    // 处理动态路由参数
    const routeParts = routePath.split('/');
    const pathParts = path.split('/');
    
    if (routeParts.length !== pathParts.length) continue;
    
    const params = {};
    let match = true;
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    
    if (match) return { handler, params };
  }
  return null;
}

// 生成 Web 面板 HTML
function generateWebPanel() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UltraWork 三国军团 - 指挥中枢</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.3);
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header-content {
            max-width: 1600px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .task-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .task-name {
            font-size: 14px;
            color: #94a3b8;
        }
        
        .progress-container {
            width: 200px;
        }
        
        .progress-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #7c3aed);
            transition: width 0.3s ease;
        }
        
        .progress-text {
            text-align: right;
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-idle { background: rgba(107, 114, 128, 0.3); color: #9ca3af; }
        .status-running { background: rgba(59, 130, 246, 0.3); color: #60a5fa; }
        .status-completed { background: rgba(16, 185, 129, 0.3); color: #34d399; }
        .status-failed { background: rgba(239, 68, 68, 0.3); color: #f87171; }
        
        .main-content {
            max-width: 1600px;
            margin: 0 auto;
            padding: 24px;
            display: flex;
            gap: 24px;
        }
        
        .sidebar {
            width: 360px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 16px;
            max-height: calc(100vh - 140px);
            overflow-y: auto;
        }
        
        .sidebar h2 {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .agent-group {
            margin-bottom: 16px;
        }
        
        .group-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .group-header:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .group-agents {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .agent-card {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }
        
        .agent-card:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .agent-card.active {
            background: rgba(59, 130, 246, 0.2);
            border-left-color: #3b82f6;
        }
        
        .agent-card.subordinate {
            margin-left: 16px;
            padding-left: 20px;
            border-left: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .agent-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-right: 12px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .agent-info {
            flex: 1;
        }
        
        .agent-name {
            font-size: 13px;
            font-weight: 500;
        }
        
        .agent-role {
            font-size: 11px;
            color: #64748b;
        }
        
        .agent-status {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .status-idle-dot { background: #6b7280; }
        .status-running-dot { 
            background: #00d4ff;
            animation: pulse 1.5s infinite;
        }
        .status-completed-dot { background: #10b981; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .logs-panel {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 16px;
            max-height: calc(100vh - 140px);
            overflow-y: auto;
        }
        
        .logs-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logs-title {
            font-size: 14px;
            font-weight: 500;
        }
        
        .filter-tabs {
            display: flex;
            gap: 8px;
        }
        
        .filter-tab {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.05);
            transition: all 0.2s;
        }
        
        .filter-tab:hover, .filter-tab.active {
            background: rgba(255, 255, 255, 0.15);
        }
        
        .log-entry {
            display: flex;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
        }
        
        .log-time {
            color: #64748b;
            white-space: nowrap;
        }
        
        .log-agent {
            color: #00d4ff;
            white-space: nowrap;
            min-width: 60px;
        }
        
        .log-message {
            color: #e0e0e0;
            flex: 1;
        }
        
        .log-type-thinking { color: #a78bfa; }
        .log-type-action { color: #34d399; }
        .log-type-modify { color: #fbbf24; }
        .log-type-error { color: #f87171; }
        
        .phases-bar {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .phase-item {
            flex: 1;
            text-align: center;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
        }
        
        .phase-pending { color: #64748b; }
        .phase-running { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .phase-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #64748b;
        }

        .stats-row {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
        }

        .stat-card {
            flex: 1;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            text-align: center;
        }

        .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: #00d4ff;
        }

        .stat-label {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <h1>🏰 UltraWork 三国军团</h1>
            <div class="task-info">
                <span class="task-name" id="taskName">等待任务...</span>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="progressText">0%</div>
                </div>
                <span class="status-badge status-idle" id="statusBadge">空闲</span>
            </div>
        </div>
    </div>

    <div class="main-content">
        <div class="sidebar">
            <h2>👥 三国军团 (26位)</h2>
            <div id="agentsList"></div>
        </div>

        <div class="logs-panel">
            <div class="logs-header">
                <span class="logs-title" id="logsTitle">📜 全局日志</span>
                <div class="filter-tabs">
                    <span class="filter-tab active" onclick="filterLogs('all')">全部</span>
                    <span class="filter-tab" onclick="filterLogs('thinking')">💭 思考</span>
                    <span class="filter-tab" onclick="filterLogs('action')">⚡ 执行</span>
                    <span class="filter-tab" onclick="filterLogs('modify')">✏️ 修改</span>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-value" id="totalLogs">0</div>
                    <div class="stat-label">日志总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="runningAgents">0</div>
                    <div class="stat-label">运行中</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="completedAgents">0</div>
                    <div class="stat-label">已完成</div>
                </div>
            </div>

            <div id="phasesBar" class="phases-bar"></div>

            <div id="logsContainer"></div>
        </div>
    </div>

    <script>
        // 将领层级结构
        const hierarchy = {
            '主帅': ['zhugeliang'],
            '大都督': ['zhouyu'],
            '五虎大将': ['zhaoyun', 'simayi', 'guanyu', 'zhangfei', 'machao'],
            '诸葛亮部将': ['lusu', 'huanggai'],
            '赵云部将': ['gaoshun', 'chendao'],
            '司马懿部将': ['simashi', 'simazhao'],
            '关羽部将': ['guanping', 'zhoucang'],
            '张飞部将': ['leixu', 'wulan'],
            '马超部将': ['madai', 'pangde'],
            '监察团队': ['manchong', 'chengyu', 'jiaxu'],
            '测试团队': ['xushu', 'panglin', 'yanyan', 'liuye']
        };

        let currentState = { agents: {}, logs: [], phases: {} };
        let selectedAgent = null;
        let logFilter = 'all';

        // 格式化时间
        function formatTime(timestamp) {
            if (!timestamp) return '--:--:--';
            const date = new Date(timestamp);
            return date.toTimeString().split(' ')[0];
        }

        // 获取状态样式
        function getStatusClass(status) {
            const map = { idle: 'status-idle', running: 'status-running', completed: 'status-completed', failed: 'status-failed' };
            return map[status] || 'status-idle';
        }

        function getStatusDotClass(status) {
            const map = { idle: 'status-idle-dot', running: 'status-running-dot', completed: 'status-completed-dot' };
            return map[status] || 'status-idle-dot';
        }

        function getStatusText(status) {
            const map = { idle: '空闲', running: '运行中', completed: '已完成', failed: '失败' };
            return map[status] || status;
        }

        // 渲染将领列表
        function renderAgents() {
            const container = document.getElementById('agentsList');
            container.innerHTML = '';

            Object.entries(hierarchy).forEach(([level, agentIds]) => {
                const group = document.createElement('div');
                group.className = 'agent-group';

                const runningCount = agentIds.filter(id => currentState.agents[id]?.status === 'running').length;
                const headerText = runningCount > 0 ? \`\${level} (\${runningCount}人运行中)\` : level;

                group.innerHTML = \`
                    <div class="group-header" onclick="toggleGroup(this)">
                        <span>\${headerText}</span>
                        <span>\${agentIds.length}人</span>
                    </div>
                    <div class="group-agents">
                        \${agentIds.map(id => {
                            const agent = currentState.agents[id];
                            if (!agent) return '';
                            const isSubordinate = level.includes('部将') || level.includes('团队');
                            return \`
                                <div class="agent-card \${isSubordinate ? 'subordinate' : ''} \${selectedAgent === id ? 'active' : ''}"
                                     onclick="selectAgent('\${id}')">
                                    <div class="agent-avatar">\${agent.icon}</div>
                                    <div class="agent-info">
                                        <div class="agent-name">\${agent.name}</div>
                                        <div class="agent-role">\${agent.task || agent.role}</div>
                                    </div>
                                    <div class="agent-status \${getStatusDotClass(agent.status)}"></div>
                                </div>
                            \`;
                        }).join('')}
                    </div>
                \`;
                container.appendChild(group);
            });
        }

        // 渲染日志
        function renderLogs() {
            const container = document.getElementById('logsContainer');
            let logs = currentState.logs || [];

            // 按将领筛选
            if (selectedAgent) {
                const agentName = currentState.agents[selectedAgent]?.name;
                logs = logs.filter(log => log.agent === agentName);
            }

            // 按类型筛选
            if (logFilter !== 'all') {
                logs = logs.filter(log => log.type === logFilter);
            }

            // 显示最近100条
            logs = logs.slice(-100);

            if (logs.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无日志</div>';
                return;
            }

            container.innerHTML = logs.map(log => \`
                <div class="log-entry">
                    <span class="log-time">\${formatTime(log.time)}</span>
                    <span class="log-agent">\${log.agent}</span>
                    <span class="log-message log-type-\${log.type}">\${log.message}</span>
                </div>
            \`).join('');

            // 滚动到底部
            container.scrollTop = container.scrollHeight;
        }

        // 渲染阶段
        function renderPhases() {
            const container = document.getElementById('phasesBar');
            const phases = currentState.phases || {};
            
            const phaseOrder = ['analysis', 'planning', 'fix', 'review', 'test', 'monitor'];
            
            container.innerHTML = phaseOrder.map(key => {
                const phase = phases[key];
                if (!phase) return '';
                return \`<div class="phase-item phase-\${phase.status}">\${phase.name}</div>\`;
            }).join('');
        }

        // 更新统计
        function updateStats() {
            const agents = Object.values(currentState.agents);
            const running = agents.filter(a => a.status === 'running').length;
            const completed = agents.filter(a => a.status === 'completed').length;
            
            document.getElementById('totalLogs').textContent = currentState.logs?.length || 0;
            document.getElementById('runningAgents').textContent = running;
            document.getElementById('completedAgents').textContent = completed;
        }

        // 选择将领
        function selectAgent(agentId) {
            selectedAgent = agentId;
            const agent = currentState.agents[agentId];
            document.getElementById('logsTitle').textContent = \`📜 \${agent?.icon || ''} \${agent?.name || agentId} 的日志\`;
            renderAgents();
            renderLogs();
        }

        // 筛选日志
        function filterLogs(type) {
            logFilter = type;
            document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            renderLogs();
        }

        // 切换分组
        function toggleGroup(header) {
            const agents = header.nextElementSibling;
            agents.style.display = agents.style.display === 'none' ? 'flex' : 'none';
        }

        // 更新整体UI
        function updateUI() {
            // 更新头部
            document.getElementById('taskName').textContent = currentState.title || '等待任务...';
            document.getElementById('progressFill').style.width = \`\${currentState.progress || 0}%\`;
            document.getElementById('progressText').textContent = \`\${currentState.progress || 0}%\`;
            
            const statusBadge = document.getElementById('statusBadge');
            statusBadge.className = \`status-badge \${getStatusClass(currentState.status)}\`;
            statusBadge.textContent = getStatusText(currentState.status);

            renderAgents();
            renderLogs();
            renderPhases();
            updateStats();
        }

        // 获取状态
        async function fetchStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                currentState = data;
                updateUI();
            } catch (e) {
                console.error('获取状态失败:', e);
            }
        }

        // 定时刷新
        fetchStatus();
        setInterval(fetchStatus, 1000);
    </script>
</body>
</html>`;
}

// 初始化
initState();

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 解析 URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // 首页 - Web 面板
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateWebPanel());
    return;
  }

  // API 路由
  const route = matchRoute(req.method, path);
  
  if (route) {
    // 添加响应辅助函数
    res.json = (data) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    res.status = (code) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      return { json: (data) => res.end(JSON.stringify(data)) };
    };

    if (req.method === 'POST') {
      parseBody(req, (body) => {
        route.handler(req, res, body, route.params);
      });
    } else {
      route.handler(req, res, {}, route.params);
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path }));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           UltraWork State Server - 增强版               ║
╠════════════════════════════════════════════════════════╣
║  状态: 🟢 运行中                                        ║
║  端口: ${PORT}                                         ║
╠════════════════════════════════════════════════════════╣
║  Web面板: http://localhost:${PORT}                      ║
║  API状态: http://localhost:${PORT}/api/status           ║
╠════════════════════════════════════════════════════════╣
║  API端点:                                              ║
║  • POST /api/task/start   - 开始任务                    ║
║  • POST /api/task/progress - 更新进度                   ║
║  • POST /api/task/complete - 完成任务                   ║
║  • POST /api/agents/:id/log - 添加日志                  ║
║  • POST /api/agents/:id/status - 更新状态               ║
║  • POST /api/phases/:name - 更新阶段                    ║
╚════════════════════════════════════════════════════════╝

按 Ctrl+C 停止服务器
`);
});

// 导出模块
module.exports = {
  server,
  getState: () => currentState,
  setState: (s) => { currentState = { ...currentState, ...s }; saveState(); },
  addLog: (agentId, message, type) => addLog(agentId, message, type),
  events
};

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
