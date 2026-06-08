from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from database import engine, get_db, Base
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="水产养殖场管理系统")

@app.post("/api/login")
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_login.username).first()
    if not user or user.hashed_password != user_login.password:
        raise HTTPException(status_code=401, detail="错误")
    return {"id": user.id, "username": user.username, "name": user.name, "role": user.role}

@app.get("/api/users")
def list_users(db: Session = Depends(get_db)):
    return [{"id": u.id, "username": u.username, "name": u.name, "role": u.role} for u in db.query(models.User).all()]

@app.get("/api/feed-requisitions")
def list_feed_requisitions(db: Session = Depends(get_db)):
    return db.query(models.FeedRequisition).order_by(models.FeedRequisition.requested_at.desc()).all()

@app.get("/api/feed-requisitions/{req_id}")
def get_feed_requisition(req_id: int, db: Session = Depends(get_db)):
    req = db.query(models.FeedRequisition).filter(models.FeedRequisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="不存在")
    return req

