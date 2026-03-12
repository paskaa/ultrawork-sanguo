/**
 * Session Monitor Hook - 实时 Session 监控 + 自动调度
 * 模式三：完整的 Session 监控和自动调度系统
 * 
 * 功能：
 * 1. 实时监控 Session 负载和状态
 * 2. 自动负载均衡和过载保护
 * 3. 智能武将推荐和任务调度
 * 4. WebSocket 实时推送决策到面板
 */

const { EventEmitter } = require('events');
const SessionRouter = require('./ultrawork-session-router');
const DecisionMatrix = require('./decision-matrix');

class SessionMonitor extends EventEmitter {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.checkInterval = null;
    this.isRunning = false;
    
    // 配置
    this.config = {
      checkInterval: 3000,      // 检查间隔 3秒
      maxActiveAgents: 8,       // 最大同时运行将领
      overloadThreshold: 0.75,  // 过载阈值 75%
      idleTimeout: 300000,      // 5分钟无活动视为空闲
      autoAdjust: true,         // 自动调整
      autoRecommend: true       // 自动推荐
    };
    
    // 状态缓存
    this.state = {
      lastStatus: null,
      lastCheck: 0,
      activeTasks: new Map(),
      recommendations: [],
      warnings: [],
      stats: {
        totalChecks: 0,
        overloadCount: 0,
        adjustmentCount: 0
      }
    };
    
    // 负载历史（用于趋势分析）
    this.loadHistory = [];
  }
  
  /**
   * 启动监控
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`[SessionMonitor] 启动监控 Session: ${this.sessionId}`);
    
    // 立即执行一次检查
    this.checkAndDecide();
    
    // 启动定时检查
    this.checkInterval = setInterval(() => {
      this.checkAndDecide();
    }, this.config.checkInterval);
    
    // 发送启动事件
    this.emit('started', { sessionId: this.sessionId, timestamp: Date.now() });
  }
  
  /**
   * 停止监控
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.checkInterval);
    console.log(`[SessionMonitor] 停止监控 Session: ${this.sessionId}`);
    
    this.emit('stopped', { sessionId: this.sessionId, timestamp: Date.now() });
  }
  
  /**
   * 检查 Session 并做出决策
   */
  async checkAndDecide() {
    try {
      this.state.stats.totalChecks++;
      
      // 1. 获取 Session 状态
      const status = await this.fetchSessionStatus();
      this.state.lastStatus = status;
      this.state.lastCheck = Date.now();
      
      // 2. 分析负载
      const analysis = this.analyzeLoad(status);
      this.state.warnings = analysis.warnings;
      
      // 3. 记录历史
      this.loadHistory.push({
        timestamp: Date.now(),
        loadFactor: analysis.loadFactor,
        activeAgents: analysis.activeCount
      });
      
      // 只保留最近 20 条记录
      if (this.loadHistory.length > 20) {
        this.loadHistory.shift();
      }
      
      // 4. 根据分析结果执行操作
      if (analysis.loadLevel === 'overloaded') {
        this.state.stats.overloadCount++;
        await this.handleOverload(status, analysis);
      } else if (analysis.loadLevel === 'heavy') {
        await this.handleHighLoad(status, analysis);
      } else if (analysis.loadLevel === 'idle') {
        await this.handleIdle(status, analysis);
      }
      
      // 5. 生成推荐
      if (this.config.autoRecommend) {
        this.state.recommendations = await this.generateRecommendations(status, analysis);
      }
      
      // 6. 推送到 Web 面板
      await this.pushToPanel({
        type: 'MONITOR_UPDATE',
        sessionId: this.sessionId,
        timestamp: Date.now(),
        analysis,
        recommendations: this.state.recommendations,
        warnings: this.state.warnings
      });
      
      // 7. 发送事件
      this.emit('update', {
        sessionId: this.sessionId,
        analysis,
        recommendations: this.state.recommendations
      });
      
    } catch (e) {
      console.error('[SessionMonitor] 检查失败:', e.message);
      this.emit('error', { error: e.message, sessionId: this.sessionId });
    }
  }
  
  /**
   * 获取 Session 状态
   */
  async fetchSessionStatus() {
    try {
      const response = await fetch(`http://localhost:3459/api/status?session=${this.sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          agents: data.state.agents || {},
          status: data.state.status,
          currentTask: data.state.currentTask,
          progress: data.state.progress,
          stats: data.state.stats || {}
        };
      }
    } catch (e) {
      console.error('[SessionMonitor] 获取状态失败:', e.message);
    }
    
    return null;
  }
  
  /**
   * 分析负载情况
   */
  analyzeLoad(status) {
    if (!status) {
      return {
        loadFactor: 0,
        loadLevel: 'unknown',
        activeCount: 0,
        totalCount: 0,
        warnings: ['无法获取 Session 状态']
      };
    }
    
    const agents = Object.values(status.agents);
    const totalCount = agents.length;
    const activeCount = agents.filter(a => a.status === 'running').length;
    const idleCount = agents.filter(a => a.status === 'idle').length;
    const loadFactor = totalCount > 0 ? activeCount / totalCount : 0;
    
    // 确定负载等级
    let loadLevel;
    if (loadFactor < 0.3) loadLevel = 'idle';
    else if (loadFactor < 0.6) loadLevel = 'normal';
    else if (loadFactor < 0.8) loadLevel = 'heavy';
    else loadLevel = 'overloaded';
    
    // 检测警告
    const warnings = [];
    
    if (loadFactor > this.config.overloadThreshold) {
      warnings.push(`负载过高: ${(loadFactor * 100).toFixed(1)}%`);
    }
    
    if (activeCount > this.config.maxActiveAgents) {
      warnings.push(`活跃将领过多: ${activeCount}/${this.config.maxActiveAgents}`);
    }
    
    // 趋势分析
    if (this.loadHistory.length >= 5) {
      const recent = this.loadHistory.slice(-5);
      const avgLoad = recent.reduce((a, b) => a + b.loadFactor, 0) / recent.length;
      
      if (loadFactor > avgLoad * 1.5) {
        warnings.push('负载快速上升，可能存在资源竞争');
      }
    }
    
    return {
      loadFactor,
      loadLevel,
      activeCount,
      idleCount,
      totalCount,
      warnings,
      trend: this.calculateTrend()
    };
  }
  
  /**
   * 计算负载趋势
   */
  calculateTrend() {
    if (this.loadHistory.length < 5) return 'stable';
    
    const recent = this.loadHistory.slice(-5);
    const first = recent[0].loadFactor;
    const last = recent[recent.length - 1].loadFactor;
    
    if (last > first * 1.2) return 'rising';
    if (last < first * 0.8) return 'falling';
    return 'stable';
  }
  
  /**
   * 处理过载情况
   */
  async handleOverload(status, analysis) {
    console.log(`[SessionMonitor] ⚠️ Session ${this.sessionId} 过载!`);
    
    this.state.stats.adjustmentCount++;
    
    // 1. 发送警告
    await this.pushToPanel({
      type: 'LOAD_WARNING',
      level: 'critical',
      message: `Session 过载! 当前负载: ${(analysis.loadFactor * 100).toFixed(1)}%`,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    
    // 2. 执行限流
    if (this.config.autoAdjust) {
      await this.throttleSession();
    }
    
    // 3. 发送事件
    this.emit('overload', {
      sessionId: this.sessionId,
      loadFactor: analysis.loadFactor,
      activeCount: analysis.activeCount
    });
  }
  
  /**
   * 处理高负载
   */
  async handleHighLoad(status, analysis) {
    console.log(`[SessionMonitor] Session ${this.sessionId} 负载较高`);
    
    // 发送提醒
    await this.pushToPanel({
      type: 'LOAD_WARNING',
      level: 'warning',
      message: `Session 负载较高: ${(analysis.loadFactor * 100).toFixed(1)}%`,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    
    this.emit('highLoad', {
      sessionId: this.sessionId,
      loadFactor: analysis.loadFactor
    });
  }
  
  /**
   * 处理空闲状态
   */
  async handleIdle(status, analysis) {
    // 空闲时可以进行一些优化
    // 比如预加载、清理缓存等
    
    this.emit('idle', {
      sessionId: this.sessionId,
      idleCount: analysis.idleCount
    });
  }
  
  /**
   * Session 限流
   */
  async throttleSession() {
    console.log(`[SessionMonitor] 对 Session ${this.sessionId} 执行限流`);
    
    try {
      await fetch('http://localhost:3459/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          type: 'SYSTEM',
          agentId: 'manchong',
          agentName: '满宠',
          message: '[监察] Session 过载，已启动限流保护'
        })
      });
    } catch (e) {
      // 忽略错误
    }
  }
  
  /**
   * 生成武将推荐
   */
  async generateRecommendations(status, analysis) {
    const recommendations = [];
    const agents = Object.values(status.agents);
    
    // 1. 获取空闲武将
    const idleAgents = agents
      .filter(a => a.status === 'idle')
      .map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        expertise: this.getAgentExpertise(a.id)
      }));
    
    // 2. 按专业领域分类
    const byExpertise = {
      frontend: idleAgents.filter(a => a.expertise.includes('frontend')),
      backend: idleAgents.filter(a => a.expertise.includes('backend')),
      review: idleAgents.filter(a => a.expertise.includes('review')),
      devops: idleAgents.filter(a => a.expertise.includes('devops')),
      security: idleAgents.filter(a => a.expertise.includes('security')),
      database: idleAgents.filter(a => a.expertise.includes('database'))
    };
    
    // 3. 根据负载生成推荐
    if (analysis.loadLevel === 'overloaded') {
      recommendations.push({
        type: 'urgent',
        icon: '⚡',
        title: '仅允许快速修复',
        description: 'Session 过载，只推荐使用张飞、雷绪、吴兰',
        agents: ['zhangfei', 'leixu', 'wulan']
          .filter(id => agents.find(a => a.id === id)?.status === 'idle')
          .map(id => agents.find(a => a.id === id))
      });
    } else if (analysis.loadLevel === 'heavy') {
      recommendations.push({
        type: 'caution',
        icon: '🔥',
        title: '精简配置',
        description: '负载较高，建议最多使用 2 位武将',
        agents: idleAgents.slice(0, 2)
      });
    } else {
      // 正常推荐
      if (byExpertise.frontend.length > 0) {
        recommendations.push({
          type: 'normal',
          icon: '🎨',
          title: '前端开发',
          agents: byExpertise.frontend.slice(0, 2)
        });
      }
      
      if (byExpertise.backend.length > 0) {
        recommendations.push({
          type: 'normal',
          icon: '🔧',
          title: '后端开发',
          agents: byExpertise.backend.slice(0, 2)
        });
      }
      
      if (byExpertise.review.length > 0) {
        recommendations.push({
          type: 'optional',
          icon: '👁️',
          title: '代码审查',
          agents: byExpertise.review.slice(0, 1)
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * 获取武将专业领域
   */
  getAgentExpertise(agentId) {
    const expertise = {
      // 前端
      gaoshun: ['frontend'],
      panglin: ['frontend'],
      // 后端
      chendao: ['backend'],
      yanyan: ['backend'],
      // 审查
      guanyu: ['review'],
      guanping: ['review'],
      // DevOps
      guanxing: ['devops'],
      dengai: ['devops'],
      // 安全
      yujin: ['security'],
      guansuo: ['security'],
      zhoucang: ['security'],
      // 数据库
      zhangliao: ['database'],
      yuejin: ['database'],
      lidian: ['database']
    };
    
    return expertise[agentId] || [];
  }
  
  /**
   * 推送到 Web 面板
   */
  async pushToPanel(data) {
    try {
      await fetch('http://localhost:3459/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      // 忽略网络错误
    }
  }
  
  /**
   * 获取当前推荐（供外部调用）
   */
  async getCurrentRecommendations() {
    if (!this.state.lastStatus) {
      await this.checkAndDecide();
    }
    return this.state.recommendations;
  }
  
  /**
   * 获取 Session 统计
   */
  getStats() {
    return {
      ...this.state.stats,
      uptime: this.isRunning ? Date.now() - this.state.lastCheck : 0,
      isRunning: this.isRunning
    };
  }
  
  /**
   * 设置配置
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 监控器管理器
class SessionMonitorManager {
  constructor() {
    this.monitors = new Map();
  }
  
  /**
   * 获取或创建监控器
   */
  getMonitor(sessionId) {
    if (!this.monitors.has(sessionId)) {
      const monitor = new SessionMonitor(sessionId);
      this.monitors.set(sessionId, monitor);
    }
    return this.monitors.get(sessionId);
  }
  
  /**
   * 启动监控
   */
  start(sessionId) {
    const monitor = this.getMonitor(sessionId);
    monitor.start();
    return monitor;
  }
  
  /**
   * 停止监控
   */
  stop(sessionId) {
    const monitor = this.monitors.get(sessionId);
    if (monitor) {
      monitor.stop();
    }
  }
  
  /**
   * 停止所有监控
   */
  stopAll() {
    for (const [sessionId, monitor] of this.monitors) {
      monitor.stop();
    }
    this.monitors.clear();
  }
  
  /**
   * 获取所有监控状态
   */
  getAllStats() {
    const stats = {};
    for (const [sessionId, monitor] of this.monitors) {
      stats[sessionId] = monitor.getStats();
    }
    return stats;
  }
}

// 导出
module.exports = {
  SessionMonitor,
  SessionMonitorManager,
  
  // 便捷函数：快速启动监控
  async monitorSession(sessionId) {
    const manager = new SessionMonitorManager();
    return manager.start(sessionId);
  },
  
  // 便捷函数：获取推荐
  async getRecommendations(sessionId) {
    const monitor = new SessionMonitor(sessionId);
    return await monitor.getCurrentRecommendations();
  }
};
