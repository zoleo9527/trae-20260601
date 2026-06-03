from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, RentalStatus, EquipmentStatus

class UserBase(BaseModel):
    username: str
    name: str
    role: UserRole

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    name: str
    category: str
    model: str
    serial_number: str
    daily_rate: float
    deposit_amount: float
    description: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int
    status: EquipmentStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class StatusHistoryBase(BaseModel):
    from_status: Optional[RentalStatus] = None
    to_status: RentalStatus
    remark: Optional[str] = None

class StatusHistory(StatusHistoryBase):
    id: int
    rental_record_id: int
    changed_by: int
    changer_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class RentalRecordBase(BaseModel):
    customer_name: str
    customer_phone: str
    customer_id_card: str
    equipment_id: int
    start_date: datetime
    end_date: datetime
    supplement_note: Optional[str] = None

class RentalRecordCreate(RentalRecordBase):
    pass

class RentalRecordUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    end_date: Optional[datetime] = None
    supplement_note: Optional[str] = None
    return_remark: Optional[str] = None

class StatusChangeRequest(BaseModel):
    new_status: RentalStatus
    remark: Optional[str] = None
    deposit_refund_reason: Optional[str] = None

class RentalRecord(RentalRecordBase):
    id: int
    status: RentalStatus
    deposit_amount: float
    deposit_frozen_at: Optional[datetime] = None
    deposit_refunded_at: Optional[datetime] = None
    deposit_refund_reason: Optional[str] = None
    total_amount: float
    actual_return_date: Optional[datetime] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    equipment: Equipment
    creator: Optional[User] = None
    
    class Config:
        from_attributes = True

class RentalRecordDetail(RentalRecord):
    status_history: List[StatusHistory] = []

class MaintenanceRecordBase(BaseModel):
    equipment_id: int
    rental_record_id: Optional[int] = None
    description: str
    repair_cost: float = 0
    is_damage: int = 0

class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass

class MaintenanceRecord(MaintenanceRecordBase):
    id: int
    handled_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TodoItemBase(BaseModel):
    title: str
    description: Optional[str] = None

class TodoItem(TodoItemBase):
    id: int
    user_id: int
    rental_record_id: int
    is_completed: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RoleTodoCount(BaseModel):
    pending_count: int
    role: UserRole

class DepositReviewItem(BaseModel):
    rental_record_id: int
    customer_name: str
    equipment_name: str
    deposit_amount: float
    created_at: datetime
    status: RentalStatus
