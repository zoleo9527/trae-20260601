from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    name = Column(String(50))
    role = Column(String(20))  # pharmacist:审方药师, decoctor:煎药员, courier:配送客服, admin:管理员
    created_at = Column(DateTime, default=datetime.now)


class SupplementaryApplication(Base):
    __tablename__ = "supplementary_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_no = Column(String(50), unique=True, index=True)
    prescription_no = Column(String(50))
    patient_name = Column(String(50))
    patient_phone = Column(String(20))
    address = Column(String(200))
    original_decoction_batch = Column(String(50))
    reason_type = Column(String(50))  # prescription_error:处方看错, batch_confusion:代煎批次混淆, address_error:地址改动漏同步, other:其他
    reason_detail = Column(Text)
    prescription_photo = Column(String(500))
    decoction_label_photo = Column(String(500))
    express_photo = Column(String(500))
    status = Column(String(20), default="pending_pharmacist")
    # pending_pharmacist:待审方药师处理, pending_decoctor:待煎药员处理, pending_courier:待配送客服处理, pending_fee:待费用确认, completed:已完成, rejected:已退回
    current_handler_role = Column(String(20), default="pharmacist")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    due_date = Column(DateTime)
    is_overdue = Column(Boolean, default=False)
    is_modified = Column(Boolean, default=False)

    operation_logs = relationship("OperationLog", back_populates="application", cascade="all, delete-orphan")
    fee_confirmation = relationship("FeeConfirmation", back_populates="application", uselist=False, cascade="all, delete-orphan")


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("supplementary_applications.id"))
    operator_id = Column(Integer, ForeignKey("users.id"))
    operator_name = Column(String(50))
    operator_role = Column(String(20))
    action = Column(String(50))  # create, submit, approve, reject, modify, confirm_fee, complete
    from_status = Column(String(20))
    to_status = Column(String(20))
    remark = Column(Text)
    field_changes = Column(Text)  # JSON格式记录字段变更
    created_at = Column(DateTime, default=datetime.now)

    application = relationship("SupplementaryApplication", back_populates="operation_logs")
    operator = relationship("User")


class FeeConfirmation(Base):
    __tablename__ = "fee_confirmations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("supplementary_applications.id"))
    decoction_fee = Column(Float, default=0)  # 煎药费
    express_fee = Column(Float, default=0)  # 快递费
    material_fee = Column(Float, default=0)  # 药材费
    total_fee = Column(Float, default=0)
    is_patient_pay = Column(Boolean, default=False)  # True:患者承担, False:医院承担
    payment_status = Column(String(20), default="pending")  # pending:待确认, confirmed:已确认, waived:已减免
    confirmed_by = Column(Integer, ForeignKey("users.id"))
    confirmed_at = Column(DateTime)
    remark = Column(Text)
    has_modification_notice = Column(Boolean, default=False)  # 申请被改动后通知标记
    last_modified_at = Column(DateTime)  # 申请最后修改时间

    application = relationship("SupplementaryApplication", back_populates="fee_confirmation")
    confirmer = relationship("User")
