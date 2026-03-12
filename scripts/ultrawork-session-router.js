/**
 * UltraWork Session Router - 基于 Session 状态的自动调度器
 * 模式一：智能路由系统
 * 
 * 功能：
 * 1. 根据 Session 负载自动选择武将
 * 2. 根据任务类型智能分配
 * 3. 负载均衡和过载保护
 */

const ultrawork = require('./ultrawork-reporter');

const SessionRouter = {
  // Session 缓存
  sessionCache: new Map(),
  
  // 负载阈值配置
  thresholds: {
    light: 0.3,      // 轻负载 < 30%
    normal: 0.6,     // 正常负载 30-60%
    heavy: 0.8,      // 高负载 60-80%
    overloaded: 1.0  // 过载 > 80%
  },
  
  /**
   * 根据当前 Session 状态智能分配武将
   * @param {string} sessionId - Session ID
   * @param {string} task - 任务描述
   * @param {object} intent - 意图分析结果
   * @returns {object} - 分配的武将方案
   */
  async routeBySessionState(sessionId, task, intent = {}) {
    console.log(`[SessionRouter] 正在为 Session ${sessionId} 分配武将...`);
    
    // 1. 获取当前 Session 状态
    const sessionStatus = await this.getSessionStatus(sessionId);
    const { agents, activeAgents, status } = sessionStatus;
    
    // 2. 分析负载情况
    const loadFactor = this.calculateLoad(agents);
    const loadLevel = this.getLoadLevel(loadFactor);
    
    console.log(`[SessionRouter] 当前负载: ${(loadFactor * 100).toFixed(1)}% (${loadLevel})`);
    
    // 3. 根据负载和任务类型选择策略
    const strategy = this.selectStrategy(loadLevel, status, intent.category);
    
    // 4. 选择具体武将
    const selectedAgents = await this.selectAgents(strategy, agents, intent);
    
    // 5. 构建返回结果
    const result = {
      sessionId,
      task,
      loadFactor,
      loadLevel,
      strategy: strategy.name,
      primary: selectedAgents.primary,
      secondary: selectedAgents.secondary,
      support: selectedAgents.support,
      maxParallel: strategy.maxParallel,
      reason: strategy.reason,
      estimatedTime: this.estimateTime(intent, loadFactor)
    };
    
    console.log(`[SessionRouter] 分配方案:`, result);
    return result;
  },
  
  /**
   * 获取 Session 状态
   */
  async getSessionStatus(sessionId) {
    // 检查缓存
    if (this.sessionCache.has(sessionId)) {
      const cached = this.sessionCache.get(sessionId);
      if (Date.now() - cached.timestamp < 5000) { // 5秒缓存
        return cached.data;
      }
    }
    
    // 从状态服务器获取
    try {
      const response = await fetch(`http://localhost:3459/api/status?session=${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        const status = {
          agents: data.state.agents || {},
          activeAgents: Object.values(data.state.agents || {}).filter(a => a.status === 'running').length,
          status: data.state.status,
          currentTask: data.state.currentTask,
          progress: data.state.progress
        };
        
        // 更新缓存
        this.sessionCache.set(sessionId, {
          timestamp: Date.now(),
          data: status
        });
        
        return status;
      }
    } catch (e) {
      console.error('[SessionRouter] 获取 Session 状态失败:', e.message);
    }
    
    // 返回默认状态
    return {
      agents: {},
      activeAgents: 0,
      status: 'idle',
      currentTask: '',
      progress: 0
    };
  },
  
  /**
   * 计算 Session 负载因子 (0-1)
   */
  calculateLoad(agents) {
    const agentList = Object.values(agents);
    if (agentList.length === 0) return 0;
    
    const active = agentList.filter(a => a.status === 'running').length;
    return active / agentList.length;
  },
  
  /**
   * 获取负载等级
   */
  getLoadLevel(loadFactor) {
    if (loadFactor < this.thresholds.light) return 'light';
    if (loadFactor < this.thresholds.normal) return 'normal';
    if (loadFactor < this.thresholds.heavy) return 'heavy';
    return 'overloaded';
  },
  
  /**
   * 选择调度策略
   */
  selectStrategy(loadLevel, status, category) {
    const strategies = {
      // 轻负载：全阵容模式
      light: {
        name: 'full-team',
        maxParallel: 5,
        primary: ['zhugeliang', 'zhouyu'],
        secondary: ['zhaoyun', 'simayi', 'guanyu'],
        support: ['gaoshun', 'chendao'],
        reason: 'Session 空闲，启动完整工作流'
      },
      
      // 正常负载：标准模式
      normal: {
        name: 'standard',
        maxParallel: 3,
        primary: ['zhugeliang'],
        secondary: ['zhaoyun'],
        support: ['gaoshun', 'chendao'],
        reason: 'Session 负载正常，标准配置'
      },
      
      // 高负载：精简模式
      heavy: {
        name: 'reduced',
        maxParallel: 2,
        primary: ['zhugeliang'],
        secondary: ['zhaoyun'],
        support: ['zhangfei'],
        reason: 'Session 负载较高，精简配置'
      },
      
      // 过载：极限模式
      overloaded: {
        name: 'minimal',
        maxParallel: 1,
        primary: null,
        secondary: ['zhangfei'],
        support: [],
        reason: 'Session 过载，仅允许快速修复'
      }
    };
    
    // 根据任务类别微调
    let strategy = strategies[loadLevel] || strategies.normal;
    
    // 如果是 bugfix 且高负载，强制使用张飞
    if (category === 'quick' && loadLevel === 'overloaded') {
      strategy = {
        ...strategy,
        secondary: ['zhangfei'],
        reason: '高负载下的快速修复模式'
      };
    }
    
    return strategy;
  },
  
  /**
   * 选择具体武将（考虑当前状态）
   */
  async selectAgents(strategy, agents, intent) {
    const result = {
      primary: null,
      secondary: [],
      support: []
    };
    
    // 获取空闲武将
    const idleAgents = Object.entries(agents)
      .filter(([_, agent]) => agent.status === 'idle')
      .map(([id, _]) => id);
    
    // 选择主将
    if (strategy.primary) {
      result.primary = strategy.primary.find(id => 
        idleAgents.includes(id) || agents[id]?.status !== 'running'
      ) || strategy.primary[0];
    }
    
    // 选择副将
    if (strategy.secondary) {
      result.secondary = strategy.secondary.filter(id => 
        idleAgents.includes(id)
      ).slice(0, strategy.maxParallel - 1);
      
      // 如果没有空闲的，选择负载最低的
      if (result.secondary.length === 0 && strategy.secondary.length > 0) {
        const backup = strategy.secondary
          .map(id => ({ id, task: agents[id]?.task || '' }))
          .filter(a => a.task.length < 50) // 选择任务较少的
          .slice(0, 1);
        result.secondary = backup.map(a => a.id);
      }
    }
    
    // 选择支援
    if (strategy.support) {
      result.support = strategy.support.filter(id => 
        idleAgents.includes(id)
      ).slice(0, 2);
    }
    
    return result;
  },
  
  /**
   * 估算任务完成时间（分钟）
   */
  estimateTime(intent, loadFactor) {
    const baseTime = {
      'quick': 5,
      'visual-engineering': 15,
      'deep': 30,
      'review': 10,
      'ultrabrain': 20
    };
    
    const category = intent?.category || 'deep';
    const base = baseTime[category] || 20;
    
    // 根据负载调整
    const multiplier = 1 + (loadFactor * 0.5); // 负载越高时间越长
    return Math.round(base * multiplier);
  },
  
  /**
   * 执行自动分配
   */
  async executeRouting(sessionId, task, description = '') {
    // 分析意图
    const category = this.detectCategory(task);
    
    // 获取路由方案
    const plan = await this.routeBySessionState(sessionId, task, { category });
    
    // 执行分配
    const assignments = [];
    
    if (plan.primary) {
      await ultrawork.assign(plan.primary, description || task, 0);
      assignments.push({ agent: plan.primary, role: '主帅' });
    }
    
    for (const agent of plan.secondary) {
      await ultrawork.assign(agent, `${task} - 执行任务`, 0);
      assignments.push({ agent, role: '执行' });
    }
    
    for (const agent of plan.support) {
      await ultrawork.assign(agent, `${task} - 支援`, 0);
      assignments.push({ agent, role: '支援' });
    }
    
    // 推送决策到面板
    await this.pushDecision(sessionId, plan, assignments);
    
    return { plan, assignments };
  },
  
  /**
   * 简单的任务类别检测
   */
  detectCategory(task) {
    const task_lower = task.toLowerCase();
    if (task_lower.includes('bug') || task_lower.includes('fix') || task_lower.includes('修复')) return 'quick';
    if (task_lower.includes('review') || task_lower.includes('审查')) return 'review';
    if (task_lower.includes('ui') || task_lower.includes('frontend') || task_lower.includes('前端')) return 'visual-engineering';
    if (task_lower.includes('arch') || task_lower.includes('设计')) return 'ultrabrain';
    return 'deep';
  },
  
  /**
   * 推送决策到 Web 面板
   */
  async pushDecision(sessionId, plan, assignments) {
    try {
      await fetch('http://localhost:3459/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: 'DECISION',
          message: `[诸葛亮] 调度决策: ${plan.reason}`,
          data: {
            loadFactor: plan.loadFactor,
            strategy: plan.strategy,
            assignments,
            estimatedTime: plan.estimatedTime
          }
        })
      });
    } catch (e) {
      // 忽略错误
    }
  }
};

module.exports = SessionRouter;
