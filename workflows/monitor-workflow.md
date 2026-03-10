---
name: monitor-workflow
description: 监控诊断完整工作流 - 全方位系统监控
model: bailian/glm-5
---

# 监控诊断工作流

全方位系统监控和诊断流程。

## 适用场景

- 系统监控
- 问题诊断
- 日志分析
- 性能监控

## 触发方式

```
/workflow monitor <监控范围>
```

## 4阶段流程

### Phase 1: 前端监控 (Frontend)

**目标**: 监控前端状态

**执行将领**:
- **程昱** - 前端监控专家

**检查项**:
- Console日志
- Network请求
- JavaScript错误
- Vue警告

**输出**: 前端监控报告

---

### Phase 2: 后端监控 (Backend)

**目标**: 监控后端状态

**执行将领**:
- **贾诩** - 后端监控专家

**检查项**:
- API响应异常
- 数据库慢查询
- 系统资源(CPU/Memory)
- 服务健康状态

**输出**: 后端监控报告

---

### Phase 3: 日志分析 (Logs)

**目标**: 分析系统日志

**执行将领**:
- **司马懿** - 日志分析
- **司马师** - 深度分析

**输出**: 日志分析报告

---

### Phase 4: 综合诊断 (Diagnosis)

**目标**: 综合诊断问题

**执行将领**:
- **满宠** - 监察指挥官
- **诸葛亮** - 综合决策

**输出**: 诊断报告、修复建议

---

## 输出格式

```json
{
  "monitor": {
    "frontend": { "errors": [], "warnings": [], "status": "OK" },
    "backend": { "errors": [], "slowQueries": [], "status": "OK" },
    "logs": { "critical": [], "error": [], "warning": [] },
    "diagnosis": { "issues": [], "recommendations": [] }
  }
}
```
