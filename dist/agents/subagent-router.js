/**
 * Subagent Type Router - OpenCode 内置类型路由器
 * 将 OpenCode 内置 subagent 类型映射到 UltraWork 三国军团武将
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 内置类型到武将的默认映射
const DEFAULT_SUBAGENT_MAPPINGS = {
  explore: {
    agent: 'simayi',
    category: 'explore',
    description: '代码探索、信息收集 → 司马懿 (仲达)',
    supportAgents: ['simashi', 'simazhao']
  },
  'code-reviewer': {
    agent: 'guanyu',
    category: 'review',
    description: '代码审查、质量把关 → 关羽 (云长)',
    supportAgents: ['guanping', 'zhoucang']
  },
  'tdd-guide': {
    agent: 'xushu',
    category: 'test',
    description: '测试驱动开发 → 徐庶 (元直)',
    supportAgents: ['panglin', 'yanyan']
  },
  'security-reviewer': {
    agent: 'yujin',
    category: 'security',
    description: '安全审计、漏洞扫描 → 于禁 (文则)',
    supportAgents: ['maojie', 'dongzhao']
  },
  'refactor-cleaner': {
    agent: 'simayi',
    category: 'explore',
    description: '死代码清理、重构 → 司马懿 (仲达)',
    supportAgents: ['simashi', 'simazhao']
  },
  'python-reviewer': {
    agent: 'chendao',
    category: 'deep',
    description: 'Python代码审查 → 陈到 (叔至)',
    supportAgents: []
  },
  'go-reviewer': {
    agent: 'chendao',
    category: 'deep',
    description: 'Go代码审查 → 陈到 (叔至)',
    supportAgents: []
  },
  'go-build-resolver': {
    agent: 'chendao',
    category: 'quick',
    description: 'Go构建错误修复 → 陈到 (叔至)',
    supportAgents: []
  },
  'e2e-runner': {
    agent: 'liuye',
    category: 'monitor',
    description: 'E2E测试、Playwright → 刘晔 (子扬)',
    supportAgents: []
  },
  'doc-updater': {
    agent: 'simazhao',
    category: 'writing',
    description: '文档更新、codemap → 司马昭 (子上)',
    supportAgents: []
  },
  'database-reviewer': {
    agent: 'zhangliao',
    category: 'database',
    description: 'PostgreSQL审查 → 张辽 (文远)',
    supportAgents: ['yuejin', 'lidian']
  },
  'build-error-resolver': {
    agent: 'zhangfei',
    category: 'quick',
    description: '构建错误修复 → 张飞 (翼德)',
    supportAgents: ['leixu', 'wulan']
  },
  'loop-operator': {
    agent: 'zhugeliang',
    category: 'ultrabrain',
    description: 'Agent循环操作 → 诸葛亮 (孔明)',
    supportAgents: []
  },
  'harness-optimizer': {
    agent: 'zhouyu',
    category: 'ultrabrain',
    description: 'Harness优化 → 周瑜 (公瑾)',
    supportAgents: ['lusu', 'huanggai']
  },
  planner: {
    agent: 'zhouyu',
    category: 'ultrabrain',
    description: '任务规划 → 周瑜 (公瑾)',
    supportAgents: ['lusu', 'huanggai']
  },
  architect: {
    agent: 'zhouyu',
    category: 'ultrabrain',
    description: '架构设计 → 周瑜 (公瑾)',
    supportAgents: ['lusu', 'huanggai']
  }
};

let customMappings = null;

/**
 * 加载自定义映射配置
 */
function loadCustomMappings(configPath) {
  if (customMappings) return customMappings;
  
  try {
    const mappingPath = configPath 
      ? path.join(configPath, 'subagent-mapping.json')
      : path.join(process.cwd(), 'config', 'subagent-mapping.json');
    
    if (fs.existsSync(mappingPath)) {
      const content = fs.readFileSync(mappingPath, 'utf-8');
      const config = JSON.parse(content);
      customMappings = config.mappings || {};
      console.log(`[SubagentRouter] 已加载自定义映射: ${Object.keys(customMappings).length} 个类型`);
      return customMappings;
    }
  } catch (error) {
    console.log('[SubagentRouter] 未找到自定义映射配置，使用默认映射');
  }
  
  customMappings = {};
  return customMappings;
}

/**
 * 获取完整的映射配置（默认 + 自定义）
 */
export function getSubagentMappings(configPath) {
  const custom = loadCustomMappings(configPath);
  return { ...DEFAULT_SUBAGENT_MAPPINGS, ...custom };
}

/**
 * 检查是否为 OpenCode 内置类型
 */
export function isBuiltInSubagentType(type) {
  if (!type) return false;
  const normalizedType = type.toLowerCase();
  return Object.keys(DEFAULT_SUBAGENT_MAPPINGS).some(
    key => key.toLowerCase() === normalizedType
  );
}

/**
 * 根据 subagent_type 路由到武将
 * @param {string} subagentType - OpenCode 内置类型
 * @param {object} config - UltraWork 配置
 * @param {string} configPath - 配置文件路径
 * @returns {object|null} - 路由结果
 */
export function routeBySubagentType(subagentType, config, configPath) {
  if (!subagentType) return null;
  
  const mappings = getSubagentMappings(configPath);
  const normalizedType = subagentType.toLowerCase();
  
  // 查找匹配的映射
  const mapping = Object.entries(mappings).find(
    ([key]) => key.toLowerCase() === normalizedType
  )?.[1];
  
  if (!mapping) return null;
  
  // 获取 agent 配置
  const agents = config?.agents || {};
  const agentConfig = agents[mapping.agent];
  const categories = config?.categories || {};
  const categoryConfig = categories[mapping.category];
  
  return {
    agent: mapping.agent,
    category: mapping.category,
    description: mapping.description,
    primaryAgent: mapping.agent,
    supportAgents: mapping.supportAgents || [],
    model: categoryConfig?.model || agentConfig?.model,
    fallbackModels: categoryConfig?.fallback_models || agentConfig?.fallback_models || [],
    isBuiltInType: true,
    subagentType: subagentType
  };
}

/**
 * 获取所有支持的 OpenCode 内置类型
 */
export function getSupportedSubagentTypes(configPath) {
  const mappings = getSubagentMappings(configPath);
  return Object.keys(mappings);
}

/**
 * 获取类型到武将的反向查找表
 */
export function getReverseLookup(configPath) {
  const mappings = getSubagentMappings(configPath);
  const reverse = {};
  
  Object.entries(mappings).forEach(([type, mapping]) => {
    if (!reverse[mapping.agent]) {
      reverse[mapping.agent] = [];
    }
    reverse[mapping.agent].push(type);
  });
  
  return reverse;
}

/**
 * 打印路由映射表（用于调试）
 */
export function printRoutingTable(configPath) {
  const mappings = getSubagentMappings(configPath);
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     OpenCode 内置类型 → UltraWork 武将 映射表            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  
  Object.entries(mappings).forEach(([type, mapping]) => {
    const supportStr = mapping.supportAgents?.length > 0 
      ? ` + ${mapping.supportAgents.join(', ')}`
      : '';
    console.log(`║ ${type.padEnd(20)} → ${mapping.agent.padEnd(12)}${supportStr}`);
  });
  
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

export default {
  routeBySubagentType,
  isBuiltInSubagentType,
  getSubagentMappings,
  getSupportedSubagentTypes,
  getReverseLookup,
  printRoutingTable
};
