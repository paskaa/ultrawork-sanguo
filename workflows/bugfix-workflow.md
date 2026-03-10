---
name: bugfix-workflow
description: Bug修复完整工作流 - 6阶段质量保证流程
model: bailian/glm-5
---

# Bug修复工作流

6阶段完整流程，确保Bug修复的质量和可靠性。

## 适用场景

- Bug修复
- 问题排查
- 错误修复
- 异常处理

## 触发方式

```
/workflow bugfix <问题描述>
```

## 6阶段流程

### Phase 1: 分析阶段 (Analysis)

**目标**: 定位问题根因，分析影响范围

**执行将领**:
- **司马懿** - 主分析，代码探索
- **司马师** - 深度分析，根因定位

**输出**:
```json
{
  "analysis": {
    "rootCause": "问题根因",
    "affectedFiles": ["文件列表"],
    "severity": "严重程度",
    "recommendation": "修复建议"
  }
}
```

---

### Phase 2: 规划阶段 (Planning)

**目标**: 制定修复方案，确定实施步骤

**执行将领**:
- **周瑜** - 方案规划
- **鲁肃** - 资源评估
- **黄盖** - 执行落地

**输出**:
```json
{
  "plan": {
    "approach": "修复方案",
    "steps": ["步骤1", "步骤2"],
    "filesToModify": ["文件列表"],
    "riskAssessment": "风险评估"
  }
}
```

---

### Phase 3: 修复阶段 (Fix)

**目标**: 执行代码修复

**执行将领**:
- **张飞** - 快速修复
- **赵云** - 深度修复
- **高顺** - 前端修复
- **陈到** - 后端修复

**输入**: Phase 1 & 2 的输出

**输出**:
```json
{
  "fix": {
    "modifiedFiles": ["文件列表"],
    "changes": "变更描述",
    "testStrategy": "测试策略"
  }
}
```

---

### Phase 4: 审查阶段 (Review)

**目标**: 代码质量审查

**执行将领**:
- **关羽** - 代码审查
- **关平** - 规范检查
- **周仓** - 安全检查

**输入**: Phase 3 的修改

**输出**:
```json
{
  "review": {
    "issues": ["问题列表"],
    "approval": true/false,
    "suggestions": ["建议"]
  }
}
```

---

### Phase 5: 测试阶段 (Test)

**目标**: 验证修复效果

**执行将领**:
- **徐庶** - 测试专家
- **庞林** - 前端测试
- **严颜** - 后端测试
- **刘晔** - E2E测试

**输入**: Phase 3 的修改

**输出**:
```json
{
  "test": {
    "unitTest": "单元测试结果",
    "integrationTest": "集成测试结果",
    "coverage": "覆盖率数据",
    "passed": true/false
  }
}
```

---

### Phase 6: 监控阶段 (Monitor)

**目标**: 检查运行时状态

**执行将领**:
- **满宠** - 监察指挥官
- **程昱** - 前端监控
- **贾诩** - 后端监控

**输出**:
```json
{
  "monitor": {
    "errors": ["错误列表"],
    "warnings": ["警告列表"],
    "status": "健康状态"
  }
}
```

---

## 验收判断

诸葛亮根据以下标准验收：

```javascript
function acceptWorkflow(results) {
  // 1. 审查通过
  if (!results.review.approval) return false;
  
  // 2. 测试通过
  if (!results.test.passed) return false;
  
  // 3. 监控正常
  if (results.monitor.errors.length > 0) return false;
  
  return true;
}
```

**如果不通过**: 返回 Phase 3 重新修复，最多重试3次。

---

## 完整示例

```
用户: /workflow bugfix 登录页面验证码不显示

诸葛亮: 启动Bug修复工作流

[Phase 1: 分析]
司马懿: 分析验证码组件...
司马师: 定位根因: 配置文件缺失...

[Phase 2: 规划]
周瑜: 制定修复方案...
鲁肃: 评估影响范围...

[Phase 3: 修复]
张飞: 修改配置文件...
高顺: 更新前端组件...

[Phase 4: 审查]
关羽: 代码审查通过

[Phase 5: 测试]
徐庶: 运行测试套件...
✓ 所有测试通过

[Phase 6: 监控]
满宠: 检查监控日志...
✓ 无新错误

[验收]
诸葛亮: ✅ 验收通过，工作流完成！
```
