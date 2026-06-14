from typing import Optional, List
from datetime import datetime
from models import (
    Project, CustomerFeedback, FeeConfirmation, StatusChange,
    ProblemRecord, User, OrderStatus, FeedbackStatus, FeeStatus,
    ProblemType, RoleType, ErrorCode, ErrorResponse
)
from state_machine import StateMachine, StateTransitionError


class Database:
    def __init__(self):
        self.users = {}
        self.projects = {}
        self.feedbacks = {}
        self.fees = {}
        self.status_changes = {}
        self.problems = {}

    def add(self, entity_type: str, entity):
        if entity_type == "user":
            self.users[entity.id] = entity
        elif entity_type == "project":
            self.projects[entity.id] = entity
        elif entity_type == "feedback":
            self.feedbacks[entity.id] = entity
        elif entity_type == "fee":
            self.fees[entity.id] = entity
        elif entity_type == "status_change":
            self.status_changes[entity.id] = entity
        elif entity_type == "problem":
            self.problems[entity.id] = entity

    def get(self, entity_type: str, entity_id: str):
        if entity_type == "user":
            return self.users.get(entity_id)
        elif entity_type == "project":
            return self.projects.get(entity_id)
        elif entity_type == "feedback":
            return self.feedbacks.get(entity_id)
        elif entity_type == "fee":
            return self.fees.get(entity_id)
        elif entity_type == "status_change":
            return self.status_changes.get(entity_id)
        elif entity_type == "problem":
            return self.problems.get(entity_id)

    def get_all(self, entity_type: str):
        if entity_type == "project":
            return list(self.projects.values())
        elif entity_type == "feedback":
            return list(self.feedbacks.values())
        elif entity_type == "fee":
            return list(self.fees.values())
        elif entity_type == "status_change":
            return list(self.status_changes.values())
        elif entity_type == "problem":
            return list(self.problems.values())
        return []

    def filter(self, entity_type: str, **kwargs):
        entities = self.get_all(entity_type)
        for key, value in kwargs.items():
            entities = [e for e in entities if getattr(e, key, None) == value]
        return entities


db = Database()


class ProjectService:
    @staticmethod
    def create_project(name: str, project_manager_id: str, translator_id: str,
                      reviewer_id: str, original_deadline: datetime, ledger: str = None,
                      scene_records: str = None, screenshots: List[str] = None) -> Project:
        project = Project(
            name=name,
            project_manager_id=project_manager_id,
            translator_id=translator_id,
            reviewer_id=reviewer_id,
            original_deadline=original_deadline,
            ledger=ledger,
            scene_records=scene_records,
            screenshots=screenshots
        )
        db.add("project", project)
        StatusChangeService.record_change(
            "project", project.id, "status", None, OrderStatus.PENDING.value,
            project_manager_id, "创建项目"
        )
        return project

    @staticmethod
    def get_project(project_id: str) -> Optional[Project]:
        return db.get("project", project_id)

    @staticmethod
    def update_project_status(project_id: str, new_status: OrderStatus,
                              changed_by: str, reason: str = None) -> Project:
        project = db.get("project", project_id)
        if not project:
            raise StateTransitionError(ErrorCode.PROJECT_NOT_FOUND, f"项目 {project_id} 不存在")

        old_status = project.status
        StateMachine.validate_project_transition(old_status, new_status, reason)

        project.status = new_status
        project.updated_at = datetime.now()

        StatusChangeService.record_change(
            "project", project_id, "status", old_status.value, new_status.value,
            changed_by, reason
        )

        if new_status == OrderStatus.PROBLEM:
            project.status = OrderStatus.PROBLEM

        return project

    @staticmethod
    def reschedule_project(project_id: str, new_deadline: datetime,
                          changed_by: str, reason: str,
                          auto_create_fee: bool = True,
                          estimated_amount: float = None,
                          fee_type: str = None) -> dict:
        project = db.get("project", project_id)
        if not project:
            raise StateTransitionError(ErrorCode.PROJECT_NOT_FOUND, f"项目 {project_id} 不存在")

        old_deadline = project.actual_deadline or project.original_deadline

        problem_record = ProblemRecord(
            project_id=project_id,
            feedback_id="",
            problem_type=ProblemType.RESCHEDULE,
            original_data=str(old_deadline),
            new_data=str(new_deadline),
            reason=reason,
            created_by=changed_by
        )
        db.add("problem", problem_record)

        StatusChangeService.record_change(
            "problem", problem_record.id, "status",
            None, "open",
            changed_by, f"创建改期问题单: {reason}"
        )

        if project.status != OrderStatus.PROBLEM:
            old_project_status = project.status.value
            project.status = OrderStatus.PROBLEM
            StatusChangeService.record_change(
                "project", project_id, "status",
                old_project_status, OrderStatus.PROBLEM.value,
                changed_by, "改期导致项目标记为问题单"
            )

        project.actual_deadline = new_deadline
        project.updated_at = datetime.now()

        StatusChangeService.record_change(
            "project", project_id, "actual_deadline", str(old_deadline),
            str(new_deadline), changed_by, reason
        )

        result = {"project": project, "problem": problem_record}

        if auto_create_fee and estimated_amount and fee_type:
            inherited_notes = f"【来自改期问题单 #{problem_record.id[:8]}】\n" \
                            f"问题类型: 改期\n" \
                            f"问题原因: {reason}\n" \
                            f"原截止日期: {str(old_deadline)}\n" \
                            f"新截止日期: {str(new_deadline)}"

            fee = FeeService.create_fee_from_feedback(
                project_id=project_id,
                amount=estimated_amount,
                fee_type=fee_type,
                problem_id=problem_record.id,
                inherited_notes=inherited_notes
            )

            result["fee"] = fee
            result["message"] = "改期成功，已自动创建关联的待确认费用"

            StatusChangeService.record_change(
                "fee", fee.id, "status",
                None, FeeStatus.PENDING.value,
                changed_by, "由改期问题单自动创建"
            )

        return result


class FeedbackService:
    @staticmethod
    def create_feedback(project_id: str, feedback_content: str) -> CustomerFeedback:
        project = db.get("project", project_id)
        if not project:
            raise StateTransitionError(ErrorCode.PROJECT_NOT_FOUND, f"项目 {project_id} 不存在")

        feedback = CustomerFeedback(
            project_id=project_id,
            feedback_content=feedback_content
        )
        db.add("feedback", feedback)
        return feedback

    @staticmethod
    def handle_feedback(feedback_id: str, handler_id: str, handler_type: RoleType,
                       internal_notes: str, responsibility_analysis: str,
                       processing_result: str,
                       auto_create_fee: bool = True,
                       estimated_amount: float = None,
                       fee_type: str = None) -> dict:
        StateMachine.validate_role_permission(handler_type, "handle_feedback")

        feedback = db.get("feedback", feedback_id)
        if not feedback:
            raise StateTransitionError(ErrorCode.FEEDBACK_NOT_FOUND,
                                       f"反馈 {feedback_id} 不存在")

        if feedback.status == FeedbackStatus.HANDLED:
            raise StateTransitionError(ErrorCode.DUPLICATE_OPERATION,
                                       f"反馈 {feedback_id} 已经处理过")

        feedback.handler_id = handler_id
        feedback.handler_type = handler_type
        feedback.internal_notes = internal_notes
        feedback.responsibility_analysis = responsibility_analysis
        feedback.processing_result = processing_result
        feedback.status = FeedbackStatus.HANDLED
        feedback.handled_at = datetime.now()

        StatusChangeService.record_change(
            "feedback", feedback_id, "status",
            FeedbackStatus.PENDING.value, FeedbackStatus.HANDLED.value,
            handler_id, f"处理完成: {processing_result}"
        )

        project = db.get("project", feedback.project_id)
        if project and project.status != OrderStatus.PROBLEM:
            old_project_status = project.status.value
            StateMachine.validate_project_transition(
                project.status, OrderStatus.PROBLEM
            )
            project.status = OrderStatus.PROBLEM
            StatusChangeService.record_change(
                "project", project.id, "status",
                old_project_status, OrderStatus.PROBLEM.value,
                handler_id, "客户反馈导致项目标记为问题单"
            )

        result = {"feedback": feedback}

        if auto_create_fee and estimated_amount and fee_type:
            inherited_notes = f"【来自客户反馈 #{feedback_id[:8]}】\n" \
                            f"内部备注: {internal_notes}\n" \
                            f"责任分析: {responsibility_analysis}\n" \
                            f"处理结果: {processing_result}"

            fee = FeeService.create_fee_from_feedback(
                project_id=feedback.project_id,
                amount=estimated_amount,
                fee_type=fee_type,
                feedback_id=feedback_id,
                inherited_notes=inherited_notes
            )

            feedback.related_fee_id = fee.id
            result["fee"] = fee
            result["message"] = "反馈处理完成，已自动创建待确认费用"

            StatusChangeService.record_change(
                "fee", fee.id, "status",
                None, FeeStatus.PENDING.value,
                handler_id, f"由反馈处理自动创建"
            )

        return result

    @staticmethod
    def get_feedback(feedback_id: str) -> Optional[CustomerFeedback]:
        return db.get("feedback", feedback_id)

    @staticmethod
    def get_feedbacks_by_project(project_id: str) -> List[CustomerFeedback]:
        return db.filter("feedback", project_id=project_id)


class FeeService:
    @staticmethod
    def create_fee_from_feedback(project_id: str, amount: float,
                                 fee_type: str, feedback_id: str = None,
                                 problem_id: str = None,
                                 inherited_notes: str = None) -> FeeConfirmation:
        feedback = None
        if feedback_id and not inherited_notes:
            feedback = db.get("feedback", feedback_id)
            if feedback and feedback.status == FeedbackStatus.HANDLED:
                inherited_notes = f"【来自客户反馈 #{feedback_id[:8]}】\n" \
                                f"内部备注: {feedback.internal_notes or ''}\n" \
                                f"责任分析: {feedback.responsibility_analysis or ''}\n" \
                                f"处理结果: {feedback.processing_result or ''}"

        if problem_id and not inherited_notes:
            problem = db.get("problem", problem_id)
            if problem:
                inherited_notes = f"【来自问题单 #{problem_id[:8]}】\n" \
                                f"问题类型: {problem.problem_type.value}\n" \
                                f"问题原因: {problem.reason}\n" \
                                f"原始数据: {problem.original_data or '无'}\n" \
                                f"新数据: {problem.new_data or '无'}"

        fee = FeeConfirmation(
            project_id=project_id,
            feedback_id=feedback_id,
            problem_id=problem_id,
            amount=amount,
            fee_type=fee_type,
            inherited_notes=inherited_notes
        )
        db.add("fee", fee)

        if feedback:
            feedback.related_fee_id = fee.id

        return fee

    @staticmethod
    def confirm_fee(fee_id: str, confirmed_by: str, confirmation_notes: str = None) -> FeeConfirmation:
        fee = db.get("fee", fee_id)
        if not fee:
            raise StateTransitionError(ErrorCode.FEE_NOT_FOUND, f"费用记录 {fee_id} 不存在")

        if fee.status == FeeStatus.CONFIRMED:
            raise StateTransitionError(ErrorCode.FEE_ALREADY_CONFIRMED,
                                       f"费用记录 {fee_id} 已经确认")

        StateMachine.validate_fee_transition(fee.status, FeeStatus.CONFIRMED)

        fee.status = FeeStatus.CONFIRMED
        fee.confirmed_by = confirmed_by
        fee.confirmation_notes = confirmation_notes
        fee.confirmed_at = datetime.now()

        StatusChangeService.record_change(
            "fee", fee_id, "status",
            FeeStatus.PENDING.value, FeeStatus.CONFIRMED.value,
            confirmed_by, confirmation_notes
        )

        return fee

    @staticmethod
    def reject_fee(fee_id: str, rejected_by: str, reject_reason: str) -> FeeConfirmation:
        if not reject_reason:
            raise StateTransitionError(ErrorCode.REJECT_REASON_REQUIRED,
                                       "驳回费用必须提供驳回原因")

        fee = db.get("fee", fee_id)
        if not fee:
            raise StateTransitionError(ErrorCode.FEE_NOT_FOUND, f"费用记录 {fee_id} 不存在")

        old_fee_status = fee.status.value
        StateMachine.validate_fee_transition(fee.status, FeeStatus.REJECTED)

        fee.status = FeeStatus.REJECTED
        fee.confirmation_notes = reject_reason

        StatusChangeService.record_change(
            "fee", fee_id, "status",
            old_fee_status, FeeStatus.REJECTED.value,
            rejected_by, reject_reason
        )

        return fee

    @staticmethod
    def get_fee(fee_id: str) -> Optional[FeeConfirmation]:
        return db.get("fee", fee_id)

    @staticmethod
    def get_fees_by_project(project_id: str) -> List[FeeConfirmation]:
        return db.filter("fee", project_id=project_id)

    @staticmethod
    def get_fees_pending_confirmation() -> List[FeeConfirmation]:
        return db.filter("fee", status=FeeStatus.PENDING)

    @staticmethod
    def get_fee_with_full_context(fee_id: str) -> dict:
        fee = db.get("fee", fee_id)
        if not fee:
            raise StateTransitionError(ErrorCode.FEE_NOT_FOUND, f"费用记录 {fee_id} 不存在")

        feedback = None
        if fee.feedback_id:
            feedback = db.get("feedback", fee.feedback_id)

        problem = None
        if fee.problem_id:
            problem = db.get("problem", fee.problem_id)

        project = db.get("project", fee.project_id)

        fee_status_changes = StatusChangeService.get_changes_by_entity("fee", fee_id)
        feedback_status_changes = []
        if fee.feedback_id:
            feedback_status_changes = StatusChangeService.get_changes_by_entity("feedback", fee.feedback_id)
        problem_status_changes = []
        if fee.problem_id:
            problem_status_changes = StatusChangeService.get_changes_by_entity("problem", fee.problem_id)

        return {
            "fee": fee,
            "feedback": feedback,
            "problem": problem,
            "project": project,
            "fee_status_changes": sorted(fee_status_changes, key=lambda x: x.created_at),
            "feedback_status_changes": sorted(feedback_status_changes, key=lambda x: x.created_at),
            "problem_status_changes": sorted(problem_status_changes, key=lambda x: x.created_at)
        }


class ProblemService:
    @staticmethod
    def create_problem(project_id: str, feedback_id: str, problem_type: ProblemType,
                      reason: str, created_by: str,
                      original_data: str = None, new_data: str = None,
                      auto_create_fee: bool = True,
                      estimated_amount: float = None,
                      fee_type: str = None) -> dict:
        project = db.get("project", project_id)
        if not project:
            raise StateTransitionError(ErrorCode.PROJECT_NOT_FOUND, f"项目 {project_id} 不存在")

        if problem_type == ProblemType.RESCHEDULE and not new_data:
            raise StateTransitionError(ErrorCode.RESCHEDULE_NOT_ALLOWED,
                                       "改期必须提供新的截止日期")

        if problem_type == ProblemType.SUPPLEMENT and not new_data:
            raise StateTransitionError(ErrorCode.SUPPLEMENT_NOT_ALLOWED,
                                       "补录必须提供补录内容")

        if problem_type == ProblemType.REJECT and not reason:
            raise StateTransitionError(ErrorCode.REJECT_REASON_REQUIRED,
                                       "驳回必须提供驳回原因")

        problem = ProblemRecord(
            project_id=project_id,
            feedback_id=feedback_id,
            problem_type=problem_type,
            original_data=original_data,
            new_data=new_data,
            reason=reason,
            created_by=created_by
        )
        db.add("problem", problem)

        StatusChangeService.record_change(
            "problem", problem.id, "status",
            None, "open",
            created_by, f"创建{problem_type.value}问题单: {reason}"
        )

        if project.status != OrderStatus.PROBLEM:
            old_project_status = project.status.value
            project.status = OrderStatus.PROBLEM
            StatusChangeService.record_change(
                "project", project_id, "status",
                old_project_status, OrderStatus.PROBLEM.value,
                created_by, f"创建问题单: {problem_type.value}"
            )

        result = {"problem": problem}

        if auto_create_fee and estimated_amount and fee_type:
            inherited_notes = f"【来自问题单 #{problem.id[:8]}】\n" \
                            f"问题类型: {problem_type.value}\n" \
                            f"问题原因: {reason}\n" \
                            f"原始数据: {original_data or '无'}\n" \
                            f"新数据: {new_data or '无'}"

            feedback = None
            if feedback_id:
                feedback = db.get("feedback", feedback_id)
                if feedback:
                    inherited_notes += f"\n\n【关联反馈备注】\n" \
                                      f"内部备注: {feedback.internal_notes or ''}\n" \
                                      f"责任分析: {feedback.responsibility_analysis or ''}\n" \
                                      f"处理结果: {feedback.processing_result or ''}"

            fee = FeeService.create_fee_from_feedback(
                project_id=project_id,
                amount=estimated_amount,
                fee_type=fee_type,
                feedback_id=feedback_id,
                problem_id=problem.id,
                inherited_notes=inherited_notes
            )

            if feedback:
                feedback.related_fee_id = fee.id

            result["fee"] = fee
            result["message"] = f"问题单创建成功，已自动创建关联的待确认费用"

            StatusChangeService.record_change(
                "fee", fee.id, "status",
                None, FeeStatus.PENDING.value,
                created_by, f"由问题单自动创建"
            )

        return result

    @staticmethod
    def get_problems_by_project(project_id: str) -> List[ProblemRecord]:
        return db.filter("problem", project_id=project_id)

    @staticmethod
    def resolve_problem(problem_id: str, resolved_by: str) -> ProblemRecord:
        problem = db.get("problem", problem_id)
        if not problem:
            raise StateTransitionError(ErrorCode.PROJECT_NOT_FOUND,
                                       f"问题记录 {problem_id} 不存在")

        problem.status = "resolved"
        problem.resolved_at = datetime.now()

        StatusChangeService.record_change(
            "problem", problem_id, "status", "open", "resolved",
            resolved_by, "问题已解决"
        )

        return problem


class StatusChangeService:
    @staticmethod
    def record_change(entity_type: str, entity_id: str, field_name: str,
                     old_value: str, new_value: str, changed_by: str,
                     change_reason: str = None) -> StatusChange:
        change = StatusChange(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            changed_by=changed_by,
            change_reason=change_reason
        )
        db.add("status_change", change)
        return change

    @staticmethod
    def get_changes_by_entity(entity_type: str, entity_id: str) -> List[StatusChange]:
        all_changes = db.get_all("status_change")
        filtered_changes = [
            c for c in all_changes
            if c.entity_type == entity_type and c.entity_id == entity_id
        ]
        return sorted(filtered_changes, key=lambda x: x.created_at)

    @staticmethod
    def get_all_changes() -> List[StatusChange]:
        return db.get_all("status_change")
