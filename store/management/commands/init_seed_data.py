"""
母婴零售店 - 种子数据初始化脚本
包含员工、会员、商品、退换货和客户回访的示例数据
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from store.models import (
    Employee, Member, Product, ProductBatch, ProductCategory,
    ReturnExchange, VisitRecord, AuditLog, Notification
)


class Command(BaseCommand):
    help = '初始化母婴零售店的种子数据'

    def handle(self, *args, **options):
        self.stdout.write('开始创建种子数据...\n')

        self.create_users_and_employees()
        self.create_categories()
        self.create_products()
        self.create_members()
        self.create_return_exchanges()
        self.create_visit_records()
        self.create_audit_logs()

        self.stdout.write(self.style.SUCCESS('种子数据创建完成！'))

    def create_users_and_employees(self):
        """创建员工账号"""
        self.stdout.write('创建员工数据...')

        employees_data = [
            {
                'username': 'zhang_clerk',
                'first_name': '张',
                'last_name': '晓丽',
                'employee_id': 'EMP001',
                'role': 'clerk',
                'phone': '13800138001',
            },
            {
                'username': 'li_clerk',
                'first_name': '李',
                'last_name': '婷婷',
                'employee_id': 'EMP002',
                'role': 'clerk',
                'phone': '13800138002',
            },
            {
                'username': 'wang_manager',
                'first_name': '王',
                'last_name': '经理',
                'employee_id': 'EMP003',
                'role': 'manager',
                'phone': '13800138003',
            },
            {
                'username': 'liu_purchaser',
                'first_name': '刘',
                'last_name': '采购',
                'employee_id': 'EMP004',
                'role': 'purchaser',
                'phone': '13800138004',
            },
        ]

        for emp_data in employees_data:
            user, created = User.objects.get_or_create(
                username=emp_data['username'],
                defaults={
                    'first_name': emp_data['first_name'],
                    'last_name': emp_data['last_name'],
                    'email': f"{emp_data['username']}@store.com",
                }
            )

            if created:
                user.set_password('password123')
                user.save()

            employee, created = Employee.objects.get_or_create(
                employee_id=emp_data['employee_id'],
                defaults={
                    'user': user,
                    'role': emp_data['role'],
                    'phone': emp_data['phone'],
                }
            )

            if created:
                self.stdout.write(f"  ✓ 创建员工: {emp_data['employee_id']} - {emp_data['first_name']}{emp_data['last_name']}")

        self.clerk = Employee.objects.get(employee_id='EMP001')
        self.manager = Employee.objects.get(employee_id='EMP003')
        self.purchaser = Employee.objects.get(employee_id='EMP004')

    def create_categories(self):
        """创建商品分类"""
        self.stdout.write('创建商品分类...')

        categories = [
            {'name': '奶粉', 'description': '婴儿配方奶粉'},
            {'name': '尿裤', 'description': '婴儿纸尿裤'},
            {'name': '辅食', 'description': '婴儿辅食'},
            {'name': '玩具', 'description': '婴儿玩具'},
            {'name': '用品', 'description': '母婴用品'},
        ]

        for cat_data in categories:
            cat, created = ProductCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            if created:
                self.stdout.write(f"  ✓ 创建分类: {cat.name}")

    def create_products(self):
        """创建商品"""
        self.stdout.write('创建商品数据...')

        products_data = [
            {
                'product_code': 'MILK001',
                'name': '爱他美婴儿配方奶粉1段',
                'category': '奶粉',
                'brand': '爱他美',
                'unit': '罐',
                'price': 298.00,
                'cost': 220.00,
                'stock_quantity': 50,
            },
            {
                'product_code': 'MILK002',
                'name': '美赞臣婴儿配方奶粉2段',
                'category': '奶粉',
                'brand': '美赞臣',
                'unit': '罐',
                'price': 328.00,
                'cost': 245.00,
                'stock_quantity': 35,
            },
            {
                'product_code': 'DIAPER001',
                'name': '好奇纸尿裤M号',
                'category': '尿裤',
                'brand': '好奇',
                'unit': '包',
                'price': 159.00,
                'cost': 110.00,
                'stock_quantity': 100,
            },
            {
                'product_code': 'DIAPER002',
                'name': '花王纸尿裤S号',
                'category': '尿裤',
                'brand': '花王',
                'unit': '包',
                'price': 189.00,
                'cost': 135.00,
                'stock_quantity': 80,
            },
            {
                'product_code': 'FOOD001',
                'name': '嘉宝米粉原味',
                'category': '辅食',
                'brand': '嘉宝',
                'unit': '盒',
                'price': 68.00,
                'cost': 48.00,
                'stock_quantity': 60,
            },
            {
                'product_code': 'TOY001',
                'name': '费雪牌婴儿健身架',
                'category': '玩具',
                'brand': '费雪',
                'unit': '个',
                'price': 399.00,
                'cost': 280.00,
                'stock_quantity': 20,
            },
            {
                'product_code': 'SUPPLY001',
                'name': '贝亲宽口径奶瓶',
                'category': '用品',
                'brand': '贝亲',
                'unit': '个',
                'price': 128.00,
                'cost': 85.00,
                'stock_quantity': 45,
            },
        ]

        for prod_data in products_data:
            category = ProductCategory.objects.get(name=prod_data['category'])
            product, created = Product.objects.get_or_create(
                product_code=prod_data['product_code'],
                defaults={
                    'name': prod_data['name'],
                    'category': category,
                    'brand': prod_data['brand'],
                    'unit': prod_data['unit'],
                    'price': prod_data['price'],
                    'cost': prod_data['cost'],
                    'stock_quantity': prod_data['stock_quantity'],
                }
            )

            if created:
                self.stdout.write(f"  ✓ 创建商品: {product.product_code} - {product.name}")

                batch = ProductBatch.objects.create(
                    product=product,
                    batch_number=f"BATCH{product.product_code}{datetime.now().strftime('%Y%m')}",
                    production_date=datetime.now().date() - timedelta(days=30),
                    expiry_date=datetime.now().date() + timedelta(days=365),
                    quantity=prod_data['stock_quantity'],
                    supplier=f"{product.brand}官方供应商",
                    cost=prod_data['cost'],
                )
                self.stdout.write(f"    → 批号: {batch.batch_number}")

    def create_members(self):
        """创建会员"""
        self.stdout.write('创建会员数据...')

        members_data = [
            {
                'member_id': 'MB20240001',
                'name': '陈妈妈',
                'phone': '13912340001',
                'gender': 'F',
                'baby_birthday': datetime.now().date() - timedelta(days=180),
                'member_level': 'gold',
                'total_points': 5000,
            },
            {
                'member_id': 'MB20240002',
                'name': '林爸爸',
                'phone': '13912340002',
                'gender': 'M',
                'baby_birthday': datetime.now().date() - timedelta(days=365),
                'member_level': 'silver',
                'total_points': 2800,
            },
            {
                'member_id': 'MB20240003',
                'name': '王妈妈',
                'phone': '13912340003',
                'gender': 'F',
                'baby_birthday': datetime.now().date() - timedelta(days=90),
                'member_level': 'diamond',
                'total_points': 12000,
            },
            {
                'member_id': 'MB20240004',
                'name': '张妈妈',
                'phone': '13912340004',
                'gender': 'F',
                'baby_due_date': datetime.now().date() + timedelta(days=60),
                'member_level': 'bronze',
                'total_points': 800,
            },
            {
                'member_id': 'MB20240005',
                'name': '李妈妈',
                'phone': '13912340005',
                'gender': 'F',
                'baby_birthday': datetime.now().date() - timedelta(days=400),
                'member_level': 'gold',
                'total_points': 6500,
            },
        ]

        for member_data in members_data:
            member, created = Member.objects.get_or_create(
                member_id=member_data['member_id'],
                defaults={
                    'name': member_data['name'],
                    'phone': member_data['phone'],
                    'gender': member_data['gender'],
                    'baby_birthday': member_data.get('baby_birthday'),
                    'baby_due_date': member_data.get('baby_due_date'),
                    'member_level': member_data['member_level'],
                    'total_points': member_data['total_points'],
                    'registered_by': self.clerk,
                }
            )

            if created:
                self.stdout.write(f"  ✓ 创建会员: {member.member_id} - {member.name}")

    def create_return_exchanges(self):
        """创建退换货记录"""
        self.stdout.write('创建退换货数据...')

        milk_product = Product.objects.get(product_code='MILK001')
        diaper_product = Product.objects.get(product_code='DIAPER001')
        milk_batch = ProductBatch.objects.filter(product=milk_product).first()

        member1 = Member.objects.get(member_id='MB20240001')
        member2 = Member.objects.get(member_id='MB20240002')
        member3 = Member.objects.get(member_id='MB20240003')

        returns_data = [
            {
                'return_number': 'RE202406150001',
                'member': member1,
                'type': 'return',
                'status': 'clerk_reviewing',
                'original_product': milk_product,
                'original_batch': milk_batch,
                'quantity': 1,
                'reason_category': 'quality',
                'reason_detail': '奶粉冲调时有结块，颜色与之前购买的不太一样',
                'assigned_to': self.clerk,
                'current_handler_role': 'clerk',
                'stuck_reason': '等待店员确认奶粉质量问题',
                'created_at': timezone.now() - timedelta(days=4),
            },
            {
                'return_number': 'RE202406150002',
                'member': member2,
                'type': 'exchange',
                'status': 'manager_reviewing',
                'original_product': diaper_product,
                'quantity': 2,
                'reason_category': 'wrong_item',
                'reason_detail': '购买的是M号，收到的是S号',
                'assigned_to': self.clerk,
                'current_handler_role': 'manager',
                'stuck_reason': '等待店长审批换货申请',
                'created_at': timezone.now() - timedelta(days=5),
            },
            {
                'return_number': 'RE202406150003',
                'member': member3,
                'type': 'return',
                'status': 'purchaser_handling',
                'original_product': milk_product,
                'original_batch': milk_batch,
                'quantity': 3,
                'reason_category': 'expired',
                'reason_detail': '发现奶粉已过期，要求退款',
                'assigned_to': self.manager,
                'current_handler_role': 'purchaser',
                'stuck_reason': '采购正在与供应商协调退款事宜',
                'created_at': timezone.now() - timedelta(days=6),
            },
            {
                'return_number': 'RE202406160001',
                'member': member1,
                'type': 'return',
                'status': 'completed',
                'original_product': milk_product,
                'original_batch': milk_batch,
                'quantity': 1,
                'reason_category': 'damaged',
                'reason_detail': '罐体变形',
                'assigned_to': self.clerk,
                'current_handler_role': 'clerk',
                'amount_refunded': 298.00,
                'completed_at': timezone.now() - timedelta(days=1),
                'created_at': timezone.now() - timedelta(days=2),
            },
        ]

        for return_data in returns_data:
            ret, created = ReturnExchange.objects.get_or_create(
                return_number=return_data['return_number'],
                defaults=return_data
            )

            if created:
                status_display = ret.get_status_display()
                self.stdout.write(f"  ✓ 创建退换货: {ret.return_number} - {status_display}")

                if ret.status == 'completed':
                    ret.completed_at = return_data.get('completed_at')
                    ret.save()

        self.stdout.write(f"  总计创建 {len(returns_data)} 条退换货记录")

    def create_visit_records(self):
        """创建客户回访记录"""
        self.stdout.write('创建客户回访数据...')

        member1 = Member.objects.get(member_id='MB20240001')
        member2 = Member.objects.get(member_id='MB20240002')
        member3 = Member.objects.get(member_id='MB20240003')
        member5 = Member.objects.get(member_id='MB20240005')

        completed_return = ReturnExchange.objects.get(return_number='RE202406160001')

        visits_data = [
            {
                'visit_number': 'VIS202406150001',
                'member': member1,
                'type': 'phone',
                'purpose': '退换货处理后回访，确认客户满意度',
                'related_return': completed_return,
                'priority': 'high',
                'status': 'pending',
                'assigned_to': self.clerk,
                'scheduled_date': timezone.now().date() - timedelta(days=2),
                'stuck_reason': '店员表示客户电话无人接听，需要改时间联系',
            },
            {
                'visit_number': 'VIS202406150002',
                'member': member2,
                'type': 'phone',
                'purpose': '会员积分即将过期，提醒兑换礼品',
                'priority': 'normal',
                'status': 'pending',
                'assigned_to': self.clerk,
                'scheduled_date': timezone.now().date() - timedelta(days=3),
                'stuck_reason': '客户表示近期没空，需要下周再联系',
            },
            {
                'visit_number': 'VIS202406150003',
                'member': member3,
                'type': 'wechat',
                'purpose': '推荐新款婴儿用品，询问购买意向',
                'priority': 'low',
                'status': 'completed',
                'assigned_to': self.clerk,
                'scheduled_date': timezone.now().date() - timedelta(days=1),
                'completed_date': timezone.now().date() - timedelta(days=1),
                'content': '通过微信发送了新品介绍，客户表示有兴趣',
                'result': '客户表示等宝宝再大一点会考虑购买',
                'satisfaction_score': 5,
            },
            {
                'visit_number': 'VIS202406160001',
                'member': member5,
                'type': 'phone',
                'purpose': '宝宝即将满周岁，推荐周岁庆典活动',
                'priority': 'high',
                'status': 'pending',
                'assigned_to': self.manager,
                'scheduled_date': timezone.now().date(),
                'stuck_reason': '',
            },
        ]

        for visit_data in visits_data:
            visit, created = VisitRecord.objects.get_or_create(
                visit_number=visit_data['visit_number'],
                defaults=visit_data
            )

            if created:
                status_display = visit.get_status_display()
                self.stdout.write(f"  ✓ 创建回访: {visit.visit_number} - {status_display}")

                if visit.status == 'completed':
                    visit.completed_time = timezone.now().time()
                    visit.save()

        self.stdout.write(f"  总计创建 {len(visits_data)} 条客户回访记录")

    def create_audit_logs(self):
        """创建审计日志"""
        self.stdout.write('创建审计日志...')

        clerk = self.clerk
        manager = self.manager

        audit_logs_data = [
            {
                'action': 'create',
                'entity_type': 'return_exchange',
                'entity_id': '1',
                'entity_name': 'RE202406150001',
                'user': clerk,
                'description': '创建退换货单 RE202406150001',
                'new_value': {'status': 'pending', 'type': '退货'},
            },
            {
                'action': 'assignment',
                'entity_type': 'return_exchange',
                'entity_id': '1',
                'entity_name': 'RE202406150001',
                'user': clerk,
                'description': '分配退换货单给店员张晓丽处理',
                'new_value': {'assigned_to': 'EMP001'},
            },
            {
                'action': 'status_change',
                'entity_type': 'return_exchange',
                'entity_id': '1',
                'entity_name': 'RE202406150001',
                'user': clerk,
                'description': '退换货状态变更为店员审核中',
                'old_value': {'status': 'pending'},
                'new_value': {'status': 'clerk_reviewing'},
            },
            {
                'action': 'approval',
                'entity_type': 'return_exchange',
                'entity_id': '3',
                'entity_name': 'RE202406150003',
                'user': manager,
                'description': '店长审批通过，等待采购处理',
                'old_value': {'status': 'manager_reviewing'},
                'new_value': {'status': 'purchaser_handling'},
            },
            {
                'action': 'create',
                'entity_type': 'visit_record',
                'entity_id': '1',
                'entity_name': 'VIS202406150001',
                'user': clerk,
                'description': '创建客户回访记录 VIS202406150001',
                'new_value': {'status': 'pending', 'priority': '高优先级'},
            },
        ]

        for log_data in audit_logs_data:
            log, created = AuditLog.objects.get_or_create(
                entity_type=log_data['entity_type'],
                entity_id=log_data['entity_id'],
                action=log_data['action'],
                defaults=log_data
            )

            if created:
                self.stdout.write(f"  ✓ 创建审计日志: {log.description[:30]}...")

        self.stdout.write(f"  总计创建 {len(audit_logs_data)} 条审计日志")
