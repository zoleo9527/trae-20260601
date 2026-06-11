# 售楼处运营系统 - 来访登记与客户归属（主链路交付说明）

## 一、项目概述

本交付覆盖售楼处运营的核心主链路：来访登记 → 客户跟进 → 认购 → 客户归属确认，按案场经理、置业顾问、销控专员三个角色接力完成。来访登记不是流程终点，客户归属嵌入在认购流程中，不做独立菜单。

## 二、启动方式

```bash
cd server
source .venv/bin/activate

# 首次运行 / 新增依赖时
pip install -r requirements.txt

# 启动服务（默认 8000 端口，开发模式自动重载）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

启动后访问：
- 健康检查：http://localhost:8000/
- Swagger 接口文档：http://localhost:8000/docs
- ReDoc 接口文档：http://localhost:8000/redoc

首次启动会自动创建 SQLite 数据库（`server/sales_office.db`）并写入种子数据。

### 种子账号（可直接用于接口调用）

| 用户名 | 姓名 | 角色 | ID |
|---|---|---|---|
| manager01 | 张经理 | 案场经理 | 1 |
| agent01 | 李置业 | 置业顾问 | 2 |
| agent02 | 王置业 | 置业顾问 | 3 |
| agent03 | 赵置业 | 置业顾问 | 4 |
| controller01 | 陈销控 | 销控专员 | 5 |

## 三、主链路流程与接口清单

```
案场经理提交来访登记           →  POST /api/visits                状态 registered
        ↓
案场经理分配置业顾问           →  POST /api/visits/{id}/assign     状态 assigned
        ↓
置业顾问提交跟进记录           →  POST /api/visits/{id}/follow-ups 状态 following
        ↓
销控专员录入认购单             →  POST /api/subscriptions          自动生成 pending 归属记录
                                                               来访状态 subscribed
        ↓
销控专员确认客户归属           →  POST /api/ownerships/{id}/confirm  归属状态 confirmed
```

扩展流程（争议闭环）：
- 提出归属争议：`POST /api/ownerships/{id}/dispute` → 归属状态 disputed
- 案场经理裁决：`POST /api/ownerships/{id}/resolve` → 归属状态 resolved

## 四、模型关系与状态约束

### 4.1 实体关系

```
User (案场经理/置业顾问/销控专员)
  ├─ 1:N → VisitRegistration.registered_by   (谁登记的)
  ├─ 1:N → VisitRegistration.assigned_by     (谁分配的)
  ├─ 1:N → VisitRegistration.assigned_agent  (分配给谁跟进)
  ├─ 1:N → FollowUpRecord.agent              (谁做的跟进)
  ├─ 1:N → OwnershipRecord.claimed_agent     (谁主张归属)
  ├─ 1:N → OwnershipRecord.confirm_agent     (最终归属给谁)
  └─ 1:N → OwnershipRecord.confirmed_by      (谁确认的归属)

Customer
  ├─ 1:N → VisitRegistration    (一个客户可多次来访)
  ├─ 1:N → FollowUpRecord
  ├─ 1:N → Subscription
  └─ 1:N → OwnershipRecord

VisitRegistration
  ├─ N:1 → Customer
  ├─ 1:N → FollowUpRecord      (一次来访可多次跟进)
  ├─ 1:N → Subscription        (一次来访可能产生多套认购)
  └─ 1:1 → OwnershipRecord     (一次来访对应一条归属结论)
```

### 4.2 来访状态机（VisitStatus）

| 状态 | 说明 | 允许流转到 |
|---|---|---|
| `registered` | 已登记（初始） | `assigned`, `lost` |
| `assigned` | 已分配顾问 | `following`, `lost` |
| `following` | 跟进中 | `subscribed`, `lost` |
| `subscribed` | 已认购 | 终态 |
| `lost` | 已流失 | 终态 |

### 4.3 归属状态机（OwnershipStatus）

| 状态 | 说明 | 允许流转到 |
|---|---|---|
| `pending` | 待确认（认购后自动生成） | `confirmed`, `disputed` |
| `confirmed` | 已确认（销控专员操作） | `disputed` |
| `disputed` | 有争议 | `resolved` |
| `resolved` | 争议已裁决（案场经理操作） | 终态 |

### 4.4 关键约束

- 只有置业顾问角色（`role=agent`）能被分配为跟进人
- 只有分配的顾问本人能对该来访提交跟进记录
- 只有销控专员（`role=controller`）能确认归属
- 只有案场经理（`role=manager`）能裁决归属争议
- 一次来访只允许存在一条归属记录（visit_id 唯一）
- 认购单录入时，如果来访已分配顾问则自动生成待确认归属记录

## 五、验收接口速查

### 5.1 来访登记处理

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/visits` | 提交来访登记（自动建客户或按手机号匹配） |
| GET | `/api/visits` | 来访列表（支持 status / assigned_agent_id / 时间区间 / 关键词 筛选） |
| GET | `/api/visits/{id}` | 来访详情（含客户、跟进次数、是否认购、归属状态） |
| POST | `/api/visits/{id}/assign` | 分配置业顾问 |
| POST | `/api/visits/{id}/follow-ups` | 提交跟进记录 |
| GET | `/api/visits/{id}/follow-ups` | 跟进记录列表 |

### 5.2 客户归属回看

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/ownerships` | 归属列表（支持 status / claimed_agent_id / confirm_agent_id / 时间区间 / 关键词 筛选） |
| GET | `/api/ownerships/{id}` | 归属详情（含来访、客户、认购房号信息） |
| POST | `/api/ownerships/{id}/confirm` | 销控专员确认归属 |
| POST | `/api/ownerships/{id}/dispute` | 提出归属争议 |
| POST | `/api/ownerships/{id}/resolve` | 案场经理裁决争议 |

### 5.3 认购单

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/subscriptions` | 录入认购单（触发归属流程自动生成） |
| GET | `/api/subscriptions` | 认购单列表（支持按客户 / 顾问筛选） |

### 5.4 导出任务

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/export/visits` | 导出来访登记 Excel（支持时间区间筛选） |
| GET | `/api/export/ownerships` | 导出客户归属汇总 Excel（支持时间区间筛选） |

导出字段详见各接口的响应模型与实现：
- 来访登记导出：18 列（编号、时间、客户、意向、中介、状态、登记人、顾问、跟进次数、认购状态等）
- 客户归属导出：21 列（来访信息、客户、主张/最终顾问、状态、认购房号、佣金、各时间节点等）

## 六、当前系统边界（未接真实外部系统）

以下为本期交付**明确不包含**的内容，是后续对接真实业务系统时需要补齐的边界：

1. **身份认证与权限控制**
   - 当前所有接口无登录态、无 Token 校验，接口参数中使用 `registered_by` / `assigned_by` / `confirmed_by` 等字段模拟操作人身份。
   - 仅做了角色字段的业务校验（如只有 controller 角色能确认归属），未做接口级鉴权中间件。
   - 未接企业微信 / OA / 统一身份认证。

2. **客户去重与 CRM 同步**
   - 当前仅按手机号匹配已有客户，未对接 CRM 主数据、未做同名/近似号等高级去重。
   - 客户信息不会回写到任何外部 CRM。

3. **房源与销控库**
   - 认购单中的楼栋/单元/房号为自由文本输入，未对接真实房源销控系统，不校验房号是否存在、是否可售。
   - 无锁定房号、释放房号、换房/退房流程。

4. **财务与收款**
   - 认购金额、定金仅作记录，未对接收款、POS、财务核算系统。
   - 佣金比例与佣金金额由接口调用方传入，未做自动计算规则引擎。

5. **中介/渠道系统**
   - 来访登记中 `has_agent / agent_name / agent_phone` 仅做字段记录，未对接中介渠道平台、未做渠道结佣。

6. **消息与通知**
   - 分配顾问、归属确认、争议等节点无短信/企业微信/站内信推送。
   - 跟进记录的下次提醒无定时任务触发。

7. **数据持久化与部署**
   - 当前使用 SQLite 文件数据库（`sales_office.db`），仅适合单节点开发/演示。生产需切换为 MySQL / PostgreSQL。
   - 未做 Alembic 迁移脚本的初始化，仅使用 `Base.metadata.create_all` 在启动时建表。
   - 无容器化、无 CI/CD、无日志聚合与监控告警。

8. **前端页面**
   - 本交付仅包含后端 API + Swagger 文档，不包含前端界面。前端可直接基于 `/docs` 的 OpenAPI 契约对接。
