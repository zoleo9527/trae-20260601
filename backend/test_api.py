import requests
import json

BASE = "http://localhost:8001"

def print_response(label, r):
    print(f"\n{'='*60}")
    print(f"[{r.status_code}] {label}")
    print(f"URL: {r.request.method} {r.url}")
    if r.request.body:
        print(f"Body: {r.request.body.decode()}")
    print(f"Response: {json.dumps(r.json(), ensure_ascii=False, indent=2)}")

# 1. 创建区域
r = requests.post(f"{BASE}/regions/", json={"code": "R001", "name": "朝阳区", "manager": "张经理", "target_capacity": 500})
print_response("创建区域 R001", r)
region1_id = r.json()["id"]

r = requests.post(f"{BASE}/regions/", json={"code": "R002", "name": "海淀区", "manager": "李经理", "target_capacity": 300})
print_response("创建区域 R002", r)
region2_id = r.json()["id"]

# 2. 创建车辆
for i in range(5):
    r = requests.post(f"{BASE}/vehicles/", json={"bike_code": f"B{i+1:04d}", "model": "Model-X", "current_region_id": region1_id})
    print_response(f"创建车辆 B{i+1:04d}", r)

# 3. 上报故障
r = requests.post(f"{BASE}/faults/", json={"vehicle_id": 1, "fault_type": "刹车失灵", "description": "前刹无制动力", "reporter": "用户A", "region_id": region1_id})
print_response("上报故障 刹车失灵", r)
fault1_id = r.json()["id"]

r = requests.post(f"{BASE}/faults/", json={"vehicle_id": 2, "fault_type": "车胎漏气", "description": "后胎慢撒气", "reporter": "巡检员", "region_id": region1_id})
print_response("上报故障 车胎漏气", r)
fault2_id = r.json()["id"]

r = requests.post(f"{BASE}/faults/", json={"vehicle_id": 3, "fault_type": "链条断裂", "reporter": "用户B", "region_id": region1_id})
print_response("上报故障 链条断裂", r)

# 4. 坏车入库
r = requests.post(f"{BASE}/inbound/batches/", json={
    "source_region_id": region1_id,
    "repair_station": "望京维修点",
    "operator": "王师傅",
    "remark": "6月10日巡检回收",
    "items": [
        {"vehicle_id": 1, "fault_id": fault1_id},
        {"vehicle_id": 2, "fault_id": fault2_id},
        {"vehicle_id": 4, "fault_type": "脚踏损坏", "fault_description": "左脚踏松动"}
    ]
})
print_response("坏车入库（批量3辆）", r)
batch_id = r.json()["id"]

# 5. 查询维修点统计
r = requests.get(f"{BASE}/repair/stations/summary")
print_response("维修点统计", r)

# 6. 查询维修单列表
r = requests.get(f"{BASE}/repair/orders/", params={"repair_station": "望京维修点"})
print_response("查询望京维修点维修单", r)
orders = r.json()
order1_id = orders[0]["id"]
order2_id = orders[1]["id"]
order3_id = orders[2]["id"]

# 7. 维修退回（配件缺货）
r = requests.post(f"{BASE}/repair/orders/{order1_id}/reject", json={
    "reject_reason": "刹车片缺货，预计3天后到货",
    "mechanic": "刘技师"
})
print_response("维修退回（配件缺货）", r)

# 8. 尝试直接完成被退回的维修单（应该失败）
r = requests.post(f"{BASE}/repair/orders/{order1_id}/complete", json={"repair_note": "已修好", "mechanic": "刘技师"})
print_response("尝试完成已退回维修单（应失败）", r)

# 9. 正常完成另外两个维修单
r = requests.post(f"{BASE}/repair/orders/{order2_id}/complete", json={"repair_note": "已更换内胎", "mechanic": "赵技师"})
print_response("完成维修单2（更换内胎）", r)

r = requests.post(f"{BASE}/repair/orders/{order3_id}/complete", json={"repair_note": "已更换脚踏", "mechanic": "赵技师"})
print_response("完成维修单3（更换脚踏）", r)

# 10. 查看维修点统计
r = requests.get(f"{BASE}/repair/stations/summary")
print_response("维修点统计（维修后）", r)

# 11. 批量出库投放
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region2_id,
    "operator": "陈调度",
    "items": [
        {"vehicle_id": 2, "repair_order_id": order2_id},
        {"vehicle_id": 4, "repair_order_id": order3_id}
    ]
})
print_response("批量出库投放至海淀区", r)
deployments = r.json()
dep1_id = deployments[0]["id"]
dep2_id = deployments[1]["id"]

# 12. 尝试投放退回的车（应失败 - 配件缺货）
r = requests.post(f"{BASE}/deployments/batch/", json={
    "target_region_id": region2_id,
    "operator": "陈调度",
    "items": [
        {"vehicle_id": 1, "repair_order_id": order1_id}
    ]
})
print_response("尝试投放退回车辆（应失败 - 配件缺货）", r)

# 13. 投放后复核 - 确认正常
r = requests.post(f"{BASE}/deployments/{dep1_id}/review", json={
    "status": "CONFIRMED",
    "review_note": "车辆状态良好，已正常投入运营",
    "reviewer": "李经理"
})
print_response("投放复核 - 确认正常", r)

# 14. 投放后复核 - 发现问题
r = requests.post(f"{BASE}/deployments/{dep2_id}/review", json={
    "status": "ISSUE_FOUND",
    "review_note": "脚踏仍有松动，需返回复检",
    "reviewer": "李经理"
})
print_response("投放复核 - 发现问题", r)

# 15. 区域经理反馈
r = requests.post(f"{BASE}/feedback/", json={
    "region_id": region2_id,
    "deployment_id": dep1_id,
    "feedback_type": "CONFIRM",
    "description": "收到2号车，运营正常",
    "reporter": "李经理"
})
print_response("区域反馈 - 确认收到", r)

# 16. 查看区域缺口统计
r = requests.get(f"{BASE}/regions/summary")
print_response("区域缺口统计", r)

# 17. 查询车辆当前状态
r = requests.get(f"{BASE}/vehicles/")
print_response("所有车辆状态", r)

print("\n" + "="*60)
print("所有接口测试完成!")
