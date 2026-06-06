from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base, get_db
import models
from routers import keys, borrow, students, records, dashboard, system
from seed_data import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    if db.query(models.Student).count() == 0:
        seed_data(db)
    db.close()
    
    yield


app = FastAPI(
    title="宿舍钥匙管理系统 API",
    description="宿舍钥匙借还管理系统后端 API",
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

app.include_router(keys.router)
app.include_router(borrow.router)
app.include_router(students.router)
app.include_router(records.router)
app.include_router(dashboard.router)
app.include_router(system.router)


@app.get("/")
def root():
    return {
        "message": "宿舍钥匙管理系统 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
