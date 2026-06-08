from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from database import engine, get_db, Base
import models, schemas

Base.metadata.create_all(bind=engine)
app = FastAPI(title="水产养殖场管理系统")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def add_status_log(db, model_type, item_id, from_status, to_status, operator, operator_role, remark=""):
    db.add(models.StatusLog(**{model_type: item_id}, from_status=from_status, to_status=to_status, operator=operator, operator_role=operator_role, operated_at=datetime.utcnow(), remark=remark))
    db.flush()

@app.post("/api/login")
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_login.username).first()
    if not user or user.hashed_password != user_login.password:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return {"id": user.id, "username": user.username, "name": user.name, "role": user.role}

@app.get("/api/users")
def list_users(db: Session = Depends(get_db)):
    return [{"id": u.id, "username": u.username, "name": u.name, "role": u.role} for u in db.query(models.User).all()]

@app.get("/api/feeding-plans", response_model=list[schemas.FeedingPlanResponse])
def list_feeding_plans(db: Session = Depends(get_db)):
    plans = db.query(models.FeedingPlan).options(joinedload(models.FeedingPlan.status_logs)).order_by(models.FeedingPlan.created_at.desc()).all()
    return plans

@app.post("/api/feeding-plans", response_model=schemas.FeedingPlanResponse)
def create_feeding_plan(data: schemas.FeedingPlanCreate, db: Session = Depends(get_db)):
    count = db.query(models.FeedingPlan).count()
    created_by = ""
    remark = data.remark or ""
    if "created_by:" in remark:
        parts = remark.split("created_by:")
        created_by = parts[-1]
        remark = parts[0].rstrip("|")
    plan = models.FeedingPlan(
        plan_no=f"FP-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:03d}",
        pond_no=data.pond_no, breed_type=data.breed_type, feed_type=data.feed_type,
        daily_amount=data.daily_amount, frequency=data.frequency,
        start_date=data.start_date, end_date=data.end_date,
        status="draft", created_by=created_by or "unknown", remark=remark,
    )
    db.add(plan)
    db.flush()
    add_status_log(db, "feeding_plan_id", plan.id, "", "draft", plan.created_by, "technician", "创建投喂计划")
    db.commit()
    db.refresh(plan)
    return plan

@app.get("/api/feeding-plans/{plan_id}", response_model=schemas.FeedingPlanResponse)
def get_feeding_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.FeedingPlan).options(joinedload(models.FeedingPlan.status_logs)).filter(models.FeedingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="投喂计划不存在")
    return plan

@app.put("/api/feeding-plans/{plan_id}/submit")
def submit_feeding_plan(plan_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    plan = db.query(models.FeedingPlan).filter(models.FeedingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="投喂计划不存在")
    if plan.status != "draft":
        raise HTTPException(status_code=400, detail="只有草稿状态才能提交")
    old = plan.status
    plan.status = "submitted"
    add_status_log(db, "feeding_plan_id", plan.id, old, "submitted", data.status, "technician", data.remark or "提交审核")
    db.commit()
    return {"id": plan.id, "status": plan.status}

@app.put("/api/feeding-plans/{plan_id}/approve")
def approve_feeding_plan(plan_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    plan = db.query(models.FeedingPlan).filter(models.FeedingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="投喂计划不存在")
    if plan.status != "submitted":
        raise HTTPException(status_code=400, detail="只有已提交状态才能审核")
    old = plan.status
    plan.status = "approved"
    add_status_log(db, "feeding_plan_id", plan.id, old, "approved", data.status, "manager", data.remark or "审核通过")
    db.commit()
    return {"id": plan.id, "status": plan.status}

@app.put("/api/feeding-plans/{plan_id}/reject")
def reject_feeding_plan(plan_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    plan = db.query(models.FeedingPlan).filter(models.FeedingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="投喂计划不存在")
    if plan.status != "submitted":
        raise HTTPException(status_code=400, detail="只有已提交状态才能驳回")
    old = plan.status
    plan.status = "rejected"
    add_status_log(db, "feeding_plan_id", plan.id, old, "rejected", data.status, "manager", data.remark or "审核驳回")
    db.commit()
    return {"id": plan.id, "status": plan.status}

@app.get("/api/feed-requisitions", response_model=list[schemas.FeedRequisitionResponse])
def list_feed_requisitions(db: Session = Depends(get_db)):
    reqs = db.query(models.FeedRequisition).options(joinedload(models.FeedRequisition.status_logs)).order_by(models.FeedRequisition.requested_at.desc()).all()
    return reqs

@app.post("/api/feed-requisitions", response_model=schemas.FeedRequisitionResponse)
def create_feed_requisition(data: schemas.FeedRequisitionCreate, db: Session = Depends(get_db)):
    plan = db.query(models.FeedingPlan).filter(models.FeedingPlan.id == data.feeding_plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="关联投喂计划不存在")
    if plan.status != "approved":
        raise HTTPException(status_code=400, detail="只有审核通过的计划才能领用饲料")
    count = db.query(models.FeedRequisition).count()
    requested_by = ""
    remark = data.remark or ""
    if "requested_by:" in remark:
        parts = remark.split("requested_by:")
        requested_by = parts[-1]
        remark = parts[0].rstrip("|")
    req = models.FeedRequisition(
        req_no=f"FR-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:03d}",
        feeding_plan_id=data.feeding_plan_id, pond_no=data.pond_no, feed_type=data.feed_type,
        amount=data.amount, status="pending", requested_by=requested_by or "unknown", remark=remark,
    )
    db.add(req)
    db.flush()
    add_status_log(db, "feed_requisition_id", req.id, "", "pending", req.requested_by, "technician", "申请领用饲料")
    db.commit()
    db.refresh(req)
    return req

@app.get("/api/feed-requisitions/{req_id}", response_model=schemas.FeedRequisitionResponse)
def get_feed_requisition(req_id: int, db: Session = Depends(get_db)):
    req = db.query(models.FeedRequisition).options(joinedload(models.FeedRequisition.status_logs)).filter(models.FeedRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="饲料领用单不存在")
    return req

@app.put("/api/feed-requisitions/{req_id}/issue")
def issue_feed_requisition(req_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    req = db.query(models.FeedRequisition).filter(models.FeedRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="饲料领用单不存在")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="只有待发料状态才能发料")
    old = req.status
    req.status = "issued"
    req.issued_by = data.status
    req.issued_at = datetime.utcnow()
    add_status_log(db, "feed_requisition_id", req.id, old, "issued", data.status, "warehouse", data.remark or "确认发料")
    db.commit()
    return {"id": req.id, "status": req.status}

@app.put("/api/feed-requisitions/{req_id}/receive")
def receive_feed_requisition(req_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    req = db.query(models.FeedRequisition).filter(models.FeedRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="饲料领用单不存在")
    if req.status != "issued":
        raise HTTPException(status_code=400, detail="只有已发料状态才能确认收料")
    old = req.status
    req.status = "received"
    req.received_by = data.status
    req.received_at = datetime.utcnow()
    add_status_log(db, "feed_requisition_id", req.id, old, "received", data.status, "technician", data.remark or "确认收料")
    db.commit()
    return {"id": req.id, "status": req.status}
