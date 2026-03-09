# Changelog

All notable changes to this project will be documented in this file.

## [1.8.1] - 2026-03-09

### 🔧 Updated

- ✨ **New Models**: Added support for Bailian Coding Plan models
  - `qwen3-coder-plus` - Primary model for coding specialists (GaoShun, ChenDao, ChengYu, JiaXu, PangLin, YanYan)
  - `qwen3-coder-next` - Fast fallback model for coding tasks
  - `qwen3-max-2026-01-23` - Latest Qwen Max variant
  - `glm-4.7` - Updated GLM model support

- 🔧 **Model Config**: Updated fallback model chains for all coding specialists
  - GaoShun (Frontend): `qwen3-coder-plus` → `qwen3-coder-next` → `qwen3.5-plus` → `glm-5`
  - ChenDao (Backend): `qwen3-coder-plus` → `qwen3-coder-next` → `qwen3.5-plus` → `glm-5`
  - ChengYu (Frontend Monitor): `qwen3-coder-plus` → `qwen3-coder-next` → `qwen3.5-plus` → `glm-5`
  - JiaXu (Backend Monitor): `qwen3-coder-plus` → `qwen3-coder-next` → `qwen3.5-plus` → `glm-5`
  - PangLin (Frontend Test): `qwen3-coder-plus` → `qwen3-coder-next` → `qwen3.5-plus` → `glm-5`
  - YanYan (Backend Test): `qwen3-coder-plus` → `qwen3-coder-next` → `qwen3.5-plus` → `glm-5`
  - LiuYe (E2E Test): Updated to `qwen3-coder-next`

### 📦 Technical

- Updated category model configurations for `visual-engineering` and `deep` to use `qwen3-coder-plus`
- Enhanced model fallback chains for better reliability

---

## [1.8.0] - 2026-03-08

### ✨ Added

- **26 Generals** - Complete Three Kingdoms commander roster
- **XuShu Test Team** - PangLin (Frontend Test), YanYan (Backend Test)
- **ManChong Monitor Team** - ChengYu (Frontend), JiaXu (Backend), LiuYe (E2E)
- **Strict Hierarchy System** - Enforced commander-lieutenant call chains
- **10 Task Categories** - Auto-routing with keyword detection

### 🔧 Fixed

- All agents now have proper `name` and `commander` fields
- Task routing priority optimized for better accuracy

### 📚 Docs

- Complete architecture documentation
- Updated platform configuration guides

---

## [1.4.0] - 2026-03-07

### ✨ Initial Release

- 19 Generals with hierarchical structure
- Multi-platform support (Qoder, OpenCode, Claude Code, Bailian)
- Task categorization and auto-routing
