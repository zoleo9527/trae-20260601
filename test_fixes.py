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
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    print("\n=== 2. 测试门店反馈责任链 ===")
    response = httpx.get('http://127.0.0.1:8000/responsibility/feedback/2')
    print(f"状态码: {response.status_code}")
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    print("\n=== 3. 测试卡住物料列表 ===")
    response = httpx.get('http://127.0.0.1:8000/materials/stuck/list')
    print(f"状态码: {response.status_code}")
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    print("\n=== 4. 测试创建导出任务 ===")
    response = httpx.post('http://127.0.0.1:8000/exports/', json={'task_type': 'stuck_items'})
    print(f"状态码: {response.status_code}")
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    print("\n=== 5. 检查导出任务状态 ===")
    task_id = response.json()['id']
    time.sleep(2)
    response = httpx.get(f'http://127.0.0.1:8000/exports/{task_id}')
    print(f"状态码: {response.status_code}")
    print("响应:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

except Exception as e:
    print(f"测试失败: {e}")
finally:
    proc.terminate()
    print("\n测试完成")