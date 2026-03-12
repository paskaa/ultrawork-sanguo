/**
 * UltraWork 智能调度示例
 * 展示如何使用三种模式
 */

const SessionRouter = require('./ultrawork-session-router');
const DecisionMatrix = require('./decision-matrix');
const { SessionMonitor, monitorSession, getRecommendations } = require('./session-monitor-hook');
const { init, startTask, assignAgent, updateProgress, completeTask, logMessage } = require('./ultrawork-wrapper');

// ═══════════════════════════════════════════════════════════════
// 示例 1: 使用 Session Router 自动分配武将
// ═══════════════════════════════════════════════════════════════
async function example1_AutoRouting() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('示例 1: 基于 Session 状态的自动路由');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessionId = 'default';
  const task = '修复登录页面的验证码无法显示问题';
  
  // 获取智能路由方案
  const plan = await SessionRouter.routeBySessionState(sessionId, task, {
    category: 'quick'
  });
  
  console.log('📊 路由方案:');
  console.log(`   负载: ${(plan.loadFactor * 100).toFixed(1)}%`);
  console.log(`   策略: ${plan.strategy}`);
  console.log(`   主将: ${plan.primary}`);
  console.log(`   副将: ${plan.secondary.join(', ')}`);
  console.log(`   支援: ${plan.support.join(', ')}`);
  console.log(`   原因: ${plan.reason}`);
  console.log(`   预计时间: ${plan.estimatedTime}分钟`);
  
  // 执行分配
  console.log('\n⚔️  开始分配武将...');
  const result = await SessionRouter.executeRouting(sessionId, task, '登录验证码修复');
  
  console.log('\n✅ 分配完成:');
  for (const assign of result.assignments) {
    console.log(`   ${assign.role}: ${assign.agent}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// 示例 2: 使用 Decision Matrix 获取详细决策
// ═══════════════════════════════════════════════════════════════
async function example2_DecisionMatrix() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('示例 2: 决策矩阵 - 详细决策报告');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // 场景 1: 空闲 Session，功能开发
  console.log('场景 1: 空闲 Session + 功能开发');
  const decision1 = DecisionMatrix.decide('idle', 'feature', {
    needsFrontend: true,
    needsBackend: true
  });
  console.log(DecisionMatrix.generateReport(decision1));
  
  // 场景 2: 高负载 Session，Bug 修复
  console.log('\n场景 2: 高负载 Session + Bug 修复');
  const decision2 = DecisionMatrix.decide('heavy', 'bugfix', {});
  console.log(DecisionMatrix.generateReport(decision2));
  
  // 场景 3: 过载 Session
  console.log('\n场景 3: 过载 Session + 代码重构');
  const decision3 = DecisionMatrix.decide('overloaded', 'refactor', {});
  console.log(DecisionMatrix.generateReport(decision3));
}

// ═══════════════════════════════════════════════════════════════
// 示例 3: 使用 Session Monitor 实时监控
// ═══════════════════════════════════════════════════════════════
async function example3_SessionMonitor() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('示例 3: Session 实时监控');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessionId = 'default';
  
  // 方式 1: 快速启动监控
  console.log('启动 Session 监控...');
  const monitor = await monitorSession(sessionId);
  
  // 监听事件
  monitor.on('update', (data) => {
    console.log(`\n📊 监控更新: 负载 ${(data.analysis.loadFactor * 100).toFixed(1)}%`);
    
    // 显示推荐
    if (data.recommendations.length > 0) {
      console.log('🎯 武将推荐:');
      for (const rec of data.recommendations) {
        console.log(`   ${rec.icon} ${rec.title}`);
        for (const agent of rec.agents) {
          console.log(`      - ${agent.name} (${agent.role})`);
        }
      }
    }
  });
  
  monitor.on('overload', (data) => {
    console.log(`\n⚠️  警告: Session ${data.sessionId} 过载!`);
    console.log(`   活跃武将: ${data.activeCount}`);
    console.log(`   负载: ${(data.loadFactor * 100).toFixed(1)}%`);
  });
  
  // 方式 2: 立即获取推荐
  console.log('\n获取当前推荐...');
  const recommendations = await getRecommendations(sessionId);
  
  console.log('当前可用武将:');
  for (const rec of recommendations) {
    console.log(`\n${rec.icon} ${rec.title}`);
    console.log(`   ${rec.description}`);
    for (const agent of rec.agents) {
      console.log(`   - ${agent.name}`);
    }
  }
  
  // 等待 10 秒后停止
  console.log('\n监控运行中 (10秒)...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  monitor.stop();
  console.log('\n监控已停止');
  
  // 显示统计
  const stats = monitor.getStats();
  console.log('\n监控统计:');
  console.log(`   总检查次数: ${stats.totalChecks}`);
  console.log(`   过载次数: ${stats.overloadCount}`);
  console.log(`   调整次数: ${stats.adjustmentCount}`);
}

// ═══════════════════════════════════════════════════════════════
// 示例 4: 综合使用 - 智能任务执行
// ═══════════════════════════════════════════════════════════════
async function example4_CompleteWorkflow() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('示例 4: 综合使用 - 智能工作流');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const sessionId = 'default';
  const task = '实现用户管理功能，包括列表和编辑';
  
  // 1. 初始化 Session
  console.log('1. 初始化 Session...');
  await init('', sessionId);
  
  // 2. 启动监控
  console.log('2. 启动实时监控...');
  const monitor = new SessionMonitor(sessionId);
  monitor.start();
  
  // 3. 获取决策方案
  console.log('3. 分析任务并决策...');
  const decision = DecisionMatrix.decide('idle', 'feature', {
    needsFrontend: true,
    needsBackend: true,
    needsDatabase: true
  });
  
  console.log(DecisionMatrix.generateReport(decision));
  
  // 4. 根据决策分配武将
  console.log('\n4. 分配武将执行任务...');
  
  if (decision.assignments.length > 0) {
    // 开始任务
    const primary = decision.assignments.find(a => a.priority === 1);
    if (primary) {
      await startTask(primary.agent, task, '用户管理功能开发');
    }
    
    // 分配其他武将
    for (const assign of decision.assignments) {
      if (assign.priority > 1) {
        await assignAgent(assign.agent, assign.task);
      }
    }
    
    // 5. 模拟任务执行
    console.log('\n5. 任务执行中...');
    for (let progress = 0; progress <= 100; progress += 20) {
      await updateProgress(progress, `阶段 ${progress / 20 + 1}`);
      await logMessage('zhaoyun', '赵云', `完成 ${progress}%`);
      await new Promise(r => setTimeout(r, 500));
    }
    
    // 6. 完成任务
    console.log('\n6. 完成任务...');
    await completeTask();
  }
  
  // 7. 停止监控
  monitor.stop();
  
  console.log('\n✅ 工作流完成!');
}

// ═══════════════════════════════════════════════════════════════
// 运行示例
// ═══════════════════════════════════════════════════════════════
async function main() {
  // 确保服务器在运行
  console.log('🏰 UltraWork 智能调度系统示例');
  console.log('================================\n');
  
  try {
    // 运行示例（选择要运行的示例）
    // await example1_AutoRouting();
    // await example2_DecisionMatrix();
    // await example3_SessionMonitor();
    await example4_CompleteWorkflow();
    
  } catch (e) {
    console.error('错误:', e.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().then(() => {
    console.log('\n示例执行完毕');
    process.exit(0);
  }).catch(e => {
    console.error('执行失败:', e);
    process.exit(1);
  });
}

module.exports = {
  example1_AutoRouting,
  example2_DecisionMatrix,
  example3_SessionMonitor,
  example4_CompleteWorkflow
};
