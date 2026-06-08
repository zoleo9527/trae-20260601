from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, Base
from models import CargoOrder, LocationAllocation, PickupAppointment, StatusChangeLog
from seed import seed_database
from routers import orders, allocations, appointments, logs

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(title="民航货站-库位分配与提货预约系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(allocations.router)
app.include_router(appointments.router)
app.include_router(logs.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
