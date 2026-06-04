from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional
import json
from datetime import datetime, timedelta
import os

from .database import Base, engine, get_db
from . import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="中药煎药房补煎申请与费用确认系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


STATUS_FLOW = {
    "pending_pharmacist": {"next": "pending_decoctor", "role": "pharmacist"},
    "pending_decoctor": {"next": "pending_courier", "role": "decoctor"},
    "pending_courier": {"next": "pending_fee", "role": "courier"},
    "pending_fee": {"next": "completed", "role": "admin"},
}

ROLE_NAMES = {
    "pharmacist": "审方药师",
    "decoctor": "煎药员",
    "courier": "配送客服",
    "admin": "管理员",
}

STATUS_NAMES = {
    "pending_pharmacist": "待审方药师处理",
    "pending_decoctor": "待煎药员处理",
    "pending_courier": "待配送客服处理",
    "pending_fee": "待费用确认",
    "completed": "已完成",
    "rejected": "已退回",
}

REASON_NAMES = {
    "prescription_error": "处方看错",
    "batch_confusion": "代煎批次混淆",
    "address_error": "地址改动漏同步",
    "other": "其他原因",
}


def get_current_user(x_user_id: Optional[int] = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="未登录")
    user = db.query(models.User).filter(models.User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


def generate_application_no(db: Session):
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"BJ{today}"
    last = db.query(models.SupplementaryApplication).filter(
        models.SupplementaryApplication.application_no.like(f"{prefix}%")
    ).order_by(models.SupplementaryApplication.application_no.desc()).first()
    if last:
        seq = int(last.application_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def add_operation_log(db: Session, app_id: int, user: models.User, action: str,
                      from_status: str = None, to_status: str = None,
                      remark: str = None, field_changes: dict = None):
    log = models.OperationLog(
        application_id=app_id,
        operator_id=user.id,
        operator_name=user.name,
        operator_role=user.role,
        action=action,
        from_status=from_status,
        to_status=to_status,
        remark=remark,
        field_changes=json.dumps(field_changes, ensure_ascii=False) if field_changes else None,
        created_at=datetime.now(),
    )
    db.add(log)
    db.commit()


def init_mock_data(db: Session):
    users = [
        {"username": "admin", "name": "系统管理员", "role": "admin"},
        {"username": "ys1", "name": "张药师", "role": "pharmacist"},
        {"username": "jy1", "name": "李煎药", "role": "decoctor"},
        {"username": "ps1", "name": "王客服", "role": "courier"},
    ]
    for u in users:
        if not db.query(models.User).filter(models.User.username == u["username"]).first():
            db.add(models.User(**u))

    db.commit()

    if db.query(models.SupplementaryApplication).count() > 0:
        return

    now = datetime.now()
    today = now.date()
    yesterday = (now - timedelta(days=1)).date()
    two_days_ago = (now - timedelta(days=2)).date()

    mock_applications = [
        {
            "prescription_no": "CF20260604001",
            "patient_name": "张三丰",
            "patient_phone": "13800138001",
            "address": "北京市朝阳区xx路xx号xx小区1号楼101",
            "original_decoction_batch": "JD20260603A12",
            "reason_type": "prescription_error",
            "reason_detail": "处方中\"当归15g\"看错为\"黄芪15g\"，导致煎药错误",
            "status": "pending_pharmacist",
            "current_handler_role": "pharmacist",
            "due_date": datetime.combine(today, datetime.max.time()),
            "is_overdue": False,
            "days_ago": 0,
        },
        {
            "prescription_no": "CF20260604002",
            "patient_name": "李四",
            "patient_phone": "13800138002",
            "address": "北京市海淀区xx路xx号",
            "original_decoction_batch": "JD20260603B08",
            "reason_type": "batch_confusion",
            "reason_detail": "煎药批次标签贴错，将A批次药物发往B批次患者",
            "status": "pending_pharmacist",
            "current_handler_role": "pharmacist",
            "due_date": datetime.combine(today, datetime.max.time()),
            "is_overdue": False,
            "days_ago": 0,
        },
        {
            "prescription_no": "CF20260604003",
            "patient_name": "王五",
            "patient_phone": "13800138003",
            "address": "北京市西城区xx胡同xx号",
            "original_decoction_batch": "JD20260602C15",
            "reason_type": "address_error",
            "reason_detail": "患者地址已变更但未同步，原地址已无人签收",
            "status": "pending_decoctor",
            "current_handler_role": "decoctor",
            "due_date": datetime.combine(yesterday, datetime.max.time()),
            "is_overdue": True,
            "days_ago": 1,
        },
        {
            "prescription_no": "CF20260604004",
            "patient_name": "赵六",
            "patient_phone": "13800138004",
            "address": "北京市东城区xx大街xx号",
            "original_decoction_batch": "JD20260601D22",
            "reason_type": "prescription_error",
            "reason_detail": "药方剂量看错，10付药按5付煎制",
            "status": "pending_courier",
            "current_handler_role": "courier",
            "due_date": datetime.combine(two_days_ago, datetime.max.time()),
            "is_overdue": True,
            "days_ago": 2,
        },
        {
            "prescription_no": "CF20260604005",
            "patient_name": "钱七",
            "patient_phone": "13800138005",
            "address": "北京市丰台区xx路xx号xx花园3号楼502",
            "original_decoction_batch": "JD20260602E07",
            "reason_type": "other",
            "reason_detail": "煎药过程中机器故障，导致药物损坏",
            "status": "rejected",
            "current_handler_role": "pharmacist",
            "due_date": datetime.combine(today, datetime.max.time()),
            "is_overdue": False,
            "days_ago": 0,
        },
        {
            "prescription_no": "CF20260604006",
            "patient_name": "孙八",
            "patient_phone": "13800138006",
            "address": "北京市通州区xx镇xx村xx号",
            "original_decoction_batch": "JD20260603F18",
            "reason_type": "batch_confusion",
            "reason_detail": "相邻两个患者批次混淆，标签互换",
            "status": "pending_fee",
            "current_handler_role": "admin",
            "due_date": datetime.combine(today, datetime.max.time()),
            "is_overdue": False,
            "days_ago": 1,
        },
        {
            "prescription_no": "CF20260604007",
            "patient_name": "周九",
            "patient_phone": "13800138007",
            "address": "北京市昌平区xx路xx号",
            "original_decoction_batch": "JD20260601G09",
            "reason_type": "address_error",
            "reason_detail": "快递单填写错误，地址少写一个字导致退回",
            "status": "rejected",
            "current_handler_role": "decoctor",
            "due_date": datetime.combine(yesterday, datetime.max.time()),
            "is_overdue": False,
            "days_ago": 1,
        },
        {
            "prescription_no": "CF20260604008",
            "patient_name": "吴十",
            "patient_phone": "13800138008",
            "address": "北京市石景山区xx街道xx号",
            "original_decoction_batch": "JD20260603H11",
            "reason_type": "prescription_error",
            "reason_detail": "药物品种看错，将\"白术\"误煎为\"苍术\"",
            "status": "pending_decoctor",
            "current_handler_role": "decoctor",
            "due_date": datetime.combine(today, datetime.max.time()),
            "is_overdue": False,
            "days_ago": 0,
        },
    ]

    pharmacist = db.query(models.User).filter(models.User.username == "ys1").first()
    decoctor = db.query(models.User).filter(models.User.username == "jy1").first()
    courier = db.query(models.User).filter(models.User.username == "ps1").first()
    admin = db.query(models.User).filter(models.User.username == "admin").first()

    for idx, item in enumerate(mock_applications):
        app_no = generate_application_no(db)
        created_time = now - timedelta(days=item["days_ago"], hours=idx + 1)
        appl = models.SupplementaryApplication(
            application_no=app_no,
            prescription_no=item["prescription_no"],
            patient_name=item["patient_name"],
            patient_phone=item["patient_phone"],
            address=item["address"],
            original_decoction_batch=item["original_decoction_batch"],
            reason_type=item["reason_type"],
            reason_detail=item["reason_detail"],
            status=item["status"],
            current_handler_role=item["current_handler_role"],
            due_date=item["due_date"],
            is_overdue=item["is_overdue"],
            created_at=created_time,
            updated_at=created_time,
        )
        db.add(appl)
        db.flush()

        log = models.OperationLog(
            application_id=appl.id,
            operator_id=admin.id,
            operator_name=admin.name,
            operator_role=admin.role,
            action="create",
            from_status=None,
            to_status=item["status"],
            remark="系统创建补煎申请",
            created_at=created_time,
        )
        db.add(log)

        if item["status"] == "pending_fee":
            fee = models.FeeConfirmation(
                application_id=appl.id,
                decoction_fee=30.0,
                express_fee=15.0,
                material_fee=50.0,
                total_fee=95.0,
                is_patient_pay=False,
                payment_status="pending",
            )
            db.add(fee)

        if item["status"] == "pending_decoctor" or item["status"] == "pending_courier":
            log2 = models.OperationLog(
                application_id=appl.id,
                operator_id=pharmacist.id,
                operator_name=pharmacist.name,
                operator_role=pharmacist.role,
                action="approve",
                from_status="pending_pharmacist",
                to_status="pending_decoctor",
                remark="处方审核通过，原因属实，请煎药员处理",
                created_at=created_time + timedelta(minutes=30),
            )
            db.add(log2)

        if item["status"] == "pending_courier":
            log3 = models.OperationLog(
                application_id=appl.id,
                operator_id=decoctor.id,
                operator_name=decoctor.name,
                operator_role=decoctor.role,
                action="approve",
                from_status="pending_decoctor",
                to_status="pending_courier",
                remark="已重新煎制完成，请配送客服安排发货",
                created_at=created_time + timedelta(hours=2),
            )
            db.add(log3)

        if item["status"] == "rejected":
            rejector = pharmacist if item["current_handler_role"] == "pharmacist" else decoctor
            log_rej = models.OperationLog(
                application_id=appl.id,
                operator_id=rejector.id,
                operator_name=rejector.name,
                operator_role=rejector.role,
                action="reject",
                from_status="pending_pharmacist" if item["current_handler_role"] == "pharmacist" else "pending_decoctor",
                to_status="rejected",
                remark="证据不足，请补充处方照片和煎药标签照片后重新提交",
                created_at=created_time + timedelta(minutes=45),
            )
            db.add(log_rej)

    db.commit()


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    init_mock_data(db)
    db.close()


@app.post("/api/login", response_model=schemas.LoginResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        return {"success": False, "message": "用户名不存在"}
    return {"success": True, "user": user}


@app.get("/api/users", response_model=list[schemas.User])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.User).all()


@app.get("/api/applications", response_model=schemas.ApplicationListResponse)
def get_applications(
    status: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.SupplementaryApplication)

    if role and role != "all":
        if role == "pharmacist":
            query = query.filter(
                or_(
                    models.SupplementaryApplication.current_handler_role == "pharmacist",
                    models.SupplementaryApplication.status == "rejected",
                )
            )
        elif role == "decoctor":
            query = query.filter(
                or_(
                    models.SupplementaryApplication.current_handler_role == "decoctor",
                    models.SupplementaryApplication.status == "rejected",
                )
            )
        elif role == "courier":
            query = query.filter(
                or_(
                    models.SupplementaryApplication.current_handler_role == "courier",
                    models.SupplementaryApplication.status == "rejected",
                )
            )
        elif role == "admin":
            pass

    if status:
        query = query.filter(models.SupplementaryApplication.status == status)

    all_apps = query.order_by(models.SupplementaryApplication.created_at.desc()).all()

    today = datetime.now().date()
    today_tasks = []
    overdue_tasks = []
    returned_tasks = []

    for app in all_apps:
        if app.status == "rejected":
            returned_tasks.append(app)
        elif app.is_overdue or (app.due_date and app.due_date.date() < today):
            app.is_overdue = True
            overdue_tasks.append(app)
        elif app.due_date and app.due_date.date() == today and app.status != "completed":
            today_tasks.append(app)

    db.commit()

    return {
        "today_tasks": today_tasks,
        "overdue_tasks": overdue_tasks,
        "returned_tasks": returned_tasks,
        "all_tasks": all_apps,
    }


@app.get("/api/applications/{app_id}", response_model=schemas.SupplementaryApplication)
def get_application(app_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app = db.query(models.SupplementaryApplication).filter(models.SupplementaryApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="申请不存在")
    return app


@app.post("/api/applications", response_model=schemas.SupplementaryApplication)
def create_application(
    req: schemas.SupplementaryApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    app_no = generate_application_no(db)
    appl = models.SupplementaryApplication(
        application_no=app_no,
        **req.model_dump(),
        due_date=datetime.now() + timedelta(days=1),
    )
    db.add(appl)
    db.flush()

    add_operation_log(
        db, app_id=appl.id, user=current_user,
        action="create", to_status="pending_pharmacist",
        remark="创建补煎申请"
    )

    fee = models.FeeConfirmation(
        application_id=appl.id,
        decoction_fee=0,
        express_fee=0,
        material_fee=0,
        total_fee=0,
        is_patient_pay=False,
        payment_status="pending",
    )
    db.add(fee)
    db.commit()
    db.refresh(appl)
    return appl


@app.put("/api/applications/{app_id}", response_model=schemas.SupplementaryApplication)
def update_application(
    app_id: int,
    req: schemas.SupplementaryApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appl = db.query(models.SupplementaryApplication).filter(models.SupplementaryApplication.id == app_id).first()
    if not appl:
        raise HTTPException(status_code=404, detail="申请不存在")

    update_data = req.model_dump(exclude_unset=True)
    field_changes = {}
    for field, new_value in update_data.items():
        old_value = getattr(appl, field)
        if old_value != new_value:
            field_changes[field] = {"old": old_value, "new": new_value}
            setattr(appl, field, new_value)

    if field_changes:
        appl.is_modified = True
        appl.updated_at = datetime.now()

        add_operation_log(
            db, app_id=app_id, user=current_user,
            action="modify", from_status=appl.status, to_status=appl.status,
            remark="修改申请内容", field_changes=field_changes
        )

        if appl.fee_confirmation:
            appl.fee_confirmation.has_modification_notice = True
            appl.fee_confirmation.last_modified_at = datetime.now()

        db.commit()
        db.refresh(appl)

    return appl


@app.post("/api/applications/{app_id}/transition", response_model=schemas.SupplementaryApplication)
def transition_status(
    app_id: int,
    req: schemas.StatusTransitionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appl = db.query(models.SupplementaryApplication).filter(models.SupplementaryApplication.id == app_id).first()
    if not appl:
        raise HTTPException(status_code=404, detail="申请不存在")

    from_status = appl.status
    action = req.action

    if action == "reject":
        appl.status = "rejected"
        appl.updated_at = datetime.now()
        add_operation_log(
            db, app_id=app_id, user=current_user,
            action="reject", from_status=from_status, to_status="rejected",
            remark=req.remark or "退回申请"
        )
        db.commit()
        db.refresh(appl)
        return appl

    if action == "approve" or action == "submit_to_next":
        if from_status == "rejected":
            appl.status = "pending_pharmacist"
            appl.current_handler_role = "pharmacist"
            appl.is_overdue = False
            appl.due_date = datetime.now() + timedelta(days=1)
            appl.updated_at = datetime.now()
            add_operation_log(
                db, app_id=app_id, user=current_user,
                action="approve", from_status="rejected", to_status="pending_pharmacist",
                remark=req.remark or "修改后重新提交，进入审方环节"
            )
            db.commit()
            db.refresh(appl)
            return appl

        if from_status not in STATUS_FLOW:
            raise HTTPException(status_code=400, detail="当前状态无法流转")

        flow_info = STATUS_FLOW[from_status]
        if current_user.role not in [flow_info["role"], "admin"] and current_user.role != appl.current_handler_role:
            raise HTTPException(status_code=403, detail="您没有权限处理此申请")

        next_status = flow_info["next"]

        if next_status == "pending_decoctor":
            appl.current_handler_role = "decoctor"
        elif next_status == "pending_courier":
            appl.current_handler_role = "courier"
        elif next_status == "pending_fee":
            appl.current_handler_role = "admin"
        elif next_status == "completed":
            appl.current_handler_role = "admin"

        appl.status = next_status
        appl.updated_at = datetime.now()

        if appl.status == "pending_fee":
            fee = appl.fee_confirmation
            if not fee:
                fee = models.FeeConfirmation(
                    application_id=appl.id,
                    decoction_fee=0,
                    express_fee=0,
                    material_fee=0,
                    total_fee=0,
                    is_patient_pay=False,
                    payment_status="pending",
                )
                db.add(fee)
            if appl.is_modified:
                fee.has_modification_notice = True
                fee.last_modified_at = appl.updated_at

        action_name = "approve" if action == "approve" else "submit_to_next"
        add_operation_log(
            db, app_id=app_id, user=current_user,
            action=action_name, from_status=from_status, to_status=next_status,
            remark=req.remark or f"{ROLE_NAMES.get(current_user.role, current_user.role)}审核通过"
        )

        db.commit()
        db.refresh(appl)
        return appl

    raise HTTPException(status_code=400, detail="未知操作")


@app.put("/api/applications/{app_id}/fee", response_model=schemas.SupplementaryApplication)
def update_fee_confirmation(
    app_id: int,
    req: schemas.FeeConfirmationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appl = db.query(models.SupplementaryApplication).filter(models.SupplementaryApplication.id == app_id).first()
    if not appl:
        raise HTTPException(status_code=404, detail="申请不存在")

    if appl.status != "pending_fee" and appl.status != "completed":
        raise HTTPException(status_code=400, detail="当前状态无法确认费用")

    fee = appl.fee_confirmation
    if not fee:
        fee = models.FeeConfirmation(application_id=app_id)
        db.add(fee)
        db.flush()

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fee, field, value)

    if req.payment_status == "confirmed" or req.payment_status == "waived":
        fee.confirmed_by = current_user.id
        fee.confirmed_at = datetime.now()
        fee.has_modification_notice = False

        appl.status = "completed"
        appl.current_handler_role = "admin"
        appl.updated_at = datetime.now()
        from_status = "pending_fee" if appl.status == "completed" else appl.status
        add_operation_log(
            db, app_id=app_id, user=current_user,
            action="confirm_fee", from_status=from_status, to_status="completed",
            remark=req.remark or f"费用已{ '确认' if req.payment_status == 'confirmed' else '减免'}"
        )
    else:
        field_changes = {}
        for field in update_data:
            field_changes[field] = update_data[field]
        add_operation_log(
            db, app_id=app_id, user=current_user,
            action="modify_fee", from_status=appl.status, to_status=appl.status,
            remark="修改费用信息", field_changes=field_changes
        )

    db.commit()
    db.refresh(appl)
    return appl


@app.get("/api/applications/{app_id}/timeline", response_model=list[schemas.OperationLog])
def get_application_timeline(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    logs = db.query(models.OperationLog).filter(
        models.OperationLog.application_id == app_id
    ).order_by(models.OperationLog.created_at.asc()).all()
    return logs


@app.get("/api/dict")
def get_dictionaries():
    return {
        "roles": ROLE_NAMES,
        "statuses": STATUS_NAMES,
        "reasons": REASON_NAMES,
    }


@app.post("/api/reset")
def reset_data(req: schemas.ResetDataRequest, db: Session = Depends(get_db)):
    if not req.confirm:
        raise HTTPException(status_code=400, detail="请确认重置操作")

    db.query(models.OperationLog).delete()
    db.query(models.FeeConfirmation).delete()
    db.query(models.SupplementaryApplication).delete()
    db.commit()

    init_mock_data(db)

    return {"success": True, "message": "数据已重置"}


@app.get("/api/fee-review")
def get_fee_review_list(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    fees = db.query(models.FeeConfirmation).join(
        models.SupplementaryApplication
    ).order_by(models.FeeConfirmation.last_modified_at.desc().nullslast(),
               models.SupplementaryApplication.updated_at.desc()).all()

    result = []
    for fee in fees:
        result.append({
            "id": fee.id,
            "application_id": fee.application_id,
            "application_no": fee.application.application_no,
            "patient_name": fee.application.patient_name,
            "status": fee.application.status,
            "decoction_fee": fee.decoction_fee,
            "express_fee": fee.express_fee,
            "material_fee": fee.material_fee,
            "total_fee": fee.total_fee,
            "is_patient_pay": fee.is_patient_pay,
            "payment_status": fee.payment_status,
            "has_modification_notice": fee.has_modification_notice,
            "last_modified_at": fee.last_modified_at,
            "confirmed_at": fee.confirmed_at,
        })
    return result
