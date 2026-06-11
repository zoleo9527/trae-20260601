# 百货专柜 - 商品调拨与到柜复核系统 API 文档

## 概述
解决柜长、楼层主管、品牌督导之间商品调拨责任不清的核心系统。所有操作留痕、改动可感知、责任可追溯。

**Base URL**: `http://localhost:8002`

**统一响应格式**: 所有接口返回 `ApiResponse` 包装体
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```
- `code=0` 表示成功，非 0 表示失败
- 失败时返回 4xx/5xx HTTP 状态码，响应体 `detail` 字段含错误说明

---

## 角色与场景模型

| 角色 | role 值 | 典型处理场景 | 涉及接口 |
|---|---|---|---|
| **柜长** | counter_manager | ① 发起商品调拨 ② 修改调拨内容 ③ 执行到柜复核 | 创建调拨、修改调拨、到柜复核 |
| **楼层主管** | floor_supervisor | ① 楼层内调拨审批（第一层） | 楼层审批 |
| **品牌督导** | brand_supervisor | ① 确认发货（第二层审批） ② 差异核实认定责任 | 品牌发货、差异核实 |

**场景A 被修改待复核**：柜长在发货后修改调拨单 → 复核端强制感知并确认
**场景B 差异待核实**：柜长复核实收数量不一致 → 品牌督导核实后认定责任

---

## 状态流转
```
pending(待楼层审批) → approved(待品牌发货) → shipped(已发货待复核) → reviewed(完成)
   ↓                    ↓                        ↓
modified(已修改待重审)  disputed(数量差异)  ←──┘
                            ↓
                       verified(差异已核实)
```

---

## 1. 用户接口

### 获取用户列表
```
GET /api/users
```
**响应示例**:
```json
[
  {
    "id": 1,
    "username": "zhang_guizhang",
    "name": "张柜长",
    "role": "counter_manager",
    "floor": "2F",
    "brand": "雅诗兰黛"
  },
  {
    "id": 3,
    "username": "wang_floor",
    "name": "王主管",
    "role": "floor_supervisor",
    "floor": "2F",
    "brand": null
  },
  {
    "id": 4,
    "username": "chen_brand",
    "name": "陈督导",
    "role": "brand_supervisor",
    "floor": null,
    "brand": "雅诗兰黛"
  }
]
```

---

## 2. 商品调拨接口

### 2.1 创建调拨单（柜长场景 · 支持幂等）

**角色**: 柜长（counter_manager）

```
POST /api/allocations?creator_id={柜长用户ID}
Content-Type: application/json
```

**URL 参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| creator_id | 是 | 创建人用户 ID，必须是柜长角色 |

**请求体参数**:
| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| idempotent_key | 是 | string | 客户端生成的 UUID，同 key 重复提交不创建新单，返回已存在记录 |
| from_counter | 是 | string | 调出柜位，如 "雅诗兰黛-2F-A01" |
| to_counter | 是 | string | 调入柜位，如 "雅诗兰黛-2F-B03" |
| brand | 是 | string | 品牌，如 "雅诗兰黛" |
| floor | 是 | string | 楼层，如 "2F" |
| goods_code | 是 | string | 商品编码 |
| goods_name | 是 | string | 商品名称 |
| sku | 否 | string | SKU 规格 |
| quantity | 是 | integer | 调拨数量（必须 > 0） |
| unit | 是 | string | 单位，如 "瓶"、"盒" |
| remark | 否 | string | 调拨备注，如 "B柜周庆活动补货" |
| history_remark | 否 | string | 历史操作说明，留痕用（一般无需传，系统自动维护） |

**请求体示例**：
```json
{
  "idempotent_key": "7e5d3a8f-1234-5678-abcd-9e8f76543210",
  "from_counter": "雅诗兰黛-2F-A01",
  "to_counter": "雅诗兰黛-2F-B03",
  "brand": "雅诗兰黛",
  "floor": "2F",
  "goods_code": "EST-001",
  "goods_name": "小棕瓶精华50ml",
  "sku": "SKU-EST-001-50",
  "quantity": 20,
  "unit": "瓶",
  "remark": "B柜618活动补货，应急调拨"
}
```

**curl 示例**:
```bash
curl -X POST "http://localhost:8002/api/allocations?creator_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotent_key": "test-20260611-100001",
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-B03",
    "brand": "雅诗兰黛",
    "floor": "2F",
    "goods_code": "EST-001",
    "goods_name": "小棕瓶精华50ml",
    "quantity": 20,
    "unit": "瓶",
    "remark": "B柜618活动补货"
  }'
```

**成功响应示例（HTTP 200）**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 7,
    "allocation_no": "DB20260611100000AABB",
    "idempotent_key": "test-20260611-100001",
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-B03",
    "brand": "雅诗兰黛",
    "floor": "2F",
    "goods_code": "EST-001",
    "goods_name": "小棕瓶精华50ml",
    "sku": "SKU-EST-001-50",
    "quantity": 20,
    "unit": "瓶",
    "status": "pending",
    "remark": "B柜618活动补货",
    "history_remark": "【2026-06-11 10:00】张柜长(柜长)发起A01→B03调拨20瓶小棕瓶精华50ml",
    "version": 1,
    "is_modified": false,
    "created_by": 1,
    "creator_name": "张柜长",
    "created_at": "2026-06-11T10:00:00",
    "updated_at": "2026-06-11T10:00:00",
    "change_logs": [],
    "reviews": [],
    "verifications": []
  }
}
```

**典型错误响应**:
| 场景 | HTTP 状态 | 错误信息 |
|---|---|---|
| creator_id 对应的用户不是柜长 | 403 | `{"detail": "只有柜长可以创建调拨单"}` |
| 同一 idempotent_key 已存在 | 200 | 直接返回已存在的调拨单记录（不报错，幂等保证） |
| quantity <= 0 | 400 | `{"detail": "数量必须大于0"}` |

---

### 2.2 修改调拨单（柜长场景 · 乐观锁 + 自动感知）

**角色**: 柜长（counter_manager）

```
PUT /api/allocations/{allocation_id}?operator_id={操作人ID}
Content-Type: application/json
```

**URL 参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| allocation_id | 是 | 调拨单 ID（路径参数） |
| operator_id | 是 | 操作人用户 ID，必须是柜长角色 |

**请求体参数**:
| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| quantity | 否 | integer | 修改后的调拨数量 |
| from_counter | 否 | string | 修改后的调出柜位 |
| to_counter | 否 | string | 修改后的调入柜位 |
| goods_code | 否 | string | 修改后的商品编码 |
| goods_name | 否 | string | 修改后的商品名称 |
| sku | 否 | string | 修改后的 SKU |
| unit | 否 | string | 修改后的单位 |
| remark | 否 | string | 修改后的备注 |
| change_reason | **是** | string | **修改原因，永久留痕，不可为空** |
| version | **是** | integer | **乐观锁版本号，必须与当前服务端版本一致** |

> **⚠️ 注意**: 发货后（status=shipped）修改调拨单，**状态不会变回 pending/modified**，只会标记 `is_modified=true`，复核端会强制感知。

**请求体示例（发货前修改数量）**：
```json
{
  "quantity": 15,
  "change_reason": "B柜VIP客户临时取消5瓶订单，实际只需15瓶",
  "version": 1
}
```

**请求体示例（发货后修改数量 → 触发场景A 被修改待复核）**：
```json
{
  "quantity": 18,
  "change_reason": "A柜盘点后发现实际可调拨量只有18瓶，原预估20瓶有误",
  "version": 2
}
```

**curl 示例**:
```bash
curl -X PUT "http://localhost:8002/api/allocations/1?operator_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 15,
    "change_reason": "VIP客户临时取消5瓶订单",
    "version": 1
  }'
```

**成功响应示例（发货后修改，保留 shipped 状态）**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "allocation_no": "DB20260606150002CCCC",
    "quantity": 18,
    "status": "shipped",
    "is_modified": true,
    "version": 3,
    "history_remark": "...【2026-06-11 14:20】★张柜长(柜长)修改数量: 20→18，原因：A柜盘点后发现实际可调拨量只有18瓶...",
    "change_logs": [
      {
        "id": 1,
        "allocation_id": 1,
        "field_name": "quantity",
        "old_value": "20",
        "new_value": "18",
        "change_reason": "A柜盘点后发现实际可调拨量只有18瓶，原预估20瓶有误",
        "operated_by": 1,
        "operator_name": "张柜长",
        "operated_at": "2026-06-11T14:20:00"
      }
    ],
    "reviews": [],
    "verifications": []
  }
}
```

**典型错误响应**:
| 场景 | HTTP 状态 | 错误信息 |
|---|---|---|
| version 不一致（并发冲突） | 400 | `{"detail": "版本冲突，请刷新后重试"}` |
| change_reason 为空 | 400 | `{"detail": "必须填写修改原因"}` |
| operator_id 不是柜长 | 403 | `{"detail": "只有柜长可以修改调拨单"}` |
| 调拨单已复核（reviewed）或已核实（verified） | 400 | `{"detail": "已完成或已核实的调拨单不可修改"}` |

---

### 2.3 楼层审批调拨单（楼层主管场景 · 第一层审批）

**角色**: 楼层主管（floor_supervisor）

```
POST /api/allocations/{allocation_id}/approve?approver_id={楼层主管ID}
```

**URL 参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| allocation_id | 是 | 调拨单 ID（路径参数） |
| approver_id | 是 | 审批人用户 ID，必须是楼层主管角色 |

**审批前置状态**: `pending`（待审批）或 `modified`（已修改待重审）

**审批后状态**: `approved`（待品牌发货）

**请求体**: 无

**curl 示例**:
```bash
curl -X POST "http://localhost:8002/api/allocations/7?approver_id=3"
```

**成功响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 7,
    "allocation_no": "DB20260611100000AABB",
    "status": "approved",
    "version": 2,
    "is_modified": false,
    "history_remark": "...【2026-06-11 10:30】王主管(楼层主管)审批通过",
    "updated_by": 3,
    "updater_name": "王主管",
    "updated_at": "2026-06-11T10:30:00"
  }
}
```

**典型错误响应**:
| 场景 | HTTP 状态 | 错误信息 |
|---|---|---|
| approver_id 不是楼层主管 | 403 | `{"detail": "只有楼层主管可以执行此操作"}` |
| 状态不是 pending/modified | 400 | `{"detail": "调拨单状态不对，无法审批"}` |

---

### 2.4 品牌发货确认（品牌督导场景 · 第二层审批）

**角色**: 品牌督导（brand_supervisor）

```
POST /api/allocations/{allocation_id}/approve?approver_id={品牌督导ID}
```

**URL 参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| allocation_id | 是 | 调拨单 ID（路径参数） |
| approver_id | 是 | 审批人用户 ID，必须是品牌督导角色 |

> 与楼层审批共用同一接口，系统根据 approver 的角色自动判断执行哪一层审批。

**审批前置状态**: `approved`（楼层已通过，待品牌发货）

**审批后状态**: `shipped`（已发货，待到柜复核）

**请求体**: 无

**curl 示例**:
```bash
curl -X POST "http://localhost:8002/api/allocations/7?approver_id=4"
```

**成功响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 7,
    "allocation_no": "DB20260611100000AABB",
    "status": "shipped",
    "version": 3,
    "is_modified": false,
    "history_remark": "...【2026-06-11 11:00】陈督导(品牌)确认发货",
    "updated_by": 4,
    "updater_name": "陈督导",
    "updated_at": "2026-06-11T11:00:00"
  }
}
```

**典型错误响应**:
| 场景 | HTTP 状态 | 错误信息 |
|---|---|---|
| approver_id 不是品牌督导 | 403 | `{"detail": "只有品牌督导可以执行此操作"}` |
| 状态不是 approved | 400 | `{"detail": "调拨单状态不对，无法发货"}` |

---

### 2.5 查询调拨单列表
```
GET /api/allocations?status=shipped&brand=雅诗兰黛&is_modified=true&skip=0&limit=50
```
**查询参数**:
| 参数 | 说明 |
|---|---|
| status | 按状态过滤：pending/modified/approved/shipped/reviewed/disputed/verified |
| brand | 按品牌过滤 |
| floor | 按楼层过滤 |
| is_modified | true/false，按是否被修改过滤 |
| skip | 分页偏移，默认 0 |
| limit | 每页数量，默认 50 |

---

### 2.6 查询调拨单详情（含变更日志 + 复核记录 + 核实记录）
```
GET /api/allocations/{allocation_id}
```
**响应关键字段**:
```json
{
  "id": 1,
  "allocation_no": "DB20260606150002CCCC",
  "quantity": 18,
  "status": "shipped",
  "is_modified": true,
  "version": 3,
  "history_remark": "【2026-06-06 15:00】张柜长发起A01→B03调拨20瓶眼霜...",
  "change_logs": [
    {
      "id": 1,
      "allocation_id": 1,
      "field_name": "quantity",
      "old_value": "20",
      "new_value": "18",
      "change_reason": "A柜盘点后实际可调拨量为18瓶",
      "operator_name": "张柜长",
      "operated_at": "2026-06-11T14:20:00"
    }
  ],
  "reviews": [
    {
      "review_no": "FH20260611...",
      "actual_quantity": 18,
      "review_status": "reviewed",
      "difference_reason": null,
      "has_allocation_modified": true,
      "modification_acknowledged": true,
      "reviewer_name": "李柜长",
      "reviewed_at": "2026-06-11T15:00:00"
    }
  ],
  "verifications": [
    {
      "verification_no": "HS20260611...",
      "conclusion": "sender_short",
      "responsibility": "经核查A01仓出库记录，确认出库时少装2瓶",
      "processing_remark": "已要求A01柜补发",
      "verifier_name": "陈督导",
      "verified_at": "2026-06-11T16:00:00"
    }
  ]
}
```

---

## 3. 到柜复核接口

### 3.1 查询待到柜复核列表（柜长场景）
```
GET /api/reviews/pending?counter=雅诗兰黛-2F-B03
```
**查询参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| counter | 否 | 按调入柜位过滤，如 "雅诗兰黛-2F-B03" |
| skip | 否 | 分页偏移，默认 0 |
| limit | 否 | 每页数量，默认 50 |

**说明**: 返回 `status=shipped` 和 `status=disputed` 两类调拨单。
- 若 `is_modified=true`：表示该调拨单在发货后被改动过（**场景A：被修改待复核**）
- 若 `status=disputed`：表示该调拨单已有差异记录（**场景B：差异待核实**）
- 差异状态的单子不可重复复核，需通过差异核实流程处理

---

### 3.2 执行到柜复核（柜长场景）

**角色**: 柜长（counter_manager）

```
POST /api/reviews?reviewer_id={复核人ID}
Content-Type: application/json
```

**URL 参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| reviewer_id | 是 | 复核人用户 ID，必须是柜长角色 |

**请求体参数**:
| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| allocation_id | 是 | integer | 待复核的调拨单 ID |
| actual_quantity | 是 | integer | 实收数量（必须 >= 0） |
| difference_reason | 条件 | string | **当 actual_quantity != 调拨数量时必填**，差异原因说明 |
| modification_acknowledged | 条件 | boolean | **当调拨单 is_modified=true 时必须为 true**，确认已知晓变更内容 |

**请求体示例（数量一致，无变更）**:
```json
{
  "allocation_id": 7,
  "actual_quantity": 20,
  "difference_reason": null,
  "modification_acknowledged": false
}
```

**请求体示例（数量一致，但调拨被修改过 → 场景A 被修改待复核）**:
```json
{
  "allocation_id": 1,
  "actual_quantity": 18,
  "difference_reason": null,
  "modification_acknowledged": true
}
```

**请求体示例（数量不一致 → 触发场景B 差异待核实）**:
```json
{
  "allocation_id": 7,
  "actual_quantity": 17,
  "difference_reason": "实收17瓶，与调拨单20瓶相差3瓶。外箱完好无破损，封条正常，疑发货方出库时少装。已拍照留证，待品牌督导核查出库记录和监控。",
  "modification_acknowledged": false
}
```

**curl 示例（差异复核）**:
```bash
curl -X POST "http://localhost:8002/api/reviews?reviewer_id=2" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 7,
    "actual_quantity": 17,
    "difference_reason": "实收17瓶差3瓶，外箱完好疑发货方少装，已拍照留证",
    "modification_acknowledged": false
  }'
```

**成功响应示例（数量一致 → 完成复核）**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 3,
    "allocation_id": 7,
    "review_no": "FH20260611150000CCDD",
    "actual_quantity": 20,
    "review_status": "reviewed",
    "difference_reason": null,
    "has_allocation_modified": false,
    "modification_acknowledged": false,
    "reviewed_by": 2,
    "reviewer_name": "李柜长",
    "reviewed_at": "2026-06-11T15:00:00"
  }
}
```

**成功响应示例（数量不一致 → 差异待核实）**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 4,
    "allocation_id": 7,
    "review_no": "FH20260611150000EEFF",
    "actual_quantity": 17,
    "review_status": "disputed",
    "difference_reason": "实收17瓶差3瓶，外箱完好疑发货方少装，已拍照留证",
    "has_allocation_modified": false,
    "modification_acknowledged": false,
    "reviewed_by": 2,
    "reviewer_name": "李柜长",
    "reviewed_at": "2026-06-11T15:05:00"
  }
}
```
> 注意：差异复核后，对应调拨单的 `status` 会自动同步为 `disputed`。

**5 层校验关键规则**:
1. **状态校验**: 只有 `shipped` 和 `disputed` 状态的调拨单可以执行复核
2. **重复复核阻止**:
   - 已有 `review_status=reviewed` → 拒绝："已完成复核，不可重复操作"
   - 已有 `review_status=disputed` → 拒绝："该调拨单已有差异记录，请通过差异核实流程处理"
3. **变更感知强制确认**: 若 `allocation.is_modified=true` 且 `modification_acknowledged=false` → **拒绝复核**，提示"请先确认已知晓变更内容"
4. **差异原因强制填写**: 若 `actual_quantity != quantity`，必须填写 `difference_reason`，否则拒绝
5. **状态同步**:
   - 数量一致 → 复核状态 `reviewed`，调拨单状态同步为 `reviewed`
   - 数量不一致 → 复核状态 `disputed`，调拨单状态同步为 `disputed`

**典型错误响应**:
| 场景 | HTTP 状态 | 错误信息 |
|---|---|---|
| 调拨单不是 shipped/disputed | 400 | `{"detail": "调拨单状态不对，无法到柜复核"}` |
| 已完成复核（reviewed）重复提交 | 400 | `{"detail": "该调拨单已完成复核，不可重复操作"}` |
| 已有差异记录（disputed）重复提交 | 400 | `{"detail": "该调拨单已有差异记录，请通过差异核实流程处理"}` |
| is_modified=true 但未确认变更 | 400 | `{"detail": "请先确认已知晓变更内容"}` |
| 数量不一致但 difference_reason 为空 | 400 | `{"detail": "数量不一致时必须填写差异原因"}` |

---

### 3.3 复核时间线回看（核心视图 · 责任认定）
```
GET /api/reviews/timeline?brand=雅诗兰黛&status=shipped
```
**查询参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| brand | 否 | 按品牌过滤 |
| status | 否 | 按调拨单状态过滤 |

**响应字段说明**（责任认定关键数据）:
| 字段 | 说明 |
|---|---|
| is_modified | 调拨单是否被修改过 |
| has_allocation_modified | 复核时是否感知到调拨已被改动 |
| modification_acknowledged | 复核人是否确认知晓变更 |
| modified_by | 最后修改人姓名 |
| change_count | 修改次数 |
| last_modified_at | 最后修改时间 |
| verification_conclusion | 差异核实结论：sender_short/receiver_false |
| verification_responsibility | 核实的责任归属描述 |
| verified_by_name | 核实人（品牌督导）姓名 |
| verified_at | 核实时间 |

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "allocation_id": 1,
        "allocation_no": "DB20260606150002CCCC",
        "goods_name": "眼霜15ml",
        "goods_code": "EST-002",
        "expected_quantity": 18,
        "actual_quantity": 18,
        "allocation_status": "shipped",
        "review_status": "pending",
        "is_modified": true,
        "has_allocation_modified": true,
        "modification_acknowledged": false,
        "modified_by": "张柜长",
        "change_count": 1,
        "last_modified_at": "2026-06-11T14:20:00",
        "created_at": "2026-06-06T15:00:00",
        "reviewed_at": null,
        "verification_conclusion": null,
        "verification_responsibility": null,
        "verified_by_name": null,
        "verified_at": null
      },
      {
        "allocation_id": 4,
        "allocation_no": "DB20260608150004EEEE",
        "goods_name": "粉水400ml",
        "goods_code": "LAN-022",
        "expected_quantity": 25,
        "actual_quantity": 23,
        "allocation_status": "verified",
        "review_status": "disputed",
        "is_modified": false,
        "has_allocation_modified": false,
        "modification_acknowledged": false,
        "modified_by": null,
        "change_count": 0,
        "last_modified_at": null,
        "created_at": "2026-06-08T15:00:00",
        "reviewed_at": "2026-06-09T10:00:00",
        "verification_conclusion": "sender_short",
        "verification_responsibility": "经核查D05仓出库记录，确认出库时仅装了23瓶，少装2瓶。责任归属调出方D05柜。",
        "verified_by_name": "刘督导",
        "verified_at": "2026-06-09T14:30:00"
      }
    ],
    "total": 2
  }
}
```

---

## 4. 差异核实接口

### 4.1 执行差异核实（品牌督导场景 · 责任终审）

**角色**: 品牌督导（brand_supervisor）

```
POST /api/dispute-verifications?verifier_id={品牌督导ID}
Content-Type: application/json
```

**URL 参数**:
| 参数 | 必填 | 说明 |
|---|---|---|
| verifier_id | 是 | 核实人用户 ID，必须是品牌督导角色 |

**请求体参数**:
| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| allocation_id | 是 | integer | 待核实的调拨单 ID，状态必须是 disputed |
| conclusion | 是 | string | **核实结论**：`sender_short`（发货方少装） 或 `receiver_false`（收货方误报） |
| responsibility | 是 | string | **责任归属详细描述**，需包含核实依据和责任方，永久留痕 |
| processing_remark | 否 | string | 处理备注，如补发安排、整改措施等 |

**核实结论类型**:
| conclusion 值 | 含义 | 责任方 |
|---|---|---|
| sender_short | 发货方少装 | 调出方（需补发） |
| receiver_false | 收货方误报 | 调入方（内部管理问题） |

**请求体示例（发货方少装）**:
```json
{
  "allocation_id": 7,
  "conclusion": "sender_short",
  "responsibility": "经核查A01仓出库记录和发货监控，确认出库时仅装了17瓶，少装3瓶。责任归属调出方(雅诗兰黛A01柜)，需补发3瓶。",
  "processing_remark": "已要求A01柜补发3瓶，预计次日送达B03柜。补发后将通知B柜长确认签收。"
}
```

**请求体示例（收货方误报）**:
```json
{
  "allocation_id": 8,
  "conclusion": "receiver_false",
  "responsibility": "经核查D05仓出库记录和发货监控，确认10瓶全部装箱发出。C02柜拆箱后将2瓶误放隔壁兰蔻柜位，属于收货方内部管理问题。责任归属C02柜。",
  "processing_remark": "C02柜长已确认在兰蔻柜位找到2瓶，内部调整后数量一致。提醒C02柜加强拆箱上架核对流程。"
}
```

**curl 示例（发货方少装）**:
```bash
curl -X POST "http://localhost:8002/api/dispute-verifications?verifier_id=4" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 7,
    "conclusion": "sender_short",
    "responsibility": "经核查A01仓出库记录和发货监控，确认出库时仅装了17瓶，少装3瓶。责任归属调出方。",
    "processing_remark": "已要求A01柜补发3瓶"
  }'
```

**成功响应示例（发货方少装）**:
```json
{
  "code": 0,
  "message": "差异核实完成",
  "data": {
    "id": 1,
    "allocation_id": 7,
    "verification_no": "HS20260611160000GGHH",
    "conclusion": "sender_short",
    "responsibility": "经核查A01仓出库记录和发货监控，确认出库时仅装了17瓶，少装3瓶。责任归属调出方。",
    "processing_remark": "已要求A01柜补发3瓶",
    "verified_by": 4,
    "verifier_name": "陈督导",
    "verified_at": "2026-06-11T16:00:00",
    "created_at": "2026-06-11T16:00:00",
    "updated_at": "2026-06-11T16:00:00"
  }
}
```
> 注意：核实成功后，对应调拨单的 `status` 会自动变为 `verified`（差异已核实）。

**6 层校验关键规则**:
1. **角色校验**: 只有品牌督导（brand_supervisor）可以执行差异核实
2. **调拨单存在性校验**: 调拨单必须存在
3. **状态校验**: 调拨单必须是 `disputed` 状态
4. **重复核实阻止**: 同一调拨单只能核实一次
5. **结论合法性校验**: `conclusion` 必须是 `sender_short` 或 `receiver_false`
6. **责任归属必填**: `responsibility` 不能为空

**典型错误响应**:
| 场景 | HTTP 状态 | 错误信息 |
|---|---|---|
| verifier_id 不是品牌督导 | 403 | `{"detail": "只有品牌督导才能执行差异核实"}` |
| 调拨单状态不是 disputed | 400 | `{"detail": "调拨单状态为 XXX，只有 disputed 状态才能执行差异核实"}` |
| 同一调拨单重复核实 | 400 | `{"detail": "该调拨单已完成差异核实，不可重复核实"}` |
| conclusion 不是有效值 | 400 | `{"detail": "核实结论必须为 sender_short(发货方少装) 或 receiver_false(收货方误报)"}` |
| responsibility 为空 | 400 | `{"detail": "责任归属描述不能为空"}` |

---

### 4.2 查询差异核实记录
```
GET /api/dispute-verifications/{allocation_id}
```
**成功响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "allocation_id": 4,
    "verification_no": "HS20260609143001XXXX",
    "conclusion": "sender_short",
    "responsibility": "经核查D05仓出库记录，确认出库时仅装了23瓶，少装2瓶。责任归属调出方。",
    "processing_remark": "已要求D05柜补发2瓶粉水",
    "verified_by": 5,
    "verifier_name": "刘督导",
    "verified_at": "2026-06-09T14:30:00"
  }
}
```

---

## 5. 核心责任认定机制（防扯皮设计）

| 问题场景 | 系统机制 | 数据证据 |
|---|---|---|
| "我没收到那么多货" | 到柜复核录入实收数量，差异自动标记 disputed，调拨单同步为 disputed | `actual_quantity` vs `expected_quantity` + `difference_reason` + `allocation.status=disputed` |
| "调拨单被改了我不知道" | 修改后复核端强制提示，必须勾选确认才能复核 | `has_allocation_modified=true` + `modification_acknowledged=true` + 复核人/时间 |
| "谁改的？什么时候改的？" | 每次修改自动写变更日志，含字段新旧值 | `change_logs` 表（字段、旧值、新值、原因、操作人、时间） |
| "重复提交了怎么办" | 创建时使用 idempotent_key 幂等控制 | 同 key 重复提交返回已存在记录 |
| "并发改了冲突" | 使用 version 乐观锁 | 版本不一致返回 400 |
| "翻聊天记录找证据" | 所有节点文字汇总到 `history_remark` + 结构化变更日志 | 时间线视图直接展示 |
| "差异后又想复核" | disputed 状态阻止重复复核，必须走差异核实流程 | `review_status=disputed` + 错误提示 |
| "数量差异谁的责任" | 品牌督导执行差异核实，区分发货方少装/收货方误报 | `verification.conclusion` + `verification.responsibility` + 核实人/时间 |

---

## 6. 完整链路 curl 测试脚本

保存为 `test_flow.sh` 直接运行：

```bash
BASE="http://localhost:8002"
echo "=== 1. 张柜长创建调拨单 (柜长场景) ==="
KEY="demo-$(date +%s)"
curl -s -X POST "$BASE/api/allocations?creator_id=1" -H "Content-Type: application/json" \
  -d "{\"idempotent_key\":\"$KEY\",\"from_counter\":\"雅诗兰黛-2F-A01\",\"to_counter\":\"雅诗兰黛-2F-B03\",\"brand\":\"雅诗兰黛\",\"floor\":\"2F\",\"goods_code\":\"EST-DEMO\",\"goods_name\":\"测试商品\",\"quantity\":10,\"unit\":\"瓶\",\"remark\":\"测试\"}"
echo ""

echo "=== 2. 王主管楼层审批 (楼层主管场景) ==="
curl -s -X POST "$BASE/api/allocations/7/approve?approver_id=3"
echo ""

echo "=== 3. 陈督导品牌发货 (品牌督导场景) ==="
curl -s -X POST "$BASE/api/allocations/7/approve?approver_id=4"
echo ""

echo "=== 4. 张柜长修改数量(触发场景A 被修改待复核) ==="
curl -s -X PUT "$BASE/api/allocations/7?operator_id=1" -H "Content-Type: application/json" \
  -d '{"quantity":8,"change_reason":"客户临时取消2瓶","version":3}'
echo ""

echo "=== 5. 李柜长复核(未确认变更→应失败) ==="
curl -s -X POST "$BASE/api/reviews?reviewer_id=2" -H "Content-Type: application/json" \
  -d '{"allocation_id":7,"actual_quantity":8,"modification_acknowledged":false}'
echo ""

echo "=== 6. 李柜长复核(确认变更→成功) ==="
curl -s -X POST "$BASE/api/reviews?reviewer_id=2" -H "Content-Type: application/json" \
  -d '{"allocation_id":7,"actual_quantity":8,"modification_acknowledged":true}'
echo ""

echo "=== 7. 查看时间线 ==="
curl -s "$BASE/api/reviews/timeline" | python3 -m json.tool
```

---

## 7. 典型场景处理流程图

```
【柜长】创建调拨单 → status: pending
    │
    ▼
【楼层主管】审批通过 → status: approved
    │
    ▼
【品牌督导】确认发货 → status: shipped
    │
    ├─【柜长】发货后修改调拨单 → is_modified: true (场景A 被修改待复核)
    │       │
    │       ▼
    │   【柜长】到柜复核 → 必须确认 modification_acknowledged=true
    │
    ▼
【柜长】到柜复核
    │
    ├─ 数量一致 → status: reviewed (完成)
    │
    └─ 数量不一致 → status: disputed (场景B 差异待核实)
            │
            ▼
        【品牌督导】差异核实
            │
            ├─ conclusion: sender_short → 发货方少装 → status: verified
            └─ conclusion: receiver_false → 收货方误报 → status: verified
```
