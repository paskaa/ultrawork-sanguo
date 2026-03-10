# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-03-10

### Added
- **完整工作流模式** (`/workflow`): 6阶段完整开发流程
  - 新增 `/workflow bugfix` - Bug修复工作流
  - 新增 `/workflow feature` - 功能开发工作流  
  - 新增 `/workflow refactor` - 代码重构工作流
  - 新增 `/workflow review` - 代码审查工作流
  - 新增 `/workflow monitor` - 监控诊断工作流
  - 新增 `/wf` 快捷命令
- **监察团队** (3位新将领):
  - 满宠 - 监察指挥官，统筹监控全局
  - 程昱 - 前端监控专家，Console/Network监控
  - 贾诩 - 后端监控专家，API异常/数据库监控
- **测试团队** (4位新将领):
  - 徐庶 - 测试专家，测试策略制定
  - 庞林 - 前端测试专家，Vitest/Playwright
  - 严颜 - 后端测试专家，JUnit/Mockito
  - 刘晔 - E2E测试专家，Playwright/Selenium
- **Web监控面板**: 可视化实时监控任务进度和将领状态
  - 支持左侧武将层级列表 + 右侧日志面板
  - 实时日志筛选（思考/修改/执行）
  - 全局日志和武将特定日志切换
  - 基于文件的状态同步（CLI ↔ Web）
- **新Agent配置文件**: 监察和测试团队7位将领的独立配置

### Changed
- SKILL.md 更新，添加完整的触发器列表
- 优化 trigger 格式，支持结构化定义
- 更新 package.json，添加 workflows/ 到文件列表

### Technical
- 新增 `workflows/` 目录，包含完整工作流定义
- 新增 `bin/ultrawork-status.js` 状态查询工具
- 集成文件状态同步机制（`~/.opencode/web-panel/state.json`）

## [1.7.1] - 2026-03-07

### Fixed
- 修复状态栏显示问题
- 优化终端UI兼容性

## [1.7.0] - 2026-03-05

### Added
- **UltraWork Panel 插件**: 现代化 TUI 状态栏支持
  - Clack 状态栏（TTY环境）
  - ANSI 状态栏（回退方案）
- **环境检测器**: 自动检测运行环境（OpenCode/Qoder/Claude）
- **初始化脚本**: 自动化配置安装

### Changed
- 重构插件架构，支持多平台
- 优化 agent 配置加载

## [1.6.0] - 2026-03-01

### Added
- **25位三国将领**: 完整的将领体系
  - 主帅: 诸葛亮
  - 大都督: 周瑜
  - 五虎大将: 赵云、司马懿、关羽、张飞、马超
  - 诸葛亮部将: 鲁肃、黄盖
  - 赵云部将: 高顺、陈到
  - 关羽部将: 关平、周仓
  - 张飞部将: 雷绪、吴兰
  - 马超部将: 马岱、庞德
  - 诸葛亮部将: 司马师、司马昭
- **任务分类系统**: 10大任务类别
  - visual-engineering (前端/UI)
  - deep (深度开发)
  - quick (快速修复)
  - ultrabrain (架构设计)
  - review (代码审查)
  - explore (代码探索)
  - monitor (监控)
  - test (测试)
  - writing (文档)
  - reserve (特殊任务)
- **任务路由规则**: 智能任务分配

## [1.5.0] - 2026-02-20

### Added
- **多模型支持**: GLM-5、Qwen3.5-Plus、Kimi-K2.5、MiniMax-M2.5
- **成本优化**: 相比单模型节省约 56% 费用
- **并行执行**: 同一消息中调度多个将领

## [1.0.0] - 2026-02-01

### Added
- 初始版本发布
- 基础三国军团架构
- 5位核心将领
- 单点调度模式 (`/ulw`)
