from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, Base
from seed import seed_data
from routers import containers, gate_release, fleet_appointment, exceptions


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title="港口堆场闸口放行与车队预约系统", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(containers.router)
app.include_router(gate_release.router)
app.include_router(fleet_appointment.router)
app.include_router(exceptions.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
