from django.utils import timezone
from datetime import timedelta, date, time
from .models import (
    Employee, Role, MenuItem, BanquetBooking, BookingStatus,
    MenuConfirmation, MenuConfirmationItem
)
from .services import submit_booking, confirm_menu, receive_by_kitchen


def create_seed_data(reset=False):
    if reset:
        MenuConfirmationItem.objects.all().delete()
        MenuConfirmation.objects.all().delete()
        BanquetBooking.objects.all().delete()
        MenuItem.objects.all().delete()
        Employee.objects.all().delete()

    employees = _create_employees()
    menu_items = _create_menu_items()
    bookings = _create_bookings(employees)
    stuck_bookings = _create_stuck_bookings(employees, menu_items)

    return {
        'message': '种子数据创建成功',
        'employees': len(employees),
        'menu_items': len(menu_items),
        'bookings': len(bookings),
        'stuck_bookings': len(stuck_bookings),
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


def _create_bookings(employees):
    sales = [e for e in employees if e.role == Role.SALES]
    floor_supervisors = [e for e in employees if e.role == Role.FLOOR_SUPERVISOR]
    kitchen_coords = [e for e in employees if e.role == Role.KITCHEN_COORDINATOR]

    today = date.today()
    bookings_data = [
        {
            'customer': '王先生',
            'phone': '13900139001',
            'type': '婚宴',
            'date': today + timedelta(days=7),
            'venue': '宴会厅A',
            'guests': 200,
            'tables': 20,
            'budget': 2888,
            'sales': sales[0],
        },
        {
            'customer': '李女士',
            'phone': '13900139002',
            'type': '生日宴',
            'date': today + timedelta(days=3),
            'venue': '宴会厅B',
            'guests': 60,
            'tables': 6,
            'budget': 1888,
            'sales': sales[0],
        },
        {
            'customer': '张总',
            'phone': '13900139003',
            'type': '商务宴',
            'date': today + timedelta(days=10),
            'venue': 'VIP厅',
            'guests': 30,
            'tables': 3,
            'budget': 3888,
            'sales': sales[1],
        },
        {
            'customer': '赵先生',
            'phone': '13900139004',
            'type': '满月酒',
            'date': today + timedelta(days=14),
            'venue': '宴会厅C',
            'guests': 100,
            'tables': 10,
            'budget': 1688,
            'sales': sales[1],
        },
    ]

    bookings = []
    for i, data in enumerate(bookings_data):
        seq = i + 1
        booking_no = f'BY{today.strftime("%Y%m%d")}-{seq:04d}'
        booking = BanquetBooking.objects.create(
            booking_no=booking_no,
            customer_name=data['customer'],
            customer_phone=data['phone'],
            banquet_type=data['type'],
            banquet_date=data['date'],
            start_time=time(18, 0),
            end_time=time(21, 0),
            venue=data['venue'],
            expected_guests=data['guests'],
            table_count=data['tables'],
            budget_per_table=data['budget'],
            sales_person=data['sales'],
            status=BookingStatus.DRAFT,
            remarks=f'{data["type"]}预订，客户要求精心安排'
        )
        bookings.append(booking)

    return bookings


def _create_stuck_bookings(employees, menu_items):
    sales = [e for e in employees if e.role == Role.SALES]
    floor_supervisors = [e for e in employees if e.role == Role.FLOOR_SUPERVISOR]

    today = date.today()
    stuck_bookings = []

    booking1 = BanquetBooking.objects.create(
        booking_no=f'BY{today.strftime("%Y%m%d")}-9001',
        customer_name='周先生',
        customer_phone='13900139101',
        banquet_type='婚宴',
        banquet_date=today + timedelta(days=2),
        start_time=time(18, 0),
        end_time=time(21, 0),
        venue='宴会厅A',
        expected_guests=150,
        table_count=15,
        budget_per_table=2688,
        sales_person=sales[0],
        status=BookingStatus.SUBMITTED,
        submitted_at=timezone.now() - timedelta(hours=30),
        remarks='提交已超过24小时未确认菜单，已卡住',
    )
    stuck_bookings.append(booking1)

    booking2 = BanquetBooking.objects.create(
        booking_no=f'BY{today.strftime("%Y%m%d")}-9002',
        customer_name='吴女士',
        customer_phone='13900139102',
        banquet_type='寿宴',
        banquet_date=today + timedelta(days=1),
        start_time=time(12, 0),
        end_time=time(14, 0),
        venue='宴会厅B',
        expected_guests=80,
        table_count=8,
        budget_per_table=1988,
        sales_person=sales[1],
        status=BookingStatus.SUBMITTED,
        submitted_at=timezone.now() - timedelta(hours=22),
        remarks='即将超时，预警状态',
    )
    stuck_bookings.append(booking2)

    booking3 = BanquetBooking.objects.create(
        booking_no=f'BY{today.strftime("%Y%m%d")}-9003',
        customer_name='郑总',
        customer_phone='13900139103',
        banquet_type='商务宴',
        banquet_date=today + timedelta(days=3),
        start_time=time(19, 0),
        end_time=time(22, 0),
        venue='VIP厅',
        expected_guests=20,
        table_count=2,
        budget_per_table=4888,
        sales_person=sales[0],
        status=BookingStatus.MENU_CONFIRMED,
        submitted_at=timezone.now() - timedelta(hours=48),
        floor_supervisor=floor_supervisors[0],
        remarks='菜单确认已超过12小时，后厨未接收',
    )

    mc = MenuConfirmation.objects.create(
        booking=booking3,
        confirmed_by=floor_supervisors[0],
        confirmed_at=timezone.now() - timedelta(hours=15),
        total_amount=9776,
        special_requirements='VIP客户，要求最高标准',
        wine_arrangement='茅台飞天、拉菲',
        table_layout='2桌圆桌，每桌10人',
        customer_signed=True,
    )

    selected_items = menu_items[:8]
    for idx, item in enumerate(selected_items):
        MenuConfirmationItem.objects.create(
            menu_confirmation=mc,
            menu_item=item,
            quantity=2,
            unit_price=item.price,
            subtotal=item.price * 2,
            remarks=f'第{idx+1}道菜'
        )
    stuck_bookings.append(booking3)

    return stuck_bookings
