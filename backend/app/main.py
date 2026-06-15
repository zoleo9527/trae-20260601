from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.models import *
from app.routes import router
from app.data.mock_data import init_mock_data

app = FastAPI(title="卫浴安装管理系统", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

init_mock_data()

@app.get("/")
async def root():
    return {"message": "卫浴安装管理系统 API"}