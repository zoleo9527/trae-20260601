# 音乐培训机构-考级曲目与练习计划系统 - 技术架构文档

## 一、需求分析

### 1.1 核心痛点
- 信息散在旧台账、现场记录和沟通截图，难以形成完整的状态链路
- 状态变化比字段数量更重要，需要清晰的状态流转机制
- 不同角色（教务老师、任课老师、家长顾问）需要各自的待办视图

### 1.2 核心需求
1. **统一记录模型**：考级曲目、练习计划、退回原因、补充备注在同一条记录中
2. **角色化待办**：教务/任课老师、家长顾问各自看到自己的待办
3. **状态流转清晰**：避免信息分散在临时状态
4. **练习计划回看**：支持历史计划查看
5. **异常处理**：支持退回、补充等异常流程
6. **操作日志**：完整记录所有操作

---

## 二、架构设计

### 2.1 架构风格
- **前后端分离**：前端负责展示和交互，后端负责业务逻辑和数据持久化
- **状态机驱动**：核心业务对象采用状态机模式管理生命周期

### 2.2 模块划分

| 层级 | 模块 | 职责 |
|------|------|------|
| 前端 | 待办列表 | 展示不同角色的待办任务 |
| 前端 | 详情抽屉 | 查看记录详情、操作日志、异常处理 |
| 前端 | 练习计划回看 | 历史练习计划列表与详情 |
| 后端 | 考级曲目服务 | 曲目管理、状态流转 |
| 后端 | 练习计划服务 | 计划制定、进度跟踪 |
| 后端 | 权限服务 | 角色权限校验 |
| 后端 | 日志服务 | 操作日志记录 |

---

## 三、核心数据模型

### 3.1 考级曲目记录（ExamTrackRecord）

```typescript
interface ExamTrackRecord {
  id: string;                    // 主键
  studentId: string;             // 学员ID
  studentName: string;           // 学员姓名
  instrument: string;            // 乐器类型
  examLevel: string;             // 考级级别
  trackName: string;             // 曲目名称
  trackType: 'required' | 'optional'; // 曲目类型（必考/选考）
  practicePlan: PracticePlan;    // 练习计划（内嵌）
  status: ExamTrackStatus;       // 当前状态
  rejectReason?: string;         // 退回原因
  supplementNotes?: string;      // 补充备注
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}
```

### 3.2 练习计划（PracticePlan）

```typescript
interface PracticePlan {
  id: string;
  recordId: string;              // 关联考级曲目记录ID
  dailyGoals: DailyGoal[];       // 每日练习目标
  weeklyFocus: string;           // 本周重点
  durationWeeks: number;         // 计划持续周数
  startDate: Date;               // 开始日期
  endDate: Date;                 // 结束日期
  progress: number;              // 进度百分比 0-100
}

interface DailyGoal {
  dayOfWeek: number;             // 星期几 1-7
  durationMinutes: number;       // 练习时长（分钟）
  focusPoints: string[];         // 练习重点
  tempoRange: string;            // 速度范围
}
```

### 3.3 状态枚举（ExamTrackStatus）

```typescript
enum ExamTrackStatus {
  DRAFT = 'draft',                           // 草稿
  SUBMITTED_BY_TEACHER = 'submitted_by_teacher',  // 任课老师提交
  REVIEWING_BY_ADMIN = 'reviewing_by_admin',     // 教务审核中
  APPROVED = 'approved',                     // 已通过
  REJECTED = 'rejected',                     // 已退回
  SUPPLEMENTED = 'supplemented',             // 已补充
  IN_PRACTICE = 'in_practice',               // 练习中
  COMPLETED = 'completed',                   // 已完成
  EXAM_PASSED = 'exam_passed',               // 考级通过
  EXAM_FAILED = 'exam_failed'                // 考级未通过
}
```

### 3.4 操作日志（OperationLog）

```typescript
interface OperationLog {
  id: string;
  recordId: string;              // 关联记录ID
  operatorId: string;            // 操作人ID
  operatorName: string;          // 操作人姓名
  operatorRole: UserRole;        // 操作人角色
  operationType: OperationType;  // 操作类型
  previousStatus?: ExamTrackStatus; // 操作前状态
  newStatus: ExamTrackStatus;    // 操作后状态
  comment?: string;              // 操作备注
  createdAt: Date;               // 操作时间
}

enum OperationType {
  CREATE = 'create',
  SUBMIT = 'submit',
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUPPLEMENT = 'supplement',
  UPDATE_PLAN = 'update_plan',
  UPDATE_PROGRESS = 'update_progress',
  COMPLETE = 'complete',
  CONFIRM_EXAM_RESULT = 'confirm_exam_result'
}

enum UserRole {
  ADMIN = 'admin',               // 教务老师
  TEACHER = 'teacher',           // 任课老师
  CONSULTANT = 'consultant'      // 家长顾问
}
```

---

## 四、状态流转图

```
                    ┌─────────────┐
                    │   DRAFT     │
                    │   (草稿)    │
                    └──────┬──────┘
                           │ 任课老师提交
                           ▼
                    ┌─────────────┐
                    │ SUBMITTED   │
                    │   (已提交)  │
                    └──────┬──────┘
                           │ 教务审核
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌───────────┐            ┌───────────┐
       │ APPROVED  │            │ REJECTED  │
       │  (已通过) │            │  (已退回) │
       └─────┬─────┘            └─────┬─────┘
             │                         │
             │ 开始练习                │ 补充修改
             ▼                         ▼
       ┌───────────┐            ┌───────────┐
       │IN_PRACTICE│◄───────────│SUPPLEMENTED│
       │  (练习中) │            │  (已补充)  │
       └─────┬─────┘            └───────────┘
             │
             │ 完成练习
             ▼
       ┌───────────┐
       │COMPLETED  │
       │  (已完成) │
       └─────┬─────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌───────────┐   ┌───────────┐
│EXAM_PASSED│   │EXAM_FAILED│
│ (考级通过)│   │(考级未通过)│
└───────────┘   └───────────┘
```

---

## 五、前后端边界

### 5.1 前端职责
- 角色身份识别与展示适配
- 待办列表筛选与展示
- 详情页/抽屉的UI渲染
- 操作表单校验
- 状态变更的交互反馈
- 操作日志的时间线展示

### 5.2 后端职责
- 用户认证与权限校验
- 状态流转逻辑控制
- 数据持久化
- 操作日志记录
- 业务规则校验
- 数据聚合与统计

### 5.3 API接口设计

| API路径 | HTTP方法 | 所属模块 | 功能描述 |
|---------|----------|----------|----------|
| `/api/exam-tracks` | GET | 考级曲目 | 查询待办列表（按角色过滤） |
| `/api/exam-tracks/:id` | GET | 考级曲目 | 获取单条记录详情（含练习计划和操作日志） |
| `/api/exam-tracks` | POST | 考级曲目 | 创建新记录 |
| `/api/exam-tracks/:id` | PUT | 考级曲目 | 更新记录（含练习计划） |
| `/api/exam-tracks/:id/submit` | POST | 考级曲目 | 任课老师提交审核 |
| `/api/exam-tracks/:id/approve` | POST | 考级曲目 | 教务审核通过 |
| `/api/exam-tracks/:id/reject` | POST | 考级曲目 | 教务退回（含退回原因） |
| `/api/exam-tracks/:id/supplement` | POST | 考级曲目 | 补充修改 |
| `/api/exam-tracks/:id/complete` | POST | 考级曲目 | 标记完成 |
| `/api/exam-tracks/:id/confirm-exam` | POST | 考级曲目 | 确认考级结果 |
| `/api/exam-tracks/:id/logs` | GET | 操作日志 | 获取记录的操作日志列表 |

---

## 六、数据库设计

### 6.1 表结构

**exam_track_records 表**

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| student_id | VARCHAR(36) | NOT NULL | 学员ID |
| student_name | VARCHAR(100) | NOT NULL | 学员姓名 |
| instrument | VARCHAR(50) | NOT NULL | 乐器类型 |
| exam_level | VARCHAR(20) | NOT NULL | 考级级别 |
| track_name | VARCHAR(200) | NOT NULL | 曲目名称 |
| track_type | ENUM | NOT NULL | required/optional |
| practice_plan | JSON | NOT NULL | 练习计划JSON |
| status | ENUM | NOT NULL | 状态枚举 |
| reject_reason | TEXT | NULL | 退回原因 |
| supplement_notes | TEXT | NULL | 补充备注 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**operation_logs 表**

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| record_id | VARCHAR(36) | FOREIGN KEY | 关联记录ID |
| operator_id | VARCHAR(36) | NOT NULL | 操作人ID |
| operator_name | VARCHAR(100) | NOT NULL | 操作人姓名 |
| operator_role | ENUM | NOT NULL | 角色枚举 |
| operation_type | ENUM | NOT NULL | 操作类型 |
| previous_status | ENUM | NULL | 操作前状态 |
| new_status | ENUM | NOT NULL | 操作后状态 |
| comment | TEXT | NULL | 操作备注 |
| created_at | DATETIME | NOT NULL | 操作时间 |

**users 表**

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL | 用户姓名 |
| role | ENUM | NOT NULL | admin/teacher/consultant |
| created_at | DATETIME | NOT NULL | 创建时间 |

---

## 七、权限控制

| 角色 | 权限范围 | 可执行操作 |
|------|----------|------------|
| 教务老师(admin) | 所有记录 | 审核通过、退回、确认考级结果 |
| 任课老师(teacher) | 自己创建的记录 | 创建、提交、更新、补充、标记完成、更新进度 |
| 家长顾问(consultant) | 所有记录 | 查看详情、查看操作日志 |

---

## 八、关键设计要点

### 8.1 状态一致性保障
- 每次状态变更必须记录操作日志
- 状态流转严格遵循状态机规则
- 乐观锁机制防止并发修改冲突

### 8.2 数据完整性
- 练习计划内嵌在考级曲目记录中，确保数据一致性
- 操作日志与主记录强关联，便于追溯

### 8.3 性能优化
- 待办列表支持分页
- 操作日志按需加载
- 索引优化：status、student_id、operator_role