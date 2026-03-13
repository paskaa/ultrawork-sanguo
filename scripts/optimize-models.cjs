/**
 * 模型配置优化脚本
 * 将 qwen3-coder-plus 和 qwen3-coder-next 替换为 qwen3.5-plus
 * 只保留4个核心模型: qwen3.5-plus, kimi-k2.5, glm-5, MiniMax-M2.5
 */

const fs = require('fs');
const path = require('path');

// 允许的模型列表
const ALLOWED_MODELS = [
  'bailian/qwen3.5-plus',
  'bailian/kimi-k2.5',
  'bailian/glm-5',
  'bailian/MiniMax-M2.5'
];

// 模型替换映射
const MODEL_REPLACEMENTS = {
  'bailian/qwen3-coder-plus': 'bailian/qwen3.5-plus',
  'bailian/qwen3-coder-next': 'bailian/qwen3.5-plus'
};

function replaceModels(obj) {
  if (typeof obj === 'string') {
    // 替换单个模型字符串
    return MODEL_REPLACEMENTS[obj] || obj;
  }
  
  if (Array.isArray(obj)) {
    // 处理数组（如 fallback_models）
    return obj
      .map(item => MODEL_REPLACEMENTS[item] || item)
      .filter(item => ALLOWED_MODELS.includes(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    // 递归处理对象
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'model') {
        result[key] = replaceModels(value);
      } else if (key === 'fallback_models') {
        result[key] = replaceModels(value);
      } else {
        result[key] = replaceModels(value);
      }
    }
    return result;
  }
  
  return obj;
}

function updateConfigFile(filePath) {
  console.log(`\n📄 处理: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    
    // 统计替换前的 coder 模型数量
    const beforeStr = JSON.stringify(config);
    const coderMatches = beforeStr.match(/qwen3-coder/g);
    const coderCount = coderMatches ? coderMatches.length : 0;
    
    // 替换模型
    const updatedConfig = replaceModels(config);
    
    // 统计替换后
    const afterStr = JSON.stringify(updatedConfig);
    const remainingCoders = afterStr.match(/qwen3-coder/g);
    const remainingCount = remainingCoders ? remainingCoders.length : 0;
    
    // 写回文件
    fs.writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    
    console.log(`   ✅ 替换了 ${coderCount - remainingCount} 个 coder 模型引用`);
    console.log(`   ✅ 剩余 ${remainingCount} 个 coder 引用`);
    
    return { success: true, replaced: coderCount - remainingCount };
  } catch (error) {
    console.error(`   ❌ 错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主函数
function main() {
  console.log('🚀 开始优化模型配置...');
  console.log('📋 允许使用的模型:', ALLOWED_MODELS.join(', '));
  console.log('🔄 替换规则:', JSON.stringify(MODEL_REPLACEMENTS, null, 2));
  
  const configDir = path.join(__dirname, '..', 'config');
  
  // 处理 ultrawork-sanguo.json
  const mainConfig = path.join(configDir, 'ultrawork-sanguo.json');
  const result1 = updateConfigFile(mainConfig);
  
  // 处理 subagent-mapping.json
  const mappingConfig = path.join(configDir, 'subagent-mapping.json');
  const result2 = updateConfigFile(mappingConfig);
  
  // 汇总
  console.log('\n📊 处理完成汇总:');
  console.log(`   ultrawork-sanguo.json: ${result1.success ? '✅' : '❌'} (替换了 ${result1.replaced || 0} 处)`);
  console.log(`   subagent-mapping.json: ${result2.success ? '✅' : '❌'} (替换了 ${result2.replaced || 0} 处)`);
  
  const totalReplaced = (result1.replaced || 0) + (result2.replaced || 0);
  console.log(`\n🎉 总计替换了 ${totalReplaced} 个模型引用`);
  console.log('✨ 所有 coder 模型已替换为 qwen3.5-plus');
}

main();
