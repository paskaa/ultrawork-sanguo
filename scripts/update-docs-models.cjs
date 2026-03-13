/**
 * 更新文档中的模型引用
 * 将 qwen3-coder-plus/next 替换为 qwen3.5-plus
 */

const fs = require('fs');
const path = require('path');

// 文件列表
const filesToUpdate = [
  'README.md',
  'CHANGELOG.md',
  'dist/config/schema.js'
];

// 替换函数
function updateFile(filePath) {
  console.log(`📄 处理: ${filePath}`);
  
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️ 文件不存在，跳过`);
      return { skipped: true };
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // 统计替换前的 coder 引用
    const coderMatches = content.match(/qwen3-coder[-\w]*/g);
    const beforeCount = coderMatches ? coderMatches.length : 0;
    
    // 执行替换
    content = content.replace(/qwen3-coder-plus/g, 'qwen3.5-plus');
    content = content.replace(/qwen3-coder-next/g, 'qwen3.5-plus');
    
    // 统计替换后
    const remainingMatches = content.match(/qwen3-coder[-\w]*/g);
    const afterCount = remainingMatches ? remainingMatches.length : 0;
    
    // 写回文件
    fs.writeFileSync(fullPath, content, 'utf-8');
    
    const replaced = beforeCount - afterCount;
    if (replaced > 0) {
      console.log(`   ✅ 替换了 ${replaced} 处引用`);
    } else {
      console.log(`   ℹ️ 无需替换`);
    }
    
    return { replaced };
  } catch (error) {
    console.error(`   ❌ 错误: ${error.message}`);
    return { error: error.message };
  }
}

// 主函数
function main() {
  console.log('🚀 开始更新文档中的模型引用...\n');
  
  let totalReplaced = 0;
  
  for (const file of filesToUpdate) {
    const result = updateFile(file);
    if (result.replaced) {
      totalReplaced += result.replaced;
    }
  }
  
  console.log(`\n📊 处理完成`);
  console.log(`🎉 总计替换了 ${totalReplaced} 处引用`);
}

main();
