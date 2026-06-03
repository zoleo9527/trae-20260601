from django.db import models
from django.conf import settings


class Equipment(models.Model):
    CATEGORY_CHOICES = [
        ('camera', '相机'),
        ('lens', '镜头'),
        ('light', '灯光'),
        ('accessory', '配件'),
        ('drone', '无人机'),
    ]
    STATUS_CHOICES = [
        ('available', '可用'),
        ('rented', '已借出'),
        ('maintenance', '维修中'),
        ('retired', '已退役'),
    ]

    name = models.CharField('器材名称', max_length=200)
    category = models.CharField('分类', max_length=20, choices=CATEGORY_CHOICES)
    serial_number = models.CharField('序列号', max_length=100, unique=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='available')
    daily_rate = models.DecimalField('日租金', max_digits=10, decimal_places=2)
    replacement_value = models.DecimalField('重置价值', max_digits=12, decimal_places=2, default=0)
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '器材'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name}({self.serial_number})'


class RentalOrder(models.Model):
    STATUS_CHOICES = [
        ('active', '租借中'),
        ('returned', '已归还'),
        ('overdue', '已逾期'),
    ]

    order_no = models.CharField('订单号', max_length=50, unique=True)
    customer_name = models.CharField('客户姓名', max_length=100)
    customer_phone = models.CharField('客户电话', max_length=20)
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, verbose_name='器材')
    store_clerk = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='handled_orders', verbose_name='经办店员',
    )
    start_date = models.DateField('租借开始日期')
    original_end_date = models.DateField('原定归还日期')
    current_end_date = models.DateField('当前归还日期')
    deposit_amount = models.DecimalField('押金', max_digits=10, decimal_places=2, default=0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '租赁单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no} - {self.customer_name}'

    @property
    def has_pending_extension(self):
        return self.extensions.filter(status='pending').exists()

    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status == 'active' and self.current_end_date < timezone.now().date()


class RentalExtension(models.Model):
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已通过'),
        ('rejected', '已驳回'),
        ('cancelled', '已取消'),
    ]

    rental_order = models.ForeignKey(
        RentalOrder, on_delete=models.CASCADE,
        related_name='extensions', verbose_name='租赁单',
    )
    original_end_date = models.DateField('原归还日期')
    requested_end_date = models.DateField('申请延至日期')
    reason = models.TextField('延长原因')
    fee_delta = models.DecimalField('费用增量', max_digits=10, decimal_places=2, default=0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='requested_extensions', verbose_name='申请店员',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_extensions', verbose_name='审核管理员',
    )
    reviewed_at = models.DateTimeField('审核时间', null=True, blank=True)
    review_note = models.TextField('审核备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '租期延长记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.rental_order.order_no} 延至{self.requested_end_date} [{self.get_status_display()}]'


class DamageReport(models.Model):
    STATUS_CHOICES = [
        ('reported', '已上报'),
        ('assessed', '已定损'),
        ('repaired', '已修复'),
    ]

    rental_order = models.ForeignKey(
        RentalOrder, on_delete=models.CASCADE,
        related_name='damage_reports', verbose_name='租赁单',
    )
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, verbose_name='器材')
    description = models.TextField('损坏描述')
    estimated_cost = models.DecimalField('预估维修费', max_digits=10, decimal_places=2, default=0)
    actual_cost = models.DecimalField('实际维修费', max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='reported')
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reported_damages', verbose_name='上报人',
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '损坏记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.equipment.name} - {self.get_status_display()}'


class FeeSettlement(models.Model):
    STATUS_CHOICES = [
        ('pending', '待结算'),
        ('paid', '已收款'),
        ('refunded', '已退款'),
    ]

    rental_order = models.OneToOneField(
        RentalOrder, on_delete=models.CASCADE,
        related_name='fee_settlement', verbose_name='租赁单',
    )
    base_fee = models.DecimalField('基础租金', max_digits=10, decimal_places=2, default=0)
    extension_fee = models.DecimalField('延期费用', max_digits=10, decimal_places=2, default=0)
    damage_fee = models.DecimalField('损坏费用', max_digits=10, decimal_places=2, default=0)
    overdue_penalty = models.DecimalField('逾期罚金', max_digits=10, decimal_places=2, default=0)
    total_fee = models.DecimalField('应付总额', max_digits=10, decimal_places=2, default=0)
    deposit_deducted = models.DecimalField('押金抵扣', max_digits=10, decimal_places=2, default=0)
    refund_amount = models.DecimalField('应退金额', max_digits=10, decimal_places=2, default=0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    settled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='settled_fees', verbose_name='结算财务',
    )
    settled_at = models.DateTimeField('结算时间', null=True, blank=True)
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '费用结算'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.rental_order.order_no} 结算[{self.get_status_display()}]'


class AuditLog(models.Model):
    ENTITY_CHOICES = [
        ('rental_order', '租赁单'),
        ('extension', '租期延长'),
        ('settlement', '费用结算'),
        ('damage', '损坏记录'),
        ('equipment', '器材'),
    ]
    ACTION_CHOICES = [
        ('create', '创建'),
        ('update', '更新'),
        ('status_change', '状态变更'),
        ('extension_requested', '延长申请'),
        ('extension_approved', '延长通过'),
        ('extension_rejected', '延长驳回'),
        ('extension_cancelled', '延长取消'),
        ('settlement_created', '结算创建'),
        ('settlement_recalculated', '结算重算'),
        ('settlement_paid', '结算收款'),
        ('settlement_refunded', '结算退款'),
        ('damage_reported', '损坏上报'),
        ('damage_assessed', '损坏定损'),
        ('damage_repaired', '损坏修复'),
        ('equipment_status_change', '器材状态变更'),
    ]

    entity_type = models.CharField('实体类型', max_length=30, choices=ENTITY_CHOICES)
    entity_id = models.PositiveIntegerField('实体ID')
    action = models.CharField('操作', max_length=30, choices=ACTION_CHOICES)
    old_value = models.JSONField('变更前', null=True, blank=True)
    new_value = models.JSONField('变更后', null=True, blank=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='操作人',
    )
    operator_role = models.CharField('操作人角色', max_length=20, default='')
    detail = models.TextField('详情', blank=True, default='')
    related_entity_type = models.CharField('关联实体类型', max_length=30, blank=True, default='')
    related_entity_id = models.PositiveIntegerField('关联实体ID', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['action']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'{self.get_action_display()} - {self.get_entity_type_display()}#{self.entity_id}'
