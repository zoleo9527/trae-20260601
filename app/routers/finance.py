from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db
from app.models import RentalStatus

router = APIRouter(prefix="/finance", tags=["财务管理"])

def _make_user_brief(user):
    if user is None:
        return None
    return schemas.UserBrief(id=user.id, username=user.username, name=user.name, role=user.role)

@router.get("/deposit-review", response_model=List[schemas.DepositReviewItem], summary="押金冻结回看列表")
def get_deposit_review_list(db: Session = Depends(get_db)):
    rentals = crud.get_deposit_review_list(db)
    result = []
    for rental in rentals:
        item = schemas.DepositReviewItem(
            rental_record_id=rental.id,
            customer_name=rental.customer_name,
            customer_phone=rental.customer_phone,
            equipment_name=rental.equipment.name if rental.equipment else "未知",
            deposit_amount=rental.deposit_amount,
            deposit_frozen_at=rental.deposit_frozen_at,
            deposit_freezer=_make_user_brief(rental.deposit_freezer),
            deposit_refunded_at=rental.deposit_refunded_at,
            deposit_refunder=_make_user_brief(rental.deposit_refunder),
            deposit_refund_reason=rental.deposit_refund_reason,
            confirmed_by=rental.confirmed_by,
            confirmer=_make_user_brief(rental.confirmer),
            returned_by=rental.returned_by,
            returner=_make_user_brief(rental.returner),
            return_remark=rental.return_remark,
            supplement_note=rental.supplement_note,
            created_at=rental.created_at,
            status=rental.status
        )
        result.append(item)
    return result

@router.get("/valid-transitions", summary="查询合法状态流转规则")
def get_valid_transitions():
    from app.crud import VALID_TRANSITIONS
    result = {}
    for from_status, transitions in VALID_TRANSITIONS.items():
        result[from_status.value] = {
            to_status.value: [r.value for r in roles]
            for to_status, roles in transitions.items()
        }
    return result
