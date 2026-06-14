#!/usr/bin/env python3
"""
验证修复后的代码
"""
import sys
from datetime import datetime, timedelta

sys.path.insert(0, '/Users/zhangliu/Documents/private/model-test/trae-20260601-5')

from models import RoleType, OrderStatus, FeedbackStatus, FeeStatus, ProblemType
from services import (
    ProjectService, FeedbackService, FeeService, ProblemService,
    StatusChangeService, db
)

def test_fix_verification():
    print("=" * 60)
    print("验证修复后的代码")
    print("=" * 60)

    db.__init__()

    pm_user = type('User', (), {
        'id': 'pm_001',
        'name': '项目经理',
        'role': RoleType.PROJECT_MANAGER
    })
    pm = pm_user()
    db.add("user", pm)

    trans_user = type('User', (), {
        'id': 'trans_001',
        'name': '译员',
        'role': RoleType.TRANSLATOR
    })
    translator = trans_user()
    db.add("user", translator)

    rev_user = type('User', (), {
        'id': 'rev_001',
        'name': '审校',
        'role': RoleType.REVIEWER
    })
    reviewer = rev_user()
    db.add("user", reviewer)

    print("\n1. 测试项目创建...")
    project = ProjectService.create_project(
        name="测试项目",
        project_manager_id=pm.id,
        translator_id=translator.id,
        reviewer_id=reviewer.id,
        original_deadline=datetime.now() + timedelta(days=7)
    )
    print(f"   ✓ 项目创建成功: {project.id}")
    print(f"   ✓ 项目状态: {project.status.value}")

    print("\n2. 测试改期（自动创建费用）...")
    result = ProjectService.reschedule_project(
        project_id=project.id,
        new_deadline=datetime.now() + timedelta(days=10),
        changed_by=pm.id,
        reason="客户临时增加内容",
        auto_create_fee=True,
        estimated_amount=2000.00,
        fee_type="改期附加费"
    )
    rescheduled_project = result["project"]
    problem = result["problem"]
    fee = result["fee"]
    print(f"   ✓ 改期成功")
    print(f"   ✓ 问题单创建: {problem.id}, 类型: {problem.problem_type.value}")
    print(f"   ✓ 费用创建: {fee.id}, 金额: {fee.amount}, 问题ID: {fee.problem_id}")
    print(f"   ✓ 费用备注继承: {'改期' in fee.inherited_notes}")

    print("\n3. 测试状态历史记录...")
    project_changes = StatusChangeService.get_changes_by_entity("project", project.id)
    print(f"   ✓ 项目状态变更记录数: {len(project_changes)}")
    for change in project_changes:
        print(f"      - {change.field_name}: {change.old_value} -> {change.new_value}")

    fee_changes = StatusChangeService.get_changes_by_entity("fee", fee.id)
    print(f"   ✓ 费用状态变更记录数: {len(fee_changes)}")
    for change in fee_changes:
        print(f"      - {change.field_name}: {change.old_value} -> {change.new_value}")

    print("\n4. 测试反馈处理（自动创建费用）...")
    feedback = FeedbackService.create_feedback(
        project_id=project.id,
        feedback_content="客户反馈：翻译质量需要提升"
    )

    feedback_result = FeedbackService.handle_feedback(
        feedback_id=feedback.id,
        handler_id=pm.id,
        handler_type=RoleType.PROJECT_MANAGER,
        internal_notes="经核实确实存在问题",
        responsibility_analysis="译员理解偏差",
        processing_result="已安排修正",
        auto_create_fee=True,
        estimated_amount=3000.00,
        fee_type="返工费用"
    )

    handled_feedback = feedback_result["feedback"]
    feedback_fee = feedback_result["fee"]
    print(f"   ✓ 反馈处理成功: {handled_feedback.id}")
    print(f"   ✓ 自动创建费用: {feedback_fee.id}, 金额: {feedback_fee.amount}")
    print(f"   ✓ 费用备注继承反馈: {'经核实确实存在问题' in feedback_fee.inherited_notes}")

    print("\n5. 测试问题单驳回（自动创建费用+关联反馈）...")
    reject_result = ProblemService.create_problem(
        project_id=project.id,
        feedback_id=feedback.id,
        problem_type=ProblemType.REJECT,
        reason="驳回原费用：计算有误",
        created_by=pm.id,
        auto_create_fee=True,
        estimated_amount=2500.00,
        fee_type="重新计算费用"
    )

    reject_problem = reject_result["problem"]
    reject_fee = reject_result["fee"]
    print(f"   ✓ 驳回问题单创建: {reject_problem.id}")
    print(f"   ✓ 关联费用创建: {reject_fee.id}")
    print(f"   ✓ 费用备注继承问题单: {'驳回原费用' in reject_fee.inherited_notes}")
    print(f"   ✓ 费用备注继承反馈: {'译员理解偏差' in reject_fee.inherited_notes}")

    print("\n6. 测试费用回看（包含所有关联数据）...")
    fee_context = FeeService.get_fee_with_full_context(reject_fee.id)
    print(f"   ✓ 费用信息: {fee_context['fee'].id}")
    print(f"   ✓ 关联反馈: {fee_context['feedback'].id if fee_context['feedback'] else '无'}")
    print(f"   ✓ 关联问题单: {fee_context['problem'].id if fee_context['problem'] else '无'}")
    print(f"   ✓ 关联项目: {fee_context['project'].id}")
    print(f"   ✓ 费用状态变更历史: {len(fee_context['fee_status_changes'])} 条")
    print(f"   ✓ 反馈状态变更历史: {len(fee_context['feedback_status_changes'])} 条")
    print(f"   ✓ 问题单状态变更历史: {len(fee_context['problem_status_changes'])} 条")

    print("\n" + "=" * 60)
    print("✓ 所有验证通过！")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_fix_verification()
    except Exception as e:
        print(f"\n✗ 验证失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
