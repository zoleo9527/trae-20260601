#!/usr/bin/env python3
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from locker_system.models import Compensation, LockerAbnormal
from locker_system.api import build_compensation_detail_response

print("=" * 70)
print("=== 赔付详情接力链测试 ===")
print()

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

if not comp:
    print("没有找到赔付记录，先创建一条带进度的测试数据...")
    print()
    from locker_system.models import StaffProfile, RoleType

    abnormal = LockerAbnormal.objects.filter(status="need_compensation").first()
    if not abnormal:
        print("也没有待赔付的异常记录，请先运行 init_data 初始化")
        exit(1)

    supervisor = StaffProfile.objects.get(role=RoleType.FLOOR_SUPERVISOR)
    finance = StaffProfile.objects.get(role=RoleType.FINANCE)

    from locker_system.api import add_abnormal_progress, add_compensation_progress

    add_abnormal_progress(abnormal, "前台登记", f"登记异常：{abnormal.get_abnormal_type_display()}", supervisor)
    add_abnormal_progress(abnormal, "派单", f"派单给{supervisor.user.get_full_name()}", supervisor)
    add_abnormal_progress(abnormal, "现场核实", "已调阅监控，确认物品遗失", supervisor)
    add_abnormal_progress(abnormal, "处理完成", "已与客人沟通，建议赔付3000元", supervisor)

    if not hasattr(abnormal, 'compensation') or abnormal.compensation is None:
        from decimal import Decimal
        from locker_system.models import Compensation
        comp = Compensation.objects.create(
            abnormal=abnormal,
            customer_name=abnormal.customer_name,
            customer_phone=abnormal.customer_phone,
            item_description="iPhone 14 Pro",
            estimated_value=Decimal("5000.00"),
            compensation_amount=Decimal("3000.00"),
            status="pending_review",
            proposed_by=supervisor,
        )
        add_compensation_progress(comp, "提交赔付申请", "申请金额：3000元", supervisor)
    else:
        comp = abnormal.compensation

detail = build_compensation_detail_response(comp)

print("📋 【赔付状态摘要】")
ss = detail["status_summary"]
print(f"  当前阶段: {ss['current_stage']}")
print(f"  当前状态: {ss['current_status_display']}")
print(f"  下一步: {ss['next_action']}")
print(f"  摘要: {ss['summary_text']}")
print()

print("📝 【关联异常摘要】")
asm = detail["abnormal_summary"]
print(f"  异常类型: {asm['abnormal_type_display']} (优先级: {asm['priority']})")
print(f"  异常描述: {asm['description']}")
print(f"  客人: {asm['customer_name']} / {asm['customer_phone']}")
print(f"  前台登记: {asm['reported_by_name']} @ {asm['reported_at']}")
print(f"  派单给: {asm['assigned_to_name']} @ {asm['assigned_at']}")
print(f"  主管处理: {asm['processed_by_name']} @ {asm['processed_at']}")
print(f"  处理结果: {asm['process_result'] or '（无）'}")
print(f"  退回原因: {asm['return_reason'] or '（无）'}")
print(f"  异常当前状态: {asm['abnormal_status_display']}")
print()

print("🔗 【判断依据链】")
ev = detail["evidence_chain"]
print(f"  储物柜: {ev['locker_info']['locker_no']} ({ev['locker_info']['area_name']}) - {ev['locker_info']['status_display']}")
if ev['wristband_info']:
    print(f"  手牌: {ev['wristband_info']['wristband_code']} - {ev['wristband_info']['status_display']}")
    print(f"       发放人: {ev['wristband_info']['issued_by_name']} @ {ev['wristband_info']['issued_at']}")
if ev['technician_schedule']:
    print(f"  技师排班: {ev['technician_schedule']['technician_name']}")
    print(f"            {ev['technician_schedule']['shift_date']} {ev['technician_schedule']['shift_type']}")
    print(f"            负责区域: {ev['technician_schedule']['assigned_area_name']}")
print()

print("⏱ 【完整接力时间线】（异常+赔付合并，按时间排序）")
print(f"  共 {len(detail['full_timeline'])} 条记录:")
for idx, item in enumerate(detail['full_timeline'], 1):
    type_icon = "📋" if item['type'] == 'abnormal' else "💰"
    print(f"  {idx:2d}. {type_icon} [{item['created_at']}] {item['operator_name']}")
    print(f"       {item['action']}: {item['detail']}")

print()
print("=" * 70)
print("✅ 赔付详情接力链验证完成！")
print()
print("财务回看时能看到：")
print("  1. 当前走到哪一步、下一步该做什么（status_summary）")
print("  2. 前台怎么登记的、主管怎么处理的、为什么退回（abnormal_summary）")
print("  3. 储物柜+手牌+技师排班的判断依据（evidence_chain）")
print("  4. 从登记到现在的完整操作时间线（full_timeline）")
