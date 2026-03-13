#!/usr/bin/env node
/**
 * 修复配置中的重复fallback模型
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'ultrawork-sanguo.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

let fixedCount = 0;

// 修复agents的fallback_models
for (const [agentName, agentConfig] of Object.entries(config.agents)) {
  if (!agentConfig.fallback_models) continue;
  
  // 移除与主模型重复的fallback
  const uniqueFallbacks = [];
  const seen = new Set();
  
  // 先添加主模型到已见集合
  seen.add(agentConfig.model);
  
  for (const model of agentConfig.fallback_models) {
    if (!seen.has(model)) {
      uniqueFallbacks.push(model);
      seen.add(model);
    }
  }
  
  if (uniqueFallbacks.length !== agentConfig.fallback_models.length) {
    console.log(`🔧 修复 ${agentName}: ${agentConfig.fallback_models.length} → ${uniqueFallbacks.length}`);
    agentConfig.fallback_models = uniqueFallbacks;
    fixedCount++;
  }
}

// 保存配置
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

console.log(`\n✅ 修复完成！共修复 ${fixedCount} 个Agent的fallback配置`);
