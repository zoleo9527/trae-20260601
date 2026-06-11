from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Customer,
    FollowUpRecord,
    OwnershipRecord,
    OwnershipStatus,
    OWNERSHIP_STATUS_LABELS,
    ROLE_LABELS,
    Subscription,
    User,
    UserRole,
    VisitRegistration,
    VisitStatus,
    VISIT_STATUS_LABELS,
)
from ..schemas import (
    OwnershipConfirm,
    OwnershipCreate,
    OwnershipDetail,
    OwnershipDispute,
    OwnershipOut,
    OwnershipResolve,
    SubscriptionCreate,
    SubscriptionOut,
)
from ..utils import gen_subscription_no

router = APIRouter(prefix="/api", tags=["认购与客户归属"])


def _decorate_ownership(o: OwnershipRecord, db: Session) -> OwnershipDetail:
    out = OwnershipDetail.model_validate(o)
    out.status_label = OWNERSHIP_STATUS_LABELS.get(o.status, "")
    if o.claimed_agent:
        out.claimed_agent_name = o.claimed_agent.full_name
    if o.confirm_agent:
        out.confirm_agent_name = o.confirm_agent.full_name
    if o.visit:
        out.visit_no = o.visit.visit_no
        out.visit_time = o.visit.visit_time
    if o.customer:
        out.customer_name = o.customer.name
        out.customer_phone = o.customer.phone
    if o.subscription_id:
        sub = db.query(Subscription).filter(Subscription.id == o.subscription_id).first()
        if sub:
            out.subscription_no = sub.subscription_no
            out.room_info = f"{sub.building_no}-{sub.unit_no}-{sub.room_no}"
    return out


# ========================= 认购单 =========================


@router.post("/subscriptions", response_model=SubscriptionOut, summary="4. 创建认购单（自动触发归属流程）")
def create_subscription(data: SubscriptionCreate, db: Session = Depends(get_db)):
    visit = db.query(VisitRegistration).filter(VisitRegistration.id == data.visit_id).first()
    if not visit:
        raise HTTPException(404, "来访登记不存在")
    if visit.customer_id != data.customer_id:
        raise HTTPException(400, "客户与来访登记不匹配")

    creator = db.query(User).filter(User.id == data.created_by).first()
    if not creator:
        raise HTTPException(400, "创建人不存在")
    if creator.role != UserRole.CONTROLLER:
        raise HTTPException(403, "仅销控专员可创建认购单")
    if not visit.assigned_agent_id:
        raise HTTPException(400, "该来访尚未分配置业顾问，不能创建认购单")
    follow_count = db.query(FollowUpRecord).filter(FollowUpRecord.visit_id == visit.id).count()
    if follow_count == 0:
        raise HTTPException(400, "该来访无跟进记录，不能创建认购单（请先由分配顾问提交跟进）")

    sub = Subscription(
        subscription_no=gen_subscription_no(),
        visit_id=data.visit_id,
        customer_id=data.customer_id,
        building_no=data.building_no,
        unit_no=data.unit_no,
        room_no=data.room_no,
        area=data.area,
        total_price=data.total_price,
        deposit_amount=data.deposit_amount,
        subscription_date=data.subscription_date or datetime.utcnow(),
        remark=data.remark,
        created_by=data.created_by,
    )
    db.add(sub)

    if visit.status not in (VisitStatus.SUBSCRIBED, VisitStatus.LOST):
        visit.status = VisitStatus.SUBSCRIBED
    db.flush()

    existing = db.query(OwnershipRecord).filter(OwnershipRecord.visit_id == data.visit_id).first()
    if not existing and visit.assigned_agent_id:
        own = OwnershipRecord(
            visit_id=visit.id,
            customer_id=visit.customer_id,
            subscription_id=sub.id,
            claimed_agent_id=visit.assigned_agent_id,
            status=OwnershipStatus.PENDING,
            ownership_reason="认购后自动生成，待销控专员确认",
        )
        db.add(own)

    db.commit()
    db.refresh(sub)
    return SubscriptionOut.model_validate(sub)


@router.get("/subscriptions", response_model=List[SubscriptionOut], summary="认购单列表")
def list_subscriptions(
    customer_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Subscription)
    if customer_id:
        q = q.filter(Subscription.customer_id == customer_id)
    if agent_id:
        q = q.join(VisitRegistration, VisitRegistration.id == Subscription.visit_id).filter(
            VisitRegistration.assigned_agent_id == agent_id
        )
    subs = q.order_by(Subscription.subscription_date.desc()).all()
    return [SubscriptionOut.model_validate(s) for s in subs]


# ========================= 客户归属 =========================


@router.post("/ownerships", status_code=410, summary="[已停用] 客户归属只由认购单自动触发，不再支持手动创建")
def create_ownership(data: OwnershipCreate, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=410,
        detail="该接口已停用。客户归属仅在创建认购单（POST /api/subscriptions）时自动生成，不允许手动创建。",
    )


@router.get("/ownerships", response_model=List[OwnershipDetail], summary="5. 客户归属回看查询")
def list_ownerships(
    status: Optional[OwnershipStatus] = Query(None),
    claimed_agent_id: Optional[int] = Query(None),
    confirm_agent_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(OwnershipRecord)
    if status:
        q = q.filter(OwnershipRecord.status == status)
    if claimed_agent_id:
        q = q.filter(OwnershipRecord.claimed_agent_id == claimed_agent_id)
    if confirm_agent_id:
        q = q.filter(OwnershipRecord.confirm_agent_id == confirm_agent_id)
    if start_date:
        q = q.filter(OwnershipRecord.created_at >= start_date)
    if end_date:
        q = q.filter(OwnershipRecord.created_at <= end_date)
    if keyword:
        q = q.join(Customer).filter(
            (Customer.name.like(f"%{keyword}%")) | (Customer.phone.like(f"%{keyword}%"))
        )
    items = q.order_by(OwnershipRecord.created_at.desc()).all()
    return [_decorate_ownership(o, db) for o in items]


@router.get("/ownerships/{ownership_id}", response_model=OwnershipDetail, summary="客户归属详情")
def get_ownership(ownership_id: int, db: Session = Depends(get_db)):
    o = db.query(OwnershipRecord).filter(OwnershipRecord.id == ownership_id).first()
    if not o:
        raise HTTPException(404, "归属记录不存在")
    return _decorate_ownership(o, db)


@router.post("/ownerships/{ownership_id}/confirm", response_model=OwnershipDetail, summary="6. 销控专员确认客户归属")
def confirm_ownership(ownership_id: int, data: OwnershipConfirm, db: Session = Depends(get_db)):
    o = db.query(OwnershipRecord).filter(OwnershipRecord.id == ownership_id).first()
    if not o:
        raise HTTPException(404, "归属记录不存在")
    if o.status != OwnershipStatus.PENDING:
        raise HTTPException(
            400,
            f"当前状态为{OWNERSHIP_STATUS_LABELS.get(o.status)}，仅待确认(pending)状态可执行确认操作；"
            f"争议状态请使用裁决接口(/resolve)。",
        )

    confirmer = db.query(User).filter(User.id == data.confirmed_by, User.role == UserRole.CONTROLLER).first()
    if not confirmer:
        raise HTTPException(400, "确认人必须是销控专员")

    final_agent_id = data.confirm_agent_id or o.claimed_agent_id
    agent = db.query(User).filter(User.id == final_agent_id, User.role == UserRole.AGENT).first()
    if not agent:
        raise HTTPException(400, "最终归属顾问不存在")

    o.confirm_agent_id = final_agent_id
    o.confirmed_by = data.confirmed_by
    o.confirmed_at = datetime.utcnow()
    o.status = OwnershipStatus.CONFIRMED
    o.commission_amount = data.commission_amount
    o.commission_ratio = data.commission_ratio

    visit = db.query(VisitRegistration).filter(VisitRegistration.id == o.visit_id).first()
    if visit and visit.assigned_agent_id != final_agent_id:
        visit.assigned_agent_id = final_agent_id

    db.commit()
    db.refresh(o)
    return _decorate_ownership(o, db)


@router.post("/ownerships/{ownership_id}/dispute", response_model=OwnershipDetail, summary="提出归属争议")
def dispute_ownership(ownership_id: int, data: OwnershipDispute, db: Session = Depends(get_db)):
    o = db.query(OwnershipRecord).filter(OwnershipRecord.id == ownership_id).first()
    if not o:
        raise HTTPException(404, "归属记录不存在")
    if o.status != OwnershipStatus.CONFIRMED:
        raise HTTPException(400, "仅已确认归属可提出争议")

    o.disputed_at = datetime.utcnow()
    o.status = OwnershipStatus.DISPUTED
    o.dispute_reason = data.dispute_reason
    db.commit()
    db.refresh(o)
    return _decorate_ownership(o, db)


@router.post("/ownerships/{ownership_id}/resolve", response_model=OwnershipDetail, summary="裁决归属争议")
def resolve_ownership(ownership_id: int, data: OwnershipResolve, db: Session = Depends(get_db)):
    o = db.query(OwnershipRecord).filter(OwnershipRecord.id == ownership_id).first()
    if not o:
        raise HTTPException(404, "归属记录不存在")
    if o.status != OwnershipStatus.DISPUTED:
        raise HTTPException(400, "仅争议状态可裁决")

    resolver = db.query(User).filter(User.id == data.resolved_by, User.role == UserRole.MANAGER).first()
    if not resolver:
        raise HTTPException(400, "裁决人必须是案场经理")

    agent = db.query(User).filter(User.id == data.confirm_agent_id, User.role == UserRole.AGENT).first()
    if not agent:
        raise HTTPException(400, "裁决归属的顾问不存在")

    o.confirm_agent_id = data.confirm_agent_id
    o.status = OwnershipStatus.RESOLVED
    o.resolve_reason = data.resolve_reason
    o.resolved_at = datetime.utcnow()
    o.commission_amount = data.commission_amount
    o.commission_ratio = data.commission_ratio

    visit = db.query(VisitRegistration).filter(VisitRegistration.id == o.visit_id).first()
    if visit and visit.assigned_agent_id != data.confirm_agent_id:
        visit.assigned_agent_id = data.confirm_agent_id

    db.commit()
    db.refresh(o)
    return _decorate_ownership(o, db)
