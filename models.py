"""
典当行续当赎当与费用计算系统 - 数据模型
重点解决：续当赎当与费用计算之间的责任划分、状态一致性
"""

from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from dataclasses import dataclass, field


class PawnStatus(str, Enum):
    PENDING = "pending"
    APPRAISED = "appraised"
    APPROVED = "approved"
    ACTIVE = "active"
    RENEWAL_PENDING = "renewal_pending"
    RENEWAL_APPROVED = "renewal_approved"
    REDEMPTION_PENDING = "redemption_pending"
    REDEMPTION_APPROVED = "redemption_approved"
    REDEEMED = "redeemed"
    OVERDUE = "overdue"
    DISPUTED = "disputed"
    CLOSED = "closed"


class RenewalStatus(str, Enum):
    DRAFT = "draft"
    PENDING_ASSESSOR = "pending_assessor"
    PENDING_FINANCE = "pending_finance"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class RedemptionStatus(str, Enum):
    DRAFT = "draft"
    PENDING_FINANCE = "pending_finance"
    PENDING_WAREHOUSE = "pending_warehouse"
    PENDING_CUSTOMER = "pending_customer"
    COMPLETED = "completed"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"


class FeeCalculationStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    DISPUTED = "disputed"
    SETTLED = "settled"


class UserRole(str, Enum):
    ASSESSOR = "assessor"
    WAREHOUSE = "warehouse"
    FINANCE = "finance"
    MANAGER = "manager"


class ResponsibilityStage(str, Enum):
    APPRAISAL = "appraisal"
    WAREHOUSE_CUSTODY = "warehouse_custody"
    FEE_CALCULATION = "fee_calculation"
    RENEWAL_PROCESSING = "renewal_processing"
    REDEMPTION_PROCESSING = "redemption_processing"
    SETTLEMENT = "settlement"


@dataclass
class User:
    id: str
    name: str
    role: UserRole
    department: str


@dataclass
class PawnItem:
    id: str
    customer_id: str
    item_name: str
    item_description: str
    appraised_value: Decimal
    loan_amount: Decimal
    interest_rate: Decimal
    term_days: int
    start_date: date
    due_date: date
    status: PawnStatus
    assessor_id: str
    warehouse_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class FeeCalculation:
    id: str
    pawn_item_id: str
    calculation_date: date
    principal: Decimal
    interest_amount: Decimal
    service_fee: Decimal
    storage_fee: Decimal
    penalty_fee: Decimal
    total_fee: Decimal
    status: FeeCalculationStatus
    calculator_id: str
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    dispute_reason: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class RenewalRecord:
    id: str
    pawn_item_id: str
    original_due_date: date
    new_due_date: date
    renewal_fee: Decimal
    status: RenewalStatus
    current_handler: UserRole
    assessor_id: Optional[str] = None
    assessor_notes: Optional[str] = None
    finance_id: Optional[str] = None
    finance_notes: Optional[str] = None
    fee_calculation_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class RedemptionRecord:
    id: str
    pawn_item_id: str
    redemption_date: date
    total_amount: Decimal
    status: RedemptionStatus
    current_handler: UserRole
    finance_id: Optional[str] = None
    finance_notes: Optional[str] = None
    warehouse_id: Optional[str] = None
    warehouse_notes: Optional[str] = None
    customer_confirmation: bool = False
    fee_calculation_id: Optional[str] = None
    dispute_reason: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class ResponsibilityChain:
    id: str
    pawn_item_id: str
    stage: ResponsibilityStage
    handler_id: str
    handler_role: UserRole
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "active"
    notes: Optional[str] = None


@dataclass
class AuditLog:
    id: str
    entity_type: str
    entity_id: str
    action: str
    old_value: Optional[str]
    new_value: Optional[str]
    operator_id: str
    operator_role: UserRole
    timestamp: datetime = field(default_factory=datetime.now)
    notes: Optional[str] = None


@dataclass
class StateTransition:
    id: str
    entity_type: str
    entity_id: str
    from_status: str
    to_status: str
    triggered_by: str
    trigger_role: UserRole
    timestamp: datetime = field(default_factory=datetime.now)
    reason: Optional[str] = None


class PawnStatusConstraint:
    VALID_TRANSITIONS = {
        PawnStatus.PENDING: [PawnStatus.APPRAISED],
        PawnStatus.APPRAISED: [PawnStatus.APPROVED, PawnStatus.CLOSED],
        PawnStatus.APPROVED: [PawnStatus.ACTIVE],
        PawnStatus.ACTIVE: [PawnStatus.RENEWAL_PENDING, PawnStatus.REDEMPTION_PENDING, PawnStatus.OVERDUE],
        PawnStatus.RENEWAL_PENDING: [PawnStatus.RENEWAL_APPROVED, PawnStatus.ACTIVE, PawnStatus.DISPUTED],
        PawnStatus.RENEWAL_APPROVED: [PawnStatus.ACTIVE],
        PawnStatus.REDEMPTION_PENDING: [PawnStatus.REDEMPTION_APPROVED, PawnStatus.DISPUTED],
        PawnStatus.REDEMPTION_APPROVED: [PawnStatus.REDEEMED],
        PawnStatus.OVERDUE: [PawnStatus.RENEWAL_PENDING, PawnStatus.REDEMPTION_PENDING, PawnStatus.DISPUTED],
        PawnStatus.DISPUTED: [PawnStatus.ACTIVE, PawnStatus.REDEEMED, PawnStatus.CLOSED],
        PawnStatus.REDEEMED: [PawnStatus.CLOSED],
    }
    
    @classmethod
    def can_transition(cls, from_status: PawnStatus, to_status: PawnStatus) -> bool:
        return to_status in cls.VALID_TRANSITIONS.get(from_status, [])
    
    @classmethod
    def validate_transition(cls, from_status: PawnStatus, to_status: PawnStatus) -> None:
        if not cls.can_transition(from_status, to_status):
            raise ValueError(f"Invalid status transition: {from_status} -> {to_status}")


class RenewalStatusConstraint:
    VALID_TRANSITIONS = {
        RenewalStatus.DRAFT: [RenewalStatus.PENDING_ASSESSOR],
        RenewalStatus.PENDING_ASSESSOR: [RenewalStatus.PENDING_FINANCE, RenewalStatus.REJECTED],
        RenewalStatus.PENDING_FINANCE: [RenewalStatus.APPROVED, RenewalStatus.REJECTED],
        RenewalStatus.APPROVED: [RenewalStatus.CANCELLED],
        RenewalStatus.REJECTED: [RenewalStatus.DRAFT, RenewalStatus.CANCELLED],
    }
    
    @classmethod
    def can_transition(cls, from_status: RenewalStatus, to_status: RenewalStatus) -> bool:
        return to_status in cls.VALID_TRANSITIONS.get(from_status, [])
    
    @classmethod
    def validate_transition(cls, from_status: RenewalStatus, to_status: RenewalStatus) -> None:
        if not cls.can_transition(from_status, to_status):
            raise ValueError(f"Invalid renewal status transition: {from_status} -> {to_status}")


class RedemptionStatusConstraint:
    VALID_TRANSITIONS = {
        RedemptionStatus.DRAFT: [RedemptionStatus.PENDING_FINANCE],
        RedemptionStatus.PENDING_FINANCE: [RedemptionStatus.PENDING_WAREHOUSE, RedemptionStatus.DISPUTED],
        RedemptionStatus.PENDING_WAREHOUSE: [RedemptionStatus.PENDING_CUSTOMER, RedemptionStatus.DISPUTED],
        RedemptionStatus.PENDING_CUSTOMER: [RedemptionStatus.COMPLETED, RedemptionStatus.DISPUTED],
        RedemptionStatus.COMPLETED: [],
        RedemptionStatus.DISPUTED: [RedemptionStatus.PENDING_FINANCE, RedemptionStatus.CANCELLED],
    }
    
    @classmethod
    def can_transition(cls, from_status: RedemptionStatus, to_status: RedemptionStatus) -> bool:
        return to_status in cls.VALID_TRANSITIONS.get(from_status, [])
    
    @classmethod
    def validate_transition(cls, from_status: RedemptionStatus, to_status: RedemptionStatus) -> None:
        if not cls.can_transition(from_status, to_status):
            raise ValueError(f"Invalid redemption status transition: {from_status} -> {to_status}")


class FeeCalculationStatusConstraint:
    VALID_TRANSITIONS = {
        FeeCalculationStatus.DRAFT: [FeeCalculationStatus.PENDING_REVIEW],
        FeeCalculationStatus.PENDING_REVIEW: [FeeCalculationStatus.APPROVED, FeeCalculationStatus.DISPUTED],
        FeeCalculationStatus.APPROVED: [FeeCalculationStatus.SETTLED],
        FeeCalculationStatus.DISPUTED: [FeeCalculationStatus.PENDING_REVIEW, FeeCalculationStatus.SETTLED],
    }
    
    @classmethod
    def can_transition(cls, from_status: FeeCalculationStatus, to_status: FeeCalculationStatus) -> bool:
        return to_status in cls.VALID_TRANSITIONS.get(from_status, [])
    
    @classmethod
    def validate_transition(cls, from_status: FeeCalculationStatus, to_status: FeeCalculationStatus) -> None:
        if not cls.can_transition(from_status, to_status):
            raise ValueError(f"Invalid fee calculation status transition: {from_status} -> {to_status}")