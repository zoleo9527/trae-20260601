from django.db import models
import uuid
from datetime import datetime


class Role(models.TextChoices):
    DISPATCHER = 'dispatcher', '调度员'
    FORKLIFT_LEADER = 'forklift_leader', '叉车班长'
    WAREHOUSE_CLERK = 'warehouse_clerk', '仓库文员'


class WorkOrderStatus(models.TextChoices):
    PENDING_DISPATCH = 'pending_dispatch', '待派工'
    DISPATCHED = 'dispatched', '已派工'
    IN_PROGRESS = 'in_progress', '作业中'
    PENDING_CONFIRM = 'pending_confirm', '待确认'
    COMPLETED = 'completed', '已完成'
    RETURNED = 'returned', '已退回'
    EXCEPTION = 'exception', '异常'


class ForkliftWorkOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.CharField(max_length=64, unique=True, db_index=True)

    vehicle_plate = models.CharField(max_length=32, verbose_name='车牌号')
    driver_name = models.CharField(max_length=32, verbose_name='司机姓名')
    driver_phone = models.CharField(max_length=16, verbose_name='司机电话')
    dock_number = models.CharField(max_length=16, verbose_name='月台号')
    cargo_type = models.CharField(max_length=64, verbose_name='货物类型')
    cargo_weight = models.FloatField(null=True, blank=True, verbose_name='货物重量(吨)')

    status = models.CharField(
        max_length=20,
        choices=WorkOrderStatus.choices,
        default=WorkOrderStatus.PENDING_DISPATCH,
        verbose_name='状态'
    )
    current_role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.DISPATCHER,
        null=True,
        blank=True,
        verbose_name='当前负责角色'
    )

    forklift_number = models.CharField(max_length=16, null=True, blank=True, verbose_name='叉车编号')
    operator_name = models.CharField(max_length=32, null=True, blank=True, verbose_name='叉车司机')

    dispatched_at = models.DateTimeField(null=True, blank=True, verbose_name='派工时间')
    work_start_at = models.DateTimeField(null=True, blank=True, verbose_name='作业开始时间')
    work_end_at = models.DateTimeField(null=True, blank=True, verbose_name='作业结束时间')
    work_duration_minutes = models.IntegerField(null=True, blank=True, verbose_name='作业时长(分钟)')

    return_reason = models.TextField(null=True, blank=True, verbose_name='退回原因')
    supplementary_notes = models.TextField(null=True, blank=True, verbose_name='补充备注')
    exception_note = models.TextField(null=True, blank=True, verbose_name='异常说明')

    dispatcher = models.CharField(max_length=32, null=True, blank=True, verbose_name='调度员')
    warehouse_clerk = models.CharField(max_length=32, null=True, blank=True, verbose_name='仓库文员')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '叉车派工作业单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.vehicle_plate} - {self.get_status_display()}'

    def calculate_duration(self):
        if self.work_start_at and self.work_end_at:
            duration = self.work_end_at - self.work_start_at
            self.work_duration_minutes = int(duration.total_seconds() / 60)
            return self.work_duration_minutes
        return None


class StatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    work_order = models.ForeignKey(
        ForkliftWorkOrder,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name='作业单'
    )
    from_status = models.CharField(max_length=20, choices=WorkOrderStatus.choices, verbose_name='原状态')
    to_status = models.CharField(max_length=20, choices=WorkOrderStatus.choices, verbose_name='新状态')
    operator_role = models.CharField(max_length=20, choices=Role.choices, verbose_name='操作角色')
    operator_name = models.CharField(max_length=32, verbose_name='操作人')
    remark = models.TextField(null=True, blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '状态变更历史'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.work_order.vehicle_plate}: {self.from_status} -> {self.to_status}'
