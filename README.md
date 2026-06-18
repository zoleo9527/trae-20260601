# 博物馆社教-活动签到与安全记录系统

基于 Go Fiber 框架构建的博物馆社教活动管理系统，支持课程报名、讲师排班、物料清单、活动签到和安全记录全流程管理。

## 技术栈

- **框架**: Go Fiber v2
- **数据库**: SQLite3
- **ORM**: GORM v1.9.16
- **UUID**: google/uuid

## 核心功能

### 1. 课程管理
- 课程创建、查询、更新、删除
- 支持容量限制和状态管理

### 2. 讲师管理
- 讲师信息管理
- 课程排班功能

### 3. 物料清单
- 物料管理
- 按课程汇总物料清单

### 4. 活动报名
- 学生报名课程
- 容量校验
- 报名状态管理

### 5. 活动签到
- 现场签到
- 签到驳回
- 补录签到
- 签到备注

### 6. 安全记录
- 安全状态记录
- 继承签到备注
- 完整追溯能力

### 7. 审计日志
- 操作记录
- 变更追踪
- 查询过滤

### 8. 幂等提交
- 防止重复提交
- 请求去重

## 项目结构

```
.
├── main.go                    # 入口文件
├── go.mod                     # Go 模块配置
├── go.sum                     # 依赖锁文件
├── .env                       # 环境变量配置
├── internal/
│   ├── config/                # 配置管理
│   │   └── config.go
│   ├── database/              # 数据库模型和连接
│   │   ├── database.go
│   │   └── models.go
│   ├── services/              # 业务逻辑层
│   │   ├── course_service.go
│   │   ├── instructor_service.go
│   │   ├── material_service.go
│   │   ├── signup_service.go
│   │   ├── checkin_service.go
│   │   ├── safety_service.go
│   │   ├── audit_service.go
│   │   └── idempotent_service.go
│   ├── controllers/           # 控制器层
│   │   ├── course_controller.go
│   │   ├── instructor_controller.go
│   │   ├── material_controller.go
│   │   ├── signup_controller.go
│   │   ├── checkin_controller.go
│   │   ├── safety_controller.go
│   │   └── audit_controller.go
│   └── routes/                # 路由配置
│       └── routes.go
└── database/                  # SQLite 数据库文件目录
    └── museum.db
```

## 快速开始

### 安装依赖

```bash
go mod download
```

### 运行服务

```bash
go run main.go
```

服务将在 `http://localhost:3000` 启动。

## API 接口文档

### 课程管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/courses` | 创建课程 |
| GET | `/api/courses` | 查询课程列表 |
| GET | `/api/courses/:id` | 查询课程详情 |
| PUT | `/api/courses/:id` | 更新课程 |
| DELETE | `/api/courses/:id` | 删除课程 |

**创建课程请求示例**:
```json
{
  "name": "古画修复入门",
  "description": "学习传统古画修复技艺",
  "capacity": 20,
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T12:00:00Z",
  "location": "博物馆多功能厅",
  "operator_id": "op001",
  "operator_name": "管理员"
}
```

### 讲师管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/instructors` | 创建讲师 |
| GET | `/api/instructors` | 查询讲师列表 |
| GET | `/api/instructors/:id` | 查询讲师详情 |
| PUT | `/api/instructors/:id` | 更新讲师 |
| POST | `/api/instructors/schedule` | 排班 |
| GET | `/api/instructors/:instructor_id/schedule` | 讲师排班查询 |
| GET | `/api/instructors/course/:course_id/schedule` | 课程排班查询 |

**排班请求示例**:
```json
{
  "instructor_id": "ins001",
  "course_id": "course001",
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T12:00:00Z"
}
```

### 物料清单

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/materials` | 创建物料 |
| GET | `/api/materials/course/:course_id` | 课程物料列表 |
| GET | `/api/materials/course/:course_id/list` | 物料清单汇总 |
| GET | `/api/materials/:id` | 查询物料 |
| PUT | `/api/materials/:id` | 更新物料 |
| DELETE | `/api/materials/:id` | 删除物料 |

**创建物料请求示例**:
```json
{
  "name": "修复毛笔",
  "quantity": 20,
  "unit": "支",
  "description": "用于古画修复的毛笔",
  "course_id": "course001"
}
```

### 活动报名

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/signups` | 报名课程 |
| GET | `/api/signups/course/:course_id` | 课程报名列表 |
| GET | `/api/signups/student/:student_id` | 学生报名记录 |
| GET | `/api/signups/:id` | 查询报名详情 |
| PUT | `/api/signups/:id` | 更新报名状态 |
| POST | `/api/signups/:id/cancel` | 取消报名 |

**报名请求示例**:
```json
{
  "course_id": "course001",
  "student_id": "stu001",
  "student_name": "张三",
  "phone": "13800138000"
}
```

### 活动签到

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/checkins` | 创建签到 |
| GET | `/api/checkins/course/:course_id` | 课程签到列表 |
| GET | `/api/checkins/:id` | 查询签到详情 |
| PUT | `/api/checkins/:id` | 更新签到 |
| POST | `/api/checkins/:id/reject` | 驳回签到 |
| POST | `/api/checkins/backfill` | 补录签到 |

**签到请求示例**:
```json
{
  "course_id": "course001",
  "student_id": "stu001",
  "student_name": "张三",
  "operator_id": "op001",
  "operator_name": "工作人员",
  "remarks": "迟到10分钟"
}
```

**驳回签到请求示例**:
```json
{
  "operator_id": "op001",
  "operator_name": "工作人员",
  "reason": "证件不符"
}
```

**补录签到请求示例**:
```json
{
  "course_id": "course001",
  "student_id": "stu001",
  "student_name": "张三",
  "operator_id": "op001",
  "operator_name": "工作人员",
  "remarks": "补录：当日遗漏签到"
}
```

### 安全记录

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/safety` | 创建安全记录 |
| GET | `/api/safety/course/:course_id` | 课程安全记录 |
| GET | `/api/safety/checkin/:checkin_id` | 签到安全记录 |
| GET | `/api/safety/:id` | 查询安全记录 |
| PUT | `/api/safety/:id` | 更新安全记录 |
| GET | `/api/safety/trace/:checkin_id` | 完整追溯 |

**创建安全记录请求示例**:
```json
{
  "checkin_id": "checkin001",
  "operator_id": "op001",
  "operator_name": "安全员",
  "safety_status": "safe",
  "safety_remarks": "学生状态良好"
}
```

**完整追溯响应示例**:
```json
{
  "checkin": {
    "id": "checkin001",
    "course_id": "course001",
    "student_id": "stu001",
    "student_name": "张三",
    "checkin_time": "2024-01-15T09:10:00Z",
    "status": "checked_in",
    "remarks": "迟到10分钟",
    "operator_id": "op001",
    "operator_name": "工作人员"
  },
  "safety_records": [
    {
      "id": "safety001",
      "checkin_id": "checkin001",
      "course_id": "course001",
      "student_id": "stu001",
      "student_name": "张三",
      "checkin_remarks": "迟到10分钟",
      "safety_status": "safe",
      "safety_remarks": "学生状态良好",
      "operator_id": "op002",
      "operator_name": "安全员"
    }
  ],
  "audits": [
    {
      "id": "audit001",
      "action": "create",
      "module": "checkin",
      "user_id": "op001",
      "user_name": "工作人员",
      "data": "{...}",
      "created_at": "2024-01-15T09:10:00Z"
    }
  ]
}
```

### 审计日志

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/audit` | 查询审计日志 |
| GET | `/api/audit/:id` | 查询日志详情 |

**查询参数**:
- `module`: 模块名称 (course/instructor/material/signup/checkin/safety)
- `user_id`: 操作人ID
- `action`: 操作类型 (create/update/delete/schedule/backfill)
- `start_at`: 开始时间 (RFC3339格式)
- `end_at`: 结束时间 (RFC3339格式)

### 健康检查

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 服务健康检查 |

## 数据模型

### Course（课程）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| name | string | 课程名称 |
| description | string | 课程描述 |
| capacity | int | 容量 |
| start_time | datetime | 开始时间 |
| end_time | datetime | 结束时间 |
| location | string | 地点 |
| status | string | 状态 (active/inactive) |

### Instructor（讲师）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| name | string | 姓名 |
| phone | string | 电话 |
| email | string | 邮箱 |
| specialty | string | 专长 |
| status | string | 状态 |

### Material（物料）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| name | string | 物料名称 |
| quantity | int | 数量 |
| unit | string | 单位 |
| description | string | 描述 |
| course_id | string | 关联课程 |

### ActivitySignup（报名）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| course_id | string | 关联课程 |
| student_id | string | 学生ID |
| student_name | string | 学生姓名 |
| phone | string | 联系电话 |
| status | string | 状态 (confirmed/cancelled) |
| signup_time | datetime | 报名时间 |

### ActivityCheckin（签到）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| course_id | string | 关联课程 |
| student_id | string | 学生ID |
| student_name | string | 学生姓名 |
| checkin_time | datetime | 签到时间 |
| status | string | 状态 (checked_in/rejected/backfilled) |
| remarks | string | 备注 |
| operator_id | string | 操作人ID |
| operator_name | string | 操作人姓名 |

### SafetyRecord（安全记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| checkin_id | string | 关联签到 |
| course_id | string | 关联课程 |
| student_id | string | 学生ID |
| student_name | string | 学生姓名 |
| checkin_remarks | string | 继承的签到备注 |
| safety_status | string | 安全状态 (safe/unsafe/attention) |
| safety_remarks | string | 安全备注 |
| operator_id | string | 操作人ID |
| operator_name | string | 操作人姓名 |

### AuditLog（审计日志）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| action | string | 操作类型 |
| module | string | 模块名称 |
| user_id | string | 操作人ID |
| user_name | string | 操作人姓名 |
| data | string | 操作数据(JSON) |
| ip | string | 操作IP |

## 核心特性实现

### 1. 签到备注继承
安全记录创建时自动继承签到记录的备注信息，确保信息连贯性。

### 2. 驳回与补录
- **驳回**: 支持对签到记录进行驳回操作，记录驳回原因
- **补录**: 支持事后补录签到，自动标记补录标识

### 3. 完整追溯
通过 `/api/safety/trace/:checkin_id` 接口可以获取：
- 签到记录详情
- 所有关联的安全记录
- 相关的审计日志

### 4. 幂等提交
使用请求唯一标识防止重复提交，默认过期时间为10分钟。

### 5. 审计日志
所有关键操作自动记录审计日志，支持多维度查询。

## 模拟接口说明

### 数据导出（待实现）
```
GET /api/export/courses
GET /api/export/checkins?course_id=xxx
GET /api/export/safety?course_id=xxx
```

### 附件上传（待实现）
```
POST /api/attachments
GET /api/attachments/:id
DELETE /api/attachments/:id
```

### 批量操作（待实现）
```
POST /api/checkins/batch
POST /api/safety/batch
```

## 配置说明

### .env 文件

```bash
PORT=3000
DB_PATH=./database/museum.db
LOG_LEVEL=debug
```

### 数据库迁移

服务启动时自动执行数据库迁移，无需手动操作。

## 测试

```bash
go test ./...
```

## 许可证

MIT License
