import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import (
    auth_router, batches_router, grading_router,
    inventory_router, reservations_router, complaints_router,
    picking_loss_router, logs_router, system_router,
)
from .routers.system import _seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from .models import FruitBatch
        count = db.query(FruitBatch).count()
        if count == 0:
            _seed_data(db)
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(title="观光果园-果品分级与库存管理系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(batches_router)
app.include_router(grading_router)
app.include_router(inventory_router)
app.include_router(reservations_router)
app.include_router(complaints_router)
app.include_router(picking_loss_router)
app.include_router(logs_router)
app.include_router(system_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "orchard-management"}
