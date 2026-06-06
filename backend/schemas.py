from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class StudentBase(BaseModel):
    name: str
    student_no: str
    building: str
    room: str
    phone: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class Student(StudentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class KeyBase(BaseModel):
    key_number: str
    building: str
    room: str
    key_type: str = "room"
    status: str = "available"
    current_holder: Optional[str] = None


class KeyCreate(KeyBase):
    pass


class KeyUpdate(BaseModel):
    key_number: Optional[str] = None
    building: Optional[str] = None
    room: Optional[str] = None
    key_type: Optional[str] = None
    status: Optional[str] = None
    current_holder: Optional[str] = None


class Key(KeyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BorrowRecordBase(BaseModel):
    key_id: int
    student_id: str
    student_name: str
    borrower_role: str = "student"
    expected_return_time: datetime
    operator: str
    remark: Optional[str] = None


class BorrowRecordCreate(BorrowRecordBase):
    pass


class BorrowRecord(BorrowRecordBase):
    id: int
    borrow_time: datetime
    actual_return_time: Optional[datetime] = None
    is_overdue: bool = False

    class Config:
        from_attributes = True


class LostRecordBase(BaseModel):
    key_id: int
    student_name: str
    lost_reason: str
    replace_fee: Optional[float] = None
    operator: str


class LostRecordCreate(LostRecordBase):
    pass


class LostRecordUpdate(BaseModel):
    replace_time: Optional[datetime] = None
    new_key_id: Optional[int] = None
    status: Optional[str] = None


class LostRecord(LostRecordBase):
    id: int
    lost_time: datetime
    replace_time: Optional[datetime] = None
    new_key_id: Optional[int] = None
    status: str = "lost"

    class Config:
        from_attributes = True


class OperationLogBase(BaseModel):
    key_id: Optional[int] = None
    action: str
    operator: str
    operator_role: str
    detail: Optional[str] = None


class OperationLogCreate(OperationLogBase):
    pass


class OperationLog(OperationLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BorrowRequest(BaseModel):
    key_id: int
    student_id: str
    operator: str
    remark: Optional[str] = None


class ReturnRequest(BaseModel):
    key_id: int
    operator: str
    remark: Optional[str] = None


class LostRequest(BaseModel):
    key_id: int
    student_name: str
    lost_reason: str
    replace_fee: Optional[float] = None
    operator: str


class ReplaceRequest(BaseModel):
    lost_record_id: int
    new_key_number: str
    building: str
    room: str
    key_type: str = "room"
    operator: str
    replace_fee: Optional[float] = None


class DashboardStats(BaseModel):
    total_keys: int
    available_keys: int
    borrowed_keys: int
    lost_keys: int
    total_students: int
    active_borrows: int
    overdue_borrows: int


class RiskItem(BaseModel):
    key_id: int
    key_number: str
    building: str
    room: str
    risk_type: str
    description: str
    level: str
