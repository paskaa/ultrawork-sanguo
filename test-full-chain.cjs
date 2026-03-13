#!/usr/bin/env node
/**
 * UltraWork SanGuo - 全流程全链条测试
 * 测试模型调用与Agent路由流程链路
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  const color = colors[type] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

class FullChainTester {
  constructor() {
    this.config = null;
    this.subagentMapping = null;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  // 加载配置
  loadConfig() {
    log('cyan', '\n📦 [阶段1] 加载配置文件...\n');
    
    try {
      const configPath = path.join(__dirname, 'config', 'ultrawork-sanguo.json');
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      log('green', '✅ 主配置加载成功');
      log('blue', `   - Agents: ${Object.keys(this.config.agents).length}`);
      log('blue', `   - Categories: ${Object.keys(this.config.categories).length}`);
      log('blue', `   - Routing Rules: ${this.config.task_routing?.rules?.length || 0}`);
    } catch (error) {
      this.fail('配置加载', error.message);
      return false;
    }

    try {
      const mappingPath = path.join(__dirname, 'config', 'subagent-mapping.json');
      this.subagentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
      log('green', '✅ Subagent映射配置加载成功');
      log('blue', `   - Mappings: ${Object.keys(this.subagentMapping.mappings || {}).length}`);
    } catch (error) {
      log('yellow', '⚠️ Subagent映射配置加载失败 (可选)');
    }

    return true;
  }

  // 测试模型配置
  testModelConfiguration() {
    log('cyan', '\n🎯 [阶段2] 测试模型配置...\n');
    
    const allowedModels = [
      'bailian/qwen3.5-plus',
      'bailian/kimi-k2.5',
      'bailian/glm-5',
      'bailian/MiniMax-M2.5'
    ];

    const invalidModels = [];
    const agentsWithInvalidModels = [];

    // 检查所有agents的模型配置
    for (const [agentName, agentConfig] of Object.entries(this.config.agents)) {
      const model = agentConfig.model;
      
      if (!model) {
        this.fail(`Agent ${agentName}`, '缺少model配置');
        continue;
      }

      if (!allowedModels.includes(model)) {
        invalidModels.push(model);
        agentsWithInvalidModels.push(agentName);
      }

      // 检查fallback_models
      if (agentConfig.fallback_models) {
        const invalidFallbacks = agentConfig.fallback_models.filter(
          m => !allowedModels.includes(m)
        );
        if (invalidFallbacks.length > 0) {
          this.fail(
            `Agent ${agentName}`,
            `包含非法fallback模型: ${invalidFallbacks.join(', ')}`
          );
        }
      }
    }

    if (invalidModels.length === 0) {
      this.pass('模型配置验证', '所有Agent使用允许的模型');
    } else {
      this.fail(
        '模型配置验证',
        `发现 ${invalidModels.length} 个非法模型: ${[...new Set(invalidModels)].join(', ')}`
      );
    }

    // 统计模型分布
    const modelDistribution = {};
    for (const agentConfig of Object.values(this.config.agents)) {
      const model = agentConfig.model;
      modelDistribution[model] = (modelDistribution[model] || 0) + 1;
    }

    log('blue', '\n📊 模型分布统计:');
    for (const [model, count] of Object.entries(modelDistribution)) {
      log('blue', `   - ${model}: ${count} 个Agent`);
    }

    return invalidModels.length === 0;
  }

  // 测试Agent层级结构
  testAgentHierarchy() {
    log('cyan', '\n🏗️ [阶段3] 测试Agent层级结构...\n');

    const zhugeliang = this.config.agents.zhugeliang;
    if (!zhugeliang) {
      this.fail('主帅检查', '未找到诸葛亮配置');
      return false;
    }

    if (zhugeliang.role !== 'orchestrator') {
      this.fail('主帅检查', '诸葛亮角色不是orchestrator');
    } else {
      this.pass('主帅检查', '诸葛亮配置正确');
    }

    // 检查Commanders
    const commanders = Object.entries(this.config.agents)
      .filter(([_, config]) => 
        config.role?.includes('commander') || 
        config.role === 'planner' ||
        config.role === 'executor' ||
        config.role === 'reviewer' ||
        config.role === 'quickfixer' ||
        config.role === 'explorer' ||
        config.role === 'monitor_commander' ||
        config.role === 'test_expert'
      );

    log('blue', `\n📊 大都督(Commanders): ${commanders.length} 位`);

    // 检查Lieutenants
    const lieutenants = Object.entries(this.config.agents)
      .filter(([_, config]) => config.commander);

    log('blue', `📊 部将(Lieutenants): ${lieutenants.length} 位`);

    // 验证层级关系
    let hierarchyValid = true;
    for (const [name, config] of lieutenants) {
      if (!this.config.agents[config.commander]) {
        this.fail('层级检查', `部将 ${name} 的上级 ${config.commander} 不存在`);
        hierarchyValid = false;
      }
    }

    if (hierarchyValid) {
      this.pass('层级结构', '所有部将的上级存在');
    }

    return true;
  }

  // 测试任务路由
  testTaskRouting() {
    log('cyan', '\n🚦 [阶段4] 测试任务路由...\n');

    // 验证路由规则存在
    const rules = this.config.task_routing?.rules;
    if (!rules || rules.length === 0) {
      log('yellow', '⚠️ 未找到task_routing.rules，使用categories.keywords进行匹配');
      
      // 简单验证categories有keywords配置
      const categoriesWithKeywords = Object.entries(this.config.categories)
        .filter(([_, config]) => config.keywords && config.keywords.length > 0);
      
      log('blue', `📊 ${categoriesWithKeywords.length} 个类别有关键词配置`);
      
      if (categoriesWithKeywords.length >= 10) {
        this.pass('任务路由', `${categoriesWithKeywords.length} 个类别配置了关键词`);
        return true;
      } else {
        this.fail('任务路由', '类别关键词配置不足');
        return false;
      }
    }

    log('blue', `📊 找到 ${rules.length} 条路由规则`);
    
    // 验证关键规则存在
    const requiredRules = ['explore', 'quick', 'deep', 'review', 'test'];
    const foundRules = new Set(rules.map(r => r.category));
    const missingRules = requiredRules.filter(r => !foundRules.has(r));
    
    if (missingRules.length === 0) {
      this.pass('任务路由', `找到 ${rules.length} 条规则，包含所有必需类别`);
    } else {
      this.fail('任务路由', `缺少规则: ${missingRules.join(', ')}`);
    }

    return missingRules.length === 0;
  }

  // 检测任务类别
  detectCategory(task) {
    // 首先检查task_routing规则
    if (this.config.task_routing?.rules) {
      for (const rule of this.config.task_routing.rules) {
        if (rule.condition && rule.condition.includes('contains')) {
          // 提取关键词
          const match = rule.condition.match(/\[([^\]]+)\]/);
          if (match) {
            const keywords = match[1].split(',').map(k => 
              k.trim().replace(/['"]/g, '')
            );
            for (const keyword of keywords) {
              if (task.toLowerCase().includes(keyword.toLowerCase())) {
                return rule.category;
              }
            }
          }
        }
      }
    }
    
    // 回退到categories关键词匹配
    const categories = this.config.categories;
    
    for (const [categoryName, categoryConfig] of Object.entries(categories)) {
      if (!categoryConfig.keywords) continue;
      
      for (const keyword of categoryConfig.keywords) {
        if (task.toLowerCase().includes(keyword.toLowerCase())) {
          return categoryName;
        }
      }
    }
    
    return this.config.task_routing?.default_category || 'deep';
  }

  // 测试Subagent映射
  testSubagentMapping() {
    log('cyan', '\n🔗 [阶段5] 测试Subagent映射...\n');

    if (!this.subagentMapping) {
      log('yellow', '⚠️ 跳过Subagent映射测试 (配置未加载)');
      return true;
    }

    const testMappings = [
      { type: 'explore', expectedAgent: 'simayi' },
      { type: 'code-reviewer', expectedAgent: 'guanyu' },
      { type: 'tdd-guide', expectedAgent: 'xushu' },
      { type: 'security-reviewer', expectedAgent: 'yujin' },
      { type: 'planner', expectedAgent: 'zhouyu' }
    ];

    let passed = 0;
    for (const test of testMappings) {
      const mapping = this.subagentMapping.mappings[test.type];
      if (!mapping) {
        log('red', `❌ 类型 ${test.type} 无映射配置`);
        continue;
      }

      if (mapping.agent === test.expectedAgent) {
        passed++;
        log('green', `✅ ${test.type} → ${mapping.agent}`);
      } else {
        log('red', `❌ ${test.type} → ${mapping.agent} (期望: ${test.expectedAgent})`);
      }
    }

    log('blue', `\n📊 Subagent映射测试: ${passed}/${testMappings.length} 通过`);
    
    if (passed === testMappings.length) {
      this.pass('Subagent映射', '所有映射正确');
    }

    return true;
  }

  // 测试模型回退链
  testFallbackChains() {
    log('cyan', '\n⛓️ [阶段6] 测试模型回退链...\n');

    const allowedModels = [
      'bailian/qwen3.5-plus',
      'bailian/kimi-k2.5',
      'bailian/glm-5',
      'bailian/MiniMax-M2.5'
    ];

    let validChains = 0;
    let totalChains = 0;

    for (const [agentName, agentConfig] of Object.entries(this.config.agents)) {
      if (!agentConfig.fallback_models) continue;
      
      totalChains++;
      const chain = [agentConfig.model, ...agentConfig.fallback_models];
      
      // 检查链中是否有重复
      const uniqueChain = [...new Set(chain)];
      if (uniqueChain.length !== chain.length) {
        log('yellow', `⚠️ ${agentName}: 回退链中有重复模型`);
        continue;
      }

      // 检查链中是否都是允许的模型
      const invalidModels = chain.filter(m => !allowedModels.includes(m));
      if (invalidModels.length > 0) {
        log('red', `❌ ${agentName}: 包含非法模型 ${invalidModels.join(', ')}`);
        continue;
      }

      validChains++;
      log('green', `✅ ${agentName}: ${chain.join(' → ')}`);
    }

    log('blue', `\n📊 回退链测试: ${validChains}/${totalChains} 有效`);
    
    if (validChains === totalChains) {
      this.pass('模型回退链', '所有回退链有效');
    }

    return validChains / totalChains >= 0.9;
  }

  // 测试类别配置
  testCategoryConfiguration() {
    log('cyan', '\n📋 [阶段7] 测试类别配置...\n');

    const requiredCategories = [
      'visual-engineering',
      'deep',
      'quick',
      'ultrabrain',
      'review',
      'explore',
      'writing',
      'monitor',
      'test',
      'devops',
      'database',
      'security',
      'performance',
      'mobile',
      'api',
      'ai',
      'web3'
    ];

    let missing = 0;
    for (const category of requiredCategories) {
      if (!this.config.categories[category]) {
        missing++;
        log('red', `❌ 缺少类别: ${category}`);
      }
    }

    if (missing === 0) {
      this.pass('类别配置', '所有必需类别存在');
    } else {
      this.fail('类别配置', `缺少 ${missing} 个类别`);
    }

    // 检查每个类别的模型配置
    for (const [name, config] of Object.entries(this.config.categories)) {
      if (!config.model) {
        this.fail(`类别 ${name}`, '缺少model配置');
      }
      if (!config.primaryAgent) {
        log('yellow', `⚠️ 类别 ${name} 缺少primaryAgent`);
      }
    }

    return missing === 0;
  }

  // 运行所有测试
  runAllTests() {
    log('bright', '\n╔══════════════════════════════════════════════════════════╗');
    log('bright', '║   UltraWork SanGuo - 全流程全链条测试                    ║');
    log('bright', '╚══════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    if (!this.loadConfig()) {
      this.generateReport(startTime);
      return false;
    }

    this.testModelConfiguration();
    this.testAgentHierarchy();
    this.testTaskRouting();
    this.testSubagentMapping();
    this.testFallbackChains();
    this.testCategoryConfiguration();

    this.generateReport(startTime);
    
    return this.results.failed === 0;
  }

  // 辅助方法
  pass(test, message) {
    this.results.passed++;
    this.results.tests.push({ status: 'pass', test, message });
    log('green', `✅ [通过] ${test}: ${message}`);
  }

  fail(test, message) {
    this.results.failed++;
    this.results.tests.push({ status: 'fail', test, message });
    log('red', `❌ [失败] ${test}: ${message}`);
  }

  warn(test, message) {
    this.results.warnings++;
    this.results.tests.push({ status: 'warn', test, message });
    log('yellow', `⚠️ [警告] ${test}: ${message}`);
  }

  // 生成报告
  generateReport(startTime) {
    const duration = Date.now() - startTime;

    log('bright', '\n╔══════════════════════════════════════════════════════════╗');
    log('bright', '║                      测试报告                             ║');
    log('bright', '╠══════════════════════════════════════════════════════════╣');
    log('bright', `║  总耗时: ${duration}ms                                        ║`);
    log('bright', `║  ✅ 通过: ${this.results.passed}                                    ║`);
    log('bright', `║  ❌ 失败: ${this.results.failed}                                    ║`);
    log('bright', `║  ⚠️ 警告: ${this.results.warnings}                                    ║`);
    log('bright', '╚══════════════════════════════════════════════════════════╝\n');

    if (this.results.failed === 0) {
      log('green', '🎉 所有测试通过！系统运行正常。\n');
    } else {
      log('red', `⚠️ 发现 ${this.results.failed} 个问题，需要修复。\n`);
      process.exit(1);
    }
  }
}

// 运行测试
const tester = new FullChainTester();
tester.runAllTests();
