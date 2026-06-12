from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class DocumentCategory(str, enum.Enum):
    INVOICE = "发票"
    BANK_RECEIPT = "银行回单"
    SALARY_TABLE = "工资表"
    CONTRACT = "合同"
    INVENTORY_TABLE = "库存表"


class RiskLevel(str, enum.Enum):
    HIGH = "高"
    MEDIUM = "中"
    LOW = "低"


class GapStatus(str, enum.Enum):
    PENDING = "待提交"
    SUBMITTED = "已提交"
    OVERDUE = "逾期未交"


class UserRole(str, enum.Enum):
    ACCOUNTANT = "会计"
    CUSTOMER_MANAGER = "客户经理"
    SUPERVISOR = "主管"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="客户名称")
    tax_id = Column(String(50), comment="纳税人识别号")
    contact_person = Column(String(50), comment="联系人")
    contact_phone = Column(String(20), comment="联系电话")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document_requirements = relationship("DocumentRequirement", back_populates="customer")
    document_submissions = relationship("DocumentSubmission", back_populates="customer")
    document_gaps = relationship("DocumentGap", back_populates="customer")
    collection_records = relationship("CollectionRecord", back_populates="customer")


class DocumentType(Base):
    __tablename__ = "document_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="资料项名称")
    category = Column(Enum(DocumentCategory), nullable=False, comment="资料类别")
    description = Column(Text, comment="资料说明")
    is_required = Column(Boolean, default=True, comment="是否必须")
    due_day = Column(Integer, comment="每月应交日期（如：10表示每月10日前）")
    created_at = Column(DateTime, default=datetime.utcnow)

    requirements = relationship("DocumentRequirement", back_populates="document_type")


class DocumentRequirement(Base):
    __tablename__ = "document_requirements"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False)
    period = Column(String(7), nullable=False, comment="所属期间，格式：YYYY-MM")
    is_required = Column(Boolean, default=True, comment="该客户该期间是否需要此资料")
    notes = Column(Text, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="document_requirements")
    document_type = relationship("DocumentType", back_populates="requirements")


class DocumentSubmission(Base):
    __tablename__ = "document_submissions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False)
    period = Column(String(7), nullable=False, comment="所属期间，格式：YYYY-MM")
    submission_date = Column(DateTime, nullable=False, comment="提交日期")
    file_name = Column(String(255), comment="文件名")
    file_path = Column(String(500), comment="文件路径")
    quantity = Column(Integer, default=1, comment="提交数量")
    notes = Column(Text, comment="备注")
    submitted_by = Column(String(50), comment="提交人")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="document_submissions")


class DocumentGap(Base):
    __tablename__ = "document_gaps"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    document_type_id = Column(Integer, ForeignKey("document_types.id"), nullable=False)
    period = Column(String(7), nullable=False, comment="所属期间，格式：YYYY-MM")
    status = Column(Enum(GapStatus), default=GapStatus.PENDING, comment="缺口状态")
    risk_level = Column(Enum(RiskLevel), comment="风险等级")
    due_date = Column(DateTime, comment="应交日期")
    notes = Column(Text, comment="缺口说明")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="document_gaps")


class CollectionRecord(Base):
    __tablename__ = "collection_records"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    document_gap_id = Column(Integer, ForeignKey("document_gaps.id"), nullable=True)
    contact_date = Column(DateTime, nullable=False, comment="催交日期")
    contact_method = Column(String(50), comment="催交方式（电话/微信/邮件等）")
    contact_person_manager = Column(String(50), comment="客户经理")
    content = Column(Text, comment="催交内容")
    customer_response = Column(Text, comment="客户回复")
    next_follow_up_date = Column(DateTime, comment="下次跟进日期")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="collection_records")


class RiskSummary(Base):
    __tablename__ = "risk_summaries"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    period = Column(String(7), nullable=False, comment="所属期间，格式：YYYY-MM")
    risk_level = Column(Enum(RiskLevel), nullable=False, comment="风险等级")
    risk_description = Column(Text, nullable=False, comment="风险描述")
    affected_declaration = Column(Boolean, default=True, comment="是否影响申报")
    resolution_suggestion = Column(Text, comment="解决建议")
    is_resolved = Column(Boolean, default=False, comment="是否已解决")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)