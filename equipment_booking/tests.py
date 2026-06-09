from datetime import timedelta
from uuid import uuid4

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from equipment_booking.models import (
    Patient, Equipment, AppointmentOrder, Assessment, UsageRecord, AlertLog,
    VALID_TRANSITIONS, STATUS_TIMEOUT_HOURS,
)
from equipment_booking.services import (
    create_order_with_assessment, submit_assessment, assign_equipment,
    confirm_schedule, add_usage_record, finish_usage, review_order,
    mark_exception, return_order, detect_stuck_orders, get_order_trace,
)
from equipment_booking.exceptions import BizError, ErrorCode

User = get_user_model()


class BaseTestCase(TestCase):
    def setUp(self):
        self.therapist = User.objects.create_user(username='therapist1', password='pass')
        self.receptionist = User.objects.create_user(username='receptionist1', password='pass')
        self.director = User.objects.create_user(username='director1', password='pass')

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


class ExceptionFlowTest(BaseTestCase):
    def test_abnormal_usage_triggers_exception(self):
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)
        assign_equipment(
            user=self.receptionist, order_id=order.id, equipment_id=self.equipment.id,
            scheduled_date=timezone.now().date(),
            time_start=timezone.now().time(),
            time_end=(timezone.now() + timedelta(hours=1)).time(),
        )
        confirm_schedule(self.receptionist, order.id)

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

    def test_mark_exception_manually(self):
        order = self._create_full_order()
        order = mark_exception(order.id, reason='患者临时有事无法到诊')
        self.assertEqual(order.status, 'exception')
        alerts = AlertLog.objects.filter(order=order)
        self.assertEqual(alerts.count(), 1)

    def test_return_from_exception(self):
        order = self._create_full_order()
        mark_exception(order.id, reason='测试异常')
        order = return_order(
            user=self.director,
            order_id=order.id,
            target_status='pending_assign',
            reason='重新安排时间',
        )
        self.assertEqual(order.status, 'pending_assign')
        self.assertEqual(order.return_reason, '重新安排时间')

        alerts = AlertLog.objects.filter(order=order, handled='returned')
        self.assertEqual(alerts.count(), 1)

    def test_invalid_return_target(self):
        order = self._create_full_order()
        mark_exception(order.id, reason='测试异常')
        with self.assertRaises(BizError) as ctx:
            return_order(
                user=self.director,
                order_id=order.id,
                target_status='completed',
                reason='不能直接完成',
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.INVALID_STATUS_TRANSITION)


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
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)

        old_time = timezone.now() - timedelta(hours=5)
        AppointmentOrder.objects.filter(id=order.id).update(updated_at=old_time)

        stuck = detect_stuck_orders()
        self.assertEqual(len(stuck), 1)

        order.refresh_from_db()
        self.assertEqual(order.status, 'exception')

    def test_no_stuck_orders(self):
        order = self._create_full_order()
        stuck = detect_stuck_orders()
        self.assertEqual(len(stuck), 0)


class OrderTraceTest(BaseTestCase):
    def test_full_trace_timeline(self):
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)
        assign_equipment(
            user=self.receptionist, order_id=order.id, equipment_id=self.equipment.id,
            scheduled_date=timezone.now().date(),
            time_start=timezone.now().time(),
            time_end=(timezone.now() + timedelta(hours=1)).time(),
        )
        confirm_schedule(self.receptionist, order.id)
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
        mark_exception(order.id, reason='测试')

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

    def test_wrong_therapist_cannot_submit(self):
        order = self._create_full_order()
        other_therapist = User.objects.create_user(username='therapist2', password='pass')
        with self.assertRaises(BizError) as ctx:
            submit_assessment(other_therapist, order.id)
        self.assertEqual(ctx.exception.biz_code, ErrorCode.PERMISSION_DENIED)

    def test_equipment_not_available_rejected(self):
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)

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
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)
        assign_equipment(
            user=self.receptionist, order_id=order.id, equipment_id=self.equipment.id,
            scheduled_date=timezone.now().date(),
            time_start=timezone.now().time(),
            time_end=(timezone.now() + timedelta(hours=1)).time(),
        )
        confirm_schedule(self.receptionist, order.id)

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
        order = self._create_full_order()
        submit_assessment(self.therapist, order.id)
        with self.assertRaises(BizError) as ctx:
            assign_equipment(
                user=self.receptionist, order_id=order.id, equipment_id=uuid4(),
                scheduled_date=timezone.now().date(),
                time_start=timezone.now().time(),
                time_end=(timezone.now() + timedelta(hours=1)).time(),
            )
        self.assertEqual(ctx.exception.biz_code, ErrorCode.EQUIPMENT_NOT_FOUND)
