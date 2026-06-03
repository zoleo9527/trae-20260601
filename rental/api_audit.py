from typing import Optional
from ninja import Router
from rental.models import AuditLog
from rental.schemas import AuditLogOut

router = Router()


def _log_to_out(log):
    return AuditLogOut(
        id=log.id,
        entity_type=log.entity_type,
        entity_type_display=log.get_entity_type_display(),
        entity_id=log.entity_id,
        action=log.action,
        action_display=log.get_action_display(),
        old_value=log.old_value,
        new_value=log.new_value,
        operator_id=log.operator_id,
        operator_role=log.operator_role,
        detail=log.detail,
        related_entity_type=log.related_entity_type,
        related_entity_id=log.related_entity_id,
        created_at=log.created_at,
    )


@router.get('/', response=list[AuditLogOut])
def list_audit_logs(
    request,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
    operator_role: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    limit: int = 50,
):
    qs = AuditLog.objects.all()
    if entity_type:
        qs = qs.filter(entity_type=entity_type)
    if entity_id:
        qs = qs.filter(entity_id=entity_id)
    if action:
        qs = qs.filter(action=action)
    if operator_role:
        qs = qs.filter(operator_role=operator_role)
    if related_entity_type:
        qs = qs.filter(related_entity_type=related_entity_type)
    if related_entity_id:
        qs = qs.filter(related_entity_id=related_entity_id)
    qs = qs[:limit]
    return [_log_to_out(l) for l in qs]


@router.get('/{log_id}', response=AuditLogOut)
def get_audit_log(request, log_id: int):
    log = AuditLog.objects.get(pk=log_id)
    return _log_to_out(log)


@router.get('/entity/{entity_type}/{entity_id}', response=list[AuditLogOut])
def get_entity_audit_trail(request, entity_type: str, entity_id: int, limit: int = 50):
    from django.db.models import Q
    qs = AuditLog.objects.filter(
        Q(entity_type=entity_type, entity_id=entity_id)
        | Q(related_entity_type=entity_type, related_entity_id=entity_id)
    ).order_by('-created_at')[:limit]
    return [_log_to_out(l) for l in qs]
