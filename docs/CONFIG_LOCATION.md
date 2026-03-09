# 配置位置说明

## 概述

从 v1.7.1 开始，UltraWork SanGuo 的所有配置统一迁移到**用户级别**目录 `~/.config/opencode/`，不再在项目级别维护配置。

## 变更原因

### 之前的问题
- 项目级别配置 (`.agent/`、`.agents/`) 导致：
  - 每个项目需要重复配置
  - 配置分散在多个目录
  - 更新困难

### 现在的方案
- 统一使用 `~/.config/opencode/` 用户级别配置：
  - 一处配置，全局生效
  - 所有插件共享配置
  - 更新更方便

## 目录结构

```
~/.config/opencode/
├── plugins/
│   └── ultrawork-sanguo/     # 插件代码
├── skills/
│   ├── ultrawork/            # UltraWork skill
│   ├── find-skills/          # 技能查找
│   └── ...                   # 其他 skills
├── agents/                   # Agent 配置
├── commands/                 # 自定义命令
└── opencode.json            # 主配置文件
```

## 迁移指南

### 如果你之前使用项目级别配置

1. **备份旧配置** (可选):
   ```bash
   cp -r ~/.agent ~/.agent.backup
   cp -r ~/.agents ~/.agents.backup
   ```

2. **删除旧配置**:
   ```bash
   rm -rf ~/.agent ~/.agents
   ```

3. **确保使用新路径**:
   ```bash
   # 检查插件是否在正确位置
   ls ~/.config/opencode/plugins/ultrawork-sanguo
   ```

## 配置优先级

OpenCode 会按以下顺序查找配置：

1. `~/.config/opencode/` - 用户级别配置 (推荐)
2. 项目级别 `.opencode/` - 项目特定配置
3. 内置默认配置

## 环境变量

可以通过环境变量覆盖配置位置：

```bash
export OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
export OPENCODE_PLUGINS_DIR="$HOME/.config/opencode/plugins"
export OPENCODE_SKILLS_DIR="$HOME/.config/opencode/skills"
```

## 常见问题

### Q: 为什么我的旧配置不生效了？
A: 请检查配置是否在 `~/.config/opencode/` 下，并删除旧的 `~/.agent` 和 `~/.agents` 目录。

### Q: 如何迁移项目级别的 skill？
A: 将项目目录下的 skills 复制到 `~/.config/opencode/skills/`：
```bash
cp -r ./skills/my-skill ~/.config/opencode/skills/
```

### Q: 更新插件会影响配置吗？
A: 不会。插件更新只更新代码，不改变用户级别的配置。

## 相关链接

- [OpenCode 文档](https://opencode.ai/docs)
- [配置规范](docs/PLATFORM_CONFIG.md)
