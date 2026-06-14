from fastapi import FastAPI, HTTPException, Query, Body, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from services import (
    ProjectService, FeedbackService, FeeService, ProblemService,
    StatusChangeService, db
)
from models import RoleType, OrderStatus, FeedbackStatus, FeeStatus, ProblemType, ErrorCode
from state_machine import StateMachine, StateTransitionError

app = FastAPI(title="翻译公司-客户反馈与费用确认系统")


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.now)


ERROR_CODE_TO_HTTP_STATUS = {
    ErrorCode.INVALID_STATUS_TRANSITION: 400,
    ErrorCode.FEEDBACK_NOT_HANDLED: 400,
    ErrorCode.FEE_ALREADY_CONFIRMED: 400,
    ErrorCode.UNAUTHORIZED_ACCESS: 403,
    ErrorCode.PROJECT_NOT_FOUND: 404,
    ErrorCode.FEEDBACK_NOT_FOUND: 404,
    ErrorCode.FEE_NOT_FOUND: 404,
    ErrorCode.INVALID_ROLE: 403,
    ErrorCode.MISSING_REQUIRED_FIELD: 400,
    ErrorCode.DUPLICATE_OPERATION: 409,
    ErrorCode.RESCHEDULE_NOT_ALLOWED: 400,
    ErrorCode.SUPPLEMENT_NOT_ALLOWED: 400,
    ErrorCode.REJECT_REASON_REQUIRED: 400,
}


@app.exception_handler(StateTransitionError)
async def state_transition_error_handler(request: Request, exc: StateTransitionError):
    http_status = ERROR_CODE_TO_HTTP_STATUS.get(exc.error_code, 400)
    error_response = ErrorResponse(
        code=exc.error_code.value,
        message=exc.message,
        details=exc.details,
        timestamp=datetime.now()
    )
    return JSONResponse(
        status_code=http_status,
        content=error_response.model_dump()
    )


@app.post("/api/users", tags=["用户管理"])
async def create_user(name: str, role: RoleType):
    from models import User
    user = User(name=name, role=role)
    db.add("user", user)
    return {"message": "用户创建成功", "user": user}


@app.get("/api/users/{user_id}", tags=["用户管理"])
async def get_user(user_id: str):
    user = db.get("user", user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"用户 {user_id} 不存在")
    return user


@app.get("/api/users", tags=["用户管理"])
async def list_users(role: Optional[RoleType] = Query(None)):
    if role:
        users = [u for u in db.get_all("user") if u.role == role]
    else:
        users = db.get_all("user")
    return users


@app.post("/api/pm/projects", tags=["项目经理入口-项目管理"])
async def pm_create_project(
    name: str = Body(...),
    project_manager_id: str = Body(...),
    translator_id: str = Body(...),
    reviewer_id: str = Body(...),
    original_deadline: datetime = Body(...),
    ledger: Optional[str] = Body(None),
    scene_records: Optional[str] = Body(None),
    screenshots: Optional[List[str]] = Body(None)
):
    user = db.get("user", project_manager_id)
    if not user or user.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="只有项目经理可以创建项目")

    project = ProjectService.create_project(
        name=name,
        project_manager_id=project_manager_id,
        translator_id=translator_id,
        reviewer_id=reviewer_id,
        original_deadline=original_deadline,
        ledger=ledger,
        scene_records=scene_records,
        screenshots=screenshots
    )

    StatusChangeService.record_change(
        "project", project.id, "status", None, OrderStatus.PENDING.value,
        project_manager_id, "项目经理创建项目"
    )

    return {"message": "项目创建成功", "project": project}


@app.get("/api/pm/projects", tags=["项目经理入口-项目管理"])
async def pm_list_my_projects(project_manager_id: str = Query(...)):
    user = db.get("user", project_manager_id)
    if not user or user.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="用户不存在或不是项目经理")

    projects = db.filter("project", project_manager_id=project_manager_id)
    return projects


@app.get("/api/pm/projects/{project_id}", tags=["项目经理入口-项目管理"])
async def pm_get_project_detail(project_id: str, requester_id: str = Query(...)):
    user = db.get("user", requester_id)
    if not user or user.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="只有项目经理可以查看项目详情")

    project = ProjectService.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"项目 {project_id} 不存在")

    feedbacks = FeedbackService.get_feedbacks_by_project(project_id)
    fees = FeeService.get_fees_by_project(project_id)
    problems = ProblemService.get_problems_by_project(project_id)
    status_changes = StatusChangeService.get_changes_by_entity("project", project_id)

    return {
        "project": project,
        "feedbacks": feedbacks,
        "fees": fees,
        "problems": problems,
        "status_changes": status_changes
    }


@app.put("/api/pm/projects/{project_id}/status", tags=["项目经理入口-项目管理"])
async def pm_update_project_status(
    project_id: str,
    new_status: OrderStatus = Body(...),
    changed_by: str = Body(...),
    reason: Optional[str] = Body(None)
):
    user = db.get("user", changed_by)
    if not user or user.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="只有项目经理可以更新项目状态")

    project = ProjectService.update_project_status(project_id, new_status, changed_by, reason)
    return {"message": "项目状态更新成功", "project": project}


@app.put("/api/pm/feedbacks/{feedback_id}/handle", tags=["项目经理入口-客户反馈处理"])
async def pm_handle_feedback(
    feedback_id: str,
    handler_id: str = Body(...),
    internal_notes: str = Body(...),
    responsibility_analysis: str = Body(...),
    processing_result: str = Body(...),
    auto_create_fee: bool = Body(True),
    estimated_amount: Optional[float] = Body(None),
    fee_type: Optional[str] = Body(None)
):
    handler = db.get("user", handler_id)
    if not handler or handler.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="只有项目经理可以处理客户反馈")

    if auto_create_fee and (not estimated_amount or not fee_type):
        raise HTTPException(status_code=400, detail="如果启用自动创建费用，必须提供金额和费用类型")

    result = FeedbackService.handle_feedback(
        feedback_id=feedback_id,
        handler_id=handler_id,
        handler_type=RoleType.PROJECT_MANAGER,
        internal_notes=internal_notes,
        responsibility_analysis=responsibility_analysis,
        processing_result=processing_result,
        auto_create_fee=auto_create_fee,
        estimated_amount=estimated_amount,
        fee_type=fee_type
    )

    return {
        "message": result.get("message", "反馈处理成功"),
        "feedback": result["feedback"],
        "fee": result.get("fee")
    }


@app.post("/api/pm/problems", tags=["项目经理入口-问题单处理"])
async def pm_create_problem(
    project_id: str = Body(...),
    feedback_id: Optional[str] = Body(None),
    problem_type: ProblemType = Body(...),
    reason: str = Body(...),
    created_by: str = Body(...),
    original_data: Optional[str] = Body(None),
    new_data: Optional[str] = Body(None),
    auto_create_fee: bool = Body(True),
    estimated_amount: Optional[float] = Body(None),
    fee_type: Optional[str] = Body(None)
):
    user = db.get("user", created_by)
    if not user or user.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="只有项目经理可以创建问题单")

    if auto_create_fee and (not estimated_amount or not fee_type):
        raise HTTPException(status_code=400, detail="如果启用自动创建费用，必须提供金额和费用类型")

    result = ProblemService.create_problem(
        project_id=project_id,
        feedback_id=feedback_id,
        problem_type=problem_type,
        reason=reason,
        created_by=created_by,
        original_data=original_data,
        new_data=new_data,
        auto_create_fee=auto_create_fee,
        estimated_amount=estimated_amount,
        fee_type=fee_type
    )

    return {
        "message": result.get("message", "问题单创建成功"),
        "problem": result["problem"],
        "fee": result.get("fee")
    }


@app.get("/api/pm/problems", tags=["项目经理入口-问题单处理"])
async def pm_list_problems(
    project_id: Optional[str] = Query(None),
    problem_type: Optional[ProblemType] = Query(None)
):
    if project_id:
        problems = ProblemService.get_problems_by_project(project_id)
    else:
        problems = db.get_all("problem")

    if problem_type:
        problems = [p for p in problems if p.problem_type == problem_type]

    return problems


@app.get("/api/translator/projects", tags=["译员入口"])
async def translator_list_projects(translator_id: str = Query(...)):
    user = db.get("user", translator_id)
    if not user or user.role != RoleType.TRANSLATOR:
        raise HTTPException(status_code=403, detail="用户不存在或不是译员")

    projects = db.filter("project", translator_id=translator_id)
    return projects


@app.get("/api/translator/projects/{project_id}", tags=["译员入口"])
async def translator_get_project(project_id: str, translator_id: str = Query(...)):
    user = db.get("user", translator_id)
    if not user or user.role != RoleType.TRANSLATOR:
        raise HTTPException(status_code=403, detail="只有译员可以查看自己的项目")

    project = db.get("project", project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"项目 {project_id} 不存在")

    if project.translator_id != translator_id:
        raise HTTPException(status_code=403, detail="这不是你的项目")

    feedbacks = FeedbackService.get_feedbacks_by_project(project_id)
    fees = FeeService.get_fees_by_project(project_id)

    return {
        "project": project,
        "feedbacks": feedbacks,
        "fees": fees
    }


@app.post("/api/translator/projects/{project_id}/feedbacks", tags=["译员入口-添加备注"])
async def translator_add_feedback_note(
    project_id: str,
    feedback_content: str = Body(...),
    translator_id: str = Body(...)
):
    user = db.get("user", translator_id)
    if not user or user.role != RoleType.TRANSLATOR:
        raise HTTPException(status_code=403, detail="只有译员可以添加反馈备注")

    project = db.get("project", project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"项目 {project_id} 不存在")

    feedback = FeedbackService.create_feedback(project_id, feedback_content)

    StatusChangeService.record_change(
        "feedback", feedback.id, "status",
        None, FeedbackStatus.PENDING.value,
        translator_id, f"译员添加备注: {feedback_content[:50]}"
    )

    return {"message": "反馈备注添加成功", "feedback": feedback}


@app.post("/api/reviewer/fees/pending", tags=["审校入口-费用确认"])
async def reviewer_list_pending_fees(reviewer_id: str = Query(...)):
    user = db.get("user", reviewer_id)
    if not user or user.role != RoleType.REVIEWER:
        raise HTTPException(status_code=403, detail="用户不存在或不是审校")

    fees = FeeService.get_fees_pending_confirmation()

    detailed_fees = []
    for fee in fees:
        feedback = None
        if fee.feedback_id:
            feedback = db.get("feedback", fee.feedback_id)
        problem = None
        if fee.problem_id:
            problem = db.get("problem", fee.problem_id)
        project = db.get("project", fee.project_id)

        detailed_fees.append({
            "fee": fee,
            "feedback": feedback,
            "problem": problem,
            "project": project
        })

    return detailed_fees


@app.get("/api/reviewer/fees/{fee_id}", tags=["审校入口-费用确认"])
async def reviewer_get_fee_detail(fee_id: str, requester_id: str = Query(...)):
    user = db.get("user", requester_id)
    if not user or user.role != RoleType.REVIEWER:
        raise HTTPException(status_code=403, detail="只有审校可以查看费用详情")

    return FeeService.get_fee_with_full_context(fee_id)


@app.put("/api/reviewer/fees/{fee_id}/confirm", tags=["审校入口-费用确认"])
async def reviewer_confirm_fee(
    fee_id: str,
    confirmed_by: str = Body(...),
    confirmation_notes: Optional[str] = Body(None)
):
    user = db.get("user", confirmed_by)
    if not user or user.role != RoleType.REVIEWER:
        raise HTTPException(status_code=403, detail="只有审校可以确认费用")

    fee = FeeService.confirm_fee(fee_id, confirmed_by, confirmation_notes)
    return {"message": "费用确认成功", "fee": fee}


@app.put("/api/reviewer/fees/{fee_id}/reject", tags=["审校入口-费用确认"])
async def reviewer_reject_fee(
    fee_id: str,
    rejected_by: str = Body(...),
    reject_reason: str = Body(...)
):
    user = db.get("user", rejected_by)
    if not user or user.role != RoleType.REVIEWER:
        raise HTTPException(status_code=403, detail="只有审校可以驳回费用")

    fee = FeeService.reject_fee(fee_id, rejected_by, reject_reason)

    if fee.problem_id:
        problem = db.get("problem", fee.problem_id)
        if problem:
            old_problem_status = problem.status
            StatusChangeService.record_change(
                "problem", problem.id, "status",
                old_problem_status, "resolved",
                rejected_by, f"费用驳回: {reject_reason}"
            )
            problem.status = "resolved"
            problem.resolved_at = datetime.now()

    return {"message": "费用驳回成功", "fee": fee}


@app.put("/api/reviewer/feedbacks/{feedback_id}/handle", tags=["审校入口-客户反馈处理"])
async def reviewer_handle_feedback(
    feedback_id: str,
    handler_id: str = Body(...),
    internal_notes: str = Body(...),
    responsibility_analysis: str = Body(...),
    processing_result: str = Body(...),
    auto_create_fee: bool = Body(True),
    estimated_amount: Optional[float] = Body(None),
    fee_type: Optional[str] = Body(None)
):
    handler = db.get("user", handler_id)
    if not handler or handler.role != RoleType.REVIEWER:
        raise HTTPException(status_code=403, detail="只有审校可以处理客户反馈")

    if auto_create_fee and (not estimated_amount or not fee_type):
        raise HTTPException(status_code=400, detail="如果启用自动创建费用，必须提供金额和费用类型")

    result = FeedbackService.handle_feedback(
        feedback_id=feedback_id,
        handler_id=handler_id,
        handler_type=RoleType.REVIEWER,
        internal_notes=internal_notes,
        responsibility_analysis=responsibility_analysis,
        processing_result=processing_result,
        auto_create_fee=auto_create_fee,
        estimated_amount=estimated_amount,
        fee_type=fee_type
    )

    return {
        "message": result.get("message", "反馈处理成功"),
        "feedback": result["feedback"],
        "fee": result.get("fee")
    }


@app.get("/api/feedbacks", tags=["客户反馈"])
async def list_feedbacks(
    project_id: Optional[str] = Query(None),
    status: Optional[FeedbackStatus] = Query(None)
):
    if project_id:
        feedbacks = FeedbackService.get_feedbacks_by_project(project_id)
    else:
        feedbacks = db.get_all("feedback")

    if status:
        feedbacks = [f for f in feedbacks if f.status == status]

    return feedbacks


@app.post("/api/feedbacks", tags=["客户反馈"])
async def create_feedback(
    project_id: str = Body(...),
    feedback_content: str = Body(...)
):
    feedback = FeedbackService.create_feedback(project_id, feedback_content)
    return {"message": "客户反馈创建成功", "feedback": feedback}


@app.get("/api/feedbacks/{feedback_id}", tags=["客户反馈"])
async def get_feedback(feedback_id: str):
    feedback = FeedbackService.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail=f"反馈 {feedback_id} 不存在")

    related_fee = None
    related_problem = None
    if feedback.related_fee_id:
        related_fee = FeeService.get_fee(feedback.related_fee_id)
        if related_fee and related_fee.problem_id:
            related_problem = db.get("problem", related_fee.problem_id)

    feedback_status_changes = StatusChangeService.get_changes_by_entity("feedback", feedback_id)
    fee_status_changes = []
    if related_fee:
        fee_status_changes = StatusChangeService.get_changes_by_entity("fee", related_fee.id)
    problem_status_changes = []
    if related_problem:
        problem_status_changes = StatusChangeService.get_changes_by_entity("problem", related_problem.id)

    return {
        "feedback": feedback,
        "related_fee": related_fee,
        "related_problem": related_problem,
        "feedback_status_changes": sorted(feedback_status_changes, key=lambda x: x.created_at),
        "fee_status_changes": sorted(fee_status_changes, key=lambda x: x.created_at),
        "problem_status_changes": sorted(problem_status_changes, key=lambda x: x.created_at)
    }


@app.get("/api/projects", tags=["项目管理"])
async def list_projects(
    status: Optional[OrderStatus] = Query(None),
    project_manager_id: Optional[str] = Query(None),
    translator_id: Optional[str] = Query(None),
    reviewer_id: Optional[str] = Query(None)
):
    projects = db.get_all("project")

    if status:
        projects = [p for p in projects if p.status == status]
    if project_manager_id:
        projects = [p for p in projects if p.project_manager_id == project_manager_id]
    if translator_id:
        projects = [p for p in projects if p.translator_id == translator_id]
    if reviewer_id:
        projects = [p for p in projects if p.reviewer_id == reviewer_id]

    return projects


@app.get("/api/projects/{project_id}", tags=["项目管理"])
async def get_project(project_id: str):
    project = ProjectService.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"项目 {project_id} 不存在")

    feedbacks = FeedbackService.get_feedbacks_by_project(project_id)
    fees = FeeService.get_fees_by_project(project_id)
    problems = ProblemService.get_problems_by_project(project_id)
    status_changes = StatusChangeService.get_changes_by_entity("project", project_id)

    return {
        "project": project,
        "feedbacks": feedbacks,
        "fees": fees,
        "problems": problems,
        "status_changes": status_changes
    }


@app.post("/api/projects/{project_id}/reschedule", tags=["项目管理-问题单处理"])
async def reschedule_project(
    project_id: str,
    new_deadline: datetime = Body(...),
    changed_by: str = Body(...),
    reason: str = Body(...),
    auto_create_fee: bool = Body(True),
    estimated_amount: Optional[float] = Body(None),
    fee_type: Optional[str] = Body(None)
):
    if auto_create_fee and (not estimated_amount or not fee_type):
        raise HTTPException(status_code=400, detail="如果启用自动创建费用，必须提供金额和费用类型")

    result = ProjectService.reschedule_project(
        project_id, new_deadline, changed_by, reason,
        auto_create_fee=auto_create_fee,
        estimated_amount=estimated_amount,
        fee_type=fee_type
    )
    return {"message": result.get("message", "项目改期成功"), **result}


@app.post("/api/fees", tags=["费用确认-项目经理/审校入口"])
async def create_fee(
    project_id: str = Body(...),
    amount: float = Body(...),
    fee_type: str = Body(...),
    feedback_id: Optional[str] = Body(None),
    problem_id: Optional[str] = Body(None)
):
    if feedback_id:
        feedback = FeedbackService.get_feedback(feedback_id)
        if not feedback:
            raise HTTPException(status_code=404, detail=f"反馈 {feedback_id} 不存在")

        if feedback.status != FeedbackStatus.HANDLED:
            raise HTTPException(
                status_code=400,
                detail=f"反馈 {feedback_id} 还未处理完成，需要先处理反馈"
            )

    fee = FeeService.create_fee_from_feedback(
        project_id=project_id,
        amount=amount,
        fee_type=fee_type,
        feedback_id=feedback_id,
        problem_id=problem_id
    )

    return {
        "message": "费用确认创建成功",
        "fee": fee,
        "inherited_notes": fee.inherited_notes
    }


@app.get("/api/fees", tags=["费用确认"])
async def list_fees(
    project_id: Optional[str] = Query(None),
    status: Optional[FeeStatus] = Query(None)
):
    if project_id:
        fees = FeeService.get_fees_by_project(project_id)
    else:
        fees = db.get_all("fee")

    if status:
        fees = [f for f in fees if f.status == status]

    return fees


@app.get("/api/fees/pending", tags=["费用确认"])
async def list_pending_fees():
    fees = FeeService.get_fees_pending_confirmation()
    return fees


@app.get("/api/fees/{fee_id}", tags=["费用确认回看"])
async def get_fee(fee_id: str):
    return FeeService.get_fee_with_full_context(fee_id)


@app.put("/api/fees/{fee_id}/confirm", tags=["费用确认-审校入口"])
async def confirm_fee(
    fee_id: str,
    confirmed_by: str = Body(...),
    confirmation_notes: Optional[str] = Body(None)
):
    user = db.get("user", confirmed_by)
    if not user or user.role != RoleType.REVIEWER:
        raise HTTPException(status_code=403, detail="只有审校可以确认费用")

    fee = FeeService.confirm_fee(fee_id, confirmed_by, confirmation_notes)
    return {"message": "费用确认成功", "fee": fee}


@app.put("/api/fees/{fee_id}/reject", tags=["费用确认-问题单处理"])
async def reject_fee(
    fee_id: str,
    rejected_by: str = Body(...),
    reject_reason: str = Body(...)
):
    fee = FeeService.reject_fee(fee_id, rejected_by, reject_reason)
    return {"message": "费用驳回成功", "fee": fee}


@app.post("/api/problems", tags=["问题单处理"])
async def create_problem(
    project_id: str = Body(...),
    feedback_id: Optional[str] = Body(None),
    problem_type: ProblemType = Body(...),
    reason: str = Body(...),
    created_by: str = Body(...),
    original_data: Optional[str] = Body(None),
    new_data: Optional[str] = Body(None)
):
    user = db.get("user", created_by)
    if not user or user.role != RoleType.PROJECT_MANAGER:
        raise HTTPException(status_code=403,
                           detail="只有项目经理可以创建问题单")

    result = ProblemService.create_problem(
        project_id=project_id,
        feedback_id=feedback_id,
        problem_type=problem_type,
        reason=reason,
        created_by=created_by,
        original_data=original_data,
        new_data=new_data,
        auto_create_fee=False
    )

    return result


@app.get("/api/problems", tags=["问题单处理"])
async def list_problems(
    project_id: Optional[str] = Query(None),
    problem_type: Optional[ProblemType] = Query(None)
):
    if project_id:
        problems = ProblemService.get_problems_by_project(project_id)
    else:
        problems = db.get_all("problem")

    if problem_type:
        problems = [p for p in problems if p.problem_type == problem_type]

    return problems


@app.get("/api/problems/{problem_id}", tags=["问题单处理"])
async def get_problem_detail(problem_id: str):
    problem = db.get("problem", problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail=f"问题单 {problem_id} 不存在")

    feedback = None
    if problem.feedback_id:
        feedback = db.get("feedback", problem.feedback_id)

    related_fees = [f for f in db.get_all("fee") if f.problem_id == problem_id]

    status_changes = StatusChangeService.get_changes_by_entity("problem", problem_id)

    return {
        "problem": problem,
        "feedback": feedback,
        "related_fees": related_fees,
        "status_changes": status_changes
    }


@app.put("/api/problems/{problem_id}/resolve", tags=["问题单处理"])
async def resolve_problem(
    problem_id: str,
    resolved_by: str = Body(...)
):
    problem = ProblemService.resolve_problem(problem_id, resolved_by)
    return {"message": "问题单解决成功", "problem": problem}


@app.get("/api/status-changes", tags=["状态变更记录"])
async def list_status_changes(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None)
):
    if entity_type and entity_id:
        changes = StatusChangeService.get_changes_by_entity(entity_type, entity_id)
    else:
        changes = StatusChangeService.get_all_changes()

    return sorted(changes, key=lambda x: x.created_at, reverse=True)


@app.get("/api/status-changes/{entity_type}/{entity_id}", tags=["状态变更记录"])
async def get_entity_status_changes(entity_type: str, entity_id: str):
    changes = StatusChangeService.get_changes_by_entity(entity_type, entity_id)
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "changes": sorted(changes, key=lambda x: x.created_at)
    }


@app.get("/api/state-transitions/{entity_type}", tags=["状态机"])
async def get_allowed_transitions(entity_type: str):
    if entity_type == "project":
        current = OrderStatus.PENDING
    elif entity_type == "feedback":
        current = FeedbackStatus.PENDING
    elif entity_type == "fee":
        current = FeeStatus.PENDING
    else:
        raise HTTPException(status_code=400, detail="无效的实体类型")

    return {
        "entity_type": entity_type,
        "allowed_transitions": StateMachine.get_allowed_transitions(entity_type, current)
    }
