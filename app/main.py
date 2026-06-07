from datetime import timedelta, datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import engine, get_db, Base
from . import models, schemas, auth
from .models import RoleEnum, RechargeStatusEnum, InvoiceStatusEnum
import os
from openpyxl import Workbook

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="加油站运营系统 - 会员充值与发票补开",
    description="加油站会员充值审核、发票补开流程管理系统",
    version="1.0.0"
)

static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


def add_flow_log(db: Session, recharge_id=None, invoice_id=None, action="", action_desc="",
                 from_status=None, to_status=None, operator_id=None, remark=None):
    log = models.FlowLog(
        recharge_id=recharge_id,
        invoice_id=invoice_id,
        action=action,
        action_desc=action_desc,
        from_status=from_status,
        to_status=to_status,
        operator_id=operator_id,
        remark=remark
    )
    db.add(log)
    db.commit()
    return log


def enrich_recharge_response(recharge: models.MemberRecharge) -> schemas.MemberRechargeResponse:
    resp = schemas.MemberRechargeResponse.model_validate(recharge)
    resp.creator_name = recharge.creator.full_name if recharge.creator else None
    resp.handler_name = recharge.handler.full_name if recharge.handler else None
    return resp


def enrich_invoice_response(invoice: models.InvoiceReissue) -> schemas.InvoiceReissueResponse:
    resp = schemas.InvoiceReissueResponse.model_validate(invoice)
    resp.creator_name = invoice.creator.full_name if invoice.creator else None
    resp.handler_name = invoice.handler.full_name if invoice.handler else None
    return resp


def enrich_flow_log_response(log: models.FlowLog) -> schemas.FlowLogResponse:
    resp = schemas.FlowLogResponse.model_validate(log)
    resp.operator_name = log.operator.full_name if log.operator else None
    return resp


@app.post("/token", response_model=schemas.Token, tags=["认证"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.UserResponse, tags=["用户"])
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/users", response_model=schemas.UserResponse, tags=["用户"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users", response_model=List[schemas.UserResponse], tags=["用户"])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).all()


@app.post("/recharges", response_model=schemas.MemberRechargeResponse, tags=["会员充值"])
def create_recharge(
    recharge: schemas.MemberRechargeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(RoleEnum.CASHIER.value, RoleEnum.STATION_MANAGER.value))
):
    db_recharge = models.MemberRecharge(
        **recharge.model_dump(),
        created_by=current_user.id
    )
    db.add(db_recharge)
    db.commit()
    db.refresh(db_recharge)
    add_flow_log(
        db, recharge_id=db_recharge.id,
        action="create", action_desc="创建会员充值记录",
        to_status=RechargeStatusEnum.PENDING.value,
        operator_id=current_user.id
    )
    db.refresh(db_recharge)
    return enrich_recharge_response(db_recharge)


@app.get("/recharges", response_model=List[schemas.MemberRechargeResponse], tags=["会员充值"])
def list_recharges(
    status: Optional[RechargeStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.MemberRecharge)
    if status:
        query = query.filter(models.MemberRecharge.status == status.value)
    recharges = query.order_by(models.MemberRecharge.created_at.desc()).all()
    return [enrich_recharge_response(r) for r in recharges]


@app.get("/recharges/{recharge_id}", response_model=schemas.MemberRechargeDetail, tags=["会员充值"])
def get_recharge_detail(
    recharge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    recharge = db.query(models.MemberRecharge).filter(models.MemberRecharge.id == recharge_id).first()
    if not recharge:
        raise HTTPException(status_code=404, detail="充值记录不存在")
    detail = schemas.MemberRechargeDetail.model_validate(recharge)
    detail.creator_name = recharge.creator.full_name if recharge.creator else None
    detail.handler_name = recharge.handler.full_name if recharge.handler else None
    detail.invoices = [enrich_invoice_response(inv) for inv in recharge.invoices]
    detail.flow_logs = [enrich_flow_log_response(log) for log in sorted(recharge.flow_logs, key=lambda x: x.created_at)]
    return detail


@app.put("/recharges/{recharge_id}", response_model=schemas.MemberRechargeResponse, tags=["会员充值"])
def update_recharge(
    recharge_id: int,
    update: schemas.MemberRechargeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(RoleEnum.STATION_MANAGER.value, RoleEnum.METER_READER.value))
):
    recharge = db.query(models.MemberRecharge).filter(models.MemberRecharge.id == recharge_id).first()
    if not recharge:
        raise HTTPException(status_code=404, detail="充值记录不存在")
    old_status = recharge.status
    if update.status:
        recharge.status = update.status.value
    if update.remark is not None:
        recharge.remark = update.remark
    recharge.handled_by = current_user.id
    db.commit()
    db.refresh(recharge)
    status_map = {
        RechargeStatusEnum.VERIFIED.value: "审核充值记录",
        RechargeStatusEnum.CONFIRMED.value: "确认充值到账",
        RechargeStatusEnum.REJECTED.value: "驳回充值申请"
    }
    add_flow_log(
        db, recharge_id=recharge.id,
        action="update_status",
        action_desc=status_map.get(update.status.value, "更新充值状态") if update.status else "更新充值记录",
        from_status=old_status,
        to_status=update.status.value if update.status else None,
        operator_id=current_user.id,
        remark=update.remark
    )
    return enrich_recharge_response(recharge)


@app.post("/invoices", response_model=schemas.InvoiceReissueResponse, tags=["发票补开"])
def create_invoice(
    invoice: schemas.InvoiceReissueCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(RoleEnum.CASHIER.value))
):
    recharge = db.query(models.MemberRecharge).filter(models.MemberRecharge.id == invoice.recharge_id).first()
    if not recharge:
        raise HTTPException(status_code=404, detail="关联的充值记录不存在")
    db_invoice = models.InvoiceReissue(
        **invoice.model_dump(),
        created_by=current_user.id
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    add_flow_log(
        db, invoice_id=db_invoice.id, recharge_id=invoice.recharge_id,
        action="create", action_desc="创建发票补开申请",
        to_status=InvoiceStatusEnum.PENDING.value,
        operator_id=current_user.id
    )
    db.refresh(db_invoice)
    return enrich_invoice_response(db_invoice)


@app.get("/invoices", response_model=List[schemas.InvoiceReissueResponse], tags=["发票补开"])
def list_invoices(
    status: Optional[InvoiceStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.InvoiceReissue)
    if status:
        query = query.filter(models.InvoiceReissue.status == status.value)
    invoices = query.order_by(models.InvoiceReissue.created_at.desc()).all()
    return [enrich_invoice_response(i) for i in invoices]


@app.get("/invoices/{invoice_id}", response_model=schemas.InvoiceReissueDetail, tags=["发票补开"])
def get_invoice_detail(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    invoice = db.query(models.InvoiceReissue).filter(models.InvoiceReissue.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票记录不存在")
    detail = schemas.InvoiceReissueDetail.model_validate(invoice)
    detail.creator_name = invoice.creator.full_name if invoice.creator else None
    detail.handler_name = invoice.handler.full_name if invoice.handler else None
    if invoice.recharge:
        detail.recharge = enrich_recharge_response(invoice.recharge)
    detail.flow_logs = [enrich_flow_log_response(log) for log in sorted(invoice.flow_logs, key=lambda x: x.created_at)]
    return detail


@app.put("/invoices/{invoice_id}", response_model=schemas.InvoiceReissueResponse, tags=["发票补开"])
def update_invoice(
    invoice_id: int,
    update: schemas.InvoiceReissueUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    invoice = db.query(models.InvoiceReissue).filter(models.InvoiceReissue.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票记录不存在")

    is_cashier_resubmit = (
        current_user.role == RoleEnum.CASHIER.value
        and invoice.status == InvoiceStatusEnum.RETURNED.value
        and invoice.created_by == current_user.id
        and update.status == InvoiceStatusEnum.PENDING.value
    )
    is_manager_process = current_user.role in [RoleEnum.STATION_MANAGER.value, RoleEnum.METER_READER.value]

    if not is_cashier_resubmit and not is_manager_process:
        raise HTTPException(status_code=403, detail="无权限执行此操作")

    old_status = invoice.status
    old_return_reason = invoice.return_reason

    if update.status:
        invoice.status = update.status.value
    if update.return_reason is not None:
        invoice.return_reason = update.return_reason
    if update.supplement_remark is not None:
        invoice.supplement_remark = update.supplement_remark

    if is_cashier_resubmit:
        invoice.handled_by = None
    else:
        invoice.handled_by = current_user.id

    db.commit()
    db.refresh(invoice)

    if is_cashier_resubmit:
        action_desc = "收银员补充信息后重新提交"
        remark_parts = []
        if old_return_reason:
            remark_parts.append(f"原退回原因: {old_return_reason}")
        if update.supplement_remark:
            remark_parts.append(f"补充说明: {update.supplement_remark}")
        flow_remark = " | ".join(remark_parts) if remark_parts else None
    else:
        status_map = {
            InvoiceStatusEnum.PROCESSING.value: "开始处理发票补开",
            InvoiceStatusEnum.RETURNED.value: "退回发票补开申请",
            InvoiceStatusEnum.COMPLETED.value: "完成发票补开"
        }
        action_desc = status_map.get(update.status.value, "更新发票状态") if update.status else "更新发票记录"
        flow_remark = update.return_reason or update.supplement_remark

    add_flow_log(
        db, invoice_id=invoice.id, recharge_id=invoice.recharge_id,
        action="update_status",
        action_desc=action_desc,
        from_status=old_status,
        to_status=update.status.value if update.status else None,
        operator_id=current_user.id,
        remark=flow_remark
    )
    return enrich_invoice_response(invoice)


@app.get("/todos", response_model=schemas.TodoListResponse, tags=["待办任务"])
def get_my_todos(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    todos = []
    role = current_user.role

    if role in [RoleEnum.STATION_MANAGER.value, RoleEnum.METER_READER.value]:
        pending_recharges = db.query(models.MemberRecharge).filter(
            models.MemberRecharge.status == RechargeStatusEnum.PENDING.value
        ).all()
        for r in pending_recharges:
            todos.append(schemas.TodoItem(
                id=r.id,
                type="recharge",
                title=f"会员充值审核 - {r.member_name}",
                description=f"充值金额: ¥{r.recharge_amount}, 卡号: {r.member_card_no}",
                status=r.status,
                created_at=r.created_at,
                priority="high"
            ))

    if role in [RoleEnum.STATION_MANAGER.value]:
        pending_invoices = db.query(models.InvoiceReissue).filter(
            models.InvoiceReissue.status.in_([InvoiceStatusEnum.PENDING.value, InvoiceStatusEnum.RETURNED.value])
        ).all()
        for inv in pending_invoices:
            priority = "high" if inv.status == InvoiceStatusEnum.RETURNED.value else "medium"
            todos.append(schemas.TodoItem(
                id=inv.id,
                type="invoice",
                title=f"发票补开处理 - {inv.invoice_title}",
                description=f"开票金额: ¥{inv.invoice_amount}, 退回原因: {inv.return_reason or '无'}",
                status=inv.status,
                created_at=inv.created_at,
                priority=priority
            ))

    if role == RoleEnum.CASHIER.value:
        returned_invoices = db.query(models.InvoiceReissue).filter(
            models.InvoiceReissue.status == InvoiceStatusEnum.RETURNED.value,
            models.InvoiceReissue.created_by == current_user.id
        ).all()
        for inv in returned_invoices:
            todos.append(schemas.TodoItem(
                id=inv.id,
                type="invoice",
                title=f"发票补开被退回 - 需补充信息 - {inv.invoice_title}",
                description=f"退回原因: {inv.return_reason or '未填写'}",
                status=inv.status,
                created_at=inv.created_at,
                priority="high"
            ))

    todos.sort(key=lambda x: (x.priority != "high", x.created_at))
    return schemas.TodoListResponse(
        pending_count=len(todos),
        todos=todos
    )


@app.get("/export/recharges", tags=["导出"])
def export_recharges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(RoleEnum.STATION_MANAGER.value))
):
    recharges = db.query(models.MemberRecharge).order_by(models.MemberRecharge.created_at.desc()).all()
    wb = Workbook()
    ws = wb.active
    ws.title = "会员充值记录"
    headers = ["ID", "会员姓名", "手机号", "会员卡号", "充值金额", "支付方式", "充值时间", "状态", "创建人", "处理人", "备注", "创建时间"]
    ws.append(headers)
    status_map = {
        "pending": "待审核",
        "verified": "已审核",
        "confirmed": "已到账",
        "rejected": "已驳回"
    }
    for r in recharges:
        ws.append([
            r.id, r.member_name, r.member_phone, r.member_card_no,
            r.recharge_amount, r.payment_method,
            r.recharge_time.strftime("%Y-%m-%d %H:%M") if r.recharge_time else "",
            status_map.get(r.status, r.status),
            r.creator.full_name if r.creator else "",
            r.handler.full_name if r.handler else "",
            r.remark or "",
            r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
        ])
    filename = f"会员充值记录_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    filepath = os.path.join(os.path.dirname(__file__), "..", filename)
    wb.save(filepath)
    return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@app.get("/export/invoices", tags=["导出"])
def export_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(RoleEnum.STATION_MANAGER.value))
):
    invoices = db.query(models.InvoiceReissue).order_by(models.InvoiceReissue.created_at.desc()).all()
    wb = Workbook()
    ws = wb.active
    ws.title = "发票补开记录"
    headers = ["ID", "关联充值ID", "发票抬头", "税号", "开票金额", "发票类型", "收件邮箱", "状态", "退回原因", "补充备注", "创建人", "处理人", "创建时间"]
    ws.append(headers)
    status_map = {
        "pending": "待处理",
        "processing": "处理中",
        "returned": "已退回",
        "completed": "已完成"
    }
    for inv in invoices:
        ws.append([
            inv.id, inv.recharge_id, inv.invoice_title, inv.tax_no,
            inv.invoice_amount, inv.invoice_type, inv.recipient_email or "",
            status_map.get(inv.status, inv.status),
            inv.return_reason or "", inv.supplement_remark or "",
            inv.creator.full_name if inv.creator else "",
            inv.handler.full_name if inv.handler else "",
            inv.created_at.strftime("%Y-%m-%d %H:%M") if inv.created_at else ""
        ])
    filename = f"发票补开记录_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    filepath = os.path.join(os.path.dirname(__file__), "..", filename)
    wb.save(filepath)
    return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@app.get("/flow-logs/recharge/{recharge_id}", response_model=List[schemas.FlowLogResponse], tags=["流转日志"])
def get_recharge_flow_logs(
    recharge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    logs = db.query(models.FlowLog).filter(models.FlowLog.recharge_id == recharge_id).order_by(models.FlowLog.created_at).all()
    return [enrich_flow_log_response(log) for log in logs]


@app.get("/flow-logs/invoice/{invoice_id}", response_model=List[schemas.FlowLogResponse], tags=["流转日志"])
def get_invoice_flow_logs(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    logs = db.query(models.FlowLog).filter(models.FlowLog.invoice_id == invoice_id).order_by(models.FlowLog.created_at).all()
    return [enrich_flow_log_response(log) for log in logs]


def build_unified_ledger(
    db: Session,
    current_user: models.User,
    recharge: Optional[models.MemberRecharge] = None,
    invoice: Optional[models.InvoiceReissue] = None
) -> schemas.UnifiedLedgerDetail:
    if invoice and not recharge:
        recharge = invoice.recharge
    if recharge and not invoice:
        invoice = db.query(models.InvoiceReissue).filter(
            models.InvoiceReissue.recharge_id == recharge.id
        ).first()

    recharge_resp = enrich_recharge_response(recharge) if recharge else None
    invoice_resp = enrich_invoice_response(invoice) if invoice else None

    ledger_type = "recharge" if recharge and not invoice else "full"

    recharge_status_map = {
        "pending": "充值待审核",
        "verified": "充值已审核待确认到账",
        "confirmed": "充值已到账",
        "rejected": "充值已驳回"
    }
    invoice_status_map = {
        "pending": "发票待处理",
        "processing": "发票处理中",
        "returned": "发票已退回待收银员补充",
        "completed": "发票已开具完成"
    }

    recharge_status_text = recharge_status_map.get(recharge.status, recharge.status) if recharge else None
    invoice_status_text = invoice_status_map.get(invoice.status, invoice.status) if invoice else None

    current_stage = "recharge"
    current_status_text = recharge_status_text or "未知"
    current_handler = None

    if recharge and recharge.status in [RechargeStatusEnum.PENDING.value, RechargeStatusEnum.VERIFIED.value, RechargeStatusEnum.REJECTED.value]:
        current_stage = "recharge"
        current_status_text = recharge_status_text
        current_handler = recharge.handler
    elif recharge and recharge.status in [RechargeStatusEnum.CONFIRMED.value] and invoice:
        current_stage = "invoice"
        current_status_text = invoice_status_text
        current_handler = invoice.handler
    elif recharge and recharge.status in [RechargeStatusEnum.CONFIRMED.value] and not invoice:
        current_stage = "recharge_done"
        current_status_text = "充值已到账，未申请发票"
        current_handler = recharge.handler
    elif not recharge and invoice:
        current_stage = "invoice"
        current_status_text = invoice_status_text
        current_handler = invoice.handler

    current_handler_name = current_handler.full_name if current_handler else None

    manager_return_reason = None
    cashier_supplement_remark = None
    manager_process_remark = None

    if invoice:
        manager_return_reason = invoice.return_reason
        if invoice.return_reason and invoice.supplement_remark:
            cashier_supplement_remark = invoice.supplement_remark
        elif invoice.supplement_remark and not invoice.return_reason:
            manager_process_remark = invoice.supplement_remark

    if recharge and recharge.remark and not invoice:
        manager_process_remark = recharge.remark

    all_logs_dict = {}
    if recharge:
        for log in recharge.flow_logs:
            all_logs_dict[log.id] = log
    if invoice:
        for log in invoice.flow_logs:
            all_logs_dict[log.id] = log
    all_logs = sorted(all_logs_dict.values(), key=lambda x: x.created_at)
    all_logs_resp = [enrich_flow_log_response(log) for log in all_logs]

    available_actions = []
    role = current_user.role

    if recharge and recharge.status == RechargeStatusEnum.PENDING.value:
        if role in [RoleEnum.STATION_MANAGER.value, RoleEnum.METER_READER.value]:
            available_actions.append({"action": "verify_recharge", "label": "【充值】审核通过", "type": "success", "stage": "recharge"})
            available_actions.append({"action": "reject_recharge", "label": "【充值】驳回申请", "type": "danger", "stage": "recharge"})
    if recharge and recharge.status == RechargeStatusEnum.VERIFIED.value:
        if role == RoleEnum.STATION_MANAGER.value:
            available_actions.append({"action": "confirm_recharge", "label": "【充值】确认到账", "type": "success", "stage": "recharge"})
    if invoice:
        if role == RoleEnum.STATION_MANAGER.value:
            if invoice.status in [InvoiceStatusEnum.PENDING.value, InvoiceStatusEnum.RETURNED.value]:
                available_actions.append({"action": "process_invoice", "label": "【发票】开始处理", "type": "success", "stage": "invoice"})
            if invoice.status == InvoiceStatusEnum.PROCESSING.value:
                available_actions.append({"action": "complete_invoice", "label": "【发票】完成开票", "type": "success", "stage": "invoice"})
                available_actions.append({"action": "return_invoice", "label": "【发票】退回补充", "type": "warning", "stage": "invoice"})
        if role == RoleEnum.CASHIER.value and invoice.status == InvoiceStatusEnum.RETURNED.value and invoice.created_by == current_user.id:
            available_actions.append({"action": "resubmit_invoice", "label": "【发票】补充信息重新提交", "type": "primary", "stage": "invoice"})

    return schemas.UnifiedLedgerDetail(
        ledger_type=ledger_type,
        recharge=recharge_resp,
        invoice=invoice_resp,
        current_stage=current_stage,
        current_status_text=current_status_text,
        current_handler_name=current_handler_name,
        recharge_status_text=recharge_status_text,
        invoice_status_text=invoice_status_text,
        manager_return_reason=manager_return_reason,
        cashier_supplement_remark=cashier_supplement_remark,
        manager_process_remark=manager_process_remark,
        all_flow_logs=all_logs_resp,
        available_actions=available_actions
    )


@app.get("/ledger/recharge/{recharge_id}", response_model=schemas.UnifiedLedgerDetail, tags=["统一台账"])
def get_ledger_by_recharge(
    recharge_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    recharge = db.query(models.MemberRecharge).filter(models.MemberRecharge.id == recharge_id).first()
    if not recharge:
        raise HTTPException(status_code=404, detail="充值记录不存在")
    return build_unified_ledger(db, current_user, recharge=recharge)


@app.get("/ledger/invoice/{invoice_id}", response_model=schemas.UnifiedLedgerDetail, tags=["统一台账"])
def get_ledger_by_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    invoice = db.query(models.InvoiceReissue).filter(models.InvoiceReissue.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票记录不存在")
    return build_unified_ledger(db, current_user, invoice=invoice)


@app.get("/", include_in_schema=False)
def root():
    return {"message": "加油站运营系统 API 已启动，请访问 /docs 查看接口文档"}
