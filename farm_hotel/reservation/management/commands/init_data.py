from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from farm_hotel.reservation.models import (
    Role, Staff, DiningTable, MenuCategory, MenuItem,
    Reservation, ReservationMenu, FlowRecord, Notification
)

class Command(BaseCommand):
    help = 'Initialize sample data for farm hotel reservation system'

    def handle(self, *args, **options):
        self.stdout.write('Initializing roles...')
        self.create_roles()
        
        self.stdout.write('Initializing staff...')
        self.create_staff()
        
        self.stdout.write('Initializing dining tables...')
        self.create_tables()
        
        self.stdout.write('Initializing menu categories...')
        self.create_menu_categories()
        
        self.stdout.write('Initializing menu items...')
        self.create_menu_items()
        
        self.stdout.write('Initializing sample reservations...')
        self.create_sample_reservations()
        
        self.stdout.write('Initializing sample notifications...')
        self.create_sample_notifications()
        
        self.stdout.write(self.style.SUCCESS('Data initialization completed successfully!'))

    def create_roles(self):
        roles = ['boss', 'chef', 'housekeeper', 'waiter']
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)

    def create_staff(self):
        boss_role = Role.objects.get(name='boss')
        chef_role = Role.objects.get(name='chef')
        housekeeper_role = Role.objects.get(name='housekeeper')
        waiter_role = Role.objects.get(name='waiter')
        
        Staff.objects.get_or_create(
            username='boss',
            defaults={
                'name': '王老板',
                'role': boss_role,
                'phone': '13800138001'
            }
        )
        Staff.objects.get_or_create(
            username='chef1',
            defaults={
                'name': '李大厨',
                'role': chef_role,
                'phone': '13800138002'
            }
        )
        Staff.objects.get_or_create(
            username='chef2',
            defaults={
                'name': '张二厨',
                'role': chef_role,
                'phone': '13800138003'
            }
        )
        Staff.objects.get_or_create(
            username='housekeeper1',
            defaults={
                'name': '刘阿姨',
                'role': housekeeper_role,
                'phone': '13800138004'
            }
        )
        Staff.objects.get_or_create(
            username='waiter1',
            defaults={
                'name': '小陈',
                'role': waiter_role,
                'phone': '13800138005'
            }
        )
        Staff.objects.get_or_create(
            username='waiter2',
            defaults={
                'name': '小周',
                'role': waiter_role,
                'phone': '13800138006'
            }
        )
        
        boss = Staff.objects.get(username='boss')
        boss.set_password('123456')
        boss.save()
        
        chef1 = Staff.objects.get(username='chef1')
        chef1.set_password('123456')
        chef1.save()
        
        waiter1 = Staff.objects.get(username='waiter1')
        waiter1.set_password('123456')
        waiter1.save()

    def create_tables(self):
        for i in range(1, 6):
            DiningTable.objects.get_or_create(
                table_number=f'B{i}',
                defaults={
                    'capacity': 8,
                    'table_type': 'private',
                    'status': True
                }
            )
        
        for i in range(1, 11):
            DiningTable.objects.get_or_create(
                table_number=f'H{i}',
                defaults={
                    'capacity': 4,
                    'table_type': 'hall',
                    'status': True
                }
            )
        
        for i in range(1, 5):
            DiningTable.objects.get_or_create(
                table_number=f'O{i}',
                defaults={
                    'capacity': 6,
                    'table_type': 'outdoor',
                    'status': True
                }
            )

    def create_menu_categories(self):
        categories = ['凉菜', '热菜', '汤品', '主食', '饮料']
        for order, name in enumerate(categories):
            MenuCategory.objects.get_or_create(
                name=name,
                defaults={'order': order}
            )

    def create_menu_items(self):
        cold_category = MenuCategory.objects.get(name='凉菜')
        hot_category = MenuCategory.objects.get(name='热菜')
        soup_category = MenuCategory.objects.get(name='汤品')
        staple_category = MenuCategory.objects.get(name='主食')
        drink_category = MenuCategory.objects.get(name='饮料')
        
        cold_items = [
            ('凉拌黄瓜', 18, '清爽可口'),
            ('拍黄瓜', 16, '简单美味'),
            ('凉拌木耳', 22, '营养健康'),
            ('夫妻肺片', 38, '经典川菜'),
            ('凉拌鸡丝', 32, '嫩滑爽口'),
        ]
        
        hot_items = [
            ('红烧肉', 68, '肥而不腻'),
            ('糖醋排骨', 58, '酸甜可口'),
            ('宫保鸡丁', 48, '经典川菜'),
            ('鱼香肉丝', 42, '下饭神器'),
            ('麻婆豆腐', 28, '麻辣鲜香'),
            ('清蒸鱼', 88, '鲜嫩爽滑'),
            ('蒜蓉西兰花', 28, '健康蔬菜'),
            ('回锅肉', 45, '川味经典'),
        ]
        
        soup_items = [
            ('酸辣汤', 28, '开胃解腻'),
            ('西红柿蛋汤', 22, '家常味道'),
            ('排骨汤', 58, '营养丰富'),
            ('老鸭汤', 68, '滋补养生'),
        ]
        
        staple_items = [
            ('米饭', 3, '粒粒饱满'),
            ('馒头', 2, '松软可口'),
            ('面条', 15, '手工制作'),
            ('炒饭', 22, '香气四溢'),
        ]
        
        drink_items = [
            ('可乐', 8, '冰爽解渴'),
            ('雪碧', 8, '清爽柠檬味'),
            ('王老吉', 10, '降火凉茶'),
            ('鲜榨橙汁', 28, '新鲜现榨'),
            ('酸梅汤', 15, '酸甜开胃'),
        ]
        
        for name, price, desc in cold_items:
            MenuItem.objects.get_or_create(
                name=name,
                defaults={
                    'category': cold_category,
                    'price': price,
                    'description': desc,
                    'available': True
                }
            )
        
        for name, price, desc in hot_items:
            MenuItem.objects.get_or_create(
                name=name,
                defaults={
                    'category': hot_category,
                    'price': price,
                    'description': desc,
                    'available': True
                }
            )
        
        for name, price, desc in soup_items:
            MenuItem.objects.get_or_create(
                name=name,
                defaults={
                    'category': soup_category,
                    'price': price,
                    'description': desc,
                    'available': True
                }
            )
        
        for name, price, desc in staple_items:
            MenuItem.objects.get_or_create(
                name=name,
                defaults={
                    'category': staple_category,
                    'price': price,
                    'description': desc,
                    'available': True
                }
            )
        
        for name, price, desc in drink_items:
            MenuItem.objects.get_or_create(
                name=name,
                defaults={
                    'category': drink_category,
                    'price': price,
                    'description': desc,
                    'available': True
                }
            )

    def create_sample_reservations(self):
        boss = Staff.objects.get(username='boss')
        waiter1 = Staff.objects.get(username='waiter1')
        table_b1 = DiningTable.objects.get(table_number='B1')
        table_b2 = DiningTable.objects.get(table_number='B2')
        table_h1 = DiningTable.objects.get(table_number='H1')
        today = date.today()
        tomorrow = today + timedelta(days=1)
        day_after = today + timedelta(days=2)
        
        reservation1 = Reservation.objects.create(
            customer_name='张三',
            customer_phone='13900139001',
            table=table_b1,
            date=tomorrow,
            time_slot='12:00',
            guest_count=8,
            status='pending',
            created_by=waiter1
        )
        
        FlowRecord.objects.create(
            reservation=reservation1,
            action='create',
            operator=waiter1,
            remark='创建预订'
        )
        
        reservation2 = Reservation.objects.create(
            customer_name='李四',
            customer_phone='13900139002',
            table=table_b2,
            date=today,
            time_slot='18:00',
            guest_count=6,
            status='confirmed',
            created_by=waiter1
        )
        
        FlowRecord.objects.create(
            reservation=reservation2,
            action='create',
            operator=waiter1,
            remark='创建预订'
        )
        FlowRecord.objects.create(
            reservation=reservation2,
            action='confirm',
            operator=boss,
            remark='老板确认预订'
        )
        
        mapo_tofu = MenuItem.objects.get(name='麻婆豆腐')
        hongshaorou = MenuItem.objects.get(name='红烧肉')
        tangcupaigu = MenuItem.objects.get(name='糖醋排骨')
        
        ReservationMenu.objects.create(
            reservation=reservation2,
            menu_item=mapo_tofu,
            quantity=2,
            special_request='少辣'
        )
        ReservationMenu.objects.create(
            reservation=reservation2,
            menu_item=hongshaorou,
            quantity=1
        )
        
        FlowRecord.objects.create(
            reservation=reservation2,
            action='submit_menu',
            operator=waiter1,
            remark='服务员提交菜单'
        )
        
        reservation3 = Reservation.objects.create(
            customer_name='王五',
            customer_phone='13900139003',
            table=table_h1,
            date=day_after,
            time_slot='12:00',
            guest_count=4,
            status='confirmed',
            created_by=waiter1
        )
        
        FlowRecord.objects.create(
            reservation=reservation3,
            action='create',
            operator=waiter1,
            remark='创建预订'
        )
        FlowRecord.objects.create(
            reservation=reservation3,
            action='confirm',
            operator=boss,
            remark='老板确认预订'
        )
        
        qingzhengyu = MenuItem.objects.get(name='清蒸鱼')
        suanlanxihua = MenuItem.objects.get(name='蒜蓉西兰花')
        
        ReservationMenu.objects.create(
            reservation=reservation3,
            menu_item=qingzhengyu,
            quantity=1
        )
        ReservationMenu.objects.create(
            reservation=reservation3,
            menu_item=suanlanxihua,
            quantity=2
        )
        
        FlowRecord.objects.create(
            reservation=reservation3,
            action='submit_menu',
            operator=waiter1,
            remark='服务员提交菜单'
        )
        FlowRecord.objects.create(
            reservation=reservation3,
            action='reject_menu',
            operator=Staff.objects.get(username='chef1'),
            remark='清蒸鱼没有新鲜食材，建议更换'
        )
        
        reservation4 = Reservation.objects.create(
            customer_name='赵六',
            customer_phone='13900139004',
            table=table_b1,
            date=today,
            time_slot='12:00',
            guest_count=10,
            status='menu_confirmed',
            created_by=waiter1
        )
        
        FlowRecord.objects.create(
            reservation=reservation4,
            action='create',
            operator=waiter1,
            remark='创建预订'
        )
        FlowRecord.objects.create(
            reservation=reservation4,
            action='confirm',
            operator=boss,
            remark='老板确认预订'
        )
        FlowRecord.objects.create(
            reservation=reservation4,
            action='submit_menu',
            operator=waiter1,
            remark='服务员提交菜单'
        )
        FlowRecord.objects.create(
            reservation=reservation4,
            action='approve_menu',
            operator=Staff.objects.get(username='chef1'),
            remark='厨师确认菜单'
        )
        
        ReservationMenu.objects.create(
            reservation=reservation4,
            menu_item=hongshaorou,
            quantity=2
        )
        if MenuItem.objects.filter(name='宫保鸡丁').exists():
            gongbaojiding = MenuItem.objects.get(name='宫保鸡丁')
            ReservationMenu.objects.create(
                reservation=reservation4,
                menu_item=gongbaojiding,
                quantity=2
            )

    def create_sample_notifications(self):
        chef1 = Staff.objects.get(username='chef1')
        waiter1 = Staff.objects.get(username='waiter1')
        boss = Staff.objects.get(username='boss')
        
        pending_reservation = Reservation.objects.filter(status='pending').first()
        confirmed_with_menu = Reservation.objects.filter(
            status='confirmed',
            menus__isnull=False
        ).exclude(flow_records__action='approve_menu').first()
        rejected_menu_reservation = Reservation.objects.filter(
            flow_records__action='reject_menu'
        ).first()
        
        if pending_reservation:
            Notification.objects.get_or_create(
                staff=boss,
                reservation=pending_reservation,
                type='pending_reservation',
                defaults={
                    'message': f"待确认预订: {pending_reservation.customer_name} {pending_reservation.date} {pending_reservation.time_slot}",
                    'is_read': False
                }
            )
        
        if confirmed_with_menu:
            Notification.objects.get_or_create(
                staff=chef1,
                reservation=confirmed_with_menu,
                type='pending_menu',
                defaults={
                    'message': f"新菜单待处理: {confirmed_with_menu.customer_name} {confirmed_with_menu.date} {confirmed_with_menu.time_slot}",
                    'is_read': False
                }
            )
        
        if rejected_menu_reservation:
            Notification.objects.get_or_create(
                staff=waiter1,
                reservation=rejected_menu_reservation,
                type='rejected_menu',
                defaults={
                    'message': f"菜单被驳回: {rejected_menu_reservation.customer_name} - 请联系客户更换菜品",
                    'is_read': False
                }
            )
