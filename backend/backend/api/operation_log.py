from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.models import OperationLog, Role
from backend.api.utils import role_required, get_current_user

log_bp = Blueprint('operation_log', __name__)

@log_bp.route('', methods=['GET'])
@jwt_required()
def get_logs():
    user = get_current_user()
    module = request.args.get('module')
    operation = request.args.get('operation')
    target_id = request.args.get('target_id', type=int)
    target_type = request.args.get('target_type')
    operator_role = request.args.get('operator_role')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = OperationLog.query

    if module:
        query = query.filter(OperationLog.module == module)
    if operation:
        query = query.filter(OperationLog.operation == operation)
    if target_id:
        query = query.filter(OperationLog.target_id == target_id)
    if target_type:
        query = query.filter(OperationLog.target_type == target_type)
    if operator_role:
        query = query.filter(OperationLog.operator_role == operator_role)

    total = query.count()
    logs = query.order_by(OperationLog.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'total': total,
        'page': page,
        'per_page': per_page,
        'items': [l.to_dict() for l in logs]
    })

@log_bp.route('/campaign/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign_logs(campaign_id):
    logs = OperationLog.query.filter(
        (OperationLog.target_id == campaign_id) &
        (OperationLog.target_type == 'campaign')
    ).order_by(OperationLog.created_at.desc()).all()
    return jsonify([l.to_dict() for l in logs])

@log_bp.route('/price-report/<int:report_id>', methods=['GET'])
@jwt_required()
def get_price_report_logs(report_id):
    logs = OperationLog.query.filter(
        (OperationLog.target_id == report_id) &
        (OperationLog.target_type == 'price_report')
    ).order_by(OperationLog.created_at.desc()).all()
    return jsonify([l.to_dict() for l in logs])

@log_bp.route('/my-logs', methods=['GET'])
@jwt_required()
def get_my_logs():
    user = get_current_user()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = OperationLog.query.filter_by(operator_id=user.id)
    total = query.count()
    logs = query.order_by(OperationLog.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'total': total,
        'page': page,
        'per_page': per_page,
        'items': [l.to_dict() for l in logs]
    })
