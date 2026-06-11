from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.models import DiscountCampaign, DiscountStatus, Role, AttachmentRecord
from backend.extensions import db
from backend.api.utils import (
    role_required, get_current_user, log_operation,
    validate_discount_transition, check_exception_rules,
    generate_campaign_no, parse_date
)

discount_bp = Blueprint('discount', __name__)

@discount_bp.route('', methods=['GET'])
@jwt_required()
def get_campaigns():
    user = get_current_user()
    status = request.args.get('status')
    keyword = request.args.get('keyword', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    query = DiscountCampaign.query

    if user.role == Role.STORE_MANAGER.value:
        query = query.filter(DiscountCampaign.created_by == user.id)

    if status:
        query = query.filter(DiscountCampaign.status == status)

    if keyword:
        query = query.filter(
            (DiscountCampaign.title.like(f'%{keyword}%')) |
            (DiscountCampaign.brand_name.like(f'%{keyword}%')) |
            (DiscountCampaign.campaign_no.like(f'%{keyword}%'))
        )

    total = query.count()
    campaigns = query.order_by(DiscountCampaign.created_at.desc())\
        .offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'total': total,
        'page': page,
        'per_page': per_page,
        'items': [c.to_dict() for c in campaigns]
    })

@discount_bp.route('/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()

    if user.role == Role.STORE_MANAGER.value and campaign.created_by != user.id:
        return jsonify({'error': '无权查看此活动'}), 403

    return jsonify(campaign.to_dict(include_details=True))

@discount_bp.route('', methods=['POST'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value)
def create_campaign():
    data = request.get_json()
    user = get_current_user()

    required_fields = ['title', 'brand_name', 'start_date', 'end_date']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'缺少必填字段: {field}'}), 400

    campaign = DiscountCampaign(
        campaign_no=generate_campaign_no(),
        title=data['title'],
        brand_name=data['brand_name'],
        store_name=user.store_name or data.get('store_name', ''),
        discount_type=data.get('discount_type'),
        discount_rate=data.get('discount_rate'),
        min_amount=data.get('min_amount'),
        start_date=parse_date(data['start_date']),
        end_date=parse_date(data['end_date']),
        description=data.get('description', ''),
        created_by=user.id,
        status=DiscountStatus.DRAFT.value
    )

    db.session.add(campaign)

    records_data = data.get('records', [])
    for rec_data in records_data:
        record = AttachmentRecord(
            campaign_id=campaign.id,
            record_type=rec_data.get('record_type'),
            title=rec_data.get('title', ''),
            content=rec_data.get('content'),
            file_url=rec_data.get('file_url'),
            created_by=user.id,
            remark=rec_data.get('remark')
        )
        db.session.add(record)

    log_operation('discount', 'create', target_id=campaign.id,
                  target_type='campaign', new_status=campaign.status,
                  detail={'title': campaign.title, 'campaign_no': campaign.campaign_no})

    db.session.commit()
    return jsonify(campaign.to_dict()), 201

@discount_bp.route('/<int:campaign_id>', methods=['PUT'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value, Role.OPERATION_SUPERVISOR.value)
def update_campaign(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json()

    if user.role == Role.STORE_MANAGER.value and campaign.created_by != user.id:
        return jsonify({'error': '无权修改此活动'}), 403

    if campaign.status not in [DiscountStatus.DRAFT.value, DiscountStatus.REJECTED.value]:
        return jsonify({'error': '当前状态不允许修改'}), 400

    old_status = campaign.status

    if 'title' in data:
        campaign.title = data['title']
    if 'brand_name' in data:
        campaign.brand_name = data['brand_name']
    if 'discount_type' in data:
        campaign.discount_type = data['discount_type']
    if 'discount_rate' in data:
        campaign.discount_rate = data['discount_rate']
    if 'min_amount' in data:
        campaign.min_amount = data['min_amount']
    if 'start_date' in data:
        campaign.start_date = parse_date(data['start_date'])
    if 'end_date' in data:
        campaign.end_date = parse_date(data['end_date'])
    if 'description' in data:
        campaign.description = data['description']

    exceptions = check_exception_rules(campaign=campaign)
    if exceptions:
        campaign.exception_reason = '; '.join(exceptions)
    else:
        campaign.exception_reason = None

    log_operation('discount', 'update', target_id=campaign.id,
                  target_type='campaign', old_status=old_status,
                  new_status=campaign.status, detail=data)

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/submit', methods=['POST'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value)
def submit_campaign(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json() or {}

    if campaign.created_by != user.id:
        return jsonify({'error': '无权提交此活动'}), 403

    old_status = campaign.status
    new_status = DiscountStatus.PENDING_REVIEW.value

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    exceptions = check_exception_rules(campaign=campaign)
    if exceptions and not data.get('confirm_exception', False):
        return jsonify({
            'error': '存在异常项，请确认后提交',
            'exceptions': exceptions,
            'require_confirm': True
        }), 400

    campaign.status = new_status
    if exceptions:
        campaign.exception_reason = '; '.join(exceptions)

    log_operation('discount', 'submit', target_id=campaign.id,
                  target_type='campaign', old_status=old_status,
                  new_status=new_status,
                  detail={'exceptions': exceptions, 'confirmed': data.get('confirm_exception', False)})

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/start-review', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value)
def start_review(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()

    old_status = campaign.status
    new_status = DiscountStatus.REVIEWING.value

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    campaign.status = new_status
    campaign.reviewed_by = user.id

    log_operation('discount', 'start_review', target_id=campaign.id,
                  target_type='campaign', old_status=old_status, new_status=new_status)

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/review', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value)
def review_campaign(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json()

    action = data.get('action')
    comment = data.get('comment', '')

    action_map = {
        'approve': DiscountStatus.APPROVED.value,
        'reject': DiscountStatus.REJECTED.value,
        'raise_exception': DiscountStatus.EXCEPTION.value,
        'send_back': DiscountStatus.PENDING_REVIEW.value
    }

    if action not in action_map:
        return jsonify({'error': '无效的操作'}), 400

    old_status = campaign.status
    new_status = action_map[action]

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    campaign.status = new_status
    campaign.reviewed_by = user.id
    campaign.review_comment = comment

    if action == 'reject':
        campaign.reject_reason = comment
    elif action == 'raise_exception':
        campaign.exception_reason = comment or '审核中发现异常'

    log_operation('discount', f'review_{action}', target_id=campaign.id,
                  target_type='campaign', old_status=old_status, new_status=new_status,
                  detail={'comment': comment})

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/approve', methods=['POST'])
@jwt_required()
@role_required(Role.INVESTMENT_MANAGER.value)
def approve_campaign(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json() or {}
    comment = data.get('comment', '')

    old_status = campaign.status
    new_status = DiscountStatus.APPROVED.value

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    campaign.status = new_status
    campaign.approved_by = user.id
    campaign.approval_comment = comment

    log_operation('discount', 'approve', target_id=campaign.id,
                  target_type='campaign', old_status=old_status, new_status=new_status,
                  detail={'comment': comment})

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/reject', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def reject_campaign(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json()
    reason = data.get('reason', '')

    if not reason:
        return jsonify({'error': '请填写退回原因'}), 400

    old_status = campaign.status
    new_status = DiscountStatus.REJECTED.value

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    campaign.status = new_status
    campaign.reject_reason = reason

    log_operation('discount', 'reject', target_id=campaign.id,
                  target_type='campaign', old_status=old_status, new_status=new_status,
                  detail={'reason': reason})

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/raise-exception', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def raise_exception(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json()
    reason = data.get('reason', '')

    if not reason:
        return jsonify({'error': '请填写异常原因'}), 400

    old_status = campaign.status
    new_status = DiscountStatus.EXCEPTION.value

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    campaign.status = new_status
    campaign.exception_reason = reason

    log_operation('discount', 'raise_exception', target_id=campaign.id,
                  target_type='campaign', old_status=old_status, new_status=new_status,
                  detail={'reason': reason})

    db.session.commit()
    return jsonify({
        'message': '异常已触发，相关人员已收到提醒',
        'campaign': campaign.to_dict()
    })

@discount_bp.route('/<int:campaign_id>/resolve-exception', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def resolve_exception(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json()

    target_status = data.get('target_status')
    comment = data.get('comment', '')

    if campaign.status != DiscountStatus.EXCEPTION.value:
        return jsonify({'error': '当前状态不是异常状态'}), 400

    valid_targets = [
        DiscountStatus.PENDING_REVIEW.value,
        DiscountStatus.REVIEWING.value,
        DiscountStatus.REJECTED.value,
        DiscountStatus.APPROVED.value
    ]

    if target_status not in valid_targets:
        return jsonify({'error': f'无效的目标状态，可选: {valid_targets}'}), 400

    old_status = campaign.status
    new_status = target_status

    valid, error = validate_discount_transition(old_status, new_status, user.role)
    if not valid:
        return jsonify({'error': error}), 400

    campaign.status = new_status
    if target_status not in [DiscountStatus.REJECTED.value, DiscountStatus.APPROVED.value]:
        campaign.exception_reason = None

    log_operation('discount', 'resolve_exception', target_id=campaign.id,
                  target_type='campaign', old_status=old_status, new_status=new_status,
                  detail={'target_status': target_status, 'comment': comment})

    db.session.commit()
    return jsonify(campaign.to_dict())

@discount_bp.route('/<int:campaign_id>/records', methods=['POST'])
@jwt_required()
def add_record(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    user = get_current_user()
    data = request.get_json()

    record = AttachmentRecord(
        campaign_id=campaign.id,
        record_type=data.get('record_type'),
        title=data.get('title', ''),
        content=data.get('content'),
        file_url=data.get('file_url'),
        created_by=user.id,
        remark=data.get('remark')
    )

    db.session.add(record)
    log_operation('discount', 'add_record', target_id=campaign.id,
                  target_type='campaign',
                  detail={'record_title': record.title, 'record_type': record.record_type})

    db.session.commit()
    return jsonify(record.to_dict()), 201

@discount_bp.route('/<int:campaign_id>/records', methods=['GET'])
@jwt_required()
def get_records(campaign_id):
    campaign = DiscountCampaign.query.get_or_404(campaign_id)
    records = AttachmentRecord.query.filter_by(campaign_id=campaign.id).order_by(
        AttachmentRecord.created_at.desc()
    ).all()
    return jsonify([r.to_dict() for r in records])

@discount_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    user = get_current_user()
    query = DiscountCampaign.query

    if user.role == Role.STORE_MANAGER.value:
        query = query.filter(DiscountCampaign.created_by == user.id)

    stats = {
        'total': query.count(),
        'draft': query.filter_by(status=DiscountStatus.DRAFT.value).count(),
        'pending_review': query.filter_by(status=DiscountStatus.PENDING_REVIEW.value).count(),
        'reviewing': query.filter_by(status=DiscountStatus.REVIEWING.value).count(),
        'approved': query.filter_by(status=DiscountStatus.APPROVED.value).count(),
        'rejected': query.filter_by(status=DiscountStatus.REJECTED.value).count(),
        'exception': query.filter_by(status=DiscountStatus.EXCEPTION.value).count()
    }

    return jsonify(stats)
