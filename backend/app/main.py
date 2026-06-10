from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, Integer

from .database import engine, get_db, Base
from . import models, schemas
from .models import (
    VehicleStatus, RepairStatus, BatchStatus,
    DeploymentStatus, FeedbackType
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="共享单车运维系统 API",
    description="维修入库与出库投放后端服务",
    version="1.0.0"
)


def generate_code(prefix: str, pk: int) -> str:
    return f"{prefix}{datetime.utcnow().strftime('%Y%m%d')}{pk:06d}"


@app.post("/regions/", response_model=schemas.Region, tags=["基础数据"])
def create_region(region: schemas.RegionCreate, db: Session = Depends(get_db)):
    db_region = db.query(models.Region).filter(models.Region.code == region.code).first()
    if db_region:
        raise HTTPException(status_code=400, detail="区域编码已存在")
    db_region = models.Region(**region.model_dump())
    db.add(db_region)
    db.commit()
    db.refresh(db_region)
    return db_region


@app.get("/regions/", response_model=List[schemas.Region], tags=["基础数据"])
def list_regions(db: Session = Depends(get_db)):
    return db.query(models.Region).all()


@app.post("/vehicles/", response_model=schemas.Vehicle, tags=["基础数据"])
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.bike_code == vehicle.bike_code).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="车辆编号已存在")
    db_vehicle = models.Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@app.get("/vehicles/", response_model=List[schemas.Vehicle], tags=["基础数据"])
def list_vehicles(
    status: Optional[VehicleStatus] = None,
    region_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Vehicle)
    if status:
        query = query.filter(models.Vehicle.status == status)
    if region_id:
        query = query.filter(models.Vehicle.current_region_id == region_id)
    return query.all()


@app.post("/faults/", response_model=schemas.Fault, tags=["故障管理"])
def create_fault(fault: schemas.FaultCreate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == fault.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆不存在")
    db_fault = models.Fault(**fault.model_dump())
    db.add(db_fault)
    vehicle.status = VehicleStatus.BROKEN
    db.commit()
    db.refresh(db_fault)
    return db_fault


@app.post("/inbound/batches/", response_model=schemas.InboundBatch, tags=["入库管理"])
def create_inbound_batch(batch: schemas.InboundBatchCreate, db: Session = Depends(get_db)):
    region = db.query(models.Region).filter(models.Region.id == batch.source_region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="来源区域不存在")

    db_batch = models.InboundBatch(
        batch_code="TMP",
        source_region_id=batch.source_region_id,
        repair_station=batch.repair_station,
        operator=batch.operator,
        remark=batch.remark,
        status=BatchStatus.CREATED
    )
    db.add(db_batch)
    db.flush()

    db_batch.batch_code = generate_code("IB", db_batch.id)
    inbound_items = []

    for item in batch.items:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == item.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"车辆 {item.vehicle_id} 不存在")
        if vehicle.status not in (VehicleStatus.BROKEN, VehicleStatus.IN_SERVICE):
            raise HTTPException(
                status_code=400,
                detail=f"车辆 {vehicle.bike_code} 当前状态为 {vehicle.status.value}，无法入库"
            )

        fault_id = item.fault_id
        if fault_id:
            fault = db.query(models.Fault).filter(models.Fault.id == fault_id).first()
            if not fault:
                raise HTTPException(status_code=404, detail=f"故障 {fault_id} 不存在")
            if fault.vehicle_id != item.vehicle_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"故障 {fault_id} 不属于车辆 {vehicle.bike_code}"
                )
        elif item.fault_type:
            db_fault = models.Fault(
                vehicle_id=item.vehicle_id,
                fault_type=item.fault_type,
                description=item.fault_description,
                region_id=batch.source_region_id
            )
            db.add(db_fault)
            db.flush()
            fault_id = db_fault.id
        else:
            raise HTTPException(
                status_code=400,
                detail=f"车辆 {vehicle.bike_code} 入库必须提供故障信息（fault_id 或 fault_type）"
            )

        db_item = models.InboundItem(
            batch_id=db_batch.id,
            vehicle_id=item.vehicle_id,
            fault_id=fault_id,
            initial_status=VehicleStatus.BROKEN
        )
        db.add(db_item)
        db.flush()
        inbound_items.append(db_item)
        vehicle.status = VehicleStatus.IN_REPAIR
        vehicle.current_region_id = None

        db_repair = models.RepairOrder(
            order_code="TMP",
            vehicle_id=item.vehicle_id,
            fault_id=fault_id,
            inbound_item_id=db_item.id,
            repair_station=batch.repair_station,
            status=RepairStatus.PENDING
        )
        db.add(db_repair)
        db.flush()
        db_repair.order_code = generate_code("RO", db_repair.id)
    db_batch.status = BatchStatus.COMPLETED
    db.commit()
    db.refresh(db_batch)
    return db_batch


@app.get("/inbound/batches/", response_model=List[schemas.InboundBatch], tags=["入库管理"])
def list_inbound_batches(
    repair_station: Optional[str] = None,
    source_region_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.InboundBatch).options(
        joinedload(models.InboundBatch.items).joinedload(models.InboundItem.vehicle),
        joinedload(models.InboundBatch.items).joinedload(models.InboundItem.repair_order)
    )
    if repair_station:
        query = query.filter(models.InboundBatch.repair_station == repair_station)
    if source_region_id:
        query = query.filter(models.InboundBatch.source_region_id == source_region_id)
    return query.order_by(models.InboundBatch.inbound_at.desc()).all()


@app.post("/repair/orders/{order_id}/reject", response_model=schemas.RepairOrder, tags=["维修管理"])
def reject_repair_order(order_id: int, data: schemas.RepairReject, db: Session = Depends(get_db)):
    order = db.query(models.RepairOrder).filter(models.RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="维修单不存在")
    if order.status == RepairStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="已完成的维修单不能退回")
    if order.status == RepairStatus.REJECTED:
        raise HTTPException(status_code=400, detail="维修单已退回")

    order.status = RepairStatus.REJECTED
    order.reject_reason = data.reject_reason
    if data.mechanic:
        order.mechanic = data.mechanic
    order.parts_available = False

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == order.vehicle_id).first()
    if vehicle:
        vehicle.status = VehicleStatus.IN_REPAIR

    db.commit()
    db.refresh(order)
    return order


@app.post("/repair/orders/{order_id}/complete", response_model=schemas.RepairOrder, tags=["维修管理"])
def complete_repair_order(order_id: int, data: schemas.RepairComplete, db: Session = Depends(get_db)):
    order = db.query(models.RepairOrder).filter(models.RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="维修单不存在")
    if order.status == RepairStatus.REJECTED:
        raise HTTPException(status_code=400, detail="已退回的维修单不能完成，请新建维修单")
    if order.status == RepairStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="维修单已完成")
    if not order.parts_available:
        raise HTTPException(status_code=400, detail="配件缺货，无法完成维修，请先处理配件问题")

    order.status = RepairStatus.COMPLETED
    order.complete_time = datetime.utcnow()
    if data.repair_note:
        order.repair_note = data.repair_note
    if data.mechanic:
        order.mechanic = data.mechanic
    if not order.start_time:
        order.start_time = datetime.utcnow()

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == order.vehicle_id).first()
    if vehicle:
        vehicle.status = VehicleStatus.REPAIRED

    unresolved_feedbacks = db.query(models.RegionFeedback).join(
        models.DeploymentRecord, models.RegionFeedback.deployment_id == models.DeploymentRecord.id
    ).filter(
        models.DeploymentRecord.vehicle_id == order.vehicle_id,
        models.RegionFeedback.feedback_type == FeedbackType.ISSUE,
        models.RegionFeedback.resolved == False
    ).all()
    for fb in unresolved_feedbacks:
        fb.resolved = True
        fb.resolved_at = datetime.utcnow()
        fb.resolved_by = f"system:repair_order_{order.id}"

    db.commit()
    db.refresh(order)
    return order


@app.get("/repair/orders/", response_model=List[schemas.RepairOrder], tags=["维修管理"])
def list_repair_orders(
    status: Optional[RepairStatus] = None,
    repair_station: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    latest_only: bool = Query(False, description="按车辆只返回最新一条维修单"),
    db: Session = Depends(get_db)
):
    query = db.query(models.RepairOrder).options(
        joinedload(models.RepairOrder.vehicle)
    )
    if status:
        query = query.filter(models.RepairOrder.status == status)
    if repair_station:
        query = query.filter(models.RepairOrder.repair_station == repair_station)
    if vehicle_id:
        query = query.filter(models.RepairOrder.vehicle_id == vehicle_id)
    query = query.order_by(models.RepairOrder.created_at.desc())

    orders = query.all()
    if latest_only:
        seen = {}
        result = []
        for o in orders:
            if o.vehicle_id not in seen:
                seen[o.vehicle_id] = True
                result.append(o)
        return result
    return orders


@app.get("/repair/stations/summary", response_model=List[schemas.RepairStationSummary], tags=["维修管理"])
def get_repair_station_summary(db: Session = Depends(get_db)):
    rows = db.query(
        models.RepairOrder.repair_station,
        func.sum(func.cast(models.RepairOrder.status == RepairStatus.PENDING, Integer)).label("pending_count"),
        func.sum(func.cast(models.RepairOrder.status == RepairStatus.IN_PROGRESS, Integer)).label("in_progress_count"),
        func.sum(func.cast(models.RepairOrder.status == RepairStatus.COMPLETED, Integer)).label("completed_count"),
        func.sum(func.cast(models.RepairOrder.status == RepairStatus.REJECTED, Integer)).label("rejected_count"),
    ).group_by(models.RepairOrder.repair_station).all()

    return [
        schemas.RepairStationSummary(
            repair_station=r.repair_station,
            pending_count=r.pending_count or 0,
            in_progress_count=r.in_progress_count or 0,
            completed_count=r.completed_count or 0,
            rejected_count=r.rejected_count or 0
        )
        for r in rows
    ]


@app.post("/deployments/batch/", response_model=List[schemas.DeploymentRecord], tags=["投放管理"])
def create_deployment_batch(data: schemas.DeploymentBatchCreate, db: Session = Depends(get_db)):
    region = db.query(models.Region).filter(models.Region.id == data.target_region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="目标区域不存在")

    batch_code = data.batch_code or generate_code("DP", int(datetime.utcnow().timestamp()))
    deployments = []

    for item in data.items:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == item.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"车辆 {item.vehicle_id} 不存在")

        has_issue_feedback = db.query(models.RegionFeedback).join(
            models.DeploymentRecord, models.RegionFeedback.deployment_id == models.DeploymentRecord.id
        ).filter(
            models.DeploymentRecord.vehicle_id == item.vehicle_id,
            models.RegionFeedback.feedback_type == FeedbackType.ISSUE,
            models.RegionFeedback.resolved == False
        ).first()
        if has_issue_feedback:
            raise HTTPException(
                status_code=400,
                detail=f"车辆 {vehicle.bike_code} 存在未解决的异常反馈，需完成返修后才能重新投放"
            )

        if item.repair_order_id:
            repair_order = db.query(models.RepairOrder).filter(
                models.RepairOrder.id == item.repair_order_id
            ).first()
            if not repair_order:
                raise HTTPException(status_code=404, detail=f"维修单 {item.repair_order_id} 不存在")
            if repair_order.vehicle_id != item.vehicle_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"维修单 {repair_order.order_code} 归属车辆为 {repair_order.vehicle_id}，与投放车辆 {item.vehicle_id} 不一致"
                )
            if repair_order.status != RepairStatus.COMPLETED:
                raise HTTPException(
                    status_code=400,
                    detail=f"维修单 {repair_order.order_code} 状态为 {repair_order.status.value}，未完成维修不能投放"
                )
            if not repair_order.parts_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"维修单 {repair_order.order_code} 配件缺货，不能假装正常投放"
                )
        else:
            if vehicle.status not in (VehicleStatus.REPAIRED, VehicleStatus.IN_SERVICE):
                raise HTTPException(
                    status_code=400,
                    detail=f"车辆 {vehicle.bike_code} 状态为 {vehicle.status.value}，不能投放"
                )

        db_deployment = models.DeploymentRecord(
            deployment_code="TMP",
            batch_code=batch_code,
            vehicle_id=item.vehicle_id,
            target_region_id=data.target_region_id,
            repair_order_id=item.repair_order_id,
            operator=data.operator,
            status=DeploymentStatus.PENDING_REVIEW
        )
        db.add(db_deployment)
        db.flush()
        db_deployment.deployment_code = generate_code("DV", db_deployment.id)
        deployments.append(db_deployment)

        vehicle.status = VehicleStatus.DEPLOYED
        vehicle.current_region_id = data.target_region_id

    db.commit()
    for d in deployments:
        db.refresh(d)
    return deployments


@app.get("/deployments/", response_model=List[schemas.DeploymentRecord], tags=["投放管理"])
def list_deployments(
    status: Optional[DeploymentStatus] = None,
    target_region_id: Optional[int] = None,
    batch_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.DeploymentRecord).options(
        joinedload(models.DeploymentRecord.vehicle),
        joinedload(models.DeploymentRecord.repair_order)
    )
    if status:
        query = query.filter(models.DeploymentRecord.status == status)
    if target_region_id:
        query = query.filter(models.DeploymentRecord.target_region_id == target_region_id)
    if batch_code:
        query = query.filter(models.DeploymentRecord.batch_code == batch_code)
    return query.order_by(models.DeploymentRecord.deployed_at.desc()).all()


@app.post("/deployments/{deployment_id}/review", response_model=schemas.DeploymentRecord, tags=["投放管理"])
def review_deployment(deployment_id: int, data: schemas.DeploymentReview, db: Session = Depends(get_db)):
    deployment = db.query(models.DeploymentRecord).filter(
        models.DeploymentRecord.id == deployment_id
    ).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="投放记录不存在")
    if deployment.status != DeploymentStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail="该投放记录已复核")

    deployment.status = data.status
    deployment.review_note = data.review_note
    deployment.reviewer = data.reviewer
    deployment.reviewed_at = datetime.utcnow()

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == deployment.vehicle_id).first()
    if vehicle:
        if data.status == DeploymentStatus.CONFIRMED:
            vehicle.status = VehicleStatus.IN_SERVICE
        elif data.status == DeploymentStatus.ISSUE_FOUND:
            vehicle.status = VehicleStatus.IN_REPAIR
            if deployment.repair_order_id:
                order = db.query(models.RepairOrder).filter(
                    models.RepairOrder.id == deployment.repair_order_id
                ).first()
                if order:
                    order.status = RepairStatus.PENDING
                    order.parts_available = True
                    order.reject_reason = None
                    order.complete_time = None
                    order.repair_note = None

    db.commit()
    db.refresh(deployment)
    return deployment


@app.post("/feedback/", response_model=schemas.RegionFeedback, tags=["区域反馈"])
def create_feedback(feedback: schemas.RegionFeedbackCreate, db: Session = Depends(get_db)):
    region = db.query(models.Region).filter(models.Region.id == feedback.region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="区域不存在")
    deployment = db.query(models.DeploymentRecord).filter(
        models.DeploymentRecord.id == feedback.deployment_id
    ).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="投放记录不存在")
    if deployment.target_region_id != feedback.region_id:
        raise HTTPException(
            status_code=400,
            detail=f"投放记录目标区域为 {deployment.target_region_id}，与反馈区域 {feedback.region_id} 不一致"
        )

    db_feedback = models.RegionFeedback(**feedback.model_dump())
    db.add(db_feedback)

    if feedback.feedback_type == FeedbackType.ISSUE:
        vehicle = db.query(models.Vehicle).filter(
            models.Vehicle.id == deployment.vehicle_id
        ).first()
        if vehicle:
            vehicle.status = VehicleStatus.IN_REPAIR
        if deployment.repair_order_id:
            order = db.query(models.RepairOrder).filter(
                models.RepairOrder.id == deployment.repair_order_id
            ).first()
            if order:
                order.status = RepairStatus.PENDING
                order.parts_available = True
                order.reject_reason = None
                order.complete_time = None
                order.repair_note = None

    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@app.get("/feedback/", response_model=List[schemas.RegionFeedback], tags=["区域反馈"])
def list_feedback(
    region_id: Optional[int] = None,
    deployment_id: Optional[int] = None,
    feedback_type: Optional[FeedbackType] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.RegionFeedback)
    if region_id:
        query = query.filter(models.RegionFeedback.region_id == region_id)
    if deployment_id:
        query = query.filter(models.RegionFeedback.deployment_id == deployment_id)
    if feedback_type:
        query = query.filter(models.RegionFeedback.feedback_type == feedback_type)
    if resolved is not None:
        query = query.filter(models.RegionFeedback.resolved == resolved)
    return query.order_by(models.RegionFeedback.reported_at.desc()).all()


@app.post("/feedback/{feedback_id}/resolve", response_model=schemas.RegionFeedback, tags=["区域反馈"])
def resolve_feedback(feedback_id: int, data: schemas.FeedbackResolve, db: Session = Depends(get_db)):
    feedback = db.query(models.RegionFeedback).filter(models.RegionFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="反馈记录不存在")
    if feedback.resolved:
        raise HTTPException(status_code=400, detail="该反馈已关闭")
    if feedback.feedback_type != FeedbackType.ISSUE:
        raise HTTPException(status_code=400, detail="只有异常反馈需要关闭处理")

    feedback.resolved = True
    feedback.resolved_at = datetime.utcnow()
    feedback.resolved_by = data.resolved_by

    db.commit()
    db.refresh(feedback)
    return feedback


@app.get("/regions/summary", response_model=List[schemas.RegionSummary], tags=["运维调度"])
def get_region_summary(db: Session = Depends(get_db)):
    regions = db.query(models.Region).all()
    result = []
    for region in regions:
        available_count = db.query(models.Vehicle).filter(
            models.Vehicle.current_region_id == region.id,
            models.Vehicle.status == VehicleStatus.IN_SERVICE
        ).count()
        shortage = max(0, region.target_capacity - available_count)
        result.append(schemas.RegionSummary(
            id=region.id,
            code=region.code,
            name=region.name,
            target_capacity=region.target_capacity,
            available_count=available_count,
            shortage=shortage
        ))
    return result
