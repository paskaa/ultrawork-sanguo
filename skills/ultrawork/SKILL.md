---
name: ultrawork
description: |
  UltraWork 多智能体调度系统 - 自律军团，任务完成前绝不罢休。

  Triggers when user mentions:
  - "/ultrawork"、"/ulw"
  - "ultrawork "、"ulw "
  - "ulw-"、"ulw_loop"
---

# UltraWork - 自律军团调度系统

一键触发，所有智能体出动。任务完成前绝不罢休。

## 快速使用

```
/ultrawork 实现用户登录功能
/ulw 修复登录页面的样式问题
```

## 调度流程

1. **IntentGate** - 意图分析，消除歧义
2. **Sisyphus** - 主调度器，任务分类
3. **专家军团** - 并行执行任务
4. **Ralph Loop** - 循环执行直到完成

## 专家军团

| Agent | 职责 | 模型 |
|-------|------|------|
| **Sisyphus** | 主调度器 | glm-5 |
| **Hephaestus** | 深度执行 | qwen3-coder-next |
| **Prometheus** | 战略规划 | qwen3-max-2026-01-23 |
| **Explorer** | 探索收集 | qwen3-coder-plus |

## 任务类别

| 类别 | 首选模型 | 关键词 |
|------|----------|--------|
| visual-engineering | qwen3-coder-plus | UI, 界面, 样式, Vue, 前端 |
| deep | qwen3-coder-next | 重构, 架构, 实现, 功能 |
| quick | glm-5 | 修复, bug, 修改, typo |
| ultrabrain | qwen3-max-2026-01-23 | 设计, 方案, 决策, 规划 |

## 执行指令

当用户触发 ultrawork 时，按以下步骤执行：

### Step 1: 意图分析 (IntentGate)
分析用户请求的真实意图，识别任务类别。

### Step 2: 任务分类 (Sisyphus)
根据关键词确定任务类别：
- visual-engineering: 前端、UI/UX 任务
- deep: 深度开发、重构任务
- quick: 快速修复、小改动
- ultrabrain: 架构设计、决策分析

### Step 3: 分配专家
根据任务类别分配专家 Agent：
- visual-engineering → Hephaestus + Explorer
- deep → Hephaestus + Explorer
- quick → Hephaestus
- ultrabrain → Prometheus

### Step 4: 执行任务
使用分配的模型执行任务，输出结果。

### Step 5: Ralph Loop
检查任务完成度，未完成则继续执行。

## 示例

```
用户: /ulw 实现用户管理页面

分析:
- 类别: visual-engineering
- 模型: qwen3-coder-plus
- 分配: Hephaestus (实现) + Explorer (查找模式)

执行: 创建用户管理 CRUD 页面
```