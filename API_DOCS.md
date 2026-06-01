# 培训机构实训管理系统后端 API

## 技术栈
- Node.js + Express + TypeScript
- TypeORM + SQLite
- RESTful API 设计

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 初始化种子数据
```bash
npm run seed
```

### 3. 启动开发服务器
```bash
npm run dev
```

服务默认运行在 http://localhost:3000

## API 接口列表

### 健康检查
- `GET /api/health` - 检查服务状态

### 班级管理 `/api/classes`
- `GET /` - 班级列表（支持筛选、分页、排序）
  - 查询参数: `page`, `pageSize`, `sortBy`, `sortOrder`, `status`, `name%`
- `GET /:id` - 班级详情
- `POST /` - 创建班级
- `PUT /:id` - 更新班级
- `DELETE /:id` - 删除班级
- `POST /batch/status` - 批量更新状态
  - 请求体: `{ ids: [], status: string }`

### 学员管理 `/api/students`
- `GET /` - 学员列表（支持筛选、分页、排序）
  - 查询参数: `page`, `pageSize`, `sortBy`, `sortOrder`, `status`, `classId`, `name%`
- `GET /:id` - 学员详情（含考勤、证书、备注）
- `POST /` - 创建学员
- `PUT /:id` - 更新学员
- `DELETE /:id` - 删除学员
- `POST /batch/status` - 批量更新状态
  - 请求体: `{ ids: [], status: string }`
- `POST /batch/class` - 批量分班
  - 请求体: `{ ids: [], classId: number }`
- `GET /:id/notes` - 学员备注列表
- `POST /:id/notes` - 添加学员备注
  - 请求体: `{ content: string, createdBy: string, category?: string }`

### 实训场次管理 `/api/sessions`
- `GET /` - 场次列表（支持筛选、分页、排序）
- `GET /:id` - 场次详情（含考勤记录）
- `POST /` - 创建场次
- `PUT /:id` - 更新场次
- `DELETE /:id` - 删除场次
- `POST /:id/generate-attendance` - 生成该场次考勤记录

### 考勤管理 `/api/attendance`
- `GET /` - 考勤列表（支持筛选、分页、排序）
- `GET /:id` - 考勤详情
- `PUT /:id` - 更新考勤
- `POST /batch` - 批量点名
  - 请求体: `{ sessionId: number, attendances: [{ studentId, status }] }`
- `GET /student/:studentId/statistics` - 学员考勤统计
- `DELETE /:id` - 删除考勤

### 补课申请管理 `/api/makeup`
- `GET /` - 补课申请列表
- `GET /:id` - 申请详情
- `POST /` - 创建补课申请
- `PUT /:id/approve` - 审核通过
- `PUT /:id/reject` - 拒绝申请
- `PUT /:id/complete` - 标记补课完成
- `DELETE /:id` - 删除申请

### 证书管理 `/api/certificates`
- `GET /` - 证书列表
- `GET /:id` - 证书详情
- `POST /` - 创建证书
- `PUT /:id` - 更新证书
- `GET /student/:studentId/check-eligibility` - 检查发证条件
- `PUT /:id/submit-review` - 提交审核
- `PUT /:id/approve` - 审核通过
- `PUT /:id/reject` - 拒绝审核
- `PUT /:id/print` - 打印证书
- `DELETE /:id` - 删除证书

### 寄送单管理 `/api/shipments`
- `GET /` - 寄送单列表
- `GET /:id` - 寄送单详情
- `POST /` - 创建寄送单
- `PUT /:id` - 更新寄送单
- `PUT /:id/ship` - 发货
  - 请求体: `{ trackingNo: string }`
- `PUT /:id/in-transit` - 更新运输状态
  - 请求体: `{ currentLocation: string }`
- `PUT /:id/deliver` - 标记签收
- `PUT /:id/return` - 标记退回
  - 请求体: `{ returnReason: string }`
- `GET /tracking/:trackingNo` - 根据单号查询物流
- `DELETE /:id` - 删除寄送单

### 数据导出 `/api/export`
- `POST /students` - 导出学员数据
  - 请求体: `{ filters?: {}, columns?: [] }`
- `POST /attendance` - 导出考勤数据
- `POST /certificates` - 导出证书数据
- `POST /shipments` - 导出寄送单数据
- `GET /download/:filename` - 下载导出文件

## 典型业务场景

### 1. 老师批量点名
```
POST /api/attendance/batch
{
  "sessionId": 1,
  "attendances": [
    { "studentId": 1, "status": "present" },
    { "studentId": 2, "status": "absent" }
  ]
}
```

### 2. 教务处理缺勤
- 查看学员考勤统计: `GET /api/attendance/student/:id/statistics`
- 处理补课申请: `PUT /api/makeup/:id/approve` 或 `/reject`
- 标记补课完成: `PUT /api/makeup/:id/complete`

### 3. 证书管理员审核
- 检查发证条件: `GET /api/certificates/student/:id/check-eligibility`
- 审核证书: `PUT /api/certificates/:id/approve` 或 `/reject`
- 打印证书: `PUT /api/certificates/:id/print`

### 4. 客服查询寄送进度
- 根据快递单号查询: `GET /api/shipments/tracking/:trackingNo`
- 处理退回: `PUT /api/shipments/:id/return`

## 数据状态说明

### 学员状态
- `enrolled` - 已报名
- `studying` - 学习中
- `suspended` - 休学
- `graduated` - 已毕业
- `dropped` - 已退学

### 考勤状态
- `present` - 出勤
- `absent` - 缺勤
- `late` - 迟到
- `leave` - 请假
- `makeup` - 补课

### 证书状态
- `pending` - 待提交
- `reviewing` - 审核中
- `approved` - 已通过
- `rejected` - 已拒绝
- `printed` - 已打印
- `shipped` - 已寄送
- `delivered` - 已签收

### 寄送状态
- `pending` - 待发货
- `shipped` - 已发货
- `in_transit` - 运输中
- `delivered` - 已签收
- `returned` - 已退回
- `failed` - 寄送失败

## 项目结构
```
src/
├── entities/           # 数据库实体
│   ├── Class.ts
│   ├── Student.ts
│   ├── Session.ts
│   ├── Attendance.ts
│   ├── MakeupRequest.ts
│   ├── Certificate.ts
│   ├── Shipment.ts
│   └── Note.ts
├── routes/             # API 路由
│   ├── index.ts
│   ├── classes.ts
│   ├── students.ts
│   ├── sessions.ts
│   ├── attendance.ts
│   ├── makeup.ts
│   ├── certificates.ts
│   ├── shipments.ts
│   └── export.ts
├── seeds/              # 种子数据
│   └── index.ts
├── utils/              # 工具函数
│   └── response.ts
├── data-source.ts      # 数据库配置
└── index.ts            # 应用入口
```
