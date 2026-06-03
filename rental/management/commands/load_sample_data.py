from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from rental.models import Equipment, RentalOrder, RentalExtension, DamageReport, FeeSettlement
from rental.services import ExtensionService, SettlementService, DamageService

User = get_user_model()


class Command(BaseCommand):
    help = '生成非满状态样例数据（含待处理、风险项、近期变更）'

    def handle(self, *args, **options):
        self.stdout.write('清除旧数据...')
        FeeSettlement.objects.all().delete()
        DamageReport.objects.all().delete()
        RentalExtension.objects.all().delete()
        RentalOrder.objects.all().delete()
        Equipment.objects.all().delete()
        from rental.models import AuditLog
        AuditLog.objects.all().delete()

        clerk, _ = User.objects.get_or_create(
            username='clerk_zhang',
            defaults={'first_name': '张', 'last_name': '店员'},
        )
        manager, _ = User.objects.get_or_create(
            username='manager_li',
            defaults={'first_name': '李', 'last_name': '管理员'},
        )
        finance, _ = User.objects.get_or_create(
            username='finance_wang',
            defaults={'first_name': '王', 'last_name': '财务'},
        )

        today = timezone.now().date()

        self.stdout.write('创建器材...')
        equipments = {}
        equip_data = [
            ('Sony A7M4', 'camera', 'SN-A7M4-001', 'available', Decimal('300')),
            ('Canon R5', 'camera', 'SN-R5-002', 'rented', Decimal('350')),
            ('Sony 24-70 GM2', 'lens', 'SN-GM2470-003', 'rented', Decimal('150')),
            ('Canon 70-200 f2.8', 'lens', 'SN-C70200-004', 'rented', Decimal('180')),
            ('Godox AD600', 'light', 'SN-AD600-005', 'available', Decimal('200')),
            ('DJI Mavic 3', 'drone', 'SN-DJIM3-006', 'rented', Decimal('500')),
            ('Sony 85 f1.4 GM', 'lens', 'SN-GM85-007', 'maintenance', Decimal('120')),
            ('Godox V1', 'light', 'SN-GV1-008', 'rented', Decimal('80')),
        ]
        for name, cat, sn, status, rate in equip_data:
            e, _ = Equipment.objects.get_or_create(
                serial_number=sn,
                defaults={
                    'name': name, 'category': cat,
                    'status': status, 'daily_rate': rate,
                    'replacement_value': rate * Decimal('100'),
                },
            )
            equipments[sn] = e

        self.stdout.write('创建租赁单...')
        orders = {}

        o1, _ = RentalOrder.objects.get_or_create(
            order_no='RN-2026-0001',
            defaults={
                'customer_name': '陈摄影', 'customer_phone': '13800001111',
                'equipment': equipments['SN-R5-002'], 'store_clerk': clerk,
                'start_date': today - timedelta(days=5),
                'original_end_date': today + timedelta(days=2),
                'current_end_date': today + timedelta(days=2),
                'deposit_amount': Decimal('2000'),
                'status': 'active',
            },
        )
        orders['RN-2026-0001'] = o1

        o2, _ = RentalOrder.objects.get_or_create(
            order_no='RN-2026-0002',
            defaults={
                'customer_name': '刘工作室', 'customer_phone': '13900002222',
                'equipment': equipments['SN-GM2470-003'], 'store_clerk': clerk,
                'start_date': today - timedelta(days=10),
                'original_end_date': today - timedelta(days=2),
                'current_end_date': today - timedelta(days=2),
                'deposit_amount': Decimal('1000'),
                'status': 'active',
            },
        )
        orders['RN-2026-0002'] = o2

        o3, _ = RentalOrder.objects.get_or_create(
            order_no='RN-2026-0003',
            defaults={
                'customer_name': '赵航拍', 'customer_phone': '13700003333',
                'equipment': equipments['SN-DJIM3-006'], 'store_clerk': clerk,
                'start_date': today - timedelta(days=3),
                'original_end_date': today + timedelta(days=4),
                'current_end_date': today + timedelta(days=4),
                'deposit_amount': Decimal('5000'),
                'status': 'active',
            },
        )
        orders['RN-2026-0003'] = o3

        o4, _ = RentalOrder.objects.get_or_create(
            order_no='RN-2026-0004',
            defaults={
                'customer_name': '孙婚礼', 'customer_phone': '13600004444',
                'equipment': equipments['SN-C70200-004'], 'store_clerk': clerk,
                'start_date': today - timedelta(days=7),
                'original_end_date': today - timedelta(days=1),
                'current_end_date': today - timedelta(days=1),
                'deposit_amount': Decimal('1500'),
                'status': 'active',
            },
        )
        orders['RN-2026-0004'] = o4

        o5, _ = RentalOrder.objects.get_or_create(
            order_no='RN-2026-0005',
            defaults={
                'customer_name': '周影棚', 'customer_phone': '13500005555',
                'equipment': equipments['SN-GV1-008'], 'store_clerk': clerk,
                'start_date': today - timedelta(days=15),
                'original_end_date': today - timedelta(days=8),
                'current_end_date': today - timedelta(days=8),
                'deposit_amount': Decimal('500'),
                'status': 'active',
            },
        )
        orders['RN-2026-0005'] = o5

        self.stdout.write('创建租期延长记录...')

        ext_pending = ExtensionService.request_extension(
            rental_order_id=o1.id,
            requested_end_date=today + timedelta(days=5),
            reason='客户外拍行程推迟，需要多拍2天',
            requested_by=clerk,
            operator_role='clerk',
        )

        ext_approved = ExtensionService.request_extension(
            rental_order_id=o4.id,
            requested_end_date=today + timedelta(days=2),
            reason='婚礼后期需要补拍，延长归还',
            requested_by=clerk,
            operator_role='clerk',
        )
        ExtensionService.approve_extension(
            extension_id=ext_approved.id,
            reviewed_by=manager,
            operator_role='manager',
            review_note='已确认客户需求，同意延期',
        )

        ext_rejected = ExtensionService.request_extension(
            rental_order_id=o3.id,
            requested_end_date=today + timedelta(days=10),
            reason='无人机航拍项目延期',
            requested_by=clerk,
            operator_role='clerk',
        )
        ExtensionService.reject_extension(
            extension_id=ext_rejected.id,
            reviewed_by=manager,
            operator_role='manager',
            review_note='该器材后续有预约，无法延期',
        )

        ext_o5 = ExtensionService.request_extension(
            rental_order_id=o5.id,
            requested_end_date=today - timedelta(days=5),
            reason='影棚续租，需要多使用3天',
            requested_by=clerk,
            operator_role='clerk',
        )
        ExtensionService.approve_extension(
            extension_id=ext_o5.id,
            reviewed_by=manager,
            operator_role='manager',
            review_note='同意续租',
        )
        o5.status = 'returned'
        o5.save(update_fields=['status'])

        self.stdout.write('创建损坏记录...')

        DamageService.report_damage(
            rental_order_id=o4.id,
            equipment_id=equipments['SN-C70200-004'].id,
            description='镜头前组有划痕，影响成像',
            estimated_cost=Decimal('800'),
            reported_by=clerk,
            operator_role='clerk',
        )

        DamageService.report_damage(
            rental_order_id=o5.id,
            equipment_id=equipments['SN-GV1-008'].id,
            description='闪光灯热靴卡扣松动',
            estimated_cost=Decimal('200'),
            reported_by=clerk,
            operator_role='clerk',
        )
        dmg_o5 = DamageReport.objects.filter(
            rental_order=o5, equipment=equipments['SN-GV1-008'],
        ).first()
        DamageService.assess_damage(
            damage_id=dmg_o5.id,
            actual_cost=Decimal('150'),
            operator=manager,
            operator_role='manager',
        )

        self.stdout.write('创建费用结算...')

        s5 = SettlementService.create_settlement(
            order_id=o5.id,
            operator=finance,
            operator_role='finance',
        )
        SettlementService.mark_as_paid(
            settlement_id=s5.id,
            operator=finance,
            operator_role='finance',
            notes='已收到客户支付费用',
        )

        s4 = SettlementService.create_settlement(
            order_id=o4.id,
            operator=finance,
            operator_role='finance',
        )

        self.stdout.write(self.style.SUCCESS(
            f'\n样例数据创建完成！\n'
            f'  器材: {Equipment.objects.count()} 件\n'
            f'  租赁单: {RentalOrder.objects.count()} 单\n'
            f'  延期申请: {RentalExtension.objects.count()} 条（待审核{RentalExtension.objects.filter(status="pending").count()}）\n'
            f'  损坏记录: {DamageReport.objects.count()} 条（待定损{DamageReport.objects.filter(status="reported").count()}）\n'
            f'  费用结算: {FeeSettlement.objects.count()} 条（待结算{FeeSettlement.objects.filter(status="pending").count()}）\n'
            f'  逾期订单: {RentalOrder.objects.filter(status="active", current_end_date__lt=today).count()} 单\n'
            f'\n待处理项:\n'
            f'  - RN-2026-0001(陈摄影): 待审核延期申请(延至{today + timedelta(days=5)})\n'
            f'  - RN-2026-0002(刘工作室): 已逾期{abs((today - o2.current_end_date).days)}天\n'
            f'  - RN-2026-0004(孙婚礼): 已通过延期，有待结算费用；有损坏待定损\n'
            f'  - RN-2026-0005(周影棚): 已归还，延期3天+损坏已定损，已收款\n'
        ))
