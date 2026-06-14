#!/usr/bin/env python3

import httpx
import json
import subprocess
import time

proc = subprocess.Popen(['python3', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'])
time.sleep(3)

try:
    print("=== 1. 测试提醒列表接口 ===")
    response = httpx.get('http://127.0.0.1:8000/alerts/')
    print(f"状态码: {response.status_code}")
    alerts = response.json()
    print(f"返回 {len(alerts)} 条提醒")
    print(json.dumps(alerts, indent=2, ensure_ascii=False))

    print("\n=== 2. 测试门店反馈责任链（feedback_id=2, 处理中） ===")
    response = httpx.get('http://127.0.0.1:8000/responsibility/feedback/2')
    print(f"状态码: {response.status_code}")
    result = response.json()
    print("返回字段:")
    print(f"  - item_type: {result.get('item_type')}")
    print(f"  - current_status: {result.get('current_status')}")
    print(f"  - stuck_at: {result.get('stuck_at')}")
    print(f"  - reason_not_completed: {result.get('reason_not_completed')}")
    print(f"  - escalation_path 条目数: {len(result.get('escalation_path', []))}")
    print(f"  - latest_processing_note: {result.get('latest_processing_note')}")
    print("\n完整响应:")
    print(json.dumps(result, indent=2, ensure_ascii=False))

    print("\n=== 3. 测试卡住物料列表（超过3天） ===")
    response = httpx.get('http://127.0.0.1:8000/materials/stuck/list?days=3')
    print(f"状态码: {response.status_code}")
    stuck_materials = response.json()
    print(f"返回 {len(stuck_materials)} 条卡住物料")
    print(json.dumps(stuck_materials, indent=2, ensure_ascii=False))

    print("\n=== 4. 测试触发异常检测 ===")
    response = httpx.post('http://127.0.0.1:8000/alerts/check-stuck?days=3')
    print(f"状态码: {response.status_code}")
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    print("\n=== 5. 测试创建导出任务 ===")
    response = httpx.post('http://127.0.0.1:8000/exports/', json={'task_type': 'stuck_items'})
    print(f"状态码: {response.status_code}")
    task = response.json()
    print("响应:")
    print(json.dumps(task, indent=2, ensure_ascii=False))

    print("\n=== 6. 检查导出任务状态 ===")
    task_id = task['id']
    time.sleep(2)
    response = httpx.get(f'http://127.0.0.1:8000/exports/{task_id}')
    print(f"状态码: {response.status_code}")
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

except Exception as e:
    print(f"测试失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    proc.terminate()
    print("\n测试完成")