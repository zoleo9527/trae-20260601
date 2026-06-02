#!/usr/bin/env python3
import json
import urllib.request
import sys

BASE = "http://localhost:3000"

def post(url, data):
    req = urllib.request.Request(
        f"{BASE}{url}",
        data=json.dumps(data).encode() if data else b"{}",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    return json.loads(urllib.request.urlopen(req).read())

def patch(url, data):
    req = urllib.request.Request(
        f"{BASE}{url}",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    return json.loads(urllib.request.urlopen(req).read())

def get(url):
    return json.loads(urllib.request.urlopen(f"{BASE}{url}").read())

print("=== 测试争议发起时的审计链断点修复 ===")
print()

# 1. 创建运单
shipment = post("/api/shipments", {
    "shipment_no": "TEST-AUDIT-001",
    "origin": "北京",
    "destination": "上海",
    "driver_name": "张师傅",
    "temp_min": 2,
    "temp_max": 8
})
sid = shipment["id"]
print(f"✓ 1. 创建运单: {sid[:24]}...")

# 2. 状态变更为 in_transit
patch(f"/api/shipments/{sid}/status", {"status": "in_transit", "changed_by": "调度员"})
print("✓ 2. 状态变更为 in_transit")

# 3. 上传温控采样（含越界）
samples = []
for i in range(10):
    t = f"2026-06-01T07:{i*6:02d}:00Z"
    temp = 4.0 if i < 4 else 10.0 if i < 7 else 5.0
    samples.append({"recorded_at": t, "temperature": temp})
post(f"/api/shipments/{sid}/temperature-samples", {"samples": samples})
print("✓ 3. 上传 10 条温控采样")

# 4. 检测异常
anomalies = post(f"/api/shipments/{sid}/detect-anomalies", {})
aid = anomalies["anomalies"][0]["id"]
print(f"✓ 4. 检测异常: {aid[:24]}...")

# 5. 确认异常
patch(f"/api/anomaly-intervals/{aid}/confirm", {"confirmed_by": "质控员"})
print("✓ 5. 确认异常")

# 6. 签收
post(f"/api/shipments/{sid}/delivery-receipt", {
    "receiver_name": "测试签收",
    "received_at": "2026-06-01T12:00:00Z",
    "uploaded_by": "司机"
})
print("✓ 6. 签收")

# 7. 发起争议（关键步骤：这会触发多条审计记录）
dispute = post(f"/api/shipments/{sid}/disputes", {
    "reason": "测试争议原因",
    "initiated_by": "客服",
    "anomaly_interval_ids": [aid]
})
did = dispute["id"]
print(f"✓ 7. 发起争议: {did[:24]}...")

# 8. 查询争议详情聚合，检查审计日志
detail = get(f"/api/disputes/{did}/detail")
logs = detail["key_audit_logs"]
print()
print("=== 关键审计节点检查 ===")
print(f"关键审计节点总数: {len(logs)}")
print()

has_dispute_create = False
has_anomaly_status_change = False
has_shipment_status_change = False
has_anomaly_confirm = False
has_delivery_receipt_uploaded = False
has_anomalies_detected = False

for log in logs:
    et = log["entity_type"]
    ac = log["action"]
    ov = log["old_value"] or "NULL"
    nv = log["new_value"]
    cb = log["changed_by"]
    
    print(f"  [{et:16s}] {ac:30s} {ov:12s} -> {nv}  (by {cb})")
    
    if et == "dispute" and ac == "create":
        has_dispute_create = True
    if et == "anomaly_interval" and ac == "status_change":
        has_anomaly_status_change = True
    if et == "shipment" and ac == "status_change":
        has_shipment_status_change = True
    if et == "anomaly_interval" and ac == "confirm":
        has_anomaly_confirm = True
    if et == "shipment" and ac == "delivery_receipt_uploaded":
        has_delivery_receipt_uploaded = True
    if et == "shipment" and ac == "anomalies_detected":
        has_anomalies_detected = True

print()
print("=== 验证结果 ===")
checks = [
    ("dispute 的 create 记录", has_dispute_create),
    ("anomaly_interval 的 status_change 记录", has_anomaly_status_change),
    ("shipment 的 status_change 记录", has_shipment_status_change),
    ("anomaly_interval 的 confirm 记录", has_anomaly_confirm),
    ("delivery_receipt_uploaded 记录", has_delivery_receipt_uploaded),
    ("anomalies_detected 记录", has_anomalies_detected),
]

all_passed = True
for name, ok in checks:
    status = "✓ PASS" if ok else "✗ FAIL"
    print(f"  {status}: {name}")
    if not ok:
        all_passed = False

print()
if all_passed:
    print("✓ 所有审计链断点修复验证通过！")
else:
    print("✗ 部分验证失败！")
    sys.exit(1)
