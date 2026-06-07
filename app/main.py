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
    current_user: models.User = Depends(auth.require_roles(RoleEnum.STATION_MANAGER.value, RoleEnum.METER_READER.value))
):
    invoice = db.query(models.InvoiceReissue).filter(models.InvoiceReissue.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票记录不存在")
    old_status = invoice.status
    if update.status:
        invoice.status = update.status.value
    if update.return_reason is not None:
        invoice.return_reason = update.return_reason
    if update.supplement_remark is not None:
        invoice.supplement_remark = update.supplement_remark
    invoice.handled_by = current_user.id
    db.commit()
    db.refresh(invoice)
    status_map = {
        InvoiceStatusEnum.PROCESSING.value: "开始处理发票补开",
        InvoiceStatusEnum.RETURNED.value: "退回发票补开申请",
        InvoiceStatusEnum.COMPLETED.value: "完成发票补开"
    }
    add_flow_log(
        db, invoice_id=invoice.id, recharge_id=invoice.recharge_id,
        action="update_status",
        action_desc=status_map.get(update.status.value, "更新发票状态") if update.status else "更新发票记录",
        from_status=old_status,
        to_status=update.status.value if update.status else None,
        operator_id=current_user.id,
        remark=update.return_reason or update.supplement_remark
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


@app.get("/", include_in_schema=False)
def root():
    return {"message": "加油站运营系统 API 已启动，请访问 /docs 查看接口文档"}
