from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import store_order, warehouse_delivery, export_task, common, responsibility
from app.database import init_db

app = FastAPI(
    title="便利店连锁-门店订货与总部配货系统",
    description="解决门店订货与总部配货责任不清问题，追踪订单流转全链路",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(common.router)
app.include_router(store_order.router)
app.include_router(warehouse_delivery.router)
app.include_router(export_task.router)
app.include_router(responsibility.router)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/")
async def root():
    return {
        "code": 0,
        "message": "便利店连锁订货配货系统API服务正常",
        "data": {
            "version": "1.0.0",
            "docs": "/docs"
        }
    }
