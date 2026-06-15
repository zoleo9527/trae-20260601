from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from pydantic import BaseModel
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserRole(PyEnum):
    DISPATCHER = "调度员"
    INSTALLER = "安装师傅"
    SERVICE = "售后客服"

class OrderStatus(PyEnum):
    PENDING = "待分配"
    ASSIGNED = "已分配"
    IN_PROGRESS = "安装中"
    COMPLETED = "已完成"
    REWORK_REQUESTED = "待返工"
    REWORK_IN_PROGRESS = "返工中"
    REWORK_COMPLETED = "返工完成"
    LIABILITY_PENDING = "待责任判定"
    LIABILITY_DONE = "责任已判定"

class LiabilityResult(PyEnum):
    INSTALLER = "安装师傅责任"
    MATERIAL = "材料质量问题"
    USER = "用户使用不当"
    UNKNOWN = "原因待查"

class PhotoType(PyEnum):
    BEFORE = "安装前"
    DURING = "安装中"
    AFTER = "安装后"
    LEAKAGE = "漏水现场"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole), index=True)
    created_at = Column(DateTime, default=datetime.now)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    customer_phone = Column(String)
    address = Column(String)
    product_type = Column(String)
    product_model = Column(String)
    scheduled_time = Column(DateTime)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    installer_id = Column(Integer, ForeignKey("users.id"))
    dispatcher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    installer = relationship("User", foreign_keys=[installer_id])
    dispatcher = relationship("User", foreign_keys=[dispatcher_id])
    accessories = relationship("Accessory", back_populates="order")
    photos = relationship("Photo", back_populates="order")
    reworks = relationship("Rework", back_populates="order")

class Accessory(Base):
    __tablename__ = "accessories"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    name = Column(String)
    quantity = Column(Integer)
    used = Column(Boolean, default=False)
    installed = Column(Boolean, default=False)
    
    order = relationship("Order", back_populates="accessories")

class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    type = Column(Enum(PhotoType))
    file_path = Column(String)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.now)
    
    order = relationship("Order", back_populates="photos")
    uploader = relationship("User", foreign_keys=[uploaded_by])

class Rework(Base):
    __tablename__ = "reworks"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    reason = Column(String)
    description = Column(Text)
    reported_by = Column(Integer, ForeignKey("users.id"))
    reported_at = Column(DateTime, default=datetime.now)
    status = Column(Enum(OrderStatus), default=OrderStatus.REWORK_REQUESTED)
    
    order = relationship("Order", back_populates="reworks")
    reporter = relationship("User", foreign_keys=[reported_by])

class Liability(Base):
    __tablename__ = "liabilities"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    result = Column(Enum(LiabilityResult))
    evidence = Column(Text)
    handler_id = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime, default=datetime.now)
    compensation_amount = Column(Float, default=0.0)
    notes = Column(Text)
    
    handler = relationship("User", foreign_keys=[handler_id])
    rejections = relationship("Rejection", back_populates="liability")

class Rejection(Base):
    __tablename__ = "rejections"
    id = Column(Integer, primary_key=True, index=True)
    liability_id = Column(Integer, ForeignKey("liabilities.id"))
    order_id = Column(Integer, ForeignKey("orders.id"))
    reason = Column(String(500))
    rejected_by = Column(Integer, ForeignKey("users.id"))
    rejected_at = Column(DateTime, default=datetime.now)
    additional_evidence_required = Column(Text)
    status = Column(String(20), default="PENDING")
    
    liability = relationship("Liability", back_populates="rejections")
    order = relationship("Order", foreign_keys=[order_id])
    rejecter = relationship("User", foreign_keys=[rejected_by])

class ProgressTracking(Base):
    __tablename__ = "progress_tracking"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    stage = Column(String(50))
    status = Column(String(50))
    operator_id = Column(Integer, ForeignKey("users.id"))
    operated_at = Column(DateTime, default=datetime.now)
    notes = Column(Text)
    
    order = relationship("Order", foreign_keys=[order_id])
    operator = relationship("User", foreign_keys=[operator_id])

class AlertType(PyEnum):
    LEAKAGE = "漏水返工"
    TIMEOUT = "超时未处理"
    REJECTION = "驳回补录"
    PENDING_LIABILITY = "待责任判定"

class AlertSeverity(PyEnum):
    HIGH = "高"
    MEDIUM = "中"
    LOW = "低"

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    type = Column(Enum(AlertType))
    message = Column(Text)
    severity = Column(Enum(AlertSeverity))
    created_at = Column(DateTime, default=datetime.now)
    is_read = Column(Boolean, default=False)
    
    order = relationship("Order", foreign_keys=[order_id])

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    question = Column(Text)
    asked_by = Column(Integer, ForeignKey("users.id"))
    asked_at = Column(DateTime, default=datetime.now)
    answer = Column(Text)
    answered_by = Column(Integer, ForeignKey("users.id"))
    answered_at = Column(DateTime)
    
    order = relationship("Order", foreign_keys=[order_id])
    asker = relationship("User", foreign_keys=[asked_by])
    answerer = relationship("User", foreign_keys=[answered_by])

Base.metadata.create_all(bind=engine)

app = FastAPI(title="卫浴安装队管理系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

api_router = APIRouter(prefix="/api")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    name: str
    phone: str
    role: UserRole

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str

    @classmethod
    def from_orm(cls, obj):
        role_map = {
            UserRole.DISPATCHER: "dispatcher",
            UserRole.INSTALLER: "technician",
            UserRole.SERVICE: "customer_service"
        }
        return cls(
            id=obj.id,
            name=obj.name,
            phone=obj.phone,
            role=role_map.get(obj.role, "dispatcher")
        )

class LoginRequest(BaseModel):
    phone: str

class LoginResponse(BaseModel):
    success: bool
    user: UserResponse

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    address: str
    product_type: str
    product_model: str
    scheduled_time: datetime

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    address: str
    product_type: str
    product_model: str
    scheduled_time: datetime
    status: str
    installer_id: Optional[int]
    dispatcher_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm(cls, obj):
        status_map = {
            OrderStatus.PENDING: "pending",
            OrderStatus.ASSIGNED: "assigned",
            OrderStatus.IN_PROGRESS: "in_progress",
            OrderStatus.COMPLETED: "completed",
            OrderStatus.REWORK_REQUESTED: "rework_requested",
            OrderStatus.REWORK_IN_PROGRESS: "rework_in_progress",
            OrderStatus.REWORK_COMPLETED: "rework_completed",
            OrderStatus.LIABILITY_PENDING: "liability_pending",
            OrderStatus.LIABILITY_DONE: "liability_done"
        }
        return cls(
            id=obj.id,
            customer_name=obj.customer_name,
            customer_phone=obj.customer_phone,
            address=obj.address,
            product_type=obj.product_type,
            product_model=obj.product_model,
            scheduled_time=obj.scheduled_time,
            status=status_map.get(obj.status, "pending"),
            installer_id=obj.installer_id,
            dispatcher_id=obj.dispatcher_id,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )

class OrderDetailResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    address: str
    product_type: str
    product_model: str
    scheduled_time: datetime
    status: str
    installer_id: Optional[int]
    installer_name: Optional[str]
    dispatcher_id: Optional[int]
    dispatcher_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    accessories: list = []
    photos: list = []
    reworks: list = []
    liability: Optional[dict] = None
    rejections: list = []
    progress: list = []
    questions: list = []

class AccessoryCreate(BaseModel):
    name: str
    quantity: int

class AccessoryResponse(BaseModel):
    id: int
    order_id: int
    name: str
    quantity: int
    used: bool
    installed: bool

class PhotoCreate(BaseModel):
    type: PhotoType

class PhotoResponse(BaseModel):
    id: int
    order_id: int
    type: PhotoType
    file_path: str
    uploaded_by: int
    uploaded_at: datetime

class ReworkCreate(BaseModel):
    reason: str
    description: str

class ReworkResponse(BaseModel):
    id: int
    order_id: int
    reason: str
    description: str
    reported_by: int
    reported_at: datetime
    status: OrderStatus

class LiabilityCreate(BaseModel):
    result: LiabilityResult
    evidence: str
    compensation_amount: float = 0.0
    notes: str = ""

class LiabilityResponse(BaseModel):
    id: int
    order_id: int
    result: LiabilityResult
    evidence: str
    handler_id: int
    handled_at: datetime
    compensation_amount: float
    notes: str

class RejectionCreate(BaseModel):
    reason: str
    additional_evidence_required: str

class RejectionResponse(BaseModel):
    id: int
    liability_id: int
    order_id: int
    reason: str
    rejected_by: int
    rejected_at: datetime
    additional_evidence_required: str
    status: str

class ProgressTrackingResponse(BaseModel):
    id: int
    order_id: int
    stage: str
    status: str
    operator_id: int
    operated_at: datetime
    notes: str

class AlertResponse(BaseModel):
    id: int
    order_id: int
    type: AlertType
    message: str
    severity: AlertSeverity
    created_at: datetime
    is_read: bool

class QuestionCreate(BaseModel):
    question: str

class QuestionAnswer(BaseModel):
    answer: str

class QuestionResponse(BaseModel):
    id: int
    order_id: int
    question: str
    asked_by: int
    asked_at: datetime
    answer: Optional[str]
    answered_by: Optional[int]
    answered_at: Optional[datetime]

@api_router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@api_router.get("/users/")
def get_users(role: Optional[UserRole] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    role_map = {
        UserRole.DISPATCHER: "dispatcher",
        UserRole.INSTALLER: "technician",
        UserRole.SERVICE: "customer_service"
    }
    
    users = query.all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "role": role_map.get(user.role, "dispatcher")
        })
    return result

@api_router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@api_router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == request.phone).first()
    if user:
        role_map = {
            UserRole.DISPATCHER: "dispatcher",
            UserRole.INSTALLER: "technician",
            UserRole.SERVICE: "customer_service"
        }
        return {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "phone": user.phone,
                "role": role_map.get(user.role, "dispatcher")
            }
        }
    return {"success": False, "user": None}

@api_router.post("/orders/", response_model=OrderResponse)
def create_order(order: OrderCreate, dispatcher_id: int, db: Session = Depends(get_db)):
    db_order = Order(**order.dict(), dispatcher_id=dispatcher_id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@api_router.get("/orders/")
def get_orders(status: Optional[OrderStatus] = None, installer_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if installer_id:
        query = query.filter(Order.installer_id == installer_id)
    
    status_map = {
        OrderStatus.PENDING: "pending",
        OrderStatus.ASSIGNED: "assigned",
        OrderStatus.IN_PROGRESS: "in_progress",
        OrderStatus.COMPLETED: "completed",
        OrderStatus.REWORK_REQUESTED: "rework_requested",
        OrderStatus.REWORK_IN_PROGRESS: "rework_in_progress",
        OrderStatus.REWORK_COMPLETED: "rework_completed",
        OrderStatus.LIABILITY_PENDING: "liability_pending",
        OrderStatus.LIABILITY_DONE: "liability_done"
    }
    
    orders = query.order_by(Order.scheduled_time).all()
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "address": order.address,
            "product_type": order.product_type,
            "product_model": order.product_model,
            "scheduled_time": order.scheduled_time,
            "status": status_map.get(order.status, "pending"),
            "installer_id": order.installer_id,
            "dispatcher_id": order.dispatcher_id,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        })
    return result

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order

@api_router.get("/orders/{order_id}/detail")
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    status_map = {
        OrderStatus.PENDING: "pending",
        OrderStatus.ASSIGNED: "assigned",
        OrderStatus.IN_PROGRESS: "in_progress",
        OrderStatus.COMPLETED: "completed",
        OrderStatus.REWORK_REQUESTED: "rework_requested",
        OrderStatus.REWORK_IN_PROGRESS: "rework_in_progress",
        OrderStatus.REWORK_COMPLETED: "rework_completed",
        OrderStatus.LIABILITY_PENDING: "liability_pending",
        OrderStatus.LIABILITY_DONE: "liability_done"
    }
    
    installer_name = None
    if order.installer_id:
        installer = db.query(User).filter(User.id == order.installer_id).first()
        installer_name = installer.name if installer else None
    
    dispatcher_name = None
    if order.dispatcher_id:
        dispatcher = db.query(User).filter(User.id == order.dispatcher_id).first()
        dispatcher_name = dispatcher.name if dispatcher else None
    
    accessories = db.query(Accessory).filter(Accessory.order_id == order_id).all()
    accessories_list = [{
        "id": a.id,
        "name": a.name,
        "quantity": a.quantity,
        "used": a.used,
        "installed": a.installed,
        "remark": ""
    } for a in accessories]
    
    photos = db.query(Photo).filter(Photo.order_id == order_id).all()
    photo_type_map = {PhotoType.BEFORE: "before", PhotoType.DURING: "during", PhotoType.AFTER: "after", PhotoType.LEAKAGE: "leakage"}
    photos_list = [{
        "id": p.id,
        "order_id": p.order_id,
        "photo_url": p.file_path,
        "description": "",
        "photo_type": photo_type_map.get(p.type, "after"),
        "uploaded_at": p.uploaded_at,
        "uploaded_by": p.uploaded_by
    } for p in photos]
    
    reworks = db.query(Rework).filter(Rework.order_id == order_id).all()
    rework_status_map = {
        OrderStatus.REWORK_REQUESTED: "pending",
        OrderStatus.REWORK_IN_PROGRESS: "processing",
        OrderStatus.REWORK_COMPLETED: "resolved"
    }
    reworks_list = [{
        "id": r.id,
        "order_id": r.order_id,
        "type": "leakage",
        "description": r.description,
        "photos": [],
        "reported_at": r.reported_at,
        "reported_by": r.reported_by,
        "status": rework_status_map.get(r.status, "pending"),
        "rejected_reason": ""
    } for r in reworks]
    
    liability = db.query(Liability).filter(Liability.order_id == order_id).first()
    liability_dict = None
    if liability:
        liability_result_map = {
            LiabilityResult.INSTALLER: "technician",
            LiabilityResult.MATERIAL: "supplier",
            LiabilityResult.USER: "customer",
            LiabilityResult.UNKNOWN: "company"
        }
        liability_dict = {
            "id": liability.id,
            "order_id": liability.order_id,
            "responsible_party": liability_result_map.get(liability.result, "company"),
            "reason": liability.evidence,
            "evidence": [liability.evidence],
            "created_at": liability.handled_at,
            "created_by": liability.handler_id,
            "status": "confirmed",
            "compensation_amount": liability.compensation_amount
        }
    
    rejections = db.query(Rejection).filter(Rejection.order_id == order_id).all()
    rejections_list = [{
        "id": r.id,
        "liability_id": r.liability_id,
        "order_id": r.order_id,
        "reason": r.reason,
        "rejected_by": r.rejected_by,
        "rejected_at": r.rejected_at,
        "additional_evidence_required": [r.additional_evidence_required],
        "status": r.status.lower()
    } for r in rejections]
    
    progress = db.query(ProgressTracking).filter(ProgressTracking.order_id == order_id).order_by(ProgressTracking.operated_at).all()
    progress_list = [{
        "id": p.id,
        "order_id": p.order_id,
        "stage": p.stage,
        "status": p.status,
        "operator_id": p.operator_id,
        "operated_at": p.operated_at,
        "notes": p.notes
    } for p in progress]
    
    questions = db.query(Question).filter(Question.order_id == order_id).order_by(Question.asked_at).all()
    questions_list = [{
        "id": q.id,
        "order_id": q.order_id,
        "question": q.question,
        "asked_by": q.asked_by,
        "asked_at": q.asked_at,
        "answer": q.answer,
        "answered_by": q.answered_by,
        "answered_at": q.answered_at
    } for q in questions]
    
    return {
        "id": order.id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "address": order.address,
        "product_type": order.product_type,
        "product_model": order.product_model,
        "scheduled_time": order.scheduled_time,
        "status": status_map.get(order.status, "pending"),
        "installer_id": order.installer_id,
        "installer_name": installer_name,
        "dispatcher_id": order.dispatcher_id,
        "dispatcher_name": dispatcher_name,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "accessories": accessories_list,
        "photos": photos_list,
        "after_sales_records": reworks_list,
        "responsibility_result": liability_dict,
        "rejection_records": rejections_list,
        "progress_trackings": progress_list,
        "questions": questions_list
    }

@api_router.put("/orders/{order_id}/assign")
def assign_order(order_id: int, installer_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="订单状态不允许分配")
    order.installer_id = installer_id
    order.status = OrderStatus.ASSIGNED
    db.commit()
    return {"message": "分配成功"}

@api_router.put("/orders/{order_id}/start")
def start_installation(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != OrderStatus.ASSIGNED:
        raise HTTPException(status_code=400, detail="订单状态不允许开始安装")
    order.status = OrderStatus.IN_PROGRESS
    db.commit()
    return {"message": "安装开始"}

@api_router.put("/orders/{order_id}/complete")
def complete_installation(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != OrderStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="订单状态不允许完成")
    
    photos = db.query(Photo).filter(Photo.order_id == order_id, Photo.type == PhotoType.AFTER).all()
    if not photos:
        raise HTTPException(status_code=400, detail="缺少安装后照片")
    
    accessories = db.query(Accessory).filter(Accessory.order_id == order_id).all()
    if accessories and not all(a.installed for a in accessories):
        raise HTTPException(status_code=400, detail="配件未全部安装")
    
    order.status = OrderStatus.COMPLETED
    db.commit()
    return {"message": "安装完成"}

@api_router.post("/orders/{order_id}/accessories/", response_model=AccessoryResponse)
def add_accessory(order_id: int, accessory: AccessoryCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    db_accessory = Accessory(**accessory.dict(), order_id=order_id)
    db.add(db_accessory)
    db.commit()
    db.refresh(db_accessory)
    return db_accessory

@api_router.get("/orders/{order_id}/accessories/", response_model=list[AccessoryResponse])
def get_order_accessories(order_id: int, db: Session = Depends(get_db)):
    return db.query(Accessory).filter(Accessory.order_id == order_id).all()

@api_router.put("/accessories/{accessory_id}/install")
def mark_accessory_installed(accessory_id: int, db: Session = Depends(get_db)):
    accessory = db.query(Accessory).filter(Accessory.id == accessory_id).first()
    if not accessory:
        raise HTTPException(status_code=404, detail="配件不存在")
    accessory.installed = True
    db.commit()
    return {"message": "配件已安装"}

@api_router.post("/orders/{order_id}/photos/")
async def upload_photo(order_id: int, type: PhotoType, user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    filename = f"{order_id}_{type.value}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    db_photo = Photo(order_id=order_id, type=type, file_path=file_path, uploaded_by=user_id)
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    
    return {"id": db_photo.id, "file_path": file_path, "type": db_photo.type.value}

@api_router.get("/orders/{order_id}/photos/", response_model=list[PhotoResponse])
def get_order_photos(order_id: int, db: Session = Depends(get_db)):
    return db.query(Photo).filter(Photo.order_id == order_id).all()

@api_router.post("/orders/{order_id}/rework/", response_model=ReworkResponse)
def create_rework(order_id: int, rework: ReworkCreate, user_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="只有已完成的订单才能发起返工")
    
    photos = db.query(Photo).filter(Photo.order_id == order_id, Photo.type == PhotoType.LEAKAGE).all()
    if not photos:
        raise HTTPException(status_code=400, detail="缺少漏水现场照片，无法发起返工")
    
    db_rework = Rework(**rework.dict(), order_id=order_id, reported_by=user_id)
    db.add(db_rework)
    order.status = OrderStatus.REWORK_REQUESTED
    db.commit()
    db.refresh(db_rework)
    return db_rework

@api_router.get("/orders/{order_id}/rework/", response_model=list[ReworkResponse])
def get_order_reworks(order_id: int, db: Session = Depends(get_db)):
    return db.query(Rework).filter(Rework.order_id == order_id).all()

@api_router.put("/reworks/{rework_id}/accept")
def accept_rework(rework_id: int, installer_id: int, db: Session = Depends(get_db)):
    rework = db.query(Rework).filter(Rework.id == rework_id).first()
    if not rework:
        raise HTTPException(status_code=404, detail="返工记录不存在")
    if rework.status != OrderStatus.REWORK_REQUESTED:
        raise HTTPException(status_code=400, detail="返工状态不允许接受")
    
    order = db.query(Order).filter(Order.id == rework.order_id).first()
    order.status = OrderStatus.REWORK_IN_PROGRESS
    rework.status = OrderStatus.REWORK_IN_PROGRESS
    order.installer_id = installer_id
    db.commit()
    return {"message": "返工已接受"}

@api_router.put("/reworks/{rework_id}/complete")
def complete_rework(rework_id: int, db: Session = Depends(get_db)):
    rework = db.query(Rework).filter(Rework.id == rework_id).first()
    if not rework:
        raise HTTPException(status_code=404, detail="返工记录不存在")
    if rework.status != OrderStatus.REWORK_IN_PROGRESS:
        raise HTTPException(status_code=400, detail="返工状态不允许完成")
    
    order = db.query(Order).filter(Order.id == rework.order_id).first()
    photos = db.query(Photo).filter(Photo.order_id == order.id, Photo.type == PhotoType.AFTER).all()
    if not photos:
        raise HTTPException(status_code=400, detail="缺少返工后照片")
    
    order.status = OrderStatus.REWORK_COMPLETED
    rework.status = OrderStatus.REWORK_COMPLETED
    db.commit()
    return {"message": "返工完成"}

@api_router.put("/orders/{order_id}/liability")
def create_liability(order_id: int, liability: LiabilityCreate, handler_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    if order.status != OrderStatus.REWORK_COMPLETED:
        raise HTTPException(status_code=400, detail="只有返工完成的订单才能进行责任判定")
    
    db_liability = Liability(
        order_id=order_id,
        result=liability.result,
        evidence=liability.evidence,
        handler_id=handler_id,
        compensation_amount=liability.compensation_amount,
        notes=liability.notes
    )
    db.add(db_liability)
    order.status = OrderStatus.LIABILITY_DONE
    db.commit()
    return {"message": "责任判定已完成"}

@api_router.get("/orders/{order_id}/liability")
def get_order_liability(order_id: int, db: Session = Depends(get_db)):
    liability = db.query(Liability).filter(Liability.order_id == order_id).first()
    if not liability:
        raise HTTPException(status_code=404, detail="责任判定不存在")
    return liability

@api_router.get("/liabilities/", response_model=list[LiabilityResponse])
def get_liabilities(result: Optional[LiabilityResult] = None, db: Session = Depends(get_db)):
    query = db.query(Liability)
    if result:
        query = query.filter(Liability.result == result)
    return query.all()

@api_router.post("/liabilities/{liability_id}/reject", response_model=RejectionResponse)
def reject_liability(liability_id: int, rejection: RejectionCreate, rejected_by: int, db: Session = Depends(get_db)):
    liability = db.query(Liability).filter(Liability.id == liability_id).first()
    if not liability:
        raise HTTPException(status_code=404, detail="责任判定不存在")
    
    db_rejection = Rejection(
        liability_id=liability_id,
        order_id=liability.order_id,
        reason=rejection.reason,
        rejected_by=rejected_by,
        additional_evidence_required=rejection.additional_evidence_required
    )
    db.add(db_rejection)
    
    order = db.query(Order).filter(Order.id == liability.order_id).first()
    order.status = OrderStatus.REWORK_COMPLETED
    
    alert = Alert(
        order_id=order.id,
        type=AlertType.REJECTION,
        message=f"责任判定被驳回：{rejection.reason}",
        severity=AlertSeverity.HIGH
    )
    db.add(alert)
    
    db.commit()
    db.refresh(db_rejection)
    return db_rejection

@api_router.get("/orders/{order_id}/rejections/", response_model=list[RejectionResponse])
def get_order_rejections(order_id: int, db: Session = Depends(get_db)):
    return db.query(Rejection).filter(Rejection.order_id == order_id).all()

@api_router.get("/orders/{order_id}/progress/", response_model=list[ProgressTrackingResponse])
def get_order_progress(order_id: int, db: Session = Depends(get_db)):
    return db.query(ProgressTracking).filter(ProgressTracking.order_id == order_id).order_by(ProgressTracking.operated_at).all()

@api_router.post("/orders/{order_id}/progress/")
def add_progress_tracking(order_id: int, stage: str, status: str, operator_id: int, notes: str = "", db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    progress = ProgressTracking(
        order_id=order_id,
        stage=stage,
        status=status,
        operator_id=operator_id,
        notes=notes
    )
    db.add(progress)
    db.commit()
    return {"message": "进度已记录"}

@api_router.get("/alerts/", response_model=list[AlertResponse])
def get_alerts(is_read: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
    return query.order_by(Alert.created_at.desc()).all()

@api_router.put("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="提醒不存在")
    alert.is_read = True
    db.commit()
    return {"message": "提醒已标记为已读"}

@api_router.post("/orders/{order_id}/question/", response_model=QuestionResponse)
def ask_question(order_id: int, question: QuestionCreate, asked_by: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    db_question = Question(
        order_id=order_id,
        question=question.question,
        asked_by=asked_by
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@api_router.get("/orders/{order_id}/questions/", response_model=list[QuestionResponse])
def get_order_questions(order_id: int, db: Session = Depends(get_db)):
    return db.query(Question).filter(Question.order_id == order_id).order_by(Question.asked_at).all()

@api_router.put("/questions/{question_id}/answer")
def answer_question(question_id: int, answer: QuestionAnswer, answered_by: int, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="追问不存在")
    
    question.answer = answer.answer
    question.answered_by = answered_by
    question.answered_at = datetime.now()
    db.commit()
    return {"message": "追问已回答"}

@api_router.post("/init-sample-data/")
def init_sample_data(db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == "13800138001").first():
        return {"message": "样例数据已存在，无需重复初始化"}
    
    dispatcher = User(name="张调度", phone="13800138001", role=UserRole.DISPATCHER)
    installer1 = User(name="李师傅", phone="13800138002", role=UserRole.INSTALLER)
    installer2 = User(name="王师傅", phone="13800138003", role=UserRole.INSTALLER)
    service = User(name="赵客服", phone="13800138004", role=UserRole.SERVICE)
    
    db.add_all([dispatcher, installer1, installer2, service])
    db.commit()
    
    order1 = Order(
        customer_name="张先生",
        customer_phone="13900139001",
        address="北京市朝阳区建国路88号",
        product_type="淋浴房",
        product_model="SF-2024-A",
        scheduled_time=datetime.now(),
        status=OrderStatus.PENDING,
        dispatcher_id=dispatcher.id
    )
    
    order2 = Order(
        customer_name="李女士",
        customer_phone="13900139002",
        address="北京市海淀区中关村大街66号",
        product_type="马桶",
        product_model="MT-2024-B",
        scheduled_time=datetime.now(),
        status=OrderStatus.COMPLETED,
        installer_id=installer1.id,
        dispatcher_id=dispatcher.id
    )
    
    order3 = Order(
        customer_name="王先生",
        customer_phone="13900139003",
        address="北京市西城区金融街10号",
        product_type="洗手盆",
        product_model="XB-2024-C",
        scheduled_time=datetime.now(),
        status=OrderStatus.REWORK_REQUESTED,
        installer_id=installer2.id,
        dispatcher_id=dispatcher.id
    )
    
    order4 = Order(
        customer_name="赵女士",
        customer_phone="13900139004",
        address="北京市东城区王府井大街1号",
        product_type="浴缸",
        product_model="YG-2024-D",
        scheduled_time=datetime.now(),
        status=OrderStatus.LIABILITY_PENDING,
        installer_id=installer1.id,
        dispatcher_id=dispatcher.id
    )
    
    db.add_all([order1, order2, order3, order4])
    db.commit()
    
    accessory1 = Accessory(order_id=order2.id, name="淋浴房支架", quantity=2, installed=True)
    accessory2 = Accessory(order_id=order2.id, name="玻璃胶", quantity=1, installed=True)
    accessory3 = Accessory(order_id=order3.id, name="洗手盆支架", quantity=1, installed=True)
    accessory4 = Accessory(order_id=order3.id, name="下水管", quantity=1, installed=False)
    
    db.add_all([accessory1, accessory2, accessory3, accessory4])
    db.commit()
    
    rework1 = Rework(
        order_id=order3.id,
        reason="洗手盆漏水",
        description="洗手盆下水管连接处漏水，需要重新安装",
        reported_by=service.id
    )
    
    rework2 = Rework(
        order_id=order4.id,
        reason="浴缸漏水",
        description="浴缸排水口密封不严导致漏水",
        reported_by=service.id,
        status=OrderStatus.REWORK_COMPLETED
    )
    
    db.add_all([rework1, rework2])
    db.commit()
    
    liability1 = Liability(
        order_id=order4.id,
        result=LiabilityResult.INSTALLER,
        evidence="浴缸排水口密封圈安装不到位",
        handler_id=service.id,
        compensation_amount=200.0,
        notes="师傅需重新安装密封圈"
    )
    
    db.add(liability1)
    db.commit()
    
    rejection1 = Rejection(
        liability_id=liability1.id,
        order_id=order4.id,
        reason="证据不足，需要补充漏水现场照片",
        rejected_by=dispatcher.id,
        additional_evidence_required="漏水现场照片、安装过程照片",
        status="PENDING"
    )
    
    db.add(rejection1)
    db.commit()
    
    alert1 = Alert(
        order_id=order3.id,
        type=AlertType.LEAKAGE,
        message="洗手盆漏水返工待处理",
        severity=AlertSeverity.HIGH
    )
    
    alert2 = Alert(
        order_id=order4.id,
        type=AlertType.PENDING_LIABILITY,
        message="浴缸漏水责任判定待处理",
        severity=AlertSeverity.MEDIUM
    )
    
    alert3 = Alert(
        order_id=order4.id,
        type=AlertType.REJECTION,
        message="责任判定被驳回，需要补充证据",
        severity=AlertSeverity.HIGH
    )
    
    db.add_all([alert1, alert2, alert3])
    db.commit()
    
    return {"message": "样例数据已初始化"}

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
