from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/finance", tags=["财务管理"])

@router.get("/deposit-review", response_model=List[schemas.DepositReviewItem], summary="押金冻结回看列表")
def get_deposit_review_list(db: Session = Depends(get_db)):
    rentals = crud.get_deposit_review_list(db)
    result = []
    for rental in rentals:
        item = schemas.DepositReviewItem(
            rental_record_id=rental.id,
            customer_name=rental.customer_name,
            equipment_name=rental.equipment.name if rental.equipment else "未知",
            deposit_amount=rental.deposit_amount,
            created_at=rental.created_at,
            status=rental.status
        )
        result.append(item)
    return result
