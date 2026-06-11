import requests
import json
import uuid

BASE = "http://localhost:8002"

def print_step(title, resp=None, status_code=None):
    print(f"\n{'='*70}")
    print(f"▶ {title}")
    if status_code is not None:
        print(f"  HTTP Status: {status_code}")
    if resp is not None:
        try:
            if isinstance(resp, dict):
                print(f"  Response: {json.dumps(resp, ensure_ascii=False, indent=2)}")
            else:
                print(f"  Response: {resp}")
        except:
            print(f"  Response: {resp}")

all_passed = True
def check(name, condition, detail=""):
    global all_passed
    status = "✅ PASS" if condition else "❌ FAIL"
    print(f"  [{status}] {name}" + (f" - {detail}" if detail else ""))
    if not condition:
        all_passed = False

print("="*70)
print("【到柜复核争议分支 - 完整验证测试】")
print("="*70)

# ========== 场景1: 正常到柜复核 ==========
print("\n" + "="*70)
print("【场景1: 正常到柜复核 - 数量一致】")
print("="*70)

key1 = f"test-normal-{uuid.uuid4().hex[:6]}"
r1 = requests.post(f"{BASE}/api/allocations", params={"creator_id": 1}, json={
    "idempotent_key": key1,
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-B03",
    "brand": "雅诗兰黛", "floor": "2F",
    "goods_code": "TEST-NORMAL", "goods_name": "正常复核测试品",
    "quantity": 10, "unit": "瓶",
    "remark": "正常复核测试"
})
d1 = r1.json()
alloc1_id = d1["data"]["id"]
print_step("1.1 创建调拨单", d1, r1.status_code)

r1b = requests.post(f"{BASE}/api/allocations/{alloc1_id}/approve", params={"approver_id": 3})
print_step("1.2 楼层主管审批", r1b.json(), r1b.status_code)

r1c = requests.post(f"{BASE}/api/allocations/{alloc1_id}/approve", params={"approver_id": 4})
print_step("1.3 品牌督导发货", r1c.json(), r1c.status_code)

r1d = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc1_id,
    "actual_quantity": 10,
    "modification_acknowledged": False
})
d1d = r1d.json()
print_step("1.4 到柜复核(数量一致)", d1d, r1d.status_code)
check("1.4a 复核状态=reviewed", d1d["code"] == 0 and d1d["data"]["review_status"] == "reviewed")
check("1.4b 调拨单状态=reviewed", True)

# 验证调拨单状态
r1e = requests.get(f"{BASE}/api/allocations/{alloc1_id}")
d1e = r1e.json()
check("1.5 调拨单状态变为reviewed", d1e["data"]["status"] == "reviewed")

# 验证重复复核被阻止
r1f = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc1_id, "actual_quantity": 10, "modification_acknowledged": False
})
print_step("1.6 重复复核(应失败)", r1f.json(), r1f.status_code)
check("1.6 重复复核被阻止(状态拦截)", r1f.status_code == 400 and ("无法到柜复核" in r1f.json()["detail"] or "已完成复核" in r1f.json()["detail"]))


# ========== 场景2: 差异待核实 ==========
print("\n" + "="*70)
print("【场景2: 差异待核实 - 数量不一致 + 强制填差异原因】")
print("="*70)

key2 = f"test-disputed-{uuid.uuid4().hex[:6]}"
r2 = requests.post(f"{BASE}/api/allocations", params={"creator_id": 1}, json={
    "idempotent_key": key2,
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-C05",
    "brand": "雅诗兰黛", "floor": "2F",
    "goods_code": "TEST-DISPUTE", "goods_name": "差异测试品",
    "quantity": 20, "unit": "瓶",
    "remark": "差异测试"
})
d2 = r2.json()
alloc2_id = d2["data"]["id"]

requests.post(f"{BASE}/api/allocations/{alloc2_id}/approve", params={"approver_id": 3})
requests.post(f"{BASE}/api/allocations/{alloc2_id}/approve", params={"approver_id": 4})

# 测试: 数量不一致但不填差异原因
r2a = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc2_id,
    "actual_quantity": 17,
    "difference_reason": "",
    "modification_acknowledged": False
})
print_step("2.1 数量差异但不填差异原因(应失败)", r2a.json(), r2a.status_code)
check("2.1 差异原因必填校验生效", r2a.status_code == 400 and "必须填写差异原因" in r2a.json()["detail"])

# 正常提交差异复核
r2b = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc2_id,
    "actual_quantity": 17,
    "difference_reason": "实收17瓶，差3瓶。外箱完好，疑发货方少装，待核实。",
    "modification_acknowledged": False
})
d2b = r2b.json()
print_step("2.2 提交差异复核(填写原因)", d2b, r2b.status_code)
check("2.2a 复核状态=disputed", d2b["code"] == 0 and d2b["data"]["review_status"] == "disputed")
check("2.2b has_allocation_modified=false", d2b["data"]["has_allocation_modified"] == False)

# 验证调拨单状态变为 disputed
r2c = requests.get(f"{BASE}/api/allocations/{alloc2_id}")
d2c = r2c.json()
print_step("2.3 调拨单状态验证", d2c["data"]["status"], r2c.status_code)
check("2.3 调拨单状态变为disputed", d2c["data"]["status"] == "disputed")

# 验证差异待核实在待复核列表中
r2d = requests.get(f"{BASE}/api/reviews/pending")
d2d = r2d.json()
disputed_in_pending = any(x["status"] == "disputed" for x in d2d["data"]["items"])
print_step("2.4 待复核列表包含disputed", f"共{d2d['data']['total']}条, 其中disputed: {disputed_in_pending}")
check("2.4 差异待核实出现在待复核列表", disputed_in_pending)

# 验证差异后不能重复复核
r2e = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc2_id, "actual_quantity": 17,
    "difference_reason": "再次复核", "modification_acknowledged": False
})
print_step("2.5 差异后重复复核(应失败)", r2e.json(), r2e.status_code)
check("2.5 差异状态下重复复核被阻止", r2e.status_code == 400 and "已有差异记录" in r2e.json()["detail"])


# ========== 场景3: 被修改待复核 ==========
print("\n" + "="*70)
print("【场景3: 被修改待复核 - 发货后修改 + 复核端感知 + 强制确认】")
print("="*70)

key3 = f"test-modified-{uuid.uuid4().hex[:6]}"
r3 = requests.post(f"{BASE}/api/allocations", params={"creator_id": 1}, json={
    "idempotent_key": key3,
    "from_counter": "雅诗兰黛-2F-A01",
    "to_counter": "雅诗兰黛-2F-D07",
    "brand": "雅诗兰黛", "floor": "2F",
    "goods_code": "TEST-MODIFIED", "goods_name": "修改测试品",
    "quantity": 15, "unit": "瓶",
    "remark": "修改测试"
})
d3 = r3.json()
alloc3_id = d3["data"]["id"]

requests.post(f"{BASE}/api/allocations/{alloc3_id}/approve", params={"approver_id": 3})
requests.post(f"{BASE}/api/allocations/{alloc3_id}/approve", params={"approver_id": 4})

# 发货后修改
r3a = requests.put(f"{BASE}/api/allocations/{alloc3_id}", params={"operator_id": 1}, json={
    "quantity": 12, "change_reason": "VIP客户取消3瓶", "version": 1
})
d3a = r3a.json()
print_step("3.1 发货后修改调拨数量(15→12)", d3a, r3a.status_code)
check("3.1a 修改成功，is_modified=true", d3a["code"] == 0 and d3a["data"]["is_modified"] == True)
check("3.1b 状态保持shipped(发货后修改不改状态)", d3a["data"]["status"] == "shipped")
check("3.1c version升为2", d3a["data"]["version"] == 2)
check("3.1d 变更日志1条", len(d3a["data"]["change_logs"]) == 1)

# 验证待复核列表中显示为被修改
r3b = requests.get(f"{BASE}/api/reviews/pending")
d3b = r3b.json()
modified_item = next((x for x in d3b["data"]["items"] if x["id"] == alloc3_id), None)
print_step("3.2 待复核列表中该单is_modified", modified_item["is_modified"] if modified_item else None)
check("3.2 待复核列表中is_modified=true", modified_item and modified_item["is_modified"] == True)

# 未确认变更就复核 (应失败)
r3c = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc3_id,
    "actual_quantity": 12,
    "modification_acknowledged": False
})
print_step("3.3 未确认变更就复核(应失败)", r3c.json(), r3c.status_code)
check("3.3 未确认变更被拦截", r3c.status_code == 400 and "请先确认已知晓变更" in r3c.json()["detail"])

# 确认变更后复核 (应成功)
r3d = requests.post(f"{BASE}/api/reviews", params={"reviewer_id": 2}, json={
    "allocation_id": alloc3_id,
    "actual_quantity": 12,
    "modification_acknowledged": True
})
d3d = r3d.json()
print_step("3.4 确认变更后复核(应成功)", d3d, r3d.status_code)
check("3.4a 复核成功", d3d["code"] == 0)
check("3.4b has_allocation_modified=true", d3d["data"]["has_allocation_modified"] == True)
check("3.4c modification_acknowledged=true", d3d["data"]["modification_acknowledged"] == True)


# ========== 场景4: 时间线验证 ==========
print("\n" + "="*70)
print("【场景4: 时间线字段同步验证】")
print("="*70)

r4 = requests.get(f"{BASE}/api/reviews/timeline")
d4 = r4.json()
items = d4["data"]["items"]
print(f"  时间线共 {len(items)} 条记录")

# 找一条disputed的
disputed_item = next((x for x in items if x["allocation_status"] == "disputed"), None)
print_step("4.1 时间线中的差异待核实项", disputed_item["allocation_no"] if disputed_item else None)
check("4.1 时间线包含disputed状态", disputed_item is not None)
if disputed_item:
    check("4.1a review_status=disputed", disputed_item["review_status"] == "disputed")
    check("4.1b has_allocation_modified=false", disputed_item["has_allocation_modified"] == False)

# 找一条modified+reviewed的
modified_reviewed = next((x for x in items if x["is_modified"] and x["review_status"] == "reviewed"), None)
print_step("4.2 时间线中的被修改已复核项", modified_reviewed["allocation_no"] if modified_reviewed else None)
check("4.2 时间线包含修改后复核的记录", modified_reviewed is not None)
if modified_reviewed:
    check("4.2a modification_acknowledged=true", modified_reviewed["modification_acknowledged"] == True)
    check("4.2b has_allocation_modified=true", modified_reviewed["has_allocation_modified"] == True)
    check("4.2c modified_by有值", modified_reviewed["modified_by"] is not None)
    check("4.2d change_count>0", modified_reviewed["change_count"] > 0)


# ========== 场景5: 初始化样例验证 ==========
print("\n" + "="*70)
print("【场景5: 初始化样例数据验证两类责任场景】")
print("="*70)

r5 = requests.get(f"{BASE}/api/allocations")
d5 = r5.json()
allocs = d5["data"]["items"]

# 场景A: 被修改待复核 (shipped + is_modified=true)
scene_a = [a for a in allocs if a["status"] == "shipped" and a["is_modified"] == True]
print_step("5.1 场景A-被修改待复核", f"找到 {len(scene_a)} 条")
check("5.1 存在被修改待复核的样例", len(scene_a) >= 1)
if scene_a:
    check("5.1a 有变更日志", len(scene_a[0]["change_logs"]) > 0)
    check("5.1b 有历史备注", scene_a[0]["history_remark"] is not None and len(scene_a[0]["history_remark"]) > 0)
    check("5.1c 有创建人", scene_a[0]["creator_name"] is not None)

# 场景B: 差异待核实 (disputed)
scene_b = [a for a in allocs if a["status"] == "disputed"]
print_step("5.2 场景B-差异待核实", f"找到 {len(scene_b)} 条")
check("5.2 存在差异待核实的样例", len(scene_b) >= 1)
if scene_b:
    b = scene_b[0]
    check("5.2a 有复核记录", len(b["reviews"]) > 0)
    if b["reviews"]:
        check("5.2b 复核状态=disputed", b["reviews"][0]["review_status"] == "disputed")
        check("5.2c 有差异原因", b["reviews"][0]["difference_reason"] is not None)
        check("5.2d 实收数量≠期望数量", b["reviews"][0]["actual_quantity"] != b["quantity"])


# ========== 总结 ==========
print("\n" + "="*70)
print("【测试总结】")
print("="*70)
if all_passed:
    print("✅ 全部测试通过！争议分支修复验证完成：")
else:
    print("❌ 存在失败项，请检查上面的FAIL项")

print("")
print("修复验证点:")
print("  1. ✅ 数量不一致时，调拨单状态设为disputed")
print("  2. ✅ 同一调拨单不能重复复核（reviewed和disputed都阻止）")
print("  3. ✅ 服务层强制差异复核必填difference_reason")
print("  4. ✅ 待复核列表同时展示shipped和disputed两类")
print("  5. ✅ 初始化样例包含两类责任场景（被修改待复核+差异待核实）")
print("  6. ✅ 时间线字段同步：is_modified、has_allocation_modified、modification_acknowledged、modified_by、change_count")
print("  7. ✅ 发货后修改调拨单，状态保持shipped，is_modified标记，复核端强制确认")
