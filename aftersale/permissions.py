from functools import wraps
from typing import List, Optional

from django.contrib.auth.models import User
from ninja import NinjaAPI, Router, Schema, Query
from ninja.errors import HttpError

from .models import Role, EmployeeProfile, NotifyRecord


def get_current_role(request) -> str:
    user: Optional[User] = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return ''
    try:
        profile = EmployeeProfile.objects.select_related('user').get(user=user)
        return profile.role
    except EmployeeProfile.DoesNotExist:
        if user.is_superuser:
            return Role.ADMIN
        return ''


def get_profile(request) -> Optional[EmployeeProfile]:
    user: Optional[User] = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None
    try:
        return EmployeeProfile.objects.select_related('user').get(user=user)
    except EmployeeProfile.DoesNotExist:
        return None


def require_roles(allowed_roles: List[str]):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            role = get_current_role(request)
            if not role:
                raise HttpError(401, '未登录或未分配角色，请先登录并绑定员工档案')
            if role != Role.ADMIN and role not in allowed_roles:
                raise HttpError(
                    403,
                    f'当前角色【{dict(Role.choices).get(role, role)}】无权限执行此操作。'
                    f'允许角色：{"、".join([dict(Role.choices).get(r, r) for r in allowed_roles])}'
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_login(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user: Optional[User] = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            raise HttpError(401, '请先登录')
        return view_func(request, *args, **kwargs)
    return wrapper


def send_notify(notify_type: str, content: str, target_role: str = None,
                target_user: User = None, aftersale=None, loss=None):
    target_name = ''
    if target_user:
        try:
            target_name = target_user.profile.real_name
        except EmployeeProfile.DoesNotExist:
            target_name = target_user.username
    NotifyRecord.objects.create(
        notify_type=notify_type,
        target_role=target_role,
        target_user=target_user,
        target_name=target_name,
        content=content,
        related_aftersale=aftersale,
        related_loss=loss,
    )


def send_role_broadcast(notify_type: str, content: str, target_role: str,
                        aftersale=None, loss=None):
    users = User.objects.filter(profile__role=target_role).select_related('profile')
    for u in users:
        name = getattr(u.profile, 'real_name', u.username)
        NotifyRecord.objects.create(
            notify_type=notify_type,
            target_role=target_role,
            target_user=u,
            target_name=name,
            content=content,
            related_aftersale=aftersale,
            related_loss=loss,
        )
