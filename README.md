# UltraWork - SanGuo Legion

> 鞠躬尽瘁，死而后已
> 将帅齐心，其利断金

A hierarchical multi-agent orchestration system with Three Kingdoms themed commanders and lieutenants. **26 generals**, **strict hierarchy dispatch**, supporting multiple platforms (Qoder, OpenCode, Claude Code, Bailian).

## 🌟 Features

- **26 Generals** - 1 Commander-in-Chief, 8 Commanders, 17 Lieutenants
- **Strict Hierarchy** - ZhugeLiang → Commanders → Lieutenants (no skipping levels)
- **10 Task Categories** - Auto-routing based on keywords
- **Multi-Platform** - Qoder, OpenCode, Claude Code, Bailian

## 📦 Installation

```bash
npm install ultrawork-sanguo
```

## 🚀 Usage

### Trigger Commands

| Command | Description |
|---------|-------------|
| `/ulw <task>` | Execute a task with auto-routing |
| `/ultrawork` | Show help and status |
| `/zt <url>` | Process Zentao tasks |

### Example Usage

```
User: /ulw 搜索用户登录相关代码

+==============================================================+
|  UltraWork SanGuo Legion                               [RUN] |
+==============================================================+
|  Task: 搜索用户登录相关代码                                    |
|  Route: explore → SimaYi                                     |
+==============================================================+
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    三国军团层级架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: 主帅 (1人)                                        │
│  └── 诸葛亮 (ZhugeLiang)                                    │
│                                                             │
│           ↓ 只能调用大都督                                   │
│                                                             │
│  Level 2: 大都督 (8人)                                      │
│  ├── 周瑜 (ZhouYu)     → 鲁肃、黄盖                         │
│  ├── 赵云 (ZhaoYun)    → 高顺、陈到                         │
│  ├── 司马懿 (SimaYi)   → 司马师、司马昭                      │
│  ├── 关羽 (GuanYu)     → 关平、周仓                         │
│  ├── 张飞 (ZhangFei)   → 雷绪、吴兰                         │
│  ├── 满宠 (ManChong)   → 程昱、贾诩、刘晔                    │
│  ├── 徐庶 (XuShu)      → 庞林、严颜                         │
│  └── 马超 (MaChao)     → 马岱、庞德                         │
│                                                             │
│           ↓ 只能调用自己的部将                               │
│                                                             │
│  Level 3: 部将 (17人)                                       │
│  └── 向各自的大都督汇报，禁止越级                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 👥 Commanders

| Commander | Role | Team |
|-----------|------|------|
| 周瑜 (ZhouYu) | Strategist | 鲁肃、黄盖 |
| 赵云 (ZhaoYun) | Deep Executor | 高顺、陈到 |
| 司马懿 (SimaYi) | Explorer | 司马师、司马昭 |
| 关羽 (GuanYu) | Quality Guard | 关平、周仓 |
| 张飞 (ZhangFei) | Quick Fixer | 雷绪、吴兰 |
| 满宠 (ManChong) | Monitor Commander | 程昱、贾诩、刘晔 |
| 徐庶 (XuShu) | Test Expert | 庞林、严颜 |
| 马超 (MaChao) | Reserve Commander | 马岱、庞德 |

## 📋 Task Categories

| Category | Commander | Keywords |
|----------|-----------|----------|
| monitor | 满宠 | 监控, 日志, 异常, console, network |
| test | 徐庶 | 单元测试, 集成测试, JUnit, Vitest |
| explore | 司马懿 | 搜索, 查找, 定位, find, search |
| ultrabrain | 周瑜 | 设计, 方案, 决策, 规划 |
| quick | 张飞 | 修复, bug, fix, 问题 |
| review | 关羽 | review, 审查, 检查, 质量 |
| visual-engineering | 赵云 | UI, Vue, 组件, 页面 |
| deep | 赵云 | 重构, 架构, 开发, 模块 |
| writing | 司马懿 | 文档, readme, 说明 |
| reserve | 马超 | 特殊, 实验, 备用 |

## 🔒 Hierarchy Constraints

```
✅ ZhugeLiang can only call Commanders
✅ Commanders can only call their own Lieutenants
✅ Lieutenants can only report to their Commander
❌ No skipping levels
❌ No cross-team calls
```

## 📁 Project Structure

```
ultrawork-sanguo/
├── config/
│   └── ultrawork-sanguo.json    # Main config
├── skills/                      # General skills
│   ├── manchong-monitor/        # 满宠 - 监察指挥
│   ├── chengyu-frontend-monitor/# 程昱 - 前端监控
│   ├── jiaxu-backend-monitor/   # 贾诩 - 后端监控
│   ├── liuye-e2e-tester/        # 刘晔 - E2E测试
│   ├── xushu-test-expert/       # 徐庶 - 测试专家
│   ├── panglin-frontend-tester/ # 庞林 - 前端测试
│   ├── yanyan-backend-tester/   # 严颜 - 后端测试
│   └── zentao-workflow/         # 禅道工作流
├── commands/
│   └── zt.md                    # Zentao command
└── ...
```

## 📝 Changelog

### v1.5.0 (2026-03-09)

- ✨ **New**: 26 Generals (up from 19)
- ✨ **New**: XuShu Test Team (庞林, 严颜)
- ✨ **New**: ManChong Monitor Team (程昱, 贾诩, 刘晔)
- ✨ **New**: Strict hierarchy dispatch system
- ✨ **New**: 10 task categories with auto-routing
- 🔧 **Fix**: All agents have `name` and `commander` fields
- 🔧 **Fix**: Task routing priority optimized
- 📚 **Docs**: Complete architecture documentation

### v1.4.0

- Initial release with 19 generals

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

*鞠躬尽瘁，死而后已*