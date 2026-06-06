from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, engine, Base
import models
from seed_data import seed_data

router = APIRouter(prefix="/api/system", tags=["system"])


@router.post("/reset")
def reset_system(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    seed_db = next(get_db())
    seed_data(seed_db)
    
    return {"message": "System reset successfully with sample data"}
