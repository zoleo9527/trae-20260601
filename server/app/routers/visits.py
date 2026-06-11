from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Customer,
    FollowUpRecord,
    OwnershipRecord,
    ROLE_LABELS,
    Subscription,
    User,
    UserRole,
    VisitRegistration,
    VisitStatus,
    VisitType,
    VISIT_STATUS_LABELS,
    VISIT_TYPE_LABELS,
)
from ..schemas import FollowUpCreate, FollowUpOut, VisitAssign, VisitCreate, VisitDetail, VisitOut
from ..utils import gen_visit_no

router = APIRouter(prefix="/api/visits", tags=["来访登记主链路"])


def _decorate_visit_out(v: VisitRegistration, db: Session) -> VisitDetail:
    out = VisitDetail.model_validate(v)
    out.visit_type_label = VISIT_TYPE_LABELS.get(v.visit_type, "")
    out.status_label = VISIT_STATUS_LABELS.get(v.status, "")
    if v.customer:
        out.customer_name = v.customer.name
        out.customer_phone = v.customer.phone
    if v.register_user:
        out.register_user_name = v.register_user.full_name
    if v.assigned_agent:
        out.assigned_agent_name = v.assigned_agent.full_name
    out.follow_up_count = db.query(FollowUpRecord).filter(FollowUpRecord.visit_id == v.id).count()
    out.has_subscription = db.query(Subscription).filter(Subscription.visit_id == v.id).first() is not None
    own = db.query(OwnershipRecord).filter(OwnershipRecord.visit_id == v.id).first()
    out.ownership_status = own.status.value if own else None
    return out


@router.post("", response_model=VisitDetail, summary="1. 案场经理提交来访登记")
def create_visit(data: VisitCreate, db: Session = Depends(get_db)):
    register_user = db.query(User).filter(User.id == data.registered_by).first()
    if not register_user:
        raise HTTPException(400, "登记人不存在")
    if register_user.role != UserRole.MANAGER:
        raise HTTPException(403, "仅案场经理可提交来访登记")

    customer = db.query(Customer).filter(Customer.phone == data.customer_phone).first()
    if not customer:
        customer = Customer(
            name=data.customer_name,
            phone=data.customer_phone,
            id_card=data.customer_id_card,
            gender=data.customer_gender,
            source_channel=data.source_channel,
        )
        db.add(customer)
        db.flush()

    visit = VisitRegistration(
        visit_no=gen_visit_no(),
        customer_id=customer.id,
        visit_type=data.visit_type,
        visit_time=data.visit_time or datetime.utcnow(),
        status=VisitStatus.REGISTERED,
        intent_level=data.intent_level,
        interested_house_type=data.interested_house_type,
        accompany_number=data.accompany_number,
        has_agent=data.has_agent,
        agent_name=data.agent_name,
        agent_phone=data.agent_phone,
        registered_by=data.registered_by,
        remark=data.remark,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return _decorate_visit_out(visit, db)


@router.get("", response_model=List[VisitDetail], summary="来访登记列表（可按状态/顾问/时间筛选）")
def list_visits(
    status: Optional[VisitStatus] = Query(None),
    assigned_agent_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(VisitRegistration)
    if status:
        q = q.filter(VisitRegistration.status == status)
    if assigned_agent_id:
        q = q.filter(VisitRegistration.assigned_agent_id == assigned_agent_id)
    if start_date:
        q = q.filter(VisitRegistration.visit_time >= start_date)
    if end_date:
        q = q.filter(VisitRegistration.visit_time <= end_date)
    if keyword:
        q = q.join(Customer).filter(
            (Customer.name.like(f"%{keyword}%")) | (Customer.phone.like(f"%{keyword}%"))
        )
    visits = q.order_by(VisitRegistration.visit_time.desc()).all()
    return [_decorate_visit_out(v, db) for v in visits]


@router.get("/{visit_id}", response_model=VisitDetail, summary="来访登记详情")
def get_visit(visit_id: int, db: Session = Depends(get_db)):
    v = db.query(VisitRegistration).filter(VisitRegistration.id == visit_id).first()
    if not v:
        raise HTTPException(404, "来访登记不存在")
    return _decorate_visit_out(v, db)


@router.post("/{visit_id}/assign", response_model=VisitDetail, summary="2. 案场经理分配置业顾问")
def assign_agent(visit_id: int, data: VisitAssign, db: Session = Depends(get_db)):
    visit = db.query(VisitRegistration).filter(VisitRegistration.id == visit_id).first()
    if not visit:
        raise HTTPException(404, "来访登记不存在")

    agent = db.query(User).filter(User.id == data.assigned_agent_id, User.role == UserRole.AGENT).first()
    if not agent:
        raise HTTPException(400, "置业顾问不存在或角色错误")

    assigner = db.query(User).filter(User.id == data.assigned_by).first()
    if not assigner:
        raise HTTPException(400, "操作人不存在")
    if assigner.role != UserRole.MANAGER:
        raise HTTPException(403, "仅案场经理可分配置业顾问")

    visit.assigned_agent_id = data.assigned_agent_id
    visit.assigned_at = datetime.utcnow()
    visit.assigned_by = data.assigned_by
    if visit.status == VisitStatus.REGISTERED:
        visit.status = VisitStatus.ASSIGNED
    db.commit()
    db.refresh(visit)
    return _decorate_visit_out(visit, db)


@router.post("/{visit_id}/follow-ups", response_model=FollowUpOut, summary="3. 置业顾问提交跟进记录")
def create_follow_up(visit_id: int, data: FollowUpCreate, db: Session = Depends(get_db)):
    visit = db.query(VisitRegistration).filter(VisitRegistration.id == visit_id).first()
    if not visit:
        raise HTTPException(404, "来访登记不存在")
    if visit.assigned_agent_id != data.agent_id:
        raise HTTPException(400, "该顾问不是此客户的分配顾问，无权跟进")
    if visit.status not in (VisitStatus.ASSIGNED, VisitStatus.FOLLOWING):
        raise HTTPException(400, f"当前状态为{VISIT_STATUS_LABELS.get(visit.status)}，不可跟进")

    agent = db.query(User).filter(User.id == data.agent_id).first()
    fu = FollowUpRecord(
        visit_id=visit_id,
        customer_id=visit.customer_id,
        agent_id=data.agent_id,
        follow_channel=data.follow_channel,
        content=data.content,
        next_follow_plan=data.next_follow_plan,
        next_follow_time=data.next_follow_time,
        customer_response=data.customer_response,
    )
    db.add(fu)
    if visit.status == VisitStatus.ASSIGNED:
        visit.status = VisitStatus.FOLLOWING
    db.commit()
    db.refresh(fu)
    out = FollowUpOut.model_validate(fu)
    out.agent_name = agent.full_name if agent else ""
    return out


@router.get("/{visit_id}/follow-ups", response_model=List[FollowUpOut], summary="获取某来访的跟进记录")
def list_follow_ups(visit_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(FollowUpRecord)
        .filter(FollowUpRecord.visit_id == visit_id)
        .order_by(FollowUpRecord.follow_time.desc())
        .all()
    )
    result = []
    for fu in items:
        out = FollowUpOut.model_validate(fu)
        if fu.agent:
            out.agent_name = fu.agent.full_name
        result.append(out)
    return result
