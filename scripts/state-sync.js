/**
 * UltraWork State Sync - 状态同步模块
 * 供各个将领调用，记录执行日志和更新状态
 * 
 * 使用方法:
 * const sync = require('./state-sync');
 * 
 * // 开始任务
 * await sync.startTask('修复登录页面Bug');
 * 
 * // 将领开始执行
 * await sync.agentStart('simayi', '搜索代码库');
 * 
 * // 记录日志
 * await sync.log('simayi', '找到3个相关文件', 'action');
 * await sync.log('simayi', '分析验证码逻辑...', 'thinking');
 * 
 * // 更新进度
 * await sync.updateProgress(50);
 * 
 * // 将领完成
 * await sync.agentComplete('simayi');
 * 
 * // 完成任务
 * await sync.completeTask();
 */

const http = require('http');

const DEFAULT_PORT = process.env.ULTRAWORK_PORT || 3459;

// 当前任务ID
let currentTaskId = null;

/**
 * 发送 HTTP 请求
 */
async function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: DEFAULT_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ success: false, error: body });
        }
      });
    });

    req.on('error', (err) => {
      // 静默处理连接错误（服务器可能未启动）
      resolve({ success: false, error: err.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 开始新任务
 * @param {string} title - 任务标题
 * @returns {Promise<Object>}
 */
async function startTask(title) {
  const result = await request('POST', '/api/task/start', { title });
  if (result.success) {
    currentTaskId = result.taskId;
    console.log('[UltraWork] 任务开始: ' + title);
  }
  return result;
}

/**
 * 更新任务进度
 * @param {number} progress - 进度 (0-100)
 * @returns {Promise<Object>}
 */
async function updateProgress(progress) {
  const result = await request('POST', '/api/task/progress', { progress });
  return result;
}

/**
 * 完成任务
 * @param {string} status - 完成状态: 'completed' | 'failed'
 * @returns {Promise<Object>}
 */
async function completeTask(status = 'completed') {
  const result = await request('POST', '/api/task/complete', { status });
  if (result.success) {
    console.log('[UltraWork] 任务' + (status === 'completed' ? '完成' : '失败'));
  }
  return result;
}

/**
 * 将领开始执行任务
 * @param {string} agentId - 将领ID
 * @param {string} task - 任务描述
 * @returns {Promise<Object>}
 */
async function agentStart(agentId, task) {
  const result = await request('POST', '/api/agents/' + agentId + '/status', {
    status: 'running',
    task,
    progress: 0
  });
  if (result.success) {
    console.log('[UltraWork] ' + agentId + ' 开始执行: ' + task);
  }
  return result;
}

/**
 * 将领更新进度
 * @param {string} agentId - 将领ID
 * @param {number} progress - 进度 (0-100)
 * @param {string} task - 当前任务描述（可选）
 * @returns {Promise<Object>}
 */
async function agentProgress(agentId, progress, task = null) {
  const data = { progress };
  if (task) data.task = task;
  
  const result = await request('POST', '/api/agents/' + agentId + '/status', data);
  return result;
}

/**
 * 将领完成任务
 * @param {string} agentId - 将领ID
 * @returns {Promise<Object>}
 */
async function agentComplete(agentId) {
  const result = await request('POST', '/api/agents/' + agentId + '/status', {
    status: 'completed',
    progress: 100
  });
  if (result.success) {
    console.log('[UltraWork] ' + agentId + ' 执行完成');
  }
  return result;
}

/**
 * 记录日志
 * @param {string} agentId - 将领ID
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型: 'thinking' | 'action' | 'modify' | 'error' | 'info'
 * @returns {Promise<Object>}
 */
async function log(agentId, message, type = 'action') {
  const result = await request('POST', '/api/agents/' + agentId + '/log', {
    message,
    type
  });
  
  // 同时在控制台输出
  const typeEmoji = {
    thinking: '思考',
    action: '执行',
    modify: '修改',
    error: '错误',
    info: '信息'
  }[type] || '记录';
  
  console.log('[UltraWork] [' + typeEmoji + '] [' + agentId + '] ' + message);
  return result;
}

/**
 * 更新阶段状态
 * @param {string} phaseName - 阶段名称: 'analysis' | 'planning' | 'fix' | 'review' | 'test' | 'monitor'
 * @param {string} status - 状态: 'pending' | 'running' | 'completed'
 * @param {string} agentId - 负责将领ID（可选）
 * @returns {Promise<Object>}
 */
async function updatePhase(phaseName, status, agentId = null) {
  const result = await request('POST', '/api/phases/' + phaseName, {
    status,
    agentId
  });
  
  if (result.success) {
    const phaseNames = {
      analysis: '分析阶段',
      planning: '规划阶段',
      fix: '修复阶段',
      review: '审查阶段',
      test: '测试阶段',
      monitor: '监控阶段'
    };
    console.log('[UltraWork] ' + (phaseNames[phaseName] || phaseName) + ': ' + status);
  }
  return result;
}

/**
 * 获取当前状态
 * @returns {Promise<Object>}
 */
async function getStatus() {
  return await request('GET', '/api/status');
}

/**
 * 批量记录日志（用于快速记录多个步骤）
 * @param {string} agentId - 将领ID
 * @param {Array} logs - 日志数组
 */
async function logBatch(agentId, logs) {
  for (const entry of logs) {
    await log(agentId, entry.message, entry.type);
    // 小延迟避免请求过快
    await new Promise(r => setTimeout(r, 10));
  }
}

/**
 * 创建带自动日志记录的任务执行器
 * @param {string} agentId - 将领ID
 * @param {string} taskName - 任务名称
 * @returns {Object} 任务执行器
 */
function createExecutor(agentId, taskName) {
  return {
    async start() {
      await agentStart(agentId, taskName);
    },
    
    async log(message, type = 'action') {
      await log(agentId, message, type);
    },
    
    async progress(percent, message = null) {
      await agentProgress(agentId, percent, message);
      if (message) {
        await log(agentId, message, 'action');
      }
    },
    
    async complete() {
      await agentComplete(agentId);
    },
    
    async thinking(message) {
      await log(agentId, message, 'thinking');
    },
    
    async action(message) {
      await log(agentId, message, 'action');
    },
    
    async modify(message) {
      await log(agentId, message, 'modify');
    },
    
    async error(message) {
      await log(agentId, message, 'error');
    }
  };
}

// 导出模块
module.exports = {
  // 任务管理
  startTask,
  updateProgress,
  completeTask,
  
  // 将领状态
  agentStart,
  agentProgress,
  agentComplete,
  
  // 日志记录
  log,
  logBatch,
  
  // 阶段管理
  updatePhase,
  
  // 状态查询
  getStatus,
  
  // 高级功能
  createExecutor,
  
  // 常量
  AGENTS: {
    // 主帅
    ZHUGELIANG: 'zhugeliang',
    // 大都督
    ZHOUYU: 'zhouyu',
    // 五虎大将
    ZHAOYUN: 'zhaoyun',
    SIMAYI: 'simayi',
    GUANYU: 'guanyu',
    ZHANGFEI: 'zhangfei',
    MACHAO: 'machao',
    // 部将
    LUSU: 'lusu',
    HUANGGAI: 'huanggai',
    GAOSHUN: 'gaoshun',
    CHENDAO: 'chendao',
    SIMASHI: 'simashi',
    SIMAZHAO: 'simazhao',
    GUANPING: 'guanping',
    ZHOUCANG: 'zhoucang',
    LEIXU: 'leixu',
    WULAN: 'wulan',
    MADAI: 'madai',
    PANGDE: 'pangde',
    // 监察团队
    MANCHONG: 'manchong',
    CHENGYU: 'chengyu',
    JIAXU: 'jiaxu',
    // 测试团队
    XUSHU: 'xushu',
    PANGLIN: 'panglin',
    YANYAN: 'yanyan',
    LIUYE: 'liuye'
  },
  
  PHASES: {
    ANALYSIS: 'analysis',
    PLANNING: 'planning',
    FIX: 'fix',
    REVIEW: 'review',
    TEST: 'test',
    MONITOR: 'monitor'
  }
};
