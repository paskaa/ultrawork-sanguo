/**
 * 真实任务监控测试
 * 使用 monitored-task.js 包装器捕获真实 Task 执行
 */

const { monitoredTask, monitoredWorkflow } = require('./monitored-task');

async function testRealTask() {
  console.log('='.repeat(60));
  console.log('  真实 Task 监控测试');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // 执行一个真实的简单任务
    const result = await monitoredTask(
      'simayi',  // 将领ID
      '检查当前目录文件数',  // 任务描述
      '请使用 bash 工具执行 "ls -la | wc -l" 命令，返回当前目录的文件数量。',  // 提示词
      { subagent_type: 'simayi' }
    );
    
    console.log('\n✅ 任务执行结果:', result);
    
  } catch (error) {
    console.error('\n❌ 任务执行失败:', error.message);
    console.log('\n注意: 如果失败是因为 task 函数不存在，这是正常的。');
    console.log('OpenCode 的 task 函数是在运行时由 OpenCode 环境提供的。');
  }
}

// 测试工作流
async function testWorkflow() {
  console.log('\n' + '='.repeat(60));
  console.log('  测试工作流');
  console.log('='.repeat(60));
  console.log();
  
  const workflow = [
    {
      agentId: 'simayi',
      description: '探索代码库结构',
      prompt: '请搜索当前目录下的所有 JavaScript 文件，并统计文件数量。',
      options: { subagent_type: 'simayi' }
    },
    {
      agentId: 'zhaoyun',
      description: '分析代码复杂度',
      prompt: '请检查是否有 package.json 文件，如果有，读取 dependencies 字段。',
      options: { subagent_type: 'zhaoyun' }
    }
  ];
  
  try {
    await monitoredWorkflow('代码库分析', workflow);
  } catch (error) {
    console.error('工作流失败:', error.message);
  }
}

// 运行测试
testRealTask().then(() => {
  console.log('\n测试完成');
}).catch(err => {
  console.error('测试出错:', err);
});
