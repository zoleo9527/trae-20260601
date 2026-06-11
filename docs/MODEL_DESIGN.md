# 《奥特莱斯运营-品牌租约与扣点规则》模型设计

## 一、核心角色与权限矩阵

| 角色编码 | 角色名称 | 核心职责 | 权限范围 |
|---------|---------|---------|---------|
| ROLE_MERCHANDISE_MANAGER | 招商经理 | 提交品牌租约初稿、录入扣点规则草案 | 租约CRUD(自有)、扣点规则起草 |
| ROLE_OPERATION_SUPERVISOR | 营运督导 | 确认扣点规则、标记责任不清项 | 扣点规则确认、责任标记、租约查看 |
| ROLE_STORE_MANAGER | 品牌店长 | 查看租约详情与扣点规则、库存报备 | 仅查看关联品牌数据 |
| ROLE_SUPERVISOR | 主管 | 进度追踪、全局查看、导出报表 | 全部查看权限、导出、进度汇总 |

---

## 二、实体关系图 (ER)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      用户        │       │    品牌租约       │       │    扣点规则       │
│      User        │──────▶│  BrandLease      │◀──────│ DeductionRule    │
├──────────────────┤ 1   N ├──────────────────┤ 1   1 ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ username         │       │ lease_no         │       │ lease_id (FK)    │
│ role             │       │ brand_id         │       │ base_rate        │
│ name             │       │ brand_name       │       │ promotion_rate   │
│ department       │       │ store_code       │       │ special_clause   │
└──────────────────┘       │ start_date       │       │ liability_flag   │
                           │ end_date         │       │ liability_reason │
                           │ status           │       │ status           │
                           │ submitter_id(FK) │       │ confirmer_id(FK) │
                           │ confirmer_id(FK) │       │ confirmed_at     │
                           │ submitted_at     │       │ version          │
                           │ activated_at     │       └──────────────────┘
                           └─────────┬────────┘
                                     │ 1
                                     │ N
                                     ▼
                           ┌──────────────────┐       ┌──────────────────┐
                           │    操作日志       │       │    导出任务       │
                           │ OperationLog     │       │  ExportTask      │
                           ├──────────────────┤       ├──────────────────┤
                           │ id (PK)          │       │ id (PK)          │
                           │ lease_id (FK)    │       │ user_id (FK)     │
                           │ operator_id(FK)  │       │ task_type        │
                           │ action           │       │ status           │
                           │ action_detail    │       │ file_path        │
                           │ from_status      │       │ params_json      │
                           │ to_status        │       │ created_at       │
                           │ created_at       │       └──────────────────┘
                           └──────────────────┘
```

---

## 三、品牌租约状态机

```
                    招商经理提交                    营运督导确认扣点
  DRAFT(草稿) ──────────────────▶ PENDING(待确认) ──────────────────▶ ACTIVE(生效)
       │                              │                                    │
       │ 编辑修改                     │ 驳回(补充材料)                      │ 到期/终止
       ▼                              ▼                                    ▼
     DRAFT                        REJECTED(已驳回)                   EXPIRED(已到期)
```

### 状态约束：

| 当前状态 | 允许操作 | 触发角色 | 目标状态 |
|---------|---------|---------|---------|
| DRAFT | 编辑/提交 | 招商经理(创建者) | DRAFT / PENDING |
| PENDING | 确认扣点/驳回 | 营运督导 | ACTIVE / REJECTED |
| REJECTED | 修改后重新提交 | 招商经理 | PENDING |
| ACTIVE | 仅查看 | 全部 | - |
| EXPIRED | 仅查看 | 全部 | - |

---

## 四、扣点规则状态与责任标记

### 扣点规则生命周期：
- `DRAFT`：招商经理起草中，可编辑
- `PENDING_CONFIRM`：随租约提交，等待营运督导确认
- `CONFIRMED`：营运督导已确认，不可编辑（版本化）
- `SUPERSEDED`：被新版本替代（历史版本）

### ⚠️ 责任不清标记机制 (liability_flag)：

| 触发场景 | 标记值 | 说明 |
|---------|--------|------|
| 租约已提交但扣点规则为空 | `LEASE_NO_RULE` | 招商经理责任：未录入扣点 |
| 扣点规则数值异常(如扣点>50%) | `RATE_ABNORMAL` | 营运督导需额外确认 |
| 特殊条款空白但合同约定有附加 | `SPECIAL_CLAUSE_MISSING` | 双方需协商补全 |
| 租约日期与扣点规则生效期不一致 | `DATE_MISMATCH` | 时间范围冲突 |
| 营运督导手动标记 | `MANUAL_MARKED` | 督导人工标记说明 |

**关键设计**：`liability_flag` 非空时，租约状态无法流转至 `ACTIVE`，必须由双方操作后清除标记。

---

## 五、操作留痕要求

所有状态变更必须写入 `OperationLog`，字段包括：
- **谁操作** (operator_id + name + role)
- **何时操作** (created_at 精确到秒)
- **做了什么** (action: SUBMIT / CONFIRM / REJECT / MODIFY_RULE 等)
- **前后状态** (from_status → to_status)
- **操作详情** (action_detail: JSON，记录修改的具体字段和值)

---

## 六、验收接口清单

| 模块 | 接口 | 验收关注点 |
|-----|------|-----------|
| **品牌租约** | POST /api/leases | 提交后状态=PENDING，自动产生日志 |
| | GET /api/leases/:id | 返回完整状态流转历史 |
| | PUT /api/leases/:id/confirm | 权限校验(仅营运督导)，扣点规则必须已确认 |
| **权限校验** | 全部接口 | 401 未登录 / 403 无权限 正确返回 |
| |  | 越权操作(如招商经理确认扣点)必须被拦截 |
| **导出任务** | POST /api/export | 创建任务后状态=PENDING，本地生成文件 |
| | GET /api/export/:id | 查询进度，完成后返回文件路径(本地记录) |
| **扣点规则回看** | GET /api/leases/:id/deduction-history | 版本列表，含每次确认的操作员和时间 |
| | GET /api/deduction-rules/:id/version/:v | 指定版本详情 |
| **责任标记** | GET /api/leases?liability_flag=1 | 筛选出所有责任不清的租约 |
| | PUT /api/deduction-rules/:id/clear-liability | 清除标记需记录双方操作人 |
