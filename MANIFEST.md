# 《音乐培训机构-老师请假与补课协调》系统清单

## 一、模拟数据位置

| 数据类别 | 文件路径 | 说明 |
|---|---|---|
| 用户（3 角色共 7 人） | [mock-data.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/data/mock-data.ts#L5-L13) | `MOCK_USERS`：任课老师 T001~T003、教务 A001~A002、家长顾问 AD001~AD002 |
| 请假申请（5 条，覆盖 3 个关键状态） | [mock-data.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/data/mock-data.ts#L15-L130) | `MOCK_LEAVES`：含 L20260601001(URGENCY-有人催)、L20260601002(RETURNED-有人退回)、L20260601003(PENDING_MATERIAL-有人补材料) |
| 补课协调（3 条，覆盖阻塞/待家长确认/已完成） | [mock-data.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/data/mock-data.ts#L132-L227) | `MOCK_MAKEUPS`：M20260601001(BLOCKED)、M20260601002(PENDING_PARENT_CONFIRM)、M20260601003(COMPLETED) |
| 运行时内存存储 | [in-memory.store.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/store/in-memory.store.ts) | 启动时自动加载以上三组 Mock，后续写入保留在内存中，重启丢失 |

---

## 二、角色入口（Header: `x-user-id`）

### 公开入口（无需鉴权）
- `GET /api/roles-catalog` — 三角色示例账号+入口清单 JSON
- `GET /api/docs` — Swagger UI（含完整说明）

### 1. 任课老师入口（x-user-id: T001 / T002 / T003）

| 方法 | 路径 | 用途 | 关键状态 |
|---|---|---|---|
| GET | `/api/dashboard` | **工作台聚合入口**：我的待办+统计+责任视图 | 列出 RETURNED / PENDING_MATERIAL 供处理 |
| POST | `/api/leaves` | 提交请假申请（**幂等**） | → PENDING_AFFAIRS |
| GET | `/api/leaves` | 查看我的请假列表 | 仅返回本人数据 |
| GET | `/api/leaves/:id` | 请假详情 | |
| GET | `/api/leaves/:id/logs` | 请假操作日志（回看） | |
| PATCH | `/api/leaves/:id/material` | **对 RETURNED / PENDING_MATERIAL 补材料+重提**（**幂等**） | RETURNED/PENDING_MATERIAL → PENDING_AFFAIRS |
| GET | `/api/leaves/:id/blocking` | 查看"卡在哪里+当前处理人+建议" | |
| GET | `/api/makeups` | 与我相关的补课协调 | |
| PATCH | `/api/makeups/:id/propose` | 提议补课时间与代课老师（**幂等**） | PENDING_TEACHER_CONFIRM → PENDING_PARENT_CONFIRM |
| GET | `/api/makeups/:id/review` | 补课协调回看：时间线+未完成原因 | |

### 2. 教务老师入口（x-user-id: A001 / A002）

| 方法 | 路径 | 用途 | 关键状态 |
|---|---|---|---|
| GET | `/api/dashboard` | **工作台聚合入口**：审批/排课/阻塞/未完成清单 | 顶部显示 URGENCY 优先排序 |
| GET | `/api/leaves` | 全部请假列表（可按 status/teacherId 过滤） | |
| GET | `/api/leaves/:id/blocking` | **回答：卡在哪里？谁在处理？** | |
| PATCH | `/api/leaves/:id/review` | **审批（幂等）**：action=APPROVED / REJECTED / **RETURNED** / **PENDING_MATERIAL** | 覆盖"有人退回/有人补材料"两状态 |
| PATCH | `/api/leaves/:id/urge` | 自行标记催促（**幂等**） | → URGENCY（"有人催"） |
| POST | `/api/makeups` | 创建补课协调（**幂等**，关联请假ID） | 请假未批自动置为 BLOCKED |
| GET | `/api/makeups` | 全部补课协调列表 | |
| GET | `/api/makeups/:id/review` | **回答：为什么还没完成？完整时间线+责任人** | |
| PATCH | `/api/makeups/:id/schedule` | 正式排课（**幂等**） | PENDING_SCHEDULE → PENDING_EXECUTE |
| PATCH | `/api/makeups/:id/complete` | 标记补课完成（**幂等**） | PENDING_EXECUTE → COMPLETED |
| POST | `/api/exports/tasks` | 创建导出任务（CSV/Excel，LEAVE/MAKEUP） | |
| GET | `/api/exports/tasks` | 导出任务列表 | |
| GET | `/api/exports/tasks/:id` | 导出状态+下载链接 | |

### 3. 家长顾问入口（x-user-id: AD001 / AD002）

| 方法 | 路径 | 用途 | 关键状态 |
|---|---|---|---|
| GET | `/api/dashboard` | **工作台聚合入口**：需联系家长/需催促/阻塞项 | |
| PATCH | `/api/leaves/:id/urge` | **催促教务处理 → 置为 URGENCY（"有人催"）**（**幂等**） | 催促次数累计，可被老板看见 |
| GET | `/api/leaves/:id/blocking` | 查看"卡在哪里+当前处理人"（给家长答复用） | |
| GET | `/api/leaves` | 全部请假列表（用于答复家长询问） | |
| PATCH | `/api/makeups/:id/confirm-parent` | **转达家长确认结果**（ALL_CONFIRMED / PARTIAL_CONFIRMED / REJECTED）（**幂等**） | PENDING_PARENT_CONFIRM → PENDING_SCHEDULE 或回退 |
| GET | `/api/makeups/:id/review` | **给家长看的完整回看**：为什么还没完成 | |
| POST | `/api/exports/tasks` | 创建导出任务 | |

---

## 三、三状态（有人催 / 有人退回 / 有人补材料）流转对照

| 状态枚举值 | 语义 | 进入方式 | 当前处理人 | 下一步动作接口 |
|---|---|---|---|---|
| **URGENCY**（有人催） | 教务未及时审批，被家长顾问/教务自己催促≥1次 | `PATCH /api/leaves/:id/urge` | **教务老师** | `PATCH /api/leaves/:id/review`（教务审批，审批通过后自动清除 urgency 标签） |
| **RETURNED**（有人退回） | 教务审批退回给任课老师，需整体重写 | `PATCH /api/leaves/:id/review` action=RETURNED | **任课老师** | `PATCH /api/leaves/:id/material`（老师补材料+重提 → PENDING_AFFAIRS） |
| **PENDING_MATERIAL**（有人补材料） | 教务要求补具体材料清单 | `PATCH /api/leaves/:id/review` action=PENDING_MATERIAL + materialRequired | **任课老师** | `PATCH /api/leaves/:id/material`（老师上传指定材料 → PENDING_AFFAIRS） |

---

## 四、幂等提交覆盖清单（写接口全部需传 `idempotencyKey`）

| 接口 | DTO 字段 | 幂等逻辑 |
|---|---|---|
| POST `/api/leaves` | `CreateLeaveRequestDto.idempotencyKey` | 同一 key 直接返回已创建的请假，不重复生成 |
| PATCH `/api/leaves/:id/review` | `ReviewLeaveDto.idempotencyKey` | 审批动作与 key 绑定重复调用直接返回 |
| PATCH `/api/leaves/:id/material` | `UpdateLeaveMaterialDto.idempotencyKey` | 避免老师重复上传材料 |
| PATCH `/api/leaves/:id/urge` | `UrgeLeaveDto.idempotencyKey` | 但 urgencyCount 仍按真实语义累计（首次用 key 去重） |
| POST `/api/makeups` | `CreateMakeupDto.idempotencyKey` | 同一请假ID也只允许创建一条协调 |
| PATCH `/api/makeups/:id/propose` | `ProposeMakeupDto.idempotencyKey` | |
| PATCH `/api/makeups/:id/confirm-parent` | `ConfirmMakeupDto.idempotencyKey` | |
| PATCH `/api/makeups/:id/schedule` | `ScheduleMakeupDto.idempotencyKey` | |
| PATCH `/api/makeups/:id/complete` | `MarkCompleteDto.idempotencyKey` | |

幂等存储实现见：
- 实体层面：`leave.idempotencyKey` / `makeup.idempotencyKey`
- 查询服务：[idempotency.service.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/services/idempotency.service.ts)
- 索引：[in-memory.store.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/store/in-memory.store.ts) 中 `leaveIdemKeys` / `makeupIdemKeys`

---

## 五、导出任务（Export）

- 类型：`LEAVE` / `MAKEUP`
- 格式：`CSV`（含 BOM，Excel 打开不乱码） / `EXCEL`（.xlsx）
- 流程：POST 创建任务（PROCESSING）→ 异步生成 → COMPLETED（带 `fileUrl` 如 `/api/exports/EXPORT-xxx.csv`）
- 静态目录：`os.tmpdir()/music-leave-makeup-exports/`，由 `main.ts` 中 `app.use('/api/exports', express.static(...))` 暴露
- 导出字段：
  - 请假：编号/老师/类型/日期/课节数/状态/处理人/阻塞原因/需补材料/催促次数/审批/理由 等 16 列
  - 补课：编号/关联请假/任课老师/学员数/代课老师/原始课次/提议补课时间/状态/处理人/阻塞原因 等 12 列

---

## 六、暂未实现的集成点（Production Ready TODO）

| 编号 | 集成点 | 当前模拟方式 | 建议落地方式 | 关联文件/位置 |
|---|---|---|---|---|
| INT-01 | **数据库持久化** | `InMemoryStore`（进程内 Map，重启丢） | 接入 PostgreSQL + TypeORM/Prisma；将 `LeaveRequest / MakeupCoordination / OperationLog / ExportTask / User` 五张实体建表 | [in-memory.store.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/store/in-memory.store.ts) |
| INT-02 | **用户认证** | 仅用 `x-user-id` 头明文传 ID | 接入 JWT（`@nestjs/jwt` + Passport）或 OIDC；用户登录换 token；RolesGuard 校验 token 中的 role | [roles.guard.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/guards/roles.guard.ts) |
| INT-03 | **学员/班级/课程数据** | Mock 中只放了 `studentIds / studentNames / originalLessonDates` 字符串 | 对接学员中心或排课系统 DB：学员表、班级表、课次表；补课协调创建时从请假期间的课次表自动拉取受影响课次 | [mock-data.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/data/mock-data.ts#L152-L156) |
| INT-04 | **附件上传** | `attachments` 字段只传文件名 | 接入对象存储（OSS/S3/MinIO），提供 `POST /attachments/upload` 返回 URL；DTO 中 materialRequired 与 uploadId 强绑定 | [leave.type.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/types/leave.type.ts#L27) |
| INT-05 | **消息通知** | `blockReason / coordinationLogs` 记录但不推送 | 对接企业微信/钉钉/短信：URGENCY 时推教务；RETURNED/PENDING_MATERIAL 时推任课老师；PROPOSE_MAKEUP 后推家长顾问；COMPLETED 后推全体 | [leave.service.ts `urge()`](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/leave/leave.service.ts#L205-L226) |
| INT-06 | **微信/沟通截图OCR** | 题目要求的"台账/现场记录/沟通截图"来源 | 接入微信会话存档/OCR 接口；在 `coordinationLogs` 加 `sourceType=WECHAT/OCR/MANUAL` 字段，外部截图可回溯 | [makeup.type.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/types/makeup.type.ts#L40-L50) |
| INT-07 | **幂等键存储** | 内存 Map（`leaveIdemKeys / makeupIdemKeys`） | 生产需落库唯一索引，且 key 设过期（Redis TTL + DB 唯一约束双保险） | [in-memory.store.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/store/in-memory.store.ts#L14-L17) |
| INT-08 | **异步任务队列** | `setImmediate` 做导出 | 接入 BullMQ（Redis）+ 独立 worker；导出/通知/生成 PDF 全部进队列 | [export.service.ts `runExport()`](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/export/export.service.ts#L65-L77) |
| INT-09 | **文件存储** | 导出文件放 `os.tmpdir()` | 放对象存储；`fileUrl` 返回签名 URL；文件生命周期由 TTL 管理 | [export.service.ts `writeCsv/writeExcel`](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/export/export.service.ts#L150-L180) |
| INT-10 | **权限精细化** | 仅按角色做粗粒度控制 | 接入 RBAC/ABAC：如"家长顾问只能看自己负责班级的请假/补课"；"教务A只看自己部门的老师" | [roles.guard.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/guards/roles.guard.ts#L20-L40) |
| INT-11 | **SLA/超时自动升级** | URGENCY 仅靠手动触发 | 基于 createdAt + 角色 SLA 定时器（PENDING_AFFAIRS >24h 自动置 URGENCY 并推上级） | [leave.service.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/leave/leave.service.ts) |
| INT-12 | **补课自动推荐算法** | 补课时间完全靠老师手填 | 基于老师空闲表+学员排课表+教室排课表+代课老师优先级做"AI 推荐时间 Top3" | [makeup.service.ts `proposeMakeup()`](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/makeup/makeup.service.ts#L102-L145) |
| INT-13 | **健康检查/监控** | 无 | 接入 `@nestjs/terminus`（DB/Redis/OSS 探针）+ Prometheus metrics（各状态计数、SLA 超时率） | `main.ts` |
| INT-14 | **审计日志合规** | 仅 `OperationLog` 写内存 | 日志落独立库+不可篡改（Append-only）；操作日志导出功能；符合教育行业合规 | [operation-log.service.ts](file:///Users/liu/Documents/private/model-test/trae-20260601-1/src/common/services/operation-log.service.ts) |
| INT-15 | **单元/E2E 测试** | 未写 | Jest（NestJS 原生）+ Supertest 覆盖三件事：谁在处理/卡在哪里/为什么没完成 | 新建 `test/` 目录 |

---

## 七、启动与验证

```bash
cd /Users/liu/Documents/private/model-test/trae-20260601-1
npm install
npm run start:dev
# 访问 http://localhost:3000/api/docs 查看 Swagger
# 访问 http://localhost:3000/api/roles-catalog 查看角色清单
# 访问 http://localhost:3000/api/leaves/L20260601001/blocking 查看"卡在哪里"
# 访问 http://localhost:3000/api/makeups/M20260601001/review 查看"为什么还没完成"
```
