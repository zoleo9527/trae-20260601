from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rental.models import Equipment, RentalOrder, RentalExtension, FeeSettlement, AuditLog, DamageReport
from rental.services import ExtensionService, SettlementService, DamageService

User = get_user_model()


class ExtensionSettlementAuditTests(TestCase):
    def setUp(self):
        self.clerk = User.objects.create_user(username='clerk_test', password='test')
        self.manager = User.objects.create_user(username='manager_test', password='test')
        self.finance = User.objects.create_user(username='finance_test', password='test')

        self.equipment = Equipment.objects.create(
            name='Test Camera',
            category='camera',
            serial_number='SN-TEST-001',
            status='available',
            daily_rate=Decimal('200.00'),
            replacement_value=Decimal('20000'),
        )

        self.today = timezone.now().date()
        self.order = RentalOrder.objects.create(
            order_no='TEST-2026-001',
            customer_name='Test User',
            customer_phone='13800000000',
            equipment=self.equipment,
            store_clerk=self.clerk,
            start_date=self.today - timedelta(days=5),
            original_end_date=self.today + timedelta(days=2),
            current_end_date=self.today + timedelta(days=2),
            deposit_amount=Decimal('1000'),
            status='active',
        )

    def test_base_fee_only_covers_original_period(self):
        settlement = SettlementService.create_settlement(self.order.id, operator=self.finance)
        expected_base_days = (self.order.original_end_date - self.order.start_date).days
        expected_base_fee = Decimal(str(expected_base_days)) * self.equipment.daily_rate
        self.assertEqual(float(settlement.base_fee), float(expected_base_fee))
        self.assertEqual(float(settlement.extension_fee), 0)

    def test_extension_approval_triggers_recalc_with_correct_operator(self):
        settlement = SettlementService.create_settlement(self.order.id, operator=self.finance)
        initial_ext_fee = settlement.extension_fee
        initial_total = settlement.total_fee

        ext = ExtensionService.request_extension(
            rental_order_id=self.order.id,
            requested_end_date=self.today + timedelta(days=5),
            reason='Test extension',
            requested_by=self.clerk,
            operator_role='clerk',
        )
        approved_ext = ExtensionService.approve_extension(
            extension_id=ext.id,
            reviewed_by=self.manager,
            operator_role='manager',
            review_note='Approved',
        )

        settlement.refresh_from_db()
        self.order.refresh_from_db()

        self.assertGreater(float(settlement.extension_fee), float(initial_ext_fee))
        self.assertGreater(float(settlement.total_fee), float(initial_total))

        recalc_log = AuditLog.objects.filter(
            entity_type='settlement',
            entity_id=settlement.id,
            action='settlement_recalculated',
        ).latest('created_at')

        self.assertEqual(recalc_log.operator_id, self.manager.id)
        self.assertEqual(recalc_log.operator_role, 'manager')
        self.assertIn('租期延长审批通过', recalc_log.detail)
        self.assertIn('total(', recalc_log.detail)
        self.assertIn('ext(', recalc_log.detail)

    def test_extension_fee_only_contains_approved_extensions(self):
        SettlementService.create_settlement(self.order.id, operator=self.finance)

        ext1 = ExtensionService.request_extension(
            rental_order_id=self.order.id,
            requested_end_date=self.today + timedelta(days=3),
            reason='Ext 1',
            requested_by=self.clerk,
            operator_role='clerk',
        )
        ExtensionService.approve_extension(
            extension_id=ext1.id,
            reviewed_by=self.manager,
            operator_role='manager',
        )

        ext2 = ExtensionService.request_extension(
            rental_order_id=self.order.id,
            requested_end_date=self.today + timedelta(days=6),
            reason='Ext 2',
            requested_by=self.clerk,
            operator_role='clerk',
        )

        settlement = self.order.fee_settlement
        expected_ext_fee = ext1.fee_delta
        self.assertEqual(float(settlement.extension_fee), float(expected_ext_fee))

        pending_ext = self.order.extensions.filter(status='pending').first()
        self.assertIsNotNone(pending_ext)
        self.assertEqual(pending_ext.id, ext2.id)

    def test_base_fee_not_affected_by_extension(self):
        settlement = SettlementService.create_settlement(self.order.id, operator=self.finance)
        base_before = settlement.base_fee

        ext = ExtensionService.request_extension(
            rental_order_id=self.order.id,
            requested_end_date=self.today + timedelta(days=5),
            reason='Test',
            requested_by=self.clerk,
        )
        ExtensionService.approve_extension(ext.id, reviewed_by=self.manager)

        settlement.refresh_from_db()
        self.assertEqual(float(settlement.base_fee), float(base_before))


class DamageSettlementAuditTests(TestCase):
    def setUp(self):
        self.clerk = User.objects.create_user(username='clerk_dmg', password='test')
        self.manager = User.objects.create_user(username='manager_dmg', password='test')
        self.finance = User.objects.create_user(username='finance_dmg', password='test')

        self.equipment = Equipment.objects.create(
            name='Test Lens',
            category='lens',
            serial_number='SN-TEST-002',
            status='available',
            daily_rate=Decimal('100.00'),
            replacement_value=Decimal('10000'),
        )

        self.today = timezone.now().date()
        self.order = RentalOrder.objects.create(
            order_no='TEST-2026-002',
            customer_name='Damage User',
            customer_phone='13900000000',
            equipment=self.equipment,
            store_clerk=self.clerk,
            start_date=self.today - timedelta(days=3),
            original_end_date=self.today + timedelta(days=1),
            current_end_date=self.today + timedelta(days=1),
            deposit_amount=Decimal('500'),
            status='active',
        )
        SettlementService.create_settlement(self.order.id, operator=self.finance)

    def test_damage_report_triggers_recalc_with_clerk(self):
        dmg = DamageService.report_damage(
            rental_order_id=self.order.id,
            equipment_id=self.equipment.id,
            description='Scratched lens',
            estimated_cost=Decimal('500'),
            reported_by=self.clerk,
            operator_role='clerk',
        )

        recalc_log = AuditLog.objects.filter(
            entity_type='settlement',
            action='settlement_recalculated',
        ).latest('created_at')

        self.assertEqual(recalc_log.operator_id, self.clerk.id)
        self.assertEqual(recalc_log.operator_role, 'clerk')
        self.assertIn('损坏上报', recalc_log.detail)

        settlement = self.order.fee_settlement
        self.assertEqual(float(settlement.damage_fee), 500)

    def test_damage_assess_triggers_recalc_with_manager(self):
        dmg = DamageService.report_damage(
            rental_order_id=self.order.id,
            equipment_id=self.equipment.id,
            description='Scratched',
            estimated_cost=Decimal('500'),
            reported_by=self.clerk,
        )

        old_total = self.order.fee_settlement.total_fee

        DamageService.assess_damage(
            damage_id=dmg.id,
            actual_cost=Decimal('350'),
            operator=self.manager,
            operator_role='manager',
        )

        recalc_log = AuditLog.objects.filter(
            entity_type='settlement',
            action='settlement_recalculated',
        ).latest('created_at')

        self.assertEqual(recalc_log.operator_id, self.manager.id)
        self.assertEqual(recalc_log.operator_role, 'manager')
        self.assertIn('损坏定损', recalc_log.detail)

        self.order.fee_settlement.refresh_from_db()
        new_total = self.order.fee_settlement.total_fee
        self.assertNotEqual(float(old_total), float(new_total))


class AuditTrailConsistencyTests(TestCase):
    def setUp(self):
        self.clerk = User.objects.create_user(username='clerk_trail', password='test')
        self.manager = User.objects.create_user(username='manager_trail', password='test')
        self.finance = User.objects.create_user(username='finance_trail', password='test')

        self.equipment = Equipment.objects.create(
            name='Audit Test Cam',
            category='camera',
            serial_number='SN-AUDIT-001',
            status='available',
            daily_rate=Decimal('300.00'),
            replacement_value=Decimal('30000'),
        )

        self.today = timezone.now().date()
        self.order = RentalOrder.objects.create(
            order_no='AUDIT-2026-001',
            customer_name='Audit User',
            customer_phone='13700000000',
            equipment=self.equipment,
            store_clerk=self.clerk,
            start_date=self.today - timedelta(days=10),
            original_end_date=self.today - timedelta(days=3),
            current_end_date=self.today - timedelta(days=3),
            deposit_amount=Decimal('1500'),
            status='active',
        )

    def test_audit_trail_contains_all_actions(self):
        SettlementService.create_settlement(self.order.id, operator=self.finance)

        ext = ExtensionService.request_extension(
            rental_order_id=self.order.id,
            requested_end_date=self.today,
            reason='Need more time',
            requested_by=self.clerk,
            operator_role='clerk',
        )
        ExtensionService.approve_extension(
            ext.id,
            reviewed_by=self.manager,
            operator_role='manager',
        )

        DamageService.report_damage(
            rental_order_id=self.order.id,
            equipment_id=self.equipment.id,
            description='Small scratch',
            estimated_cost=Decimal('200'),
            reported_by=self.clerk,
            operator_role='clerk',
        )

        self.order.status = 'returned'
        self.order.save()

        settlement = self.order.fee_settlement
        SettlementService.mark_as_paid(settlement.id, operator=self.finance)

        trail_logs = AuditLog.objects.filter(
            related_entity_type='rental_order',
            related_entity_id=self.order.id,
        ).order_by('created_at')

        actions = [l.action for l in trail_logs]
        self.assertIn('settlement_created', actions)
        self.assertIn('extension_requested', actions)
        self.assertIn('extension_approved', actions)
        self.assertIn('settlement_recalculated', actions)
        self.assertIn('damage_reported', actions)
        self.assertIn('settlement_paid', actions)
