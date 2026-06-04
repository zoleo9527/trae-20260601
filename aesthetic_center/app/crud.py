from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional, Type, Any, Dict
import json

from . import models, schemas


def log_audit(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    operator_id: int,
    operator_name: str,
    field_name: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    change_reason: Optional[str] = None,
):
    audit_log = models.AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        change_reason=change_reason,
        operator_id=operator_id,
        operator_name=operator_name,
    )
    db.add(audit_log)
    db.commit()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    status: Optional[str] = None,
):
    query = db.query(models.Customer)
    if keyword:
        query = query.filter(
            or_(
                models.Customer.name.contains(keyword),
                models.Customer.phone.contains(keyword),
            )
        )
    if status:
        query = query.filter(models.Customer.status == status)
    return query.order_by(desc(models.Customer.created_at)).offset(skip).limit(limit).all()


def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def get_consultation_record(db: Session, record_id: int):
    return db.query(models.ConsultationRecord).filter(models.ConsultationRecord.id == record_id).first()


def get_consultation_records(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
):
    query = db.query(models.ConsultationRecord)
    if customer_id:
        query = query.filter(models.ConsultationRecord.customer_id == customer_id)
    if status:
        query = query.filter(models.ConsultationRecord.status == status)
    return query.order_by(desc(models.ConsultationRecord.created_at)).offset(skip).limit(limit).all()


def create_consultation_record(db: Session, record: schemas.ConsultationRecordCreate):
    db_record = models.ConsultationRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    db_version = models.ConsultationRecordVersion(
        record_id=db_record.id,
        version=1,
        chief_complaint=db_record.chief_complaint,
        recommended_projects=db_record.recommended_projects,
        promised_caliber=db_record.promised_caliber,
        change_reason="初始创建",
        created_by=record.consultant_id,
        created_by_name=record.consultant_name,
    )
    db.add(db_version)
    db.commit()

    log_audit(
        db,
        entity_type="consultation_record",
        entity_id=db_record.id,
        action="create",
        operator_id=record.consultant_id,
        operator_name=record.consultant_name,
        change_reason="创建咨询记录",
    )

    return db_record


def update_consultation_record(
    db: Session,
    record_id: int,
    update_data: schemas.ConsultationRecordUpdate,
    operator_id: int,
    operator_name: str,
):
    db_record = get_consultation_record(db, record_id)
    if not db_record:
        return None

    old_values = {
        "chief_complaint": db_record.chief_complaint,
        "recommended_projects": db_record.recommended_projects,
        "promised_caliber": db_record.promised_caliber,
        "status": db_record.status,
    }

    new_version = db_record.current_version + 1

    for key, value in update_data.dict(exclude_unset=True, exclude={"change_reason"}).items():
        if value is not None:
            old_val = old_values.get(key, "")
            if isinstance(old_val, list):
                old_val_str = json.dumps(old_val, ensure_ascii=False)
            else:
                old_val_str = str(old_val) if old_val else ""

            if isinstance(value, list):
                new_val_str = json.dumps(value, ensure_ascii=False)
            else:
                new_val_str = str(value) if value else ""

            if old_val_str != new_val_str:
                log_audit(
                    db,
                    entity_type="consultation_record",
                    entity_id=record_id,
                    action="update",
                    field_name=key,
                    old_value=old_val_str,
                    new_value=new_val_str,
                    change_reason=update_data.change_reason,
                    operator_id=operator_id,
                    operator_name=operator_name,
                )

            setattr(db_record, key, value)

    db_record.current_version = new_version
    db.commit()

    db_version = models.ConsultationRecordVersion(
        record_id=db_record.id,
        version=new_version,
        chief_complaint=db_record.chief_complaint,
        recommended_projects=db_record.recommended_projects,
        promised_caliber=db_record.promised_caliber,
        change_reason=update_data.change_reason,
        created_by=operator_id,
        created_by_name=operator_name,
    )
    db.add(db_version)
    db.commit()

    db.refresh(db_record)
    return db_record


def get_consultation_versions(db: Session, record_id: int):
    return (
        db.query(models.ConsultationRecordVersion)
        .filter(models.ConsultationRecordVersion.record_id == record_id)
        .order_by(desc(models.ConsultationRecordVersion.version))
        .all()
    )


def get_quotation_scheme(db: Session, scheme_id: int):
    return db.query(models.QuotationScheme).filter(models.QuotationScheme.id == scheme_id).first()


def get_quotation_schemes(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
):
    query = db.query(models.QuotationScheme)
    if customer_id:
        query = query.filter(models.QuotationScheme.customer_id == customer_id)
    if status:
        query = query.filter(models.QuotationScheme.status == status)
    return query.order_by(desc(models.QuotationScheme.created_at)).offset(skip).limit(limit).all()


def create_quotation_scheme(db: Session, scheme: schemas.QuotationSchemeCreate):
    db_scheme = models.QuotationScheme(**scheme.dict())
    db.add(db_scheme)
    db.commit()
    db.refresh(db_scheme)

    db_version = models.QuotationSchemeVersion(
        scheme_id=db_scheme.id,
        version=1,
        total_amount=db_scheme.total_amount,
        discount_amount=db_scheme.discount_amount,
        actual_amount=db_scheme.actual_amount,
        project_items=db_scheme.project_items,
        promised_services=db_scheme.promised_services,
        change_reason="初始创建",
        created_by=scheme.created_by,
        created_by_name=scheme.created_by_name,
    )
    db.add(db_version)
    db.commit()

    log_audit(
        db,
        entity_type="quotation_scheme",
        entity_id=db_scheme.id,
        action="create",
        operator_id=scheme.created_by,
        operator_name=scheme.created_by_name,
        change_reason="创建报价方案",
    )

    return db_scheme


def update_quotation_scheme(
    db: Session,
    scheme_id: int,
    update_data: schemas.QuotationSchemeUpdate,
    operator_id: int,
    operator_name: str,
):
    db_scheme = get_quotation_scheme(db, scheme_id)
    if not db_scheme:
        return None

    new_version = db_scheme.current_version + 1

    for key, value in update_data.dict(exclude_unset=True, exclude={"change_reason"}).items():
        if value is not None:
            old_val = getattr(db_scheme, key, "")
            if isinstance(old_val, list):
                old_val_str = json.dumps(old_val, ensure_ascii=False)
            else:
                old_val_str = str(old_val) if old_val else ""

            if isinstance(value, list):
                new_val_str = json.dumps(value, ensure_ascii=False)
            else:
                new_val_str = str(value) if value else ""

            if old_val_str != new_val_str:
                log_audit(
                    db,
                    entity_type="quotation_scheme",
                    entity_id=scheme_id,
                    action="update",
                    field_name=key,
                    old_value=old_val_str,
                    new_value=new_val_str,
                    change_reason=update_data.change_reason,
                    operator_id=operator_id,
                    operator_name=operator_name,
                )

            setattr(db_scheme, key, value)

    db_scheme.current_version = new_version
    db.commit()

    db_version = models.QuotationSchemeVersion(
        scheme_id=db_scheme.id,
        version=new_version,
        total_amount=db_scheme.total_amount,
        discount_amount=db_scheme.discount_amount,
        actual_amount=db_scheme.actual_amount,
        project_items=db_scheme.project_items,
        promised_services=db_scheme.promised_services,
        change_reason=update_data.change_reason,
        created_by=operator_id,
        created_by_name=operator_name,
    )
    db.add(db_version)
    db.commit()

    db.refresh(db_scheme)
    return db_scheme


def get_quotation_versions(db: Session, scheme_id: int):
    return (
        db.query(models.QuotationSchemeVersion)
        .filter(models.QuotationSchemeVersion.scheme_id == scheme_id)
        .order_by(desc(models.QuotationSchemeVersion.version))
        .all()
    )


def get_follow_up(db: Session, follow_up_id: int):
    return db.query(models.PostOperativeFollowUp).filter(models.PostOperativeFollowUp.id == follow_up_id).first()


def get_follow_ups(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    has_discomfort: Optional[bool] = None,
):
    query = db.query(models.PostOperativeFollowUp)
    if customer_id:
        query = query.filter(models.PostOperativeFollowUp.customer_id == customer_id)
    if status:
        query = query.filter(models.PostOperativeFollowUp.status == status)
    if stage:
        query = query.filter(models.PostOperativeFollowUp.follow_up_stage == stage)
    if has_discomfort is not None:
        query = query.filter(models.PostOperativeFollowUp.has_discomfort == has_discomfort)
    return query.order_by(desc(models.PostOperativeFollowUp.follow_up_date)).offset(skip).limit(limit).all()


def create_follow_up(db: Session, follow_up: schemas.PostOperativeFollowUpCreate):
    db_follow_up = models.PostOperativeFollowUp(**follow_up.dict())
    db.add(db_follow_up)
    db.commit()
    db.refresh(db_follow_up)

    db_version = models.FollowUpVersion(
        follow_up_id=db_follow_up.id,
        version=1,
        recovery_status=db_follow_up.recovery_status,
        customer_feedback=db_follow_up.customer_feedback,
        abnormal_symptoms=db_follow_up.abnormal_symptoms,
        handling_advice=db_follow_up.handling_advice,
        status=db_follow_up.status,
        change_reason="初始创建",
        created_by=follow_up.follow_up_person_id,
        created_by_name=follow_up.follow_up_person_name,
    )
    db.add(db_version)
    db.commit()

    log_audit(
        db,
        entity_type="follow_up",
        entity_id=db_follow_up.id,
        action="create",
        operator_id=follow_up.follow_up_person_id,
        operator_name=follow_up.follow_up_person_name,
        change_reason="创建术后回访记录",
    )

    return db_follow_up


def update_follow_up(
    db: Session,
    follow_up_id: int,
    update_data: schemas.PostOperativeFollowUpUpdate,
    operator_id: int,
    operator_name: str,
):
    db_follow_up = get_follow_up(db, follow_up_id)
    if not db_follow_up:
        return None

    new_version = db_follow_up.current_version + 1

    for key, value in update_data.dict(exclude_unset=True, exclude={"change_reason"}).items():
        if value is not None:
            old_val = getattr(db_follow_up, key, "")
            old_val_str = str(old_val) if old_val else ""
            new_val_str = str(value) if value else ""

            if old_val_str != new_val_str:
                log_audit(
                    db,
                    entity_type="follow_up",
                    entity_id=follow_up_id,
                    action="update",
                    field_name=key,
                    old_value=old_val_str,
                    new_value=new_val_str,
                    change_reason=update_data.change_reason,
                    operator_id=operator_id,
                    operator_name=operator_name,
                )

            setattr(db_follow_up, key, value)

    db_follow_up.current_version = new_version
    db.commit()

    db_version = models.FollowUpVersion(
        follow_up_id=db_follow_up.id,
        version=new_version,
        recovery_status=db_follow_up.recovery_status,
        customer_feedback=db_follow_up.customer_feedback,
        abnormal_symptoms=db_follow_up.abnormal_symptoms,
        handling_advice=db_follow_up.handling_advice,
        status=db_follow_up.status,
        change_reason=update_data.change_reason,
        created_by=operator_id,
        created_by_name=operator_name,
    )
    db.add(db_version)
    db.commit()

    db.refresh(db_follow_up)
    return db_follow_up


def get_follow_up_versions(db: Session, follow_up_id: int):
    return (
        db.query(models.FollowUpVersion)
        .filter(models.FollowUpVersion.follow_up_id == follow_up_id)
        .order_by(desc(models.FollowUpVersion.version))
        .all()
    )


def get_discomfort_report(db: Session, report_id: int):
    return db.query(models.DiscomfortReport).filter(models.DiscomfortReport.id == report_id).first()


def get_discomfort_reports(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    discomfort_type: Optional[str] = None,
):
    query = db.query(models.DiscomfortReport)
    if customer_id:
        query = query.filter(models.DiscomfortReport.customer_id == customer_id)
    if status:
        query = query.filter(models.DiscomfortReport.status == status)
    if severity:
        query = query.filter(models.DiscomfortReport.severity == severity)
    if discomfort_type:
        query = query.filter(models.DiscomfortReport.discomfort_type == discomfort_type)
    return query.order_by(desc(models.DiscomfortReport.report_date)).offset(skip).limit(limit).all()


def create_discomfort_report(db: Session, report: schemas.DiscomfortReportCreate):
    db_report = models.DiscomfortReport(**report.dict())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    log_audit(
        db,
        entity_type="discomfort_report",
        entity_id=db_report.id,
        action="create",
        operator_id=0,
        operator_name=report.reporter,
        change_reason="创建不适/投诉上报",
    )

    return db_report


def handle_discomfort_report(
    db: Session,
    report_id: int,
    handling_data: schemas.HandlingRecordCreate,
):
    db_report = get_discomfort_report(db, report_id)
    if not db_report:
        return None

    previous_status = db_report.status

    if not db_report.first_handler_id:
        db_report.first_handler_id = handling_data.handler_id
        db_report.first_handler_name = handling_data.handler_name
        db_report.first_handling_time = datetime.now()

    db_report.current_handler_id = handling_data.handler_id
    db_report.current_handler_name = handling_data.handler_name
    db_report.status = handling_data.new_status

    if handling_data.new_status == "closed":
        db_report.is_closed = True
        db_report.closed_at = datetime.now()
        db_report.closed_by = handling_data.handler_id
        db_report.closed_by_name = handling_data.handler_name

    db.commit()

    db_handling = models.HandlingRecord(
        discomfort_report_id=report_id,
        handler_id=handling_data.handler_id,
        handler_name=handling_data.handler_name,
        handling_action=handling_data.handling_action,
        handling_notes=handling_data.handling_notes,
        previous_status=previous_status,
        new_status=handling_data.new_status,
        next_step=handling_data.next_step,
        notify_customer=handling_data.notify_customer,
        notify_method=handling_data.notify_method,
        attachment_count=handling_data.attachment_count,
    )
    db.add(db_handling)
    db.commit()

    log_audit(
        db,
        entity_type="discomfort_report",
        entity_id=report_id,
        action="handle",
        field_name="status",
        old_value=previous_status,
        new_value=handling_data.new_status,
        change_reason=handling_data.handling_notes,
        operator_id=handling_data.handler_id,
        operator_name=handling_data.handler_name,
    )

    db.refresh(db_report)
    return db_report


def get_handling_records(db: Session, report_id: int):
    return (
        db.query(models.HandlingRecord)
        .filter(models.HandlingRecord.discomfort_report_id == report_id)
        .order_by(desc(models.HandlingRecord.created_at))
        .all()
    )


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    operator_id: Optional[int] = None,
):
    query = db.query(models.AuditLog)
    if entity_type:
        query = query.filter(models.AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(models.AuditLog.entity_id == entity_id)
    if operator_id:
        query = query.filter(models.AuditLog.operator_id == operator_id)
    return query.order_by(desc(models.AuditLog.created_at)).offset(skip).limit(limit).all()


from datetime import datetime
