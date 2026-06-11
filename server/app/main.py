from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal, Base
from .models import User, PublicRepair, EngineeringDispatch, StatusLog
from .seed import seed_data
from .routers import repairs, dispatches, status_logs, export, users

app = FastAPI(title="商场运营-公共报修与工程派单系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repairs.router)
app.include_router(dispatches.router)
app.include_router(status_logs.router)
app.include_router(export.router)
app.include_router(users.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


@app.get("/", summary="API信息")
def root():
    return {
        "name": "商场运营-公共报修与工程派单系统",
        "version": "1.0.0",
        "docs": "/docs",
    }
