"""
FastAPI 应用 - 典当行续当赎当与费用计算系统
真实路由实现
"""

from fastapi import FastAPI, HTTPException, Query, Path
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from decimal import Decimal
from models import UserRole, ResponsibilityStage
from unified_service import UnifiedBusinessService

app = FastAPI(
    title="典当行续当赎当与费用计算系统",
    description="解决续当赎当与费用计算之间的责任划分、状态一致性问题",
    version="1.0.0"
)

service = UnifiedBusinessService()


class CreatePawnItemRequest(BaseModel):
    customer_id: str
    item_name: str
    item_description: str
    appraised_value: Decimal = Field(gt=0)
    loan_amount: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(gt=0, le=1)
    term_days: int = Field(gt=0)
    assessor_id: str


class CreateRenewalRequest(BaseModel):
    pawn_item_id: str
    new_due_date: date
    operator_id: str
    operator_role: str


class SubmitRenewalRequest(BaseModel):
    renewal_id: str
    operator_id: str
    operator_role: str


class AssessorApproveRenewalRequest(BaseModel):
    renewal_id: str
    assessor_id: str
    assessor_notes: str


class AssessorRejectRenewalRequest(BaseModel):
    renewal_id: str
    assessor_id: str
    reject_reason: str


class FinanceApproveRenewalRequest(BaseModel):
    renewal_id: str
    finance_id: str
    finance_notes: str


class CreateRedemptionRequest(BaseModel):
    pawn_item_id: str
    redemption_date: date
    operator_id: str
    operator_role: str


class SubmitRedemptionRequest(BaseModel):
    redemption_id: str
    operator_id: str
    operator_role: str


class FinanceCompleteRedemptionRequest(BaseModel):
    redemption_id: str
    finance_id: str
    finance_notes: str


class WarehouseConfirmRedemptionRequest(BaseModel):
    redemption_id: str
    warehouse_id: str
    warehouse_notes: str


class CustomerConfirmRedemptionRequest(BaseModel):
    redemption_id: str
    operator_id: str
    operator_role: str


class RaiseRedemptionDisputeRequest(BaseModel):
    redemption_id: str
    dispute_reason: str
    operator_id: str
    operator_role: str


class CalculateFeesRequest(BaseModel):
    pawn_item_id: str
    calculation_date: date
    calculator_id: str


class SubmitFeeForReviewRequest(BaseModel):
    calculation_id: str
    operator_id: str


class ApproveFeeCalculationRequest(BaseModel):
    calculation_id: str
    reviewer_id: str
    review_notes: str


class RaiseFeeDisputeRequest(BaseModel):
    calculation_id: str
    dispute_reason: str
    operator_id: str
    operator_role: str


class SettleFeeDisputeRequest(BaseModel):
    calculation_id: str
    settlement_notes: str
    operator_id: str


@app.post("/api/pawn/create")
async def create_pawn_item(request: CreatePawnItemRequest):
    """
    创建典当品
    
    责任划分：评估师负责初始评估
    状态：典当品创建后状态为 active
    """
    try:
        pawn_item = service.create_pawn_item(
            customer_id=request.customer_id,
            item_name=request.item_name,
            item_description=request.item_description,
            appraised_value=request.appraised_value,
            loan_amount=request.loan_amount,
            interest_rate=request.interest_rate,
            term_days=request.term_days,
            assessor_id=request.assessor_id
        )
        
        return {
            "pawn_item_id": pawn_item.id,
            "status": pawn_item.status.value,
            "start_date": pawn_item.start_date.isoformat(),
            "due_date": pawn_item.due_date.isoformat(),
            "created_at": pawn_item.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/renewal/create")
async def create_renewal(request: CreateRenewalRequest):
    """
    创建续当申请
    
    责任划分：操作员创建续当申请，责任转移到续当处理
    状态：典当品状态从 active/overdue 转换为 renewal_pending
    """
    try:
        operator_role = UserRole(request.operator_role)
        renewal = service.create_renewal(
            pawn_item_id=request.pawn_item_id,
            new_due_date=request.new_due_date,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "renewal_id": renewal.id,
            "pawn_item_id": renewal.pawn_item_id,
            "original_due_date": renewal.original_due_date.isoformat(),
            "new_due_date": renewal.new_due_date.isoformat(),
            "status": renewal.status.value,
            "current_handler": renewal.current_handler.value,
            "created_at": renewal.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/renewal/submit-assessor")
async def submit_renewal_to_assessor(request: SubmitRenewalRequest):
    """
    提交续当申请给评估师审核
    
    责任划分：责任转移到评估师
    状态：续当记录状态从 draft 转换为 pending_assessor
    """
    try:
        operator_role = UserRole(request.operator_role)
        renewal = service.submit_renewal_to_assessor(
            renewal_id=request.renewal_id,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "renewal_id": renewal.id,
            "status": renewal.status.value,
            "current_handler": renewal.current_handler.value,
            "updated_at": renewal.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/renewal/assessor-approve")
async def assessor_approve_renewal(request: AssessorApproveRenewalRequest):
    """
    评估师审核通过续当申请
    
    责任划分：评估师审核通过后，责任转移到财务
    状态：续当记录状态从 pending_assessor 转换为 pending_finance
    """
    try:
        renewal = service.assessor_approve_renewal(
            renewal_id=request.renewal_id,
            assessor_id=request.assessor_id,
            assessor_notes=request.assessor_notes
        )
        
        return {
            "renewal_id": renewal.id,
            "status": renewal.status.value,
            "assessor_id": renewal.assessor_id,
            "assessor_notes": renewal.assessor_notes,
            "current_handler": renewal.current_handler.value,
            "updated_at": renewal.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/renewal/assessor-reject")
async def assessor_reject_renewal(request: AssessorRejectRenewalRequest):
    """
    评估师审核拒绝续当申请
    
    责任划分：评估师拒绝后，责任回到客户
    状态：续当记录状态转换为 rejected，典当品状态回到 active
    """
    try:
        renewal = service.assessor_reject_renewal(
            renewal_id=request.renewal_id,
            assessor_id=request.assessor_id,
            reject_reason=request.reject_reason
        )
        
        return {
            "renewal_id": renewal.id,
            "status": renewal.status.value,
            "assessor_id": renewal.assessor_id,
            "assessor_notes": renewal.assessor_notes,
            "updated_at": renewal.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/renewal/finance-approve")
async def finance_approve_renewal(request: FinanceApproveRenewalRequest):
    """
    财务审核通过续当申请
    
    责任划分：财务审核通过后，完成费用计算，责任转移到结算
    状态：续当记录状态转换为 approved，典当品状态转换为 renewal_approved
    费用计算：费用计算结果回写到 renewal_fee
    """
    try:
        renewal = service.finance_approve_renewal(
            renewal_id=request.renewal_id,
            finance_id=request.finance_id,
            finance_notes=request.finance_notes
        )
        
        return {
            "renewal_id": renewal.id,
            "status": renewal.status.value,
            "finance_id": renewal.finance_id,
            "finance_notes": renewal.finance_notes,
            "fee_calculation_id": renewal.fee_calculation_id,
            "renewal_fee": float(renewal.renewal_fee),
            "updated_at": renewal.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/redemption/create")
async def create_redemption(request: CreateRedemptionRequest):
    """
    创建赎当申请
    
    责任划分：操作员创建赎当申请，责任转移到赎当处理
    状态：典当品状态从 active/overdue/renewal_approved 转换为 redemption_pending
    """
    try:
        operator_role = UserRole(request.operator_role)
        redemption = service.create_redemption(
            pawn_item_id=request.pawn_item_id,
            redemption_date=request.redemption_date,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "redemption_id": redemption.id,
            "pawn_item_id": redemption.pawn_item_id,
            "redemption_date": redemption.redemption_date.isoformat(),
            "status": redemption.status.value,
            "current_handler": redemption.current_handler.value,
            "created_at": redemption.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/redemption/submit-finance")
async def submit_redemption_to_finance(request: SubmitRedemptionRequest):
    """
    提交赎当申请给财务审核
    
    责任划分：责任转移到财务
    状态：赎当记录状态从 draft 转换为 pending_finance
    """
    try:
        operator_role = UserRole(request.operator_role)
        redemption = service.submit_redemption_to_finance(
            redemption_id=request.redemption_id,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "redemption_id": redemption.id,
            "status": redemption.status.value,
            "current_handler": redemption.current_handler.value,
            "updated_at": redemption.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/redemption/finance-complete")
async def finance_complete_redemption(request: FinanceCompleteRedemptionRequest):
    """
    财务完成赎当费用计算
    
    责任划分：财务完成费用计算后，责任转移到库管
    状态：赎当记录状态从 pending_finance 转换为 pending_warehouse
    费用计算：费用计算结果回写到 total_amount
    """
    try:
        redemption = service.finance_complete_redemption(
            redemption_id=request.redemption_id,
            finance_id=request.finance_id,
            finance_notes=request.finance_notes
        )
        
        return {
            "redemption_id": redemption.id,
            "status": redemption.status.value,
            "finance_id": redemption.finance_id,
            "finance_notes": redemption.finance_notes,
            "fee_calculation_id": redemption.fee_calculation_id,
            "total_amount": float(redemption.total_amount),
            "current_handler": redemption.current_handler.value,
            "updated_at": redemption.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/redemption/warehouse-confirm")
async def warehouse_confirm_redemption(request: WarehouseConfirmRedemptionRequest):
    """
    库管确认赎当物品
    
    责任划分：库管确认物品后，责任转移到客户确认
    状态：赎当记录状态从 pending_warehouse 转换为 pending_customer
    """
    try:
        redemption = service.warehouse_confirm_redemption(
            redemption_id=request.redemption_id,
            warehouse_id=request.warehouse_id,
            warehouse_notes=request.warehouse_notes
        )
        
        return {
            "redemption_id": redemption.id,
            "status": redemption.status.value,
            "warehouse_id": redemption.warehouse_id,
            "warehouse_notes": redemption.warehouse_notes,
            "updated_at": redemption.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/redemption/customer-confirm")
async def customer_confirm_redemption(request: CustomerConfirmRedemptionRequest):
    """
    客户确认赎当
    
    责任划分：客户确认后，赎当完成，责任转移到结算
    状态：赎当记录状态转换为 completed，典当品状态转换为 redeemed
    """
    try:
        operator_role = UserRole(request.operator_role)
        redemption = service.customer_confirm_redemption(
            redemption_id=request.redemption_id,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "redemption_id": redemption.id,
            "status": redemption.status.value,
            "customer_confirmation": redemption.customer_confirmation,
            "updated_at": redemption.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/redemption/raise-dispute")
async def raise_redemption_dispute(request: RaiseRedemptionDisputeRequest):
    """
    提起赎当争议
    
    责任划分：争议状态下责任链暂停，等待解决
    状态：赎当记录状态转换为 disputed，典当品状态转换为 disputed
    """
    try:
        operator_role = UserRole(request.operator_role)
        redemption = service.raise_redemption_dispute(
            redemption_id=request.redemption_id,
            dispute_reason=request.dispute_reason,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "redemption_id": redemption.id,
            "status": redemption.status.value,
            "dispute_reason": redemption.dispute_reason,
            "updated_at": redemption.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fee/calculate")
async def calculate_fees(request: CalculateFeesRequest):
    """
    计算费用
    
    费用构成：
    - 利息：本金 × 年利率 ÷ 365 × 天数
    - 服务费：本金 × 1% + (天数-30) × 10元
    - 保管费：评估价值 × 0.01% × 天数
    - 滞纳金：本金 × 5% ÷ 30 × 逾期天数
    
    状态：费用计算状态为 draft
    """
    try:
        fee_calculation = service.calculate_fees(
            pawn_item_id=request.pawn_item_id,
            calculation_date=request.calculation_date,
            calculator_id=request.calculator_id
        )
        
        return {
            "calculation_id": fee_calculation.id,
            "pawn_item_id": fee_calculation.pawn_item_id,
            "calculation_date": fee_calculation.calculation_date.isoformat(),
            "principal": float(fee_calculation.principal),
            "interest_amount": float(fee_calculation.interest_amount),
            "service_fee": float(fee_calculation.service_fee),
            "storage_fee": float(fee_calculation.storage_fee),
            "penalty_fee": float(fee_calculation.penalty_fee),
            "total_fee": float(fee_calculation.total_fee),
            "status": fee_calculation.status.value,
            "calculator_id": fee_calculation.calculator_id,
            "created_at": fee_calculation.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fee/submit-review")
async def submit_fee_for_review(request: SubmitFeeForReviewRequest):
    """
    提交费用计算审核
    
    状态：费用计算状态从 draft 转换为 pending_review
    """
    try:
        fee_calculation = service.submit_fee_for_review(
            calculation_id=request.calculation_id,
            operator_id=request.operator_id
        )
        
        return {
            "calculation_id": fee_calculation.id,
            "status": fee_calculation.status.value,
            "updated_at": fee_calculation.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fee/approve")
async def approve_fee_calculation(request: ApproveFeeCalculationRequest):
    """
    审核通过费用计算
    
    责任划分：审核人确认费用计算准确性
    状态：费用计算状态从 pending_review 转换为 approved
    """
    try:
        fee_calculation = service.approve_fee_calculation(
            calculation_id=request.calculation_id,
            reviewer_id=request.reviewer_id,
            review_notes=request.review_notes
        )
        
        return {
            "calculation_id": fee_calculation.id,
            "status": fee_calculation.status.value,
            "reviewer_id": fee_calculation.reviewer_id,
            "review_notes": fee_calculation.review_notes,
            "updated_at": fee_calculation.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fee/raise-dispute")
async def raise_fee_dispute(request: RaiseFeeDisputeRequest):
    """
    提起费用计算争议
    
    状态：费用计算状态转换为 disputed
    """
    try:
        operator_role = UserRole(request.operator_role)
        fee_calculation = service.raise_fee_dispute(
            calculation_id=request.calculation_id,
            dispute_reason=request.dispute_reason,
            operator_id=request.operator_id,
            operator_role=operator_role
        )
        
        return {
            "calculation_id": fee_calculation.id,
            "status": fee_calculation.status.value,
            "dispute_reason": fee_calculation.dispute_reason,
            "updated_at": fee_calculation.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/fee/settle-dispute")
async def settle_fee_dispute(request: SettleFeeDisputeRequest):
    """
    解决费用计算争议
    
    状态：费用计算状态转换为 settled
    """
    try:
        fee_calculation = service.settle_fee_dispute(
            calculation_id=request.calculation_id,
            settlement_notes=request.settlement_notes,
            operator_id=request.operator_id
        )
        
        return {
            "calculation_id": fee_calculation.id,
            "status": fee_calculation.status.value,
            "updated_at": fee_calculation.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fee/history/{pawn_item_id}")
async def get_fee_calculation_history(
    pawn_item_id: str = Path(..., description="典当品ID")
):
    """
    查看费用计算历史
    
    返回指定典当品的所有费用计算记录
    """
    try:
        history = service.get_fee_calculation_history(pawn_item_id)
        
        return {
            "pawn_item_id": pawn_item_id,
            "calculations": [
                {
                    "calculation_id": calc.id,
                    "calculation_date": calc.calculation_date.isoformat(),
                    "total_fee": float(calc.total_fee),
                    "status": calc.status.value,
                    "created_at": calc.created_at.isoformat()
                }
                for calc in history
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fee/details/{calculation_id}")
async def get_fee_calculation_details(
    calculation_id: str = Path(..., description="费用计算ID")
):
    """
    查看费用计算详情
    
    返回费用计算的详细信息、责任链、审计追踪
    """
    try:
        details = service.get_fee_calculation_details(calculation_id)
        
        return {
            "calculation": {
                "calculation_id": details["calculation"].id,
                "pawn_item_id": details["calculation"].pawn_item_id,
                "calculation_date": details["calculation"].calculation_date.isoformat(),
                "principal": float(details["calculation"].principal),
                "interest_amount": float(details["calculation"].interest_amount),
                "service_fee": float(details["calculation"].service_fee),
                "storage_fee": float(details["calculation"].storage_fee),
                "penalty_fee": float(details["calculation"].penalty_fee),
                "total_fee": float(details["calculation"].total_fee),
                "status": details["calculation"].status.value
            },
            "pawn_item": {
                "id": details["pawn_item"].id,
                "item_name": details["pawn_item"].item_name,
                "loan_amount": float(details["pawn_item"].loan_amount),
                "start_date": details["pawn_item"].start_date.isoformat(),
                "due_date": details["pawn_item"].due_date.isoformat()
            },
            "responsibility_chains": [
                {
                    "stage": chain.stage.value,
                    "handler_id": chain.handler_id,
                    "handler_role": chain.handler_role.value,
                    "start_time": chain.start_time.isoformat(),
                    "end_time": chain.end_time.isoformat() if chain.end_time else None,
                    "status": chain.status
                }
                for chain in details["responsibility_chains"]
            ],
            "audit_trail": [
                {
                    "action": log.action,
                    "operator_id": log.operator_id,
                    "timestamp": log.timestamp.isoformat()
                }
                for log in details["audit_trail"]
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/audit/logs")
async def query_audit_logs(
    entity_type: Optional[str] = Query(None, description="实体类型"),
    entity_id: Optional[str] = Query(None, description="实体ID"),
    operator_id: Optional[str] = Query(None, description="操作人ID"),
    operator_role: Optional[str] = Query(None, description="操作人角色"),
    action: Optional[str] = Query(None, description="操作类型"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期")
):
    """
    查询审计日志
    
    支持按实体类型、实体ID、操作人、操作类型、时间范围查询
    """
    try:
        role = UserRole(operator_role) if operator_role else None
        logs = service.query_audit_logs(
            entity_type=entity_type,
            entity_id=entity_id,
            operator_id=operator_id,
            operator_role=role,
            action=action,
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            "logs": [
                {
                    "id": log.id,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "action": log.action,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role.value,
                    "timestamp": log.timestamp.isoformat(),
                    "notes": log.notes
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/audit/transitions")
async def query_state_transitions(
    entity_type: Optional[str] = Query(None, description="实体类型"),
    entity_id: Optional[str] = Query(None, description="实体ID"),
    triggered_by: Optional[str] = Query(None, description="触发人ID"),
    trigger_role: Optional[str] = Query(None, description="触发人角色"),
    from_status: Optional[str] = Query(None, description="原状态"),
    to_status: Optional[str] = Query(None, description="新状态"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期")
):
    """
    查询状态转换记录
    
    支持按实体类型、实体ID、触发人、状态、时间范围查询
    """
    try:
        role = UserRole(trigger_role) if trigger_role else None
        transitions = service.query_state_transitions(
            entity_type=entity_type,
            entity_id=entity_id,
            triggered_by=triggered_by,
            trigger_role=role,
            from_status=from_status,
            to_status=to_status,
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            "transitions": [
                {
                    "id": transition.id,
                    "entity_type": transition.entity_type,
                    "entity_id": transition.entity_id,
                    "from_status": transition.from_status,
                    "to_status": transition.to_status,
                    "triggered_by": transition.triggered_by,
                    "trigger_role": transition.trigger_role.value,
                    "timestamp": transition.timestamp.isoformat(),
                    "reason": transition.reason
                }
                for transition in transitions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/audit/responsibility")
async def query_responsibility_chains(
    pawn_item_id: Optional[str] = Query(None, description="典当品ID"),
    stage: Optional[str] = Query(None, description="责任阶段"),
    handler_id: Optional[str] = Query(None, description="处理人ID"),
    handler_role: Optional[str] = Query(None, description="处理人角色"),
    status: Optional[str] = Query(None, description="责任状态")
):
    """
    查询责任链
    
    支持按典当品ID、责任阶段、处理人、责任状态查询
    """
    try:
        stage_enum = ResponsibilityStage(stage) if stage else None
        role = UserRole(handler_role) if handler_role else None
        chains = service.query_responsibility_chains(
            pawn_item_id=pawn_item_id,
            stage=stage_enum,
            handler_id=handler_id,
            handler_role=role,
            status=status
        )
        
        return {
            "chains": [
                {
                    "id": chain.id,
                    "pawn_item_id": chain.pawn_item_id,
                    "stage": chain.stage.value,
                    "handler_id": chain.handler_id,
                    "handler_role": chain.handler_role.value,
                    "start_time": chain.start_time.isoformat(),
                    "end_time": chain.end_time.isoformat() if chain.end_time else None,
                    "status": chain.status,
                    "notes": chain.notes
                }
                for chain in chains
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/audit/trail/{entity_type}/{entity_id}")
async def get_entity_audit_trail(
    entity_type: str = Path(..., description="实体类型"),
    entity_id: str = Path(..., description="实体ID")
):
    """
    获取实体审计追踪
    
    返回指定实体的完整审计追踪和状态转换记录
    """
    try:
        trail = service.get_entity_audit_trail(entity_type, entity_id)
        
        return {
            "entity_type": trail["entity_type"],
            "entity_id": trail["entity_id"],
            "audit_logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role.value,
                    "timestamp": log.timestamp.isoformat(),
                    "notes": log.notes
                }
                for log in trail["audit_logs"]
            ],
            "state_transitions": [
                {
                    "id": transition.id,
                    "from_status": transition.from_status,
                    "to_status": transition.to_status,
                    "triggered_by": transition.triggered_by,
                    "trigger_role": transition.trigger_role.value,
                    "timestamp": transition.timestamp.isoformat(),
                    "reason": transition.reason
                }
                for transition in trail["state_transitions"]
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/audit/responsibility-report/{pawn_item_id}")
async def get_responsibility_report(
    pawn_item_id: str = Path(..., description="典当品ID")
):
    """
    获取责任报告
    
    返回指定典当品的责任链统计报告
    """
    try:
        report = service.get_responsibility_report(pawn_item_id)
        
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/audit/dispute-evidence/{entity_type}/{entity_id}")
async def get_dispute_evidence(
    entity_type: str = Path(..., description="实体类型"),
    entity_id: str = Path(..., description="实体ID")
):
    """
    获取争议证据
    
    返回指定实体的争议证据和时间线
    """
    try:
        evidence = service.get_dispute_evidence(entity_type, entity_id)
        
        return evidence
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)