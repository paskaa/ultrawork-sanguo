#!/usr/bin/env node

/**
 * UltraWork 系统状态查询工具
 * 显示可用将领、任务统计和系统配置
 */

const fs = require('fs');
const path = require('path');

// 用户级别 UltraWork 根目录
const ULTRAWORK_ROOT = path.join(__dirname, '..');

/**
 * 读取将领配置
 */
function getAgents() {
  const agentsDir = path.join(ULTRAWORK_ROOT, 'agents');
  const agents = [];

  try {
    const files = fs.readdirSync(agentsDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
        const name = file.replace('.md', '');
        
        // 解析 frontmatter (支持 Windows \r\n 和 Unix \n)
        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1].replace(/\r/g, '');
          const descriptionLine = frontmatter.match(/description:\s*(.+)/);
          const model = frontmatter.match(/model:\s*(.+)/)?.[1] || 'default';
          
          if (descriptionLine) {
            const description = descriptionLine[1];
            
            // 简化解析：按 " - " 分割
            const parts = description.split(' - ');
            
            if (parts.length >= 2) {
              // 第一部分：中文名（可能包含括号）
              const namePart = parts[0].trim();
              
              // 第二部分：角色描述（取第一句）
              const rolePart = parts[1].split('。')[0].trim();
              
              agents.push({
                id: name,
                name: namePart,
                role: rolePart,
                model: model
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('读取将领配置失败:', e.message);
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}

/**
 * 读取任务类别
 */
function getCategories() {
  const categoriesDir = path.join(ULTRAWORK_ROOT, 'categories');
  const categories = [];

  try {
    if (fs.existsSync(categoriesDir)) {
      const files = fs.readdirSync(categoriesDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = fs.readFileSync(path.join(categoriesDir, file), 'utf-8');
          const name = file.replace('.md', '');
          
          const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1].replace(/\r/g, '');
            const description = frontmatter.match(/description:\s*(.+)/)?.[1] || '';
            const primaryAgent = frontmatter.match(/primary_agent:\s*(.+)/)?.[1] || '';
            
            categories.push({
              id: name,
              description: description,
              primaryAgent: primaryAgent
            });
          }
        }
      }
    }
  } catch (e) {
    // 忽略错误
  }

  return categories;
}

/**
 * 获取任务统计
 */
function getTaskStats() {
  return {
    totalExecuted: 0,
    successCount: 0,
    failCount: 0,
    pendingCount: 0
  };
}

/**
 * 获取将领图标
 */
function getAgentIcon(id) {
  const icons = {
    'zhugeliang': '🎯',
    'zhaoyun': '⚔️',
    'zhouyu': '📜',
    'simayi': '🔍',
    'guanyu': '🛡️',
    'zhangfei': '🔥',
    'manchong': '👁️',
    'chengyu': '📱',
    'jiaxu': '💻',
    'xushu': '✅',
    'gaoshun': '🎨',
    'chendao': '🔧',
    'lusu': '📦',
    'huanggai': '🚀',
    'machao': '🏇',
    'madai': '🛡️',
    'guanping': '📋',
    'zhoucang': '🔒',
    'leixu': '🔎',
    'wulan': '⚡',
    'pangde': '🎯',
    'simashi': '🔬',
    'simazhao': '📝'
  };
  return icons[id] || '👤';
}

/**
 * 打印系统状态
 */
function printSystemStatus() {
  const agents = getAgents();
  const categories = getCategories();
  const stats = getTaskStats();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║   🏰 UltraWork 三国军团 - 系统状态查询                        ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // 系统信息
  console.log('📊 系统信息');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  版本: 1.6.1`);
  console.log(`  平台: OpenCode (用户级别)`);
  console.log(`  插件路径: C:/Users/Administrator/.opencode/plugins/`);
  console.log(`  状态: 🟢 就绪`);
  console.log('');

  // 任务统计
  console.log('📈 任务统计');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  总执行任务: ${stats.totalExecuted}`);
  console.log(`  成功: ${stats.successCount} ✅`);
  console.log(`  失败: ${stats.failCount} ❌`);
  console.log(`  待处理: ${stats.pendingCount} ⏳`);
  console.log('');

  // 可用将领
  console.log(`🎖️  可用将领 (${agents.length}位)`);
  console.log('─────────────────────────────────────────────────────────────');
  
  // 按角色分组
  const groups = {
    '主帅调度': [],
    '战略规划': [],
    '深度执行': [],
    '情报侦察': [],
    '质量守护': [],
    '快速修复': [],
    '前端专家': [],
    '后端专家': [],
    '其他': []
  };

  agents.forEach(agent => {
    const role = agent.role.toLowerCase();
    if (role.includes('主帅') || role.includes('调度')) groups['主帅调度'].push(agent);
    else if (role.includes('规划') || role.includes('大都督')) groups['战略规划'].push(agent);
    else if (role.includes('执行') || role.includes('大将')) groups['深度执行'].push(agent);
    else if (role.includes('情报') || role.includes('侦察') || role.includes('探索')) groups['情报侦察'].push(agent);
    else if (role.includes('质量') || role.includes('审查')) groups['质量守护'].push(agent);
    else if (role.includes('修复') || role.includes('突击')) groups['快速修复'].push(agent);
    else if (role.includes('前端')) groups['前端专家'].push(agent);
    else if (role.includes('后端')) groups['后端专家'].push(agent);
    else groups['其他'].push(agent);
  });

  for (const [groupName, groupAgents] of Object.entries(groups)) {
    if (groupAgents.length > 0) {
      console.log(`\n  【${groupName}】`);
      groupAgents.forEach(agent => {
        const icon = getAgentIcon(agent.id);
        const roleDisplay = agent.role.length > 30 ? agent.role.slice(0, 30) + '...' : agent.role;
        console.log(`    ${icon} ${agent.name.padEnd(12)} ${roleDisplay.padEnd(32)} ${agent.model}`);
      });
    }
  }
  console.log('');

  // 任务类别
  if (categories.length > 0) {
    console.log(`📋 任务类别 (${categories.length}类)`);
    console.log('─────────────────────────────────────────────────────────────');
    categories.forEach(cat => {
      console.log(`  • ${cat.id.padEnd(20)} ${cat.description.slice(0, 40)}`);
    });
    console.log('');
  }

  // 使用说明
  console.log('💡 使用说明');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  触发命令:');
  console.log('    /uls <任务>          查询系统状态');
  console.log('    /ulw <任务>          执行 UltraWork 任务');
  console.log('');
  console.log('  状态栏:');
  console.log('    状态栏会在任务执行时自动显示');
  console.log('    包含: 进度条、将领状态、执行日志');
  console.log('');
  console.log('  模型配置:');
  console.log('    已配置多个百炼模型: GLM-5, Qwen3.5-Plus, MiniMax-M2.5, Qwen-Coder');
  console.log('    根据任务类型自动选择最优模型');
  console.log('');
}

// 执行
printSystemStatus();