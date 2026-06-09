from datetime import timedelta
from uuid import uuid4

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from equipment_booking.models import (
    Patient, Equipment, AppointmentOrder, Assessment, UsageRecord, AlertLog,
    StaffProfile, VALID_TRANSITIONS, STATUS_TIMEOUT_HOURS,
)
from equipment_booking.services import (
    create_order_with_assessment, submit_assessment, assign_equipment,
    confirm_schedule, add_usage_record, finish_usage, review_order,
    mark_exception, return_order, detect_stuck_orders, get_order_trace,
)
from equipment_booking.exceptions import BizError, ErrorCode

User = get_user_model()


def _create_user_with_role(username, role):
    user = User.objects.create_user(username=username, password='pass')
    StaffProfile.objects.create(user=user, role=role)
    return user


class BaseTestCase(TestCase):
    def setUp(self):
        self.therapist = _create_user_with_role('therapist1', 'therapist')
        self.receptionist = _create_user_with_role('receptionist1', 'receptionist')
        self.director = _create_user_with_role('director1', 'director')

        self.patient = Patient.objects.create(
            name='张三', gender='男', age=45, diagnosis='左膝半月板损伤',
        )
        self.equipment = Equipment.objects.create(
            name='膝关节康复训练器', code='EQ-KNEE-001', category='运动康复', status='available',
        )

    def _create_full_order(self) -> AppointmentOrder:
        order = create_order_with_assessment(
            user=self.therapist,
            patient_id=self.patient.id,
            assessment_data={
                'motor_function': '左膝屈曲受限，ROM 90°',
                'pain_level': 5,
                'range_of_motion': '屈曲90°，伸展-5°',
                'treatment_goal': '恢复至屈曲120°',
                'equipment_requirement': '膝关节康复训练器',
            },
        )
        return order

    def _advance_to_pending_assign(self) -> AppointmentOrder:
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)
        return order

    def _advance_to_assigned(self) -> AppointmentOrder:
        order = self._advance_to_pending_assign()
        assign_equipment(
            user=self.receptionist, order_id=order.id, equipment_id=self.equipment.id,
            scheduled_date=timezone.now().date(),
            time_start=timezone.now().time(),
            time_end=(timezone.now() + timedelta(hours=1)).time(),
        )
        return order

    def _advance_to_in_use(self) -> AppointmentOrder:
        order = self._advance_to_assigned()
        confirm_schedule(self.receptionist, order.id)
        return order

    def _advance_to_pending_review(self) -> AppointmentOrder:
        order = self._advance_to_in_use()
        add_usage_record(
            user=self.therapist,
            order_id=order.id,
            record_data={
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(minutes=30),
                'duration_minutes': 30,
                'actual_usage': '完成训练',
                'patient_feedback': '良好',
                'abnormal': False,
                'abnormal_note': '',
            },
        )
        finish_usage(self.therapist, order.id)
        return order


class FullFlowTest(BaseTestCase):
    def test_complete_therapist_to_director_flow(self):
        order = self._create_full_order()
        self.assertEqual(order.status, 'draft')
        self.assertTrue(hasattr(order, 'assessment'))

        order = submit_assessment(self.therapist, order.id)
        self.assertEqual(order.status, 'pending_assign')

        order = assign_equipment(
            user=self.receptionist,
            order_id=order.id,
            equipment_id=self.equipment.id,
            scheduled_date=timezone.now().date(),
            time_start=timezone.now().time(),
            time_end=(timezone.now() + timedelta(hours=1)).time(),
        )
        self.assertEqual(order.status, 'assigned')
        self.assertEqual(order.equipment.code, 'EQ-KNEE-001')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

        order = confirm_schedule(self.receptionist, order.id)
        self.assertEqual(order.status, 'in_use')

        record = add_usage_record(
            user=self.therapist,
            order_id=order.id,
            record_data={
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(minutes=30),
                'duration_minutes': 30,
                'actual_usage': '完成屈曲训练3组',
                'patient_feedback': '疼痛可忍受',
                'abnormal': False,
                'abnormal_note': '',
            },
        )
        self.assertFalse(record.abnormal)

        order = finish_usage(self.therapist, order.id)
        self.assertEqual(order.status, 'pending_review')

        order = review_order(self.director, order.id, action='approve')
        self.assertEqual(order.status, 'completed')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')


class RoleValidationTest(BaseTestCase):
    def test_therapist_cannot_assign_equipment(self):
        order = self._advance_to_pending_assign()
        with self.assertRaises(BizError) as ctx:
            assign_equipment(
                user=self.therapist, order_id=order.id, equipment_id=self.equipment.id,
                scheduled_date=timezone.now().date(),
                time_start=timezone.now().time(),
                time_end=(timezone.now() + timedelta(hours=1)).time(),
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_therapist_cannot_confirm_schedule(self):
        order = self._advance_to_assigned()
        with self.assertRaises(BizError) as ctx:
            confirm_schedule(self.therapist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_receptionist_cannot_add_usage_record(self):
        order = self._advance_to_in_use()
        with self.assertRaises(BizError) as ctx:
            add_usage_record(
                user=self.receptionist,
                order_id=order.id,
                record_data={
                    'start_time': timezone.now(),
                    'end_time': timezone.now() + timedelta(minutes=30),
                    'duration_minutes': 30,
                    'actual_usage': 'test',
                    'abnormal': False,
                    'abnormal_note': '',
                },
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_receptionist_cannot_finish_usage(self):
        order = self._advance_to_in_use()
        add_usage_record(
            user=self.therapist,
            order_id=order.id,
            record_data={
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(minutes=30),
                'duration_minutes': 30,
                'actual_usage': 'test',
                'abnormal': False,
                'abnormal_note': '',
            },
        )
        with self.assertRaises(BizError) as ctx:
            finish_usage(self.receptionist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_receptionist_cannot_review(self):
        order = self._advance_to_pending_review()
        with self.assertRaises(BizError) as ctx:
            review_order(self.receptionist, order.id, action='approve')
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_therapist_cannot_review(self):
        order = self._advance_to_pending_review()
        with self.assertRaises(BizError) as ctx:
            review_order(self.therapist, order.id, action='approve')
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_therapist_cannot_mark_exception(self):
        order = self._create_full_order()
        with self.assertRaises(BizError) as ctx:
            mark_exception(self.therapist, order.id, reason='测试')
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_receptionist_cannot_return_order(self):
        order = self._create_full_order()
        mark_exception(self.director, order.id, reason='测试')
        with self.assertRaises(BizError) as ctx:
            return_order(self.receptionist, order.id, target_status='draft', reason='退回')
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_user_without_profile_cannot_create_order(self):
        bare_user = User.objects.create_user(username='bare_user', password='pass')
        with self.assertRaises(BizError) as ctx:
            create_order_with_assessment(
                user=bare_user,
                patient_id=self.patient.id,
                assessment_data={'motor_function': 'test'},
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ROLE_MISMATCH)

    def test_wrong_therapist_cannot_submit(self):
        order = self._create_full_order()
        other_therapist = _create_user_with_role('therapist2', 'therapist')
        with self.assertRaises(BizError) as ctx:
            submit_assessment(other_therapist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.PERMISSION_DENIED)

    def test_wrong_therapist_cannot_add_usage_record(self):
        order = self._advance_to_in_use()
        other_therapist = _create_user_with_role('therapist2', 'therapist')
        with self.assertRaises(BizError) as ctx:
            add_usage_record(
                user=other_therapist,
                order_id=order.id,
                record_data={
                    'start_time': timezone.now(),
                    'end_time': timezone.now() + timedelta(minutes=30),
                    'duration_minutes': 30,
                    'actual_usage': 'test',
                    'abnormal': False,
                    'abnormal_note': '',
                },
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.PERMISSION_DENIED)

    def test_wrong_therapist_cannot_finish_usage(self):
        order = self._advance_to_in_use()
        add_usage_record(
            user=self.therapist,
            order_id=order.id,
            record_data={
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(minutes=30),
                'duration_minutes': 30,
                'actual_usage': 'test',
                'abnormal': False,
                'abnormal_note': '',
            },
        )
        other_therapist = _create_user_with_role('therapist2', 'therapist')
        with self.assertRaises(BizError) as ctx:
            finish_usage(other_therapist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.PERMISSION_DENIED)


class ExceptionFlowTest(BaseTestCase):
    def test_abnormal_usage_triggers_exception(self):
        order = self._advance_to_in_use()

        add_usage_record(
            user=self.therapist,
            order_id=order.id,
            record_data={
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(minutes=10),
                'duration_minutes': 10,
                'actual_usage': '训练中断',
                'patient_feedback': '剧烈疼痛',
                'abnormal': True,
                'abnormal_note': '患者出现剧烈疼痛，训练被迫中断',
            },
        )

        order.refresh_from_db()
        self.assertEqual(order.status, 'exception')
        self.assertIn('剧烈疼痛', order.exception_reason)

        alerts = AlertLog.objects.filter(order=order)
        self.assertEqual(alerts.count(), 1)
        self.assertEqual(alerts.first().level, 'error')

    def test_abnormal_usage_releases_equipment(self):
        order = self._advance_to_in_use()
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

        add_usage_record(
            user=self.therapist,
            order_id=order.id,
            record_data={
                'start_time': timezone.now(),
                'end_time': timezone.now() + timedelta(minutes=10),
                'duration_minutes': 10,
                'actual_usage': '中断',
                'patient_feedback': '疼痛',
                'abnormal': True,
                'abnormal_note': '剧烈疼痛',
            },
        )

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

    def test_mark_exception_manually(self):
        order = self._create_full_order()
        order = mark_exception(self.director, order.id, reason='患者临时有事无法到诊')
        self.assertEqual(order.status, 'exception')
        alerts = AlertLog.objects.filter(order=order)
        self.assertEqual(alerts.count(), 1)

    def test_mark_exception_releases_equipment(self):
        order = self._advance_to_in_use()
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

        mark_exception(self.director, order.id, reason='器械故障')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

    def test_return_from_exception(self):
        order = self._create_full_order()
        mark_exception(self.director, order.id, reason='测试异常')
        order = return_order(
            user=self.director,
            order_id=order.id,
            target_status='pending_assign',
            reason='重新安排时间',
        )
        self.assertEqual(order.status, 'pending_assign')
        self.assertEqual(order.return_reason, '重新安排时间')

        alerts = AlertLog.objects.filter(order=order, handled='returned')
        self.assertEqual(alerts.count(), 2)

    def test_invalid_return_target(self):
        order = self._create_full_order()
        mark_exception(self.director, order.id, reason='测试异常')
        with self.assertRaises(BizError) as ctx:
            return_order(
                user=self.director,
                order_id=order.id,
                target_status='completed',
                reason='不能直接完成',
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.INVALID_STATUS_TRANSITION)


class EquipmentStateSyncTest(BaseTestCase):
    def test_review_approve_releases_equipment(self):
        order = self._advance_to_pending_review()
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

        review_order(self.director, order.id, action='approve')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

    def test_return_to_assigned_keeps_equipment_in_use(self):
        order = self._advance_to_in_use()
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

        mark_exception(self.director, order.id, reason='测试')
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

        return_order(self.director, order.id, target_status='assigned', reason='重新确认')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

    def test_return_to_in_use_keeps_equipment_in_use(self):
        order = self._advance_to_in_use()

        mark_exception(self.director, order.id, reason='临时暂停')
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

        return_order(self.director, order.id, target_status='in_use', reason='恢复使用')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

    def test_return_to_draft_equipment_stays_available(self):
        order = self._advance_to_in_use()

        mark_exception(self.director, order.id, reason='取消')
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

        return_order(self.director, order.id, target_status='draft', reason='从头来过')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

    def test_return_to_pending_assign_equipment_stays_available(self):
        order = self._advance_to_in_use()

        mark_exception(self.director, order.id, reason='更换器械')
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

        return_order(self.director, order.id, target_status='pending_assign', reason='重新分配')

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')


class AlertChainConsistencyTest(BaseTestCase):
    def test_return_closes_pending_alerts(self):
        order = self._advance_to_in_use()
        mark_exception(self.director, order.id, reason='测试')

        pending_alerts = AlertLog.objects.filter(order=order, handled='pending')
        self.assertGreater(pending_alerts.count(), 0)

        return_order(self.director, order.id, target_status='draft', reason='退回测试')

        pending_alerts = AlertLog.objects.filter(order=order, handled='pending')
        self.assertEqual(pending_alerts.count(), 0)

    def test_review_approve_closes_pending_alerts(self):
        order = self._advance_to_pending_review()

        AlertLog.objects.create(
            order=order,
            level='warning',
            message='待审核阶段触发告警',
            handled='pending',
        )
        pending_before = AlertLog.objects.filter(order=order, handled='pending').count()
        self.assertGreater(pending_before, 0)

        review_order(self.director, order.id, action='approve')

        pending_after = AlertLog.objects.filter(order=order, handled='pending').count()
        self.assertEqual(pending_after, 0)

    def test_exception_after_exception_creates_new_alert(self):
        order = self._create_full_order()
        mark_exception(self.director, order.id, reason='第一次异常')
        alert_count_1 = AlertLog.objects.filter(order=order).count()

        return_order(self.director, order.id, target_status='draft', reason='退回')
        mark_exception(self.director, order.id, reason='第二次异常')
        alert_count_2 = AlertLog.objects.filter(order=order).count()

        self.assertEqual(alert_count_2, alert_count_1 + 2)


class StuckOrderDetectionTest(BaseTestCase):
    def test_detect_stuck_draft_order(self):
        order = self._create_full_order()
        old_time = timezone.now() - timedelta(hours=25)
        AppointmentOrder.objects.filter(id=order.id).update(updated_at=old_time)

        stuck = detect_stuck_orders()
        self.assertEqual(len(stuck), 1)
        self.assertEqual(stuck[0]['order'].id, order.id)
        self.assertGreater(stuck[0]['stuck_hours'], 24)

        order.refresh_from_db()
        self.assertEqual(order.status, 'exception')
        self.assertIn('滞留', order.exception_reason)

        alerts = AlertLog.objects.filter(order=order)
        self.assertEqual(alerts.count(), 1)
        self.assertEqual(alerts.first().level, 'warning')

    def test_detect_stuck_pending_assign(self):
        order = self._advance_to_pending_assign()

        old_time = timezone.now() - timedelta(hours=5)
        AppointmentOrder.objects.filter(id=order.id).update(updated_at=old_time)

        stuck = detect_stuck_orders()
        self.assertEqual(len(stuck), 1)

        order.refresh_from_db()
        self.assertEqual(order.status, 'exception')

    def test_stuck_in_use_releases_equipment(self):
        order = self._advance_to_in_use()
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'in_use')

        old_time = timezone.now() - timedelta(hours=9)
        AppointmentOrder.objects.filter(id=order.id).update(updated_at=old_time)

        detect_stuck_orders()

        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, 'available')

    def test_no_stuck_orders(self):
        order = self._create_full_order()
        stuck = detect_stuck_orders()
        self.assertEqual(len(stuck), 0)


class OrderTraceTest(BaseTestCase):
    def test_full_trace_timeline(self):
        order = self._advance_to_pending_review()
        review_order(self.director, order.id, action='approve')

        trace = get_order_trace(order.id)
        self.assertIsNotNone(trace['assessment'])
        self.assertEqual(len(trace['usage_records']), 1)
        self.assertGreater(len(trace['timeline']), 4)

        timeline_actions = [e['action'] for e in trace['timeline']]
        self.assertIn('创建预约单', timeline_actions)
        self.assertIn('填写评估表', timeline_actions)
        self.assertIn('分配器械与排班', timeline_actions)
        self.assertIn('记录使用', timeline_actions)

    def test_trace_with_exception(self):
        order = self._create_full_order()
        mark_exception(self.director, order.id, reason='测试')

        trace = get_order_trace(order.id)
        self.assertGreater(len(trace['alerts']), 0)
        self.assertEqual(trace['alerts'][0]['level'], 'error')


class IdempotencyTest(BaseTestCase):
    def test_duplicate_create_rejected(self):
        order = create_order_with_assessment(
            user=self.therapist,
            patient_id=self.patient.id,
            assessment_data={
                'motor_function': '测试',
                'pain_level': 3,
            },
        )
        self.assertIsNotNone(order)

        with self.assertRaises(BizError) as ctx:
            create_order_with_assessment(
                user=self.therapist,
                patient_id=self.patient.id,
                assessment_data={
                    'motor_function': '测试',
                    'pain_level': 3,
                },
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.DUPLICATE_REQUEST)


class TransitionValidationTest(BaseTestCase):
    def test_cannot_skip_status(self):
        order = self._create_full_order()
        with self.assertRaises(BizError) as ctx:
            confirm_schedule(self.receptionist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.INVALID_STATUS_TRANSITION)

    def test_cannot_review_in_progress(self):
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)
        with self.assertRaises(BizError) as ctx:
            review_order(self.director, order.id, action='approve')
        self.assertEqual(ctx.exception.biz_code, ErrorCode.INVALID_STATUS_TRANSITION)

    def test_equipment_not_available_rejected(self):
        order = self._advance_to_pending_assign()

        self.equipment.status = 'maintenance'
        self.equipment.save()

        with self.assertRaises(BizError) as ctx:
            assign_equipment(
                user=self.receptionist, order_id=order.id, equipment_id=self.equipment.id,
                scheduled_date=timezone.now().date(),
                time_start=timezone.now().time(),
                time_end=(timezone.now() + timedelta(hours=1)).time(),
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.EQUIPMENT_NOT_AVAILABLE)

    def test_cannot_finish_usage_without_records(self):
        order = self._advance_to_in_use()

        with self.assertRaises(BizError) as ctx:
            finish_usage(self.therapist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ASSESSMENT_REQUIRED)


class NonExistentResourceTest(BaseTestCase):
    def test_nonexistent_order(self):
        from equipment_booking.services import _get_order_or_404
        with self.assertRaises(BizError) as ctx:
            _get_order_or_404(uuid4())
        self.assertEqual(ctx.exception.biz_code, ErrorCode.ORDER_NOT_FOUND)

    def test_nonexistent_patient(self):
        with self.assertRaises(BizError) as ctx:
            create_order_with_assessment(
                user=self.therapist,
                patient_id=uuid4(),
                assessment_data={'motor_function': 'test'},
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.PATIENT_NOT_FOUND)

    def test_nonexistent_equipment(self):
        order = self._advance_to_pending_assign()
        with self.assertRaises(BizError) as ctx:
            assign_equipment(
                user=self.receptionist, order_id=order.id, equipment_id=uuid4(),
                scheduled_date=timezone.now().date(),
                time_start=timezone.now().time(),
                time_end=(timezone.now() + timedelta(hours=1)).time(),
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.EQUIPMENT_NOT_FOUND)
