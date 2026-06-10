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

print('ALL TESTS PASSED')
close_session()
if os.path.exists(test_db):
    os.remove(test_db)
