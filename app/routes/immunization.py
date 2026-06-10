from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import (
    ImmunizationExecution,
    ImmunizationPlan,
    PigBatch,
    PlanStatus,
)
from app.schemas.schemas import (
    ImmunizationExecutionCreate,
    ImmunizationExecutionDetail,
    ImmunizationExecutionRead,
    ImmunizationPlanCreate,
    ImmunizationPlanDetail,
    ImmunizationPlanRead,
)
from app.services.business import reconcile_and_sync

router = APIRouter(prefix="/api/immunization", tags=["免疫管理"])


@router.get(
    "/plans", response_model=list[ImmunizationPlanRead], summary="繁育员-查看免疫计划"
)
def list_plans(
    batch_id: int | None = Query(None, description="批次筛选"),
    plan_status: PlanStatus | None = Query(None, description="计划状态筛选"),
    responsible_role: str | None = Query(None, description="负责角色筛选"),
    db: Session = Depends(get_db),
):
    q = db.query(ImmunizationPlan)
    if batch_id:
        q = q.filter(ImmunizationPlan.batch_id == batch_id)
    if plan_status:
        q = q.filter(ImmunizationPlan.plan_status == plan_status)
    if responsible_role:
        q = q.filter(ImmunizationPlan.responsible_role == responsible_role)
    return q.order_by(ImmunizationPlan.planned_date).all()


@router.get(
    "/plans/{plan_id}",
    response_model=ImmunizationPlanDetail,
    summary="获取免疫计划详情含批次",
)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = (
        db.query(ImmunizationPlan)
        .options(joinedload(ImmunizationPlan.batch))
        .filter(ImmunizationPlan.id == plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="免疫计划不存在")
    return plan


@router.post("/plans", response_model=ImmunizationPlanRead, summary="新增免疫计划")
def create_plan(data: ImmunizationPlanCreate, db: Session = Depends(get_db)):
    batch = db.get(PigBatch, data.batch_id)
    if not batch:
        raise HTTPException(status_code=400, detail="批次不存在")
    plan = ImmunizationPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get(
    "/executions",
    response_model=list[ImmunizationExecutionRead],
    summary="获取免疫执行记录",
)
def list_executions(
    batch_id: int | None = Query(None),
    plan_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ImmunizationExecution)
    if batch_id:
        q = q.filter(ImmunizationExecution.batch_id == batch_id)
    if plan_id:
        q = q.filter(ImmunizationExecution.plan_id == plan_id)
    return q.order_by(ImmunizationExecution.execution_date.desc()).all()


@router.get(
    "/executions/{execution_id}",
    response_model=ImmunizationExecutionDetail,
    summary="获取执行详情含计划和批次",
)
def get_execution(execution_id: int, db: Session = Depends(get_db)):
    ex = (
        db.query(ImmunizationExecution)
        .options(
            joinedload(ImmunizationExecution.plan),
            joinedload(ImmunizationExecution.batch),
        )
        .filter(ImmunizationExecution.id == execution_id)
        .first()
    )
    if not ex:
        raise HTTPException(status_code=404, detail="执行记录不存在")
    return ex


@router.post(
    "/executions", response_model=ImmunizationExecutionRead, summary="记录免疫执行"
)
def create_execution(data: ImmunizationExecutionCreate, db: Session = Depends(get_db)):
    plan = db.get(ImmunizationPlan, data.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="免疫计划不存在")
    batch = db.get(PigBatch, data.batch_id)
    if not batch:
        raise HTTPException(status_code=400, detail="批次不存在")
    if plan.batch_id != data.batch_id:
        raise HTTPException(status_code=400, detail="执行批次与计划批次不匹配")

    ex = ImmunizationExecution(**data.model_dump())
    db.add(ex)
    db.flush()

    reconcile_and_sync(db, plan_ids=[plan.id])

    db.commit()
    db.refresh(ex)
    return ex
