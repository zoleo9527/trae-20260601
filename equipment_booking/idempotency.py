from __future__ import annotations
import hashlib
import json
from typing import Optional
from django.utils import timezone
from equipment_booking.models import IdempotencyRecord


def make_idempotency_key(user_id: int, action: str, payload: dict) -> str:
    raw = json.dumps({'user_id': user_id, 'action': action, 'payload': payload}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()


def check_idempotency(key: str) -> Optional[IdempotencyRecord]:
    try:
        return IdempotencyRecord.objects.get(key=key)
    except IdempotencyRecord.DoesNotExist:
        return None


def record_idempotency(key: str, status: int, body: dict):
    IdempotencyRecord.objects.create(key=key, response_status=status, response_body=body)


def clean_expired_records(hours: int = 24):
    cutoff = timezone.now() - timezone.timedelta(hours=hours)
    IdempotencyRecord.objects.filter(created_at__lt=cutoff).delete()
