# UltraWork 智能调度系统 - 使用指南

## 🎯 概述

基于 Session 状态的实时武将调度系统已部署完成！系统提供三种模式：

1. **模式一**: Session Router - 智能路由自动分配
2. **模式二**: Decision Matrix - 决策矩阵动态决策
3. **模式三**: Session Monitor - 实时监控自动调度

---

## 📡 API 端点

### 1. 决策矩阵 API
```http
GET http://localhost:3459/api/decision/matrix
```

**返回示例**:
```json
{
  "success": true,
  "sessionId": "default",
  "loadFactor": 0,
  "loadLevel": "idle",
  "activeCount": 0,
  "idleCount": 45,
  "recommendations": {
    "frontend": [{"id":"gaoshun", "name":"高顺", ...}],
    "backend": [{"id":"chendao", "name":"陈到", ...}],
    "review": [{"id":"guanyu", "name":"关羽", ...}],
    "security": [...],
    "database": [...],
    "quickfix": [...]
  },
  "strategies": {
    "idle": {"name":"全阵容模式", "maxParallel":5, "icon":"🏰"},
    "normal": {"name":"标准模式", "maxParallel":3, "icon":"⚔️"},
    "heavy": {"name":"精简模式", "maxParallel":2, "icon":"🔥"},
    "overloaded": {"name":"紧急模式", "maxParallel":1, "icon":"⚡"}
  },
  "currentStrategy": "idle"
}
```

---

### 2. 智能推荐 API
```http
GET http://localhost:3459/api/recommendations
```

**返回示例**:
```json
{
  "success": true,
  "sessionId": "default",
  "loadFactor": 0,
  "activeCount": 0,
  "recommendations": [
    {
      "type": "optimal",
      "icon": "✅",
      "title": "推荐配置",
      "description": "Session 状态良好，可启动标准工作流",
      "action": "standard",
      "suggestedAgents": ["zhugeliang", "zhaoyun", "gaoshun"]
    },
    {
      "type": "info",
      "icon": "🟢",
      "title": "可用武将",
      "description": "当前有 45 位武将空闲",
      "action": "none",
      "agents": [...]
    }
  ]
}
```

---

### 3. 智能路由方案 API
```http
POST http://localhost:3459/api/router/plan
Content-Type: application/json

{
  "task": "修复登录验证码问题",
  "category": "bugfix"
}
```

**返回示例**:
```json
{
  "success": true,
  "sessionId": "default",
  "loadFactor": 0,
  "loadLevel": "idle",
  "task": {
    "description": "修复登录验证码问题",
    "category": "bugfix",
    "name": "快速修复",
    "icon": "🐛",
    "time": "5-15分钟"
  },
  "strategy": {
    "name": "full-team",
    "maxParallel": 5,
    "primary": "zhugeliang",
    "secondary": ["zhaoyun", "simayi"],
    "support": ["gaoshun", "chendao"],
    "reason": "Session 空闲，启动完整工作流"
  },
  "estimatedTime": "5-15分钟"
}
```

---

## 🎮 使用示例

### 示例 1: JavaScript 调用

```javascript
// 获取决策矩阵
async function getDecisionMatrix() {
  const response = await fetch('http://localhost:3459/api/decision/matrix');
  const data = await response.json();
  
  console.log(`当前负载: ${(data.loadFactor * 100).toFixed(1)}%`);
  console.log(`负载等级: ${data.loadLevel}`);
  console.log(`空闲武将: ${data.idleCount} 人`);
  console.log(`当前策略: ${data.strategies[data.currentStrategy].name}`);
}

// 获取智能推荐
async function getRecommendations() {
  const response = await fetch('http://localhost:3459/api/recommendations');
  const data = await response.json();
  
  for (const rec of data.recommendations) {
    console.log(`${rec.icon} ${rec.title}: ${rec.description}`);
  }
}

// 获取路由方案
async function getRoutingPlan(task, category) {
  const response = await fetch('http://localhost:3459/api/router/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, category })
  });
  
  const data = await response.json();
  console.log('分配方案:', data.strategy);
  console.log('主将:', data.strategy.primary);
  console.log('副将:', data.strategy.secondary.join(', '));
}

// 使用示例
getRoutingPlan('修复登录验证码问题', 'bugfix');
```

---

### 示例 2: cURL 命令

```bash
# 获取决策矩阵
curl http://localhost:3459/api/decision/matrix | jq

# 获取智能推荐
curl http://localhost:3459/api/recommendations | jq

# 获取路由方案
curl -X POST http://localhost:3459/api/router/plan \
  -H "Content-Type: application/json" \
  -d '{"task":"实现用户管理功能","category":"feature"}' | jq
```

---

### 示例 3: 使用 Node.js 模块

```javascript
const SessionRouter = require('./ultrawork-session-router');
const DecisionMatrix = require('./decision-matrix');
const { SessionMonitor } = require('./session-monitor-hook');

// 模式一：智能路由
async function useRouter() {
  const plan = await SessionRouter.routeBySessionState(
    'default', 
    '修复登录问题', 
    { category: 'quick' }
  );
  
  console.log('主将:', plan.primary);
  console.log('副将:', plan.secondary);
  console.log('预计时间:', plan.estimatedTime, '分钟');
}

// 模式二：决策矩阵
async function useDecisionMatrix() {
  const decision = DecisionMatrix.decide('idle', 'feature', {
    needsFrontend: true,
    needsBackend: true
  });
  
  console.log(DecisionMatrix.generateReport(decision));
}

// 模式三：实时监控
async function useMonitor() {
  const monitor = new SessionMonitor('default');
  
  // 监听事件
  monitor.on('update', (data) => {
    console.log(`负载: ${(data.analysis.loadFactor * 100).toFixed(1)}%`);
  });
  
  monitor.on('overload', (data) => {
    console.warn('⚠️ Session 过载!');
  });
  
  monitor.start();
}
```

---

## 📊 负载等级说明

| 等级 | 负载范围 | 策略 | 最大并行 |
|------|----------|------|----------|
| idle | 0-30% | 全阵容模式 | 5人 |
| normal | 30-60% | 标准模式 | 3人 |
| heavy | 60-80% | 精简模式 | 2人 |
| overloaded | >80% | 紧急模式 | 1人 |

---

## 🎯 任务类别

| 类别 | 适用场景 | 推荐武将 |
|------|----------|----------|
| bugfix | Bug修复 | 张飞、雷绪、吴兰 |
| feature | 功能开发 | 赵云、高顺、陈到 |
| refactor | 代码重构 | 严颜、魏延 |
| review | 代码审查 | 关羽、关平 |
| performance | 性能优化 | 钟会、吴懿、乐进 |
| architecture | 架构设计 | 周瑜、邓艾 |
| security | 安全审计 | 于禁、关索、周仓 |
| database | 数据库操作 | 张辽、乐进、李典 |

---

## 🔌 WebSocket 实时推送

连接到 WebSocket 可接收实时决策更新：

```javascript
const ws = new WebSocket('ws://localhost:3459/ws?session=default');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'MONITOR_UPDATE') {
    console.log('负载:', data.analysis.loadFactor);
    console.log('推荐:', data.recommendations);
  }
  
  if (data.type === 'LOAD_WARNING') {
    console.warn('警告:', data.message);
  }
};
```

---

## 📁 文件说明

| 文件 | 功能 |
|------|------|
| `ultrawork-session-router.js` | 智能路由系统 |
| `decision-matrix.js` | 决策矩阵系统 |
| `session-monitor-hook.js` | 实时监控钩子 |
| `examples-smart-dispatch.js` | 使用示例代码 |

---

## ✅ 快速开始

1. **确保服务器运行**:
   ```bash
   node state-server-v5.cjs
   ```

2. **测试 API**:
   ```bash
   curl http://localhost:3459/api/decision/matrix
   ```

3. **运行示例**:
   ```bash
   node examples-smart-dispatch.js
   ```

4. **打开 Web 面板**:
   ```
   http://localhost:3459
   ```

---

## 🎉 完成！

系统现在支持：
- ✅ 基于 Session 负载的智能调度
- ✅ 45位武将的自动分配
- ✅ 实时监控和过载保护
- ✅ WebSocket 实时推送
- ✅ RESTful API 访问
