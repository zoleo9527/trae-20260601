# 人力派遣公司 - 考勤排班与异常确认系统

基于 Spring Boot 3.2.5 构建的人力派遣行业考勤管理后端，聚焦解决「考勤排班 → 异常确认 → 薪酬核算」流程中驳回/补录的责任与时效问题。

---

## 一、快速启动

```bash
# 编译运行
mvn spring-boot:run

# 服务地址
# API:  http://localhost:8080/api
# H2控制台: http://localhost:8080/api/h2-console (JDBC: jdbc:h2:mem:hrstaffing, 用户: sa, 密码空)
```

启动后会自动初始化 8 名员工、64 条排班记录、若干异常 + 驳回/补录演示数据。

---

## 二、身份模拟（接口模拟方式）

系统无登录模块，**通过 HTTP Header 模拟当前用户身份**，所有接口均依赖以下三个 Header：

| Header 名称 | 示例值 | 说明 |
|---|---|---|
| `X-User-Id` | `101` | 用户ID，用于数据归属校验 |
| `X-User-Name` | `招聘专员-张敏` | 用户名，用于操作日志 |
| `X-Role` | `RECRUITER` | 角色：`RECRUITER` / `SUPERVISOR` / `ACCOUNTANT` |

### 预置模拟身份

| 角色 | X-User-Id | X-User-Name | 管辖范围 |
|---|---|---|---|
| 招聘专员 | `101` | `招聘专员-张敏` | EMP001/003/005/007 |
| 招聘专员 | `102` | `招聘专员-王芳` | EMP002/004/006/008 |
| 驻场主管 | `201` | `驻场主管-李强` | 华为科技/立讯精密 |
| 驻场主管 | `202` | `驻场主管-赵刚` | 富士康/比亚迪 |
| 驻场主管 | `203` | `驻场主管-孙磊` | 比亚迪/立讯 |
| 薪酬会计 | `301` | `薪酬会计-陈静` | 全部数据 |

### curl 示例

```bash
# 招聘专员查看Dashboard
curl -H "X-User-Id: 101" \
     -H "X-User-Name: 招聘专员-张敏" \
     -H "X-Role: RECRUITER" \
     http://localhost:8080/api/recruiter/dashboard

# 驻场主管查看异常待确认
curl -H "X-User-Id: 201" \
     -H "X-User-Name: 驻场主管-李强" \
     -H "X-Role: SUPERVISOR" \
     "http://localhost:8080/api/supervisor/exceptions?status=PENDING&page=1&size=20"

# 薪酬会计导出名细
curl -X POST -H "Content-Type: application/json" \
     -H "X-User-Id: 301" \
     -H "X-User-Name: 薪酬会计-陈静" \
     -H "X-Role: ACCOUNTANT" \
     -d '{"exportType":"EXCEPTION_DETAIL","startDate":"2026-06-01"}' \
     http://localhost:8080/api/accountant/exports
```

---

## 三、核心业务流程与状态机

### 3.1 排班状态流转（ScheduleStatus）

```
  DRAFT(草稿) ──提交──► SUBMITTED(已提交) ──主管确认──► CONFIRMED(已确认)
                               │
                               └──存在异常──► EXCEPTION(异常中) ──异常确认后──► CONFIRMED
```

### 3.2 异常确认状态流转（ExceptionStatus）

```
  PENDING(待确认) ──主管驳回──► REJECTED(已驳回) ──招聘专员补录──► SUPPLEMENTED(已补录)
        │                              │                                    │
        │                              │ 超期后主管可重新开启               │
        │                              ◄────────────────────────────        │
        │                                                                   │
        └───────────────主管直接确认─────────────► CONFIRMED(已确认) ──会计归档──► CLOSED(已关闭)
```

### 3.3 驳回与补录的时效与责任机制

- **驳回强制要求**：主管驳回时必须填写 `rejectReason`（驳回原因）和 `deadlineHours`（补录截止小时数），系统记录驳回人/时间/原因，生成 `RejectRecord`。
- **时效分级**：
  - `NORMAL`：距截止 >24 小时
  - `WARNING`：距截止 ≤24 小时（Dashboard 醒目提醒）
  - `EXCEEDED`：已超期（补录入口自动关闭）
- **超期处理**：补录超期后招聘专员无法再提交，必须由主管调用 `/supervisor/exceptions/{id}/reopen` 重新开启通道，系统记录每一次重新开启。
- **状态轨迹**：所有状态变更自动写入 `StatusTransitionLog`，含操作人、角色、前后状态、数据快照，用于异常确认回看。

---

## 四、角色差异化入口

每个角色 Dashboard 返回各自的 `actionEntries`（待办入口）和 `quickFilters`（快捷筛选）。

### 4.1 招聘专员 RECRUITER - `/api/recruiter/**`

| 能力 | 接口 | 说明 |
|---|---|---|
| Dashboard | `GET /recruiter/dashboard` | 返回补录时效统计（正常/临期/超期）、各状态排班数、待办入口 |
| 排班管理 | `POST/PUT/DELETE /recruiter/schedules` | 仅草稿状态可修改/删除 |
| 提交排班 | `POST /recruiter/schedules/{id}/submit` | DRAFT → SUBMITTED |
| 上异常 | `POST /recruiter/exceptions` | 对已提交排班上异常申诉 |
| **补录提交** | `POST /recruiter/exceptions/supplement` | 仅 REJECTED 状态且未超期可提交，含修正工时/打卡/凭证附件 |
| 附件 | `POST/GET/DELETE /recruiter/attachments` | 上传现场截图、纸质考勤条等 |

### 4.2 驻场主管 SUPERVISOR - `/api/supervisor/**`

| 能力 | 接口 | 说明 |
|---|---|---|
| Dashboard | `GET /supervisor/dashboard` | 返回待确认异常数、待复审补录数、超期需重新开启数、排班待确认数 |
| 排班确认 | `POST /supervisor/schedules/{id}/confirm` | SUBMITTED → CONFIRMED |
| 异常确认 | `POST /supervisor/exceptions/{id}/confirm` | PENDING/SUPPLEMENTED → CONFIRMED（联动排班自动确认） |
| **异常驳回** | `POST /supervisor/exceptions/reject` | PENDING/SUPPLEMENTED → REJECTED，必须指定补录截止小时数和原因 |
| **重新开启补录** | `POST /supervisor/exceptions/{id}/reopen?additionalHours=&remark=` | 超期后重新给招聘专员补录机会 |
| 附件 | `POST/GET /supervisor/attachments` | 上传现场确认凭证 |

### 4.3 薪酬会计 ACCOUNTANT - `/api/accountant/**`

| 能力 | 接口 | 说明 |
|---|---|---|
| Dashboard | `GET /accountant/dashboard` | 返回待核算排班数、流程中异常数、可归档异常数、最近导出任务 |
| 异常回看 | `GET /accountant/exceptions/{id}` | 含完整驳回/补录/状态流转轨迹/全流程时效 |
| 异常归档 | `POST /accountant/exceptions/{id}/close` | CONFIRMED → CLOSED，归档后不再变更 |
| **导出中心** | `POST/GET /accountant/exports/**` | 三类导出（见下节） |

---

## 五、导出能力（集中说明）

导出由薪酬会计触发，**异步任务模式**：创建任务 → 后台生成 Excel → 查询状态 → 下载。

### 5.1 三种导出类型

| exportType | 文件名 | 内容 | 用途 |
|---|---|---|---|
| `SCHEDULE` | 考勤排班明细_YYYYMMDD.xlsx | 员工排班日期、上下班、计划/实际工时、加班/请假、状态、招聘/主管、备注 | 薪酬核算原始数据 |
| `EXCEPTION` | 异常确认汇总_YYYYMMDD.xlsx | 异常ID、员工、日期、类型、描述、影响工时、状态、驳回次数、是否超期、招聘/主管、最新驳回原因、补录说明 | 异常核对汇总 |
| `EXCEPTION_DETAIL` | 异常确认明细回看_YYYYMMDD.xlsx | 异常ID、员工、类型、初始描述、**驳回记录(时间/原因/截止)**、**补录记录(时间/内容/凭证说明)**、最终状态、确认人/备注、关闭人、**全流程时效(小时)** | 审计回看 / 责任追溯 |

### 5.2 导出相关接口

```
# 创建导出任务（异步）
POST /api/accountant/exports
Body: {
  "exportType": "SCHEDULE",           // SCHEDULE / EXCEPTION / EXCEPTION_DETAIL
  "taskName": "6月第2周排班明细",      // 可选，默认自动生成
  "employeeId": null,                  // 可选，按员工过滤
  "startDate": "2026-06-01",           // 可选，开始日期
  "endDate": "2026-06-07",             // 可选，结束日期
  "status": "CONFIRMED",               // 可选，状态枚举
  "keyword": "张伟"                    // 可选，姓名/工号模糊
}

# 我的导出任务
GET /api/accountant/exports/mine?page=1&size=20

# 全部导出任务
GET /api/accountant/exports/all?page=1&size=20

# 任务详情（含状态 PENDING/PROCESSING/SUCCESS/FAILED）
GET /api/accountant/exports/{id}

# 下载 Excel
GET /api/accountant/exports/{id}/download
```

### 5.3 导出技术实现

- 使用 Apache POI `SXSSFWorkbook` 流式写入，支持 10 万行级大数据量导出，内存占用可控。
- 导出目录：`/tmp/hrstaffing-exports/YYYYMMDD/`
- 上传目录：`/tmp/hrstaffing-uploads/YYYYMMDD/`
- 任务状态实时写入 `ExportTask` 表，失败原因可查。

---

## 六、附件能力（集中说明）

用于承载旧台账扫描件、现场记录纸质版、沟通截图、客户签字确认单等原始凭证。

### 6.1 附件业务类型（bizType）

| bizType | 关联 | 上传者 | 场景 |
|---|---|---|---|
| `SCHEDULE` | 排班ID | 招聘专员 | 排班原始截图、员工手写考勤条 |
| `EXCEPTION` | 异常ID | 招聘/主管 | 异常申诉时上传现场记录、微信截图 |
| `REJECT` | 驳回记录ID | 驻场主管 | 驳回时附上不合规的现场证据 |
| `SUPPLEMENT` | 补录记录ID | 招聘专员 | 补录时附上客户HR签字单、地铁故障通知等 |

### 6.2 附件接口

```
# 上传（招聘/主管）
POST /api/recruiter/attachments  或  POST /api/supervisor/attachments
Form-Data:
  file:       (二进制文件，最大20MB)
  bizType:    EXCEPTION
  bizId:      123
  remark:     客户现场微信沟通截图

# 列表
GET /api/recruiter/attachments?bizType=EXCEPTION&bizId=123

# 删除（仅本人）
DELETE /api/recruiter/attachments/{id}

# 下载（所有登录角色）
GET /api/common/attachments/{id}/download
```

### 6.3 附件数据结构

存储于 `Attachment` 表 + 本地文件系统，字段：`originalFileName` / `storedFileName`(UUID) / `filePath` / `fileSize` / `contentType` / `bizType` / `bizId` / `remark` / `uploadedBy` / `uploadedByName` / `createdAt`。

---

## 七、异常确认回看明细（集中说明）

所有角色调用 `GET /{role}/exceptions/{id}` 返回完整回看数据：

```json
{
  "exception": { "...": "异常主表" },
  "schedule": { "...": "关联排班" },
  "rejectRecords": [
    { "id":1, "rejectReason":"缺少客户HR签字确认单", "deadline":"...", "rejectedByName":"驻场主管-李强", "siteSnapshot":"客户现场微信记录截图", "attachmentId":5 }
  ],
  "supplementRecords": [
    { "id":1, "supplementContent":"已补客户HR签字扫描件，见附件", "correctedHours":4, "proofAttachmentId":6, "proofRemark":"客户HR签字确认单", "submittedByName":"招聘专员-张敏" }
  ],
  "attachments": [ { "...": "全部关联附件" } ],
  "deadlineInfo": {
    "active": true,
    "level": "WARNING",
    "hoursRemaining": 6,
    "minutesRemaining": 23,
    "canSupplement": true,
    "hint": "距离补录截止还剩 6 小时 23 分钟，请尽快处理"
  },
  "timeline": {
    "totalHours": "18.5",
    "currentStageHours": "4.3",
    "isClosed": false,
    "trail": [
      { "fromStatus":"PENDING", "toStatus":"REJECTED", "transitionReason":"驻场主管驳回，需招聘专员补录",
        "operatorName":"驻场主管-李强", "operatorRole":"SUPERVISOR", "createdAt":"..." },
      { "fromStatus":"REJECTED", "toStatus":"SUPPLEMENTED", "transitionReason":"招聘专员提交补录，等待主管复审",
        "operatorName":"招聘专员-张敏", "operatorRole":"RECRUITER", "createdAt":"..." }
    ]
  },
  "actionPermissions": {
    "canReject": false,
    "canConfirm": false,
    "canSupplement": true,
    "canReopenSupplement": false,
    "canClose": false,
    "canViewDetail": true
  }
}
```

---

## 八、全部 API 快速索引

### 公共
- `GET /api/common/health` - 健康检查
- `GET /api/common/attachments/{id}/download` - 附件下载

### 招聘专员 /recruiter
- `GET  /dashboard`
- `GET  /employees?keyword=`
- `POST /schedules` | `PUT /schedules/{id}` | `DELETE /schedules/{id}`
- `POST /schedules/{id}/submit`
- `GET  /schedules?page&size&employeeId&status&startDate&endDate&keyword`
- `GET  /schedules/{id}`
- `POST /exceptions`
- `GET  /exceptions?page&size&employeeId&status&exceptionType&startDate&endDate&keyword`
- `GET  /exceptions/{id}`
- `POST /exceptions/supplement`
- `POST /attachments` | `GET /attachments?bizType=&bizId=` | `DELETE /attachments/{id}`

### 驻场主管 /supervisor
- `GET  /dashboard`
- `GET  /employees?keyword=`
- `GET  /schedules?...` | `GET /schedules/{id}`
- `POST /schedules/{id}/confirm`
- `GET  /exceptions?...` | `GET /exceptions/{id}`
- `POST /exceptions/reject`
- `POST /exceptions/{id}/reopen?additionalHours=&remark=`
- `POST /exceptions/{id}/confirm`
- `POST /attachments` | `GET /attachments?bizType=&bizId=`

### 薪酬会计 /accountant
- `GET  /dashboard`
- `GET  /schedules?...` | `GET /schedules/{id}`
- `GET  /exceptions?...` | `GET /exceptions/{id}`
- `POST /exceptions/{id}/close`
- `POST /exports` | `GET /exports/mine` | `GET /exports/all` | `GET /exports/{id}` | `GET /exports/{id}/download`

---

## 九、技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Spring Boot 3.2.5 (Spring Web + Spring Data JPA + AOP + Validation) |
| 数据库 | H2 内存数据库（MySQL 兼容模式） |
| Excel 导出 | Apache POI 5.2.5 (SXSSF 流式) |
| 权限 | AOP + Header 模拟角色 |
| 异步 | `@EnableAsync` + 导出异步任务 |
| 工具 | Lombok |
