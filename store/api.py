"""
母婴零售店 - Django Ninja API接口
包含仪表板、退换货、客户回访、审计日志、导出等核心功能
"""
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
from ninja import Router, Query, Field
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from io import BytesIO

from .models import (
    Employee, Member, Product, ProductBatch, ReturnExchange, VisitRecord,
    AuditLog, Notification, Attachment, PromotionCoupon
)

router = Router()


class MemberSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    member_id: str
    name: str
    phone: str
    member_level: str


class EmployeeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: str
    role: str
    user__username: str
    user__first_name: str
    user__last_name: str


class DashboardReturnItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    return_number: str
    member_name: str
    type: str
    status: str
    reason_category: str
    assigned_to_name: Optional[str] = None
    current_handler_role: str
    stuck_info: Optional[dict] = None
    created_at: datetime
    days_pending: int


class DashboardVisitItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    visit_number: str
    member_name: str
    type: str
    priority: str
    status: str
    purpose: str
    assigned_to_name: Optional[str] = None
    scheduled_date: datetime
    scheduled_time: Optional[datetime] = None
    stuck_info: Optional[dict] = None
    days_overdue: Optional[int] = None


class RoleSummary(BaseModel):
    role: str
    role_display: str
    total_count: int
    stuck_count: int
    max_days_pending: int
    reason_distribution: dict
    responsible_persons: List[dict]


class RecommendedTask(BaseModel):
    type: str
    id: int
    number: str
    member_name: str
    priority: str
    days_pending: int
    stuck_reason: str
    responsible_role: str
    responsible_person: Optional[dict]
    action: str


class DashboardResponse(BaseModel):
    today_returns_pending: int
    today_visits_pending: int
    stuck_returns: int
    stuck_visits: int
    returns_needing_attention: List[DashboardReturnItem]
    visits_needing_attention: List[DashboardVisitItem]
    my_pending_returns: List[DashboardReturnItem]
    my_pending_visits: List[DashboardVisitItem]
    returns_by_role: dict
    visits_by_role: dict
    statistics: dict
    returns_role_summary: dict
    visits_role_summary: dict
    recommended_queue: List[RecommendedTask]


@router.get("/dashboard", response=DashboardResponse)
def get_dashboard(request):
    """
    仪表板接口 - 展示今天应该先处理什么
    回答三个核心问题：
    1. 谁在处理（店员、店长、采购）
    2. 退换货卡在哪里
    3. 客户回访为什么还没完成
    
    新增功能：
    - 按角色分组的优先级摘要
    - 卡住原因分布统计
    - 最久未处理天数
    - 责任人名单
    - 推荐处理队列
    """
    today = timezone.now().date()

    returns = ReturnExchange.objects.select_related(
        'member', 'assigned_to', 'assigned_to__user'
    ).exclude(status__in=['completed', 'rejected'])

    visits = VisitRecord.objects.select_related(
        'member', 'assigned_to', 'assigned_to__user'
    ).filter(
        Q(scheduled_date=today) | Q(scheduled_date__lt=today),
        status__in=['pending', 'in_progress']
    )

    all_returns_list = []
    stuck_returns_count = 0
    returns_by_role_data = {
        'clerk': [],
        'manager': [],
        'purchaser': [],
    }

    for ret in returns:
        stuck_info = ret.get_stuck_info()
        item = {
            'id': ret.id,
            'return_number': ret.return_number,
            'member_name': ret.member.name,
            'type': ret.get_type_display(),
            'status': ret.get_status_display(),
            'reason_category': ret.get_reason_category_display(),
            'assigned_to_name': ret.assigned_to.user.get_full_name() if ret.assigned_to else None,
            'current_handler_role': ret.get_current_expected_handler(),
            'stuck_info': stuck_info,
            'created_at': ret.created_at,
            'days_pending': (timezone.now() - ret.created_at).days,
            'stuck_reason': ret.stuck_reason,
            'assigned_to_info': {
                'id': ret.assigned_to.id,
                'employee_id': ret.assigned_to.employee_id,
                'name': ret.assigned_to.user.get_full_name(),
                'role': ret.assigned_to.role,
            } if ret.assigned_to else None,
        }
        all_returns_list.append(item)

        if stuck_info and stuck_info.get('is_stuck'):
            stuck_returns_count += 1

        handler_role = ret.get_current_expected_handler()
        if handler_role in returns_by_role_data:
            returns_by_role_data[handler_role].append(item)

    all_visits_list = []
    stuck_visits_count = 0
    visits_by_role_data = {
        'clerk': [],
        'manager': [],
        'purchaser': [],
    }

    for visit in visits:
        stuck_info = visit.get_stuck_info()
        days_overdue = None
        if stuck_info and stuck_info.get('is_stuck'):
            days_overdue = stuck_info.get('days_overdue', 0)

        item = {
            'id': visit.id,
            'visit_number': visit.visit_number,
            'member_name': visit.member.name,
            'type': visit.get_type_display(),
            'priority': visit.get_priority_display(),
            'status': visit.get_status_display(),
            'purpose': visit.purpose,
            'assigned_to_name': visit.assigned_to.user.get_full_name() if visit.assigned_to else None,
            'scheduled_date': visit.scheduled_date,
            'scheduled_time': visit.scheduled_time,
            'stuck_info': stuck_info,
            'days_overdue': days_overdue,
            'stuck_reason': visit.stuck_reason,
            'assigned_to_info': {
                'id': visit.assigned_to.id,
                'employee_id': visit.assigned_to.employee_id,
                'name': visit.assigned_to.user.get_full_name(),
                'role': visit.assigned_to.role,
            } if visit.assigned_to else None,
        }
        all_visits_list.append(item)

        if stuck_info and stuck_info.get('is_stuck'):
            stuck_visits_count += 1

        if visit.assigned_to:
            role = visit.assigned_to.role
            if role in visits_by_role_data:
                visits_by_role_data[role].append(item)

    returns_needing_attention = sorted(
        [r for r in all_returns_list if r['stuck_info'] and r['stuck_info'].get('is_stuck')],
        key=lambda x: x['days_pending'],
        reverse=True
    )[:10]

    visits_needing_attention = sorted(
        [v for v in all_visits_list if v['stuck_info'] and v['stuck_info'].get('is_stuck')],
        key=lambda x: x['days_overdue'] or 0,
        reverse=True
    )[:10]

    my_returns = []
    my_visits = []
    current_employee = None
    if hasattr(request, 'user') and request.user.is_authenticated:
        try:
            current_employee = request.user.employee_profile
            my_returns = [
                item for item in all_returns_list
                if item['assigned_to_name'] == current_employee.user.get_full_name()
            ][:5]
            my_visits = [
                item for item in all_visits_list
                if item['assigned_to_name'] == current_employee.user.get_full_name()
            ][:5]
        except Employee.DoesNotExist:
            pass

    def build_role_summary(items, role_key, role_display):
        """构建角色摘要"""
        role_items = []
        for item in items:
            if role_key == 'assigned_to_info__role':
                if item.get('assigned_to_info') and item['assigned_to_info'].get('role') == role_display.lower():
                    role_items.append(item)
            else:
                if item.get(role_key) == role_display.lower():
                    role_items.append(item)
        
        stuck_items = [item for item in role_items if item['stuck_info'] and item['stuck_info'].get('is_stuck')]
        
        reason_distribution = {}
        for item in stuck_items:
            reason = item.get('stuck_reason') or '未说明原因'
            reason_distribution[reason] = reason_distribution.get(reason, 0) + 1
        
        responsible_persons = {}
        for item in role_items:
            if item['assigned_to_info']:
                person_id = item['assigned_to_info']['id']
                responsible_persons[person_id] = item['assigned_to_info']
        
        max_days = 0
        for item in role_items:
            if item['stuck_info'] and item['stuck_info'].get('is_stuck'):
                days = item['stuck_info'].get('days') or item['stuck_info'].get('days_overdue') or 0
                if days > max_days:
                    max_days = days

        return {
            'role': role_display.lower(),
            'role_display': role_display,
            'total_count': len(role_items),
            'stuck_count': len(stuck_items),
            'max_days_pending': max_days,
            'reason_distribution': reason_distribution,
            'responsible_persons': list(responsible_persons.values()),
        }

    returns_role_summary = {
        'clerk': build_role_summary(all_returns_list, 'current_handler_role', '店员'),
        'manager': build_role_summary(all_returns_list, 'current_handler_role', '店长'),
        'purchaser': build_role_summary(all_returns_list, 'current_handler_role', '采购'),
    }

    visits_role_summary = {
        'clerk': build_role_summary(all_visits_list, 'assigned_to_info__role', '店员'),
        'manager': build_role_summary(all_visits_list, 'assigned_to_info__role', '店长'),
        'purchaser': build_role_summary(all_visits_list, 'assigned_to_info__role', '采购'),
    }

    recommended_queue = []
    
    for ret in sorted(all_returns_list, key=lambda x: x['days_pending'], reverse=True)[:5]:
        if ret['stuck_info'] and ret['stuck_info'].get('is_stuck'):
            action = '立即处理'
        else:
            action = '尽快处理'
        
        recommended_queue.append({
            'type': 'return',
            'id': ret['id'],
            'number': ret['return_number'],
            'member_name': ret['member_name'],
            'priority': '高' if ret['days_pending'] >= 3 else '中',
            'days_pending': ret['days_pending'],
            'stuck_reason': ret['stuck_reason'] or '处理中',
            'responsible_role': ret['current_handler_role'],
            'responsible_person': ret['assigned_to_info'],
            'action': action,
        })

    for visit in sorted(all_visits_list, key=lambda x: x['days_overdue'] or 0, reverse=True)[:5]:
        if visit['stuck_info'] and visit['stuck_info'].get('is_stuck'):
            action = '立即回访'
        else:
            action = '计划回访'
        
        recommended_queue.append({
            'type': 'visit',
            'id': visit['id'],
            'number': visit['visit_number'],
            'member_name': visit['member_name'],
            'priority': visit['priority'],
            'days_pending': visit['days_overdue'] or 0,
            'stuck_reason': visit['stuck_reason'] or '待回访',
            'responsible_role': visit['assigned_to_info']['role'] if visit['assigned_to_info'] else '未分配',
            'responsible_person': visit['assigned_to_info'],
            'action': action,
        })

    recommended_queue = sorted(recommended_queue, key=lambda x: (x['days_pending'], x['priority']), reverse=True)[:10]

    stats = {
        'total_returns_pending': returns.count(),
        'total_visits_pending': visits.count(),
        'today_returns_created': ReturnExchange.objects.filter(
            created_at__date=today
        ).count(),
        'today_returns_completed': ReturnExchange.objects.filter(
            completed_at__date=today, status='completed'
        ).count(),
        'today_visits_scheduled': VisitRecord.objects.filter(
            scheduled_date=today
        ).count(),
        'today_visits_completed': VisitRecord.objects.filter(
            completed_date=today, status='completed'
        ).count(),
    }

    return {
        'today_returns_pending': returns.count(),
        'today_visits_pending': visits.count(),
        'stuck_returns': stuck_returns_count,
        'stuck_visits': stuck_visits_count,
        'returns_needing_attention': returns_needing_attention,
        'visits_needing_attention': visits_needing_attention,
        'my_pending_returns': my_returns,
        'my_pending_visits': my_visits,
        'returns_by_role': {
            'clerk': {
                'count': len(returns_by_role_data['clerk']),
                'items': returns_by_role_data['clerk'][:5],
            },
            'manager': {
                'count': len(returns_by_role_data['manager']),
                'items': returns_by_role_data['manager'][:5],
            },
            'purchaser': {
                'count': len(returns_by_role_data['purchaser']),
                'items': returns_by_role_data['purchaser'][:5],
            },
        },
        'visits_by_role': {
            'clerk': {
                'count': len(visits_by_role_data['clerk']),
                'items': visits_by_role_data['clerk'][:5],
            },
            'manager': {
                'count': len(visits_by_role_data['manager']),
                'items': visits_by_role_data['manager'][:5],
            },
            'purchaser': {
                'count': len(visits_by_role_data['purchaser']),
                'items': visits_by_role_data['purchaser'][:5],
            },
        },
        'statistics': stats,
        'returns_role_summary': returns_role_summary,
        'visits_role_summary': visits_role_summary,
        'recommended_queue': recommended_queue,
    }