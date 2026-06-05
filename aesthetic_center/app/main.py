from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.database import SessionLocal
from app.seed import init_db, seed_db
from app.routers import orders, inspections, anomalies
from app.errors import ErrorCode, ERROR_MESSAGES


@asynccontextmanager
async def lifespan(application: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="鲜花配送站 - 订单制作与花艺质检系统",
    description="订单制作处理、花艺质检回看、异常标注与追溯",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": ErrorCode.UNKNOWN, "message": ERROR_MESSAGES[ErrorCode.UNKNOWN]},
    )


app.include_router(orders.router)
app.include_router(inspections.router)
app.include_router(anomalies.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "system": "鲜花配送站 - 订单制作与花艺质检系统",
        "version": "1.0.0",
        "docs": "/docs",
    }
