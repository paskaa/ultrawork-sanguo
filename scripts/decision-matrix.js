/**
 * Decision Matrix - 实时武将分配决策矩阵
 * 模式二：基于 Session 状态的动态决策系统
 * 
 * 功能：
 * 1. 根据 Session 负载等级选择不同策略
 * 2. 根据任务类别动态调整武将组合
 * 3. 提供决策理由和预期结果
 */

const DecisionMatrix = {
  // 决策矩阵配置
  strategies: {
    // ═══════════════════════════════════════════════════════════════
    // 负载等级: 空闲 (0-30%)
    // ═══════════════════════════════════════════════════════════════
    idle: {
      name: 'full-team',
      displayName: '全阵容模式',
      icon: '🏰',
      maxParallel: 5,
      description: 'Session 空闲，启动完整工作流',
      
      // 基础配置
      primary: ['zhugeliang'],           // 主帅
      planners: ['zhouyu'],              // 规划
      executors: ['zhaoyun'],            // 执行
      explorers: ['simayi'],             // 侦察
      reviewers: ['guanyu'],             // 审查
      
      // 支持团队
      support: {
        frontend: ['gaoshun'],           // 前端
        backend: ['chendao'],            // 后端
        devops: ['guanxing'],            // DevOps
        security: ['zhoucang'],          // 安全
        database: ['zhangliao']          // 数据库
      }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // 负载等级: 正常 (30-60%)
    // ═══════════════════════════════════════════════════════════════
    normal: {
      name: 'standard',
      displayName: '标准模式',
      icon: '⚔️',
      maxParallel: 3,
      description: 'Session 负载正常，标准配置',
      
      primary: ['zhugeliang'],
      planners: ['zhouyu'],
      executors: ['zhaoyun'],
      explorers: ['simayi'],
      reviewers: [],  // 延后审查
      
      support: {
        frontend: ['gaoshun'],
        backend: ['chendao'],
        devops: [],
        security: [],
        database: []
      }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // 负载等级: 繁忙 (60-80%)
    // ═══════════════════════════════════════════════════════════════
    busy: {
      name: 'reduced',
      displayName: '精简模式',
      icon: '🔥',
      maxParallel: 2,
      description: 'Session 负载较高，精简配置',
      
      primary: ['zhugeliang'],
      planners: [],  // 省略规划
      executors: ['zhaoyun'],
      explorers: [],
      reviewers: [],
      
      support: {
        frontend: ['gaoshun'],
        backend: [],
        devops: [],
        security: [],
        database: []
      }
    },
    
    // ═══════════════════════════════════════════════════════════════
    // 负载等级: 过载 (80-100%)
    // ═══════════════════════════════════════════════════════════════
    overloaded: {
      name: 'emergency',
      displayName: '紧急模式',
      icon: '⚡',
      maxParallel: 1,
      description: 'Session 过载，仅允许关键任务',
      
      primary: null,  // 不分配主帅
      planners: [],
      executors: ['zhangfei'],  // 快速修复
      explorers: [],
      reviewers: [],
      
      support: {
        frontend: [],
        backend: [],
        devops: [],
        security: [],
        database: []
      }
    }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // 任务类别特定配置
  // ═══════════════════════════════════════════════════════════════
  taskCategories: {
    // Bug 修复
    bugfix: {
      name: '快速修复',
      icon: '🐛',
      priorityAgents: ['zhangfei', 'leixu', 'wulan'],
      backupAgents: ['zhaoyun'],
      avoidAgents: ['zhouyu'],  // 高负载时避免战略规划
      estimatedTime: '5-15分钟'
    },
    
    // 功能开发
    feature: {
      name: '功能开发',
      icon: '✨',
      priorityAgents: ['zhaoyun', 'gaoshun', 'chendao'],
      backupAgents: ['zhangbao', 'guanxing'],
      avoidAgents: ['zhangfei'],  // 张飞不适合复杂开发
      estimatedTime: '30-60分钟'
    },
    
    // 代码重构
    refactor: {
      name: '代码重构',
      icon: '🔄',
      priorityAgents: ['yanpu', 'weiyan', 'yanyan'],
      backupAgents: ['zhaoyun'],
      avoidAgents: ['zhangfei'],
      estimatedTime: '45-90分钟'
    },
    
    // 代码审查
    review: {
      name: '代码审查',
      icon: '👁️',
      priorityAgents: ['guanyu', 'guanping', 'zhoucang'],
      backupAgents: ['xushu'],
      avoidAgents: [],
      estimatedTime: '15-30分钟'
    },
    
    // 性能优化
    performance: {
      name: '性能优化',
      icon: '⚡',
      priorityAgents: ['zhonghui', 'wuqi', 'yuejin'],
      backupAgents: ['zhangliao'],
      avoidAgents: [],
      estimatedTime: '30-60分钟'
    },
    
    // 架构设计
    architecture: {
      name: '架构设计',
      icon: '🏗️',
      priorityAgents: ['zhouyu', 'yanpu', 'dengai'],
      backupAgents: ['zhugeliang'],
      avoidAgents: ['zhangfei', 'leixu'],
      estimatedTime: '60-120分钟'
    },
    
    // 安全审计
    security: {
      name: '安全审计',
      icon: '🔒',
      priorityAgents: ['yujin', 'guansuo', 'zhoucang'],
      backupAgents: ['manchong'],
      avoidAgents: [],
      estimatedTime: '45-90分钟'
    },
    
    // 数据库操作
    database: {
      name: '数据库操作',
      icon: '🗄️',
      priorityAgents: ['zhangliao', 'yuejin', 'lidian'],
      backupAgents: ['chendao'],
      avoidAgents: [],
      estimatedTime: '20-40分钟'
    }
  },
  
  /**
   * 主决策函数
   * @param {string} loadLevel - 负载等级 (idle/normal/busy/overloaded)
   * @param {string} taskCategory - 任务类别
   * @param {object} context - 上下文信息
   * @returns {object} - 决策结果
   */
  decide(loadLevel, taskCategory, context = {}) {
    // 获取基础策略
    const strategy = this.strategies[loadLevel] || this.strategies.normal;
    
    // 获取任务类别配置
    const category = this.taskCategories[taskCategory] || this.taskCategories.feature;
    
    // 根据任务类别调整策略
    const adjusted = this.adjustStrategy(strategy, category, context);
    
    // 生成决策报告
    const decision = {
      timestamp: Date.now(),
      loadLevel,
      taskCategory,
      strategy: {
        name: strategy.name,
        displayName: strategy.displayName,
        icon: strategy.icon,
        description: strategy.description
      },
      category: {
        name: category.name,
        icon: category.icon,
        estimatedTime: category.estimatedTime
      },
      assignments: adjusted.assignments,
      maxParallel: adjusted.maxParallel,
      reason: adjusted.reason,
      warnings: adjusted.warnings,
      recommendations: adjusted.recommendations
    };
    
    return decision;
  },
  
  /**
   * 根据任务类别调整策略
   */
  adjustStrategy(strategy, category, context) {
    const assignments = [];
    const warnings = [];
    const recommendations = [];
    
    // 主将选择
    if (strategy.primary && !category.avoidAgents.includes(strategy.primary[0])) {
      assignments.push({
        agent: strategy.primary[0],
        role: '主帅',
        task: '统筹全局',
        priority: 1
      });
    }
    
    // 执行者选择（根据任务类别）
    let executorCount = 0;
    for (const agent of category.priorityAgents) {
      if (executorCount >= strategy.maxParallel) break;
      
      // 检查是否在避免列表
      if (category.avoidAgents.includes(agent)) {
        warnings.push(`${agent} 不适合此任务类型`);
        continue;
      }
      
      assignments.push({
        agent,
        role: '执行',
        task: '主要开发工作',
        priority: 2
      });
      executorCount++;
    }
    
    // 如果优先级武将不够，使用备用
    if (executorCount < strategy.maxParallel && strategy.executors) {
      for (const agent of strategy.executors) {
        if (executorCount >= strategy.maxParallel) break;
        if (assignments.some(a => a.agent === agent)) continue;
        
        assignments.push({
          agent,
          role: '执行',
          task: '主要开发工作',
          priority: 2
        });
        executorCount++;
      }
    }
    
    // 支援团队（仅在低负载时）
    if (strategy.name === 'full-team' || strategy.name === 'standard') {
      const support = strategy.support;
      
      if (support.frontend && context.needsFrontend) {
        assignments.push({
          agent: support.frontend[0],
          role: '前端',
          task: '前端开发',
          priority: 3
        });
      }
      
      if (support.backend && context.needsBackend) {
        assignments.push({
          agent: support.backend[0],
          role: '后端',
          task: '后端开发',
          priority: 3
        });
      }
      
      if (support.database && context.needsDatabase) {
        assignments.push({
          agent: support.database[0],
          role: '数据库',
          task: '数据库操作',
          priority: 3
        });
      }
    }
    
    // 生成建议
    if (strategy.name === 'overloaded') {
      recommendations.push('当前 Session 过载，建议等待或创建新 Session');
      recommendations.push('如需紧急处理，建议使用「快速修复」模式');
    } else if (strategy.name === 'busy') {
      recommendations.push('Session 较忙，任务可能需要排队');
      recommendations.push('可考虑分流部分任务到其他 Session');
    }
    
    // 构建原因
    let reason = strategy.description;
    if (category) {
      reason += ` | 任务类型: ${category.name}`;
    }
    
    return {
      assignments,
      maxParallel: strategy.maxParallel,
      reason,
      warnings,
      recommendations
    };
  },
  
  /**
   * 批量决策（为多个任务）
   */
  decideBatch(loadLevel, tasks, context = {}) {
    const results = [];
    let remainingSlots = this.strategies[loadLevel]?.maxParallel || 3;
    
    for (const task of tasks) {
      if (remainingSlots <= 0) {
        results.push({
          task,
          status: 'queued',
          reason: 'Session 槽位已满，任务已排队'
        });
        continue;
      }
      
      const decision = this.decide(loadLevel, task.category, context);
      results.push({
        task,
        status: 'assigned',
        decision
      });
      
      remainingSlots -= decision.assignments.length;
    }
    
    return results;
  },
  
  /**
   * 生成可视化报告
   */
  generateReport(decision) {
    const lines = [];
    
    lines.push(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
    lines.push(`┃  ${decision.strategy.icon} 调度决策 - ${decision.strategy.displayName.padEnd(20)}┃`);
    lines.push(`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`);
    lines.push(`┃ 📊 负载等级: ${decision.loadLevel.padEnd(20)}┃`);
    lines.push(`┃ 🎯 任务类型: ${decision.category.icon} ${decision.category.name.padEnd(16)}┃`);
    lines.push(`┃ ⏱️  预计时间: ${decision.category.estimatedTime.padEnd(20)}┃`);
    lines.push(`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`);
    lines.push(`┃ 🎖️  武将分配:`.padEnd(46) + '┃');
    
    for (const assign of decision.assignments) {
      const icon = assign.priority === 1 ? '👑' : assign.priority === 2 ? '⚔️' : '🔧';
      lines.push(`┃    ${icon} ${assign.agent} (${assign.role})`.padEnd(46) + '┃');
    }
    
    if (decision.warnings.length > 0) {
      lines.push(`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`);
      lines.push(`┃ ⚠️  警告:`.padEnd(46) + '┃');
      for (const warning of decision.warnings) {
        lines.push(`┃    • ${warning.substring(0, 38)}`.padEnd(46) + '┃');
      }
    }
    
    if (decision.recommendations.length > 0) {
      lines.push(`┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`);
      lines.push(`┃ 💡 建议:`.padEnd(46) + '┃');
      for (const rec of decision.recommendations) {
        lines.push(`┃    • ${rec.substring(0, 38)}`.padEnd(46) + '┃');
      }
    }
    
    lines.push(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    
    return lines.join('\n');
  }
};

module.exports = DecisionMatrix;
