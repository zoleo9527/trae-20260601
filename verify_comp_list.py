#!/usr/bin/env python3
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from locker_system.models import Compensation
from locker_system.api import _build_compensation_list_item

qs = Compensation.objects.filter(status__in=["pending_review", "reviewed", "rejected"]).all()

print("=== 赔付列表待办视图数据 ===")
print()
for idx, comp in enumerate(qs, 1):
    item = _build_compensation_list_item(comp)
    tag = item["status_summary"]["priority_tag"]
    locker = item["locker_no"]
    name = item["customer_name"]
    amount = item["compensation_amount"]
    stage = item["status_summary"]["current_stage"]
    next_action = item["status_summary"]["next_action"]
    abn_type = item["abnormal_brief"]["abnormal_type_display"]
    abn_desc = item["abnormal_brief"]["abnormal_description"]
    result = item["abnormal_brief"]["process_result_brief"]
    wait = item["waiting_days"]
    urgent = item["is_urgent"]

    print(f'{idx}. 【{tag}】 {locker} - {name} | ¥{amount}')
    print(f'   阶段: {stage} | 下一步: {next_action}')
    print(f'   异常: {abn_type} - {abn_desc}')
    print(f'   主管处理: {result}')
    print(f'   等待: {wait}天 | 紧急: {"是" if urgent else "否"}')
    print()

print("✅ 列表数据组装成功！")
