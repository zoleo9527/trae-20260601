from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Order, OrderItem, OrderStatus, FlowerMaterial, UserRole,
    AnomalyRecord, AnomalyType, AnomalySeverity, AnomalyStatus,
    VALID_TRANSITIONS,
)
from app.schemas import (
    OrderCreate, OrderRead, OrderReadDetail, OrderStatusUpdate,
    OrderItemReadWithMaterial,
)
from app.auth import get_current_user, florist_or_admin, delivery_or_admin
from app.errors import ErrorCode, ERROR_MESSAGES

router = APIRouter(prefix="/orders", tags=["订单制作"])

ROLE_STATUS_TRANSITIONS = {
    UserRole.FLORIST: {
        OrderStatus.PENDING: {OrderStatus.IN_PRODUCTION},
        OrderStatus.IN_PRODUCTION: {OrderStatus.PRODUCED},
        OrderStatus.PRODUCED: {OrderStatus.INSPECTING},
        OrderStatus.REWORK: {OrderStatus.IN_PRODUCTION},
    },
    UserRole.DELIVERY: {
        OrderStatus.PASSED: {OrderStatus.DELIVERING},
        OrderStatus.DELIVERING: {OrderStatus.DELIVERED},
    },
    UserRole.INSPECTOR: {},
}


def _generate_order_no(db: Session) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"FL{today}"
    last = (
        db.query(Order)
        .filter(Order.order_no.like(f"{prefix}%"))
        .order_by(Order.id.desc())
        .first()
    )
    seq = 1
    if last and last.order_no.startswith(prefix):
        try:
            seq = int(last.order_no[len(prefix):]) + 1
        except ValueError:
            seq = 1
    return f"{prefix}{seq:03d}"


def _check_substitution_anomalies(order: Order, db: Session):
    for item in order.items:
        if item.is_substituted and not item.substitution_reason:
            existing = (
                db.query(AnomalyRecord)
                .filter(
                    AnomalyRecord.order_id == order.id,
                    AnomalyRecord.anomaly_type == AnomalyType.MATERIAL_SUBSTITUTION_UNEXPLAINED,
                )
                .first()
            )
            if not existing:
                anomaly = AnomalyRecord(
                    order_id=order.id,
                    anomaly_type=AnomalyType.MATERIAL_SUBSTITUTION_UNEXPLAINED,
                    description=f"订单{order.order_no}花材{item.material.name if item.material else ''}被替换但未填写替换原因",
                    severity=AnomalySeverity.MEDIUM,
                    status=AnomalyStatus.OPEN,
                    created_by=order.created_by,
                )
                db.add(anomaly)


@router.post("", response_model=OrderRead, status_code=201)
def create_order(body: OrderCreate, db: Session = Depends(get_db), current_user=Depends(florist_or_admin)):
    order_no = _generate_order_no(db)
    order = Order(
        order_no=order_no,
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        delivery_address=body.delivery_address,
        greeting_card_text=body.greeting_card_text,
        greeting_card_verified=False,
        promised_delivery_time=body.promised_delivery_time,
        status=OrderStatus.PENDING,
        created_by=current_user.id,
    )
    db.add(order)
    db.flush()

    for item_data in body.items:
        material = db.query(FlowerMaterial).filter(FlowerMaterial.id == item_data.material_id).first()
        if not material:
            raise HTTPException(status_code=400, detail={"code": ErrorCode.NOT_FOUND, "message": f"花材ID {item_data.material_id} 不存在"})
        item = OrderItem(
            order_id=order.id,
            material_id=item_data.material_id,
            planned_qty=item_data.planned_qty,
            actual_qty=item_data.actual_qty,
            is_substituted=item_data.is_substituted,
            substituted_with=item_data.substituted_with,
            substitution_reason=item_data.substitution_reason,
        )
        db.add(item)

    db.flush()
    db.refresh(order)
    _check_substitution_anomalies(order, db)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderRead])
def list_orders(
    status: Optional[OrderStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Order).options(joinedload(Order.items))
    if status:
        q = q.filter(Order.status == status)
    return q.order_by(Order.id.desc()).all()


@router.get("/{order_id}", response_model=OrderReadDetail)
def get_order(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.material),
            joinedload(Order.inspections),
            joinedload(Order.anomalies),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})
    result = OrderReadDetail.model_validate(order)
    enriched_items = []
    for item in order.items:
        item_dict = OrderItemReadWithMaterial.model_validate(item).model_dump()
        item_dict["material_name"] = item.material.name if item.material else None
        enriched_items.append(item_dict)
    result.items = enriched_items
    return result


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, body: OrderStatusUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})

    new_status = body.status
    if new_status not in VALID_TRANSITIONS.get(order.status, set()):
        raise HTTPException(
            status_code=409,
            detail={
                "code": ErrorCode.STATE_TRANSITION_INVALID,
                "message": f"{ERROR_MESSAGES[ErrorCode.STATE_TRANSITION_INVALID]}: {order.status.value} -> {new_status.value}",
            },
        )

    if current_user.role != UserRole.ADMIN:
        role_transitions = ROLE_STATUS_TRANSITIONS.get(current_user.role, {})
        allowed_targets = role_transitions.get(order.status, set())
        if new_status not in allowed_targets:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": ErrorCode.STATUS_ROLE_DENIED,
                    "message": f"{ERROR_MESSAGES[ErrorCode.STATUS_ROLE_DENIED]}: {current_user.role.value} 不可将订单从 {order.status.value} 变更为 {new_status.value}",
                },
            )

    order.status = new_status
    order.updated_at = datetime.utcnow()

    if new_status == OrderStatus.DELIVERED:
        order.actual_delivery_time = datetime.utcnow()
        if order.actual_delivery_time > order.promised_delivery_time:
            existing = (
                db.query(AnomalyRecord)
                .filter(
                    AnomalyRecord.order_id == order.id,
                    AnomalyRecord.anomaly_type == AnomalyType.DELIVERY_TIMEOUT,
                )
                .first()
            )
            if not existing:
                delay = (order.actual_delivery_time - order.promised_delivery_time).total_seconds() / 60
                anomaly = AnomalyRecord(
                    order_id=order.id,
                    anomaly_type=AnomalyType.DELIVERY_TIMEOUT,
                    description=f"订单{order.order_no}配送超时{delay:.0f}分钟",
                    severity=AnomalySeverity.HIGH if delay > 60 else AnomalySeverity.MEDIUM,
                    status=AnomalyStatus.OPEN,
                    created_by=current_user.id,
                )
                db.add(anomaly)

    if new_status == OrderStatus.PRODUCED:
        _check_substitution_anomalies(order, db)

    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/items/{item_id}/substitution", response_model=OrderRead)
def update_item_substitution(
    order_id: int,
    item_id: int,
    is_substituted: bool,
    substituted_with: Optional[str] = None,
    substitution_reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(florist_or_admin),
):
    item = db.query(OrderItem).filter(OrderItem.id == item_id, OrderItem.order_id == order_id).first()
    if not item:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})

    order = db.query(Order).filter(Order.id == order_id).first()
    if order.status not in (OrderStatus.PENDING, OrderStatus.IN_PRODUCTION, OrderStatus.REWORK):
        raise HTTPException(status_code=409, detail={"code": ErrorCode.STATE_TRANSITION_INVALID, "message": "当前订单状态不允许修改花材"})

    item.is_substituted = is_substituted
    item.substituted_with = substituted_with
    item.substitution_reason = substitution_reason

    if is_substituted and not substitution_reason:
        anomaly = AnomalyRecord(
            order_id=order_id,
            anomaly_type=AnomalyType.MATERIAL_SUBSTITUTION_UNEXPLAINED,
            description=f"订单{order.order_no}花材替换未填写原因",
            severity=AnomalySeverity.MEDIUM,
            status=AnomalyStatus.OPEN,
            created_by=current_user.id,
        )
        db.add(anomaly)

    if is_substituted and substitution_reason:
        db.query(AnomalyRecord).filter(
            AnomalyRecord.order_id == order_id,
            AnomalyRecord.anomaly_type == AnomalyType.MATERIAL_SUBSTITUTION_UNEXPLAINED,
            AnomalyRecord.status == AnomalyStatus.OPEN,
        ).update({"status": AnomalyStatus.RESOLVED, "resolved_by": current_user.id, "resolved_at": datetime.utcnow(), "resolution_note": "已补填替换原因"})

    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/card-verify", response_model=OrderRead)
def verify_greeting_card(order_id: int, db: Session = Depends(get_db), current_user=Depends(florist_or_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail={"code": ErrorCode.NOT_FOUND, "message": ERROR_MESSAGES[ErrorCode.NOT_FOUND]})
    order.greeting_card_verified = True
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/anomalies", response_model=list)
def get_order_anomalies(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.schemas import AnomalyRecordRead
    anomalies = db.query(AnomalyRecord).filter(AnomalyRecord.order_id == order_id).order_by(AnomalyRecord.id.desc()).all()
    return anomalies
