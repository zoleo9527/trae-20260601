"""
测试用例：翻译公司-客户反馈与费用确认系统

包含正常单和问题单的完整测试流程
"""
import unittest
from datetime import datetime, timedelta
from models import RoleType, OrderStatus, FeedbackStatus, FeeStatus, ProblemType
from services import (
    ProjectService, FeedbackService, FeeService, ProblemService,
    StatusChangeService, db
)
from state_machine import StateTransitionError, StateMachine


class TestNormalOrder(unittest.TestCase):
    """正常单流程测试"""

    def setUp(self):
        db.__init__()

        pm_user = type('User', (), {
            'id': 'pm_001',
            'name': '项目经理张',
            'role': RoleType.PROJECT_MANAGER
        })
        self.pm = pm_user()
        db.add("user", self.pm)

        trans_user = type('User', (), {
            'id': 'trans_001',
            'name': '译员李',
            'role': RoleType.TRANSLATOR
        })
        self.translator = trans_user()
        db.add("user", self.translator)

        rev_user = type('User', (), {
            'id': 'rev_001',
            'name': '审校王',
            'role': RoleType.REVIEWER
        })
        self.reviewer = rev_user()
        db.add("user", self.reviewer)

    def test_1_create_project(self):
        """测试1: 创建项目"""
        project = ProjectService.create_project(
            name="某公司年度报告翻译",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7),
            ledger="旧台账记录：客户要求高质量翻译",
            scene_records="现场记录：客户多次电话沟通细节",
            screenshots=["沟通截图1", "沟通截图2"]
        )

        self.assertEqual(project.status, OrderStatus.PENDING)
        self.assertEqual(project.name, "某公司年度报告翻译")

        status_changes = StatusChangeService.get_changes_by_entity("project", project.id)
        self.assertEqual(len(status_changes), 1)
        self.assertEqual(status_changes[0].new_value, OrderStatus.PENDING.value)
        print(f"✓ 项目创建成功: {project.id}")

    def test_2_update_project_status_to_processing(self):
        """测试2: 更新项目状态为处理中"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        updated_project = ProjectService.update_project_status(
            project.id,
            OrderStatus.PROCESSING,
            self.pm.id,
            "开始处理项目"
        )

        self.assertEqual(updated_project.status, OrderStatus.PROCESSING)
        print(f"✓ 项目状态更新为处理中")

    def test_3_feedback_to_fee_confirmation(self):
        """测试3: 客户反馈完成后自动生成费用确认"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        feedback = FeedbackService.create_feedback(
            project_id=project.id,
            feedback_content="客户反馈：翻译质量不错，但有一个术语需要修正"
        )

        result = FeedbackService.handle_feedback(
            feedback_id=feedback.id,
            handler_id=self.pm.id,
            handler_type=RoleType.PROJECT_MANAGER,
            internal_notes="已与译员沟通，术语已修正",
            responsibility_analysis="属于译员理解偏差，但已及时修正",
            processing_result="问题已解决",
            auto_create_fee=True,
            estimated_amount=5000.00,
            fee_type="翻译费"
        )

        self.assertIn("fee", result)
        self.assertIn("feedback", result)
        self.assertEqual(result["feedback"].status, FeedbackStatus.HANDLED)
        self.assertIsNotNone(result["feedback"].internal_notes)

        fee = result["fee"]
        self.assertIsNotNone(fee)
        self.assertIsNotNone(fee.inherited_notes)
        self.assertIn("已与译员沟通", fee.inherited_notes)
        self.assertEqual(fee.feedback_id, feedback.id)
        self.assertEqual(fee.related_fee_id, fee.id)

        retrieved_fee = FeeService.get_fee(fee.id)
        self.assertEqual(retrieved_fee.inherited_notes, fee.inherited_notes)
        print(f"✓ 客户反馈备注自动沉淀为待确认费用")

    def test_4_fee_confirmation_workflow(self):
        """测试4: 费用确认完整流程"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        fee = FeeService.create_fee_from_feedback(
            project_id=project.id,
            amount=8000.00,
            fee_type="翻译费"
        )

        self.assertEqual(fee.status, FeeStatus.PENDING)

        confirmed_fee = FeeService.confirm_fee(
            fee_id=fee.id,
            confirmed_by=self.reviewer.id,
            confirmation_notes="费用确认无误"
        )

        self.assertEqual(confirmed_fee.status, FeeStatus.CONFIRMED)
        self.assertEqual(confirmed_fee.confirmed_by, self.reviewer.id)
        print(f"✓ 费用确认完成")

    def test_5_view_fee_with_history(self):
        """测试5: 费用确认回看（含历史记录）"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        fee = FeeService.create_fee_from_feedback(
            project_id=project.id,
            amount=6000.00,
            fee_type="审校费"
        )

        confirmed_fee = FeeService.confirm_fee(
            fee_id=fee.id,
            confirmed_by=self.reviewer.id,
            confirmation_notes="审校费用确认"
        )

        status_changes = StatusChangeService.get_changes_by_entity("fee", fee.id)
        self.assertEqual(len(status_changes), 2)
        self.assertEqual(status_changes[0].new_value, FeeStatus.CONFIRMED.value)

        retrieved_fee = FeeService.get_fee(fee.id)
        self.assertEqual(retrieved_fee.status, FeeStatus.CONFIRMED)
        print(f"✓ 费用确认回看功能正常")


class TestProblemOrder(unittest.TestCase):
    """问题单流程测试"""

    def setUp(self):
        db.__init__()

        pm_user = type('User', (), {
            'id': 'pm_001',
            'name': '项目经理张',
            'role': RoleType.PROJECT_MANAGER
        })
        self.pm = pm_user()
        db.add("user", self.pm)

        trans_user = type('User', (), {
            'id': 'trans_001',
            'name': '译员李',
            'role': RoleType.TRANSLATOR
        })
        self.translator = trans_user()
        db.add("user", self.translator)

        rev_user = type('User', (), {
            'id': 'rev_001',
            'name': '审校王',
            'role': RoleType.REVIEWER
        })
        self.reviewer = rev_user()
        db.add("user", self.reviewer)

    def test_1_reschedule_problem(self):
        """测试1: 问题单-改期（自动创建费用）"""
        project = ProjectService.create_project(
            name="紧急翻译项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=3)
        )

        original_deadline = project.actual_deadline or project.original_deadline
        new_deadline = datetime.now() + timedelta(days=5)

        result = ProjectService.reschedule_project(
            project_id=project.id,
            new_deadline=new_deadline,
            changed_by=self.pm.id,
            reason="客户临时增加内容，需要延长时间",
            auto_create_fee=True,
            estimated_amount=2000.00,
            fee_type="改期附加费"
        )

        rescheduled_project = result["project"]
        self.assertEqual(rescheduled_project.actual_deadline, new_deadline)
        self.assertNotEqual(rescheduled_project.actual_deadline, original_deadline)

        self.assertIn("problem", result)
        self.assertIn("fee", result)
        problem = result["problem"]
        fee = result["fee"]

        self.assertEqual(problem.problem_type, ProblemType.RESCHEDULE)
        self.assertEqual(fee.problem_id, problem.id)
        self.assertIsNotNone(fee.inherited_notes)
        self.assertIn("改期问题单", fee.inherited_notes)
        self.assertIn("客户临时增加内容", fee.inherited_notes)

        status_changes = StatusChangeService.get_changes_by_entity("project", project.id)
        deadline_changes = [c for c in status_changes if c.field_name == "actual_deadline"]
        self.assertEqual(len(deadline_changes), 1)
        self.assertEqual(deadline_changes[0].old_value, str(original_deadline))

        project_status_changes = [c for c in status_changes if c.field_name == "status"]
        self.assertGreaterEqual(len(project_status_changes), 1)

        fee_status_changes = StatusChangeService.get_changes_by_entity("fee", fee.id)
        self.assertGreater(len(fee_status_changes), 0)

        print(f"✓ 改期问题单自动创建费用成功")

    def test_2_supplement_problem(self):
        """测试2: 问题单-补录"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        result = ProblemService.create_problem(
            project_id=project.id,
            feedback_id="",
            problem_type=ProblemType.SUPPLEMENT,
            reason="漏记了一次客户沟通",
            created_by=self.pm.id,
            original_data="原记录：3次沟通",
            new_data="补录后：4次沟通，新增电话沟通记录",
            auto_create_fee=True,
            estimated_amount=500.00,
            fee_type="补录附加费"
        )

        problem = result["problem"]
        fee = result["fee"]

        self.assertEqual(problem.problem_type, ProblemType.SUPPLEMENT)
        self.assertIsNotNone(problem.original_data)
        self.assertIsNotNone(problem.new_data)
        self.assertEqual(fee.problem_id, problem.id)
        self.assertIsNotNone(fee.inherited_notes)
        self.assertIn("补录", fee.inherited_notes)

        status_changes = StatusChangeService.get_changes_by_entity("problem", problem.id)
        self.assertGreater(len(status_changes), 0)

        fee_status_changes = StatusChangeService.get_changes_by_entity("fee", fee.id)
        self.assertGreater(len(fee_status_changes), 0)

        print(f"✓ 补录问题单自动创建费用成功")

    def test_3_reject_problem(self):
        """测试3: 问题单-驳回"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        feedback = FeedbackService.create_feedback(
            project_id=project.id,
            feedback_content="客户投诉：术语翻译错误"
        )

        result = FeedbackService.handle_feedback(
            feedback_id=feedback.id,
            handler_id=self.pm.id,
            handler_type=RoleType.PROJECT_MANAGER,
            internal_notes="经核实，确实存在错误",
            responsibility_analysis="译员责任，已安排修正",
            processing_result="需要重新翻译相关章节",
            auto_create_fee=False
        )

        handled_feedback = result["feedback"]

        problem_result = ProblemService.create_problem(
            project_id=project.id,
            feedback_id=feedback.id,
            problem_type=ProblemType.REJECT,
            reason="驳回原费用：计算有误",
            created_by=self.pm.id,
            auto_create_fee=True,
            estimated_amount=8500.00,
            fee_type="重新计算翻译费"
        )

        self.assertIn("fee", problem_result)
        problem = problem_result["problem"]
        fee = problem_result["fee"]

        self.assertEqual(fee.problem_id, problem.id)
        self.assertEqual(fee.feedback_id, feedback.id)
        self.assertIsNotNone(fee.inherited_notes)
        self.assertIn("驳回原费用", fee.inherited_notes)
        self.assertIn("译员责任", fee.inherited_notes)

        status_changes = StatusChangeService.get_changes_by_entity("problem", problem.id)
        self.assertGreater(len(status_changes), 0)

        fee_status_changes = StatusChangeService.get_changes_by_entity("fee", fee.id)
        self.assertGreater(len(fee_status_changes), 0)
        print(f"✓ 驳回问题单自动创建费用并关联历史")

    def test_4_resolve_problem(self):
        """测试4: 问题单解决"""
        project = ProjectService.create_project(
            name="测试项目",
            project_manager_id=self.pm.id,
            translator_id=self.translator.id,
            reviewer_id=self.reviewer.id,
            original_deadline=datetime.now() + timedelta(days=7)
        )

        result = ProblemService.create_problem(
            project_id=project.id,
            feedback_id="",
            problem_type=ProblemType.SUPPLEMENT,
            reason="需要补录客户确认",
            created_by=self.pm.id,
            auto_create_fee=False
        )

        problem = result["problem"]
        resolved_problem = ProblemService.resolve_problem(problem.id, self.pm.id)

        self.assertEqual(resolved_problem.status, "resolved")
        self.assertIsNotNone(resolved_problem.resolved_at)

        status_changes = StatusChangeService.get_changes_by_entity("problem", problem.id)
        resolved_changes = [c for c in status_changes if c.new_value == "resolved"]
        self.assertEqual(len(resolved_changes), 1)
        print(f"✓ 问题单解决成功")


class TestRolePermissions(unittest.TestCase):
    """角色权限测试"""

    def setUp(self):
        db.__init__()

        pm_user = type('User', (), {
            'id': 'pm_001',
            'name': '项目经理张',
            'role': RoleType.PROJECT_MANAGER
        })
        self.pm = pm_user()
        db.add("user", self.pm)

        trans_user = type('User', (), {
            'id': 'trans_001',
            'name': '译员李',
            'role': RoleType.TRANSLATOR
        })
        self.translator = trans_user()
        db.add("user", self.translator)

        rev_user = type('User', (), {
            'id': 'rev_001',
            'name': '审校王',
            'role': RoleType.REVIEWER
        })
        self.reviewer = rev_user()
        db.add("user", self.reviewer)

    def test_project_manager_permissions(self):
        """测试项目经理权限"""
        self.assertTrue(StateMachine.check_permission(RoleType.PROJECT_MANAGER, "create_project"))
        self.assertTrue(StateMachine.check_permission(RoleType.PROJECT_MANAGER, "handle_feedback"))
        self.assertTrue(StateMachine.check_permission(RoleType.PROJECT_MANAGER, "confirm_fee"))
        self.assertTrue(StateMachine.check_permission(RoleType.PROJECT_MANAGER, "reschedule"))
        print(f"✓ 项目经理权限正确")

    def test_translator_permissions(self):
        """测试译员权限"""
        self.assertTrue(StateMachine.check_permission(RoleType.TRANSLATOR, "view_project"))
        self.assertTrue(StateMachine.check_permission(RoleType.TRANSLATOR, "add_feedback_notes"))
        self.assertFalse(StateMachine.check_permission(RoleType.TRANSLATOR, "confirm_fee"))
        print(f"✓ 译员权限正确")

    def test_reviewer_permissions(self):
        """测试审校权限"""
        self.assertTrue(StateMachine.check_permission(RoleType.REVIEWER, "view_project"))
        self.assertTrue(StateMachine.check_permission(RoleType.REVIEWER, "confirm_fee"))
        self.assertTrue(StateMachine.check_permission(RoleType.REVIEWER, "reject_fee"))
        print(f"✓ 审校权限正确")


class TestErrorCodes(unittest.TestCase):
    """错误码测试"""

    def setUp(self):
        db.__init__()

    def test_invalid_status_transition_error(self):
        """测试无效状态转换错误"""
        with self.assertRaises(StateTransitionError) as context:
            StateMachine.validate_project_transition(
                OrderStatus.COMPLETED,
                OrderStatus.PENDING
            )

        self.assertEqual(context.exception.error_code.value, "E001")
        print(f"✓ 错误码 E001 (无效状态转换) 正确")

    def test_duplicate_operation_error(self):
        """测试重复操作错误"""
        db.__init__()
        pm_user = type('User', (), {
            'id': 'pm_001',
            'name': '项目经理',
            'role': RoleType.PROJECT_MANAGER
        })
        pm = pm_user()
        db.add("user", pm)

        project = ProjectService.create_project(
            name="测试",
            project_manager_id=pm.id,
            translator_id="t1",
            reviewer_id="r1",
            original_deadline=datetime.now() + timedelta(days=7)
        )

        FeedbackService.create_feedback(project.id, "反馈")

        feedbacks = db.get_all("feedback")
        feedback = feedbacks[0]

        FeedbackService.handle_feedback(
            feedback_id=feedback.id,
            handler_id=pm.id,
            handler_type=RoleType.PROJECT_MANAGER,
            internal_notes="备注1",
            responsibility_analysis="分析1",
            processing_result="结果1"
        )

        with self.assertRaises(StateTransitionError) as context:
            FeedbackService.handle_feedback(
                feedback_id=feedback.id,
                handler_id=pm.id,
                handler_type=RoleType.PROJECT_MANAGER,
                internal_notes="备注2",
                responsibility_analysis="分析2",
                processing_result="结果2"
            )

        self.assertEqual(context.exception.error_code.value, "E010")
        print(f"✓ 错误码 E010 (重复操作) 正确")


if __name__ == '__main__':
    print("=" * 60)
    print("翻译公司-客户反馈与费用确认系统 - 测试用例")
    print("=" * 60)

    unittest.main(verbosity=2)
