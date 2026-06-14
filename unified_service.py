"""
统一业务服务 - 整合续当、赎当、费用计算和审计日志
确保状态迁移和责任链交接的一致性
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from models import (
    PawnItem, RenewalRecord, RedemptionRecord, FeeCalculation,
    ResponsibilityChain, AuditLog, StateTransition,
    PawnStatus, RenewalStatus, RedemptionStatus, FeeCalculationStatus,
    UserRole, ResponsibilityStage,
    PawnStatusConstraint, RenewalStatusConstraint,
    RedemptionStatusConstraint, FeeCalculationStatusConstraint
)
import uuid


class UnifiedBusinessService:
    def __init__(self):
        self.pawn_items: Dict[str, PawnItem] = {}
        self.renewals: Dict[str, RenewalRecord] = {}
        self.redemptions: Dict[str, RedemptionRecord] = {}
        self.fee_calculations: Dict[str, FeeCalculation] = {}
        self.responsibility_chains: Dict[str, ResponsibilityChain] = {}
        self.audit_logs: List[AuditLog] = []
        self.state_transitions: List[StateTransition] = []
    
    def create_pawn_item(
        self,
        customer_id: str,
        item_name: str,
        item_description: str,
        appraised_value: Decimal,
        loan_amount: Decimal,
        interest_rate: Decimal,
        term_days: int,
        assessor_id: str
    ) -> PawnItem:
        pawn_id = str(uuid.uuid4())
        start_date = date.today()
        due_date = start_date + timedelta(days=term_days)
        
        pawn_item = PawnItem(
            id=pawn_id,
            customer_id=customer_id,
            item_name=item_name,
            item_description=item_description,
            appraised_value=appraised_value,
            loan_amount=loan_amount,
            interest_rate=interest_rate,
            term_days=term_days,
            start_date=start_date,
            due_date=due_date,
            status=PawnStatus.ACTIVE,
            assessor_id=assessor_id
        )
        
        self.pawn_items[pawn_id] = pawn_item
        
        self._record_responsibility(
            pawn_item_id=pawn_id,
            stage=ResponsibilityStage.APPRAISAL,
            handler_id=assessor_id,
            handler_role=UserRole.ASSESSOR,
            notes="典当品创建和初始评估"
        )
        
        self._log_audit(
            entity_type="PawnItem",
            entity_id=pawn_id,
            action="CREATE",
            old_value=None,
            new_value=f"典当品创建: {item_name}",
            operator_id=assessor_id,
            operator_role=UserRole.ASSESSOR
        )
        
        return pawn_item
    
    def create_renewal(
        self,
        pawn_item_id: str,
        new_due_date: date,
        operator_id: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        pawn_item = self._get_pawn_item(pawn_item_id)
        
        if pawn_item.status not in [PawnStatus.ACTIVE, PawnStatus.OVERDUE]:
            raise ValueError(f"典当品状态 {pawn_item.status} 不允许续当")
        
        PawnStatusConstraint.validate_transition(pawn_item.status, PawnStatus.RENEWAL_PENDING)
        
        self._end_active_responsibility(pawn_item_id, "续当申请创建，交接给续当处理")
        
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
        
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.RENEWAL_PENDING
        pawn_item.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=pawn_item_id,
            stage=ResponsibilityStage.RENEWAL_PROCESSING,
            handler_id=operator_id,
            handler_role=operator_role,
            notes=f"创建续当申请，新到期日期: {new_due_date}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item_id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.RENEWAL_PENDING.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="续当申请创建"
        )
        
        self._log_audit(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            action="CREATE",
            old_value=None,
            new_value=f"续当申请创建",
            operator_id=operator_id,
            operator_role=operator_role
        )
        
        return renewal
    
    def submit_renewal_to_assessor(
        self,
        renewal_id: str,
        operator_id: str,
        operator_role: UserRole
    ) -> RenewalRecord:
        renewal = self._get_renewal(renewal_id)
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.PENDING_ASSESSOR)
        
        self._end_active_responsibility(renewal.pawn_item_id, "续当申请提交，交接给评估师")
        
        old_status = renewal.status
        renewal.status = RenewalStatus.PENDING_ASSESSOR
        renewal.current_handler = UserRole.ASSESSOR
        renewal.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=renewal.pawn_item_id,
            stage=ResponsibilityStage.RENEWAL_PROCESSING,
            handler_id="assessor",
            handler_role=UserRole.ASSESSOR,
            notes="续当申请提交给评估师审核"
        )
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.PENDING_ASSESSOR.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="提交评估师审核"
        )
        
        return renewal
    
    def assessor_approve_renewal(
        self,
        renewal_id: str,
        assessor_id: str,
        assessor_notes: str
    ) -> RenewalRecord:
        renewal = self._get_renewal(renewal_id)
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.PENDING_FINANCE)
        
        self._end_active_responsibility(renewal.pawn_item_id, f"评估师审核通过: {assessor_notes}")
        
        old_status = renewal.status
        renewal.status = RenewalStatus.PENDING_FINANCE
        renewal.assessor_id = assessor_id
        renewal.assessor_notes = assessor_notes
        renewal.current_handler = UserRole.FINANCE
        renewal.updated_at = datetime.now()
        
        pawn_item = self._get_pawn_item(renewal.pawn_item_id)
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.RENEWAL_PENDING
        pawn_item.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=renewal.pawn_item_id,
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id="finance",
            handler_role=UserRole.FINANCE,
            notes=f"评估师审核通过，费用计算责任转移到财务: {assessor_notes}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item.id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.RENEWAL_PENDING.value,
            triggered_by=assessor_id,
            trigger_role=UserRole.ASSESSOR,
            reason=f"评估师审核通过: {assessor_notes}"
        )
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.PENDING_FINANCE.value,
            triggered_by=assessor_id,
            trigger_role=UserRole.ASSESSOR,
            reason=f"评估师审核通过: {assessor_notes}"
        )
        
        return renewal
    
    def assessor_reject_renewal(
        self,
        renewal_id: str,
        assessor_id: str,
        reject_reason: str
    ) -> RenewalRecord:
        renewal = self._get_renewal(renewal_id)
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.REJECTED)
        
        self._end_active_responsibility(renewal.pawn_item_id, f"评估师拒绝续当申请: {reject_reason}")
        
        old_status = renewal.status
        renewal.status = RenewalStatus.REJECTED
        renewal.assessor_id = assessor_id
        renewal.assessor_notes = reject_reason
        renewal.updated_at = datetime.now()
        
        pawn_item = self._get_pawn_item(renewal.pawn_item_id)
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.ACTIVE
        pawn_item.updated_at = datetime.now()
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item.id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.ACTIVE.value,
            triggered_by=assessor_id,
            trigger_role=UserRole.ASSESSOR,
            reason=f"续当申请被拒绝: {reject_reason}"
        )
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.REJECTED.value,
            triggered_by=assessor_id,
            trigger_role=UserRole.ASSESSOR,
            reason=f"评估师拒绝: {reject_reason}"
        )
        
        return renewal
    
    def finance_approve_renewal(
        self,
        renewal_id: str,
        finance_id: str,
        finance_notes: str
    ) -> RenewalRecord:
        renewal = self._get_renewal(renewal_id)
        
        self._end_active_responsibility(renewal.pawn_item_id, f"财务审核通过并完成费用计算: {finance_notes}")
        
        fee_calculation = self._calculate_renewal_fee(renewal.pawn_item_id, renewal_id, finance_id)
        
        RenewalStatusConstraint.validate_transition(renewal.status, RenewalStatus.APPROVED)
        
        old_status = renewal.status
        renewal.status = RenewalStatus.APPROVED
        renewal.finance_id = finance_id
        renewal.finance_notes = finance_notes
        renewal.fee_calculation_id = fee_calculation.id
        renewal.renewal_fee = fee_calculation.total_fee
        renewal.updated_at = datetime.now()
        
        pawn_item = self._get_pawn_item(renewal.pawn_item_id)
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.RENEWAL_APPROVED
        pawn_item.due_date = renewal.new_due_date
        pawn_item.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=renewal.pawn_item_id,
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id=finance_id,
            handler_role=UserRole.FINANCE,
            notes=f"续当批准，结算完成: {finance_notes}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item.id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.RENEWAL_APPROVED.value,
            triggered_by=finance_id,
            trigger_role=UserRole.FINANCE,
            reason=f"续当批准，新到期日期: {renewal.new_due_date}"
        )
        
        self._log_state_transition(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            from_status=old_status.value,
            to_status=RenewalStatus.APPROVED.value,
            triggered_by=finance_id,
            trigger_role=UserRole.FINANCE,
            reason=f"财务审核通过: {finance_notes}"
        )
        
        self._log_audit(
            entity_type="RenewalRecord",
            entity_id=renewal_id,
            action="APPROVE",
            old_value=old_status.value,
            new_value=f"renewal_fee={renewal.renewal_fee}",
            operator_id=finance_id,
            operator_role=UserRole.FINANCE,
            notes=f"续当费用回写: {renewal.renewal_fee}"
        )
        
        return renewal
    
    def create_redemption(
        self,
        pawn_item_id: str,
        redemption_date: date,
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        pawn_item = self._get_pawn_item(pawn_item_id)
        
        if pawn_item.status not in [PawnStatus.ACTIVE, PawnStatus.OVERDUE, PawnStatus.RENEWAL_APPROVED]:
            raise ValueError(f"典当品状态 {pawn_item.status} 不允许赎当")
        
        PawnStatusConstraint.validate_transition(pawn_item.status, PawnStatus.REDEMPTION_PENDING)
        
        self._end_active_responsibility(pawn_item_id, "赎当申请创建，交接给赎当处理")
        
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
        
        self._record_responsibility(
            pawn_item_id=pawn_item_id,
            stage=ResponsibilityStage.REDEMPTION_PROCESSING,
            handler_id=operator_id,
            handler_role=operator_role,
            notes=f"创建赎当申请，赎当日期: {redemption_date}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item_id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.REDEMPTION_PENDING.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="赎当申请创建"
        )
        
        self._log_audit(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            action="CREATE",
            old_value=None,
            new_value=f"赎当申请创建",
            operator_id=operator_id,
            operator_role=operator_role
        )
        
        return redemption
    
    def submit_redemption_to_finance(
        self,
        redemption_id: str,
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self._get_redemption(redemption_id)
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.PENDING_FINANCE)
        
        self._end_active_responsibility(redemption.pawn_item_id, "赎当申请提交，交接给财务")
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.PENDING_FINANCE
        redemption.current_handler = UserRole.FINANCE
        redemption.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=redemption.pawn_item_id,
            stage=ResponsibilityStage.REDEMPTION_PROCESSING,
            handler_id="finance",
            handler_role=UserRole.FINANCE,
            notes="赎当申请提交给财务审核"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.PENDING_FINANCE.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="提交财务审核"
        )
        
        return redemption
    
    def finance_complete_redemption(
        self,
        redemption_id: str,
        finance_id: str,
        finance_notes: str
    ) -> RedemptionRecord:
        redemption = self._get_redemption(redemption_id)
        
        self._end_active_responsibility(redemption.pawn_item_id, f"财务完成费用计算: {finance_notes}")
        
        fee_calculation = self._calculate_redemption_fee(redemption.pawn_item_id, redemption_id, finance_id)
        
        pawn_item = self._get_pawn_item(redemption.pawn_item_id)
        total_amount = pawn_item.loan_amount + fee_calculation.total_fee
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.PENDING_WAREHOUSE)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.PENDING_WAREHOUSE
        redemption.finance_id = finance_id
        redemption.finance_notes = finance_notes
        redemption.fee_calculation_id = fee_calculation.id
        redemption.total_amount = total_amount
        redemption.current_handler = UserRole.WAREHOUSE
        redemption.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=redemption.pawn_item_id,
            stage=ResponsibilityStage.REDEMPTION_PROCESSING,
            handler_id=finance_id,
            handler_role=UserRole.FINANCE,
            notes=f"财务完成费用计算，total_amount回写: {total_amount}"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.PENDING_WAREHOUSE.value,
            triggered_by=finance_id,
            trigger_role=UserRole.FINANCE,
            reason=f"财务完成费用计算: {finance_notes}"
        )
        
        self._log_audit(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            action="FEE_CALCULATED",
            old_value=old_status.value,
            new_value=f"total_amount={total_amount}",
            operator_id=finance_id,
            operator_role=UserRole.FINANCE,
            notes=f"赎当费用回写: 本金{pawn_item.loan_amount} + 费用{fee_calculation.total_fee} = {total_amount}"
        )
        
        return redemption
    
    def warehouse_confirm_redemption(
        self,
        redemption_id: str,
        warehouse_id: str,
        warehouse_notes: str
    ) -> RedemptionRecord:
        redemption = self._get_redemption(redemption_id)
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.PENDING_CUSTOMER)
        
        self._end_active_responsibility(redemption.pawn_item_id, f"库管确认物品: {warehouse_notes}")
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.PENDING_CUSTOMER
        redemption.warehouse_id = warehouse_id
        redemption.warehouse_notes = warehouse_notes
        redemption.current_handler = UserRole.WAREHOUSE
        redemption.updated_at = datetime.now()
        
        pawn_item = self._get_pawn_item(redemption.pawn_item_id)
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.REDEMPTION_PENDING
        pawn_item.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=redemption.pawn_item_id,
            stage=ResponsibilityStage.WAREHOUSE_CUSTODY,
            handler_id=warehouse_id,
            handler_role=UserRole.WAREHOUSE,
            notes=f"库管确认物品，等待客户确认: {warehouse_notes}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item.id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.REDEMPTION_PENDING.value,
            triggered_by=warehouse_id,
            trigger_role=UserRole.WAREHOUSE,
            reason=f"库管确认: {warehouse_notes}"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.PENDING_CUSTOMER.value,
            triggered_by=warehouse_id,
            trigger_role=UserRole.WAREHOUSE,
            reason=f"库管确认: {warehouse_notes}"
        )
        
        return redemption
    
    def customer_confirm_redemption(
        self,
        redemption_id: str,
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self._get_redemption(redemption_id)
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.COMPLETED)
        
        self._end_active_responsibility(redemption.pawn_item_id, "客户确认赎当")
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.COMPLETED
        redemption.customer_confirmation = True
        redemption.updated_at = datetime.now()
        
        pawn_item = self._get_pawn_item(redemption.pawn_item_id)
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.REDEEMED
        pawn_item.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=redemption.pawn_item_id,
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id=operator_id,
            handler_role=operator_role,
            notes=f"赎当完成，客户确认赎当"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item.id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.REDEEMED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="赎当完成"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.COMPLETED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason="客户确认赎当"
        )
        
        return redemption
    
    def raise_redemption_dispute(
        self,
        redemption_id: str,
        dispute_reason: str,
        operator_id: str,
        operator_role: UserRole
    ) -> RedemptionRecord:
        redemption = self._get_redemption(redemption_id)
        
        RedemptionStatusConstraint.validate_transition(redemption.status, RedemptionStatus.DISPUTED)
        
        old_status = redemption.status
        redemption.status = RedemptionStatus.DISPUTED
        redemption.dispute_reason = dispute_reason
        redemption.updated_at = datetime.now()
        
        pawn_item = self._get_pawn_item(redemption.pawn_item_id)
        old_pawn_status = pawn_item.status
        pawn_item.status = PawnStatus.DISPUTED
        pawn_item.updated_at = datetime.now()
        
        self._log_audit(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            action="DISPUTE",
            old_value=old_status.value,
            new_value=RedemptionStatus.DISPUTED.value,
            operator_id=operator_id,
            operator_role=operator_role,
            notes=f"争议原因: {dispute_reason}"
        )
        
        self._log_state_transition(
            entity_type="PawnItem",
            entity_id=pawn_item.id,
            from_status=old_pawn_status.value,
            to_status=PawnStatus.DISPUTED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason=f"赎当争议: {dispute_reason}"
        )
        
        self._log_state_transition(
            entity_type="RedemptionRecord",
            entity_id=redemption_id,
            from_status=old_status.value,
            to_status=RedemptionStatus.DISPUTED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason=f"争议提起: {dispute_reason}"
        )
        
        return redemption
    
    def calculate_fees(
        self,
        pawn_item_id: str,
        calculation_date: date,
        calculator_id: str
    ) -> FeeCalculation:
        pawn_item = self._get_pawn_item(pawn_item_id)
        
        days_elapsed = (calculation_date - pawn_item.start_date).days
        if days_elapsed < 0:
            raise ValueError("计算日期不能早于起始日期")
        
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
        
        self._record_responsibility(
            pawn_item_id=pawn_item_id,
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id=calculator_id,
            handler_role=UserRole.FINANCE,
            notes=f"费用计算创建"
        )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="CREATE",
            old_value=None,
            new_value=f"费用计算: 总费用={total_fee}",
            operator_id=calculator_id,
            operator_role=UserRole.FINANCE
        )
        
        return fee_calculation
    
    def submit_fee_for_review(
        self,
        calculation_id: str,
        operator_id: str
    ) -> FeeCalculation:
        fee_calculation = self._get_fee_calculation(calculation_id)
        
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
            trigger_role=UserRole.FINANCE,
            reason="提交审核"
        )
        
        return fee_calculation
    
    def approve_fee_calculation(
        self,
        calculation_id: str,
        reviewer_id: str,
        review_notes: str,
        create_settlement_chain: bool = True
    ) -> FeeCalculation:
        fee_calculation = self._get_fee_calculation(calculation_id)
        
        FeeCalculationStatusConstraint.validate_transition(
            fee_calculation.status,
            FeeCalculationStatus.APPROVED
        )
        
        self._end_active_responsibility(fee_calculation.pawn_item_id, f"费用计算审核通过: {review_notes}")
        
        old_status = fee_calculation.status
        fee_calculation.status = FeeCalculationStatus.APPROVED
        fee_calculation.reviewer_id = reviewer_id
        fee_calculation.review_notes = review_notes
        fee_calculation.updated_at = datetime.now()
        
        if create_settlement_chain:
            self._record_responsibility(
                pawn_item_id=fee_calculation.pawn_item_id,
                stage=ResponsibilityStage.SETTLEMENT,
                handler_id=reviewer_id,
                handler_role=UserRole.FINANCE,
                notes=f"费用计算审核通过: {review_notes}"
            )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="APPROVE",
            old_value=old_status.value,
            new_value=FeeCalculationStatus.APPROVED.value,
            operator_id=reviewer_id,
            operator_role=UserRole.FINANCE,
            notes=f"审核意见: {review_notes}"
        )
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.APPROVED.value,
            triggered_by=reviewer_id,
            trigger_role=UserRole.FINANCE,
            reason=f"审核通过: {review_notes}"
        )
        
        return fee_calculation
    
    def raise_fee_dispute(
        self,
        calculation_id: str,
        dispute_reason: str,
        operator_id: str,
        operator_role: UserRole
    ) -> FeeCalculation:
        fee_calculation = self._get_fee_calculation(calculation_id)
        
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
            notes=f"争议原因: {dispute_reason}"
        )
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.DISPUTED.value,
            triggered_by=operator_id,
            trigger_role=operator_role,
            reason=f"争议提起: {dispute_reason}"
        )
        
        return fee_calculation
    
    def settle_fee_dispute(
        self,
        calculation_id: str,
        settlement_notes: str,
        operator_id: str
    ) -> FeeCalculation:
        fee_calculation = self._get_fee_calculation(calculation_id)
        
        FeeCalculationStatusConstraint.validate_transition(
            fee_calculation.status,
            FeeCalculationStatus.SETTLED
        )
        
        self._end_active_responsibility(fee_calculation.pawn_item_id, f"争议解决: {settlement_notes}")
        
        old_status = fee_calculation.status
        fee_calculation.status = FeeCalculationStatus.SETTLED
        fee_calculation.updated_at = datetime.now()
        
        self._record_responsibility(
            pawn_item_id=fee_calculation.pawn_item_id,
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id=operator_id,
            handler_role=UserRole.MANAGER,
            notes=f"争议解决: {settlement_notes}"
        )
        
        self._log_audit(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            action="SETTLE",
            old_value=old_status.value,
            new_value=FeeCalculationStatus.SETTLED.value,
            operator_id=operator_id,
            operator_role=UserRole.MANAGER,
            notes=f"解决意见: {settlement_notes}"
        )
        
        self._log_state_transition(
            entity_type="FeeCalculation",
            entity_id=calculation_id,
            from_status=old_status.value,
            to_status=FeeCalculationStatus.SETTLED.value,
            triggered_by=operator_id,
            trigger_role=UserRole.MANAGER,
            reason=f"争议解决: {settlement_notes}"
        )
        
        return fee_calculation
    
    def get_fee_calculation_history(self, pawn_item_id: str) -> List[FeeCalculation]:
        return [
            calc for calc in self.fee_calculations.values()
            if calc.pawn_item_id == pawn_item_id
        ]
    
    def get_fee_calculation_details(self, calculation_id: str) -> Dict[str, Any]:
        fee_calculation = self._get_fee_calculation(calculation_id)
        pawn_item = self._get_pawn_item(fee_calculation.pawn_item_id)
        
        chains = [
            chain for chain in self.responsibility_chains.values()
            if chain.pawn_item_id == fee_calculation.pawn_item_id
        ]
        
        logs = [
            log for log in self.audit_logs
            if log.entity_id == calculation_id
        ]
        
        transitions = [
            transition for transition in self.state_transitions
            if transition.entity_id == calculation_id
        ]
        
        return {
            "calculation": fee_calculation,
            "pawn_item": pawn_item,
            "responsibility_chains": chains,
            "audit_trail": logs,
            "state_transitions": transitions
        }
    
    def query_audit_logs(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        operator_id: Optional[str] = None,
        operator_role: Optional[UserRole] = None,
        action: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[AuditLog]:
        results = []
        
        for log in self.audit_logs:
            if entity_type and log.entity_type != entity_type:
                continue
            if entity_id and log.entity_id != entity_id:
                continue
            if operator_id and log.operator_id != operator_id:
                continue
            if operator_role and log.operator_role != operator_role:
                continue
            if action and log.action != action:
                continue
            if start_date and log.timestamp.date() < start_date:
                continue
            if end_date and log.timestamp.date() > end_date:
                continue
            
            results.append(log)
        
        return sorted(results, key=lambda x: x.timestamp, reverse=True)
    
    def query_state_transitions(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        triggered_by: Optional[str] = None,
        trigger_role: Optional[UserRole] = None,
        from_status: Optional[str] = None,
        to_status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[StateTransition]:
        results = []
        
        for transition in self.state_transitions:
            if entity_type and transition.entity_type != entity_type:
                continue
            if entity_id and transition.entity_id != entity_id:
                continue
            if triggered_by and transition.triggered_by != triggered_by:
                continue
            if trigger_role and transition.trigger_role != trigger_role:
                continue
            if from_status and transition.from_status != from_status:
                continue
            if to_status and transition.to_status != to_status:
                continue
            if start_date and transition.timestamp.date() < start_date:
                continue
            if end_date and transition.timestamp.date() > end_date:
                continue
            
            results.append(transition)
        
        return sorted(results, key=lambda x: x.timestamp, reverse=True)
    
    def query_responsibility_chains(
        self,
        pawn_item_id: Optional[str] = None,
        stage: Optional[ResponsibilityStage] = None,
        handler_id: Optional[str] = None,
        handler_role: Optional[UserRole] = None,
        status: Optional[str] = None,
        active_only: bool = False
    ) -> List[ResponsibilityChain]:
        results = []
        
        for chain in self.responsibility_chains.values():
            if pawn_item_id and chain.pawn_item_id != pawn_item_id:
                continue
            if stage and chain.stage != stage:
                continue
            if handler_id and chain.handler_id != handler_id:
                continue
            if handler_role and chain.handler_role != handler_role:
                continue
            if status and chain.status != status:
                continue
            if active_only and chain.status != "active":
                continue
            
            results.append(chain)
        
        return sorted(results, key=lambda x: x.start_time, reverse=True)
    
    def get_entity_audit_trail(
        self,
        entity_type: str,
        entity_id: str
    ) -> Dict[str, Any]:
        audit_logs = self.query_audit_logs(entity_type=entity_type, entity_id=entity_id)
        state_transitions = self.query_state_transitions(entity_type=entity_type, entity_id=entity_id)
        
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "audit_logs": audit_logs,
            "state_transitions": state_transitions
        }
    
    def get_responsibility_report(self, pawn_item_id: str) -> Dict[str, Any]:
        all_chains = self.query_responsibility_chains(pawn_item_id=pawn_item_id)
        active_chains = self.query_responsibility_chains(pawn_item_id=pawn_item_id, active_only=True)
        completed_chains = self.query_responsibility_chains(pawn_item_id=pawn_item_id, status="completed")
        
        stages = {}
        for chain in all_chains:
            stage_name = chain.stage.value if hasattr(chain.stage, 'value') else chain.stage
            if stage_name not in stages:
                stages[stage_name] = []
            
            duration = None
            if chain.end_time:
                duration = (chain.end_time - chain.start_time).total_seconds()
            
            stages[stage_name].append({
                "handler_id": chain.handler_id,
                "handler_role": chain.handler_role.value,
                "start_time": chain.start_time.isoformat(),
                "end_time": chain.end_time.isoformat() if chain.end_time else None,
                "duration_seconds": duration,
                "status": chain.status,
                "notes": chain.notes
            })
        
        return {
            "pawn_item_id": pawn_item_id,
            "responsibility_stages": stages,
            "total_handlers": len(all_chains),
            "active_handlers": len(active_chains),
            "completed_handlers": len(completed_chains),
            "current_active_handlers": [
                {
                    "handler_id": chain.handler_id,
                    "handler_role": chain.handler_role.value,
                    "stage": chain.stage.value,
                    "start_time": chain.start_time.isoformat(),
                    "notes": chain.notes
                }
                for chain in active_chains
            ]
        }
    
    def get_dispute_evidence(
        self,
        entity_type: str,
        entity_id: str
    ) -> Dict[str, Any]:
        audit_trail = self.get_entity_audit_trail(entity_type, entity_id)
        
        all_logs = self.query_audit_logs(entity_type=entity_type, entity_id=entity_id)
        dispute_logs = [log for log in all_logs if log.action in ["DISPUTE", "REJECT", "RECALCULATE"]]
        
        timeline = sorted(
            [
                {
                    "type": "audit_log",
                    "action": log.action,
                    "timestamp": log.timestamp.isoformat(),
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role.value,
                    "details": log.notes
                }
                for log in audit_trail["audit_logs"]
            ] +
            [
                {
                    "type": "state_transition",
                    "from_status": transition.from_status,
                    "to_status": transition.to_status,
                    "timestamp": transition.timestamp.isoformat(),
                    "triggered_by": transition.triggered_by,
                    "trigger_role": transition.trigger_role.value,
                    "reason": transition.reason
                }
                for transition in audit_trail["state_transitions"]
            ],
            key=lambda x: x["timestamp"]
        )
        
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "audit_trail": audit_trail,
            "dispute_records": [
                {
                    "action": log.action,
                    "timestamp": log.timestamp.isoformat(),
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role.value,
                    "details": log.notes
                }
                for log in dispute_logs
            ],
            "timeline": timeline
        }
    
    def _end_active_responsibility(self, pawn_item_id: str, reason: str):
        for chain in self.responsibility_chains.values():
            if chain.pawn_item_id == pawn_item_id and chain.status == "active":
                chain.end_time = datetime.now()
                chain.status = "completed"
                chain.notes = f"{chain.notes}; {reason}" if chain.notes else reason
    
    def _calculate_renewal_fee(
        self,
        pawn_item_id: str,
        renewal_id: str,
        calculator_id: str
    ) -> FeeCalculation:
        renewal = self._get_renewal(renewal_id)
        
        fee_calculation = self.calculate_fees(
            pawn_item_id=pawn_item_id,
            calculation_date=renewal.original_due_date,
            calculator_id=calculator_id
        )
        
        self.submit_fee_for_review(fee_calculation.id, calculator_id)
        self.approve_fee_calculation(fee_calculation.id, calculator_id, "续当费用计算", create_settlement_chain=False)
        
        return fee_calculation
    
    def _calculate_redemption_fee(
        self,
        pawn_item_id: str,
        redemption_id: str,
        calculator_id: str
    ) -> FeeCalculation:
        redemption = self._get_redemption(redemption_id)
        
        fee_calculation = self.calculate_fees(
            pawn_item_id=pawn_item_id,
            calculation_date=redemption.redemption_date,
            calculator_id=calculator_id
        )
        
        self.submit_fee_for_review(fee_calculation.id, calculator_id)
        self.approve_fee_calculation(fee_calculation.id, calculator_id, "赎当费用计算", create_settlement_chain=False)
        
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
    
    def _get_pawn_item(self, pawn_item_id: str) -> PawnItem:
        pawn_item = self.pawn_items.get(pawn_item_id)
        if not pawn_item:
            raise ValueError(f"典当品 {pawn_item_id} 不存在")
        return pawn_item
    
    def _get_renewal(self, renewal_id: str) -> RenewalRecord:
        renewal = self.renewals.get(renewal_id)
        if not renewal:
            raise ValueError(f"续当记录 {renewal_id} 不存在")
        return renewal
    
    def _get_redemption(self, redemption_id: str) -> RedemptionRecord:
        redemption = self.redemptions.get(redemption_id)
        if not redemption:
            raise ValueError(f"赎当记录 {redemption_id} 不存在")
        return redemption
    
    def _get_fee_calculation(self, calculation_id: str) -> FeeCalculation:
        fee_calculation = self.fee_calculations.get(calculation_id)
        if not fee_calculation:
            raise ValueError(f"费用计算 {calculation_id} 不存在")
        return fee_calculation
    
    def _record_responsibility(
        self,
        pawn_item_id: str,
        stage: ResponsibilityStage,
        handler_id: str,
        handler_role: UserRole,
        notes: str
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
            timestamp=datetime.now(),
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
            timestamp=datetime.now(),
            reason=reason
        )
        self.state_transitions.append(transition)