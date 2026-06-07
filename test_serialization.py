#!/usr/bin/env python3
import os
import sys
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from locker_system.models import Compensation
from locker_system.api import build_compensation_detail_response

comp = Compensation.objects.select_related(
    "abnormal", "abnormal__locker", "abnormal__locker__area",
    "abnormal__reported_by", "abnormal__reported_by__user",
    "abnormal__assigned_to", "abnormal__assigned_to__user",
    "abnormal__processed_by", "abnormal__processed_by__user",
    "abnormal__returned_by", "abnormal__returned_by__user",
    "abnormal__related_technician",
    "proposed_by", "proposed_by__user",
    "reviewed_by", "reviewed_by__user",
    "paid_by", "paid_by__user",
).prefetch_related(
    "abnormal__progresses",
    "progresses"
).first()

result = build_compensation_detail_response(comp)

print("=== 直接 JSON 序列化测试 ===")
try:
    json_data = result.model_dump_json(indent=2)
    parsed = json.loads(json_data)
    print("✅ JSON 序列化成功！")
    print()

    print("=== 关键字段检查 ===")
    for key in ["evidence_chain", "abnormal_summary", "status_summary", "full_timeline"]:
        has = key in parsed and parsed[key] is not None
        print(f"{'✅' if has else '❌'} {key}: {'存在' if has else '缺失'}")

    print()
    print("=== full_timeline 节点 ===")
    if parsed["full_timeline"]:
        for idx, item in enumerate(parsed["full_timeline"]):
            print(f"{idx+1:2d}. [{item['type']}] {item['type_display']} | {item['record_id']}")
            print(f"     {item['action']}: {item['detail'][:40]}...")
            print(f"     by {item['operator_name']} @ {item['created_at']}")

    print()
    print("=== abnormal_summary 关键字段 ===")
    asm = parsed["abnormal_summary"]
    for k in ["process_result", "return_reason", "abnormal_status_display"]:
        print(f"  {k}: {asm.get(k, 'N/A')}")

    print()
    print("=== status_summary ===")
    ss = parsed["status_summary"]
    for k in ["current_stage", "current_status_display", "next_action", "summary_text"]:
        print(f"  {k}: {ss.get(k, 'N/A')}")

    print()
    print("✅ 全部序列化正常！")

except Exception as e:
    print(f"❌ 序列化失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
