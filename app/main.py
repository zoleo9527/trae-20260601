from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import equipment, rental, todo, finance, maintenance, users

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="摄影器材租赁管理系统",
    description="器材预约与押金冻结管理系统",
    version="1.0.0",
    tags_metadata=[
        {"name": "租赁管理", "description": "器材预约、状态变更、记录查询"},
        {"name": "器材管理", "description": "器材增删改查、状态管理"},
        {"name": "财务管理", "description": "押金冻结回看、退还管理"},
        {"name": "待办事项", "description": "各角色待办事项管理"},
        {"name": "维修记录", "description": "器材维修、损坏记录"},
        {"name": "用户管理", "description": "用户创建、角色管理"},
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rental.router)
app.include_router(equipment.router)
app.include_router(todo.router)
app.include_router(finance.router)
app.include_router(maintenance.router)
app.include_router(users.router)

@app.get("/", tags=["系统"])
def root():
    return {
        "name": "摄影器材租赁管理系统",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health", tags=["系统"])
def health_check():
    return {"status": "healthy"}
