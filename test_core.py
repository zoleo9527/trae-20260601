#!/usr/bin/env python3
import os
from ranch_handover.models import *
from ranch_handover.state_machine import (
    transition_requisition, transition_feeding,
    check_feeding_completion,
)
from ranch_handover.database import get_session, close_session

test_db = '/tmp/test_ranch_handover_v2.db'
if os.path.exists(test_db):
    os.remove(test_db)

from ranch_handover.models import init_engine
engine = init_engine(test_db)

from ranch_handover import database
database._engine = engine
database._session_factory = database.sessionmaker(bind=engine)
database._scoped = database.scoped_session(database._session_factory)

session = get_session()
Base.metadata.create_all(engine)

s1 = Staff(name='sup', role='牧场主管', shift='d')
s2 = Staff(name='mlk', role='挤奶员', shift='d')
session.add_all([s1, s2])
session.commit()

p = FeedingPlan(
    plan_date='2026-06-10', cattle_group='dairy', feed_formula='TMR',
    quantity=100, unit='kg', status=FeedingPlanStatus.in_progress.value,
    assigned_to=s2.id, approved_by=s1.id, created_by=s1.id,
)
session.add(p)
session.commit()

r = InventoryRequisition(
    feeding_plan_id=p.id, item_name='grain', quantity_requested=50,
    unit='kg', status=RequisitionStatus.issuing.value,
    requested_by=s2.id, issued_by=s2.id,
)
session.add(r)
session.commit()

ok, msg = transition_requisition(r, RequisitionStatus.delayed.value, 'mlk', '挤奶员', 'out of stock', operator_id=s2.id)
session = get_session()
p = session.query(FeedingPlan).get(p.id)
r = session.query(InventoryRequisition).get(r.id)
assert p.status == FeedingPlanStatus.blocked.value, f'1a: expected blocked, got {p.status}'
assert p.blocking_requisition_id == r.id, f'1b: expected req id {r.id}, got {p.blocking_requisition_id}'
print('1. auto-block PASS')

ok, msg = transition_requisition(r, RequisitionStatus.issuing.value, 'mlk', '挤奶员', operator_id=s2.id)
session = get_session()
p = session.query(FeedingPlan).get(p.id)
r = session.query(InventoryRequisition).get(r.id)
assert p.status == FeedingPlanStatus.in_progress.value, f'2a: expected in_progress, got {p.status}'
assert p.blocking_requisition_id is None, f'2b: expected None, got {p.blocking_requisition_id}'
print('2. auto-unblock PASS')

ok, msg = check_feeding_completion(p, session)
assert not ok, '3a: should be blocked by incomplete req'
print('3. completion-blocked PASS')

r = session.query(InventoryRequisition).get(r.id)
r.status = RequisitionStatus.completed.value
r2 = InventoryRequisition(
    feeding_plan_id=p.id, item_name='hay', quantity_requested=30,
    unit='kg', status=RequisitionStatus.completed.value, requested_by=s2.id,
)
session.add(r2)
session.commit()

ok, msg = transition_feeding(p, FeedingPlanStatus.completed.value, 'sup', '牧场主管', operator_id=s1.id)
assert ok, f'4a: should succeed, got {msg}'
session = get_session()
p = session.query(FeedingPlan).get(p.id)
assert p.approved_by == s1.id, f'4b: approved_by should be {s1.id}, got {p.approved_by}'
print('4. completion PASS')

ok, msg = transition_feeding(
    FeedingPlan(plan_date='2026-06-10', cattle_group='x', feed_formula='y', quantity=10, unit='kg',
                status=FeedingPlanStatus.in_progress.value),
    FeedingPlanStatus.blocked.value, 'sup', '牧场主管', reason=None, operator_id=s1.id,
)
assert not ok, '5a: should fail with empty reason'
assert '必填' in msg, f'5b: expected mandatory msg, got {msg}'
print('5. block-reason-mandatory PASS')

ok, msg = transition_requisition(
    InventoryRequisition(item_name='z', quantity_requested=10, unit='kg',
                         status=RequisitionStatus.issuing.value),
    RequisitionStatus.delayed.value, 'mlk', '挤奶员', reason=None, operator_id=s2.id,
)
assert not ok, '6a: should fail with empty reason'
assert '必填' in msg, f'6b: expected mandatory msg, got {msg}'
print('6. delay-reason-mandatory PASS')

p2 = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test', feed_formula='TMR',
    quantity=50, unit='kg', status=FeedingPlanStatus.pending_approval.value,
    created_by=s2.id,
)
session.add(p2)
session.commit()

ok, msg = transition_feeding(p2, FeedingPlanStatus.approved.value, 'sup', '牧场主管', operator_id=s1.id)
session = get_session()
p2 = session.query(FeedingPlan).get(p2.id)
assert p2.approved_by == s1.id, f'7a: approved_by should be {s1.id}, got {p2.approved_by}'
print('7. approved-by-auto-set PASS')

r3 = InventoryRequisition(
    item_name='test', quantity_requested=10, unit='kg',
    status=RequisitionStatus.pending_approval.value, requested_by=s2.id,
)
session.add(r3)
session.commit()

ok, msg = transition_requisition(r3, RequisitionStatus.approved.value, 'sup', '牧场主管', operator_id=s1.id)
session = get_session()
r3 = session.query(InventoryRequisition).get(r3.id)
assert r3.approved_by == s1.id, f'8a: approved_by should be {s1.id}, got {r3.approved_by}'
print('8. req-approved-by-auto-set PASS')

ok, msg = transition_requisition(r3, RequisitionStatus.issuing.value, 'sup', '牧场主管', operator_id=s1.id)
session = get_session()
r3 = session.query(InventoryRequisition).get(r3.id)
assert r3.issued_by == s1.id, f'9a: issued_by should be {s1.id}, got {r3.issued_by}'
print('9. req-issued-by-auto-set PASS')

p10 = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test10', feed_formula='TMR',
    quantity=50, unit='kg', status=FeedingPlanStatus.pending_approval.value,
    created_by=s2.id,
)
session.add(p10)
session.commit()
ok, msg = transition_feeding(p10, FeedingPlanStatus.approved.value, 'sup', '牧场主管', operator_id=s1.id)
session = get_session()
p10 = session.query(FeedingPlan).get(p10.id)
assert p10.approved_by == s1.id, f'10a: approved_by should be {s1.id}, got {p10.approved_by}'
assert p10.assigned_to == s1.id, f'10b: assigned_to should be {s1.id}, got {p10.assigned_to}'
print('10. approved-auto-set-assigned_to PASS')

p11 = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test11', feed_formula='TMR',
    quantity=50, unit='kg', status=FeedingPlanStatus.approved.value,
    created_by=s2.id, approved_by=s1.id,
)
session.add(p11)
session.commit()
ok, msg = transition_feeding(p11, FeedingPlanStatus.in_progress.value, 'mlk', '挤奶员', operator_id=s2.id)
session = get_session()
p11 = session.query(FeedingPlan).get(p11.id)
assert p11.assigned_to == s2.id, f'11a: assigned_to should be {s2.id}, got {p11.assigned_to}'
print('11. in-progress-auto-set-assigned_to PASS')

p12 = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test12', feed_formula='TMR',
    quantity=50, unit='kg', status=FeedingPlanStatus.blocked.value,
    created_by=s2.id, approved_by=s1.id, assigned_to=s2.id,
    blocked_reason='test block',
)
session.add(p12)
session.commit()
ok, msg = transition_feeding(p12, FeedingPlanStatus.in_progress.value, 'sup', '牧场主管', reason='解除卡点', operator_id=s1.id)
session = get_session()
p12 = session.query(FeedingPlan).get(p12.id)
assert p12.assigned_to == s1.id, f'12a: assigned_to should be {s1.id}, got {p12.assigned_to}'
print('12. unblock-auto-set-assigned_to PASS')

p13 = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test13', feed_formula='TMR',
    quantity=100, unit='kg', status=FeedingPlanStatus.in_progress.value,
    created_by=s2.id, approved_by=s1.id, assigned_to=s2.id,
)
session.add(p13)
session.commit()
r13 = InventoryRequisition(
    feeding_plan_id=p13.id, item_name='grain', quantity_requested=50,
    unit='kg', status=RequisitionStatus.issuing.value,
    requested_by=s2.id, issued_by=s2.id,
)
session.add(r13)
session.commit()
ok, msg = transition_requisition(r13, RequisitionStatus.delayed.value, 'mlk', '挤奶员', 'out of stock', operator_id=s2.id)
session = get_session()
p13 = session.query(FeedingPlan).get(p13.id)
assert p13.status == FeedingPlanStatus.blocked.value, f'13a: expected blocked, got {p13.status}'
ok, msg = transition_requisition(r13, RequisitionStatus.issuing.value, 'sup', '牧场主管', operator_id=s1.id)
session = get_session()
p13 = session.query(FeedingPlan).get(p13.id)
assert p13.status == FeedingPlanStatus.in_progress.value, f'13b: expected in_progress, got {p13.status}'
assert p13.assigned_to == s1.id, f'13c: assigned_to should be {s1.id}, got {p13.assigned_to}'
print('13. auto-unblock-auto-set-assigned_to PASS')

from ranch_handover.widgets.dashboard import (
    _feeding_role, _req_role, _count_by_role, _filter_by_role, _action_item_role,
)
from ranch_handover.models import RoleEnum

p14_draft = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test14', feed_formula='TMR',
    quantity=50, unit='kg', status=FeedingPlanStatus.draft.value,
    created_by=s1.id,
)
session.add(p14_draft)
session.commit()
role14 = _feeding_role(p14_draft)
assert role14 == RoleEnum.ranch_supervisor.value, f'14a: expected ranch_supervisor, got {role14}'

p15_approved = FeedingPlan(
    plan_date='2026-06-10', cattle_group='test15', feed_formula='TMR',
    quantity=50, unit='kg', status=FeedingPlanStatus.approved.value,
    created_by=s1.id, approved_by=s1.id, assigned_to=s2.id,
)
session.add(p15_approved)
session.commit()
role15 = _feeding_role(p15_approved)
assert role15 == RoleEnum.milker.value, f'15a: expected milker, got {role15}'

r16 = InventoryRequisition(
    item_name='test16', quantity_requested=10, unit='kg',
    status=RequisitionStatus.pending_approval.value, requested_by=s1.id,
)
session.add(r16)
session.commit()
role16 = _req_role(r16)
assert role16 == RoleEnum.ranch_supervisor.value, f'16a: expected ranch_supervisor, got {role16}'

r17 = InventoryRequisition(
    item_name='test17', quantity_requested=10, unit='kg',
    status=RequisitionStatus.approved.value, requested_by=s2.id,
)
session.add(r17)
session.commit()
role17 = _req_role(r17)
assert role17 is None, f'17a: expected None (待出库), got {role17}'

plans = [p14_draft, p15_approved]
counts = _count_by_role(plans, _feeding_role)
assert counts[RoleEnum.ranch_supervisor.value] == 1, f'18a: expected 1 sup, got {counts}'
assert counts[RoleEnum.milker.value] == 1, f'18b: expected 1 mlk, got {counts}'
assert counts[RoleEnum.veterinarian.value] == 0, f'18c: expected 0 vet, got {counts}'

filtered = _filter_by_role(plans, RoleEnum.milker.value, _feeding_role)
assert len(filtered) == 1, f'19a: expected 1 filtered, got {len(filtered)}'
assert filtered[0].cattle_group == 'test15', f'19b: expected test15, got {filtered[0].cattle_group}'

all_items = [p14_draft, p15_approved, r16, r17]
all_counts = _count_by_role(all_items, lambda x: _feeding_role(x) if hasattr(x, 'cattle_group') else _req_role(x))
assert all_counts[RoleEnum.ranch_supervisor.value] == 2, f'20a: expected 2 sup, got {all_counts}'
assert all_counts[RoleEnum.milker.value] == 1, f'20b: expected 1 mlk, got {all_counts}'
print('14-20. role-helper-functions PASS')

all_active_feeding = [p14_draft, p15_approved]
all_incomplete_req = [r16, r17]
item = '  □ 饲喂计划 #999 test15: 等待开始执行'
role21 = _action_item_role(item, all_active_feeding, all_incomplete_req)
assert role21 is None, f'21a: expected None (id 999 not found), got {role21}'
item = '  □ 饲喂计划 #{} test15: 等待开始执行'.format(p15_approved.id)
role21b = _action_item_role(item, all_active_feeding, all_incomplete_req)
assert role21b == RoleEnum.milker.value, f'21b: expected milker, got {role21b}'
item = '  □ 领用单 #{} test16: 等待审批'.format(r16.id)
role21c = _action_item_role(item, all_active_feeding, all_incomplete_req)
assert role21c == RoleEnum.ranch_supervisor.value, f'21c: expected ranch_supervisor, got {role21c}'
print('21. action-item-role PASS')

print('ALL TESTS PASSED')
close_session()
if os.path.exists(test_db):
    os.remove(test_db)
