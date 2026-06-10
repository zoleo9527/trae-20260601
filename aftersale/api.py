import uuid
from datetime import timedelta
from decimal import Decimal
from typing import List

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, Prefetch
from django.utils import timezone
from ninja import NinjaAPI, Router, Query, File
from ninja.files import UploadedFile
from ninja.errors import HttpError

from .models import (
    Role, ROLE_HANDOFF_ORDER,
    AfterSaleStatus, LossStatus, LossResponsibility,
    EmployeeProfile, AfterSaleOrder, AfterSaleHistory,
    LossRecord, LossHistory, NotifyRecord,
)
from .permissions import (
    require_roles, require_login, get_current_role, get_profile,
    send_notify, send_role_broadcast,
)
from .schemas import *


api = NinjaAPI(title='花卉基地-售后补发与损耗统计', version='1.0.0')


def _choices_to_items(choices_cls):
    return [RoleItem(value=v, label=l) for v, l in choices_cls.choices]


def _display(val, choices_cls):
    for v, l in choices_cls.choices:
        if v == val:
            return l
    return val


def _as_histories(histories, loss=False):
    items = []
    for h in histories:
        item = HistoryItem(
            id=h.id,
            action=h.action,
            action_role=h.action_role,
            action_role_display=_display(h.action_role, Role),
            operator_name=h.operator_name,
            status_from=h.status_from,
            status_from_display=_display(h.status_from, LossStatus if loss else AfterSaleStatus) if h.status_from else '',
            status_to=h.status_to,
            status_to_display=_display(h.status_to, LossStatus if loss else AfterSaleStatus) if h.status_to else '',
            remark=h.remark or '',
            created_at=h.created_at,
        )
        if loss:
            item.responsibility_from = getattr(h, 'responsibility_from', '')
            item.responsibility_from_display = _display(item.responsibility_from, LossResponsibility) if item.responsibility_from else ''
            item.responsibility_to = getattr(h, 'responsibility_to', '')
            item.responsibility_to_display = _display(item.responsibility_to, LossResponsibility) if item.responsibility_to else ''
        items.append(item)
    return items


def _as_notifies(nlist):
    result = []
    notify_type_map = dict(NotifyRecord.NOTIFY_TYPE)
    for n in nlist:
        result.append(NotifyItem(
            id=n.id,
            notify_type=n.notify_type,
            notify_type_display=notify_type_map.get(n.notify_type, n.notify_type),
            target_role=n.target_role or '',
            target_role_display=_display(n.target_role, Role) if n.target_role else '',
            target_name=n.target_name or '',
            content=n.content,
            is_read=n.is_read,
            created_at=n.created_at,
        ))
    return result


def _make_aftersale_brief(o: AfterSaleOrder) -> AfterSaleBriefOut:
    handler_name = ''
    if o.current_handler_id:
        try:
            handler_name = o.current_handler.profile.real_name
        except EmployeeProfile.DoesNotExist:
            handler_name = o.current_handler.username
    loss_id = None
    loss_no = ''
    if o.has_loss and o.loss_records.exists():
        loss = o.loss_records.first()
        loss_id = loss.id
        loss_no = loss.loss_no
    return AfterSaleBriefOut(
        id=o.id,
        order_no=o.order_no,
        source_order_no=o.source_order_no,
        customer_name=o.customer_name,
        flower_name=o.flower_name,
        quantity=o.quantity,
        unit=o.unit,
        status=o.status,
        status_display=_display(o.status, AfterSaleStatus),
        current_role=o.current_role,
        current_role_display=_display(o.current_role, Role),
        current_handler_name=handler_name,
        created_at=o.created_at,
        deadline_at=o.deadline_at,
        has_loss=o.has_loss,
        loss_id=loss_id,
        loss_no=loss_no,
    )


def _make_aftersale_detail(o: AfterSaleOrder) -> AfterSaleDetailOut:
    brief = _make_aftersale_brief(o)
    creator_name = ''
    if o.created_by_id:
        try:
            creator_name = o.created_by.profile.real_name
        except EmployeeProfile.DoesNotExist:
            creator_name = o.created_by.username
    # 损耗上下文：当状态转 TO_LOSS 时把责任人和历史摘要一起带出，不丢失
    loss_context = None
    if o.status in (AfterSaleStatus.TO_LOSS, AfterSaleStatus.COMPLETED) or o.has_loss:
        handlers_chain = []
        for h in o.histories.order_by('created_at'):
            if h.status_to in (AfterSaleStatus.HANDED_OFF, AfterSaleStatus.IN_PROGRESS):
                handlers_chain.append({
                    'action': h.action,
                    'role': h.action_role,
                    'role_display': _display(h.action_role, Role),
                    'operator': h.operator_name,
                    'at': h.created_at.isoformat(),
                    'remark': h.remark or '',
                })
        loss_context = {
            'aftersale_id': o.id,
            'aftersale_no': o.order_no,
            'flower_name': o.flower_name,
            'quantity': o.quantity,
            'unit': o.unit,
            'customer_name': o.customer_name,
            'source_order_no': o.source_order_no,
            'problem_desc': o.problem_desc,
            'current_role': o.current_role,
            'current_role_display': _display(o.current_role, Role),
            'current_handler_id': o.current_handler_id,
            'current_handler_name': brief.current_handler_name,
            'history_summary': [h.remark or f"{h.action} by {h.operator_name}" for h in o.histories.all()],
            'handlers_chain': handlers_chain,
            'creator_name': creator_name,
            'created_at': o.created_at.isoformat(),
        }
    histories = _as_histories(o.histories.all().order_by('created_at'), loss=False)
    notifies = _as_notifies(o.notifies.all()[:20])
    return AfterSaleDetailOut(
        **brief.dict(),
        customer_phone=o.customer_phone,
        problem_desc=o.problem_desc,
        photos_ref=o.photos_ref or [],
        current_handler_id=o.current_handler_id,
        creator_name=creator_name,
        updated_at=o.updated_at,
        histories=histories,
        notifies=notifies,
        loss_context=loss_context,
    )


def _collect_inherited_context(aftersale: AfterSaleOrder):
    handlers = []
    seen = set()
    for h in aftersale.histories.order_by('created_at'):
        key = (h.action_role, h.operator_name)
        if key not in seen:
            handlers.append({
                'role': h.action_role,
                'role_display': _display(h.action_role, Role),
                'operator': h.operator_name,
                'operator_id': h.operator_id,
                'remark': h.remark or '',
                'at': h.created_at.isoformat(),
            })
            seen.add(key)
    summary_parts = []
    for h in aftersale.histories.order_by('created_at'):
        part = f"[{h.created_at.strftime('%m-%d %H:%M')}][{_display(h.action_role, Role)}]{h.operator_name}:{h.action}"
        if h.remark:
            part += f" - {h.remark}"
        summary_parts.append(part)
    return handlers, ' | '.join(summary_parts)


def _make_loss_brief(l: LossRecord) -> LossBriefOut:
    return LossBriefOut(
        id=l.id,
        loss_no=l.loss_no,
        aftersale_id=l.aftersale_id,
        aftersale_no=l.aftersale.order_no,
        flower_name=l.flower_name,
        loss_quantity=l.loss_quantity,
        unit=l.unit,
        loss_amount=l.loss_amount or Decimal('0'),
        responsibility=l.responsibility,
        responsibility_display=_display(l.responsibility, LossResponsibility),
        status=l.status,
        status_display=_display(l.status, LossStatus),
        liable_person_name=l.liable_person_name or '',
        created_at=l.created_at,
    )


def _make_loss_detail(l: LossRecord) -> LossDetailOut:
    handlers_chain, summary = _collect_inherited_context(l.aftersale)
    confirmed_by_name = ''
    if l.confirmed_by_id:
        try:
            confirmed_by_name = l.confirmed_by.profile.real_name
        except EmployeeProfile.DoesNotExist:
            confirmed_by_name = l.confirmed_by.username
    creator_name = ''
    if l.created_by_id:
        try:
            creator_name = l.created_by.profile.real_name
        except EmployeeProfile.DoesNotExist:
            creator_name = l.created_by.username
    histories = _as_histories(l.histories.all().order_by('created_at'), loss=True)
    notifies = _as_notifies(l.notifies.all()[:20])
    return LossDetailOut(
        **_make_loss_brief(l).dict(),
        aftersale_customer=l.aftersale.customer_name,
        loss_reason=l.loss_reason,
        liable_person_id=l.liable_person_id,
        confirm_role=l.confirm_role or '',
        confirm_role_display=_display(l.confirm_role, Role) if l.confirm_role else '',
        confirmed_by_name=confirmed_by_name,
        confirmed_at=l.confirmed_at,
        resolved_at=l.resolved_at,
        closed_at=l.closed_at,
        creator_name=creator_name,
        updated_at=l.updated_at,
        histories=histories,
        notifies=notifies,
        inherited_aftersale_handlers=handlers_chain,
        inherited_aftersale_summary=summary,
    )


# =========================================================
# 公共：字典选项 / 登录 / 个人信息 / 通知
# =========================================================

@api.get('/dict', response=DictOut, tags=['公共'])
def get_dict(request):
    return DictOut(
        aftersale_statuses=_choices_to_items(AfterSaleStatus),
        loss_statuses=_choices_to_items(LossStatus),
        loss_responsibilities=_choices_to_items(LossResponsibility),
        roles=_choices_to_items(Role),
    )


@api.post('/auth/login', response=UserProfileOut, tags=['公共'])
def login_view(request, payload: LoginIn):
    user = authenticate(request, username=payload.username, password=payload.password)
    if not user:
        raise HttpError(401, '用户名或密码错误')
    login(request, user)
    profile = get_profile(request)
    if not profile:
        if user.is_superuser:
            return UserProfileOut(
                user_id=user.id, username=user.username, real_name=user.username,
                role=Role.ADMIN, role_display=_display(Role.ADMIN, Role), phone='',
            )
        raise HttpError(403, '该账号未绑定员工档案，请联系管理员')
    return UserProfileOut(
        user_id=user.id, username=user.username, real_name=profile.real_name,
        role=profile.role, role_display=_display(profile.role, Role), phone=profile.phone,
    )


@api.post('/auth/logout', response=MessageOut, tags=['公共'])
def logout_view(request):
    logout(request)
    return MessageOut(msg='已退出登录')


@api.get('/auth/me', response=UserProfileOut, tags=['公共'])
@require_login
def get_me(request):
    profile = get_profile(request)
    user = request.user
    if not profile:
        return UserProfileOut(
            user_id=user.id, username=user.username, real_name=user.username,
            role=Role.ADMIN, role_display=_display(Role.ADMIN, Role), phone='',
        )
    return UserProfileOut(
        user_id=user.id, username=user.username, real_name=profile.real_name,
        role=profile.role, role_display=_display(profile.role, Role), phone=profile.phone,
    )


@api.get('/notifies', response=List[NotifyItem], tags=['公共'])
@require_login
def list_notifies(request, only_unread: bool = True, limit: int = 50):
    role = get_current_role(request)
    qs = NotifyRecord.objects.filter(
        Q(target_user=request.user) | Q(target_role=role) if role else Q(target_user=request.user)
    )
    if only_unread:
        qs = qs.filter(is_read=False)
    return _as_notifies(qs.order_by('-created_at')[:limit])


@api.post('/notifies/{nid}/read', response=MessageOut, tags=['公共'])
@require_login
def read_notify(request, nid: int):
    try:
        n = NotifyRecord.objects.get(id=nid)
    except NotifyRecord.DoesNotExist:
        raise HttpError(404, '通知不存在')
    n.is_read = True
    n.save(update_fields=['is_read'])
    return MessageOut(msg='已标记已读')


# =========================================================
# 售后补发
# =========================================================

aftersale_router = Router(tags=['售后补发'])


@aftersale_router.get('', response=List[AfterSaleBriefOut])
@require_login
def list_aftersale(request, filters: AfterSaleListFilter = Query(...)):
    qs = AfterSaleOrder.objects.select_related('current_handler').prefetch_related(
        Prefetch('loss_records', queryset=LossRecord.objects.order_by('created_at'))
    ).all()
    if filters.status:
        qs = qs.filter(status=filters.status)
    if filters.current_role:
        qs = qs.filter(current_role=filters.current_role)
    if filters.keyword:
        kw = filters.keyword
        qs = qs.filter(
            Q(order_no__icontains=kw)
            | Q(source_order_no__icontains=kw)
            | Q(customer_name__icontains=kw)
            | Q(flower_name__icontains=kw)
        )
    if filters.only_my:
        role = get_current_role(request)
        if role and role != Role.ADMIN:
            qs = qs.filter(
                Q(current_role=role) | Q(current_handler=request.user)
                | Q(created_by=request.user)
            )
    return [_make_aftersale_brief(o) for o in qs[:100]]


@aftersale_router.post('', response=AfterSaleDetailOut)
@require_roles([Role.SALES_STAFF, Role.ADMIN])
def create_aftersale(request, payload: AfterSaleCreateIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    order_no = f"AS{timezone.now().strftime('%Y%m%d%H%M')}{uuid.uuid4().hex[:4].upper()}"
    deadline = None
    if payload.deadline_hours:
        deadline = timezone.now() + timedelta(hours=payload.deadline_hours)
    with transaction.atomic():
        order = AfterSaleOrder.objects.create(
            order_no=order_no,
            source_order_no=payload.source_order_no,
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            flower_name=payload.flower_name,
            quantity=payload.quantity,
            unit=payload.unit,
            problem_desc=payload.problem_desc,
            photos_ref=payload.photos_ref,
            status=AfterSaleStatus.PENDING,
            current_role=Role.PLANTER,
            created_by=user,
            deadline_at=deadline,
        )
        AfterSaleHistory.objects.create(
            aftersale=order, action='创建售后单', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_to=AfterSaleStatus.PENDING,
            remark=(f'销售内勤创建售后单，派单至种植员环节；'
                    f'品种：{payload.flower_name}，数量：{payload.quantity}{payload.unit}；'
                    f'问题：{payload.problem_desc}'),
        )
        send_role_broadcast(
            'urge', f'新售后单{order_no}待种植员受理：{payload.flower_name} {payload.quantity}{payload.unit}，请核查品质与可补发量',
            Role.PLANTER, aftersale=order,
        )
    return _make_aftersale_detail(order)


@aftersale_router.get('/{aid}', response=AfterSaleDetailOut)
@require_login
def get_aftersale_detail(request, aid: int):
    try:
        order = AfterSaleOrder.objects.select_related(
            'current_handler', 'created_by', 'loss_order'
        ).prefetch_related(
            Prefetch('histories', queryset=AfterSaleHistory.objects.order_by('created_at')),
            Prefetch('notifies', queryset=NotifyRecord.objects.order_by('-created_at')),
            Prefetch('loss_records'),
        ).get(id=aid)
    except AfterSaleOrder.DoesNotExist:
        raise HttpError(404, '售后单不存在')
    return _make_aftersale_detail(order)


@aftersale_router.post('/{aid}/accept', response=AfterSaleDetailOut)
@require_roles([Role.PLANTER, Role.ADMIN])
def accept_aftersale(request, aid: int, payload: StatusUpdateIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        if order.current_role != role and role != Role.ADMIN:
            raise HttpError(403, f'当前环节为【{_display(order.current_role, Role)}】，您无权受理')
        old = order.status
        order.status = AfterSaleStatus.IN_PROGRESS
        order.current_handler = user
        order.save(update_fields=['status', 'current_handler', 'updated_at'])
        AfterSaleHistory.objects.create(
            aftersale=order, action='受理', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old, status_to=AfterSaleStatus.IN_PROGRESS,
            remark=payload.remark or '种植员已受理，正在核查花品情况',
        )
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


@aftersale_router.post('/{aid}/urge', response=AfterSaleDetailOut)
@require_roles([Role.SALES_STAFF, Role.PACKAGE_LEAD, Role.PLANTER, Role.ADMIN])
def urge_aftersale(request, aid: int, payload: StatusUpdateIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        old = order.status
        order.status = AfterSaleStatus.URGED
        order.save(update_fields=['status', 'updated_at'])
        AfterSaleHistory.objects.create(
            aftersale=order, action='有人催', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old, status_to=AfterSaleStatus.URGED,
            remark=payload.remark or f'{_display(role, Role)}发起催促，请加快处理',
        )
        target_role = order.current_role
        target_user = order.current_handler
        if target_user:
            send_notify(
                'urge',
                f'售后单{order.order_no}被催：{payload.remark or "请尽快处理"}',
                target_role=target_role, target_user=target_user, aftersale=order,
            )
        else:
            send_role_broadcast(
                'urge',
                f'售后单{order.order_no}被催：{payload.remark or "请尽快处理"}',
                target_role, aftersale=order,
            )
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


@aftersale_router.post('/{aid}/return', response=AfterSaleDetailOut)
@require_roles([Role.PACKAGE_LEAD, Role.PLANTER, Role.SALES_STAFF, Role.ADMIN])
def return_aftersale(request, aid: int, payload: StatusUpdateIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        old = order.status
        order.status = AfterSaleStatus.RETURNED
        try:
            cur_idx = ROLE_HANDOFF_ORDER.index(order.current_role)
            if cur_idx > 0:
                order.current_role = ROLE_HANDOFF_ORDER[cur_idx - 1]
        except ValueError:
            pass
        order.current_handler = None
        order.save(update_fields=['status', 'current_role', 'current_handler', 'updated_at'])
        AfterSaleHistory.objects.create(
            aftersale=order, action='有人退回', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old, status_to=AfterSaleStatus.RETURNED,
            remark=payload.remark or f'{_display(role, Role)}退回，需要上一环节补充信息',
        )
        send_role_broadcast(
            'return',
            f'售后单{order.order_no}被退回：{payload.remark or "请补充信息后重新接力"}',
            order.current_role, aftersale=order,
        )
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


@aftersale_router.post('/{aid}/need-material', response=AfterSaleDetailOut)
@require_roles([Role.PLANTER, Role.SALES_STAFF, Role.PACKAGE_LEAD, Role.ADMIN])
def need_material_aftersale(request, aid: int, payload: MaterialNeedIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        old = order.status
        order.status = AfterSaleStatus.MATERIAL_NEEDED
        order.save(update_fields=['status', 'updated_at'])
        AfterSaleHistory.objects.create(
            aftersale=order, action='有人补材料', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old, status_to=AfterSaleStatus.MATERIAL_NEEDED,
            remark=f'需补充材料：{payload.material_desc}' + (f"；{payload.remark}" if payload.remark else ""),
        )
        send_role_broadcast(
            'material',
            f'售后单{order.order_no}需补材料：{payload.material_desc}',
            Role.SALES_STAFF, aftersale=order,
        )
        # 同时通知上一环节责任人
        try:
            cur_idx = ROLE_HANDOFF_ORDER.index(order.current_role)
            if cur_idx > 0:
                send_role_broadcast(
                    'material',
                    f'售后单{order.order_no}需补材料（上一环节{_display(ROLE_HANDOFF_ORDER[cur_idx-1], Role)}请关注）：{payload.material_desc}',
                    ROLE_HANDOFF_ORDER[cur_idx - 1], aftersale=order,
                )
        except ValueError:
            pass
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


@aftersale_router.post('/{aid}/handoff', response=AfterSaleDetailOut)
@require_roles([Role.PLANTER, Role.SALES_STAFF, Role.PACKAGE_LEAD, Role.ADMIN])
def handoff_aftersale(request, aid: int, payload: HandoffIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        if role != Role.ADMIN and role != order.current_role:
            raise HttpError(403, f'当前环节为【{_display(order.current_role, Role)}】，您无权接力')
        old_status = order.status
        old_role = order.current_role
        ok = order.handoff_next_role()
        if not ok:
            raise HttpError(400, '已到最后环节（包装主管），无法再接力。请选择补发完成或转损耗统计')
        target_role = order.current_role
        target_user = None
        if payload.handler_id:
            try:
                target_user = User.objects.select_related('profile').get(id=payload.handler_id)
                if getattr(target_user.profile, 'role', '') != target_role:
                    raise HttpError(400, f'指定处理人角色与目标环节{_display(target_role, Role)}不符')
            except User.DoesNotExist:
                raise HttpError(404, '指定处理人不存在')
        order.current_handler = target_user
        order.status = AfterSaleStatus.HANDED_OFF
        order.save(update_fields=['current_role', 'current_handler', 'status', 'updated_at'])
        AfterSaleHistory.objects.create(
            aftersale=order, action='接力流转', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old_status, status_to=AfterSaleStatus.HANDED_OFF,
            remark=(f'{_display(old_role, Role)} → {_display(target_role, Role)}'
                    + (f'，指定处理人：{target_user.profile.real_name if target_user and hasattr(target_user,"profile") else (target_user.username if target_user else "待认领")}')
                    + (f"；备注：{payload.remark}" if payload.remark else "")),
        )
        if target_user:
            send_notify(
                'handoff',
                f'售后单{order.order_no}接力到您：{order.flower_name}。请及时处理。{payload.remark or ""}',
                target_role=target_role, target_user=target_user, aftersale=order,
            )
        else:
            send_role_broadcast(
                'handoff',
                f'售后单{order.order_no}已接力到【{_display(target_role, Role)}】环节，请认领处理。{payload.remark or ""}',
                target_role, aftersale=order,
            )
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


@aftersale_router.post('/{aid}/complete', response=AfterSaleDetailOut)
@require_roles([Role.PACKAGE_LEAD, Role.ADMIN])
def complete_aftersale(request, aid: int, payload: StatusUpdateIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        old = order.status
        order.status = AfterSaleStatus.COMPLETED
        order.save(update_fields=['status', 'updated_at'])
        AfterSaleHistory.objects.create(
            aftersale=order, action='补发完成', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old, status_to=AfterSaleStatus.COMPLETED,
            remark=payload.remark or '包装主管确认补发完成',
        )
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


@aftersale_router.post('/{aid}/to-loss', response=AfterSaleDetailOut)
@require_roles([Role.PLANTER, Role.SALES_STAFF, Role.PACKAGE_LEAD, Role.ADMIN])
def mark_to_loss(request, aid: int, payload: LossTransitionIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            order = AfterSaleOrder.objects.select_for_update().select_related(
                'current_handler', 'created_by'
            ).prefetch_related('histories', 'loss_records').get(id=aid)
        except AfterSaleOrder.DoesNotExist:
            raise HttpError(404, '售后单不存在')
        if order.has_loss and order.loss_records.exists():
            raise HttpError(400, '该售后单已存在损耗记录，请直接在损耗统计中查看处理')
        old_status = order.status
        order.status = AfterSaleStatus.TO_LOSS
        order.has_loss = True
        order.save(update_fields=['status', 'has_loss', 'updated_at'])
        loss_no = f"LS{timezone.now().strftime('%Y%m%d%H%M')}{uuid.uuid4().hex[:4].upper()}"
        loss = LossRecord.objects.create(
            loss_no=loss_no,
            aftersale=order,
            flower_name=order.flower_name,
            loss_quantity=payload.loss_quantity,
            unit=order.unit,
            loss_reason=payload.loss_reason,
            loss_amount=payload.loss_amount,
            responsibility=payload.initial_responsibility,
            status=LossStatus.PENDING,
            created_by=user,
            extra={
                'inherited_from_aftersale': {
                    'order_no': order.order_no,
                    'current_handler_id': order.current_handler_id,
                    'current_role': order.current_role,
                    'created_by_id': order.created_by_id,
                    'history_count': order.histories.count(),
                }
            }
        )
        order.loss_order = loss
        order.save(update_fields=['loss_order'])
        # 售后历史：保留责任人（current_handler/current_role）
        AfterSaleHistory.objects.create(
            aftersale=order, action='转损耗统计', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old_status, status_to=AfterSaleStatus.TO_LOSS,
            remark=(f'生成损耗单【{loss_no}】'
                    + f'；当前责任人：{order.current_handler.profile.real_name if order.current_handler_id and hasattr(order.current_handler,"profile") else ("(未指派)")}'
                    + f'；当前环节：{_display(order.current_role, Role)}'
                    + (f"；说明：{payload.remark}" if payload.remark else "")),
        )
        # 损耗历史：保留从售后带过来的责任人说明
        LossHistory.objects.create(
            loss=loss, action='从售后单转入', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_to=LossStatus.PENDING,
            responsibility_to=payload.initial_responsibility,
            remark=(f'来源售后单{order.order_no}；原售后问题：{order.problem_desc}'
                    + f'；原当前环节：{_display(order.current_role, Role)}'
                    + f'；原处理人：{order.current_handler.profile.real_name if order.current_handler_id and hasattr(order.current_handler,"profile") else "(未指派)"}'
                    + (f"；转入备注：{payload.remark}" if payload.remark else "")),
        )
        send_role_broadcast(
            'loss',
            f'损耗单{loss_no}待责任确认：来自售后{order.order_no}，'
            f'{order.flower_name}损耗{payload.loss_quantity}{order.unit}，'
            f'原因：{payload.loss_reason}',
            Role.SALES_STAFF, aftersale=order, loss=loss,
        )
    return _make_aftersale_detail(AfterSaleOrder.objects.get(id=aid))


api.add_router('/aftersale', aftersale_router)


# =========================================================
# 损耗统计（不独立菜单，依附售后单；但提供回看/列表/详情）
# =========================================================

loss_router = Router(tags=['损耗统计'])


@loss_router.get('', response=List[LossBriefOut])
@require_login
def list_loss(request, filters: LossListFilter = Query(...)):
    qs = LossRecord.objects.select_related('aftersale').all()
    if filters.status:
        qs = qs.filter(status=filters.status)
    if filters.responsibility:
        qs = qs.filter(responsibility=filters.responsibility)
    if filters.aftersale_id:
        qs = qs.filter(aftersale_id=filters.aftersale_id)
    if filters.keyword:
        kw = filters.keyword
        qs = qs.filter(
            Q(loss_no__icontains=kw)
            | Q(aftersale__order_no__icontains=kw)
            | Q(flower_name__icontains=kw)
            | Q(loss_reason__icontains=kw)
        )
    return [_make_loss_brief(l) for l in qs[:100]]


@loss_router.get('/{lid}', response=LossDetailOut)
@require_login
def get_loss_detail(request, lid: int):
    try:
        loss = LossRecord.objects.select_related(
            'aftersale', 'liable_person', 'confirmed_by', 'created_by'
        ).prefetch_related(
            Prefetch('histories', queryset=LossHistory.objects.order_by('created_at')),
            Prefetch('notifies', queryset=NotifyRecord.objects.order_by('-created_at')),
            Prefetch('aftersale__histories', queryset=AfterSaleHistory.objects.order_by('created_at')),
        ).get(id=lid)
    except LossRecord.DoesNotExist:
        raise HttpError(404, '损耗单不存在')
    return _make_loss_detail(loss)


@loss_router.get('/from-aftersale/{aid}', response=LossDetailOut)
@require_login
def get_loss_from_aftersale(request, aid: int):
    """从售后单直接看损耗：确保责任人和历史说明不丢失"""
    try:
        aftersale = AfterSaleOrder.objects.select_related('current_handler', 'created_by').get(id=aid)
    except AfterSaleOrder.DoesNotExist:
        raise HttpError(404, '售后单不存在')
    if not aftersale.has_loss or not aftersale.loss_records.exists():
        raise HttpError(404, '该售后单未生成损耗单，请先调用转损耗统计接口')
    loss = aftersale.loss_records.select_related(
        'aftersale', 'liable_person', 'confirmed_by', 'created_by'
    ).prefetch_related(
        Prefetch('histories', queryset=LossHistory.objects.order_by('created_at')),
        Prefetch('notifies', queryset=NotifyRecord.objects.order_by('-created_at')),
        Prefetch('aftersale__histories', queryset=AfterSaleHistory.objects.order_by('created_at')),
    ).first()
    return _make_loss_detail(loss)


@loss_router.post('', response=LossDetailOut)
@require_roles([Role.PLANTER, Role.SALES_STAFF, Role.PACKAGE_LEAD, Role.ADMIN])
def create_loss_from_aftersale(request, payload: LossCreateFromAfterSaleIn):
    try:
        aftersale = AfterSaleOrder.objects.select_for_update().select_related(
            'current_handler', 'created_by'
        ).prefetch_related('histories', 'loss_records').get(id=payload.aftersale_id)
    except AfterSaleOrder.DoesNotExist:
        raise HttpError(404, '售后单不存在')
    if aftersale.has_loss and aftersale.loss_records.exists():
        raise HttpError(400, '该售后单已有损耗单，请直接查看')
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        aftersale.status = AfterSaleStatus.TO_LOSS
        aftersale.has_loss = True
        aftersale.save(update_fields=['status', 'has_loss', 'updated_at'])
        loss_no = f"LS{timezone.now().strftime('%Y%m%d%H%M')}{uuid.uuid4().hex[:4].upper()}"
        loss = LossRecord.objects.create(
            loss_no=loss_no,
            aftersale=aftersale,
            flower_name=aftersale.flower_name,
            loss_quantity=payload.loss_quantity,
            unit=payload.unit,
            loss_reason=payload.loss_reason,
            loss_amount=payload.loss_amount,
            responsibility=payload.initial_responsibility,
            status=LossStatus.PENDING,
            created_by=user,
            extra={
                'inherited_from_aftersale': {
                    'order_no': aftersale.order_no,
                    'current_handler_id': aftersale.current_handler_id,
                    'current_role': aftersale.current_role,
                    'created_by_id': aftersale.created_by_id,
                    'history_count': aftersale.histories.count(),
                }
            }
        )
        aftersale.loss_order = loss
        aftersale.save(update_fields=['loss_order'])
        AfterSaleHistory.objects.create(
            aftersale=aftersale, action='转损耗统计', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_to=AfterSaleStatus.TO_LOSS,
            remark=(f'生成损耗单【{loss_no}】'
                    + f'；当前责任人：{aftersale.current_handler.profile.real_name if aftersale.current_handler_id and hasattr(aftersale.current_handler,"profile") else "(未指派)"}'
                    + f'；当前环节：{_display(aftersale.current_role, Role)}'
                    + (f"；说明：{payload.remark}" if payload.remark else "")),
        )
        LossHistory.objects.create(
            loss=loss, action='从售后单转入', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_to=LossStatus.PENDING,
            responsibility_to=payload.initial_responsibility,
            remark=(f'来源售后单{aftersale.order_no}；原售后问题：{aftersale.problem_desc}'
                    + f'；原当前环节：{_display(aftersale.current_role, Role)}'
                    + f'；原处理人：{aftersale.current_handler.profile.real_name if aftersale.current_handler_id and hasattr(aftersale.current_handler,"profile") else "(未指派)"}'
                    + (f"；转入备注：{payload.remark}" if payload.remark else "")),
        )
        send_role_broadcast(
            'loss',
            f'损耗单{loss_no}待责任确认：{aftersale.flower_name}损耗{payload.loss_quantity}{payload.unit}，原因：{payload.loss_reason}',
            Role.SALES_STAFF, aftersale=aftersale, loss=loss,
        )
    return _make_loss_detail(LossRecord.objects.get(id=loss.id))


@loss_router.post('/{lid}/confirm', response=LossDetailOut)
@require_roles([Role.SALES_STAFF, Role.ADMIN])
def confirm_loss(request, lid: int, payload: LossConfirmIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            loss = LossRecord.objects.select_for_update().select_related('aftersale').get(id=lid)
        except LossRecord.DoesNotExist:
            raise HttpError(404, '损耗单不存在')
        old_status = loss.status
        old_resp = loss.responsibility
        loss.responsibility = payload.responsibility
        liable_name = ''
        if payload.liable_person_id:
            try:
                lp = User.objects.select_related('profile').get(id=payload.liable_person_id)
                loss.liable_person = lp
                liable_name = lp.profile.real_name if hasattr(lp, 'profile') else lp.username
                loss.liable_person_name = liable_name
            except User.DoesNotExist:
                raise HttpError(404, '责任人不存在')
        loss.confirm_role = role
        loss.confirmed_by = user
        loss.confirmed_at = timezone.now()
        loss.status = LossStatus.CONFIRMED
        loss.save(update_fields=[
            'responsibility', 'liable_person', 'liable_person_name',
            'confirm_role', 'confirmed_by', 'confirmed_at', 'status', 'updated_at',
        ])
        LossHistory.objects.create(
            loss=loss, action='确认责任', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old_status, status_to=LossStatus.CONFIRMED,
            responsibility_from=old_resp, responsibility_to=payload.responsibility,
            remark=(f'责任归属：{_display(payload.responsibility, LossResponsibility)}'
                    + (f'，责任人：{liable_name}' if liable_name else '')
                    + (f"；备注：{payload.remark}" if payload.remark else "")),
        )
        if loss.liable_person_id:
            send_notify(
                'loss',
                f'您被标记为损耗单{loss.loss_no}的责任人：{_display(payload.responsibility, LossResponsibility)}。{payload.remark or ""}',
                target_role=getattr(loss.liable_person.profile, 'role', None) if hasattr(loss.liable_person, 'profile') else None,
                target_user=loss.liable_person, loss=loss,
            )
    return _make_loss_detail(LossRecord.objects.get(id=lid))


@loss_router.post('/{lid}/resolve', response=LossDetailOut)
@require_roles([Role.SALES_STAFF, Role.ADMIN])
def resolve_loss(request, lid: int, payload: LossResolveIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            loss = LossRecord.objects.select_for_update().get(id=lid)
        except LossRecord.DoesNotExist:
            raise HttpError(404, '损耗单不存在')
        if loss.status != LossStatus.CONFIRMED:
            raise HttpError(400, '请先确认责任归属后再处理')
        old_status = loss.status
        loss.status = LossStatus.RESOLVED
        loss.resolved_at = timezone.now()
        loss.save(update_fields=['status', 'resolved_at', 'updated_at'])
        LossHistory.objects.create(
            loss=loss, action='处理损耗', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old_status, status_to=LossStatus.RESOLVED,
            remark=(f'处理措施：{payload.resolve_action or "已按流程处理"}'
                    + (f"；说明：{payload.remark}" if payload.remark else "")),
        )
    return _make_loss_detail(LossRecord.objects.get(id=lid))


@loss_router.post('/{lid}/close', response=LossDetailOut)
@require_roles([Role.SALES_STAFF, Role.ADMIN])
def close_loss(request, lid: int, payload: LossCloseIn):
    user = request.user
    profile = get_profile(request)
    role = profile.role if profile else Role.ADMIN
    with transaction.atomic():
        try:
            loss = LossRecord.objects.select_for_update().get(id=lid)
        except LossRecord.DoesNotExist:
            raise HttpError(404, '损耗单不存在')
        if loss.status not in (LossStatus.CONFIRMED, LossStatus.RESOLVED):
            raise HttpError(400, '请先完成责任确认及处理')
        old_status = loss.status
        loss.status = LossStatus.CLOSED
        loss.closed_at = timezone.now()
        loss.save(update_fields=['status', 'closed_at', 'updated_at'])
        LossHistory.objects.create(
            loss=loss, action='结案', action_role=role,
            operator=user, operator_name=profile.real_name if profile else user.username,
            status_from=old_status, status_to=LossStatus.CLOSED,
            remark=payload.remark or '损耗单已结案',
        )
        # 同步售后单状态
        try:
            aftersale = loss.aftersale
            if aftersale.status == AfterSaleStatus.TO_LOSS:
                aftersale.status = AfterSaleStatus.COMPLETED
                aftersale.save(update_fields=['status', 'updated_at'])
                AfterSaleHistory.objects.create(
                    aftersale=aftersale, action='损耗结案同步', action_role=role,
                    operator=user, operator_name=profile.real_name if profile else user.username,
                    status_from=AfterSaleStatus.TO_LOSS, status_to=AfterSaleStatus.COMPLETED,
                    remark=f'关联损耗单{loss.loss_no}已结案，售后单同步完成',
                )
        except Exception:
            pass
    return _make_loss_detail(LossRecord.objects.get(id=lid))


@loss_router.get('/{lid}/review', response=LossDetailOut)
@require_login
def review_loss(request, lid: int):
    """损耗回看：包含完整售后责任链和历史说明"""
    try:
        loss = LossRecord.objects.select_related(
            'aftersale', 'aftersale__current_handler', 'aftersale__created_by',
            'liable_person', 'confirmed_by', 'created_by',
        ).prefetch_related(
            Prefetch('histories', queryset=LossHistory.objects.order_by('created_at')),
            Prefetch('notifies', queryset=NotifyRecord.objects.order_by('-created_at')),
            Prefetch('aftersale__histories', queryset=AfterSaleHistory.objects.order_by('created_at')),
            Prefetch('aftersale__notifies', queryset=NotifyRecord.objects.order_by('-created_at')),
        ).get(id=lid)
    except LossRecord.DoesNotExist:
        raise HttpError(404, '损耗单不存在')
    return _make_loss_detail(loss)


api.add_router('/loss', loss_router)


# =========================================================
# 员工列表（分配处理人用）
# =========================================================

@api.get('/employees', response=List[dict], tags=['公共'])
@require_login
def list_employees(request, role: str = None):
    qs = EmployeeProfile.objects.select_related('user')
    if role:
        qs = qs.filter(role=role)
    return [
        {
            'user_id': p.user_id,
            'username': p.user.username,
            'real_name': p.real_name,
            'role': p.role,
            'role_display': _display(p.role, Role),
            'phone': p.phone,
        }
        for p in qs
    ]
