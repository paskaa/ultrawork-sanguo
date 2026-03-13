#!/usr/bin/env node
/**
 * 将主力模型改为 glm-5
 * 原qwen3.5-plus的Agent改为glm-5，fallback中加入qwen3.5-plus
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'ultrawork-sanguo.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const ALLOWED_MODELS = [
  'bailian/glm-5',          // 主力模型
  'bailian/qwen3.5-plus',   //  fallback
  'bailian/kimi-k2.5',      // 长文本
  'bailian/MiniMax-M2.5'    // 快速
];

let changedCount = 0;

// 更新agents
for (const [agentName, agentConfig] of Object.entries(config.agents)) {
  const oldModel = agentConfig.model;
  
  // 如果当前是qwen3.5-plus，改为glm-5
  if (agentConfig.model === 'bailian/qwen3.5-plus') {
    agentConfig.model = 'bailian/glm-5';
    
    // 更新fallback: glm-5 -> qwen3.5-plus -> MiniMax-M2.5
    agentConfig.fallback_models = [
      'bailian/qwen3.5-plus',
      'bailian/MiniMax-M2.5'
    ];
    
    console.log(`🔧 ${agentName}: ${oldModel} → glm-5`);
    changedCount++;
  }
  // 如果当前是glm-5，fallback改为qwen3.5-plus优先
  else if (agentConfig.model === 'bailian/glm-5') {
    agentConfig.fallback_models = [
      'bailian/qwen3.5-plus',
      'bailian/MiniMax-M2.5'
    ];
  }
  // 如果当前是MiniMax-M2.5，fallback改为glm-5优先
  else if (agentConfig.model === 'bailian/MiniMax-M2.5') {
    agentConfig.fallback_models = [
      'bailian/glm-5',
      'bailian/qwen3.5-plus'
    ];
  }
  // 如果当前是kimi-k2.5，fallback改为glm-5优先
  else if (agentConfig.model === 'bailian/kimi-k2.5') {
    agentConfig.fallback_models = [
      'bailian/glm-5',
      'bailian/qwen3.5-plus',
      'bailian/MiniMax-M2.5'
    ];
  }
}

// 更新categories
for (const [catName, catConfig] of Object.entries(config.categories)) {
  if (catConfig.model === 'bailian/qwen3.5-plus') {
    catConfig.model = 'bailian/glm-5';
    catConfig.fallback_models = [
      'bailian/qwen3.5-plus',
      'bailian/MiniMax-M2.5'
    ];
    console.log(`🔧 类别 ${catName}: qwen3.5-plus → glm-5`);
  }
}

// 保存配置
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

console.log(`\n✅ 主力模型切换完成！`);
console.log(`   - ${changedCount} 个Agent已切换到 glm-5`);
console.log(`   - 新主力: bailian/glm-5 (GLM-5)`);
console.log(`   - fallback顺序: glm-5 → qwen3.5-plus → MiniMax-M2.5`);
