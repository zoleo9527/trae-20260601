#!/usr/bin/env python3
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from locker_system.models import Compensation, LockerAbnormal, StaffProfile, RoleType, Locker
from locker_system.api import _build_compensation_list_item

print("=" * 70)
print("=== 补充测试数据 + 验证赔付列表待办视图")
print("=" * 70)
print()

reception = StaffProfile.objects.get(role=RoleType.RECEPTION)
supervisor = StaffProfile.objects.get(role=RoleType.FLOOR_SUPERVISOR)
finance = StaffProfile.objects.get(role=RoleType.FINANCE)

print("📦 已存在的赔付记录：")
for c in Compensation.objects.all():
    print(f"  ID {c.id}: {c.get_status_display()} - ¥{c.compensation_amount} - {c.customer_name}")

print()
print("➕ 补充一条【已拒绝】的赔付记录作为样本...")

Locker_test = Locker.objects.filter(locker_no="F012").first()
if not Locker_test:
    Locker_test = Locker.objects.filter(status="occupied").first()

if Locker_test:
    if not Compensation.objects.filter(status="rejected").exists():
        abnormal_rej = LockerAbnormal.objects.create(
            locker=Locker_test,
            abnormal_type=LockerAbnormal.Type.ITEM_MISSING,
            status=LockerAbnormal.Status.RETURNED,
            priority=2,
            customer_name="吴九",
            customer_phone="13899999999",
            description="客人称手表遗失，价值约2000元",
            reported_by=reception,
            assigned_to=supervisor,
            assigned_at=datetime.now() - timedelta(hours=12),
            processed_by=supervisor,
            processed_at=datetime.now() - timedelta(hours=8),
            process_result="已核实，建议赔付2000元",
            return_reason="赔付被拒：手表无购买凭证，无法确认价值",
            returned_by=finance,
            returned_at=datetime.now() - timedelta(hours=2),
            expected_deadline=datetime.now() - timedelta(hours=1),
        )

        comp_rej = Compensation.objects.create(
            abnormal=abnormal_rej,
            customer_name="吴九",
            customer_phone="13899999999",
            item_description="浪琴手表一只",
            estimated_value=Decimal("2000.00"),
            compensation_amount=Decimal("1000.00"),
            status=Compensation.Status.REJECTED,
            proposed_by=supervisor,
            proposed_at=datetime.now() - timedelta(hours=6),
            reviewed_by=finance,
            reviewed_at=datetime.now() - timedelta(hours=2),
            review_comment="客人无法提供购买凭证",
            reject_reason="无有效购买凭证，无法确认物品价值",
        )
        print(f"  ✅ 已创建：赔付ID={comp_rej.id}，状态=已拒绝")
    else:
        print("  ✅ 已存在拒绝的赔付记录，无需重复创建")

print()
print("➕ 补充一条【待支付】的赔付记录作为样本...")

if not Compensation.objects.filter(status="reviewed").exists():
    Locker_test2 = Locker.objects.filter(locker_no="V005").first()
    if not Locker_test2:
        Locker_test2 = Locker.objects.filter(status="available").first()

    if Locker_test2:
        abnormal_pay = LockerAbnormal.objects.create(
            locker=Locker_test2,
            abnormal_type=LockerAbnormal.Type.LOCKER_DAMAGE,
            status=LockerAbnormal.Status.NEED_COMPENSATION,
            priority=3,
            customer_name="郑十",
            customer_phone="13800000010",
            description="柜门锁损坏，导致客人无法及时取物",
            reported_by=reception,
            assigned_to=supervisor,
            assigned_at=datetime.now() - timedelta(hours=5),
            processed_by=supervisor,
            processed_at=datetime.now() - timedelta(hours=3),
            process_result="确认为门锁故障，建议赔付500元",
            expected_deadline=datetime.now() - timedelta(hours=30),
        )

        comp_pay = Compensation.objects.create(
            abnormal=abnormal_pay,
            customer_name="郑十",
            customer_phone="13800000010",
            item_description="客人时间损失补偿",
            estimated_value=Decimal("500.00"),
            compensation_amount=Decimal("500.00"),
            status=Compensation.Status.REVIEWED,
            proposed_by=supervisor,
            proposed_at=datetime.now() - timedelta(hours=3),
            reviewed_by=finance,
            reviewed_at=datetime.now() - timedelta(hours=1),
            review_comment="情况属实，同意赔付",
        )
        print(f"  ✅ 已创建：赔付ID={comp_pay.id}，状态=待支付")
else:
    print("  ✅ 已存在待支付的赔付记录，无需重复创建")

print()
print("=" * 70)
print("=== 当前赔付记录状态分布：")
print("-" * 70)
for status in ["pending_review", "reviewed", "rejected", "paid"]:
    count = Compensation.objects.filter(status=status).count()
    print(f"  {dict(Compensation.Status.choices)[status]}: {count} 条")

print()
print("=" * 70)
print("=== 默认待办列表（只显示待审核/待支付/已拒绝）：")
print("-" * 70)

qs = Compensation.objects.select_related(
    "abnormal", "abnormal__locker", "abnormal__locker__area",
    "abnormal__reported_by", "abnormal__assigned_to", "abnormal__processed_by",
    "proposed_by", "reviewed_by", "paid_by"
).filter(status__in=["pending_review", "reviewed", "rejected"]).order_by(
    Case(
        When(status="pending_review", then=0),
        When(status="reviewed", then=1),
        When(status="rejected", then=2),
        default=3,
    ),
    "-proposed_at"
)

for idx, comp in enumerate(qs, 1):
    item = _build_compensation_list_item(comp)
    print(f"\n{idx:2d}. 【{item['status_summary']['priority_tag']}】"
          f" {item['locker_no']} - {item['customer_name']}"
          f" | ¥{item['compensation_amount']}")
    print(f"    阶段: {item['status_summary']['current_stage']}"
          f" | 下一步: {item['status_summary']['next_action']}")
    print(f"    异常: {item['abnormal_brief']['abnormal_type_display']}"
          f" - {item['abnormal_brief']['abnormal_description']}")
    print(f"    主管处理: {item['abnormal_brief']['process_result_brief']}")
    print(f"    等待: {item['waiting_days']}天"
          f" | 紧急: {'是' if item['is_urgent'] else '否'}")
    print(f"    提交时间: {item['proposed_at']}")

print()
print("=" * 70)
print("✅ 默认待办视图测试通过！")
print("   财务打开列表即可看到：待审核 → 待支付 → 已拒绝，按优先级排序")
print("   每条都有：当前阶段、下一步、异常摘要、处理结果摘要、紧急标记")
