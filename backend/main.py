from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
import services
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="百货专柜商品调拨与到柜复核系统",
    description="解决柜长/楼层主管/品牌督导之间商品调拨责任不清的核心链路",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/users", response_model=List[schemas.UserResponse], tags=["用户"])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@app.post("/api/allocations", response_model=schemas.ApiResponse, tags=["商品调拨"])
def create_allocation(
    allocation: schemas.GoodsAllocationCreate,
    creator_id: int = Query(..., description="创建人用户ID"),
    db: Session = Depends(get_db),
):
    creator = services.get_user(db, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="创建人不存在")

    result, created = services.create_allocation(db, allocation, creator_id)
    data = schemas.GoodsAllocationResponse.model_validate(result).model_dump()
    data["creator_name"] = creator.name
    return schemas.ApiResponse(
        code=0,
        message="调拨单创建成功" if created else "幂等命中，返回已存在的调拨单",
        data=data,
    )


@app.put("/api/allocations/{allocation_id}", response_model=schemas.ApiResponse, tags=["商品调拨"])
def update_allocation(
    allocation_id: int,
    update_data: schemas.GoodsAllocationUpdate,
    operator_id: int = Query(..., description="操作人用户ID"),
    db: Session = Depends(get_db),
):
    operator = services.get_user(db, operator_id)
    if not operator:
        raise HTTPException(status_code=404, detail="操作人不存在")

    result, err = services.update_allocation(db, allocation_id, update_data, operator_id)
    if err:
        raise HTTPException(status_code=400, detail=err)

    data = schemas.GoodsAllocationResponse.model_validate(result).model_dump()
    data["updater_name"] = operator.name
    return schemas.ApiResponse(code=0, message="调拨单修改成功，已通知复核端感知变更", data=data)


@app.post("/api/allocations/{allocation_id}/approve", response_model=schemas.ApiResponse, tags=["商品调拨"])
def approve_allocation(
    allocation_id: int,
    approver_id: int = Query(..., description="审批人用户ID"),
    db: Session = Depends(get_db),
):
    approver = services.get_user(db, approver_id)
    if not approver:
        raise HTTPException(status_code=404, detail="审批人不存在")

    result, err = services.approve_allocation(db, allocation_id, approver_id, approver.role)
    if err:
        raise HTTPException(status_code=400, detail=err)

    data = schemas.GoodsAllocationResponse.model_validate(result).model_dump()
    return schemas.ApiResponse(code=0, message=f"{approver.name}审批通过", data=data)


@app.get("/api/allocations/{allocation_id}", response_model=schemas.ApiResponse, tags=["商品调拨"])
def get_allocation(allocation_id: int, db: Session = Depends(get_db)):
    result = services.get_allocation(db, allocation_id)
    if not result:
        raise HTTPException(status_code=404, detail="调拨单不存在")

    data = schemas.GoodsAllocationResponse.model_validate(result).model_dump()
    if result.creator:
        data["creator_name"] = result.creator.name
    if result.updater:
        data["updater_name"] = result.updater.name
    for i, log in enumerate(result.change_logs):
        if log.operator:
            data["change_logs"][i]["operator_name"] = log.operator.name
    for i, rev in enumerate(result.reviews):
        if rev.reviewer:
            data["reviews"][i]["reviewer_name"] = rev.reviewer.name
    for i, vf in enumerate(result.verifications):
        if vf.verifier:
            data["verifications"][i]["verifier_name"] = vf.verifier.name

    return schemas.ApiResponse(code=0, data=data)


@app.get("/api/allocations", response_model=schemas.ApiResponse, tags=["商品调拨"])
def list_allocations(
    status: Optional[str] = None,
    brand: Optional[str] = None,
    floor: Optional[str] = None,
    is_modified: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    results = services.list_allocations(db, status, brand, floor, is_modified, skip, limit)
    items = []
    for r in results:
        d = schemas.GoodsAllocationResponse.model_validate(r).model_dump()
        if r.creator:
            d["creator_name"] = r.creator.name
        for i, vf in enumerate(r.verifications):
            if vf.verifier:
                d["verifications"][i]["verifier_name"] = vf.verifier.name
        items.append(d)
    return schemas.ApiResponse(code=0, data={"items": items, "total": len(items)})


@app.post("/api/reviews", response_model=schemas.ApiResponse, tags=["到柜复核"])
def create_review(
    review: schemas.CabinetReviewCreate,
    reviewer_id: int = Query(..., description="复核人用户ID"),
    db: Session = Depends(get_db),
):
    reviewer = services.get_user(db, reviewer_id)
    if not reviewer:
        raise HTTPException(status_code=404, detail="复核人不存在")

    result, err = services.create_review(db, review, reviewer_id)
    if err:
        raise HTTPException(status_code=400, detail=err)

    data = schemas.CabinetReviewResponse.model_validate(result).model_dump()
    data["reviewer_name"] = reviewer.name
    return schemas.ApiResponse(code=0, message="到柜复核完成", data=data)


@app.get("/api/reviews/pending", response_model=schemas.ApiResponse, tags=["到柜复核"])
def list_pending_reviews(
    counter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    results = services.list_pending_reviews(db, counter, skip, limit)
    items = []
    for r in results:
        d = schemas.GoodsAllocationResponse.model_validate(r).model_dump()
        if r.creator:
            d["creator_name"] = r.creator.name
        for i, vf in enumerate(r.verifications):
            if vf.verifier:
                d["verifications"][i]["verifier_name"] = vf.verifier.name
        items.append(d)
    return schemas.ApiResponse(code=0, data={"items": items, "total": len(items)})


@app.get("/api/reviews/timeline", response_model=schemas.ApiResponse, tags=["到柜复核"])
def get_review_timeline(
    brand: Optional[str] = None,
    floor: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    timeline = services.get_review_timeline(db, brand, floor, status, skip, limit)
    items = [t.model_dump() for t in timeline]
    return schemas.ApiResponse(code=0, data={"items": items, "total": len(items)})


@app.get("/api/reviews/{review_id}", response_model=schemas.ApiResponse, tags=["到柜复核"])
def get_review(review_id: int, db: Session = Depends(get_db)):
    result = services.get_review(db, review_id)
    if not result:
        raise HTTPException(status_code=404, detail="复核记录不存在")

    data = schemas.CabinetReviewResponse.model_validate(result).model_dump()
    if result.reviewer:
        data["reviewer_name"] = result.reviewer.name
    return schemas.ApiResponse(code=0, data=data)


@app.post("/api/dispute-verifications", response_model=schemas.ApiResponse, tags=["差异核实"])
def create_dispute_verification(
    verification: schemas.DisputeVerificationCreate,
    verifier_id: int = Query(..., description="核实人用户ID（品牌督导）"),
    db: Session = Depends(get_db),
):
    verifier = services.get_user(db, verifier_id)
    if not verifier:
        raise HTTPException(status_code=404, detail="核实人不存在")

    if verifier.role != services.ROLE_BRAND_SUPERVISOR:
        raise HTTPException(status_code=403, detail="只有品牌督导才能执行差异核实")

    result, err = services.create_dispute_verification(db, verification, verifier_id)
    if err:
        raise HTTPException(status_code=400, detail=err)

    data = schemas.DisputeVerificationResponse.model_validate(result).model_dump()
    data["verifier_name"] = verifier.name
    return schemas.ApiResponse(code=0, message="差异核实完成", data=data)


@app.get("/api/dispute-verifications/{allocation_id}", response_model=schemas.ApiResponse, tags=["差异核实"])
def get_dispute_verification(allocation_id: int, db: Session = Depends(get_db)):
    result = services.get_verification_by_allocation(db, allocation_id)
    if not result:
        raise HTTPException(status_code=404, detail="未找到核实记录")

    data = schemas.DisputeVerificationResponse.model_validate(result).model_dump()
    if result.verifier:
        data["verifier_name"] = result.verifier.name
    return schemas.ApiResponse(code=0, data=data)


@app.get("/api/health", tags=["系统"])
def health_check():
    return {"status": "ok", "service": "department-store-allocation"}
