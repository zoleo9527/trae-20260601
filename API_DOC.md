# 百货专柜 - 商品调拨与到柜复核系统 API 文档

## 概述
解决柜长、楼层主管、品牌督导之间商品调拨责任不清的核心系统。所有操作留痕、改动可感知、责任可追溯。

**Base URL**: `http://localhost:8002`

---

## 角色说明
| 角色 | role 值 | 说明 |
|---|---|---|
| 柜长 | counter_manager | 发起调拨、修改调拨、执行到柜复核 |
| 楼层主管 | floor_supervisor | 第一层审批（楼层内调拨审批） |
| 品牌督导 | brand_supervisor | 第二层审批（确认发货） |

---

## 状态流转
```
pending(待楼层审批) → approved(待品牌发货) → shipped(已发货待复核) → reviewed(完成)
   ↓                    ↓                        ↓
modified(已修改待重审)  disputed(数量差异)  ←──┘
                            ↓
                       verified(差异已核实)
```
**两类责任场景**:
- **场景A 被修改待复核**: shipped + is_modified=true，复核端强制确认
- **场景B 差异待核实**: disputed + review_status=disputed，走差异核实流程
- **差异核实闭环**: 品牌督导核实后调拨单变为 verified，结论区分发货方少装/收货方误报

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
  }
]
```

---

## 2. 商品调拨接口

### 2.1 创建调拨单（支持幂等）
```
POST /api/allocations?creator_id={创建人ID}
Content-Type: application/json
```
**请求体**:
```json
{
  "idempotent_key": "uuid-client-generated-001",
  "from_counter": "雅诗兰黛-2F-A01",
  "to_counter": "雅诗兰黛-2F-B03",
  "brand": "雅诗兰黛",
  "floor": "2F",
  "goods_code": "EST-001",
  "goods_name": "小棕瓶精华50ml",
  "sku": "SKU-EST-001-50",
  "quantity": 20,
  "unit": "瓶",
  "remark": "B柜周庆活动补货",
  "history_remark": "【2026-06-11 10:00】张柜长发起A01→B03调拨20瓶小棕瓶"
}
```
**curl示例**:
```bash
curl -X POST "http://localhost:8001/api/allocations?creator_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotent_key": "test-'$(date +%s)'",
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-B03",
    "brand": "雅诗兰黛",
    "floor": "2F",
    "goods_code": "EST-001",
    "goods_name": "小棕瓶精华50ml",
    "quantity": 20,
    "unit": "瓶",
    "remark": "B柜补货"
  }'
```
**关键说明**:
- `idempotent_key` 由客户端生成 UUID，相同 key 重复提交不会创建新单，返回已存在单
- `creator_id` 为创建人用户 ID

---

### 2.2 修改调拨单（乐观锁 + 自动通知复核端）
```
PUT /api/allocations/{allocation_id}?operator_id={操作人ID}
Content-Type: application/json
```
**请求体**:
```json
{
  "quantity": 15,
  "change_reason": "B柜VIP客户临时取消5瓶订单",
  "version": 1
}
```
**curl示例**:
```bash
curl -X PUT "http://localhost:8001/api/allocations/1?operator_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 15,
    "change_reason": "VIP客户临时取消5瓶",
    "version": 1
  }'
```
**关键说明**:
- `change_reason` 必填，永久记录在变更日志中
- `version` 用于乐观锁，与服务端版本不一致则拒绝修改
- 修改后自动：`is_modified=true`、`version+1`、关联复核单的 `has_allocation_modified=true`
- 发货后（status=shipped）修改时，状态保持 shipped，仅标记 is_modified

---

### 2.3 审批调拨单
```
POST /api/allocations/{allocation_id}/approve?approver_id={审批人ID}
```
**角色权限**:
| 角色 | 审批前状态 | 审批后状态 |
|---|---|---|
| 楼层主管 | pending / modified | approved |
| 品牌督导 | approved | shipped |

**curl示例（楼层主管审批）**:
```bash
curl -X POST "http://localhost:8001/api/allocations/1?approver_id=3"
```

---

### 2.4 查询调拨单列表
```
GET /api/allocations?status=shipped&brand=雅诗兰黛&is_modified=true&skip=0&limit=50
```
**查询参数**:
| 参数 | 说明 |
|---|---|
| status | 按状态过滤：pending/modified/approved/shipped/reviewed/disputed |
| brand | 按品牌过滤 |
| floor | 按楼层过滤 |
| is_modified | true/false，按是否被修改过滤 |

---

### 2.5 查询调拨单详情（含变更日志 + 复核记录）
```
GET /api/allocations/{allocation_id}
```
**响应关键字段**:
```json
{
  "id": 1,
  "allocation_no": "DB20260611...",
  "quantity": 8,
  "status": "shipped",
  "is_modified": true,
  "version": 2,
  "history_remark": "【时间线文字记录】...",
  "change_logs": [
    {
      "field_name": "quantity",
      "old_value": "10",
      "new_value": "8",
      "change_reason": "VIP客户取消2瓶",
      "operator_name": "张柜长",
      "operated_at": "2026-06-11T10:30:00"
    }
  ],
  "reviews": [
    {
      "review_no": "FH20260611...",
      "actual_quantity": 8,
      "review_status": "reviewed",
      "has_allocation_modified": true,
      "modification_acknowledged": true,
      "reviewer_name": "李柜长"
    }
  ]
}
```

---

## 3. 到柜复核接口

### 3.1 查询待到柜复核列表
```
GET /api/reviews/pending?counter=雅诗兰黛-2F-B03
```
**说明**: 返回 status=shipped 和 status=disputed 两类调拨单。
- 若 `is_modified=true`：表示该调拨单在发货后被改动过（**场景A：被修改待复核**）
- 若 `status=disputed`：表示该调拨单已有差异记录（**场景B：差异待核实**）
- 差异状态的单子不可重复复核，需通过差异核实流程处理

---

### 3.2 执行到柜复核
```
POST /api/reviews?reviewer_id={复核人ID}
Content-Type: application/json
```
**请求体**:
```json
{
  "allocation_id": 1,
  "actual_quantity": 8,
  "difference_reason": null,
  "modification_acknowledged": true
}
```
**curl示例**:
```bash
curl -X POST "http://localhost:8001/api/reviews?reviewer_id=2" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 1,
    "actual_quantity": 8,
    "modification_acknowledged": true
  }'
```
**关键规则**:
1. **状态校验**: 只有 shipped 和 disputed 状态的调拨单可以执行复核
2. **重复复核阻止**: 
   - 已有 review_status=reviewed → 拒绝："已完成复核，不可重复操作"
   - 已有 review_status=disputed → 拒绝："该调拨单已有差异记录，请通过差异核实流程处理"
3. **变更感知强制确认**: 若 `allocation.is_modified=true` 且 `modification_acknowledged=false` → **拒绝复核**，提示"请先确认已知晓变更内容"
4. **差异原因强制填写**: 若 `actual_quantity != quantity`，必须填写 `difference_reason`，否则拒绝
5. **状态同步**: 
   - 数量一致 → 复核状态 `reviewed`，调拨单状态同步为 `reviewed`
   - 数量不一致 → 复核状态 `disputed`，调拨单状态同步为 `disputed`

---

### 3.3 复核时间线回看（核心视图）
```
GET /api/reviews/timeline?brand=雅诗兰黛&status=shipped
```
**响应字段说明**（责任认定关键数据）:
| 字段 | 说明 |
|---|---|
| is_modified | 调拨单是否被修改过 |
| has_allocation_modified | 复核时是否感知到调拨已被改动 |
| modification_acknowledged | 复核人是否确认知晓变更 |
| modified_by | 最后修改人姓名 |
| change_count | 修改次数 |
| last_modified_at | 最后修改时间 |

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "allocation_id": 5,
        "allocation_no": "DB20260611174752C5A7",
        "goods_name": "眼霜15ml",
        "expected_quantity": 8,
        "actual_quantity": 8,
        "allocation_status": "reviewed",
        "review_status": "reviewed",
        "is_modified": true,
        "has_allocation_modified": true,
        "modification_acknowledged": true,
        "modified_by": "张柜长",
        "change_count": 1,
        "last_modified_at": "2026-06-11T17:47:52"
      }
    ],
    "total": 1
  }
}
```

---

## 4. 核心责任认定机制（防扯皮设计）

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

## 4.1 差异核实接口

### 4.1.1 执行差异核实（品牌督导）
```
POST /api/dispute-verifications?verifier_id={核实人ID}
Content-Type: application/json
```
**请求体**:
```json
{
  "allocation_id": 4,
  "conclusion": "sender_short",
  "responsibility": "经核查出库记录确认少装2瓶，责任归属调出方",
  "processing_remark": "已要求补发2瓶，预计次日送达"
}
```
**curl示例**:
```bash
curl -X POST "http://localhost:8002/api/dispute-verifications?verifier_id=4" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 4,
    "conclusion": "sender_short",
    "responsibility": "经核查出库记录确认少装2瓶，责任归属调出方",
    "processing_remark": "已要求补发"
  }'
```
**关键规则**:
1. 只有品牌督导（brand_supervisor）可以执行差异核实
2. 调拨单必须是 disputed 状态
3. 同一调拨单只能核实一次
4. `conclusion` 必须为 `sender_short`（发货方少装）或 `receiver_false`（收货方误报）
5. `responsibility` 责任归属描述必填
6. 核实后调拨单状态变为 `verified`

**响应示例**:
```json
{
  "code": 0,
  "message": "差异核实完成",
  "data": {
    "id": 1,
    "allocation_id": 4,
    "verification_no": "HS20260611143001XXXX",
    "conclusion": "sender_short",
    "responsibility": "经核查出库记录确认少装2瓶，责任归属调出方",
    "processing_remark": "已要求补发",
    "verified_by": 4,
    "verifier_name": "陈督导",
    "verified_at": "2026-06-11T14:30:00",
    "created_at": "2026-06-11T14:30:00",
    "updated_at": "2026-06-11T14:30:00"
  }
}
```

### 4.1.2 查询差异核实记录
```
GET /api/dispute-verifications/{allocation_id}
```

---

## 4.2 状态流转（含差异核实闭环）
```
pending → approved → shipped → reviewed(一致) / disputed(差异) → verified(已核实)
   ↓
modified(已修改待重审)
```

**核实结论类型**:
| conclusion 值 | 含义 | 责任方 |
|---|---|---|
| sender_short | 发货方少装 | 调出方（需补发） |
| receiver_false | 收货方误报 | 调入方（内部管理问题） |

---

## 5. 完整链路 curl 测试脚本

保存为 `test_flow.sh` 直接运行：

```bash
BASE="http://localhost:8002"
echo "=== 1. 张柜长创建调拨单 ==="
KEY="demo-$(date +%s)"
curl -s -X POST "$BASE/api/allocations?creator_id=1" -H "Content-Type: application/json" \
  -d "{\"idempotent_key\":\"$KEY\",\"from_counter\":\"雅诗兰黛-2F-A01\",\"to_counter\":\"雅诗兰黛-2F-B03\",\"brand\":\"雅诗兰黛\",\"floor\":\"2F\",\"goods_code\":\"EST-DEMO\",\"goods_name\":\"测试商品\",\"quantity\":10,\"unit\":\"瓶\",\"remark\":\"测试\"}"
echo ""

echo "=== 2. 楼层主管审批 ==="
curl -s -X POST "$BASE/api/allocations/5/approve?approver_id=3"
echo ""

echo "=== 3. 品牌督导发货 ==="
curl -s -X POST "$BASE/api/allocations/5/approve?approver_id=4"
echo ""

echo "=== 4. 张柜长修改数量(触发感知) ==="
curl -s -X PUT "$BASE/api/allocations/5?operator_id=1" -H "Content-Type: application/json" \
  -d '{"quantity":8,"change_reason":"客户临时取消2瓶","version":1}'
echo ""

echo "=== 5. 李柜长复核(未确认变更→应失败) ==="
curl -s -X POST "$BASE/api/reviews?reviewer_id=2" -H "Content-Type: application/json" \
  -d '{"allocation_id":5,"actual_quantity":8,"modification_acknowledged":false}'
echo ""

echo "=== 6. 李柜长复核(确认变更→成功) ==="
curl -s -X POST "$BASE/api/reviews?reviewer_id=2" -H "Content-Type: application/json" \
  -d '{"allocation_id":5,"actual_quantity":8,"modification_acknowledged":true}'
echo ""

echo "=== 7. 查看时间线 ==="
curl -s "$BASE/api/reviews/timeline" | python3 -m json.tool
```
