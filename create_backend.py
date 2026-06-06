import os

backend_dir = "backend"
os.makedirs(backend_dir, exist_ok=True)

files = {}

files["backend/__init__.py"] = ""

files["backend/requirements.txt"] = """fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
python-multipart==0.0.6
"""

files["backend/database.py"] = """from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./dorm_keys.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""

files["backend/models.py"] = """from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    student_no = Column(String, unique=True, nullable=False)
    building = Column(String, nullable=False)
    room = Column(String, nullable=False)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Key(Base):
    __tablename__ = "keys"

    id = Column(Integer, primary_key=True, index=True)
    key_number = Column(String, unique=True, nullable=False)
    building = Column(String, nullable=False)
    room = Column(String, nullable=False)
    key_type = Column(String, default="room")
    status = Column(String, default="available")
    current_holder = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    borrow_records = relationship("BorrowRecord", back_populates="key")
    lost_records = relationship("LostRecord", back_populates="key", foreign_keys="LostRecord.key_id")


class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id"))
    student_id = Column(String, ForeignKey("students.id"))
    student_name = Column(String, nullable=False)
    borrower_role = Column(String, default="student")
    borrow_time = Column(DateTime, default=datetime.utcnow)
    expected_return_time = Column(DateTime, nullable=False)
    actual_return_time = Column(DateTime)
    is_overdue = Column(Boolean, default=False)
    operator = Column(String, nullable=False)
    remark = Column(Text)

    key = relationship("Key", back_populates="borrow_records")


class LostRecord(Base):
    __tablename__ = "lost_records"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id"))
    student_name = Column(String, nullable=False)
    lost_time = Column(DateTime, default=datetime.utcnow)
    lost_reason = Column(Text, nullable=False)
    replace_fee = Column(Float)
    replace_time = Column(DateTime)
    new_key_id = Column(Integer, ForeignKey("keys.id"))
    status = Column(String, default="lost")
    operator = Column(String, nullable=False)

    key = relationship("Key", back_populates="lost_records", foreign_keys=[key_id])


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id"))
    action = Column(String, nullable=False)
    operator = Column(String, nullable=False)
    operator_role = Column(String, nullable=False)
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
"""

files["backend/schemas.py"] = """from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class StudentBase(BaseModel):
    name: str
    student_no: str
    building: str
    room: str
    phone: Optional[str] = None


class StudentCreate(StudentBase):
    id: str


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
    student_id: Optional[str] = None
    student_name: str
    borrower_role: str = "student"
    expected_return_time: datetime
    operator: str
    remark: Optional[str] = None


class BorrowRecordCreate(BorrowRecordBase):
    pass


class BorrowReturn(BaseModel):
    record_id: int
    operator: str


class BorrowRecord(BaseModel):
    id: int
    key_id: int
    student_id: Optional[str] = None
    student_name: str
    borrower_role: str
    borrow_time: datetime
    expected_return_time: datetime
    actual_return_time: Optional[datetime] = None
    is_overdue: bool
    operator: str
    remark: Optional[str] = None
    key: Optional[Key] = None

    class Config:
        from_attributes = True


class LostRecordBase(BaseModel):
    key_id: int
    student_name: str
    lost_reason: str
    operator: str


class LostRecordCreate(LostRecordBase):
    pass


class LostRecordReplace(BaseModel):
    record_id: int
    replace_fee: float
    new_key_number: str
    operator: str


class LostRecord(BaseModel):
    id: int
    key_id: int
    student_name: str
    lost_time: datetime
    lost_reason: str
    replace_fee: Optional[float] = None
    replace_time: Optional[datetime] = None
    new_key_id: Optional[int] = None
    status: str
    operator: str
    key: Optional[Key] = None

    class Config:
        from_attributes = True


class OperationLog(BaseModel):
    id: int
    key_id: Optional[int] = None
    action: str
    operator: str
    operator_role: str
    detail: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_keys: int
    available_keys: int
    borrowed_keys: int
    lost_keys: int
    overdue_count: int
    pending_replace: int


class RiskItem(BaseModel):
    id: int
    type: str
    level: str
    title: str
    description: str
    key_id: Optional[int] = None
    student_name: Optional[str] = None
    created_at: datetime
"""

for filepath, content in files.items():
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created: {filepath}")

print("Backend base files created successfully!")
