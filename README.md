# UltraWork Agent - Claude Code Skill

> 多智能体调度系统 - 自律军团，任务完成前绝不罢休

一键触发，所有智能体出动。任务完成前绝不罢休。

## 特性

- 🚀 **一键触发** - 使用 `/ulw` 或 `/ultrawork` 命令启动
- 🤖 **多智能体协作** - 自动分配专家 Agent 并行执行任务
- 🔄 **Ralph Loop** - 循环执行直到任务完成
- 🎯 **智能分类** - 自动识别任务类型，分配最佳模型

## 安装

### 方式一：npm 安装（推荐）

```bash
npm install -g ultrawork-agent
```

### 方式二：GitHub 克隆

```bash
# 克隆到 Claude Code skills 目录
git clone https://github.com/paskaa/ultrawork-agent.git ~/.claude/skills/ultrawork-agent
```

### 方式三：手动安装

将 `skills/ultrawork` 目录复制到以下位置之一：

- **个人目录**: `~/.claude/skills/ultrawork/`
- **项目目录**: `.claude/skills/ultrawork/`

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

## 使用示例

```
用户: /ulw 实现用户管理页面

分析:
- 类别: visual-engineering
- 模型: qwen3-coder-plus
- 分配: Hephaestus (实现) + Explorer (查找模式)

执行: 创建用户管理 CRUD 页面
```

## 配置选项

可在 SKILL.md 中自定义：

- **模型选择** - 为不同任务类型配置首选模型
- **触发词** - 添加自定义触发词
- **Agent 分配** - 调整专家军团配置

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Claude Code 文档](https://docs.anthropic.com/claude-code)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)