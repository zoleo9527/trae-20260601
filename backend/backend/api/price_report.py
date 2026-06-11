from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.models import PriceReport, PriceReportStatus, Role, DiscountCampaign, DiscountStatus
from backend.extensions import db
from backend.api.utils import (
    role_required, get_current_user, log_operation,
    validate_price_report_transition, check_exception_rules,
    generate_report_no, parse_date
)

price_report_bp = Blueprint('price_report', __name__)

@price_report_bp.route('', methods=['GET'])
@jwt_required()
def get_price_reports():
    user = get_current_user()
    status = request.args.get('status')
    campaign_id = request.args.get('campaign_id', type=int)
    keyword = request.args.get('keyword', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    query = PriceReport.query

    if user.role == Role.STORE_MANAGER.value:
        query = query.filter(PriceReport.created_by == user.id)

    if status:
        query = query.filter(PriceReport.status == status)

    if campaign_id:
        query = query.filter(PriceReport.campaign_id == campaign_id)

    if keyword:
        query = query.join(DiscountCampaign).filter(
            (PriceReport.product_name.like(f'%{keyword}%')) |
            (PriceReport.product_code.like(f'%{keyword}%')) |
            (PriceReport.report_no.like(f'%{keyword}%')) |
            (DiscountCampaign.title.like(f'%{keyword}%'))
        )

    total = query.count()
    reports = query.order_by(PriceReport.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'total': total,
        'page': page,
        'per_page': per_page,
        'items': [r.to_dict() for r in reports]
    })

@price_report_bp.route('/<int:report_id>', methods=['GET'])
@jwt_required()
def get_price_report(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()

    if user.role == Role.STORE_MANAGER.value and report.created_by != user.id:
        return jsonify({'error': '无权查看此报备'}), 403

    return jsonify(report.to_dict())

@price_report_bp.route('', methods=['POST'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value)
def create_price_report():
    data = request.get_json()
    user = get_current_user()

    required_fields = ['campaign_id', 'product_name', 'original_price', 'discount_price']
    for field in required_fields:
        if field not in data or data[field] is None:
            return jsonify({'error': f'缺少必填字段: {field}'}), 400

    campaign = DiscountCampaign.query.get(data['campaign_id'])
    if not campaign:
        return jsonify({'error': '关联的折扣活动不存在'}), 404

    if campaign.created_by != user.id:
        return jsonify({'error': '只能为自己创建的活动添加价格报备'}), 403

    if campaign.status == DiscountStatus.ARCHIVED.value:
        return jsonify({'error': '已归档的活动不能添加报备'}), 400

    original_price = float(data['original_price'])
    discount_price = float(data['discount_price'])
    discount_rate = data.get('discount_rate')
    if not discount_rate and original_price > 0:
        discount_rate = round(discount_price / original_price, 4)

    report = PriceReport(
        report_no=generate_report_no(),
        campaign_id=data['campaign_id'],
        product_name=data['product_name'],
        product_code=data.get('product_code'),
        original_price=original_price,
        discount_price=discount_price,
        discount_rate=discount_rate,
        report_date=parse_date(data.get('report_date')),
        created_by=user.id,
        status=PriceReportStatus.PENDING.value
    )

    exceptions = check_exception_rules(price_report=report)
    if exceptions:
        report.exception_reason = '; '.join(exceptions)

    db.session.add(report)

    log_operation('price_report', 'create', target_id=report.id,
                  target_type='price_report', new_status=report.status,
                  detail={'product_name': report.product_name, 'report_no': report.report_no})

    db.session.commit()
    return jsonify(report.to_dict()), 201

@price_report_bp.route('/<int:report_id>', methods=['PUT'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value)
def update_price_report(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()
    data = request.get_json()

    if report.created_by != user.id:
        return jsonify({'error': '无权修改此报备'}), 403

    if report.status not in [PriceReportStatus.PENDING.value, PriceReportStatus.REJECTED.value]:
        return jsonify({'error': '当前状态不允许修改'}), 400

    old_status = report.status

    if 'product_name' in data:
        report.product_name = data['product_name']
    if 'product_code' in data:
        report.product_code = data['product_code']
    if 'original_price' in data:
        report.original_price = float(data['original_price'])
    if 'discount_price' in data:
        report.discount_price = float(data['discount_price'])
    if 'report_date' in data:
        report.report_date = parse_date(data['report_date'])

    if report.original_price > 0:
        report.discount_rate = round(report.discount_price / report.original_price, 4)

    exceptions = check_exception_rules(price_report=report)
    if exceptions:
        report.exception_reason = '; '.join(exceptions)
    else:
        report.exception_reason = None

    log_operation('price_report', 'update', target_id=report.id,
                  target_type='price_report', old_status=old_status,
                  new_status=report.status, detail=data)

    db.session.commit()
    return jsonify(report.to_dict())

@price_report_bp.route('/<int:report_id>/submit', methods=['POST'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value)
def submit_price_report(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()
    data = request.get_json() or {}

    if report.created_by != user.id:
        return jsonify({'error': '无权提交此报备'}), 403

    old_status = report.status
    new_status = PriceReportStatus.REPORTED.value

    valid, error = validate_price_report_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    exceptions = check_exception_rules(price_report=report)
    if exceptions and not data.get('confirm_exception', False):
        return jsonify({
            'error': '存在异常项，请确认后提交',
            'exceptions': exceptions,
            'require_confirm': True
        }), 400

    report.status = new_status
    if exceptions:
        report.exception_reason = '; '.join(exceptions)

    log_operation('price_report', 'submit', target_id=report.id,
                  target_type='price_report', old_status=old_status,
                  new_status=new_status,
                  detail={'exceptions': exceptions, 'confirmed': data.get('confirm_exception', False)})

    db.session.commit()
    return jsonify(report.to_dict())

@price_report_bp.route('/<int:report_id>/verify', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value)
def verify_price_report(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()
    data = request.get_json() or {}
    comment = data.get('comment', '')

    old_status = report.status
    new_status = PriceReportStatus.VERIFIED.value

    valid, error = validate_price_report_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    report.status = new_status
    report.verified_by = user.id
    report.verify_comment = comment

    log_operation('price_report', 'verify', target_id=report.id,
                  target_type='price_report', old_status=old_status,
                  new_status=new_status, detail={'comment': comment})

    db.session.commit()
    return jsonify(report.to_dict())

@price_report_bp.route('/<int:report_id>/reject', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def reject_price_report(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()
    data = request.get_json()
    reason = data.get('reason', '')

    if not reason:
        return jsonify({'error': '请填写退回原因'}), 400

    old_status = report.status
    new_status = PriceReportStatus.REJECTED.value

    valid, error = validate_price_report_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    report.status = new_status
    report.reject_reason = reason
    report.verified_by = user.id

    log_operation('price_report', 'reject', target_id=report.id,
                  target_type='price_report', old_status=old_status,
                  new_status=new_status, detail={'reason': reason})

    db.session.commit()
    return jsonify(report.to_dict())

@price_report_bp.route('/<int:report_id>/raise-exception', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def raise_price_exception(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()
    data = request.get_json()
    reason = data.get('reason', '')

    if not reason:
        return jsonify({'error': '请填写异常原因'}), 400

    old_status = report.status
    new_status = PriceReportStatus.EXCEPTION.value

    valid, error = validate_price_report_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    report.status = new_status
    report.exception_reason = reason

    log_operation('price_report', 'raise_exception', target_id=report.id,
                  target_type='price_report', old_status=old_status,
                  new_status=new_status, detail={'reason': reason})

    db.session.commit()
    return jsonify({
        'message': '异常已触发，相关人员已收到提醒',
        'report': report.to_dict()
    })

@price_report_bp.route('/<int:report_id>/resolve-exception', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def resolve_price_exception(report_id):
    report = PriceReport.query.get_or_404(report_id)
    user = get_current_user()
    data = request.get_json()

    target_status = data.get('target_status')
    comment = data.get('comment', '')

    if report.status != PriceReportStatus.EXCEPTION.value:
        return jsonify({'error': '当前状态不是异常状态'}), 400

    valid_targets = [
        PriceReportStatus.REPORTED.value,
        PriceReportStatus.REJECTED.value,
        PriceReportStatus.VERIFIED.value
    ]

    if target_status not in valid_targets:
        return jsonify({'error': f'无效的目标状态，可选: {valid_targets}'}), 400

    old_status = report.status
    new_status = target_status

    valid, error = validate_price_report_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    report.status = new_status
    if target_status not in [PriceReportStatus.REJECTED.value, PriceReportStatus.VERIFIED.value]:
        report.exception_reason = None

    log_operation('price_report', 'resolve_exception', target_id=report.id,
                  target_type='price_report', old_status=old_status,
                  new_status=new_status,
                  detail={'target_status': target_status, 'comment': comment})

    db.session.commit()
    return jsonify(report.to_dict())

@price_report_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    user = get_current_user()
    query = PriceReport.query

    if user.role == Role.STORE_MANAGER.value:
        query = query.filter(PriceReport.created_by == user.id)

    stats = {
        'total': query.count(),
        'pending': query.filter_by(status=PriceReportStatus.PENDING.value).count(),
        'reported': query.filter_by(status=PriceReportStatus.REPORTED.value).count(),
        'verified': query.filter_by(status=PriceReportStatus.VERIFIED.value).count(),
        'rejected': query.filter_by(status=PriceReportStatus.REJECTED.value).count(),
        'exception': query.filter_by(status=PriceReportStatus.EXCEPTION.value).count()
    }

    return jsonify(stats)

@price_report_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_price():
    data = request.get_json()
    original_price = data.get('original_price')
    discount_price = data.get('discount_price')

    if original_price is None or discount_price is None:
        return jsonify({'error': '请提供原价和折扣价'}), 400

    temp_report = PriceReport(
        original_price=float(original_price),
        discount_price=float(discount_price)
    )
    exceptions = check_exception_rules(price_report=temp_report)

    discount_rate = None
    if original_price > 0:
        discount_rate = round(float(discount_price) / float(original_price), 4)

    return jsonify({
        'valid': len(exceptions) == 0,
        'exceptions': exceptions,
        'calculated_rate': discount_rate
    })
