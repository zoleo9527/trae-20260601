from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.models import DiscountCampaign, DiscountStatus, PriceReport, PriceReportStatus, Role
from backend.extensions import db
from backend.api.utils import (
    role_required, get_current_user, log_operation,
    validate_discount_transition, validate_price_report_transition,
    check_exception_rules
)

batch_bp = Blueprint('batch', __name__)

@batch_bp.route('/discount/submit', methods=['POST'])
@jwt_required()
@role_required(Role.STORE_MANAGER.value)
def batch_submit_campaigns():
    data = request.get_json()
    ids = data.get('ids', [])
    confirm_exception = data.get('confirm_exception', False)
    user = get_current_user()

    if not ids:
        return jsonify({'error': '请选择要提交的活动'}), 400

    success_count = 0
    failed_count = 0
    exception_items = []
    normal_success_ids = []
    results = []

    for campaign_id in ids:
        try:
            campaign = DiscountCampaign.query.get(campaign_id)
            if not campaign:
                results.append({'id': campaign_id, 'success': False, 'error': '活动不存在'})
                failed_count += 1
                continue

            if campaign.created_by != user.id:
                results.append({'id': campaign_id, 'success': False, 'error': '无权提交此活动'})
                failed_count += 1
                continue

            old_status = campaign.status
            new_status = DiscountStatus.PENDING_REVIEW.value

            valid, error = validate_discount_transition(old_status, new_status, user.role)
            if not valid:
                results.append({'id': campaign_id, 'success': False, 'error': error})
                failed_count += 1
                continue

            exceptions = check_exception_rules(campaign=campaign)
            if exceptions and not confirm_exception:
                exception_items.append({
                    'id': campaign_id,
                    'title': campaign.title,
                    'exceptions': exceptions
                })
                results.append({'id': campaign_id, 'success': False, 'error': '存在异常项，需确认后提交', 'exceptions': exceptions, 'needs_confirm': True})
                continue

            if confirm_exception and exceptions:
                new_status = DiscountStatus.EXCEPTION.value
                valid, error = validate_discount_transition(old_status, new_status, user.role)
                if not valid:
                    results.append({'id': campaign_id, 'success': False, 'error': error})
                    failed_count += 1
                    continue
                campaign.exception_reason = '; '.join(exceptions)

            campaign.status = new_status

            log_operation('discount', 'batch_submit', target_id=campaign.id,
                          target_type='campaign', old_status=old_status,
                          new_status=new_status,
                          detail={'exceptions': exceptions, 'confirmed': confirm_exception})
            results.append({'id': campaign_id, 'success': True})
            success_count += 1
            if not exceptions:
                normal_success_ids.append(campaign_id)
        except Exception as e:
            results.append({'id': campaign_id, 'success': False, 'error': str(e)})
            failed_count += 1

    db.session.commit()

    if exception_items and not confirm_exception:
        return jsonify({
            'success_count': success_count,
            'failed_count': failed_count,
            'normal_success_ids': normal_success_ids,
            'results': results,
            'require_confirm': True,
            'exception_items': exception_items
        }), 400

    return jsonify({
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results
    })

@batch_bp.route('/discount/approve', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def batch_approve_campaigns():
    data = request.get_json()
    ids = data.get('ids', [])
    comment = data.get('comment', '')
    user = get_current_user()

    if not ids:
        return jsonify({'error': '请选择要审批的活动'}), 400

    success_count = 0
    failed_count = 0
    results = []

    for campaign_id in ids:
        try:
            campaign = DiscountCampaign.query.get(campaign_id)
            if not campaign:
                results.append({'id': campaign_id, 'success': False, 'error': '活动不存在'})
                failed_count += 1
                continue

            old_status = campaign.status
            new_status = DiscountStatus.APPROVED.value

            valid, error = validate_discount_transition(old_status, new_status, user.role)
            if not valid:
                results.append({'id': campaign_id, 'success': False, 'error': error})
                failed_count += 1
                continue

            campaign.status = new_status
            if user.role == Role.INVESTMENT_MANAGER.value:
                campaign.approved_by = user.id
                campaign.approval_comment = comment
            else:
                campaign.reviewed_by = user.id
                campaign.review_comment = comment

            log_operation('discount', 'batch_approve', target_id=campaign.id,
                          target_type='campaign', old_status=old_status,
                          new_status=new_status, detail={'comment': comment, 'approver_role': user.role})
            results.append({'id': campaign_id, 'success': True})
            success_count += 1
        except Exception as e:
            results.append({'id': campaign_id, 'success': False, 'error': str(e)})
            failed_count += 1

    db.session.commit()
    return jsonify({
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results
    })

@batch_bp.route('/discount/reject', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def batch_reject_campaigns():
    data = request.get_json()
    ids = data.get('ids', [])
    reason = data.get('reason', '')
    user = get_current_user()

    if not ids:
        return jsonify({'error': '请选择要退回的活动'}), 400
    if not reason:
        return jsonify({'error': '请填写退回原因'}), 400

    success_count = 0
    failed_count = 0
    unauthorized_items = []
    results = []

    for campaign_id in ids:
        try:
            campaign = DiscountCampaign.query.get(campaign_id)
            if not campaign:
                results.append({'id': campaign_id, 'success': False, 'error': '活动不存在'})
                failed_count += 1
                continue

            if (campaign.status == DiscountStatus.APPROVED.value
                    and user.role != Role.INVESTMENT_MANAGER.value):
                unauthorized_items.append({
                    'id': campaign_id,
                    'title': campaign.title,
                    'reason': '营运督导无权退回已审批通过的活动，需招商经理操作'
                })
                results.append({'id': campaign_id, 'success': False,
                                'error': '营运督导无权退回已审批通过的活动',
                                'unauthorized': True})
                continue

            old_status = campaign.status
            new_status = DiscountStatus.REJECTED.value

            valid, error = validate_discount_transition(old_status, new_status, user.role)
            if not valid:
                results.append({'id': campaign_id, 'success': False, 'error': error})
                failed_count += 1
                continue

            campaign.status = new_status
            campaign.reject_reason = reason

            log_operation('discount', 'batch_reject', target_id=campaign.id,
                          target_type='campaign', old_status=old_status,
                          new_status=new_status, detail={'reason': reason})
            results.append({'id': campaign_id, 'success': True})
            success_count += 1
        except Exception as e:
            results.append({'id': campaign_id, 'success': False, 'error': str(e)})
            failed_count += 1

    db.session.commit()

    resp = {
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results
    }
    if unauthorized_items:
        resp['unauthorized_count'] = len(unauthorized_items)
        resp['unauthorized_items'] = unauthorized_items
    return jsonify(resp)

@batch_bp.route('/discount/raise-exception', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def batch_raise_exception():
    data = request.get_json()
    ids = data.get('ids', [])
    reason = data.get('reason', '')
    user = get_current_user()

    if not ids:
        return jsonify({'error': '请选择要标记异常的活动'}), 400
    if not reason:
        return jsonify({'error': '请填写异常原因'}), 400

    success_count = 0
    failed_count = 0
    results = []

    for campaign_id in ids:
        try:
            campaign = DiscountCampaign.query.get(campaign_id)
            if not campaign:
                results.append({'id': campaign_id, 'success': False, 'error': '活动不存在'})
                failed_count += 1
                continue

            old_status = campaign.status
            new_status = DiscountStatus.EXCEPTION.value

            valid, error = validate_discount_transition(old_status, new_status, user.role)
            if not valid:
                results.append({'id': campaign_id, 'success': False, 'error': error})
                failed_count += 1
                continue

            campaign.status = new_status
            campaign.exception_reason = reason

            log_operation('discount', 'batch_raise_exception', target_id=campaign.id,
                          target_type='campaign', old_status=old_status,
                          new_status=new_status, detail={'reason': reason})
            results.append({'id': campaign_id, 'success': True})
            success_count += 1
        except Exception as e:
            results.append({'id': campaign_id, 'success': False, 'error': str(e)})
            failed_count += 1

    db.session.commit()
    return jsonify({
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results,
        'message': f'已批量触发 {success_count} 条异常提醒'
    })

@batch_bp.route('/price-report/verify', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value)
def batch_verify_reports():
    data = request.get_json()
    ids = data.get('ids', [])
    comment = data.get('comment', '')
    user = get_current_user()

    if not ids:
        return jsonify({'error': '请选择要核实的报备'}), 400

    success_count = 0
    failed_count = 0
    results = []

    for report_id in ids:
        try:
            report = PriceReport.query.get(report_id)
            if not report:
                results.append({'id': report_id, 'success': False, 'error': '报备不存在'})
                failed_count += 1
                continue

            old_status = report.status
            new_status = PriceReportStatus.VERIFIED.value

            valid, error = validate_price_report_transition(old_status, new_status, user.role)
            if not valid:
                results.append({'id': report_id, 'success': False, 'error': error})
                failed_count += 1
                continue

            report.status = new_status
            report.verified_by = user.id
            report.verify_comment = comment

            log_operation('price_report', 'batch_verify', target_id=report.id,
                          target_type='price_report', old_status=old_status,
                          new_status=new_status, detail={'comment': comment})
            results.append({'id': report_id, 'success': True})
            success_count += 1
        except Exception as e:
            results.append({'id': report_id, 'success': False, 'error': str(e)})
            failed_count += 1

    db.session.commit()
    return jsonify({
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results
    })

@batch_bp.route('/price-report/reject', methods=['POST'])
@jwt_required()
@role_required(Role.OPERATION_SUPERVISOR.value, Role.INVESTMENT_MANAGER.value)
def batch_reject_reports():
    data = request.get_json()
    ids = data.get('ids', [])
    reason = data.get('reason', '')
    user = get_current_user()

    if not ids:
        return jsonify({'error': '请选择要退回的报备'}), 400
    if not reason:
        return jsonify({'error': '请填写退回原因'}), 400

    success_count = 0
    failed_count = 0
    results = []

    for report_id in ids:
        try:
            report = PriceReport.query.get(report_id)
            if not report:
                results.append({'id': report_id, 'success': False, 'error': '报备不存在'})
                failed_count += 1
                continue

            old_status = report.status
            new_status = PriceReportStatus.REJECTED.value

            valid, error = validate_price_report_transition(old_status, new_status, user.role)
            if not valid:
                results.append({'id': report_id, 'success': False, 'error': error})
                failed_count += 1
                continue

            report.status = new_status
            report.reject_reason = reason
            report.verified_by = user.id

            log_operation('price_report', 'batch_reject', target_id=report.id,
                          target_type='price_report', old_status=old_status,
                          new_status=new_status, detail={'reason': reason})
            results.append({'id': report_id, 'success': True})
            success_count += 1
        except Exception as e:
            results.append({'id': report_id, 'success': False, 'error': str(e)})
            failed_count += 1

    db.session.commit()
    return jsonify({
        'success_count': success_count,
        'failed_count': failed_count,
        'results': results
    })
