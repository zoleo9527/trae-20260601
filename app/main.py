from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import SessionLocal, create_tables
from app.seed import seed_sample_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    db = SessionLocal()
    try:
        seed_sample_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="种猪场疫苗免疫与用药记录管理系统",
    description=(
        "追溯至具体栏位和猪只批次的疫苗免疫与用药记录系统。\n\n"
        "角色视角：\n"
        "- **繁育员**：查看免疫计划、执行免疫\n"
        "- **兽医**：记录用药原因、剂量和停药期\n"
        "- **场长**：关注漏打、重复用药、停药期影响\n\n"
        "业务特性：\n"
        "- 用药记录可追溯至栏位和批次\n"
        "- 停药期影响转栏、淘汰和销售判断\n"
        "- 自动检测漏打和逾期免疫计划\n"
        "- 异常提醒（漏打、补打、重复用药、停药期限制）"
    ),
    version="1.0.0",
    lifespan=lifespan,
)


from app.routes.alerts import router as alerts_router
from app.routes.batches import router as batches_router
from app.routes.dashboard import router as dashboard_router
from app.routes.immunization import router as immunization_router
from app.routes.medications import router as medications_router
from app.routes.pens import router as pens_router

app.include_router(pens_router)
app.include_router(batches_router)
app.include_router(immunization_router)
app.include_router(medications_router)
app.include_router(alerts_router)
app.include_router(dashboard_router)


@app.get("/", tags=["健康检查"])
def health_check():
    return {"status": "ok", "service": "种猪场疫苗免疫与用药记录管理系统"}
