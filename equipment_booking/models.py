import uuid
from django.db import models
from django.conf import settings


ROLE_CHOICES = [
    ('therapist', '康复治疗师'),
    ('receptionist', '前台'),
    ('director', '主任'),
]


class StaffProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'staff_profile'

    def __str__(self):
        return f'{self.user.username}({self.get_role_display()})'


class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=64)
    gender = models.CharField(max_length=8, blank=True, default='')
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    diagnosis = models.TextField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient'

    def __str__(self):
        return f'{self.name}({self.id.hex[:8]})'


class Equipment(models.Model):
    STATUS_CHOICES = [
        ('available', '可用'),
        ('in_use', '使用中'),
        ('maintenance', '维护中'),
        ('offline', '下线'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=64, unique=True)
    category = models.CharField(max_length=64, blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='available')
    location = models.CharField(max_length=128, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipment'

    def __str__(self):
        return f'{self.name}({self.code})'


class AppointmentOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿(治疗师填写评估)'),
        ('pending_assign', '待分配(前台分配器械)'),
        ('assigned', '已分配(待确认排班)'),
        ('in_use', '使用中'),
        ('pending_review', '待审核(主任审核)'),
        ('completed', '已完成'),
        ('exception', '异常'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_no = models.CharField(max_length=32, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='orders')
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='draft', db_index=True)
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='therapist_orders')
    receptionist = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='receptionist_orders'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_orders'
    )
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time_start = models.TimeField(null=True, blank=True)
    scheduled_time_end = models.TimeField(null=True, blank=True)
    exception_reason = models.TextField(blank=True, default='')
    return_reason = models.TextField(blank=True, default='')
    return_target_status = models.CharField(max_length=16, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointment_order'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no}[{self.get_status_display()}]'


class Assessment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(AppointmentOrder, on_delete=models.CASCADE, related_name='assessment')
    motor_function = models.TextField(blank=True, default='')
    pain_level = models.PositiveSmallIntegerField(null=True, blank=True)
    range_of_motion = models.TextField(blank=True, default='')
    treatment_goal = models.TextField(blank=True, default='')
    equipment_requirement = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assessment'

    def __str__(self):
        return f'评估-{self.order.order_no}'


class UsageRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(AppointmentOrder, on_delete=models.CASCADE, related_name='usage_records')
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='operated_records')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    actual_usage = models.TextField(blank=True, default='')
    patient_feedback = models.TextField(blank=True, default='')
    abnormal = models.BooleanField(default=False)
    abnormal_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usage_record'
        ordering = ['-start_time']

    def __str__(self):
        return f'使用记录-{self.order.order_no}'


class AlertLog(models.Model):
    LEVEL_CHOICES = [
        ('warning', '预警'),
        ('error', '异常'),
        ('info', '通知'),
    ]
    HANDLED_CHOICES = [
        ('pending', '待处理'),
        ('returned', '已退回'),
        ('dismissed', '已忽略'),
        ('resolved', '已解决'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(AppointmentOrder, on_delete=models.CASCADE, related_name='alerts')
    level = models.CharField(max_length=8, choices=LEVEL_CHOICES, default='warning')
    message = models.TextField()
    handled = models.CharField(max_length=10, choices=HANDLED_CHOICES, default='pending')
    handler = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_alerts'
    )
    handled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alert_log'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.level}]{self.order.order_no}'


class IdempotencyRecord(models.Model):
    key = models.CharField(max_length=128, primary_key=True)
    response_status = models.IntegerField()
    response_body = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'idempotency_record'


STATUS_TIMEOUT_HOURS = {
    'draft': 24,
    'pending_assign': 4,
    'assigned': 2,
    'in_use': 8,
    'pending_review': 48,
}

VALID_TRANSITIONS = {
    'draft': ['pending_assign', 'exception'],
    'pending_assign': ['assigned', 'exception'],
    'assigned': ['in_use', 'exception'],
    'in_use': ['pending_review', 'exception'],
    'pending_review': ['completed', 'exception'],
    'exception': ['draft', 'pending_assign', 'assigned', 'in_use', 'pending_review'],
    'completed': [],
}
