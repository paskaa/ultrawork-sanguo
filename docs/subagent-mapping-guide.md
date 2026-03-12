# OpenCode 内置类型与 UltraWork 三国军团映射配置

## 问题背景

当禅道流程或其他 OpenCode 技能调用 `Task` 工具时，如果直接指定 `subagent_type: "explore"`，系统会优先使用 OpenCode 内置的 explore agent，而不是通过你的三国军团武将系统。

## 解决方案

通过三层配置确保所有任务都能正确路由到三国武将：

### 1. opencode.json 配置 ✅ 已完成

在 `opencode.json` 的 `agent` 部分定义了内置类型到武将的映射（第382-493行）：

```json
{
  "agent": {
    "explore": {
      "model": "bailian/MiniMax-M2.5",
      "description": "司马懿 (仲达) - 谋士/情报官 (explore模式)",
      "mode": "subagent"
    },
    "code-reviewer": {
      "model": "bailian/qwen3.5-plus",
      "description": "关羽 (云长) - 质量守护者 (code-reviewer模式)",
      "mode": "subagent"
    },
    // ... 其他类型
  }
}
```

### 2. ultrawork-sanguo.json 配置 ✅ 已完成

在 `task_routing.rules` 中添加了直接映射规则：

```json
{
  "condition": "subagent_type == 'explore'",
  "category": "explore",
  "primary_agent": "simayi",
  "support_agents": ["simashi", "simazhao"],
  "note": "OpenCode内置类型映射"
}
```

### 3. subagent-router.js 模块 ✅ 已完成

创建了专门的映射模块 `dist/agents/subagent-router.js`，提供：
- `routeBySubagentType()` - 根据内置类型路由到武将
- `isBuiltInSubagentType()` - 检查是否为内置类型
- `getSupportedSubagentTypes()` - 获取所有支持的类型
- `printRoutingTable()` - 打印映射表

## 完整映射表

| OpenCode 内置类型 | 映射武将 | 任务类别 | 描述 |
|------------------|---------|---------|------|
| `explore` | 司马懿 (simayi) | explore | 代码探索、信息收集 |
| `code-reviewer` | 关羽 (guanyu) | review | 代码审查、质量把关 |
| `tdd-guide` | 徐庶 (xushu) | test | 测试驱动开发 |
| `security-reviewer` | 于禁 (yujin) | security | 安全审计、漏洞扫描 |
| `refactor-cleaner` | 司马懿 (simayi) | explore | 死代码清理、重构 |
| `python-reviewer` | 陈到 (chendao) | deep | Python代码审查 |
| `go-reviewer` | 陈到 (chendao) | deep | Go代码审查 |
| `go-build-resolver` | 陈到 (chendao) | quick | Go构建错误修复 |
| `e2e-runner` | 刘晔 (liuye) | monitor | E2E测试、Playwright |
| `doc-updater` | 司马昭 (simazhao) | writing | 文档更新、codemap |
| `database-reviewer` | 张辽 (zhangliao) | database | PostgreSQL审查 |
| `build-error-resolver` | 张飞 (zhangfei) | quick | 构建错误修复 |
| `loop-operator` | 诸葛亮 (zhugeliang) | ultrabrain | Agent循环操作 |
| `harness-optimizer` | 周瑜 (zhouyu) | ultrabrain | Harness优化 |
| `planner` | 周瑜 (zhouyu) | ultrabrain | 任务规划 |
| `architect` | 周瑜 (zhouyu) | ultrabrain | 架构设计 |

## 使用方法

### 方法 1: 使用 ultrawork_task 工具（推荐）

```javascript
// 使用 subagent_type 参数指定内置类型
ultrawork_task({
  description: "搜索相关代码",
  prompt: "在项目中搜索所有 Vue 组件文件",
  subagent_type: "explore"  // ← 将自动路由到司马懿
})
```

### 方法 2: 直接使用武将名

```javascript
ultrawork_task({
  description: "代码审查",
  prompt: "请审查这段代码的质量",
  agent: "guanyu"  // ← 直接使用关羽
})
```

### 方法 3: 使用 @提及 语法

```javascript
ultrawork_task({
  description: "架构设计",
  prompt: "@zhouyu 请为这个项目设计整体架构"
})
```

### 方法 4: 使用 Task 工具（OpenCode 内置）

如果其他技能直接使用 Task 工具：

```javascript
Task({
  description: "搜索代码",
  prompt: "搜索相关代码",
  subagent_type: "explore"  // ← 将映射到司马懿
})
```

**注意**：由于已在 `opencode.json` 中配置了映射，即使直接使用 Task 工具，也会路由到对应的武将。

## 验证配置

运行测试脚本验证配置：

```bash
cd ~/.config/opencode/plugins/ultrawork-sanguo
node test-subagent-mapping.js
```

## 自定义映射

如果需要添加新的映射或修改现有映射，编辑文件：

```
~/.config/opencode/plugins/ultrawork-sanguo/config/subagent-mapping.json
```

格式：

```json
{
  "mappings": {
    "new-type": {
      "agent": "zhaoyun",
      "category": "deep",
      "description": "新类型 → 赵云",
      "model": "bailian/qwen3.5-plus",
      "fallback_models": ["bailian/glm-5"]
    }
  }
}
```

## 故障排除

### 问题：任务没有路由到预期的武将

**排查步骤：**

1. 检查 `opencode.json` 中是否定义了对应的 agent
2. 检查 `ultrawork-sanguo.json` 的 `task_routing.rules` 是否有对应规则
3. 运行测试脚本验证映射配置
4. 查看日志输出确认路由决策

### 问题：subagent_type 参数不生效

**解决方案：**

确保使用的是 `ultrawork_task` 工具而不是 `Task` 工具：

```javascript
// ✅ 正确
ultrawork_task({ subagent_type: "explore", ... })

// ❌ 不会使用三国军团路由
Task({ subagent_type: "explore", ... })
```

## 技术细节

### 路由优先级

当调用 `ultrawork_task` 时，路由决策按以下优先级：

1. **agent 参数** - 直接指定武将名（最高优先级）
2. **@武将名** - 从 prompt 中解析提及
3. **subagent_type 参数** - OpenCode 内置类型映射
4. **category 参数** - 任务类别
5. **自动检测** - 基于任务描述关键词（最低优先级）

### 代码流程

```
用户调用 ultrawork_task
    ↓
解析参数 (description, prompt, agent, category, subagent_type)
    ↓
按优先级选择路由策略
    ↓
如果是 subagent_type → 调用 routeBySubagentType()
    ↓
获取映射的武将 (如: explore → simayi)
    ↓
构建 agent 配置和系统提示
    ↓
执行 Task 工具
    ↓
返回结果
```

## 参考

- [UltraWork 三国军团配置](./config/ultrawork-sanguo.json)
- [subagent 映射配置](./config/subagent-mapping.json)
- [subagent 路由器](./dist/agents/subagent-router.js)
