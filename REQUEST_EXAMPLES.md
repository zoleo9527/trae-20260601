
# 蓝领招聘平台 API 请求示例

## 基础信息
- 服务地址: `http://localhost:8080`
- 所有接口返回统一格式: `{"code": 200, "message": "success", "data": {...}}`

**日期时间格式说明:**
- 请求格式: `yyyy-MM-dd'T'HH:mm:ss` (如 `2024-01-18T14:00:00`)
- 响应格式: `yyyy-MM-dd'T'HH:mm:ss` (如 `2024-01-18T14:00:00`)
- 支持的请求格式: `yyyy-MM-dd'T'HH:mm:ss` 或 `yyyy-MM-dd HH:mm:ss`

---

## 1. 首屏数据 - 获取今日待处理数据

```bash
curl -X GET http://localhost:8080/api/dashboard
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "todayPendingApplications": [...],
    "timeoutApplications": [...],
    "recentlyRejectedApplications": [...],
    "todayPendingInvitations": [...],
    "timeoutInvitations": [...],
    "noShowInvitations": [...],
    "expiredPositions": [...],
    "expiringSoonPositions": [...]
  }
}
```

**首屏数据说明:**
| 字段 | 说明 |
|------|------|
| todayPendingApplications | 今日待审核的报名 |
| timeoutApplications | 超过2小时未处理的报名 |
| recentlyRejectedApplications | 24小时内被拒绝的报名 |
| todayPendingInvitations | 今日待确认的面试邀约 |
| timeoutInvitations | 已过面试时间但未处理的邀约 |
| noShowInvitations | 爽约记录 |
| expiredPositions | 已过期的岗位 |
| expiringSoonPositions | 7天内即将过期的岗位 |

---

## 2. 候选报名 - 提交报名

```bash
curl -X POST http://localhost:8080/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "positionId": 1,
    "candidateName": "张三",
    "candidatePhone": "13900139001",
    "candidateIdCard": "310101199001011234",
    "age": 28,
    "gender": 1,
    "education": "初中",
    "workExperience": "3年工厂操作工经验",
    "skills": "会操作车床、铣床",
    "sourceChannel": "线下推荐",
    "judgmentNote": "候选人经验匹配，态度良好",
    "submittedBy": 3,
    "submittedByName": "招聘顾问"
  }'
```

**响应示例:**
```json
{
  "code": 200,
  "message": "报名成功",
  "data": {
    "id": 1,
    "positionId": 1,
    "positionName": "操作工",
    "candidateName": "张三",
    "candidatePhone": "13900139001",
    "status": 1,
    "statusDesc": "待审核",
    "submittedBy": 3,
    "submittedByName": "招聘顾问",
    "submittedAt": "2024-01-15 10:30:00"
  }
}
```

---

## 3. 候选报名 - 查询列表（分页）

```bash
curl -X GET "http://localhost:8080/api/applications?pageNum=1&pageSize=10&status=1&candidateName=张"
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| pageNum | Integer | 页码（默认1） |
| pageSize | Integer | 每页数量（默认10） |
| positionId | Long | 岗位ID |
| status | Integer | 状态：1待审核 2已确认 3已拒绝 4面试中 5已入职 6已放弃 |
| candidateName | String | 候选人姓名（模糊匹配） |
| candidatePhone | String | 候选人手机号（模糊匹配） |
| startTime | DateTime | 提交开始时间 |
| endTime | DateTime | 提交结束时间 |

---

## 4. 候选报名 - 确认审核通过

```bash
curl -X PUT http://localhost:8080/api/applications/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": 2,
    "operatorId": 2,
    "operatorName": "运营人员"
  }'
```

**状态值说明:**
| 值 | 状态 |
|----|------|
| 1 | 待审核 |
| 2 | 已确认 |
| 3 | 已拒绝 |
| 4 | 面试中 |
| 5 | 已入职 |
| 6 | 已放弃 |

---

## 5. 候选报名 - 拒绝报名

```bash
curl -X PUT http://localhost:8080/api/applications/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": 3,
    "operatorId": 2,
    "operatorName": "运营人员",
    "rejectedReason": "年龄不符合要求"
  }'
```

---

## 6. 面试邀约 - 创建邀约

```bash
curl -X POST http://localhost:8080/api/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": 1,
    "interviewTime": "2024-01-18T14:00:00",
    "interviewLocation": "上海市浦东新区张江高科技园区测试公司办公楼3楼会议室",
    "interviewerName": "李经理",
    "interviewerPhone": "13800138004",
    "invitedBy": 4,
    "invitedByName": "企业HR",
    "remark": "请携带身份证和简历"
  }'
```

**响应示例:**
```json
{
  "code": 200,
  "message": "面试邀约创建成功",
  "data": {
    "id": 1,
    "applicationId": 1,
    "positionId": 1,
    "candidateName": "张三",
    "interviewTime": "2024-01-18 14:00:00",
    "interviewLocation": "上海市浦东新区张江高科技园区测试公司办公楼3楼会议室",
    "status": 1,
    "statusDesc": "待确认",
    "invitedBy": 4,
    "invitedByName": "企业HR",
    "application": {
      "id": 1,
      "candidateName": "张三",
      "judgmentNote": "候选人经验匹配，态度良好",
      "submittedByName": "招聘顾问"
    }
  }
}
```

---

## 7. 面试邀约 - 确认参加

```bash
curl -X PUT http://localhost:8080/api/invitations/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": 2,
    "operatorId": 4,
    "operatorName": "企业HR"
  }'
```

**面试邀约状态值:**
| 值 | 状态 |
|----|------|
| 1 | 待确认 |
| 2 | 已确认 |
| 3 | 爽约 |
| 4 | 已完成 |
| 5 | 已拒绝 |
| 6 | 已过期 |

---

## 8. 面试邀约 - 标记爽约

```bash
curl -X PUT http://localhost:8080/api/invitations/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": 3,
    "operatorId": 4,
    "operatorName": "企业HR",
    "noShowReason": "电话无人接听，未按时到达"
  }'
```

---

## 9. 候选报名 - 查询今日待处理

```bash
curl -X GET http://localhost:8080/api/applications/today-pending
```

---

## 10. 候选报名 - 查询超时未处理

```bash
curl -X GET http://localhost:8080/api/applications/timeout
```

---

## 11. 候选报名 - 查询最近退回

```bash
curl -X GET http://localhost:8080/api/applications/recently-rejected
```

---

## 12. 面试邀约 - 查询今日待处理

```bash
curl -X GET http://localhost:8080/api/invitations/today-pending
```

---

## 13. 面试邀约 - 查询超时

```bash
curl -X GET http://localhost:8080/api/invitations/timeout
```

---

## 14. 面试邀约 - 按报名ID查询历史邀约

```bash
curl -X GET http://localhost:8080/api/invitations/application/1
```

---

## 15. 面试邀约 - 查询爽约记录

```bash
curl -X GET http://localhost:8080/api/invitations/no-show
```

---

## 角色说明

| 角色ID | 角色名称 | 职责 |
|--------|----------|------|
| 1 | 管理员 | 系统管理，全局权限 |
| 2 | 运营 | 审核报名，状态变更 |
| 3 | 招聘顾问 | 提交候选报名 |
| 4 | 企业HR | 创建面试邀约，确认面试 |

---

## 状态流转图

**候选报名:**
```
待审核 → 已确认 → 面试中 → 已入职
         ↓
       已拒绝 → 待审核(可重新提交)
         ↓
       已放弃(面试爽约时自动推进)
```

**候选报名状态机规则:**
- 待审核: 只能变更为已确认或已拒绝
- 已确认: 只能变更为面试中或已放弃
- 已拒绝: 只能重新变更为待审核
- 面试中: 只能变更为已入职或已放弃
- 已入职/已放弃: 无法修改

**面试邀约:**
```
待确认 → 已确认 → 已完成
         ↓
       爽约(报名自动推进为已放弃)
         ↓
       已拒绝(报名自动推进为已放弃)
         ↓
       已过期
```

**面试邀约状态机规则:**
- 待确认: 只能变更为已确认或已拒绝
- 已确认: 只能变更为已完成或爽约
- 爽约/已完成/已拒绝/已过期: 无法修改

**状态同步规则:**
1. 面试邀约"已确认" → 报名状态推进为"面试中"
2. 面试邀约"爽约" → 报名状态推进为"已放弃"
3. 面试邀约"已拒绝" → 报名状态推进为"已放弃"
4. 创建面试邀约时，自动校验岗位状态和过期时间
