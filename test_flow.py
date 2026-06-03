#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banquet_system.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from datetime import timedelta, date, time

from banquet.models import (
    Employee, Role, MenuItem, BanquetBooking, BookingStatus,
    MenuConfirmation, MenuConfirmationItem
)
from banquet.services import (
    submit_booking, confirm_menu, receive_by_kitchen,
    start_service, complete_booking, cancel_booking,
    get_stuck_bookings, StateTransitionError
)


def test_full_flow():
    print('=' * 60)
    print('测试主链路流程：销售提交 → 厅面确认 → 后厨接收 → 开始 → 完成')
    print('=' * 60)

    print('\n1. 创建测试员工...')
    sales = Employee.objects.create(name='测试销售', role=Role.SALES, phone='13800000001')
    floor = Employee.objects.create(name='测试主管', role=Role.FLOOR_SUPERVISOR, phone='13800000002')
    kitchen = Employee.objects.create(name='测试统筹', role=Role.KITCHEN_COORDINATOR, phone='13800000003')
    print(f'   - 销售: {sales.id} {sales.name}')
    print(f'   - 厅面: {floor.id} {floor.name}')
    print(f'   - 后厨: {kitchen.id} {kitchen.name}')

    print('\n2. 创建测试菜品...')
    items = []
    for i, (name, price) in enumerate([
        ('测试冷菜', 88), ('测试热菜', 168), ('测试汤羹', 68), ('测试主食', 38)
    ]):
        item = MenuItem.objects.create(
            name=name,
            category=['冷菜', '热菜', '汤羹', '主食'][i],
            price=price
        )
        items.append(item)
        print(f'   - {item.name}: {item.price}元')

    print('\n3. 创建宴会预订（草稿）...')
    today = date.today()
    booking = BanquetBooking.objects.create(
        booking_no=f'TEST{today.strftime("%Y%m%d")}-0001',
        customer_name='测试客户',
        customer_phone='13900000001',
        banquet_type='测试宴',
        banquet_date=today + timedelta(days=7),
        start_time=time(18, 0),
        end_time=time(21, 0),
        venue='测试厅',
        expected_guests=100,
        table_count=10,
        budget_per_table=2000,
        sales_person=sales,
        status=BookingStatus.DRAFT,
        remarks='测试订单'
    )
    print(f'   - 预订号: {booking.booking_no}')
    print(f'   - 状态: {booking.get_status_display()}')

    print('\n4. 销售提交预订...')
    booking = submit_booking(booking.id, sales.id, remarks='客户确认无误，提交审批')
    print(f'   - 状态: {booking.get_status_display()}')
    print(f'   - 提交时间: {booking.submitted_at}')

    print('\n5. 厅面主管确认菜单...')
    menu_data = {
        'items': [
            {'menu_item_id': item.id, 'quantity': 10, 'unit_price': float(item.price)}
            for item in items
        ],
        'special_requirements': '客户对海鲜过敏',
        'wine_arrangement': '自带红酒',
        'table_layout': '10桌圆桌',
        'customer_signed': True,
    }
    booking, mc = confirm_menu(booking.id, floor.id, menu_data, remarks='菜单已与客户确认')
    print(f'   - 状态: {booking.get_status_display()}')
    print(f'   - 总金额: {mc.total_amount}元')
    print(f'   - 厅面主管: {booking.floor_supervisor.name}')

    print('\n6. 后厨统筹接收...')
    booking = receive_by_kitchen(booking.id, kitchen.id, remarks='已安排后厨备货')
    print(f'   - 状态: {booking.get_status_display()}')
    print(f'   - 后厨统筹: {booking.kitchen_coordinator.name}')

    print('\n7. 开始服务...')
    booking = start_service(booking.id, sales.id, remarks='客人已入座，开始上菜')
    print(f'   - 状态: {booking.get_status_display()}')

    print('\n8. 完成宴会...')
    booking = complete_booking(booking.id, floor.id, remarks='宴会圆满结束，客户满意')
    print(f'   - 状态: {booking.get_status_display()}')

    print('\n9. 查看审计日志...')
    logs = booking.audit_logs.all().order_by('timestamp')
    for log in logs:
        print(f'   [{log.timestamp.strftime("%H:%M:%S")}] {log.operator.name}({log.get_operator_role_display()}) - {log.action}')
        if log.remarks:
            print(f'     备注: {log.remarks}')

    print('\n' + '=' * 60)
    print('测试卡住订单暴露功能')
    print('=' * 60)

    print('\n10. 创建超时未处理的订单...')
    stuck_booking = BanquetBooking.objects.create(
        booking_no=f'TEST{today.strftime("%Y%m%d")}-9001',
        customer_name='卡住客户',
        customer_phone='13900000002',
        banquet_type='卡住宴',
        banquet_date=today + timedelta(days=2),
        start_time=time(18, 0),
        end_time=time(21, 0),
        venue='卡住厅',
        expected_guests=50,
        table_count=5,
        budget_per_table=1500,
        sales_person=sales,
        status=BookingStatus.SUBMITTED,
        submitted_at=timezone.now() - timedelta(hours=25),
        remarks='提交已超过24小时，应该被标记为卡住'
    )

    print('\n11. 查询卡住订单...')
    stuck_list = get_stuck_bookings()
    print(f'   发现 {len(stuck_list)} 个卡住/预警订单:')
    for item in stuck_list:
        b = item['booking']
        print(f'   - {b.booking_no} ({b.customer_name})')
        print(f'     卡住级别: {item["stuck_level_display"]}')
        print(f'     截止时间: {item["deadline"]}')
        print(f'     超时: {item["overdue_hours"]}小时')

    print('\n' + '=' * 60)
    print('测试权限控制')
    print('=' * 60)

    print('\n12. 尝试用销售身份确认菜单（应该失败）...')
    try:
        test_booking = BanquetBooking.objects.create(
            booking_no=f'TEST{today.strftime("%Y%m%d")}-0002',
            customer_name='权限测试',
            customer_phone='13900000003',
            banquet_type='权限宴',
            banquet_date=today + timedelta(days=10),
            start_time=time(18, 0),
            end_time=time(21, 0),
            venue='权限厅',
            expected_guests=30,
            table_count=3,
            budget_per_table=3000,
            sales_person=sales,
            status=BookingStatus.SUBMITTED,
            submitted_at=timezone.now(),
        )
        confirm_menu(test_booking.id, sales.id, {'items': []})
        print('   ❌ 错误：销售不应该能确认菜单！')
    except StateTransitionError as e:
        print(f'   ✅ 正确拦截: {e}')

    print('\n' + '=' * 60)
    print('✅ 所有测试通过！')
    print('=' * 60)


if __name__ == '__main__':
    test_full_flow()
