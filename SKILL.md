---
name: ultrawork
description: |
  UltraWork 多智能体调度系统 - 自律军团，任务完成前绝不罢休。

  Triggers when user:
  - 执行 /ultrawork 或 /ulw 命令
  - 以 "ultrawork" 开头的请求
  - 包含 "ulw " 的请求
version: "1.0.0"
---

# UltraWork - 自律军团调度系统

一键触发，所有智能体出动。任务完成前绝不罢休。

## 快速使用

### 命令触发
```
/ultrawork 实现用户登录功能
/ulw 修复登录页面的样式问题
```

### 关键词触发
```
ultrawork 重构订单模块
ulw 添加导出功能
```

## 调度流程

```
用户请求
    ↓
┌─────────────────┐
│   IntentGate    │  ← 意图分析，消除歧义
│   意图门        │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Sisyphus      │  ← 主调度器
│   任务分类      │
└────────┬────────┘
         ↓
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓        ↓
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Hephaes│ │Prometh│ │Explore│ │Librarn│
│tus    │ │eus    │ │r      │ │       │
│深度执行│ │战略规划│ │代码探索│ │知识检索│
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    └────┬────┴────────┴────────┘
         ↓
┌─────────────────┐
│   Ralph Loop    │  ← 循环执行直到完成
└────────┬────────┘
         ↓
     结果汇总
```

## 专家军团

| Agent | 职责 | 擅长领域 |
|-------|------|----------|
| **Sisyphus** | 主调度器 | 协调、规划、监控 |
| **Hephaestus** | 深度执行 | 编码、重构、修复 |
| **Prometheus** | 战略规划 | 架构设计、决策分析 |
| **Explorer** | 探索收集 | 代码搜索、信息收集 |

## 任务类别

| 类别 | 描述 | 关键词 |
|------|------|--------|
| `visual-engineering` | 前端、UI/UX | UI, 界面, 样式, Vue, 前端 |
| `deep` | 深度开发 | 重构, 架构, 实现, 功能 |
| `quick` | 快速修复 | 修复, bug, 修改, typo |
| `ultrabrain` | 复杂决策 | 设计, 方案, 决策, 规划 |

## 模型路由

根据任务类别自动选择最优模型：

- **visual-engineering** → gemini-2.5-pro (首选) → glm-5 (备选)
- **deep** → kimi-k2.5 (首选) → glm-5 (备选)
- **quick** → glm-5
- **ultrabrain** → kimi-k2.5 (首选) → glm-5 (备选)

## Ralph Loop 循环执行

任务未完成时自动继续执行：

1. 分析当前状态
2. 识别剩余任务
3. 分配给专家执行
4. 计算完成度
5. 未达 100% 则循环

最大迭代次数：10 次

## 配置文件

- `config.json` - 调度系统配置
- `models.json` - 模型映射配置
- `agents/*.md` - Agent 提示词定义
- `categories/*.md` - 任务类别定义

## 示例

### 示例 1：前端开发
```
用户: /ulw 实现用户管理页面

Sisyphus 分析:
- 类别: visual-engineering
- 模型: gemini-2.5-pro
- 分配: Hephaestus (前端实现) + Explorer (查找现有模式)

结果: 完整的用户管理 CRUD 页面
```

### 示例 2：Bug 修复
```
用户: ulw 修复登录失败的问题

Sisyphus 分析:
- 类别: quick
- 模型: glm-5
- 分配: Hephaestus (修复) + Explorer (定位问题)

结果: 定位并修复了认证逻辑错误
```

### 示例 3：架构设计
```
用户: /ultrawork 设计支付系统架构

Sisyphus 分析:
- 类别: ultrabrain
- 模型: kimi-k2.5
- 分配: Prometheus (架构设计)

结果: 完整的支付系统设计方案
```

---

*UltraWork - 因为你的任务值得被认真对待*