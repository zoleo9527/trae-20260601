from django.utils import timezone
from datetime import timedelta, date, time
from django.db import transaction

from .models import (
    Employee, Role, MenuItem, BanquetBooking, BookingStatus,
    MenuConfirmation, MenuConfirmationItem, AuditLog
)
from .services import (
    submit_booking, confirm_menu, receive_by_kitchen,
    start_service, complete_booking
)


def create_seed_data(reset=False):
    if reset:
        MenuConfirmationItem.objects.all().delete()
        MenuConfirmation.objects.all().delete()
        AuditLog.objects.all().delete()
        BanquetBooking.objects.all().delete()
        MenuItem.objects.all().delete()
        Employee.objects.all().delete()

    employees = _create_employees()
    menu_items = _create_menu_items()
    normal_bookings = _create_normal_bookings_with_history(employees, menu_items)
    stuck_bookings = _create_stuck_bookings_with_history(employees, menu_items)

    return {
        'message': '种子数据创建成功',
        'employees': len(employees),
        'menu_items': len(menu_items),
        'normal_bookings': len(normal_bookings),
        'stuck_bookings': len(stuck_bookings),
        'total_bookings': len(normal_bookings) + len(stuck_bookings),
        'data': {
            'employees': [{'id': e.id, 'name': e.name, 'role': e.role} for e in employees],
            'menu_item_categories': list(set(m.category for m in menu_items)),
        }
    }


def _create_employees():
    employees = [
        Employee.objects.create(name='张销售', role=Role.SALES, phone='13800138001'),
        Employee.objects.create(name='李销售', role=Role.SALES, phone='13800138002'),
        Employee.objects.create(name='王主管', role=Role.FLOOR_SUPERVISOR, phone='13800138003'),
        Employee.objects.create(name='赵主管', role=Role.FLOOR_SUPERVISOR, phone='13800138004'),
        Employee.objects.create(name='陈统筹', role=Role.KITCHEN_COORDINATOR, phone='13800138005'),
        Employee.objects.create(name='刘统筹', role=Role.KITCHEN_COORDINATOR, phone='13800138006'),
    ]
    return employees


def _create_menu_items():
    categories = {
        '冷菜': [
            ('卤水拼盘', 168),
            ('凉拌海蜇', 88),
            ('酱牛肉', 98),
            ('口水鸡', 68),
            ('蒜泥白肉', 58),
        ],
        '热菜': [
            ('清蒸东星斑', 598),
            ('波士顿龙虾', 398),
            ('红烧鲍鱼', 298),
            ('红焖肘子', 168),
            ('糖醋排骨', 88),
            ('宫保鸡丁', 68),
            ('清蒸鲈鱼', 128),
            ('小炒黄牛肉', 98),
        ],
        '汤羹': [
            ('佛跳墙', 398),
            ('鱼翅羹', 298),
            ('酸辣汤', 38),
            ('西湖牛肉羹', 48),
        ],
        '主食': [
            ('扬州炒饭', 38),
            ('海鲜炒面', 48),
            ('小笼包', 58),
            ('葱油饼', 28),
        ],
        '甜品': [
            ('杨枝甘露', 48),
            ('红豆沙', 28),
            ('水果拼盘', 88),
        ],
    }

    items = []
    for category, dishes in categories.items():
        for name, price in dishes:
            item = MenuItem.objects.create(
                name=name,
                category=category,
                price=price,
                description=f'精选{category}：{name}'
            )
            items.append(item)
    return items


def _create_booking_draft(customer, phone, btype, bdate, venue, guests, tables, budget, sales, seq):
    booking_no = f'BY{bdate.strftime("%Y%m%d")}-{seq:04d}'
    booking = BanquetBooking.objects.create(
        booking_no=booking_no,
        customer_name=customer,
        customer_phone=phone,
        banquet_type=btype,
        banquet_date=bdate,
        start_time=time(18, 0),
        end_time=time(21, 0),
        venue=venue,
        expected_guests=guests,
        table_count=tables,
        budget_per_table=budget,
        sales_person=sales,
        status=BookingStatus.DRAFT,
        remarks=f'{btype}预订，客户要求精心安排'
    )
    return booking


def _build_menu_data(menu_items, table_count, special_reqs=''):
    selected = menu_items[:6]
    return {
        'items': [
            {
                'menu_item_id': item.id,
                'quantity': table_count,
                'unit_price': float(item.price),
                'remarks': f'{table_count}桌 - {item.name}'
            }
            for item in selected
        ],
        'special_requirements': special_reqs,
        'wine_arrangement': '自带红酒，酒店提供醒酒服务',
        'table_layout': f'{table_count}桌圆桌，每桌10人，主桌在舞台前',
        'customer_signed': True,
        'customer_signature': '客户已签字确认',
    }


def _adjust_log_timestamp(booking, hours_ago):
    target_time = timezone.now() - timedelta(hours=hours_ago)
    logs = AuditLog.objects.filter(booking=booking).order_by('timestamp')
    for i, log in enumerate(logs):
        log.timestamp = target_time + timedelta(minutes=i * 5)
        log.save()


def _create_normal_bookings_with_history(employees, menu_items):
    sales = [e for e in employees if e.role == Role.SALES]
    floor_supervisors = [e for e in employees if e.role == Role.FLOOR_SUPERVISOR]
    kitchen_coords = [e for e in employees if e.role == Role.KITCHEN_COORDINATOR]

    today = date.today()
    bookings = []

    booking1 = _create_booking_draft(
        '王先生', '13900139001', '婚宴',
        today + timedelta(days=7), '宴会厅A',
        200, 20, 2888, sales[0], 1
    )
    submit_booking(booking1.id, sales[0].id, '新人父母已到店考察，对场地满意，确认预订')
    menu_data = _build_menu_data(menu_items, 20, '新人对海鲜过敏，所有菜品避免海鲜；婆婆不吃香菜')
    confirm_menu(booking1.id, floor_supervisors[0].id, menu_data, '与新人反复沟通3次，最终确定菜单')
    receive_by_kitchen(booking1.id, kitchen_coords[0].id, '已安排厨师长对接，海鲜提前备货')
    bookings.append(booking1)

    booking2 = _create_booking_draft(
        '李女士', '13900139002', '生日宴',
        today + timedelta(days=3), '宴会厅B',
        60, 6, 1888, sales[0], 2
    )
    submit_booking(booking2.id, sales[0].id, '客户为孩子办10岁生日宴，要求有儿童游乐区')
    menu_data = _build_menu_data(menu_items, 6, '要有儿童套餐，少辣')
    confirm_menu(booking2.id, floor_supervisors[1].id, menu_data, '增加了儿童甜品台，家长很满意')
    bookings.append(booking2)

    booking3 = _create_booking_draft(
        '张总', '13900139003', '商务宴',
        today + timedelta(days=10), 'VIP厅',
        30, 3, 3888, sales[1], 3
    )
    submit_booking(booking3.id, sales[1].id, '公司重要客户接待，要求高私密性')
    bookings.append(booking3)

    booking4 = _create_booking_draft(
        '赵先生', '13900139004', '满月酒',
        today + timedelta(days=14), '宴会厅C',
        100, 10, 1688, sales[1], 4
    )
    bookings.append(booking4)

    return bookings


@transaction.atomic
def _create_stuck_bookings_with_history(employees, menu_items):
    sales = [e for e in employees if e.role == Role.SALES]
    floor_supervisors = [e for e in employees if e.role == Role.FLOOR_SUPERVISOR]
    kitchen_coords = [e for e in employees if e.role == Role.KITCHEN_COORDINATOR]

    today = date.today()
    stuck_bookings = []

    booking1 = _create_booking_draft(
        '周先生', '13900139101', '婚宴',
        today + timedelta(days=2), '宴会厅A',
        150, 15, 2688, sales[0], 9001
    )
    booking1 = submit_booking(booking1.id, sales[0].id, '原定上周一确认菜单，厅面主管请假忘记处理')

    booking1.submitted_at = timezone.now() - timedelta(hours=30)
    booking1.remarks = '⚠️ 已超过24小时未确认菜单！厅面主管王主管昨日请假，今日上班请优先处理。婚宴日期临近，客户非常着急，已来电催促3次。'
    booking1.save()
    _adjust_log_timestamp(booking1, 30)
    stuck_bookings.append(booking1)

    booking2 = _create_booking_draft(
        '吴女士', '13900139102', '寿宴',
        today + timedelta(days=1), '宴会厅B',
        80, 8, 1988, sales[1], 9002
    )
    booking2 = submit_booking(booking2.id, sales[1].id, '明天的寿宴，客户要求中午开席，请尽快确认菜单')

    booking2.submitted_at = timezone.now() - timedelta(hours=22)
    booking2.remarks = '⚠️ 即将超时预警！明天中午的寿宴，菜单还没确认。赵主管正在来的路上，请第一时间处理。'
    booking2.save()
    _adjust_log_timestamp(booking2, 22)
    stuck_bookings.append(booking2)

    booking3 = _create_booking_draft(
        '郑总', '13900139103', '商务宴',
        today + timedelta(days=3), 'VIP厅',
        20, 2, 4888, sales[0], 9003
    )
    booking3 = submit_booking(booking3.id, sales[0].id, 'VIP客户，公司年会，预算充足，要求最高标准')

    menu_data = _build_menu_data(menu_items, 2, 'VIP客户，全部分量加大，酒水用最好的')
    booking3, mc = confirm_menu(booking3.id, floor_supervisors[0].id, menu_data, '菜单已与客户秘书确认，客户签字回传')

    booking3.submitted_at = timezone.now() - timedelta(hours=48)
    booking3.remarks = '⚠️ 菜单确认已超过12小时后厨未接收！陈统筹昨日休息，今日请立即安排后厨备货。客户是酒店VIP，绝对不能出问题。'
    booking3.save()

    mc.confirmed_at = timezone.now() - timedelta(hours=15)
    mc.save()

    _adjust_log_timestamp(booking3, 40)

    stuck_bookings.append(booking3)

    return stuck_bookings
