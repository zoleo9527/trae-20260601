"""
续当赎当处理服务
重点解决：续当赎当与费用计算之间的责任划分、状态一致性
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict
from models import (
    PawnItem, RenewalRecord, RedemptionRecord, FeeCalculation,
    ResponsibilityChain, AuditLog, StateTransition,
    PawnStatus, RenewalStatus, RedemptionStatus, FeeCalculationStatus,
    UserRole, ResponsibilityStage,
    PawnStatusConstraint, RenewalStatusConstraint, 
    RedemptionStatusConstraint, FeeCalculationStatusConstraint
)
import uuid


class RenewalService:
    def __init__(self):
        self.renewals: Dict[str, RenewalRecord] = {}
        self.pawn_items: Dict[str, PawnItem] = {}
        self.responsibility_chains: Dict[str, ResponsibilityChain] = {}
        self.audit_logs: List[AuditLog] = []
        self.state_transitions: List[StateTransition] = []
    
    def create_renewal(
        self, 
        pawn_item_id: str, 
        new_due_date: date,
        operator_id: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        pawn_item = self.pawn_items.get(pawn_item_id)
        if not pawn_item:
            raise ValueError(f"Pawn item {pawn_item_id} not found")
        
        if pawn_item.status not in [PawnStatus.ACTIVE, PawnStatus.OVERDUE]:
            raise ValueError(f"Cannot renew pawn item with status {pawn_item.status}")
        
        PawnStatusConstraint.validate_transition(pawn_item.status, PawnStatus.RENEWAL_PENDING)
        
        renewal_id = str(uuid.uuid4())
        renewal = RenewalRecord(
            id=renewal_id,
            pawn_item_id=pawn_item_id,
            original_due_date=pawn_item.due_date,
            new_due_date=new_due_date,
            renewal_fee=Decimal("0"),
            status=RenewalStatus.DRAFT,
            current_handler=UserRole.ASSESSOR
        )
        
        self.renewals[renewal_id] = renewal
        
        self._add_responsibility_chain(
            pawn_item_id=pawn_item_id,
            stage=ResponsibilityStage.RENEWAL_PROCESSING,
            handler_id=operator_id,
            handler_role=operator_role,
            notes=f"Created renewal request for pawn item {pawn_item_id}"
        )
        
        self._log_audit(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            action="CREATE",
            old_value=None,
            new_value=f"Renewal created for pawn item {pawn_item_id}",
            operator_id=operator_id,
            operator_role=operator_role
        )
        
        return renewal
    
    def submit_to_assessor(
        self, 
        renewal_id: str, 
        operator_id: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        renewal = self.renewals.get(renewal_id)
        if not renewal:
            raise ValueError(f"Renewal {renewal_id} not found")
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.PENDING_ASSESSOR)
        
        old_status = renewal.status
        renewal.status = RenewalStatus.PENDING_ASSESSOR
        renewal.current_handler = UserRole.ASSESSOR
        renewal.updated_at = datetime.now()
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.PENDING_ASSESSOR.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="Submitted to assessor for review"
        )
        
        return renewal
    
    def assessor_approve(
        self, 
        renewal_id: str, 
        assessor_id: str,
        assessor_notes: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        renewal = self.renewals.get(renewal_id)
        if not renewal:
            raise ValueError(f"Renewal {renewal_id} not found")
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.PENDING_FINANCE)
        
        old_status = renewal.status
        renewal.status = RenewalStatus.PENDING_FINANCE
        renewal.assessor_id = assessor_id
        renewal.assessor_notes = assessor_notes
        renewal.current_handler = UserRole.FINANCE
        renewal.updated_at = datetime.now()
        
        self._add_responsibility_chain(
            pawn_item_id=renewal.pawn_item_id,
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id=assessor_id,
            handler_role=operator_role,
            notes=f"Assessor approved renewal: {assessor_notes}"
        )
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.PENDING_FINANCE.value,
            triggered_by=assessor_id,
            trigger_role=operator_role,
            reason=f"Assessor approved: {assessor_notes}"
        )
        
        return renewal
    
    def assessor_reject(
        self, 
        renewal_id: str, 
        assessor_id: str,
        reject_reason: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        renewal = self.renewals.get(renewal_id)
        if not renewal:
            raise ValueError(f"Renewal {renewal_id} not found")
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.REJECTED)
        
        old_status = renewal.status
        renewal.status = RenewalStatus.REJECTED
        renewal.assessor_id = assessor_id
        renewal.assessor_notes = reject_reason
        renewal.updated_at = datetime.now()
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.REJECTED.value,
            triggered_by=assessor_id,
            trigger_role=operator_role,
            reason=f"Assessor rejected: {reject_reason}"
        )
        
        return renewal
    
    def finance_approve(
        self, 
        renewal_id: str, 
        finance_id: str,
        finance_notes: str,
        fee_calculation_id: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        renewal = self.renewals.get(renewal_id)
        if not renewal:
            raise ValueError(f"Renewal {renewal_id} not found")
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.APPROVED)
        
        old_status = renewal.status
        renewal.status = RenewalStatus.APPROVED
        renewal.finance_id = finance_id
        renewal.finance_notes = finance_notes
        renewal.fee_calculation_id = fee_calculation_id
        renewal.updated_at = datetime.now()
        
        pawn_item = self.pawn_items.get(renewal.pawn_item_id)
        if pawn_item:
            old_pawn_status = pawn_item.status
            pawn_item.status = PawnStatus.RENEWAL_APPROVED
            pawn_item.due_date = renewal.new_due_date
            pawn_item.updated_at = datetime.now()
            
            self._log_state_transition(
                entity_type="PawnItem",
                entity_id=pawn_item.id,
                from_status=old_pawn_status.value,
                to_status=PawnStatus.RENEWAL_APPROVED.value,
                triggered_by=finance_id,
                trigger_role=operator_role,
                reason=f"Renewal approved, new due date: {renewal.new_due_date}"
            )
        
        self._add_responsibility_chain(
            pawn_item_id=renewal.pawn_item_id,
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id=finance_id,
            handler_role=operator_role,
            notes=f"Finance approved renewal: {finance_notes}"
        )
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.APPROVED.value,
            triggered_by=finance_id,
            trigger_role=operator_role,
            reason=f"Finance approved: {finance_notes}"
        )
        
        return renewal
    
    def _add_responsibility_chain(
        self, 
        pawn_item_id: str,
        stage: ResponsibilityStage,
        handler_id: str,
        handler_role: UserRole,
        notes: Optional[str] = None
    ):
        chain_id = str(uuid.uuid4())
        chain = ResponsibilityChain(
            id=chain_id,
            pawn_item_id=pawn_item_id,
            stage=stage,
            handler_id=handler_id,
            handler_role=handler_role,
            start_time=datetime.now(),
            notes=notes
        )
        self.responsibility_chains[chain_id] = chain
    
    def _log_audit(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        old_value: Optional[str],
        new_value: Optional[str],
        operator_id: str,
        operator_role: UserRole,
        notes: Optional[str] = None
    ):
        log_id = str(uuid.uuid4())
        log = AuditLog(
            id=log_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            operator_id=operator_id,
            operator_role=operator_role,
            notes=notes
        )
        self.audit_logs.append(log)
    
    def _log_state_transition(
        self,
        entity_type: str,
        entity_id: str,
        from_status: str,
        to_status: str,
        triggered_by: str,
        trigger_role: UserRole,
        reason: Optional[str] = None
    ):
        transition_id = str(uuid.uuid4())
        transition = StateTransition(
            id=transition_id,
            entity_type=entity_type,
            entity_id=entity_id,
            from_status=from_status,
            to_status=to_status,
            triggered_by=triggered_by,
            trigger_role=trigger_role,
            reason=reason
        )
        self.state_transitions.append(transition)


class RedemptionService:
    def __init__(self):
        self.redemptions: Dict[str, RedemptionRecord] = {}
        self.pawn_items: Dict[str, PawnItem] = {}
        self.responsibility_chains: Dict[str, ResponsibilityChain] = {}
        self.audit_logs: List[AuditLog] = []
        self.state_transitions: List[StateTransition] = []
    
    def create_redemption(
        self, 
        pawn_item_id: str,
        redemption_date: date,
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        pawn_item = self.pawn_items.get(pawn_item_id)
        if not pawn_item:
            raise ValueError(f"Pawn item {pawn_item_id} not found")
        
        if pawn_item.status not in [PawnStatus.ACTIVE, PawnStatus.OVERDUE, PawnStatus.RENEWAL_APPROVED]:
            raise ValueError(f"Cannot redeem pawn item with status {pawn_item.status}")
        
        PawnStatusConstraint.validate_transition(pawn_item.status, PawnStatus.REDEMPTION_PENDING)
        
        redemption_id = str(uuid.uuid4())
        redemption = RedemptionRecord(
            id=redemption_id,
            pawn_item_id=pawn_item_id,
            redemption_date=redemption_date,
            total_amount=Decimal("0"),
            status=RedemptionStatus.DRAFT,
            current_handler=UserRole.FINANCE
        )
        
        self.redemptions[redemption_id] = redemption
        
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.REDEMPTION_PENDING
        pawn_item.updated_at = datetime.now()
        
        self._add_responsibility_chain(
            pawn_item_id=pawn_item_id,
            stage=ResponsibilityStage.REDEMPTION_PROCESSING,
            handler_id=operator_id,
            handler_role=operator_role,
            notes=f"Created redemption request for pawn item {pawn_item_id}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item_id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.REDEMPTION_PENDING.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="Redemption initiated"
        )
        
        return redemption
    
    def submit_to_finance(
        self, 
        redemption_id: str, 
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self.redemptions.get(redemption_id)
        if not redemption:
            raise ValueError(f"Redemption {redemption_id} not found")
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.PENDING_FINANCE)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.PENDING_FINANCE
        redemption.current_handler = UserRole.FINANCE
        redemption.updated_at = datetime.now()
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.PENDING_FINANCE.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="Submitted to finance for fee calculation"
        )
        
        return redemption
    
    def finance_complete_calculation(
        self, 
        redemption_id: str, 
        finance_id: str,
        finance_notes: str,
        fee_calculation_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self.redemptions.get(redemption_id)
        if not redemption:
            raise ValueError(f"Redemption {redemption_id} not found")
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.PENDING_WAREHOUSE)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.PENDING_WAREHOUSE
        redemption.finance_id = finance_id
        redemption.finance_notes = finance_notes
        redemption.fee_calculation_id = fee_calculation_id
        redemption.current_handler = UserRole.WAREHOUSE
        redemption.updated_at = datetime.now()
        
        self._add_responsibility_chain(
            pawn_item_id=redemption.pawn_item_id,
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id=finance_id,
            handler_role=operator_role,
            notes=f"Finance completed fee calculation: {finance_notes}"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.PENDING_WAREHOUSE.value,
            triggered_by=finance_id,
            trigger_role=operator_role,
            reason=f"Finance completed: {finance_notes}"
        )
        
        return redemption
    
    def warehouse_confirm(
        self, 
        redemption_id: str, 
        warehouse_id: str,
        warehouse_notes: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self.redemptions.get(redemption_id)
        if not redemption:
            raise ValueError(f"Redemption {redemption_id} not found")
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.PENDING_CUSTOMER)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.PENDING_CUSTOMER
        redemption.warehouse_id = warehouse_id
        redemption.warehouse_notes = warehouse_notes
        redemption.updated_at = datetime.now()
        
        self._add_responsibility_chain(
            pawn_item_id=redemption.pawn_item_id,
            stage=ResponsibilityStage.WAREHOUSE_CUSTODY,
            handler_id=warehouse_id,
            handler_role=operator_role,
            notes=f"Warehouse confirmed item availability: {warehouse_notes}"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.PENDING_CUSTOMER.value,
            triggered_by=warehouse_id,
            trigger_role=operator_role,
            reason=f"Warehouse confirmed: {warehouse_notes}"
        )
        
        return redemption
    
    def customer_confirm(
        self, 
        redemption_id: str, 
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self.redemptions.get(redemption_id)
        if not redemption:
            raise ValueError(f"Redemption {redemption_id} not found")
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.COMPLETED)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.COMPLETED
        redemption.customer_confirmation = True
        redemption.updated_at = datetime.now()
        
        pawn_item = self.pawn_items.get(redemption.pawn_item_id)
        if pawn_item:
            old_pawn_status = pawn_item.status
            pawn_item.status = PawnStatus.REDEEMED
            pawn_item.updated_at = datetime.now()
            
            self._log_state_transition(
                entity_type="PawnItem",
                entity_id=pawn_item.id,
                from_status=old_pawn_status.value,
                to_status=PawnStatus.REDEEMED.value,
                triggered_by=operator_id,
                trigger_role=operator_role,
                reason="Redemption completed"
            )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.COMPLETED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="Customer confirmed redemption"
        )
        
        return redemption
    
    def raise_dispute(
        self, 
        redemption_id: str, 
        dispute_reason: str,
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self.redemptions.get(redemption_id)
        if not redemption:
            raise ValueError(f"Redemption {redemption_id} not found")
        
        if redemption.status not in [RedemptionStatus.PENDING_FINANCE, RedemptionStatus.PENDING_WAREHOUSE]:
            raise ValueError(f"Cannot raise dispute from status {redemption.status}")
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.DISPUTED)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.DISPUTED
        redemption.dispute_reason = dispute_reason
        redemption.updated_at = datetime.now()
        
        pawn_item = self.pawn_items.get(redemption.pawn_item_id)
        if pawn_item:
            old_pawn_status = pawn_item.status
            pawn_item.status = PawnStatus.DISPUTED
            pawn_item.updated_at = datetime.now()
            
            self._log_state_transition(
                entity_type="PawnItem",
                entity_id=pawn_item.id,
                from_status=old_pawn_status.value,
                to_status=PawnStatus.DISPUTED.value,
                triggered_by=operator_id,
                trigger_role=operator_role,
                reason=f"Dispute raised: {dispute_reason}"
            )
        
        self._log_audit(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            action="DISPUTE",
            old_value=old_status.value,
            new_value=RedemptionStatus.DISPUTED.value,
            operator_id=operator_id,
            operator_role=operator_role,
            notes=f"Dispute reason: {dispute_reason}"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.DISPUTED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason=f"Dispute raised: {dispute_reason}"
        )
        
        return redemption
    
    def _add_responsibility_chain(
        self, 
        pawn_item_id: str,
        stage: ResponsibilityStage,
        handler_id: str,
        handler_role: UserRole,
        notes: Optional[str] = None
    ):
        chain_id = str(uuid.uuid4())
        chain = ResponsibilityChain(
            id=chain_id,
            pawn_item_id=pawn_item_id,
            stage=stage,
            handler_id=handler_id,
            handler_role=handler_role,
            start_time=datetime.now(),
            notes=notes
        )
        self.responsibility_chains[chain_id] = chain
    
    def _log_audit(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        old_value: Optional[str],
        new_value: Optional[str],
        operator_id: str,
        operator_role: UserRole,
        notes: Optional[str] = None
    ):
        log_id = str(uuid.uuid4())
        log = AuditLog(
            id=log_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            operator_id=operator_id,
            operator_role=operator_role,
            notes=notes
        )
        self.audit_logs.append(log)
    
    def _log_state_transition(
        self,
        entity_type: str,
        entity_id: str,
        from_status: str,
        to_status: str,
        triggered_by: str,
        trigger_role: UserRole,
        reason: Optional[str] = None
    ):
        transition_id = str(uuid.uuid4())
        transition = StateTransition(
            id=transition_id,
            entity_type=entity_type,
            entity_id=entity_id,
            from_status=from_status,
            to_status=to_status,
            triggered_by=triggered_by,
            trigger_role=trigger_role,
            reason=reason
        )
        self.state_transitions.append(transition)