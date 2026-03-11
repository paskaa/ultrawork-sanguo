/**
 * Monitored Task - 带监控的 Task 执行器
 * 包装 Task 调用，自动记录执行过程到 Web 面板
 * 
 * 使用方法:
 * 1. 在 OpenCode 插件中加载此模块
 * 2. 用 monitoredTask 替代 task 调用
 */

const sync = require('./state-sync');

// Task 函数将由调用者注入
let taskFunction = null;

/**
 * 设置 task 函数（由 OpenCode 插件调用时注入）
 */
function setTaskFunction(fn) {
  taskFunction = fn;
}

/**
 * 执行带监控的 Task
 * @param {string} agentId - 将领ID
 * @param {string} description - 任务描述
 * @param {string} prompt - 任务提示词
 * @param {Object} options - 其他选项
 */
async function monitoredTask(agentId, description, prompt, options = {}) {
  // 检查 task 函数是否已设置
  if (!taskFunction) {
    throw new Error('Task 函数未设置。请先调用 setTaskFunction()');
  }
  
  // 1. 记录开始
  await sync.agentStart(agentId, description);
  await sync.log(agentId, `🚀 开始执行: ${description}`, 'thinking');
  
  const startTime = Date.now();
  
  try {
    // 2. 执行实际任务
    await sync.log(agentId, '⚡ 调用 AI 执行任务...', 'action');
    
    const result = await taskFunction({
      description,
      prompt: `[${agentId}] ${prompt}`,
      subagent_type: options.subagent_type || 'general',
      ...options
    });
    
    // 3. 记录结果
    const duration = Date.now() - startTime;
    await sync.log(agentId, `✅ 执行完成 (${duration}ms)`, 'action');
    
    // 尝试提取结果摘要
    const summary = extractSummary(result);
    if (summary) {
      await sync.log(agentId, `📋 ${summary}`, 'thinking');
    }
    
    await sync.agentComplete(agentId);
    
    return result;
  } catch (error) {
    // 4. 记录错误
    await sync.log(agentId, `❌ 执行失败: ${error.message}`, 'error');
    await sync.agentStart(agentId, description); // 重置状态
    await sync.agentProgress(agentId, 0);
    throw error;
  }
}

/**
 * 提取结果摘要
 */
function extractSummary(result) {
  if (!result) return null;
  
  // 如果是字符串，取前100字符
  if (typeof result === 'string') {
    return result.slice(0, 100) + (result.length > 100 ? '...' : '');
  }
  
  // 如果是对象，尝试找关键字段
  if (typeof result === 'object') {
    const keys = ['summary', 'result', 'output', 'message', 'status'];
    for (const key of keys) {
      if (result[key]) {
        return String(result[key]).slice(0, 100);
      }
    }
  }
  
  return '任务执行完成';
}

/**
 * 批量执行监控任务
 */
async function monitoredWorkflow(workflowName, steps) {
  // 开始工作流
  await sync.startTask(workflowName);
  
  console.log(`\n🏰 UltraWork 工作流: ${workflowName}`);
  console.log('=' .repeat(50));
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const progress = Math.round((i / steps.length) * 100);
    
    console.log(`\n[步骤 ${i + 1}/${steps.length}] ${step.agentId}: ${step.description}`);
    
    await sync.updateProgress(progress);
    
    try {
      const result = await monitoredTask(
        step.agentId,
        step.description,
        step.prompt,
        step.options
      );
      
      console.log(`✅ ${step.agentId} 完成`);
    } catch (error) {
      console.error(`❌ ${step.agentId} 失败:`, error.message);
      await sync.completeTask('failed');
      throw error;
    }
  }
  
  // 完成工作流
  await sync.updateProgress(100);
  await sync.completeTask('completed');
  
  console.log('\n🎉 工作流完成！');
  console.log('=' .repeat(50));
}

module.exports = {
  setTaskFunction,
  monitoredTask,
  monitoredWorkflow
};
