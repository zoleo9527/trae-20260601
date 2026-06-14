"""
费用计算与回看服务
重点解决：费用计算的准确性、可追溯性、责任划分
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict
from models import (
    PawnItem, FeeCalculation, ResponsibilityChain, AuditLog, StateTransition,
    PawnStatus, FeeCalculationStatus, UserRole, ResponsibilityStage,
    FeeCalculationStatusConstraint
)
import uuid


class FeeCalculationService:
    def __init__(self):
        self.fee_calculations: Dict[str, FeeCalculation] = {}
        self.pawn_items: Dict[str, PawnItem] = {}
        self.responsibility_chains: Dict[str, ResponsibilityChain] = {}
        self.audit_logs: List[AuditLog] = []
        self.state_transitions: List[StateTransition] = []
    
    def calculate_fees(
        self,
        pawn_item_id: str,
        calculation_date: date,
        calculator_id: str,
        operator_role: UserRole
    ) -> FeeCalculation:
        pawn_item = self.pawn_items.get(pawn_item_id)
        if not pawn_item:
            raise ValueError(f"Pawn item {pawn_item_id} not found")
        
        days_elapsed = (calculation_date - pawn_item.start_date).days
        if days_elapsed < 0:
            raise ValueError("Calculation date cannot be before start date")
        
        interest_amount = self._calculate_interest(
            pawn_item.loan_amount,
            pawn_item.interest_rate,
            days_elapsed
        )
        
        service_fee = self._calculate_service_fee(pawn_item.loan_amount, days_elapsed)
        
        storage_fee = self._calculate_storage_fee(pawn_item.appraised_value, days_elapsed)
        
        penalty_fee = Decimal("0")
        if calculation_date > pawn_item.due_date:
            overdue_days = (calculation_date - pawn_item.due_date).days
            penalty_fee = self._calculate_penalty_fee(pawn_item.loan_amount, overdue_days)
        
        total_fee = interest_amount + service_fee + storage_fee + penalty_fee
        
        calculation_id = str(uuid.uuid4())
        fee_calculation = FeeCalculation(
            id=calculation_id,
            pawn_item_id=pawn_item_id,
            calculation_date=calculation_date,
            principal=pawn_item.loan_amount,
            interest_amount=interest_amount,
            service_fee=service_fee,
            storage_fee=storage_fee,
            penalty_fee=penalty_fee,
            total_fee=total_fee,
            status=FeeCalculationStatus.DRAFT,
            calculator_id=calculator_id
        )
        
        self.fee_calculations[calculation_id] = fee_calculation
        
        self._add_responsibility_chain(
            pawn_item_id=pawn_item_id,
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id=calculator_id,
            handler_role=operator_role,
            notes=f"Fee calculation created for pawn item {pawn_item_id}"
        )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="CREATE",
            old_value=None,
            new_value=f"Fee calculation: total={total_fee}",
            operator_id=calculator_id,
            operator_role=operator_role
        )
        
        return fee_calculation
    
    def _calculate_interest(
        self, 
        principal: Decimal, 
        annual_rate: Decimal, 
        days: int
    ) -> Decimal:
        daily_rate = annual_rate / Decimal("365")
        interest = principal * daily_rate * Decimal(str(days))
        return interest.quantize(Decimal("0.01"))
    
    def _calculate_service_fee(
        self, 
        loan_amount: Decimal, 
        days: int
    ) -> Decimal:
        base_fee = loan_amount * Decimal("0.01")
        if days > 30:
            additional_fee = (days - 30) * Decimal("10")
            return (base_fee + additional_fee).quantize(Decimal("0.01"))
        return base_fee.quantize(Decimal("0.01"))
    
    def _calculate_storage_fee(
        self, 
        appraised_value: Decimal, 
        days: int
    ) -> Decimal:
        daily_rate = appraised_value * Decimal("0.0001")
        storage_fee = daily_rate * Decimal(str(days))
        return storage_fee.quantize(Decimal("0.01"))
    
    def _calculate_penalty_fee(
        self, 
        loan_amount: Decimal, 
        overdue_days: int
    ) -> Decimal:
        penalty_rate = Decimal("0.05")
        penalty = loan_amount * penalty_rate * Decimal(str(overdue_days)) / Decimal("30")
        return penalty.quantize(Decimal("0.01"))
    
    def submit_for_review(
        self,
        calculation_id: str,
        operator_id: str,
        operator_role: UserRole
    ) -> FeeCalculation:
        fee_calculation = self.fee_calculations.get(calculation_id)
        if not fee_calculation:
            raise ValueError(f"Fee calculation {calculation_id} not found")
        
        FeeCalculationStatusConstraint.validate_transition(
            fee_calculation.status, 
            FeeCalculationStatus.PENDING_REVIEW
        )
        
        old_status = fee_calculation.status
        fee_calculation.status = FeeCalculationStatus.PENDING_REVIEW
        fee_calculation.updated_at = datetime.now()
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.PENDING_REVIEW.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="Submitted for review"
        )
        
        return fee_calculation
    
    def approve_calculation(
        self,
        calculation_id: str,
        reviewer_id: str,
        reviewer_role: UserRole,
        review_notes: str
    ) -> FeeCalculation:
        fee_calculation = self.fee_calculations.get(calculation_id)
        if not fee_calculation:
            raise ValueError(f"Fee calculation {calculation_id} not found")
        
        FeeCalculationStatusConstraint.validate_transition(
            fee_calculation.status,
            FeeCalculationStatus.APPROVED
        )
        
        old_status = fee_calculation.status
        fee_calculation.status = FeeCalculationStatus.APPROVED
        fee_calculation.reviewer_id = reviewer_id
        fee_calculation.review_notes = review_notes
        fee_calculation.updated_at = datetime.now()
        
        self._add_responsibility_chain(
            pawn_item_id=fee_calculation.pawn_item_id,
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id=reviewer_id,
            handler_role=reviewer_role,
            notes=f"Fee calculation approved: {review_notes}"
        )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="APPROVE",
            old_value=old_status.value,
            new_value=FeeCalculationStatus.APPROVED.value,
            operator_id=reviewer_id,
            operator_role=reviewer_role,
            notes=f"Review notes: {review_notes}"
        )
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.APPROVED.value,
            triggered_by=reviewer_id,
            trigger_role=reviewer_role,
            reason=f"Approved: {review_notes}"
        )
        
        return fee_calculation
    
    def raise_dispute(
        self,
        calculation_id: str,
        dispute_reason: str,
        operator_id: str,
        operator_role: UserRole
    ) -> FeeCalculation:
        fee_calculation = self.fee_calculations.get(calculation_id)
        if not fee_calculation:
            raise ValueError(f"Fee calculation {calculation_id} not found")
        
        FeeCalculationStatusConstraint.validate_transition(
            fee_calculation.status,
            FeeCalculationStatus.DISPUTED
        )
        
        old_status = fee_calculation.status
        fee_calculation.status = FeeCalculationStatus.DISPUTED
        fee_calculation.dispute_reason = dispute_reason
        fee_calculation.updated_at = datetime.now()
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="DISPUTE",
            old_value=old_status.value,
            new_value=FeeCalculationStatus.DISPUTED.value,
            operator_id=operator_id,
            operator_role=operator_role,
            notes=f"Dispute reason: {dispute_reason}"
        )
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.DISPUTED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason=f"Dispute raised: {dispute_reason}"
        )
        
        return fee_calculation
    
    def settle_dispute(
        self,
        calculation_id: str,
        settlement_notes: str,
        operator_id: str,
        operator_role: UserRole
    ) -> FeeCalculation:
        fee_calculation = self.fee_calculations.get(calculation_id)
        if not fee_calculation:
            raise ValueError(f"Fee calculation {calculation_id} not found")
        
        FeeCalculationStatusConstraint.validate_transition(
            fee_calculation.status,
            FeeCalculationStatus.SETTLED
        )
        
        old_status = fee_calculation.status
        fee_calculation.status = FeeCalculationStatus.SETTLED
        fee_calculation.updated_at = datetime.now()
        
        self._add_responsibility_chain(
            pawn_item_id=fee_calculation.pawn_item_id,
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id=operator_id,
            handler_role=operator_role,
            notes=f"Dispute settled: {settlement_notes}"
        )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="SETTLE",
            old_value=old_status.value,
            new_value=FeeCalculationStatus.SETTLED.value,
            operator_id=operator_id,
            operator_role=operator_role,
            notes=f"Settlement: {settlement_notes}"
        )
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.SETTLED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason=f"Dispute settled: {settlement_notes}"
        )
        
        return fee_calculation
    
    def get_calculation_history(
        self, 
        pawn_item_id: str
    ) -> List[FeeCalculation]:
        return [
            calc for calc in self.fee_calculations.values()
            if calc.pawn_item_id == pawn_item_id
        ]
    
    def get_calculation_details(
        self, 
        calculation_id: str
    ) -> Dict:
        fee_calculation = self.fee_calculations.get(calculation_id)
        if not fee_calculation:
            raise ValueError(f"Fee calculation {calculation_id} not found")
        
        pawn_item = self.pawn_items.get(fee_calculation.pawn_item_id)
        
        return {
            "calculation": fee_calculation,
            "pawn_item": pawn_item,
            "responsibility_chains": [
                chain for chain in self.responsibility_chains.values()
                if chain.pawn_item_id == fee_calculation.pawn_item_id
            ],
            "audit_trail": [
                log for log in self.audit_logs
                if log.entity_id == calculation_id
            ],
            "state_transitions": [
                transition for transition in self.state_transitions
                if transition.entity_id == calculation_id
            ]
        }
    
    def recalculate_fees(
        self,
        calculation_id: str,
        new_calculation_date: date,
        operator_id: str,
        operator_role: UserRole,
        reason: str
    ) -> FeeCalculation:
        old_calculation = self.fee_calculations.get(calculation_id)
        if not old_calculation:
            raise ValueError(f"Fee calculation {calculation_id} not found")
        
        if old_calculation.status not in [FeeCalculationStatus.DRAFT, FeeCalculationStatus.DISPUTED]:
            raise ValueError(f"Cannot recalculate fee with status {old_calculation.status}")
        
        new_calculation = self.calculate_fees(
            pawn_item_id=old_calculation.pawn_item_id,
            calculation_date=new_calculation_date,
            calculator_id=operator_id,
            operator_role=operator_role
        )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="RECALCULATE",
            old_value=f"Total: {old_calculation.total_fee}",
            new_value=f"Total: {new_calculation.total_fee}",
            operator_id=operator_id,
            operator_role=operator_role,
            notes=f"Reason: {reason}"
        )
        
        return new_calculation
    
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