# 考务中心 — 缺考违纪与成绩发布

面向考试管理场景，覆盖**报名数据 → 考场编排 → 监考名单 → 缺考违纪 → 成绩发布**五环节完整工作流，三角色（监考老师 / 考务专员 / 技术支持）有序交接，全流程留痕可追溯。

---

## 技术栈

- **前端**：React 18 + Vite 6 + React Router 7 + Zustand + TailwindCSS 3
- **后端**：Express 4 + TypeScript ESM（`tsx` 执行）
- **架构**：前后端分离，统一类型契约 `shared/types.ts`；后端 `Routes → Service → Repository` 三层架构
- **存储**：模块级内存变量（进程内 Map），无数据库依赖

---

## 启动方式

```bash
# 1. 安装依赖（首次使用）
npm install

# 2. 同时启动前端(Vite :5173) + 后端(Express :3001)
npm run dev
```

浏览器打开 **http://localhost:5173** 即可使用。

### 按需单独启动

```bash
# 仅前端（需要后端已在 3001 端口运行）
npm run client:dev

# 仅后端（调试 API 用）
npm run server:dev

# 类型检查
npm run check

# 生产构建
npm run build
```

### 端口说明

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端 (Vite) | 5173 | http://localhost:5173 |
| 后端 (Express) | 3001 | http://localhost:3001 |
| API 前缀 | - | `/api/*` |

---

## 角色说明

| 角色 | `role` 值 | 权限 | 典型操作 |
|------|-----------|------|----------|
| 监考老师 | `invigilator` | `submit:av`, `resubmit:av` | 提交缺考/违纪记录；被驳回后修改并重新提交 |
| 考务专员 | `admin` | `review:av`, `initiate:sp`, `approve:sp`, `reject:sp`, `manage:stage` | 审核缺考违纪（通过/驳回/补录）；发起并审批成绩发布 |
| 技术支持 | `tech` | `confirm:sp`, `manage:export` | 核对成绩并确认发布；管理导出任务 |

> ⚠️ 所有 API 调用通过 `operatorRole` + `operatorName` 字段鉴权（见服务层 `assertPermission`），无真实登录态。

---

## 五环节流程 & 角色交接顺序

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   ① 报名数据    │ → │  ② 考场编排     │ → │  ③ 监考名单     │ → │ ④ 缺考违纪审核  │ → │  ⑤ 成绩发布     │
│   (已预置完成)  │   │   (已预置完成)  │   │   (已预置完成)  │   │ 监考→考务专员   │   │ 考务→考务→技术  │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
                                                                     ↓ pending            ↓ initiated
                                                                   考务审核 ←─────────  考务审批通过
                                                                     ↓ approved            ↓ approved
                                                                  流程完成 ✓         技术确认发布 ↓ confirmed
                                                                                      发布完成 ✓
```

**环节阻塞规则**（Dashboard 的 `stageProgress` 实时返回）：
- ①②③ 环节预置为已完成，可手动修改（admin 角色）
- ④ 缺考违纪：存在 `pending`/`resubmitted` 状态记录时，阻塞第 ⑤ 环节
- ⑤ 成绩发布：④ 未全部完成时，禁止发起（API 返回 `[流程错误]`，前端禁用按钮）

---

## 数据重置方式

两种方式均可将数据恢复到初始种子状态：

### 方式一：API 重置（推荐，无需重启）

```bash
curl -X POST http://localhost:3001/api/reset
# 返回 {"success":true,"message":"数据已重置"}
```

### 方式二：重启后端进程

Ctrl+C 停止进程，再执行 `npm run dev`。

### 🌱 种子数据清单（重置后可见）

| 数据类型 | 条目数 | 内容概览 |
|----------|--------|----------|
| 考试 | 1 | 2026年春季期末考试（2026-06-20，20 考生 / 3 考场） |
| 考场 | 3 | A101(30座) / A102(30座) / B201(25座) |
| 科目 | 4 | 高等数学 / 大学英语 / 计算机基础 / 思想政治 |
| 考生 | 20 | cand1~cand20，分配到 3 考场 × 4 科目 |
| 监考老师 | 6 | 王建国/李秀英(A101)、张志强/刘美玲(A102)、陈海涛/赵丽华(B201) |
| 缺考违纪 | 5 | av1待审缺考 / av2待审违纪 / av3已通过 / av4已驳回 / av5已补录 |
| 成绩发布 | 2 | sp1高等数学(待审批) / sp2大学英语(已确认发布) |
| 审计日志 | 15 | 3 环节完成日志 + 5 条缺考违纪操作 + 2 条成绩发布操作 + 5 条AV操作 |

---

## 请求示例（curl 全部可跑通 ✅）

> 建议先 **重置数据** 再执行下面示例，避免状态冲突：`curl -X POST http://localhost:3001/api/reset`

### 一、角色 & Dashboard

#### 1. 切换角色 & 获取角色信息

```bash
# 监考老师
curl -s -X POST http://localhost:3001/api/role \
  -H 'Content-Type: application/json' \
  -d '{"role":"invigilator"}' | python3 -m json.tool

# 考务专员
curl -s -X POST http://localhost:3001/api/role \
  -H 'Content-Type: application/json' \
  -d '{"role":"admin"}' | python3 -m json.tool

# 技术支持
curl -s -X POST http://localhost:3001/api/role \
  -H 'Content-Type: application/json' \
  -d '{"role":"tech"}' | python3 -m json.tool
```

#### 2. Dashboard 概览（含环节进度、报名/考场/监考详细数据、操作留痕）

```bash
curl -s http://localhost:3001/api/dashboard | python3 -m json.tool
```

返回字段说明：
- `stageProgress[]`：各环节是否可推进、阻塞原因、下一步该谁操作（`nextRole`）
- `registration`：报名人数分布（按科目、按考场）
- `roomArrangement`：考场利用率进度、逐考场分配明细
- `invigilatorAssignment`：6 名监考老师 → 考场分配明细
- `stages[]` / `recentLogs[]`：环节状态卡片 / 最近操作时间线

#### 3. 手动标记环节完成（admin 权限）

```bash
curl -s -X PUT http://localhost:3001/api/dashboard/stages/registration/complete \
  -H 'Content-Type: application/json' \
  -d '{"operatorRole":"admin","operatorName":"考务专员"}' | python3 -m json.tool
```

---

### 二、缺考违纪处理（完整流程）

#### 1. 查询列表（多维度筛选）

```bash
# 全部记录
curl -s 'http://localhost:3001/api/absence-violation' | python3 -m json.tool

# 仅缺考
curl -s 'http://localhost:3001/api/absence-violation?type=absence' | python3 -m json.tool

# 仅违纪 + A101 考场 + 待审核
curl -s 'http://localhost:3001/api/absence-violation?type=violation&roomId=room1&status=pending' | python3 -m json.tool
```

#### 2. 查看单条详情 + 操作历史时间线 ✨

```bash
# av4 是「已驳回」状态，含完整审计链路
curl -s http://localhost:3001/api/absence-violation/av4 | python3 -m json.tool
```

返回 `{ record, auditLogs[] }`：
- `auditLogs[]` 含每次操作前后状态变迁（`fromStatus → toStatus`）、操作人角色、精确到毫秒的时间戳
- `record.parentId`：驳回重提的记录会关联到原记录

#### 3. 监考老师提交新记录

```bash
curl -s -X POST http://localhost:3001/api/absence-violation \
  -H 'Content-Type: application/json' \
  -d '{
    "candidateId": "cand3",
    "type": "violation",
    "violationType": "cheat",
    "roomId": "room1",
    "subjectId": "subj1",
    "remark": "左顾右盼疑似偷看邻桌答题卡，已警告",
    "operatorRole": "invigilator",
    "operatorName": "王建国"
  }' | python3 -m json.tool
```

校验规则（任一不满足返回 `[校验失败]`）：
- 考生/考场/科目必须真实存在
- 违纪必须指定 `violationType`
- `remark` 不能为空

#### 4. 考务专员审核（通过 / 驳回 / 补录）

```bash
# ✅ 通过 av1（pending → approved）
curl -s -X PUT http://localhost:3001/api/absence-violation/av1/review \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "approve",
    "opinion": "情况属实，已核实考场签到表与监考老师口述一致",
    "operatorRole": "admin",
    "operatorName": "考务专员"
  }' | python3 -m json.tool

# ❌ 驳回 av2（pending → rejected，需监考老师重提）
curl -s -X PUT http://localhost:3001/api/absence-violation/av2/review \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "reject",
    "opinion": "仅文字描述不够，需补充小抄实物照片或第二位监考老师的书面佐证",
    "operatorRole": "admin",
    "operatorName": "考务专员"
  }' | python3 -m json.tool

# ➕ 补录 av2（rejected → supplemented，同时新增一条关联补录记录）
curl -s -X PUT http://localhost:3001/api/absence-violation/av2/review \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "supplement",
    "opinion": "已收到补充材料，同时补录未及时登记的 cand4 违纪记录",
    "operatorRole": "admin",
    "operatorName": "考务专员",
    "supplementData": {
      "candidateId": "cand4",
      "type": "violation",
      "violationType": "device",
      "roomId": "room1",
      "subjectId": "subj2",
      "remark": "智能手表未上交，考试中查看时间被巡考查获"
    }
  }' | python3 -m json.tool
```

状态流转白名单（违反返回 `[状态错误]`）：

| 当前状态 | 允许操作 |
|----------|----------|
| `pending` / `resubmitted` | approve、reject、supplement |
| `rejected` | 仅 supplement（监考老师端可重新提交） |
| `approved` / `supplemented` | 终止态，不允许任何操作 |

#### 5. 监考老师对「驳回记录」重新提交（parentId 关联 ✨）

```bash
# av4 被驳回后，监考修改备注并重新提交，状态 → resubmitted
curl -s -X POST http://localhost:3001/api/absence-violation \
  -H 'Content-Type: application/json' \
  -d '{
    "candidateId": "cand12",
    "type": "violation",
    "violationType": "device",
    "roomId": "room3",
    "subjectId": "subj1",
    "remark": "已补充：手机型号iPhone14，闹钟8:30响铃，附现场照片IMG_20260620_0830.jpg，监考陈海涛+赵丽华共同确认",
    "operatorRole": "invigilator",
    "operatorName": "陈海涛",
    "parentId": "av4"
  }' | python3 -m json.tool
```

---

### 三、成绩发布回看 & 处理（完整流程）

> ⚠️ **前置条件**：缺考违纪无 `pending`/`resubmitted` 记录。种子数据中有 av1/av2 待审核，先把它们审核完（或调用上面的审核示例）。

#### 1. 查询成绩发布列表

```bash
# 全部
curl -s http://localhost:3001/api/score-publish | python3 -m json.tool

# 仅待审批
curl -s 'http://localhost:3001/api/score-publish?status=initiated' | python3 -m json.tool
```

#### 2. 发布回看 — 4 步审批流程时间线 ✨

```bash
# sp2 是已确认发布，可看到完整 4 步流程
curl -s http://localhost:3001/api/score-publish/sp2/flow | python3 -m json.tool
```

返回 `{ record, auditLogs[], flow[] }`：

```
flow[] 步骤结构：
  step 1: 发起发布申请       (考务专员，done)
  step 2: 考务专员审批        (考务专员，done)
  step 3: 技术支持确认发布     (技术支持，done/current/pending)
  step 4: 成绩已发布          (系统自动，done/pending)
```

- `status: current` 是当前待办节点（前端 animate-pulse 高亮）
- 若 step 2 被驳回，流程在 step 2 打 `✕`，detail 显示驳回理由

#### 3. 考务专员发起新的成绩发布

```bash
# 注意：pass+fail 必须 === total，否则 [校验失败]
curl -s -X POST http://localhost:3001/api/score-publish \
  -H 'Content-Type: application/json' \
  -d '{
    "subjectId": "subj3",
    "summary": {
      "total": 20,
      "pass": 17,
      "fail": 3,
      "max": 96,
      "min": 41,
      "avg": 76.8
    },
    "operatorRole": "admin",
    "operatorName": "考务专员"
  }' | python3 -m json.tool
```

前置校验完整清单：
1. 缺考违纪环节必须全部完成（否则 `[流程错误]`）
2. 同一科目不能有非 `rejected` 状态的重复发布（否则 `[校验失败] 已有进行中的发布记录`）
3. `pass + fail === total`（否则 `[校验失败] 人数不匹配`）
4. `max ≥ min`，`0 ≤ avg ≤ 100`

#### 4. 考务专员审批 / 驳回

```bash
# ✅ 审批通过 sp1（initiated → approved）
curl -s -X PUT http://localhost:3001/api/score-publish/sp1/approve \
  -H 'Content-Type: application/json' \
  -d '{
    "opinion": "与教务处下发的成绩Excel比对一致，通过率符合预期，平均分与往年偏差<3%，通过",
    "operatorRole": "admin",
    "operatorName": "考务专员"
  }' | python3 -m json.tool

# ❌ 驳回（演示用，先发布一条再驳回）
curl -s -X PUT http://localhost:3001/api/score-publish/sp1/reject \
  -H 'Content-Type: application/json' \
  -d '{
    "opinion": "思想政治科目不及格人数达12人，及格率40%显著低于预期55%，需复核原卷或重新统分",
    "operatorRole": "admin",
    "operatorName": "考务专员"
  }' | python3 -m json.tool
```

#### 5. 技术支持确认发布（approved → confirmed）

```bash
# sp1 先执行上面的 approve，再执行 confirm
curl -s -X PUT http://localhost:3001/api/score-publish/sp1/confirm \
  -H 'Content-Type: application/json' \
  -d '{
    "opinion": "成绩数据包完整性校验通过(MD5已匹配)，数据库批量写入成功(20/20)，查询接口连通性测试通过",
    "operatorRole": "tech",
    "operatorName": "技术支持"
  }' | python3 -m json.tool
```

---

### 四、详情查询（考生视角）

```bash
# 按姓名关键字（支持模糊匹配考生名、准考证号、考场、科目）
curl -s 'http://localhost:3001/api/query?keyword=张伟' | python3 -m json.tool

# 按考场 + 科目精准筛选
curl -s 'http://localhost:3001/api/query?roomId=room1&subjectId=subj1' | python3 -m json.tool

# 所有考生列表（query 接口加 keyword 为空即可）
curl -s 'http://localhost:3001/api/query?keyword=' | python3 -m json.tool
```

每条返回 `{ candidate, room, subject, avRecords[], auditLogs[] }` — 考生的缺考违纪历史 + 所有操作留痕都能看到。

---

### 五、导出任务（创建 → 查询 → 下载）

```bash
# 1️⃣ 创建缺考违纪导出（tech 权限，可加筛选条件）
curl -s -X POST http://localhost:3001/api/export \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "absence-violation",
    "filters": { "status": "approved" },
    "operatorRole": "tech",
    "operatorName": "技术支持"
  }' | python3 -m json.tool

# 2️⃣ 查看任务列表（记录数已真实计算，非静态数）
curl -s http://localhost:3001/api/export | python3 -m json.tool

# 3️⃣ 等待 3.5 秒模拟处理时间 → pending→processing→completed
sleep 4

# 4️⃣ 再次查询任务列表，拿到 completed 的任务 ID（例：exp100X）
curl -s http://localhost:3001/api/export | python3 -m json.tool

# 5️⃣ 下载 CSV （文件名含中文，RFC5987 编码 filename*）
#    把 exp1001 替换为实际任务 ID
curl -sJ http://localhost:3001/api/export/exp1001/download -o absence-violation-export.csv
head -5 absence-violation-export.csv   # 查看前 5 行表头
```

CSV 扩展字段（比页面表格更丰富）：
- 版本号 `version`、父记录 `parentId`（驳回重提链路）
- 考生明细、审核意见完整文本
- 按 `filters` 条件真实筛选，不是全量导出

也支持成绩发布导出：
```bash
curl -s -X POST http://localhost:3001/api/export \
  -H 'Content-Type: application/json' \
  -d '{"type":"score","filters":{"status":"confirmed"},"operatorRole":"tech","operatorName":"技术支持"}' | python3 -m json.tool
```

---

### 六、审计日志（全量留痕查询）

```bash
# 所有日志（按时间倒序）
curl -s http://localhost:3001/api/audit-logs | python3 -m json.tool

# 仅缺考违纪相关
curl -s 'http://localhost:3001/api/audit-logs?targetType=absence-violation' | python3 -m json.tool

# 单条记录的完整操作链（av3 含提交 + 通过两条日志）
curl -s 'http://localhost:3001/api/audit-logs?targetType=absence-violation&targetId=av3' | python3 -m json.tool

# 仅成绩发布
curl -s 'http://localhost:3001/api/audit-logs?targetType=score-publish' | python3 -m json.tool
```

每条日志字段说明：
```
targetType / targetId  →  被操作的对象类型与ID
action                 →  submit/resubmit/approve/reject/supplement/initiate/approve/reject/confirm
operatorRole/Name      →  操作者角色与姓名（留痕核心）
detail                 →  人类可读的操作描述
fromStatus → toStatus  →  状态变迁（状态机校验的证据）
createdAt              →  ISO8601 精确到毫秒的操作时间戳
```

---

## 🔴 模拟能力清单（非真实生产实现）

| 模块 | 模拟方式 | 如需真实化需改造 |
|------|----------|------------------|
| **数据存储** | 模块级内存变量，重启即清空 | 接入 PostgreSQL / MySQL，Repository 层替换 SQL 实现 |
| **身份认证** | 无登录态；角色通过前端切换 + API body 传 `operatorRole/Name`，无人鉴 | 接入 JWT / Session + 用户表 + 密码哈希 + RBAC 中间件 |
| **权限校验** | 服务层 `assertPermission()` 基于 body 中的 `operatorRole` | 从 token/session 中解析 role，中间件统一拦截 |
| **文件导出** | 内存实时拼 CSV；模拟 3.5s 处理延迟；不落盘 | 接入文件存储（S3/MinIO）+ 异步队列（BullMQ）+ 持久化任务表 |
| **环节流转** | 纯内存状态标记；无真实工作流引擎 | 接入 Camunda / Activiti 或自研状态机持久化 |
| **通知系统** | 驳回/通过/确认无通知 | 接入企业微信 / 邮件 / 站内信网关，服务层操作后异步触发 |
| **并发控制** | 单进程无锁；状态变更无 CAS | 数据库乐观锁（version 字段）+ 事务隔离 + 分布式锁 |
| **成绩数据** | 种子数据随机生成；不与真实判卷系统打通 | 接入 OMR 扫描仪接口 / 在线考试平台 API |
| **考生数量** | 20 条固定数据 | 考生表 / 报名表接入真实数据源；分页查询改造 |
| **审计安全** | 日志可被覆盖（重置数据），不可篡改 | 写入后不可修改的审计表（仅 INSERT）+ 定期归档到冷存 |

---

## 项目结构速览

```
trae-20260601-5/
├── shared/types.ts              # 前后端共享类型（核心契约）
├── api/                          # Express 后端
│   ├── app.ts / index.ts / server.ts
│   ├── data/repository.ts        # 内存仓储 + 种子数据 + 权限校验 + 进度计算
│   ├── services/                 # 业务服务层（状态流转核心校验）
│   │   ├── absence-violation.ts  #   缺考违纪服务（状态机白名单）
│   │   ├── score-publish.ts      #   成绩发布服务（前置依赖 + 流程生成）
│   │   └── export.ts             #   导出服务（筛选计数 + CSV 生成）
│   └── routes/                   # REST API 路由
│       ├── dashboard.ts          #   概览 + 环节详情 + 手动推进
│       ├── absence-violation.ts  #   CRUD + 审核
│       ├── score-publish.ts      #   CRUD + 审批 + 流程时间线
│       ├── export.ts             #   任务管理 + 下载
│       ├── query.ts              #   考生多维查询
│       ├── audit-logs.ts         #   审计留痕查询
│       └── reset.ts              #   数据重置
└── src/                          # React 前端
    ├── App.tsx / main.tsx
    ├── store/useAppStore.ts      # Zustand 全局状态 + API 封装
    ├── pages/                    # 5 个页面
    │   ├── Dashboard.tsx         #   考务中心主面板（环节推进 + 信息 + 留痕）
    │   ├── AbsenceViolation.tsx  #   缺考违纪（详情弹窗 + 流程时间线）
    │   ├── ScorePublish.tsx      #   成绩发布（4步审批流程可视化）
    │   ├── Query.tsx             #   考生详情查询
    │   └── Export.tsx            #   导出任务管理
    └── components/Layout.tsx     # 顶栏角色切换 + 侧边导航
```

---

## 错误信息前缀规范（便于自动化测试断言）

所有服务层异常使用统一前缀，curl 测试可直接 grep 定位：

| 前缀 | 含义 |
|------|------|
| `[权限不足]` | 当前角色无此操作权限 |
| `[流程错误]` | 前置环节未完成，阻塞推进 |
| `[状态错误]` | 当前状态不允许此操作（状态流转白名单） |
| `[校验失败]` | 参数不合法（空值、范围、人数不匹配等） |
