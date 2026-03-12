/**
 * 测试 OpenCode 内置类型到三国武将的映射
 * 运行: node test-subagent-mapping.js
 */

import { 
  routeBySubagentType, 
  isBuiltInSubagentType, 
  getSupportedSubagentTypes,
  printRoutingTable 
} from './dist/agents/subagent-router.js';

// 模拟配置
const mockConfig = {
  agents: {
    simayi: { model: 'bailian/MiniMax-M2.5', description: '司马懿 (仲达)' },
    guanyu: { model: 'bailian/qwen3.5-plus', description: '关羽 (云长)' },
    xushu: { model: 'bailian/glm-5', description: '徐庶 (元直)' },
    yujin: { model: 'bailian/qwen3.5-plus', description: '于禁 (文则)' },
    zhouyu: { model: 'bailian/glm-5', description: '周瑜 (公瑾)' }
  },
  categories: {
    explore: { model: 'bailian/MiniMax-M2.5', primaryAgent: 'simayi' },
    review: { model: 'bailian/qwen3.5-plus', primaryAgent: 'guanyu' },
    test: { model: 'bailian/glm-5', primaryAgent: 'xushu' },
    security: { model: 'bailian/qwen3.5-plus', primaryAgent: 'yujin' },
    ultrabrain: { model: 'bailian/glm-5', primaryAgent: 'zhouyu' }
  }
};

console.log('🏰 UltraWork 三国军团 - OpenCode 内置类型映射测试\n');

// 打印路由表
printRoutingTable();

// 测试每个内置类型
const testTypes = [
  'explore',
  'code-reviewer',
  'tdd-guide',
  'security-reviewer',
  'planner',
  'architect',
  'unknown-type'  // 测试未知类型
];

console.log('🧪 测试路由:\n');
testTypes.forEach(type => {
  const isBuiltIn = isBuiltInSubagentType(type);
  const routing = routeBySubagentType(type, mockConfig);
  
  console.log(`类型: ${type}`);
  console.log(`  是否为内置类型: ${isBuiltIn ? '✅' : '❌'}`);
  
  if (routing) {
    console.log(`  映射武将: ${routing.primaryAgent}`);
    console.log(`  任务类别: ${routing.category}`);
    console.log(`  描述: ${routing.description}`);
    console.log(`  支援将领: ${routing.supportAgents.join(', ') || '无'}`);
  } else {
    console.log(`  映射武将: (未映射，使用默认路由)`);
  }
  console.log('');
});

// 测试支持的类型列表
console.log('📋 支持的内置类型:');
const supportedTypes = getSupportedSubagentTypes();
supportedTypes.forEach(type => {
  console.log(`  - ${type}`);
});

console.log('\n✨ 测试完成!');
