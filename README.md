# UltraWork - 多智能体调度系统

> 自律军团，任务完成前绝不罢休

[![npm version](https://img.shields.io/npm/v/ultrawork-agent.svg)](https://www.npmjs.com/package/ultrawork-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**UltraWork** 是一个多智能体调度系统，灵感来自 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)。它能够自动分析任务意图，分配合适的专家 Agent，并持续执行直到任务完成。

## 特性

- 🤖 **自律军团** - Sisyphus 协调 Hephaestus、Prometheus、Explorer 多个专家并行工作
- 🎯 **意图门** - 执行前分析真实意图，消除歧义
- 🔀 **类别调度** - 自动识别任务类别，选择最优模型
- 🔁 **Ralph Loop** - 任务未完成时自动循环执行
- 📦 **开箱即用** - 支持 npm 全局安装，CLI 命令直接使用

## 安装

```bash
# npm 全局安装
npm install -g ultrawork-agent

# 或使用 yarn
yarn global add ultrawork-agent
```

## 快速开始

### CLI 命令

```bash
# 执行任务
ultrawork 实现用户登录功能

# 简写
ulw 实现用户登录功能

# 循环执行模式
ultrawork --loop 重构订单模块

# 分析意图
ultrawork --analyze "设计支付系统架构"

# 查看可用模型
ultrawork --models
```

### 作为模块使用

```javascript
const UltraWork = require('ultrawork-agent');

// 执行任务
const result = await UltraWork.execute('实现用户登录功能');

// 循环执行
const result = await UltraWork.execute('重构订单模块', { loop: true });

// 分析意图
const intent = UltraWork.analyzeIntent('设计支付系统架构');

// 获取可用模型
const models = UltraWork.getAvailableModels();
```

## 专家军团

| Agent | 职责 | 适用场景 |
|-------|------|----------|
| **Sisyphus** | 主调度器 | 协调整体流程，任务分配和监控 |
| **Hephaestus** | 深度执行者 | 自主完成复杂任务，不需保姆式指导 |
| **Prometheus** | 战略规划师 | 架构设计、访谈式需求分析 |
| **Explorer** | 探索者 | 代码搜索、信息收集、模式发现 |

## 任务类别

| 类别 | 描述 | 关键词 | 首选模型 |
|------|------|--------|----------|
| `visual-engineering` | 前端、UI/UX | UI, 界面, 样式, Vue, 前端 | gemini-2.5-pro |
| `deep` | 深度开发 | 重构, 架构, 实现, 功能, 模块 | kimi-k2.5 |
| `quick` | 快速修复 | 修复, bug, 修改, 更新 | glm-5 |
| `ultrabrain` | 架构决策 | 设计, 方案, 决策, 规划 | kimi-k2.5 |

## 调度流程

```
用户请求
    ↓
┌─────────────────┐
│   IntentGate    │  ← 意图分析
└────────┬────────┘
         ↓
┌─────────────────┐
│   Sisyphus      │  ← 任务分类
└────────┬────────┘
         ↓
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓        ↓
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Hephaes│ │Prometh│ │Explore│ │Librarn│
│tus    │ │eus    │ │r      │ │       │
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    └────┬────┴────────┴────────┘
         ↓
┌─────────────────┐
│   Ralph Loop    │  ← 循环执行直到完成
└────────┬────────┘
         ↓
     结果汇总
```

## 配置

### 自定义模型

编辑 `models.json` 配置可用的模型：

```json
{
  "models": {
    "glm-5": {
      "provider": "zhipu",
      "displayName": "GLM-5",
      "strengths": ["general", "coding", "chinese"],
      "cost": "low",
      "speed": "fast",
      "available": true
    },
    "kimi-k2.5": {
      "provider": "moonshot",
      "displayName": "Kimi K2.5",
      "strengths": ["reasoning", "long-context"],
      "cost": "medium",
      "available": false,
      "apiKeyEnv": "KIMI_API_KEY"
    }
  }
}
```

### 环境变量

```bash
# Kimi API Key
export KIMI_API_KEY=your_api_key

# Google API Key (for Gemini)
export GOOGLE_API_KEY=your_api_key

# OpenAI API Key
export OPENAI_API_KEY=your_api_key
```

## API

### `UltraWork.execute(request, options)`

执行任务。

- `request` (string): 用户请求
- `options.loop` (boolean): 是否启用循环执行模式
- `options.context` (object): 额外上下文

### `UltraWork.analyzeIntent(request)`

分析意图，返回任务类别和置信度。

### `UltraWork.selectModel(category)`

根据类别选择最优模型。

### `UltraWork.getAvailableModels()`

获取所有可用模型列表。

### `UltraWork.shouldTrigger(input)`

检查输入是否触发 UltraWork。

### `UltraWork.parseTrigger(input)`

解析触发命令，返回命令和参数。

## 示例

### 前端开发

```bash
$ ultrawork 实现用户管理页面

[Sisyphus] 意图分析完成: visual-engineering
[ModelRouter] 选择模型: gemini-2.5-pro
[Sisyphus] 分配任务: [ 'hephaestus', 'explorer' ]
执行完成: 2 个 Agent 执行任务，2 个成功完成
```

### Bug 修复

```bash
$ ultrawork 修复登录失败的问题

[Sisyphus] 意图分析完成: quick
[ModelRouter] 选择模型: glm-5
[Sisyphus] 分配任务: [ 'hephaestus' ]
执行完成: 1 个 Agent 执行任务，1 个成功完成
```

### 架构设计

```bash
$ ultrawork 设计支付系统架构

[Sisyphus] 意图分析完成: ultrabrain
[ModelRouter] 选择模型: kimi-k2.5
[Sisyphus] 分配任务: [ 'prometheus' ]
执行完成: Prometheus 完成战略规划
```

## 与 Claude Code / OpenCode 集成

UltraWork 可以作为 Claude Code 或 OpenCode 的技能使用：

1. 将 `ultrawork` 目录复制到项目的 `.opencode/skills/` 或 `.claude/skills/` 目录
2. 在配置中启用技能

```json
{
  "skills": {
    "ultrawork": {
      "path": ".opencode/skills/ultrawork",
      "enabled": true
    }
  }
}
```

然后可以使用 `/ulw` 或 `/ultrawork` 命令触发。

## 开发

```bash
# 克隆仓库
git clone https://github.com/your-username/ultrawork-agent.git
cd ultrawork-agent

# 安装依赖
npm install

# 测试
npm test

# 本地链接（用于开发测试）
npm link
```

## 发布

```bash
# 登录 npm
npm login

# 发布
npm publish
```

## 灵感来源

- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - 本项目的主要灵感来源
- [Claude Code](https://code.claude.com) - Anthropic 的 CLI 工具
- [OpenCode](https://opencode.ai) - 开源的 AI 编码助手

## License

MIT License - 详见 [LICENSE](LICENSE) 文件