from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.api.user import router as user_router
from backend.api.activity import router as activity_router
from backend.api.application import router as application_router
from backend.api.post import router as post_router
from backend.api.exception import router as exception_router
from backend.api.attachment import router as attachment_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="社区志愿服务站管理系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(activity_router)
app.include_router(application_router)
app.include_router(post_router)
app.include_router(exception_router)
app.include_router(attachment_router)

@app.get("/")
def read_root():
    return {"message": "社区志愿服务站管理系统 API"}