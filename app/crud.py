from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import Optional, Tuple
from app import models, schemas
from app.models import RentalStatus, EquipmentStatus, UserRole

VALID_TRANSITIONS: dict[RentalStatus, dict[RentalStatus, list[UserRole]]] = {
    RentalStatus.PENDING: {
        RentalStatus.CONFIRMED: [UserRole.EQUIPMENT_ADMIN],
        RentalStatus.CANCELLED: [UserRole.STORE_CLERK, UserRole.EQUIPMENT_ADMIN],
    },
    RentalStatus.CONFIRMED: {
        RentalStatus.DEPOSIT_FROZEN: [UserRole.FINANCE],
        RentalStatus.CANCELLED: [UserRole.EQUIPMENT_ADMIN, UserRole.STORE_CLERK],
    },
    RentalStatus.DEPOSIT_FROZEN: {
        RentalStatus.PICKED_UP: [UserRole.STORE_CLERK],
        RentalStatus.CANCELLED: [UserRole.EQUIPMENT_ADMIN],
    },
    RentalStatus.PICKED_UP: {
        RentalStatus.RETURNED: [UserRole.STORE_CLERK],
    },
    RentalStatus.RETURNED: {
        RentalStatus.DEPOSIT_REFUNDED: [UserRole.FINANCE],
        RentalStatus.DEPOSIT_DEDUCTED: [UserRole.FINANCE],
    },
    RentalStatus.DEPOSIT_REFUNDED: {},
    RentalStatus.DEPOSIT_DEDUCTED: {},
    RentalStatus.CANCELLED: {},
}

def validate_transition(current_status: RentalStatus, new_status: RentalStatus, user_role: UserRole) -> Tuple[bool, Optional[str]]:
    if current_status == new_status:
        return False, f"状态未变更，当前已是 {current_status.value}"
    allowed_map = VALID_TRANSITIONS.get(current_status)
    if allowed_map is None:
        return False, f"当前状态 {current_status.value} 不允许任何变更"
    allowed_roles = allowed_map.get(new_status)
    if allowed_roles is None:
        return False, f"不允许从 {current_status.value} 变更为 {new_status.value}"
    if user_role not in allowed_roles:
        role_names = "、".join(r.value for r in allowed_roles)
        return False, f"角色 {user_role.value} 无权将状态从 {current_status.value} 变更为 {new_status.value}，需要角色: {role_names}"
    return True, None

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users_by_role(db: Session, role: UserRole):
    return db.query(models.User).filter(models.User.role == role).all()

def create_equipment(db: Session, equipment: schemas.EquipmentCreate):
    db_equipment = models.Equipment(**equipment.model_dump())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

def get_equipment(db: Session, equipment_id: int):
    return db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()

def get_equipments(db: Session, skip: int = 0, limit: int = 100, status: EquipmentStatus = None):
    query = db.query(models.Equipment)
    if status:
        query = query.filter(models.Equipment.status == status)
    return query.offset(skip).limit(limit).all()

def update_equipment_status(db: Session, equipment_id: int, status: EquipmentStatus):
    equipment = get_equipment(db, equipment_id)
    if equipment:
        equipment.status = status
        db.commit()
        db.refresh(equipment)
    return equipment

def calculate_total_amount(start_date: datetime, end_date: datetime, daily_rate: float) -> float:
    days = (end_date.date() - start_date.date()).days
    if days <= 0:
        days = 1
    return days * daily_rate

def create_rental_record(db: Session, rental: schemas.RentalRecordCreate, user_id: int):
    equipment = get_equipment(db, rental.equipment_id)
    if not equipment:
        return None
    
    total_amount = calculate_total_amount(rental.start_date, rental.end_date, equipment.daily_rate)
    
    db_rental = models.RentalRecord(
        **rental.model_dump(),
        deposit_amount=equipment.deposit_amount,
        total_amount=total_amount,
        created_by=user_id
    )
    db.add(db_rental)
    db.commit()
    db.refresh(db_rental)
    
    add_status_history(db, db_rental.id, None, RentalStatus.PENDING, user_id, "创建预约")
    
    create_todo_for_role(db, UserRole.EQUIPMENT_ADMIN, db_rental.id, 
                        f"新预约审核: {rental.customer_name} - {equipment.name}",
                        "审核新的器材预约申请")
    
    return db_rental

def add_status_history(db: Session, rental_id: int, from_status: RentalStatus, 
                       to_status: RentalStatus, user_id: int, remark: str = None):
    history = models.StatusHistory(
        rental_record_id=rental_id,
        from_status=from_status,
        to_status=to_status,
        changed_by=user_id,
        remark=remark
    )
    db.add(history)
    db.commit()

def get_rental_record(db: Session, rental_id: int):
    return db.query(models.RentalRecord).filter(models.RentalRecord.id == rental_id).first()

def get_rental_records(db: Session, skip: int = 0, limit: int = 100, status: RentalStatus = None):
    query = db.query(models.RentalRecord)
    if status:
        query = query.filter(models.RentalRecord.status == status)
    return query.order_by(models.RentalRecord.created_at.desc()).offset(skip).limit(limit).all()

def get_rental_records_by_customer(db: Session, customer_name: str):
    return db.query(models.RentalRecord).filter(
        models.RentalRecord.customer_name.contains(customer_name)
    ).all()

def get_status_history(db: Session, rental_id: int):
    return db.query(models.StatusHistory).filter(
        models.StatusHistory.rental_record_id == rental_id
    ).order_by(models.StatusHistory.created_at).all()

def change_rental_status(db: Session, rental_id: int, new_status: RentalStatus, 
                         user_id: int, remark: str = None, deposit_refund_reason: str = None):
    rental = get_rental_record(db, rental_id)
    if not rental:
        return None, "租赁记录不存在"
    
    user = get_user(db, user_id)
    if not user:
        return None, "操作用户不存在"
    
    is_valid, err_msg = validate_transition(rental.status, new_status, user.role)
    if not is_valid:
        return None, err_msg
    
    old_status = rental.status
    rental.status = new_status
    
    now = datetime.now()
    
    if new_status == RentalStatus.CONFIRMED:
        rental.confirmed_by = user_id
        update_equipment_status(db, rental.equipment_id, EquipmentStatus.RENTED)
        clear_role_todos(db, UserRole.EQUIPMENT_ADMIN, rental_id)
        create_todo_for_role(db, UserRole.FINANCE, rental_id,
                            f"押金冻结: {rental.customer_name}",
                            "确认押金已冻结并更新系统状态")
    
    elif new_status == RentalStatus.DEPOSIT_FROZEN:
        rental.deposit_frozen_at = now
        rental.deposit_frozen_by = user_id
        clear_role_todos(db, UserRole.FINANCE, rental_id)
        create_todo_for_role(db, UserRole.STORE_CLERK, rental_id,
                            f"器材取件: {rental.customer_name}",
                            "客户前来取件时确认器材状态")
    
    elif new_status == RentalStatus.PICKED_UP:
        rental.picked_up_by = user_id
        clear_role_todos(db, UserRole.STORE_CLERK, rental_id)
    
    elif new_status == RentalStatus.RETURNED:
        rental.actual_return_date = now
        rental.returned_by = user_id
        update_equipment_status(db, rental.equipment_id, EquipmentStatus.AVAILABLE)
        create_todo_for_role(db, UserRole.FINANCE, rental_id,
                            f"押金退还审核: {rental.customer_name}",
                            "审核器材归还情况，处理押金退还")
    
    elif new_status == RentalStatus.DEPOSIT_REFUNDED:
        rental.deposit_refunded_at = now
        rental.deposit_refunded_by = user_id
        rental.deposit_refund_reason = deposit_refund_reason or "正常退还"
        clear_role_todos(db, UserRole.FINANCE, rental_id)
    
    elif new_status == RentalStatus.DEPOSIT_DEDUCTED:
        rental.deposit_refunded_at = now
        rental.deposit_refunded_by = user_id
        rental.deposit_refund_reason = deposit_refund_reason or "损坏扣除"
        clear_role_todos(db, UserRole.FINANCE, rental_id)
    
    elif new_status == RentalStatus.CANCELLED:
        update_equipment_status(db, rental.equipment_id, EquipmentStatus.AVAILABLE)
        clear_all_todos_for_rental(db, rental_id)
    
    add_status_history(db, rental_id, old_status, new_status, user_id, remark)
    
    db.commit()
    db.refresh(rental)
    return rental, None

def update_rental_record(db: Session, rental_id: int, update_data: schemas.RentalRecordUpdate):
    rental = get_rental_record(db, rental_id)
    if not rental:
        return None
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(rental, key, value)
    
    db.commit()
    db.refresh(rental)
    return rental

def create_maintenance_record(db: Session, maintenance: schemas.MaintenanceRecordCreate, user_id: int):
    db_maintenance = models.MaintenanceRecord(
        **maintenance.model_dump(),
        handled_by=user_id
    )
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    
    if maintenance.is_damage:
        update_equipment_status(db, maintenance.equipment_id, EquipmentStatus.DAMAGED)
    
    return db_maintenance

def get_maintenance_records(db: Session, equipment_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.MaintenanceRecord)
    if equipment_id:
        query = query.filter(models.MaintenanceRecord.equipment_id == equipment_id)
    return query.order_by(models.MaintenanceRecord.created_at.desc()).offset(skip).limit(limit).all()

def create_todo_for_role(db: Session, role: UserRole, rental_id: int, title: str, description: str = None):
    users = get_users_by_role(db, role)
    for user in users:
        todo = models.TodoItem(
            user_id=user.id,
            rental_record_id=rental_id,
            title=title,
            description=description
        )
        db.add(todo)
    db.commit()

def clear_role_todos(db: Session, role: UserRole, rental_id: int):
    users = get_users_by_role(db, role)
    user_ids = [u.id for u in users]
    db.query(models.TodoItem).filter(
        and_(
            models.TodoItem.rental_record_id == rental_id,
            models.TodoItem.user_id.in_(user_ids),
            models.TodoItem.is_completed == 0
        )
    ).update({"is_completed": 1, "completed_at": datetime.now()})
    db.commit()

def clear_all_todos_for_rental(db: Session, rental_id: int):
    db.query(models.TodoItem).filter(
        and_(
            models.TodoItem.rental_record_id == rental_id,
            models.TodoItem.is_completed == 0
        )
    ).update({"is_completed": 1, "completed_at": datetime.now()})
    db.commit()

def get_user_todos(db: Session, user_id: int, completed: bool = False):
    return db.query(models.TodoItem).filter(
        and_(
            models.TodoItem.user_id == user_id,
            models.TodoItem.is_completed == (1 if completed else 0)
        )
    ).order_by(models.TodoItem.created_at.desc()).all()

def complete_todo(db: Session, todo_id: int):
    todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
    if todo:
        todo.is_completed = 1
        todo.completed_at = datetime.now()
        db.commit()
        db.refresh(todo)
    return todo

def get_deposit_review_list(db: Session):
    return db.query(models.RentalRecord).filter(
        models.RentalRecord.status.in_([
            RentalStatus.DEPOSIT_FROZEN,
            RentalStatus.RETURNED,
            RentalStatus.DEPOSIT_REFUNDED,
            RentalStatus.DEPOSIT_DEDUCTED
        ])
    ).order_by(models.RentalRecord.updated_at.desc()).all()
