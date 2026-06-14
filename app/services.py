from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import (
    ActivityMaterial,
    StoreFeedback,
    ProcessingRecord,
    Alert,
    User,
    Store,
    MaterialStatus,
    FeedbackStatus,
    AlertType,
    AlertLevel,
    UserRole,
)
from app.schemas import (
    ActivityMaterialCreate,
    ActivityMaterialUpdate,
    StoreFeedbackCreate,
    StoreFeedbackUpdate,
    ProcessingRecordCreate,
    AlertCreate,
    StatusChangeRequest,
)
from datetime import datetime, timedelta
from typing import List, Optional, Tuple


class MaterialService:
    @staticmethod
    def create_material(db: Session, material: ActivityMaterialCreate) -> ActivityMaterial:
        db_material = ActivityMaterial(**material.model_dump())
        db_material.status_changed_at = datetime.now()
        db.add(db_material)
        db.commit()
        db.refresh(db_material)
        return db_material

    @staticmethod
    def get_material(db: Session, material_id: int) -> Optional[ActivityMaterial]:
        return db.query(ActivityMaterial).filter(ActivityMaterial.id == material_id).first()

    @staticmethod
    def get_materials(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        store_id: Optional[int] = None,
        status: Optional[MaterialStatus] = None,
    ) -> List[ActivityMaterial]:
        query = db.query(ActivityMaterial)
        if store_id:
            query = query.filter(ActivityMaterial.store_id == store_id)
        if status:
            query = query.filter(ActivityMaterial.status == status)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_material(
        db: Session, material_id: int, material: ActivityMaterialUpdate
    ) -> Optional[ActivityMaterial]:
        db_material = MaterialService.get_material(db, material_id)
        if not db_material:
            return None
        for key, value in material.model_dump(exclude_unset=True).items():
            setattr(db_material, key, value)
        db.commit()
        db.refresh(db_material)
        return db_material

    @staticmethod
    def change_status(
        db: Session,
        material_id: int,
        status_change: StatusChangeRequest,
        handler: User,
    ) -> Tuple[Optional[ActivityMaterial], Optional[ProcessingRecord]]:
        db_material = MaterialService.get_material(db, material_id)
        if not db_material:
            return None, None

        from_status = db_material.status
        to_status = MaterialStatus(status_change.to_status)

        db_material.status = to_status
        db_material.current_handler_id = status_change.handler_id
        db_material.status_changed_at = datetime.now()

        if to_status == MaterialStatus.DISTRIBUTED:
            db_material.distributed_at = datetime.now()
        elif to_status == MaterialStatus.RECEIVED:
            db_material.received_at = datetime.now()
        elif to_status == MaterialStatus.COMPLETED:
            db_material.actual_complete_date = datetime.now()
        elif to_status == MaterialStatus.STUCK:
            db_material.stuck_reason = status_change.notes

        processing_record = ProcessingRecord(
            material_id=material_id,
            handler_id=handler.id,
            from_status=from_status.value,
            to_status=to_status.value,
            action=f"状态变更: {from_status.value} -> {to_status.value}",
            notes=status_change.notes,
        )
        db.add(processing_record)
        db.commit()
        db.refresh(db_material)

        return db_material, processing_record

    @staticmethod
    def get_stuck_materials(db: Session, days: int = 3) -> List[ActivityMaterial]:
        threshold = datetime.now() - timedelta(days=days)
        return (
            db.query(ActivityMaterial)
            .filter(
                ActivityMaterial.status == MaterialStatus.STUCK,
                ActivityMaterial.status_changed_at < threshold,
            )
            .all()
        )

    @staticmethod
    def get_materials_without_handler(db: Session) -> List[ActivityMaterial]:
        return (
            db.query(ActivityMaterial)
            .filter(
                ActivityMaterial.current_handler_id.is_(None),
                ActivityMaterial.status.in_(
                    [MaterialStatus.DISTRIBUTED, MaterialStatus.RECEIVED, MaterialStatus.IN_USE]
                ),
            )
            .all()
        )


class FeedbackService:
    @staticmethod
    def create_feedback(db: Session, feedback: StoreFeedbackCreate) -> StoreFeedback:
        db_feedback = StoreFeedback(**feedback.model_dump())
        db_feedback.status_changed_at = datetime.now()
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        return db_feedback

    @staticmethod
    def get_feedback(db: Session, feedback_id: int) -> Optional[StoreFeedback]:
        return db.query(StoreFeedback).filter(StoreFeedback.id == feedback_id).first()

    @staticmethod
    def get_feedbacks(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        store_id: Optional[int] = None,
        material_id: Optional[int] = None,
        status: Optional[FeedbackStatus] = None,
    ) -> List[StoreFeedback]:
        query = db.query(StoreFeedback)
        if store_id:
            query = query.filter(StoreFeedback.store_id == store_id)
        if material_id:
            query = query.filter(StoreFeedback.material_id == material_id)
        if status:
            query = query.filter(StoreFeedback.status == status)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_feedback(
        db: Session, feedback_id: int, feedback: StoreFeedbackUpdate
    ) -> Optional[StoreFeedback]:
        db_feedback = FeedbackService.get_feedback(db, feedback_id)
        if not db_feedback:
            return None
        for key, value in feedback.model_dump(exclude_unset=True).items():
            setattr(db_feedback, key, value)
        db.commit()
        db.refresh(db_feedback)
        return db_feedback

    @staticmethod
    def change_status(
        db: Session,
        feedback_id: int,
        status_change: StatusChangeRequest,
        handler: User,
    ) -> Tuple[Optional[StoreFeedback], Optional[ProcessingRecord]]:
        db_feedback = FeedbackService.get_feedback(db, feedback_id)
        if not db_feedback:
            return None, None

        from_status = db_feedback.status
        to_status = FeedbackStatus(status_change.to_status)

        db_feedback.status = to_status
        db_feedback.current_handler_id = status_change.handler_id
        db_feedback.status_changed_at = datetime.now()

        if to_status == FeedbackStatus.RESOLVED:
            db_feedback.resolved_at = datetime.now()
            db_feedback.resolution = status_change.notes
        elif to_status == FeedbackStatus.REJECTED:
            db_feedback.rejected_reason = status_change.notes
        elif to_status == FeedbackStatus.ESCALATED:
            pass

        processing_record = ProcessingRecord(
            feedback_id=feedback_id,
            handler_id=handler.id,
            from_status=from_status.value,
            to_status=to_status.value,
            action=f"状态变更: {from_status.value} -> {to_status.value}",
            notes=status_change.notes,
        )
        db.add(processing_record)
        db.commit()
        db.refresh(db_feedback)

        return db_feedback, processing_record

    @staticmethod
    def get_stuck_feedbacks(db: Session, days: int = 3) -> List[StoreFeedback]:
        threshold = datetime.now() - timedelta(days=days)
        return (
            db.query(StoreFeedback)
            .filter(
                StoreFeedback.status == FeedbackStatus.PROCESSING,
                StoreFeedback.status_changed_at < threshold,
            )
            .all()
        )

    @staticmethod
    def get_feedbacks_without_handler(db: Session) -> List[StoreFeedback]:
        return (
            db.query(StoreFeedback)
            .filter(
                StoreFeedback.current_handler_id.is_(None),
                StoreFeedback.status.in_(
                    [FeedbackStatus.PENDING, FeedbackStatus.PROCESSING, FeedbackStatus.ESCALATED]
                ),
            )
            .all()
        )


class AlertService:
    @staticmethod
    def create_alert(db: Session, alert: AlertCreate) -> Alert:
        db_alert = Alert(**alert.model_dump())
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        return db_alert

    @staticmethod
    def get_unhandled_alerts(db: Session) -> List[Alert]:
        return db.query(Alert).filter(Alert.is_handled == False).all()

    @staticmethod
    def handle_alert(db: Session, alert_id: int, handler_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.is_handled = True
        alert.handled_by_id = handler_id
        alert.handled_at = datetime.now()
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def check_and_create_stuck_alerts(db: Session, days: int = 3) -> List[Alert]:
        alerts = []

        stuck_materials = MaterialService.get_stuck_materials(db, days)
        for material in stuck_materials:
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.material_id == material.id,
                    Alert.alert_type == AlertType.STUCK,
                    Alert.is_handled == False,
                )
                .first()
            )
            if not existing_alert:
                alert = AlertService.create_alert(
                    db,
                    AlertCreate(
                        alert_type=AlertType.STUCK,
                        alert_level=AlertLevel.WARNING,
                        title=f"活动物料卡住: {material.name}",
                        message=f"活动物料 {material.name} (编号: {material.code}) 已卡住超过{days}天，请及时处理。",
                        material_id=material.id,
                    ),
                )
                alerts.append(alert)

        stuck_feedbacks = FeedbackService.get_stuck_feedbacks(db, days)
        for feedback in stuck_feedbacks:
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.feedback_id == feedback.id,
                    Alert.alert_type == AlertType.STUCK,
                    Alert.is_handled == False,
                )
                .first()
            )
            if not existing_alert:
                alert = AlertService.create_alert(
                    db,
                    AlertCreate(
                        alert_type=AlertType.STUCK,
                        alert_level=AlertLevel.WARNING,
                        title=f"门店反馈卡住: {feedback.title}",
                        message=f"门店反馈 {feedback.title} 已处理中超过{days}天，请及时处理。",
                        feedback_id=feedback.id,
                    ),
                )
                alerts.append(alert)

        materials_no_handler = MaterialService.get_materials_without_handler(db)
        for material in materials_no_handler:
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.material_id == material.id,
                    Alert.alert_type == AlertType.UNCLEAR_RESPONSIBILITY,
                    Alert.is_handled == False,
                )
                .first()
            )
            if not existing_alert:
                alert = AlertService.create_alert(
                    db,
                    AlertCreate(
                        alert_type=AlertType.UNCLEAR_RESPONSIBILITY,
                        alert_level=AlertLevel.ERROR,
                        title=f"活动物料责任不清: {material.name}",
                        message=f"活动物料 {material.name} (编号: {material.code}) 当前状态为 {material.status.value} 但无明确处理人。",
                        material_id=material.id,
                    ),
                )
                alerts.append(alert)

        feedbacks_no_handler = FeedbackService.get_feedbacks_without_handler(db)
        for feedback in feedbacks_no_handler:
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.feedback_id == feedback.id,
                    Alert.alert_type == AlertType.UNCLEAR_RESPONSIBILITY,
                    Alert.is_handled == False,
                )
                .first()
            )
            if not existing_alert:
                alert = AlertService.create_alert(
                    db,
                    AlertCreate(
                        alert_type=AlertType.UNCLEAR_RESPONSIBILITY,
                        alert_level=AlertLevel.ERROR,
                        title=f"门店反馈责任不清: {feedback.title}",
                        message=f"门店反馈 {feedback.title} 当前状态为 {feedback.status.value} 但无明确处理人。",
                        feedback_id=feedback.id,
                    ),
                )
                alerts.append(alert)

        return alerts


class ResponsibilityChainService:
    @staticmethod
    def get_responsibility_chain(
        db: Session, material_id: Optional[int] = None, feedback_id: Optional[int] = None
    ) -> dict:
        result = {
            "material_id": material_id,
            "feedback_id": feedback_id,
            "item_type": "",
            "item_name": "",
            "current_handler": None,
            "handler_role": None,
            "current_status": "",
            "stuck_at": None,
            "reason_not_completed": None,
            "escalation_path": [],
            "latest_processing_note": None,
        }

        if material_id:
            material = MaterialService.get_material(db, material_id)
            if not material:
                return result

            result["item_type"] = "material"
            result["item_name"] = material.name
            result["current_status"] = material.status.value

            if material.current_handler_id:
                handler = db.query(User).filter(User.id == material.current_handler_id).first()
                if handler:
                    result["current_handler"] = handler
                    result["handler_role"] = handler.role.value

            if material.status == MaterialStatus.STUCK:
                result["stuck_at"] = material.status.value
                result["reason_not_completed"] = material.stuck_reason

            processing_records = (
                db.query(ProcessingRecord)
                .filter(ProcessingRecord.material_id == material_id)
                .order_by(ProcessingRecord.created_at.desc())
                .all()
            )

            escalation_path = []
            for record in processing_records:
                handler = db.query(User).filter(User.id == record.handler_id).first()
                escalation_path.append(
                    {
                        "handler_name": handler.real_name if handler else "未知",
                        "handler_role": handler.role.value if handler else "未知",
                        "action": record.action,
                        "from_status": record.from_status,
                        "to_status": record.to_status,
                        "notes": record.notes,
                        "created_at": record.created_at.isoformat(),
                    }
                )
            result["escalation_path"] = escalation_path

            if processing_records:
                latest_record = processing_records[0]
                latest_handler = db.query(User).filter(User.id == latest_record.handler_id).first()
                result["latest_processing_note"] = {
                    "handler_name": latest_handler.real_name if latest_handler else "未知",
                    "handler_role": latest_handler.role.value if latest_handler else "未知",
                    "action": latest_record.action,
                    "notes": latest_record.notes,
                    "processed_at": latest_record.created_at.isoformat(),
                }

        elif feedback_id:
            feedback = FeedbackService.get_feedback(db, feedback_id)
            if not feedback:
                return result

            result["item_type"] = "feedback"
            result["item_name"] = feedback.title
            result["current_status"] = feedback.status.value

            if feedback.current_handler_id:
                handler = db.query(User).filter(User.id == feedback.current_handler_id).first()
                if handler:
                    result["current_handler"] = handler
                    result["handler_role"] = handler.role.value

            if feedback.status == FeedbackStatus.PROCESSING:
                result["stuck_at"] = feedback.status.value
                result["reason_not_completed"] = feedback.stuck_reason or "处理中，等待处理"
            elif feedback.status == FeedbackStatus.REJECTED:
                result["stuck_at"] = feedback.status.value
                result["reason_not_completed"] = feedback.rejected_reason or "已退回，未说明原因"

            processing_records = (
                db.query(ProcessingRecord)
                .filter(ProcessingRecord.feedback_id == feedback_id)
                .order_by(ProcessingRecord.created_at.desc())
                .all()
            )

            escalation_path = []
            for record in processing_records:
                handler = db.query(User).filter(User.id == record.handler_id).first()
                escalation_path.append(
                    {
                        "handler_name": handler.real_name if handler else "未知",
                        "handler_role": handler.role.value if handler else "未知",
                        "action": record.action,
                        "from_status": record.from_status,
                        "to_status": record.to_status,
                        "notes": record.notes,
                        "created_at": record.created_at.isoformat(),
                    }
                )
            result["escalation_path"] = escalation_path

            if processing_records:
                latest_record = processing_records[0]
                latest_handler = db.query(User).filter(User.id == latest_record.handler_id).first()
                result["latest_processing_note"] = {
                    "handler_name": latest_handler.real_name if latest_handler else "未知",
                    "handler_role": latest_handler.role.value if latest_handler else "未知",
                    "action": latest_record.action,
                    "notes": latest_record.notes,
                    "processed_at": latest_record.created_at.isoformat(),
                }

        return result

    @staticmethod
    def escalate_if_needed(db: Session, material_id: Optional[int] = None, feedback_id: Optional[int] = None) -> bool:
        if material_id:
            material = MaterialService.get_material(db, material_id)
            if not material or not material.current_handler_id:
                return False

            handler = db.query(User).filter(User.id == material.current_handler_id).first()
            if not handler:
                return False

            if handler.role == UserRole.CLERK:
                store = db.query(Store).filter(Store.id == material.store_id).first()
                if store:
                    manager = (
                        db.query(User)
                        .filter(
                            User.store_id == store.id,
                            User.role == UserRole.STORE_MANAGER,
                            User.is_active == True,
                        )
                        .first()
                    )
                    if manager:
                        material.current_handler_id = manager.id
                        db.commit()
                        return True

            elif handler.role == UserRole.STORE_MANAGER:
                store = db.query(Store).filter(Store.id == material.store_id).first()
                if store:
                    admin = (
                        db.query(User)
                        .filter(
                            User.area_id == store.area_id,
                            User.role == UserRole.AREA_ADMIN,
                            User.is_active == True,
                        )
                        .first()
                    )
                    if admin:
                        material.current_handler_id = admin.id
                        db.commit()
                        return True

        elif feedback_id:
            feedback = FeedbackService.get_feedback(db, feedback_id)
            if not feedback or not feedback.current_handler_id:
                return False

            handler = db.query(User).filter(User.id == feedback.current_handler_id).first()
            if not handler:
                return False

            if handler.role == UserRole.CLERK:
                store = db.query(Store).filter(Store.id == feedback.store_id).first()
                if store:
                    manager = (
                        db.query(User)
                        .filter(
                            User.store_id == store.id,
                            User.role == UserRole.STORE_MANAGER,
                            User.is_active == True,
                        )
                        .first()
                    )
                    if manager:
                        feedback.current_handler_id = manager.id
                        db.commit()
                        return True

            elif handler.role == UserRole.STORE_MANAGER:
                store = db.query(Store).filter(Store.id == feedback.store_id).first()
                if store:
                    admin = (
                        db.query(User)
                        .filter(
                            User.area_id == store.area_id,
                            User.role == UserRole.AREA_ADMIN,
                            User.is_active == True,
                        )
                        .first()
                    )
                    if admin:
                        feedback.current_handler_id = admin.id
                        db.commit()
                        return True

        return False