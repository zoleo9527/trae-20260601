# 《奥特莱斯运营-品牌租约与扣点规则》验收指南

> 场景：主管临时追问进度时，谁在什么时间做了什么，系统里一清二楚。

---

## 🚀 快速启动

### 方式一：一键启动（推荐）
```bash
cd trae-20260601-1
node run.js
```
或：
```bash
chmod +x start.sh && ./start.sh
```

### 方式二：分别启动
```bash
# 后端 (端口3000)
cd backend && npm install && node src/app.js

# 前端 (端口5173)
cd frontend && npm install && npm run dev
```

启动后访问：**http://localhost:5173**

---

## 👤 测试账号（快速登录）
| 账号 | 密码 | 角色 | 权限说明 |
|------|------|------|----------|
| `zhaoshang1` | 123456 | 招商经理 张伟 | 创建租约、录入扣点、提交审核 |
| `yingyun1` | 123456 | 营运督导 王强 | 确认扣点、标记责任不清、确认租约生效 |
| `zhuguan` | 123456 | 主管 孙总 | 全局查看、进度汇总、导出所有报表 |
| `dianzhang1` | 123456 | 品牌店长 刘洋 | 仅查看耐克品牌租约信息 |

---

## 🧪 端到端流程自动化测试
```bash
# 确保后端在 3000 端口运行
cd backend && node src/scripts/testFlow.js
```
该脚本模拟完整业务流程：**31个断言点全部通过才算验收成功。**

---

## ✅ 验收接口清单（主管会看的4个模块）

### 一、品牌租约处理

| 操作 | 谁做 | API | 验收关注点 |
|------|------|-----|-----------|
| 创建租约 | 招商经理 | `POST /api/leases` | 状态=DRAFT，自动生成 lease_no，写入操作日志 |
| 编辑租约 | 招商(仅创建者) | `PUT /api/leases/:id` | 仅草稿/驳回可编辑，每次编辑记录日志差异 |
| 提交审核 | 招商(仅创建者) | `PUT /api/leases/:id/submit` | 状态→PENDING，自动责任检测，通知营运督导 |
| 驳回 | 营运督导 | `PUT /api/leases/:id/reject` | 必须填写reason，状态→REJECTED，通知招商 |
| **确认生效** | **营运督导** | `PUT /api/leases/:id/confirm` | **前置校验：扣点已确认 + 无责任标记**；失败则返回原因；成功→ACTIVE |
| 查看详情 | 全部有权限 | `GET /api/leases/:id` | 返回完整操作日志 operation_logs（含前后状态、操作人、详情） |
| 列表筛选 | 授权角色 | `GET /api/leases?liability_flag=1` | 按状态、责任不清标记、关键词筛选 |

**状态机（强制流转）：**
```
DRAFT ──提交──▶ PENDING ──确认扣点+清标记──▶ ACTIVE
  ▲                │
  └──编辑修改      └──驳回──▶ REJECTED ──修改后重提──▶ PENDING
```

---

### 二、权限校验（验收必测）

测试要点：**任何越权操作都必须返回 403，未登录返回 401。**

| 越权场景 | 预期结果 |
|---------|---------|
| 招商经理调用 `/confirm` 确认租约 | HTTP 403 "权限不足" |
| 品牌店长调用 `/export` 创建导出任务 | HTTP 403 |
| 营运督导编辑他人创建的租约 | HTTP 403 (需是submitter_id) |
| 未带 Token 请求 /api/leases | HTTP 401 |

在前端体现为：按钮仅在有权限时才渲染（`v-if="canConfirm"`等）。

---

### 三、扣点规则与责任不清标记

#### 核心机制：**有责任标记的租约不能流转到 ACTIVE**

| 责任不清类型 | 触发方式 | 责任方 |
|-------------|---------|--------|
| `LEASE_NO_RULE` | 租约提交时扣点规则为空 | 招商经理 |
| `RATE_ABNORMAL` | 基础/活动扣点 > 50% | 营运督导额外确认 |
| `SPECIAL_CLAUSE_MISSING` | 租约勾选has_special_clause但扣点规则为空 | 双方协商 |
| `DATE_MISMATCH` | 扣点生效期超出租约起止日期 | 双方 |
| `MANUAL_MARKED` | 营运督导手动标记 | 标记人负责 |

#### 验收接口：
| 接口 | 说明 |
|------|------|
| `POST /api/deduction-rules` | 创建新版本扣点规则（自动递增version，旧版本→SUPERSEDED） |
| `PUT /api/deduction-rules/:id/confirm` | 确认扣点→CONFIRMED，不可再编辑 |
| `PUT /api/deduction-rules/:id/mark-liability` | **仅营运督导**：标记责任不清+通知招商 |
| `PUT /api/deduction-rules/:id/clear-liability` | 清除标记，必填说明（主管审计用） |
| **`GET /api/leases/:id/deduction-history`** | **⭐扣点规则回看**：所有版本列表（版本号+确认人+时间） |
| `GET /api/deduction-rules/:leaseId/version/:v` | 指定版本详情回看 |

#### ⭐ 验收现场演示流程：
1. 招商经理zhaoshang1：**新建租约 → 录入扣点(故意留空特殊条款) → 提交**
2. 主管zhuguan进入**「责任不清台账」**: 看到LEASE_NO_RULE和SPECIAL_CLAUSE_MISSING两条统计
3. 营运督导yingyun1进入**「待办列表」**: 看到待办 → 打开详情
4. 督导操作：**确认扣点 → 标记责任不清(SPECIAL_CLAUSE_MISSING) → 尝试确认租约(失败)**
5. 督导电话沟通后：**修改扣点(产生新版本) → 清除责任标记 → 确认租约生效**
6. 主管查看**「租约详情」→ 版本历史+操作日志**：每一步都能回看谁、什么时候、做了什么

---

### 四、导出任务

| 接口 | 说明 | 验收点 |
|------|------|--------|
| `POST /api/export` | 创建导出任务（异步） | 成功后status=PENDING，后台自动处理 |
| `GET /api/export/:id` | 查询单个任务进度 | 返回progress(0-100)、file_path（**本地记录的文件绝对路径**）、error_msg |
| `GET /api/export` | 我的任务列表 | 含状态、进度、文件名、本地路径 |
| `GET /api/export/download/:id` | 下载Excel文件 | 实际生成的.xlsx |

**4种导出类型：**
1. `LEASE_LIST` - 品牌租约列表（含状态、扣点、责任标记）
2. `DEDUCTION_SUMMARY` - 扣点规则汇总（全版本）
3. `LIABILITY_REPORT` - **主管重点**：责任不清报表（含标记人、原因、双方责任人）
4. `OPERATION_LOG` - 操作审计日志（近500条）

**本地记录验证**：
```bash
ls -la backend/exports/*.xlsx   # 查看实际生成的Excel
```

---

## 📊 主管进度视图（前端工作台）

登录主管账号 zhuguan 后看到的仪表盘：
| 统计卡 | 说明 |
|--------|------|
| 草稿 | 招商经理还在编辑的 |
| 待确认 | 卡在营运督导处的待办 |
| 已生效 | 正常运转的租约数 + 占比 |
| ⚠️ 责任不清 | **红底警告**，点击直接进入台账处理 |

下方还有：
- 状态分布饼图（一眼看全局）
- 各角色7日操作柱状图（谁做了多少）
- 我的待办表格（含当前责任方列，主管追问进度直接念就行）

---

## 🧱 核心数据表结构（验收时核对字段）

### `brand_leases` 品牌租约
- 关键状态字段：`status`（DRAFT/PENDING/ACTIVE/REJECTED）
- 责任人：`submitter_id`（招商）、`confirmer_id`（营运）
- 时间戳：`submitted_at`、`activated_at`、`created_at`、`updated_at`

### `deduction_rules` 扣点规则
- 版本化：`version`（递增）、`status`（DRAFT→CONFIRMED→SUPERSEDED）
- 责任标记：`liability_flag`、`liability_reason`、`liability_marked_by`、`liability_marked_at`
- 双方留痕：`creator_id`（录入人）、`confirmer_id`（确认人）、`confirmed_at`

### `operation_logs` 操作留痕
- 审计核心：`operator_id` + `operator_name` + `operator_role`
- 状态追踪：`from_status` → `to_status`
- 详细：`action_detail`（JSON存修改前后值）
- 关联：`lease_id` + `deduction_rule_id`

### `export_tasks` 导出任务
- 进度追踪：`status` + `progress`
- 本地记录：`file_path`（绝对路径）、`file_name`
- 失败追溯：`error_msg` + `completed_at`

### `notifications` 通知（本地记录替代消息通道）
- 所有操作触发通知均写此表（`user_id`、`title`、`content`、`related_lease_id`）
- 前端顶部铃铛实时显示未读数
- **无真实推送？用数据库记录证明触发逻辑正确！**

---

## 🎬 演示顺序（给主管看的Show Time）
```
Step1: zhaoshang1 登录 → 新建租约(填耐克，has_special_clause=是) → 直接提交(不录扣点)
Step2: zhuguan 登录 → 工作台看到「责任不清=1」→ 进责任台账看到标记
Step3: yingyun1 登录 → 待办列表看到新租约 → 详情看到⚠️责任横幅
Step4: yingyun1 先录扣点(特殊条款故意空) → 标记MANUAL_MARKED → 尝试确认→被拦截
Step5: yingyun1 联系招商后 → 修改扣点填特殊条款 → 清除责任标记 → 确认扣点 → 确认租约
Step6: zhuguan 回到工作台 → 已生效+1，责任不清=0
Step7: 主管追问「上周耐克的租约谁处理的？」→ 打开详情→操作日志+版本历史，逐条念
Step8: 最后，主管要周报 → 导出中心→责任不清报表→下载Excel给领导
```
