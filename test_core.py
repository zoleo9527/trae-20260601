#!/usr/bin/env python3
import os
import sys
from ranch_handover.models import *
from ranch_handover.state_machine import transition_requisition, transition_feeding, check_feeding_completion
from ranch_handover.database import get_session, close_session

test_db = '/tmp/test_ranch_handover.db'
if os.path.exists(test_db):
    os.remove(test_db)

from ranch_handover.models import init_engine
engine = init_engine(test_db)

from ranch_handover.database import _scoped
if _scoped is not None:
    _scoped.remove()

from ranch_handover import database
database._engine = engine
database._session_factory = database.sessionmaker(bind=engine)
database._scoped = database.scoped_session(database._session_factory)

session = get_session()
Base.metadata.create_all(engine)

s1 = Staff(name='sup', role='sup', shift='d')
s2 = Staff(name='mlk', role='mlk', shift='d')
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
    unit='kg', status=RequisitionStatus.issuing.value, requested_by=s2.id,
)
session.add(r)
session.commit()

ok, msg = transition_requisition(r, RequisitionStatus.delayed.value, 'mlk', 'mlk', 'out of stock')
session = get_session()
p = session.query(FeedingPlan).get(p.id)
assert p.status == FeedingPlanStatus.blocked.value, f'auto-block: expected blocked, got {p.status}'
assert p.blocking_requisition_id == r.id, f'auto-block: expected req id {r.id}, got {p.blocking_requisition_id}'
print('1. auto-block PASS')

r = session.query(InventoryRequisition).get(r.id)
ok, msg = transition_requisition(r, RequisitionStatus.issuing.value, 'mlk', 'mlk')
session = get_session()
p = session.query(FeedingPlan).get(p.id)
assert p.status == FeedingPlanStatus.in_progress.value, f'auto-unblock: expected in_progress, got {p.status}'
assert p.blocking_requisition_id is None, f'auto-unblock: expected None, got {p.blocking_requisition_id}'
print('2. auto-unblock PASS')

ok, msg = check_feeding_completion(p, session)
assert not ok, 'completion-blocked: should be blocked by incomplete req'
print('3. completion-blocked PASS')

r = session.query(InventoryRequisition).get(r.id)
r.status = RequisitionStatus.completed.value
r2 = InventoryRequisition(
    feeding_plan_id=p.id, item_name='hay', quantity_requested=30,
    unit='kg', status=RequisitionStatus.completed.value, requested_by=s2.id,
)
session.add(r2)
session.commit()

ok, msg = transition_feeding(p, FeedingPlanStatus.completed.value, 'sup', 'sup')
assert ok, f'completion: should succeed, got {msg}'
print('4. completion PASS')

print('ALL TESTS PASSED')

close_session()
if os.path.exists(test_db):
    os.remove(test_db)
