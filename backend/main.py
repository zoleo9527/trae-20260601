from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, properties, viewings, exceptions, attachments, handover


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="写字楼租赁房源管理系统",
    description="房源空置与带看安排管理系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(viewings.router)
app.include_router(exceptions.router)
app.include_router(attachments.router)
app.include_router(handover.router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "系统运行正常"}
