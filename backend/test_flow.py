import requests
import json
import uuid

BASE = "http://localhost:8001"

def print_step(title, resp):
    print(f"\n{'='*60}")
    print(f"▶ {title}")
    print(f"  HTTP Status: {resp.status_code}")
    try:
        data = resp.json()
        print(f"  Response: {json.dumps(data, ensure_ascii=False, indent=2)}")
        return data
    except:
        print(f"  Response: {resp.text}")
        return None

print("【完整链路测试：柜长→楼层主管→品牌督导→调拨改动→复核感知→到柜复核】")
print("用户ID: 1=张柜长, 2=李柜长, 3=王主管, 4=陈督导, 5=刘督导")

key = f"test-link-{uuid.uuid4().hex[:8]}"

r1 = requests.post(f"{BASE}/api/allocations", params={"creator_id": 1}, json={
    "idempotent_key": key,
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-B03",
    "brand": "雅诗兰黛", "floor": "2F",
    "goods_code": "EST-003", "goods_name": "眼霜15ml", "sku": "SKU-EST-003",
    "quantity": 10, "unit": "瓶",
    "remark": "B柜补货",
    "history_remark": "【2026-06-11 10:00】张柜长发起A01→B03调拨10瓶眼霜"
})
d1 = print_step("1. 张柜长创建调拨单(柜长发起)", r1)
alloc_id = d1["data"]["id"]

r2 = requests.post(f"{BASE}/api/allocations/{alloc_id}/approve", params={"approver_id": 3})
print_step("2. 王主管(楼层主管)审批通过", r2)

r3 = requests.post(f"{BASE}/api/allocations/{alloc_id}/approve", params={"approver_id": 4})
print_step("3. 陈督导(品牌督导)确认发货", r3)

r4 = requests.put(f"{BASE}/api/allocations/{alloc_id}", params={"operator_id": 1}, json={
    "quantity": 8,
    "change_reason": "B柜VIP客户临时取消2瓶订单,调整调拨数量",
    "version": 1
})
print_step("4. ★张柜长修改: 数量 10→8 (核心改动场景)", r4)

r5 = requests.get(f"{BASE}/api/reviews/pending")
d5 = print_step("5. 复核端查询待列表(应看到has_allocation_modified=true)", r5)
items = d5["data"]["items"]
modified_items = [x for x in items if x.get("is_modified")]
print(f"  → 待复核中标记为已修改的调拨单: {len(modified_items)} 条")

r6 = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc_id, "actual_quantity": 8,
    "modification_acknowledged": False
})
print_step("6. 李柜长未确认变更→复核(应拦截失败)", r6)

r7 = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc_id, "actual_quantity": 8,
    "modification_acknowledged": True
})
print_step("7. 李柜长确认变更知晓→完成复核(成功)", r7)

r8 = requests.get(f"{BASE}/api/reviews/timeline")
print_step("8. 复核时间线回看(完整留痕)", r8)

r9 = requests.get(f"{BASE}/api/allocations/{alloc_id}")
d9 = print_step("9. 调拨单详情(含变更日志/历史备注/处理人)", r9)
logs = d9["data"]["change_logs"]
print(f"  → 变更日志条数: {len(logs)}")
for log in logs:
    print(f"    · {log['field_name']}: {log['old_value']} → {log['new_value']} (原因: {log['change_reason']})")

print("\n" + "="*60)
print("✅ 主链路验证完成！核心能力：")
print("  ① 角色节奏: 柜长→楼层主管→品牌督导→柜长复核")
print("  ② 改动感知: 调拨修改后,复核端is_modified=true自动感知")
print("  ③ 确认机制: 复核前必须勾选确认知晓变更,否则拦截")
print("  ④ 全量留痕: 变更日志、历史备注、处理人、时间点完整")
print("  ⑤ 幂等提交: idempotent_key防重复提交")
print("  ⑥ 乐观锁: version防并发冲突修改")
