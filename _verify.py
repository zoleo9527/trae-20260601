#!/usr/bin/env python
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banquet_system.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import django
django.setup()

from banquet.models import (
    BanquetBooking, MenuConfirmation, AuditLog,
    MenuConfirmationItem, Employee, MenuItem
)
from banquet.seed import create_seed_data

print('=== 清理并重建种子数据 ===')
MenuConfirmationItem.objects.all().delete()
MenuConfirmation.objects.all().delete()
AuditLog.objects.all().delete()
BanquetBooking.objects.all().delete()
MenuItem.objects.all().delete()
Employee.objects.all().delete()

result = create_seed_data(reset=False)
print(f'创建: {result["message"]}')
print()

all_ok = True
bookings = BanquetBooking.objects.select_related(
    'sales_person', 'floor_supervisor', 'kitchen_coordinator'
).order_by('id')

for b in bookings:
    print('=' * 70)
    print(f'{b.booking_no} | {b.customer_name} | {b.get_status_display()}')
    print(f'  [booking] submitted_at = {b.submitted_at}')

    try:
        mc = MenuConfirmation.objects.get(booking=b)
        print(f'  [mc] confirmed_at    = {mc.confirmed_at}')
        if mc.remarks:
            print(f'  [mc] remarks        = ✅ {mc.remarks[:60]}')
        else:
            print(f'  [mc] remarks        = ❌ (空)')
            all_ok = False
    except MenuConfirmation.DoesNotExist:
        mc = None

    logs = AuditLog.objects.filter(booking=b).order_by('timestamp')
    print(f'  审计日志 {logs.count()} 条:')
    for log in logs:
        print(f'    [log] {log.timestamp} | {log.action} | {log.operator.name}')
        if log.remarks:
            print(f'          备注: {log.remarks[:50]}')

    # 校验提交时间一致性
    submit_log = logs.filter(action='提交宴会预订').first()
    if submit_log and b.submitted_at:
        diff = abs((submit_log.timestamp - b.submitted_at).total_seconds())
        ok = diff < 2
        if not ok: all_ok = False
        status = '✅' if ok else '❌'
        print(f'  提交一致性: {status} diff={diff:.3f}s')

    # 校验确认时间一致性
    confirm_log = logs.filter(action='确认菜单').first()
    if confirm_log and mc and mc.confirmed_at:
        diff = abs((confirm_log.timestamp - mc.confirmed_at).total_seconds())
        ok = diff < 2
        if not ok: all_ok = False
        status = '✅' if ok else '❌'
        print(f'  确认一致性: {status} diff={diff:.3f}s')

print()
print('=' * 70)
print('✅ 全部通过' if all_ok else '❌ 存在问题')
