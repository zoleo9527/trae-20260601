#!/usr/bin/env python3

import subprocess
import time
import httpx
import json

proc = subprocess.Popen(['python3', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'])
time.sleep(3)

try:
    print('=== 1. 测试活动物料责任链（有处理记录） ===')
    response = httpx.get('http://127.0.0.1:8000/responsibility/material/3')
    print(f'状态码: {response.status_code}')
    if response.status_code == 200:
        result = response.json()
        print(f'latest_processing_note: {result.get("latest_processing_note")}')
        print(f'escalation_path 条目数: {len(result.get("escalation_path", []))}')
        print('完整响应:')
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f'错误: {response.text}')

    print('\n=== 2. 测试活动物料责任链（无处理记录） ===')
    response = httpx.get('http://127.0.0.1:8000/responsibility/material/5')
    print(f'状态码: {response.status_code}')
    if response.status_code == 200:
        result = response.json()
        print(f'latest_processing_note: {result.get("latest_processing_note")}')
        print(f'escalation_path 条目数: {len(result.get("escalation_path", []))}')
        print('完整响应:')
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f'错误: {response.text}')

    print('\n=== 3. 测试门店反馈责任链（有处理记录） ===')
    response = httpx.get('http://127.0.0.1:8000/responsibility/feedback/2')
    print(f'状态码: {response.status_code}')
    if response.status_code == 200:
        result = response.json()
        print(f'latest_processing_note: {result.get("latest_processing_note")}')
        print(f'escalation_path 条目数: {len(result.get("escalation_path", []))}')
        print(f'reason_not_completed: {result.get("reason_not_completed")}')
        print('完整响应:')
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f'错误: {response.text}')

    print('\n=== 4. 测试门店反馈责任链（无处理记录） ===')
    response = httpx.get('http://127.0.0.1:8000/responsibility/feedback/3')
    print(f'状态码: {response.status_code}')
    if response.status_code == 200:
        result = response.json()
        print(f'latest_processing_note: {result.get("latest_processing_note")}')
        print(f'escalation_path 条目数: {len(result.get("escalation_path", []))}')
        print('完整响应:')
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f'错误: {response.text}')

except Exception as e:
    print(f'测试失败: {e}')
    import traceback
    traceback.print_exc()
finally:
    proc.terminate()
    print('\n测试完成')