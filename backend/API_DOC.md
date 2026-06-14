# 驾校运营-考试预约与补考跟进系统 API 文档

## 概述

本系统实现驾校学员档案、教练排班、考试预约与补考跟进的全流程管理。通过角色权限控制和状态约束，确保各角色之间的信息交接清晰可追溯。

### 核心角色

| 角色 | 英文标识 | 核心职责 | 处理入口 |
|------|----------|----------|----------|
| 招生顾问 | admission_consultant | 学员档案管理、费用收缴、补考费用跟进 | 学员列表、费用管理、补考缴费 |
| 教练 | coach | 发布排班、确认练车、查看学员进度 | 我的排班、我的学员 |
| 考试专员 | exam_specialist | 发布考试场次、审核预约、约考、录入成绩 | 考试预约审核、场次管理、成绩录入 |
| 管理员 | admin | 系统管理、用户管理、全量数据查看 | 全部模块 |

### 通用请求头

所有需要身份认证的接口必须在请求头中携带：

```
X-User-Id: <用户ID>
X-User-Role: <角色标识: admission_consultant/coach/exam_specialist/admin>
```

---

## 模型关系图

```
users (用户表)
├── role: admission_consultant/coach/exam_specialist/admin
└── 关联
    ├─→ coaches (教练信息) [1:1, 仅 role=coach]
    │   └─→ coach_schedules (教练排班) [1:N]
    │       └─→ students (学员) [N:1, 预约时关联]
    ├─→ students (学员) [N:1, created_by]
    │   ├── coach_id → users (分配教练) [N:1]
    │   ├── exam_bookings (考试预约) [1:N]
    │   │   ├── exam_session_id → exam_sessions [N:1]
    │   │   ├── original_booking_id → exam_bookings [N:1, 补考关联]
    │   │   └── status流转: pending→approved→booked→attended→passed/failed
    │   │                              ↘rejected  ↘cancelled  ↘no_show
    │   ├── makeup_exams (补考记录) [1:N]
    │   │   ├── failed_booking_id → exam_bookings [1:1]
    │   │   ├── new_booking_id → exam_bookings [1:1]
    │   │   └── status流转: pending_payment→pending_booking→booked→completed
    │   │                                          ↘cancelled
    │   └── fee_records (费用记录) [1:N]
    │       └── status: unpaid→partial→paid
    └─→ exam_sessions (考试场次) [N:1, created_by]
        └── status: open→full→closed→completed/cancelled

operation_logs (操作日志) - 全表操作留痕
notifications (通知) - 跨角色消息通知
```

---

## 状态约束说明

### 考试预约状态流转

```
pending (待审核)
    ↓ [exam_specialist/admin]
┌───┴───┐
↓       ↓
approved rejected(终态)
    ↓ [exam_specialist/admin]
  booked (已约考)
    ↓ [exam_specialist/admin]
┌───┼───────────┐
↓   ↓           ↓
attended cancelled(终态) no_show(终态)
    ↓ [exam_specialist/admin]
┌───┴───┐
↓       ↓
passed(终态) failed(终态)→自动创建补考记录
```

### 补考状态流转

```
pending_payment (待缴费)
    ↓ [admission_consultant/admin]
pending_booking (待约考)
    ↓ [exam_specialist/admin]
  booked (已约考)
    ↓ [exam_specialist/admin]
┌───┴───┐
↓       ↓
completed(终态) cancelled(终态)
```

### 教练排班状态流转

```
available (可预约)
    ↓ [admission_consultant/coach/admin]
  booked (已预约)
    ↓ [coach/admin]
┌───┴───┐
↓       ↓
completed(终态) cancelled(终态)
```

---

## 接口列表

### 1. 工作台 Dashboard

#### GET /api/dashboard
获取工作台首页数据，包含优先级展示

**权限**: 所有登录用户

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "陈专员", "role": "exam_specialist", "role_name": "考试专员" },
    "dashboardConfig": { "title": "考试专员工作台", "quickActions": [...], "stats": [...] },
    "stats": {
      "total_students": 8,
      "pending_approval_count": 2,
      "upcoming_exams": 5,
      "pass_rate": 85.5
    },
    "priorityItems": [
      {
        "id": "...",
        "type": "exam_approval",
        "priority": "urgent",
        "priorityWeight": 100,
        "title": "周小明 - 科目1 待审核",
        "description": "申请时间: 2026-06-14 18:30:00"
      }
    ],
    "stuckItems": [
      {
        "id": "...",
        "type": "approval_stuck",
        "title": "周小明 - 审核超时",
        "description": "科目1 预约申请已超过24小时未处理",
        "stuckHours": 26
      }
    ],
    "recentChanges": [
      {
        "id": "...",
        "operator_name": "陈专员",
        "action": "record_result",
        "target_display": "郑小强 - 科目3",
        "detail": "录入考试结果: 通过，得分: 95",
        "time_ago": "15分钟前"
      }
    ]
  }
}
```

**优先级排序规则**:
- 紧急(urgent): 待审核预约（权重100）
- 高(high): 补考待缴费（90）、补考待约考（80）
- 普通(normal): 明日考试提醒（70）
- 卡住项: 费用逾期>7天、审核超时>24小时、长期未练车>14天

### 2. 用户与权限

#### GET /api/users/me
获取当前用户信息

#### GET /api/users/me/todos
获取当前用户待办事项

#### GET /api/users
获取用户列表（支持按角色筛选）

### 3. 学员档案

#### POST /api/students
新增学员档案

**权限**: admission_consultant/admin

**请求体**:
```json
{
  "name": "张三",
  "id_card": "110101200001011234",
  "phone": "13900139000",
  "gender": "male",
  "license_type": "C1",
  "enroll_date": "2026-06-01",
  "coach_id": "<用户ID>",
  "current_subject": 1
}
```

#### GET /api/students
学员列表

**查询参数**: `status`, `keyword`, `coach_id`, `current_subject`, `offset`, `limit`

#### GET /api/students/:id
学员详情（含考试记录、补考记录、费用记录、练车记录、操作日志）

#### PUT /api/students/:id
更新学员信息

#### POST /api/students/:id/advance-subject
推进学员学习进度

### 4. 考试预约

#### POST /api/exam-bookings
提交考试预约申请

**请求体**:
```json
{
  "student_id": "<学员ID>",
  "subject": 1,
  "exam_session_id": "<场次ID，可选>"
}
```

#### GET /api/exam-bookings
预约列表

**查询参数**: `status`, `subject`, `student_id`, `is_makeup`, `offset`, `limit`

#### GET /api/exam-bookings/:id
预约详情（含状态流转时间线）

#### POST /api/exam-bookings/:id/approve
审核通过

**权限**: exam_specialist/admin

#### POST /api/exam-bookings/:id/reject
审核拒绝

**权限**: exam_specialist/admin

**请求体**: `{ "reason": "原因" }`

#### POST /api/exam-bookings/:id/book-session
预约考试场次

**权限**: exam_specialist/admin（权限动作：`exam_bookings.book_session`）

**请求体**: `{ "exam_session_id": "<场次ID>" }`

#### POST /api/exam-bookings/:id/record-result
录入考试成绩

**权限**: exam_specialist/admin

**请求体**:
```json
{
  "result": "passed",
  "score": 95,
  "is_attended": true,
  "fail_reason": "扣分过多"
}
```

**说明**:
- 成绩为`passed`时自动推进学员到下一科目
- 成绩为`failed`时自动创建补考记录并通知招生顾问
- `is_attended=false`时标记为`no_show`缺考

### 5. 补考跟进

#### GET /api/makeup-exams
补考列表

**权限**: admission_consultant/exam_specialist/admin

**查询参数**: `status`, `subject`, `student_id`, `offset`, `limit`

#### GET /api/makeup-exams/:id
补考详情

**权限**: admission_consultant/exam_specialist/admin

#### GET /api/makeup-exams/:id/review
补考回看（核心验收点）

**权限**: admission_consultant/exam_specialist/admin

**响应示例**:
```json
{
  "success": true,
  "data": {
    "subject_name": "科目二（场地驾驶）",
    "attemptCount": 2,
    "studentInfo": { "name": "吴小红", "current_subject": 2, "coach_name": "王教练" },
    "originalBooking": {
      "exam_date": "2026-06-21",
      "exam_score": 65,
      "status": "failed"
    },
    "allAttempts": [
      {
        "id": "...",
        "exam_date": "2026-06-21",
        "exam_score": 65,
        "status": "failed",
        "created_at": "2026-06-10 10:00:00"
      },
      {
        "id": "...",
        "status": "approved",
        "created_at": "2026-06-14 15:30:00"
      }
    ],
    "makeup": {
      "id": "...",
      "status": "pending_booking",
      "status_name": "待约考",
      "fee_paid": true,
      "makeup_fee": 250
    }
  }
}
```

#### GET /api/makeup-exams/student/:studentId/history
学员某科目补考历史

**权限**: admission_consultant/exam_specialist/admin

**查询参数**: `subject`

#### POST /api/makeup-exams/:id/record-payment
登记补考缴费

**权限**: admission_consultant/admin（权限动作：`makeup_exams.update_fee`）

**请求体**: `{ "amount": 250, "payment_method": "微信" }`

#### POST /api/makeup-exams/:id/book-exam
预约补考考试

**权限**: exam_specialist/admin（权限动作：`makeup_exams.book` + `exam_bookings.book_session`）

**请求体**: `{ "exam_session_id": "<场次ID>" }`

### 6. 考试场次

#### POST /api/exam-sessions
发布考试场次

**权限**: exam_specialist/admin

#### GET /api/exam-sessions
场次列表

#### GET /api/exam-sessions/available
可预约场次列表

**查询参数**: `subject`

#### GET /api/exam-sessions/:id
场次详情（含已预约学员列表）

#### PUT /api/exam-sessions/:id
更新场次信息

### 7. 教练排班

#### GET /api/coach/coaches
教练列表

#### GET /api/coach/coaches/:id
教练详情（含学员、排班）

#### POST /api/coach/schedules
发布排班

**权限**: coach/admin

**请求体**:
```json
{
  "coach_id": "<教练ID>",
  "schedule_date": "2026-06-20",
  "start_time": "08:00",
  "end_time": "10:00",
  "type": "practice"
}
```

#### GET /api/coach/schedules
排班列表

**查询参数**: `coach_id`, `student_id`, `schedule_date`, `status`, `type`

#### POST /api/coach/schedules/:id/book
预约练车

**权限**: admission_consultant/admin

**请求体**: `{ "student_id": "<学员ID>" }`

#### POST /api/coach/schedules/:id/complete
完成练车

**权限**: coach/admin

### 8. 费用管理

#### POST /api/fees
创建费用记录

**权限**: admission_consultant/admin

#### GET /api/fees
费用列表

#### POST /api/fees/:id/record-payment
登记缴费

**权限**: admission_consultant/admin

### 9. 操作日志

#### GET /api/logs
操作日志列表

**查询参数**: `target_type`, `target_id`, `operator_id`, `offset`, `limit`

---

## 错误码

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| E1001 | 请求参数校验失败 | 400 |
| E2001 | 学员档案不存在 | 404 |
| E2002 | 身份证号已存在 | 409 |
| E3001 | 教练不存在 | 404 |
| E3002 | 教练排班时间冲突 | 409 |
| E4001 | 考试预约记录不存在 | 404 |
| E4002 | 该场次考试名额已满 | 409 |
| E4003 | 考试预约状态不允许此操作 | 409 |
| E4004 | 该学员已预约此科目考试 | 409 |
| E4005 | 考试场次不存在 | 404 |
| E5001 | 补考记录不存在 | 404 |
| E5002 | 补考费用未结清，无法预约 | 409 |
| E6001 | 费用记录不存在 | 404 |
| E7001 | 用户不存在 | 404 |
| E7002 | 当前角色无权执行此操作 | 403 |
| E8001 | 无效的状态转换 | 409 |
| E9999 | 服务器内部错误 | 500 |

---

## 验收接口清单

验收时重点关注以下接口：

1. **首页优先级展示**
   - `GET /api/dashboard` - 验证待处理、卡住、最近修改三项展示

2. **考试预约处理**
   - `POST /api/exam-bookings` - 提交预约
   - `POST /api/exam-bookings/:id/approve` - 审核通过
   - `POST /api/exam-bookings/:id/book-session` - 预约场次
   - `POST /api/exam-bookings/:id/record-result` - 录入成绩（验证自动推进科目/自动创建补考）

3. **补考跟进回看**
   - `GET /api/makeup-exams/:id/review` - 补考回看完整数据
   - `GET /api/makeup-exams/student/:studentId/history` - 学员补考历史

4. **种子数据**
   - 运行 `npm run seed` 后验证各状态数据完整性

5. **模型关系与状态约束**
   - 验证各状态流转的前置条件检查
   - 验证跨角色操作的权限控制

---

## 快速开始

```bash
# 安装依赖
cd backend
npm install

# 初始化种子数据
npm run seed

# 启动服务
npm start

# 服务地址: http://localhost:3001
```

**测试示例**:
```bash
# 招生顾问查看工作台
curl -H "X-User-Id: <admission_id>" \
     -H "X-User-Role: admission_consultant" \
     http://localhost:3001/api/dashboard

# 考试专员查看待审核预约
curl -H "X-User-Id: <exam_id>" \
     -H "X-User-Role: exam_specialist" \
     http://localhost:3001/api/exam-bookings?status=pending

# 查看补考回看（需 admission_consultant/exam_specialist/admin 角色）
curl -H "X-User-Id: <user_id>" \
     -H "X-User-Role: <admission_consultant|exam_specialist|admin>" \
     http://localhost:3001/api/makeup-exams/<makeup_id>/review
```
