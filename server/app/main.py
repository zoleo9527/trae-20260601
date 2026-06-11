from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import users_router, visits_router, ownership_router, export_router
from .utils import init_db

app = FastAPI(
    title=settings.app_name,
    description=(
        "售楼处运营系统 - 来访登记与客户归属主链路。\n\n"
        "## 角色说明\n"
        "- **案场经理 (manager)**: 来访登记、分配置业顾问、裁决归属争议\n"
        "- **置业顾问 (agent)**: 客户跟进、提交跟进记录\n"
        "- **销控专员 (controller)**: 认购单录入、客户归属确认\n\n"
        "## 主链路流程\n"
        "1. 案场经理提交来访登记 → 状态：registered\n"
        "2. 案场经理分配置业顾问 → 状态：assigned\n"
        "3. 置业顾问提交跟进记录 → 状态：following\n"
        "4. 销控专员录入认购单 → 自动生成待确认归属记录，来访状态：subscribed\n"
        "5. 销控专员确认客户归属 → 归属状态：confirmed\n"
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/", tags=["系统"], summary="健康检查")
def root():
    return {"name": settings.app_name, "status": "ok", "version": "1.0.0"}


app.include_router(users_router)
app.include_router(visits_router)
app.include_router(ownership_router)
app.include_router(export_router)
