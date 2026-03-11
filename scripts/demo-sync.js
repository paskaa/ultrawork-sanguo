/**
 * UltraWork 状态同步演示
 * 演示如何使用 state-sync 模块记录任务执行
 */

const sync = require('./state-sync');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log('='.repeat(60));
  console.log('  UltraWork 状态同步演示');
  console.log('='.repeat(60));
  console.log();

  // 1. 开始任务
  console.log('>>> 步骤1: 开始任务');
  await sync.startTask('搜索 Vue 文件中的 Element Plus 组件');
  await sleep(500);

  // 2. 诸葛亮分析意图
  console.log('>>> 步骤2: 诸葛亮分析任务');
  await sync.updatePhase('analysis', 'running', 'zhugeliang');
  await sync.agentStart('zhugeliang', '意图分析');
  await sync.log('zhugeliang', '接收任务: 搜索 Vue 文件中的 Element Plus 组件', 'thinking');
  await sync.log('zhugeliang', '分析需求: 需要统计组件使用频率', 'thinking');
  await sync.agentProgress('zhugeliang', 50);
  await sleep(800);
  await sync.log('zhugeliang', '指派司马懿执行代码搜索', 'action');
  await sync.agentComplete('zhugeliang');
  await sync.updatePhase('analysis', 'completed');
  await sync.updateProgress(10);
  await sleep(500);

  // 3. 司马懿搜索代码
  console.log('>>> 步骤3: 司马懿搜索代码库');
  await sync.updatePhase('planning', 'running', 'simayi');
  await sync.agentStart('simayi', '搜索代码库');
  await sync.log('simayi', '开始搜索 D:\\his 下所有 Vue 文件', 'action');
  await sync.agentProgress('simayi', 20);
  await sleep(600);
  await sync.log('simayi', '执行命令: glob **/*.vue', 'action');
  await sync.agentProgress('simayi', 40);
  await sleep(600);
  await sync.log('simayi', '找到 624 个 Vue 文件', 'action');
  await sync.log('simayi', '开始分析 Element Plus 组件使用情况...', 'thinking');
  await sync.agentProgress('simayi', 60);
  await sleep(600);
  await sync.log('simayi', '搜索 el-table: 4,621 次', 'action');
  await sync.log('simayi', '搜索 el-form: 3,216 次', 'action');
  await sync.log('simayi', '搜索 el-button: 2,134 次', 'action');
  await sync.agentProgress('simayi', 80);
  await sleep(600);
  await sync.log('simayi', '统计完成，共发现 21,255+ 个组件引用', 'action');
  await sync.log('simayi', '生成执行报告', 'modify');
  await sync.agentComplete('simayi');
  await sync.updatePhase('planning', 'completed');
  await sync.updateProgress(35);
  await sleep(500);

  // 4. 赵云执行统计
  console.log('>>> 步骤4: 赵云统计组件分布');
  await sync.agentStart('zhaoyun', '数据统计');
  await sync.log('zhaoyun', '接收司马懿的数据，开始整理统计结果', 'thinking');
  await sync.agentProgress('zhaoyun', 30);
  await sleep(500);
  await sync.log('zhaoyun', '按组件类型分组统计...', 'action');
  await sync.agentProgress('zhaoyun', 60);
  await sleep(500);
  await sync.log('zhaoyun', '表格组件占比最高: 21.8%', 'action');
  await sync.log('zhaoyun', '表单组件次之: 15.1%', 'action');
  await sync.agentProgress('zhaoyun', 90);
  await sleep(500);
  await sync.log('zhaoyun', '生成可视化报表', 'modify');
  await sync.agentComplete('zhaoyun');
  await sync.updateProgress(60);
  await sleep(500);

  // 5. 关羽审查
  console.log('>>> 步骤5: 关羽代码审查');
  await sync.updatePhase('review', 'running', 'guanyu');
  await sync.agentStart('guanyu', '代码审查');
  await sync.log('guanyu', '开始审查统计脚本的代码质量', 'thinking');
  await sync.agentProgress('guanyu', 50);
  await sleep(600);
  await sync.log('guanyu', '检查 glob 搜索逻辑', 'action');
  await sync.log('guanyu', '检查 grep 正则表达式', 'action');
  await sync.agentProgress('guanyu', 90);
  await sleep(600);
  await sync.log('guanyu', '审查通过: 代码规范符合要求', 'action');
  await sync.agentComplete('guanyu');
  await sync.updatePhase('review', 'completed');
  await sync.updateProgress(75);
  await sleep(500);

  // 6. 徐庶测试
  console.log('>>> 步骤6: 徐庶测试验证');
  await sync.updatePhase('test', 'running', 'xushu');
  await sync.agentStart('xushu', '测试验证');
  await sync.log('xushu', '编写测试用例验证统计结果', 'thinking');
  await sync.agentProgress('xushu', 30);
  await sleep(600);
  await sync.log('xushu', '运行测试: test/element-stats.spec.js', 'action');
  await sync.agentProgress('xushu', 70);
  await sleep(600);
  await sync.log('xushu', '测试通过: 5/5', 'action');
  await sync.agentComplete('xushu');
  await sync.updatePhase('test', 'completed');
  await sync.updateProgress(90);
  await sleep(500);

  // 7. 满宠监控
  console.log('>>> 步骤7: 满宠监控确认');
  await sync.updatePhase('monitor', 'running', 'manchong');
  await sync.agentStart('manchong', '监控确认');
  await sync.log('manchong', '汇总三方情报，检查执行日志', 'thinking');
  await sync.agentProgress('manchong', 50);
  await sleep(500);
  await sync.log('manchong', '所有将领执行正常，无异常', 'action');
  await sync.agentComplete('manchong');
  await sync.updatePhase('monitor', 'completed');
  await sync.updateProgress(100);
  await sleep(500);

  // 8. 完成任务
  console.log('>>> 步骤8: 任务完成');
  await sync.completeTask('completed');

  console.log();
  console.log('='.repeat(60));
  console.log('  演示完成！');
  console.log('  请访问 http://localhost:3459 查看 Web 面板');
  console.log('='.repeat(60));
}

// 运行演示
demo().catch(err => {
  console.error('演示出错:', err);
  process.exit(1);
});
