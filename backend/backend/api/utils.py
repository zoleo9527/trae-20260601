from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from backend.extensions import db
from backend.models import User, OperationLog, Role, DiscountStatus, PriceReportStatus
from datetime import datetime
import json

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            if user.role not in allowed_roles:
                return jsonify({'error': '权限不足，无法执行此操作'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user():
    current_user_id = get_jwt_identity()
    if current_user_id is not None:
        current_user_id = int(current_user_id)
    return User.query.get(current_user_id)

def log_operation(module, operation, target_id=None, target_type=None,
                  old_status=None, new_status=None, detail=None, operator=None):
    if operator:
        user = operator
    else:
        try:
            user = get_current_user()
        except RuntimeError:
            user = None
    
    if not user:
        return
    
    log = OperationLog(
        module=module,
        operation=operation,
        target_id=target_id,
        target_type=target_type,
        operator_id=user.id,
        operator_role=user.role,
        old_status=old_status,
        new_status=new_status,
        detail=detail if isinstance(detail, str) else json.dumps(detail, ensure_ascii=False) if detail else None,
        ip_address=request.remote_addr
    )
    db.session.add(log)

def validate_discount_transition(old_status, new_status, user_role):
    valid_transitions = {
        DiscountStatus.DRAFT.value: {
            'allowed_roles': [Role.STORE_MANAGER.value],
            'to': [DiscountStatus.PENDING_REVIEW.value, DiscountStatus.DRAFT.value]
        },
        DiscountStatus.PENDING_REVIEW.value: {
            'allowed_roles': [Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value],
            'to': [DiscountStatus.REVIEWING.value, DiscountStatus.REJECTED.value,
                   DiscountStatus.EXCEPTION.value, DiscountStatus.APPROVED.value]
        },
        DiscountStatus.REVIEWING.value: {
            'allowed_roles': [Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value],
            'to': [DiscountStatus.PENDING_REVIEW.value, DiscountStatus.APPROVED.value,
                   DiscountStatus.REJECTED.value, DiscountStatus.EXCEPTION.value]
        },
        DiscountStatus.APPROVED.value: {
            'allowed_roles': [Role.INVESTMENT_MANAGER.value],
            'to': [DiscountStatus.ARCHIVED.value, DiscountStatus.EXCEPTION.value,
                   DiscountStatus.REJECTED.value]
        },
        DiscountStatus.REJECTED.value: {
            'allowed_roles': [Role.STORE_MANAGER.value],
            'to': [DiscountStatus.DRAFT.value, DiscountStatus.PENDING_REVIEW.value]
        },
        DiscountStatus.EXCEPTION.value: {
            'allowed_roles': [Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value],
            'to': [DiscountStatus.PENDING_REVIEW.value, DiscountStatus.REVIEWING.value,
                   DiscountStatus.REJECTED.value, DiscountStatus.APPROVED.value]
        },
        DiscountStatus.ARCHIVED.value: {
            'allowed_roles': [Role.INVESTMENT_MANAGER.value],
            'to': [DiscountStatus.APPROVED.value]
        }
    }

    if old_status not in valid_transitions:
        return False, f'无效的状态: {old_status}'

    transition = valid_transitions[old_status]
    if user_role not in transition['allowed_roles']:
        return False, '当前角色无权限执行此状态变更'

    if new_status not in transition['to']:
        return False, f'不允许从 {old_status} 变更为 {new_status}'

    return True, None

def validate_price_report_transition(old_status, new_status, user_role):
    valid_transitions = {
        PriceReportStatus.PENDING.value: {
            'allowed_roles': [Role.STORE_MANAGER.value],
            'to': [PriceReportStatus.REPORTED.value, PriceReportStatus.PENDING.value]
        },
        PriceReportStatus.REPORTED.value: {
            'allowed_roles': [Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value],
            'to': [PriceReportStatus.VERIFIED.value, PriceReportStatus.REJECTED.value,
                   PriceReportStatus.EXCEPTION.value, PriceReportStatus.REPORTED.value]
        },
        PriceReportStatus.VERIFIED.value: {
            'allowed_roles': [Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value],
            'to': [PriceReportStatus.EXCEPTION.value, PriceReportStatus.REPORTED.value,
                   PriceReportStatus.REJECTED.value]
        },
        PriceReportStatus.REJECTED.value: {
            'allowed_roles': [Role.STORE_MANAGER.value],
            'to': [PriceReportStatus.PENDING.value, PriceReportStatus.REPORTED.value]
        },
        PriceReportStatus.EXCEPTION.value: {
            'allowed_roles': [Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value],
            'to': [PriceReportStatus.REPORTED.value, PriceReportStatus.REJECTED.value,
                   PriceReportStatus.VERIFIED.value]
        }
    }

    if old_status not in valid_transitions:
        return False, f'无效的状态: {old_status}'

    transition = valid_transitions[old_status]
    if user_role not in transition['allowed_roles']:
        return False, '当前角色无权限执行此状态变更'

    if new_status not in transition['to']:
        return False, f'不允许从 {old_status} 变更为 {new_status}'

    return True, None

def check_exception_rules(campaign=None, price_report=None):
    exceptions = []

    if campaign:
        if campaign.discount_rate and campaign.discount_rate < 0.3:
            exceptions.append('折扣率低于3折，需要特别审批')

        if campaign.start_date and campaign.end_date:
            duration = (campaign.end_date - campaign.start_date).days
            if duration > 60:
                exceptions.append('活动周期超过60天，需要复核')

        if campaign.min_amount and campaign.min_amount < 0:
            exceptions.append('满减金额不能为负数')

        if not campaign.description or len(campaign.description) < 10:
            exceptions.append('活动描述不完整')

    if price_report:
        if price_report.original_price <= 0 or price_report.discount_price <= 0:
            exceptions.append('价格不能为零或负数')

        if price_report.discount_price >= price_report.original_price:
            exceptions.append('折扣价格不能大于等于原价')

        if price_report.discount_rate:
            if price_report.discount_rate < 0.1 or price_report.discount_rate > 0.95:
                exceptions.append('折扣率异常（低于1折或高于95折）')
        else:
            calc_rate = price_report.discount_price / price_report.original_price
            if calc_rate < 0.1 or calc_rate > 0.95:
                exceptions.append('折扣率异常（低于1折或高于95折）')

    return exceptions

def generate_campaign_no():
    today = datetime.now().strftime('%Y%m%d')
    from backend.models import DiscountCampaign
    last = DiscountCampaign.query.filter(
        DiscountCampaign.campaign_no.like(f'DC{today}%')
    ).order_by(DiscountCampaign.campaign_no.desc()).first()
    if last:
        seq = int(last.campaign_no[-4:]) + 1
    else:
        seq = 1
    return f'DC{today}{seq:04d}'

def generate_report_no():
    today = datetime.now().strftime('%Y%m%d')
    from backend.models import PriceReport
    last = PriceReport.query.filter(
        PriceReport.report_no.like(f'PR{today}%')
    ).order_by(PriceReport.report_no.desc()).first()
    if last:
        seq = int(last.report_no[-4:]) + 1
    else:
        seq = 1
    return f'PR{today}{seq:04d}'

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return None
