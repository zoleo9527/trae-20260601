from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from . import crud, models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="医美机构 - 术后回访与不适上报系统", description="重点：过程可追溯、变更留痕、异常说明")


@app.get("/")
def read_root():
    return FileResponse("static/index.html")


@app.post("/api/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)


@app.get("/api/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)


@app.get("/api/customers/", response_model=List[schemas.Customer])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_customers(db, skip=skip, limit=limit, keyword=keyword, status=status)


@app.get("/api/customers/{customer_id}", response_model=schemas.Customer)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


@app.post("/api/customers/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db=db, customer=customer)


@app.get("/api/consultation-records/", response_model=List[schemas.ConsultationRecord])
def read_consultation_records(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_consultation_records(db, skip=skip, limit=limit, customer_id=customer_id, status=status)


@app.get("/api/consultation-records/{record_id}", response_model=schemas.ConsultationRecord)
def read_consultation_record(record_id: int, db: Session = Depends(get_db)):
    db_record = crud.get_consultation_record(db, record_id=record_id)
    if db_record is None:
        raise HTTPException(status_code=404, detail="Consultation record not found")
    return db_record


@app.post("/api/consultation-records/", response_model=schemas.ConsultationRecord)
def create_consultation_record(record: schemas.ConsultationRecordCreate, db: Session = Depends(get_db)):
    return crud.create_consultation_record(db=db, record=record)


@app.put("/api/consultation-records/{record_id}", response_model=schemas.ConsultationRecord)
def update_consultation_record(
    record_id: int,
    update_data: schemas.ConsultationRecordUpdate,
    operator_id: int = Query(...),
    operator_name: str = Query(...),
    db: Session = Depends(get_db),
):
    db_record = crud.update_consultation_record(
        db, record_id=record_id, update_data=update_data, operator_id=operator_id, operator_name=operator_name
    )
    if db_record is None:
        raise HTTPException(status_code=404, detail="Consultation record not found")
    return db_record


@app.get("/api/consultation-records/{record_id}/versions")
def read_consultation_versions(record_id: int, db: Session = Depends(get_db)):
    return crud.get_consultation_versions(db, record_id=record_id)


@app.get("/api/quotation-schemes/", response_model=List[schemas.QuotationScheme])
def read_quotation_schemes(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_quotation_schemes(db, skip=skip, limit=limit, customer_id=customer_id, status=status)


@app.get("/api/quotation-schemes/{scheme_id}", response_model=schemas.QuotationScheme)
def read_quotation_scheme(scheme_id: int, db: Session = Depends(get_db)):
    db_scheme = crud.get_quotation_scheme(db, scheme_id=scheme_id)
    if db_scheme is None:
        raise HTTPException(status_code=404, detail="Quotation scheme not found")
    return db_scheme


@app.post("/api/quotation-schemes/", response_model=schemas.QuotationScheme)
def create_quotation_scheme(scheme: schemas.QuotationSchemeCreate, db: Session = Depends(get_db)):
    return crud.create_quotation_scheme(db=db, scheme=scheme)


@app.put("/api/quotation-schemes/{scheme_id}", response_model=schemas.QuotationScheme)
def update_quotation_scheme(
    scheme_id: int,
    update_data: schemas.QuotationSchemeUpdate,
    operator_id: int = Query(...),
    operator_name: str = Query(...),
    db: Session = Depends(get_db),
):
    db_scheme = crud.update_quotation_scheme(
        db, scheme_id=scheme_id, update_data=update_data, operator_id=operator_id, operator_name=operator_name
    )
    if db_scheme is None:
        raise HTTPException(status_code=404, detail="Quotation scheme not found")
    return db_scheme


@app.get("/api/quotation-schemes/{scheme_id}/versions")
def read_quotation_versions(scheme_id: int, db: Session = Depends(get_db)):
    return crud.get_quotation_versions(db, scheme_id=scheme_id)


@app.get("/api/follow-ups/", response_model=List[schemas.PostOperativeFollowUp])
def read_follow_ups(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    has_discomfort: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    return crud.get_follow_ups(
        db, skip=skip, limit=limit, customer_id=customer_id, status=status, stage=stage, has_discomfort=has_discomfort
    )


@app.get("/api/follow-ups/{follow_up_id}", response_model=schemas.PostOperativeFollowUp)
def read_follow_up(follow_up_id: int, db: Session = Depends(get_db)):
    db_follow_up = crud.get_follow_up(db, follow_up_id=follow_up_id)
    if db_follow_up is None:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return db_follow_up


@app.post("/api/follow-ups/", response_model=schemas.PostOperativeFollowUp)
def create_follow_up(follow_up: schemas.PostOperativeFollowUpCreate, db: Session = Depends(get_db)):
    return crud.create_follow_up(db=db, follow_up=follow_up)


@app.put("/api/follow-ups/{follow_up_id}", response_model=schemas.PostOperativeFollowUp)
def update_follow_up(
    follow_up_id: int,
    update_data: schemas.PostOperativeFollowUpUpdate,
    operator_id: int = Query(...),
    operator_name: str = Query(...),
    db: Session = Depends(get_db),
):
    db_follow_up = crud.update_follow_up(
        db, follow_up_id=follow_up_id, update_data=update_data, operator_id=operator_id, operator_name=operator_name
    )
    if db_follow_up is None:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return db_follow_up


@app.get("/api/follow-ups/{follow_up_id}/versions")
def read_follow_up_versions(follow_up_id: int, db: Session = Depends(get_db)):
    return crud.get_follow_up_versions(db, follow_up_id=follow_up_id)


@app.get("/api/discomfort-reports/", response_model=List[schemas.DiscomfortReport])
def read_discomfort_reports(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    discomfort_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.get_discomfort_reports(
        db,
        skip=skip,
        limit=limit,
        customer_id=customer_id,
        status=status,
        severity=severity,
        discomfort_type=discomfort_type,
    )


@app.get("/api/discomfort-reports/{report_id}", response_model=schemas.DiscomfortReport)
def read_discomfort_report(report_id: int, db: Session = Depends(get_db)):
    db_report = crud.get_discomfort_report(db, report_id=report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Discomfort report not found")
    return db_report


@app.post("/api/discomfort-reports/", response_model=schemas.DiscomfortReport)
def create_discomfort_report(report: schemas.DiscomfortReportCreate, db: Session = Depends(get_db)):
    return crud.create_discomfort_report(db=db, report=report)


@app.post("/api/discomfort-reports/{report_id}/handle", response_model=schemas.DiscomfortReport)
def handle_discomfort_report(
    report_id: int,
    handling_data: schemas.HandlingRecordCreate,
    db: Session = Depends(get_db),
):
    db_report = crud.handle_discomfort_report(db, report_id=report_id, handling_data=handling_data)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Discomfort report not found")
    return db_report


@app.get("/api/discomfort-reports/{report_id}/handling-records", response_model=List[schemas.HandlingRecord])
def read_handling_records(report_id: int, db: Session = Depends(get_db)):
    return crud.get_handling_records(db, report_id=report_id)


@app.get("/api/audit-logs/")
def read_audit_logs(
    skip: int = 0,
    limit: int = 100,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return crud.get_audit_logs(
        db, skip=skip, limit=limit, entity_type=entity_type, entity_id=entity_id, action=action, operator_id=operator_id
    )


app.mount("/static", StaticFiles(directory="static"), name="static")
