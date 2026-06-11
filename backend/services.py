from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime
import uuid
import models
import schemas


ROLE_COUNTER_MANAGER = "counter_manager"
ROLE_FLOOR_SUPERVISOR = "floor_supervisor"
ROLE_BRAND_SUPERVISOR = "brand_supervisor"

STATUS_PENDING = "pending"
STATUS_APPROVED = "approved"
STATUS_REJECTED = "rejected"
STATUS_MODIFIED = "modified"
STATUS_SHIPPED = "shipped"
STATUS_REVIEWED = "reviewed"
STATUS_DISPUTED = "disputed"


def generate_allocation_no() -> str:
    return f"DB{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


def generate_review_no() -> str:
    return f"FH{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_allocation(db: Session, allocation: schemas.GoodsAllocationCreate, creator_id: int):
    existing = db.query(models.GoodsAllocation).filter(
        models.GoodsAllocation.idempotent_key == allocation.idempotent_key
    ).first()
    if existing:
        return existing, False

    db_allocation = models.GoodsAllocation(
        **allocation.model_dump(exclude={"idempotent_key"}),
        idempotent_key=allocation.idempotent_key,
        allocation_no=generate_allocation_no(),
        status=STATUS_PENDING,
        version=1,
        is_modified=False,
        created_by=creator_id,
    )
    db.add(db_allocation)
    db.commit()
    db.refresh(db_allocation)
    return db_allocation, True


def update_allocation(db: Session, allocation_id: int, update_data: schemas.GoodsAllocationUpdate, operator_id: int):
    db_allocation = db.query(models.GoodsAllocation).filter(
        models.GoodsAllocation.id == allocation_id
    ).first()
    if not db_allocation:
        return None, "调拨单不存在"

    if db_allocation.version != update_data.version:
        return None, f"版本冲突，当前版本为 {db_allocation.version}，请刷新后重试"

    changed_fields = []
    update_dict = update_data.model_dump(exclude={"change_reason", "version"}, exclude_unset=True)

    for field, new_value in update_dict.items():
        old_value = getattr(db_allocation, field)
        if str(old_value) != str(new_value):
            log = models.AllocationChangeLog(
                allocation_id=db_allocation.id,
                field_name=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
                change_reason=update_data.change_reason,
                operated_by=operator_id,
                operated_at=datetime.now(),
            )
            db.add(log)
            setattr(db_allocation, field, new_value)
            changed_fields.append(field)

    if not changed_fields:
        return db_allocation, None

    db_allocation.version += 1
    db_allocation.is_modified = True
    db_allocation.last_modified_at = datetime.now()
    db_allocation.updated_by = operator_id
    if db_allocation.status not in (STATUS_SHIPPED, STATUS_REVIEWED, STATUS_DISPUTED):
        db_allocation.status = STATUS_MODIFIED

    for review in db_allocation.reviews:
        review.has_allocation_modified = True

    db.commit()
    db.refresh(db_allocation)
    return db_allocation, None


def approve_allocation(db: Session, allocation_id: int, approver_id: int, approver_role: str):
    db_allocation = db.query(models.GoodsAllocation).filter(
        models.GoodsAllocation.id == allocation_id
    ).first()
    if not db_allocation:
        return None, "调拨单不存在"

    if approver_role == ROLE_FLOOR_SUPERVISOR:
        if db_allocation.status not in (STATUS_PENDING, STATUS_MODIFIED):
            return None, f"当前状态 {db_allocation.status} 无法审批"
        db_allocation.status = STATUS_APPROVED
    elif approver_role == ROLE_BRAND_SUPERVISOR:
        if db_allocation.status != STATUS_APPROVED:
            return None, f"当前状态 {db_allocation.status} 无法审批，请先通过楼层主管审批"
        db_allocation.status = STATUS_SHIPPED
    else:
        return None, "无审批权限"

    db_allocation.updated_by = approver_id
    db.commit()
    db.refresh(db_allocation)
    return db_allocation, None


def get_allocation(db: Session, allocation_id: int):
    return db.query(models.GoodsAllocation).filter(models.GoodsAllocation.id == allocation_id).first()


def list_allocations(
    db: Session,
    status: str = None,
    brand: str = None,
    floor: str = None,
    is_modified: bool = None,
    skip: int = 0,
    limit: int = 50,
):
    query = db.query(models.GoodsAllocation)
    if status:
        query = query.filter(models.GoodsAllocation.status == status)
    if brand:
        query = query.filter(models.GoodsAllocation.brand == brand)
    if floor:
        query = query.filter(models.GoodsAllocation.floor == floor)
    if is_modified is not None:
        query = query.filter(models.GoodsAllocation.is_modified == is_modified)
    return query.order_by(desc(models.GoodsAllocation.created_at)).offset(skip).limit(limit).all()


def create_review(db: Session, review: schemas.CabinetReviewCreate, reviewer_id: int):
    db_allocation = db.query(models.GoodsAllocation).filter(
        models.GoodsAllocation.id == review.allocation_id
    ).first()
    if not db_allocation:
        return None, "调拨单不存在"

    if db_allocation.status != STATUS_SHIPPED:
        return None, f"调拨单状态为 {db_allocation.status}，尚未发货，无法到柜复核"

    existing_review = db.query(models.CabinetReview).filter(
        and_(
            models.CabinetReview.allocation_id == review.allocation_id,
            models.CabinetReview.review_status.in_([STATUS_PENDING, STATUS_REVIEWED])
        )
    ).first()
    if existing_review:
        return None, "该调拨单已有复核记录"

    has_modified = db_allocation.is_modified
    if has_modified and not review.modification_acknowledged:
        return None, "该调拨单在审核后被修改，请先确认已知晓变更内容"

    if review.actual_quantity == db_allocation.quantity:
        review_status = STATUS_REVIEWED
    else:
        review_status = STATUS_DISPUTED

    db_review = models.CabinetReview(
        **review.model_dump(),
        review_no=generate_review_no(),
        review_status=review_status,
        has_allocation_modified=has_modified,
        reviewed_by=reviewer_id,
        reviewed_at=datetime.now(),
    )
    db.add(db_review)

    if review_status == STATUS_REVIEWED:
        db_allocation.status = STATUS_REVIEWED

    db.commit()
    db.refresh(db_review)
    return db_review, None


def get_review(db: Session, review_id: int):
    return db.query(models.CabinetReview).filter(models.CabinetReview.id == review_id).first()


def get_review_by_allocation(db: Session, allocation_id: int):
    return db.query(models.CabinetReview).filter(
        models.CabinetReview.allocation_id == allocation_id
    ).first()


def list_pending_reviews(db: Session, counter: str = None, skip: int = 0, limit: int = 50):
    query = db.query(models.GoodsAllocation).filter(
        models.GoodsAllocation.status == STATUS_SHIPPED
    )
    if counter:
        query = query.filter(models.GoodsAllocation.to_counter == counter)
    return query.order_by(desc(models.GoodsAllocation.created_at)).offset(skip).limit(limit).all()


def get_review_timeline(
    db: Session,
    brand: str = None,
    floor: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 50,
):
    query = db.query(models.GoodsAllocation)
    if brand:
        query = query.filter(models.GoodsAllocation.brand == brand)
    if floor:
        query = query.filter(models.GoodsAllocation.floor == floor)
    if status:
        query = query.filter(models.GoodsAllocation.status == status)

    allocations = query.order_by(desc(models.GoodsAllocation.created_at)).offset(skip).limit(limit).all()
    timeline = []

    for alloc in allocations:
        review = get_review_by_allocation(db, alloc.id)
        modified_by_name = None
        if alloc.updated_by:
            updater = get_user(db, alloc.updated_by)
            if updater:
                modified_by_name = updater.name

        item = schemas.ReviewTimelineItem(
            allocation_id=alloc.id,
            allocation_no=alloc.allocation_no,
            goods_name=alloc.goods_name,
            goods_code=alloc.goods_code,
            expected_quantity=alloc.quantity,
            actual_quantity=review.actual_quantity if review else None,
            allocation_status=alloc.status,
            review_status=review.review_status if review else STATUS_PENDING,
            is_modified=alloc.is_modified,
            has_allocation_modified=review.has_allocation_modified if review else alloc.is_modified,
            modification_acknowledged=review.modification_acknowledged if review else False,
            last_modified_at=alloc.last_modified_at,
            modified_by=modified_by_name,
            change_count=len(alloc.change_logs),
            created_at=alloc.created_at,
            reviewed_at=review.reviewed_at if review else None,
        )
        timeline.append(item)

    return timeline
