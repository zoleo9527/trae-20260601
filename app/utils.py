from typing import Any, Optional
from app.constants import ErrorCode, ERROR_MESSAGES, ROLE_NAMES


def success_response(data: Any = None, message: str = None) -> dict:
    return {
        "code": ErrorCode.SUCCESS.value,
        "message": message or ERROR_MESSAGES[ErrorCode.SUCCESS],
        "data": data
    }


def error_response(error_code: ErrorCode, message: str = None, data: Any = None) -> dict:
    return {
        "code": error_code.value,
        "message": message or ERROR_MESSAGES.get(error_code, "未知错误"),
        "data": data
    }


def get_role_name(role) -> str:
    if not role:
        return ""
    return ROLE_NAMES.get(role, str(role))


def generate_order_no(store_code: str) -> str:
    from datetime import datetime
    import random
    date_str = datetime.now().strftime("%Y%m%d")
    rand_suffix = ''.join([str(random.randint(0, 9)) for _ in range(4)])
    return f"DD{store_code}{date_str}{rand_suffix}"


def generate_delivery_no() -> str:
    from datetime import datetime
    import random
    date_str = datetime.now().strftime("%Y%m%d")
    rand_suffix = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    return f"PH{date_str}{rand_suffix}"
