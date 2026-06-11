from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, tenants
from .routers import licenses, activities, complaints, history
from .seed_data import init_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="商场运营管理系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(licenses.router)
app.include_router(activities.router)
app.include_router(complaints.router)
app.include_router(history.router)


@app.on_event("startup")
def startup():
    init_db()
