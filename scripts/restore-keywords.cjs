#!/usr/bin/env node
/**
 * 从schema.ts恢复categories.keywords到JSON配置
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'ultrawork-sanguo.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 定义keywords映射
const keywordsMap = {
  'visual-engineering': ['UI', 'Vue', '前端', '组件', '页面', '界面', '样式', 'CSS', '交互', '布局', 'element', '设计'],
  'deep': ['重构', '架构', '实现', '开发', '复杂', '功能', '模块', '系统', '集成'],
  'quick': ['修复', 'bug', 'fix', '修改', '更新', '改', 'typo', '错', '问题'],
  'ultrabrain': ['设计', '方案', '决策', '架构', '规划', '思考', '分析', '策略', '评估'],
  'review': ['review', '审查', '检查', '质量', '优化', '重构建议', 'Code Review'],
  'explore': ['搜索', '查找', '定位', '找到', 'search', 'find', 'locate', 'grep'],
  'writing': ['文档', 'doc', 'readme', '说明', '注释', '文档化', 'document'],
  'reserve': ['特殊', '实验', '备用', '支援', 'reserve'],
  'monitor': ['监控', '日志', '异常', '告警', 'E2E', '测试', 'console', 'network', 'API错误', '系统资源'],
  'test': ['测试', 'test', '单元测试', '集成测试', '覆盖率', 'JUnit', 'Vitest', '写测试'],
  'fileops': ['迁移', '整合', '合并', '备份', '文件操作', '目录', 'move', 'merge', 'backup'],
  'devops': ['DevOps', 'CI/CD', 'Jenkins', 'Docker', 'K8s', 'Kubernetes', '部署', '自动化', '容器'],
  'database': ['数据库', 'SQL', 'MySQL', 'PostgreSQL', '索引', '优化', '迁移', 'ETL'],
  'security': ['安全', 'Security', '渗透测试', '漏洞', '扫描', '加密', '审计', '认证'],
  'performance': ['性能', '优化', 'Profiling', 'JVM', '调优', '压力测试', '容量', '并发'],
  'mobile': ['iOS', 'Android', '移动端', 'App', 'Flutter', 'React Native', 'Swift', 'Kotlin'],
  'api': ['API', 'RESTful', 'GraphQL', '接口', 'Swagger', '接口文档', '版本管理'],
  'ai': ['AI', '机器学习', '深度学习', 'ML', '推荐系统', 'NLP', 'TensorFlow', 'PyTorch'],
  'web3': ['Web3', '区块链', '智能合约', 'Solidity', 'DApp', 'DeFi', 'Ethereum']
};

let fixedCount = 0;

// 恢复keywords
for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
  const keywords = keywordsMap[categoryName];
  if (keywords && (!categoryConfig.keywords || categoryConfig.keywords.length === 0)) {
    categoryConfig.keywords = keywords;
    console.log(`🔧 恢复 ${categoryName}: ${keywords.length} 个关键词`);
    fixedCount++;
  }
}

// 保存配置
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

console.log(`\n✅ 恢复完成！共恢复 ${fixedCount} 个类别的keywords`);
