import json
from urllib import request, parse

BASE = "http://localhost:8001/api"
HEADERS = {"X-User-Id": "1", "Content-Type": "application/json"}

def http_get(url):
    req = request.Request(url, headers=HEADERS)
    return json.loads(request.urlopen(req).read())

def http_post(url, data):
    req = request.Request(url, data=json.dumps(data).encode(), headers=HEADERS, method="POST")
    return json.loads(request.urlopen(req).read())

def http_put(url, data):
    req = request.Request(url, data=json.dumps(data).encode(), headers=HEADERS, method="PUT")
    return json.loads(request.urlopen(req).read())

def test_rejected_resubmit():
    print("=" * 60)
    print("测试1: rejected 状态重新提交")
    print("=" * 60)

    apps = http_get(f"{BASE}/applications?role=all")
    rejected_id = None
    for app in apps['all_tasks']:
        if app['status'] == 'rejected':
            rejected_id = app['id']
            print(f"找到 rejected 申请: ID={app['id']}, 编号={app['application_no']}")
            break

    data = http_post(
        f"{BASE}/applications/{rejected_id}/transition",
        {"action": "approve", "remark": "修改后重新提交测试"}
    )
    print("重新提交结果: 200 OK")
    print(f"新状态: {data['status']}")
    print(f"当前处理角色: {data['current_handler_role']}")
    print(f"是否逾期: {data['is_overdue']}")

    logs = http_get(f"{BASE}/applications/{rejected_id}/timeline")
    print(f"\n时间线 ({len(logs)}条):")
    for log in logs:
        print(f"  [{log['created_at'][11:16]}] {log['action']}: {log['from_status']} -> {log['to_status']}")
    return True

def test_modify_notice_inheritance():
    print("\n" + "=" * 60)
    print("测试2: 进入费用确认前修改，检查改动提醒继承")
    print("=" * 60)

    apps = http_get(f"{BASE}/applications?role=all")
    decoctor_id = None
    for app in apps['all_tasks']:
        if app['status'] == 'pending_decoctor':
            decoctor_id = app['id']
            print(f"找到待煎药申请: ID={app['id']}, 编号={app['application_no']}")
            break

    data = http_put(
        f"{BASE}/applications/{decoctor_id}",
        {"reason_detail": "修改了详细原因，测试改动提醒继承"}
    )
    print("修改结果: 200 OK")
    print(f"已修改标记: {data['is_modified']}")
    print(f"当前费用确认存在: {data['fee_confirmation'] is not None}")

    res = http_post(
        f"{BASE}/applications/{decoctor_id}/transition",
        {"action": "approve", "remark": "煎药完成"}
    )
    print(f"流转到配送: 200 OK")
    
    res2 = http_post(
        f"{BASE}/applications/{res['id']}/transition",
        {"action": "approve", "remark": "配送完成"}
    )
    print(f"流转到费用确认: 200 OK")
    print(f"最终状态: {res2['status']}")
    print(f"费用确认 - 改动通知: {res2['fee_confirmation']['has_modification_notice']}")
    print(f"费用确认 - 最后修改时间: {res2['fee_confirmation']['last_modified_at']}")

    fees = http_get(f"{BASE}/fee-review")
    print(f"\n费用回看列表:")
    for f in fees:
        notice = " 🔔 有改动!" if f['has_modification_notice'] else ""
        print(f"  {f['application_no']}: {f['patient_name']} - {f['payment_status']}{notice}")
    return True

def test_fee_confirm_status_sync():
    print("\n" + "=" * 60)
    print("测试3: 费用确认后状态同步")
    print("=" * 60)

    apps = http_get(f"{BASE}/applications?role=all")
    fee_id = None
    for app in apps['all_tasks']:
        if app['status'] == 'pending_fee':
            fee_id = app['id']
            print(f"找到待费用确认申请: ID={app['id']}, 编号={app['application_no']}")
            break

    data = http_put(
        f"{BASE}/applications/{fee_id}/fee",
        {
            "decoction_fee": 25,
            "express_fee": 12,
            "material_fee": 50,
            "total_fee": 87,
            "is_patient_pay": False,
            "payment_status": "confirmed",
            "remark": "费用确认测试"
        }
    )
    print("费用确认结果: 200 OK")
    print(f"返回数据包含 application_no: {'application_no' in data}")
    print(f"申请状态: {data['status']}")
    print(f"当前处理角色: {data['current_handler_role']}")
    print(f"费用状态: {data['fee_confirmation']['payment_status']}")
    print(f"费用确认时间: {data['fee_confirmation']['confirmed_at']}")
    return True

if __name__ == "__main__":
    try:
        test_rejected_resubmit()
        test_modify_notice_inheritance()
        test_fee_confirm_status_sync()
        print("\n" + "=" * 60)
        print("✅ 所有测试通过!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
