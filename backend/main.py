from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, engine
from backend.routers import dashboard, medication, followup, operation_logs

DB_PATH = os.path.join(os.path.dirname(__file__), "eye_surgery.db")
if not os.path.exists(DB_PATH):
    from backend.init_data import init_db
    init_db()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="眼科手术中心 - 术后用药与复诊提醒 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(medication.router, prefix="/api")
app.include_router(followup.router, prefix="/api")
app.include_router(operation_logs.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "眼科手术中心系统运行正常"}
