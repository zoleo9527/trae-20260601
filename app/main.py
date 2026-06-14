from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import materials, feedbacks, alerts, responsibility, exports, basic

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="彩票门店活动物料与门店反馈管理系统",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(basic.router)
app.include_router(materials.router)
app.include_router(feedbacks.router)
app.include_router(alerts.router)
app.include_router(responsibility.router)
app.include_router(exports.router)


@app.get("/")
def root():
    return {
        "message": "彩票门店管理系统API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}