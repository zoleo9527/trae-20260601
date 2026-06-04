from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    AbnormalIndicator, FollowUpRecommendation, CheckupRecord,
    CheckupItem, Patient
)
from app.schemas import (
    AbnormalIndicatorCreate, AbnormalIndicatorOut,
    AbnormalIndicatorWithRecommendations,
    FollowUpRecommendationCreate, FollowUpRecommendationOut,
    FollowUpRecommendationUpdate,
    IndicatorRecommendationMatchOut
)

router = APIRouter(prefix="/api/doctor", tags=["科室医生"])


@router.get("/abnormal-indicators", response_model=List[AbnormalIndicatorWithRecommendations], summary="获取异常指标列表（含建议情况）")
def get_abnormal_indicators(
    record_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AbnormalIndicator)
    if record_id:
        query = query.filter(AbnormalIndicator.record_id == record_id)
    if severity:
        query = query.filter(AbnormalIndicator.severity == severity)

    indicators = query.order_by(AbnormalIndicator.discovered_at.desc()).all()
    results = []
    for ind in indicators:
        rec_count = db.query(FollowUpRecommendation).filter(
            FollowUpRecommendation.indicator_id == ind.id
        ).count()
        record = db.get(CheckupRecord, ind.record_id)
        patient = db.get(Patient, record.patient_id) if record else None
        item = db.get(CheckupItem, ind.item_id) if ind.item_id else None
        results.append(AbnormalIndicatorWithRecommendations(
            id=ind.id,
            item_id=ind.item_id,
            record_id=ind.record_id,
            indicator_name=ind.indicator_name,
            indicator_value=ind.indicator_value,
            reference_range=ind.reference_range,
            severity=ind.severity,
            discovered_at=ind.discovered_at,
            has_recommendation=rec_count > 0,
            recommendation_count=rec_count,
            patient_name=patient.name if patient else None,
            item_name=item.item_name if item else None
        ))
    return results


@router.post("/recommendations", response_model=FollowUpRecommendationOut, summary="为异常指标添加复查建议")
def create_recommendation(data: FollowUpRecommendationCreate, db: Session = Depends(get_db)):
    indicator = db.get(AbnormalIndicator, data.indicator_id)
    if not indicator:
        raise HTTPException(status_code=404, detail="异常指标不存在")

    recommendation = FollowUpRecommendation(
        indicator_id=data.indicator_id,
        record_id=data.record_id,
        recommendation=data.recommendation,
        follow_up_type=data.follow_up_type,
        deadline=data.deadline,
        created_by=data.created_by,
        created_at=datetime.now(),
        is_completed=0
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return recommendation


@router.put("/recommendations/{rec_id}", response_model=FollowUpRecommendationOut, summary="修改复查建议")
def update_recommendation(rec_id: int, data: FollowUpRecommendationUpdate, db: Session = Depends(get_db)):
    rec = db.get(FollowUpRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="复查建议不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rec, key, value)
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/indicator-recommendation-match", response_model=List[IndicatorRecommendationMatchOut], summary="校验异常指标与复查建议是否匹配")
def check_indicator_recommendation_match(
    record_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AbnormalIndicator)
    if record_id:
        query = query.filter(AbnormalIndicator.record_id == record_id)

    indicators = query.all()
    results = []
    for ind in indicators:
        recs = db.query(FollowUpRecommendation).filter(
            FollowUpRecommendation.indicator_id == ind.id
        ).all()
        has_rec = len(recs) > 0
        all_completed = all(r.is_completed == 1 for r in recs) if recs else False

        if not has_rec:
            match_status = "missing"
        elif all_completed:
            match_status = "completed"
        else:
            match_status = "pending"

        results.append(IndicatorRecommendationMatchOut(
            indicator_id=ind.id,
            indicator_name=ind.indicator_name,
            severity=ind.severity,
            has_recommendation=has_rec,
            recommendation_count=len(recs),
            is_completed=all_completed,
            match_status=match_status
        ))
    return results


@router.get("/recommendations", response_model=List[FollowUpRecommendationOut], summary="获取复查建议列表")
def get_recommendations(
    indicator_id: Optional[int] = Query(None),
    record_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(FollowUpRecommendation)
    if indicator_id:
        query = query.filter(FollowUpRecommendation.indicator_id == indicator_id)
    if record_id:
        query = query.filter(FollowUpRecommendation.record_id == record_id)
    return query.order_by(FollowUpRecommendation.created_at.desc()).all()
