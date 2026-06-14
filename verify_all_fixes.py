#!/usr/bin/env python3
"""
验证所有修复
"""
import sys
from datetime import datetime, timedelta

sys.path.insert(0, '/Users/zhangliu/Documents/private/model-test/trae-20260601-5')

from models import RoleType, OrderStatus, FeedbackStatus, FeeStatus, ProblemType
from services import (
    ProjectService, FeedbackService, FeeService, ProblemService,
    StatusChangeService, db
)

def test_all_fixes():
    print("=" * 60)
    print("验证所有修复")
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

    print("\n1. 测试费用驳回状态历史旧值修复...")
    project = ProjectService.create_project(
        name="测试项目",
        project_manager_id=pm.id,
        translator_id=translator.id,
        reviewer_id=reviewer.id,
        original_deadline=datetime.now() + timedelta(days=7)
    )

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

    fee = feedback_result["fee"]
    print(f"   ✓ 费用创建成功: {fee.id}, 状态: {fee.status.value}")

    rejected_fee = FeeService.reject_fee(fee.id, reviewer.id, "驳回：费用计算有误")
    print(f"   ✓ 费用驳回成功: {rejected_fee.status.value}")

    fee_changes = StatusChangeService.get_changes_by_entity("fee", fee.id)
    reject_change = [c for c in fee_changes if c.new_value == FeeStatus.REJECTED.value][0]
    print(f"   ✓ 状态历史旧值: {reject_change.old_value} (应该是 'pending')")
    print(f"   ✓ 状态历史新值: {reject_change.new_value} (应该是 'rejected')")
    assert reject_change.old_value == FeeStatus.PENDING.value, "旧值应该是 pending"
    assert reject_change.new_value == FeeStatus.REJECTED.value, "新值应该是 rejected"
    print(f"   ✓ 费用驳回状态历史修复验证通过")

    print("\n2. 测试问题单驳回关联反馈和费用...")
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
    print(f"   ✓ 反馈关联费用ID: {feedback.related_fee_id}")
    assert feedback.related_fee_id == reject_fee.id, "反馈应该关联到驳回费用"
    print(f"   ✓ 反馈与费用关联回写修复验证通过")

    print("\n3. 测试反馈详情包含完整链路...")
    feedback_detail = FeedbackService.get_feedback(feedback.id)
    print(f"   ✓ 反馈ID: {feedback_detail.id}")
    print(f"   ✓ 关联费用ID: {feedback_detail.related_fee_id}")

    fee_context = FeeService.get_fee_with_full_context(reject_fee.id)
    print(f"   ✓ 费用回看包含反馈: {fee_context['feedback'].id if fee_context['feedback'] else '无'}")
    print(f"   ✓ 费用回看包含问题单: {fee_context['problem'].id if fee_context['problem'] else '无'}")
    print(f"   ✓ 费用回看包含项目: {fee_context['project'].id}")
    assert fee_context['feedback'].id == feedback.id, "费用应该关联到反馈"
    assert fee_context['problem'].id == reject_problem.id, "费用应该关联到问题单"
    print(f"   ✓ 改期、补录、驳回链路串起来验证通过")

    print("\n4. 测试改期链路...")
    reschedule_result = ProjectService.reschedule_project(
        project_id=project.id,
        new_deadline=datetime.now() + timedelta(days=10),
        changed_by=pm.id,
        reason="客户临时增加内容",
        auto_create_fee=True,
        estimated_amount=2000.00,
        fee_type="改期附加费"
    )

    reschedule_problem = reschedule_result["problem"]
    reschedule_fee = reschedule_result["fee"]
    print(f"   ✓ 改期问题单创建: {reschedule_problem.id}")
    print(f"   ✓ 改期费用创建: {reschedule_fee.id}")

    reschedule_fee_context = FeeService.get_fee_with_full_context(reschedule_fee.id)
    print(f"   ✓ 改期费用回看包含问题单: {reschedule_fee_context['problem'].id}")
    print(f"   ✓ 改期费用回看包含项目: {reschedule_fee_context['project'].id}")
    assert reschedule_fee_context['problem'].id == reschedule_problem.id, "改期费用应该关联到问题单"
    print(f"   ✓ 改期链路验证通过")

    print("\n5. 测试补录链路...")
    supplement_result = ProblemService.create_problem(
        project_id=project.id,
        feedback_id="",
        problem_type=ProblemType.SUPPLEMENT,
        reason="漏记了一次客户沟通",
        created_by=pm.id,
        original_data="原记录：3次沟通",
        new_data="补录后：4次沟通",
        auto_create_fee=True,
        estimated_amount=500.00,
        fee_type="补录附加费"
    )

    supplement_problem = supplement_result["problem"]
    supplement_fee = supplement_result["fee"]
    print(f"   ✓ 补录问题单创建: {supplement_problem.id}")
    print(f"   ✓ 补录费用创建: {supplement_fee.id}")

    supplement_fee_context = FeeService.get_fee_with_full_context(supplement_fee.id)
    print(f"   ✓ 补录费用回看包含问题单: {supplement_fee_context['problem'].id}")
    print(f"   ✓ 补录费用回看包含项目: {supplement_fee_context['project'].id}")
    assert supplement_fee_context['problem'].id == supplement_problem.id, "补录费用应该关联到问题单"
    print(f"   ✓ 补录链路验证通过")

    print("\n" + "=" * 60)
    print("✓ 所有修复验证通过！")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_all_fixes()
    except Exception as e:
        print(f"\n✗ 验证失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)