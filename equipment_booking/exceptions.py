from typing import Optional

from ninja.errors import HttpError


class ErrorCode:
    OK = 'OK'
    INVALID_PARAMS = 'INVALID_PARAMS'
    ORDER_NOT_FOUND = 'ORDER_NOT_FOUND'
    INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION'
    EQUIPMENT_NOT_AVAILABLE = 'EQUIPMENT_NOT_AVAILABLE'
    ASSESSMENT_REQUIRED = 'ASSESSMENT_REQUIRED'
    EQUIPMENT_REQUIRED = 'EQUIPMENT_REQUIRED'
    SCHEDULE_REQUIRED = 'SCHEDULE_REQUIRED'
    DUPLICATE_REQUEST = 'DUPLICATE_REQUEST'
    ALERT_NOT_FOUND = 'ALERT_NOT_FOUND'
    PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND'
    EQUIPMENT_NOT_FOUND = 'EQUIPMENT_NOT_FOUND'
    PERMISSION_DENIED = 'PERMISSION_DENIED'
    ROLE_MISMATCH = 'ROLE_MISMATCH'
    ABNORMAL_USAGE = 'ABNORMAL_USAGE'
    STUCK_ORDER = 'STUCK_ORDER'
    INTERNAL_ERROR = 'INTERNAL_ERROR'


ERROR_HTTP_MAP = {
    ErrorCode.OK: 200,
    ErrorCode.INVALID_PARAMS: 400,
    ErrorCode.ORDER_NOT_FOUND: 404,
    ErrorCode.INVALID_STATUS_TRANSITION: 409,
    ErrorCode.EQUIPMENT_NOT_AVAILABLE: 409,
    ErrorCode.ASSESSMENT_REQUIRED: 422,
    ErrorCode.EQUIPMENT_REQUIRED: 422,
    ErrorCode.SCHEDULE_REQUIRED: 422,
    ErrorCode.DUPLICATE_REQUEST: 409,
    ErrorCode.ALERT_NOT_FOUND: 404,
    ErrorCode.PATIENT_NOT_FOUND: 404,
    ErrorCode.EQUIPMENT_NOT_FOUND: 404,
    ErrorCode.PERMISSION_DENIED: 403,
    ErrorCode.ROLE_MISMATCH: 403,
    ErrorCode.ABNORMAL_USAGE: 422,
    ErrorCode.STUCK_ORDER: 422,
    ErrorCode.INTERNAL_ERROR: 500,
}


class BizError(HttpError):
    def __init__(self, code: str, message: str, detail: Optional[dict] = None):
        self.biz_code = code
        self.biz_message = message
        self.biz_detail = detail or {}
        status_code = ERROR_HTTP_MAP.get(code, 500)
        super().__init__(status_code, message)
