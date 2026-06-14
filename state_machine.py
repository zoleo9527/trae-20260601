from typing import Dict, Set, Optional
from models import OrderStatus, FeedbackStatus, FeeStatus, RoleType, ErrorCode


class StateTransitionError(Exception):
    def __init__(self, error_code: ErrorCode, message: str, details: Optional[dict] = None):
        self.error_code = error_code
        self.message = message
        self.details = details or {}
        super().__init__(message)

    def to_dict(self):
        from datetime import datetime
        return {
            "code": self.error_code.value,
            "message": self.message,
            "details": self.details,
            "timestamp": datetime.now().isoformat()
        }


class StateMachine:
    PROJECT_TRANSITIONS: Dict[OrderStatus, Set[OrderStatus]] = {
        OrderStatus.PENDING: {OrderStatus.PROCESSING, OrderStatus.PROBLEM},
        OrderStatus.PROCESSING: {OrderStatus.COMPLETED, OrderStatus.PROBLEM},
        OrderStatus.PROBLEM: {OrderStatus.PROCESSING, OrderStatus.COMPLETED},
        OrderStatus.COMPLETED: set(),
    }

    FEEDBACK_TRANSITIONS: Dict[FeedbackStatus, Set[FeedbackStatus]] = {
        FeedbackStatus.PENDING: {FeedbackStatus.PROCESSING},
        FeedbackStatus.PROCESSING: {FeedbackStatus.HANDLED, FeedbackStatus.PENDING},
        FeedbackStatus.HANDLED: set(),
    }

    FEE_TRANSITIONS: Dict[FeeStatus, Set[FeeStatus]] = {
        FeeStatus.PENDING: {FeeStatus.CONFIRMED, FeeStatus.REJECTED},
        FeeStatus.CONFIRMED: set(),
        FeeStatus.REJECTED: {FeeStatus.PENDING, FeeStatus.CONFIRMED},
    }

    ROLE_PERMISSIONS: Dict[RoleType, Set[str]] = {
        RoleType.PROJECT_MANAGER: {
            "create_project", "view_project", "update_project",
            "handle_feedback", "view_feedback",
            "confirm_fee", "view_fee", "reject_fee",
            "reschedule", "supplement", "reject",
            "view_all_status_changes"
        },
        RoleType.TRANSLATOR: {
            "view_project", "update_project_status",
            "view_feedback", "add_feedback_notes",
            "view_fee", "reschedule_request", "supplement_request"
        },
        RoleType.REVIEWER: {
            "view_project", "view_feedback", "add_feedback_notes",
            "view_fee", "confirm_fee", "reject_fee",
            "reschedule_request", "supplement_request"
        },
    }

    @classmethod
    def can_transition_project(cls, current: OrderStatus, target: OrderStatus) -> bool:
        return target in cls.PROJECT_TRANSITIONS.get(current, set())

    @classmethod
    def can_transition_feedback(cls, current: FeedbackStatus, target: FeedbackStatus) -> bool:
        return target in cls.FEEDBACK_TRANSITIONS.get(current, set())

    @classmethod
    def can_transition_fee(cls, current: FeeStatus, target: FeeStatus) -> bool:
        return target in cls.FEE_TRANSITIONS.get(current, set())

    @classmethod
    def check_permission(cls, role: RoleType, action: str) -> bool:
        return action in cls.ROLE_PERMISSIONS.get(role, set())

    @classmethod
    def validate_project_transition(cls, current: OrderStatus, target: OrderStatus, reason: str = None):
        if not cls.can_transition_project(current, target):
            raise StateTransitionError(
                ErrorCode.INVALID_STATUS_TRANSITION,
                f"项目状态不能从 {current.value} 转换到 {target.value}",
                {"current": current.value, "target": target.value}
            )
        return True

    @classmethod
    def validate_feedback_transition(cls, current: FeedbackStatus, target: FeedbackStatus):
        if not cls.can_transition_feedback(current, target):
            raise StateTransitionError(
                ErrorCode.INVALID_STATUS_TRANSITION,
                f"反馈状态不能从 {current.value} 转换到 {target.value}",
                {"current": current.value, "target": target.value}
            )
        return True

    @classmethod
    def validate_fee_transition(cls, current: FeeStatus, target: FeeStatus):
        if not cls.can_transition_fee(current, target):
            raise StateTransitionError(
                ErrorCode.INVALID_STATUS_TRANSITION,
                f"费用状态不能从 {current.value} 转换到 {target.value}",
                {"current": current.value, "target": target.value}
            )
        return True

    @classmethod
    def validate_role_permission(cls, role: RoleType, action: str):
        if not cls.check_permission(role, action):
            raise StateTransitionError(
                ErrorCode.UNAUTHORIZED_ACCESS,
                f"角色 {role.value} 没有权限执行 {action}",
                {"role": role.value, "action": action}
            )
        return True

    @classmethod
    def get_allowed_transitions(cls, entity_type: str, current_status) -> list:
        if entity_type == "project":
            transitions = cls.PROJECT_TRANSITIONS
        elif entity_type == "feedback":
            transitions = cls.FEEDBACK_TRANSITIONS
        elif entity_type == "fee":
            transitions = cls.FEE_TRANSITIONS
        else:
            return []

        return [s.value for s in transitions.get(current_status, set())]
