from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    Report, CheckupRecord, CheckupItem, AbnormalIndicator,
    FollowUpRecommendation, Patient
)
from app.schemas import (
    ReportCreate, ReportOut, ReportReviewAction,
    ReportReleaseAction, ReportDetailOut,
    AbnormalIndicatorOut, FollowUpRecommendationOut
)

router = APIRouter(prefix="/api/reviewer", tags=["报告审核员"])


def validate_report_ready(db: Session, record_id: int):
    record = db.get(CheckupRecord, record_id)

    items = db.query(CheckupItem).filter(CheckupItem.record_id == record_id).all()
    incomplete_items = [item for item in items if item.status != "completed"]
    if incomplete_items:
        item_names = [f"{item.item_name}({item.status})" for item in incomplete_items]
        raise HTTPException(
            status_code=400,
            detail=f"存在未完成的体检项目: {', '.join(item_names)}。请先完成所有项目后再审核。"
        )

    indicators = db.query(AbnormalIndicator).filter(
        AbnormalIndicator.record_id == record_id
    ).all()

    indicators_without_recommendation = []
    for ind in indicators:
        rec_count = db.query(FollowUpRecommendation).filter(
            FollowUpRecommendation.indicator_id == ind.id
        ).count()
        if rec_count == 0:
            indicators_without_recommendation.append(f"{ind.indicator_name}({ind.severity})")

    if indicators_without_recommendation:
        raise HTTPException(
            status_code=400,
            detail=f"存在异常指标缺少复查建议: {', '.join(indicators_without_recommendation)}。请联系医生补充建议后再审核。"
        )

    return True


@router.get("/pending-reports", response_model=List[ReportOut], summary="获取待审核报告列表")
def get_pending_reports(db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.status.in_(["draft", "pending_review"])).all()


@router.get("/approved-reports", response_model=List[ReportOut], summary="获取已审核待发放报告列表")
def get_approved_reports(db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.status == "approved").all()


@router.post("/reports", response_model=ReportOut, summary="创建报告（体检完成后生成）")
def create_report(data: ReportCreate, db: Session = Depends(get_db)):
    record = db.get(CheckupRecord, data.record_id)
    if not record:
        raise HTTPException(status_code=404, detail="体检记录不存在")

    existing = db.query(Report).filter(Report.record_id == data.record_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="该体检记录已有报告")

    report = Report(record_id=data.record_id, status="draft")
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.put("/review-report/{report_id}", response_model=ReportOut, summary="审核报告（通过或驳回）")
def review_report(report_id: int, data: ReportReviewAction, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")

    if data.action == "approve":
        validate_report_ready(db, report.record_id)
        report.status = "approved"
    elif data.action == "reject":
        report.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="action 必须是 approve 或 reject")

    report.reviewed_by = data.reviewer_id
    report.reviewed_at = datetime.now()
    report.review_comment = data.comment
    db.commit()
    db.refresh(report)
    return report


@router.put("/release-report/{report_id}", response_model=ReportOut, summary="发放报告")
def release_report(report_id: int, data: ReportReleaseAction, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")

    if report.status != "approved":
        raise HTTPException(status_code=400, detail=f"报告当前状态为'{report.status}'，只有'approved'状态才能发放")

    validate_report_ready(db, report.record_id)

    report.status = "released"
    report.released_by = data.releaser_id
    report.released_at = datetime.now()
    db.commit()
    db.refresh(report)
    return report


@router.get("/report-detail/{report_id}", response_model=ReportDetailOut, summary="查看报告完整详情（含校验信息）")
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")

    record = db.get(CheckupRecord, report.record_id)
    patient = db.get(Patient, record.patient_id)

    items = db.query(CheckupItem).filter(CheckupItem.record_id == record.id).all()
    all_items_completed = all(item.status in ("completed",) for item in items)

    indicators = db.query(AbnormalIndicator).filter(
        AbnormalIndicator.record_id == record.id
    ).all()

    all_recommendations = []
    for ind in indicators:
        recs = db.query(FollowUpRecommendation).filter(
            FollowUpRecommendation.indicator_id == ind.id
        ).all()
        all_recommendations.extend(recs)

    all_indicators_have_recommendations = all(
        db.query(FollowUpRecommendation).filter(
            FollowUpRecommendation.indicator_id == ind.id
        ).count() > 0
        for ind in indicators
    ) if indicators else True

    return ReportDetailOut(
        report=ReportOut.model_validate(report),
        patient_name=patient.name,
        checkup_date=record.checkup_date,
        record_status=record.status,
        abnormal_indicators=[AbnormalIndicatorOut.model_validate(ind) for ind in indicators],
        recommendations=[FollowUpRecommendationOut.model_validate(rec) for rec in all_recommendations],
        all_items_completed=all_items_completed,
        all_indicators_have_recommendations=all_indicators_have_recommendations
    )


@router.get("/all-reports", response_model=List[ReportOut], summary="获取所有报告列表")
def get_all_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.id.desc()).all()
