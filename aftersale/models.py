from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Role(models.TextChoices):
    PLANTER = 'planter', '种植员'
    SALES_STAFF = 'sales_staff', '销售内勤'
    PACKAGE_LEAD = 'package_lead', '包装主管'
    ADMIN = 'admin', '系统管理员'


ROLE_HANDOFF_ORDER = [Role.PLANTER, Role.SALES_STAFF, Role.PACKAGE_LEAD]


class AfterSaleStatus(models.TextChoices):
    PENDING = 'pending', '待受理'
    URGED = 'urged', '有人催'
    RETURNED = 'returned', '有人退回'
    MATERIAL_NEEDED = 'material_needed', '有人补材料'
    IN_PROGRESS = 'in_progress', '处理中'
    HANDED_OFF = 'handed_off', '已接力'
    COMPLETED = 'completed', '补发完成'
    TO_LOSS = 'to_loss', '待转损耗统计'


class LossStatus(models.TextChoices):
    PENDING = 'pending', '待责任确认'
    CONFIRMED = 'confirmed', '责任已确认'
    RESOLVED = 'resolved', '损耗已处理'
    CLOSED = 'closed', '已结案'


class LossResponsibility(models.TextChoices):
    PLANTER = 'planter', '种植环节'
    SALES_STAFF = 'sales_staff', '销售/内勤环节'
    PACKAGE_LEAD = 'package_lead', '包装/发货环节'
    LOGISTICS = 'logistics', '物流环节'
    CUSTOMER = 'customer', '客户/不可抗力'
    UNCLEAR = 'unclear', '责任不清待核'


class EmployeeProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=Role.choices)
    real_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'employee_profile'

    def __str__(self):
        return f'{self.real_name}({self.get_role_display()})'


class AfterSaleOrder(models.Model):
    order_no = models.CharField(max_length=32, unique=True)
    source_order_no = models.CharField(max_length=32, blank=True, default='')
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20, blank=True, default='')
    flower_name = models.CharField(max_length=100)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=10, default='枝')
    problem_desc = models.TextField()
    photos_ref = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=AfterSaleStatus.choices, default=AfterSaleStatus.PENDING)
    current_role = models.CharField(max_length=20, choices=Role.choices, default=Role.SALES_STAFF)
    current_handler = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handling_aftersale'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_aftersale')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline_at = models.DateTimeField(null=True, blank=True)
    loss_order = models.OneToOneField(
        'LossRecord', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_aftersale'
    )
    has_loss = models.BooleanField(default=False)
    extra = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'after_sale_order'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no} - {self.flower_name}'

    def handoff_next_role(self):
        try:
            idx = ROLE_HANDOFF_ORDER.index(self.current_role)
            if idx < len(ROLE_HANDOFF_ORDER) - 1:
                self.current_role = ROLE_HANDOFF_ORDER[idx + 1]
                self.status = AfterSaleStatus.HANDED_OFF
                return True
            return False
        except ValueError:
            return False


class AfterSaleHistory(models.Model):
    aftersale = models.ForeignKey(AfterSaleOrder, on_delete=models.CASCADE, related_name='histories')
    action = models.CharField(max_length=50)
    action_role = models.CharField(max_length=20, choices=Role.choices)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    operator_name = models.CharField(max_length=50, blank=True, default='')
    status_from = models.CharField(max_length=20, choices=AfterSaleStatus.choices, blank=True, default='')
    status_to = models.CharField(max_length=20, choices=AfterSaleStatus.choices, blank=True, default='')
    remark = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'after_sale_history'
        ordering = ['created_at']


class LossRecord(models.Model):
    loss_no = models.CharField(max_length=32, unique=True)
    aftersale = models.ForeignKey(AfterSaleOrder, on_delete=models.CASCADE, related_name='loss_records')
    flower_name = models.CharField(max_length=100)
    loss_quantity = models.IntegerField()
    unit = models.CharField(max_length=10, default='枝')
    loss_reason = models.TextField()
    responsibility = models.CharField(
        max_length=20, choices=LossResponsibility.choices, default=LossResponsibility.UNCLEAR
    )
    status = models.CharField(max_length=20, choices=LossStatus.choices, default=LossStatus.PENDING)
    liable_person = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='liability_losses'
    )
    liable_person_name = models.CharField(max_length=50, blank=True, default='')
    confirm_role = models.CharField(max_length=20, choices=Role.choices, null=True, blank=True)
    confirmed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_losses'
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_losses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    loss_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    extra = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'loss_record'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.loss_no} - {self.flower_name}'


class LossHistory(models.Model):
    loss = models.ForeignKey(LossRecord, on_delete=models.CASCADE, related_name='histories')
    action = models.CharField(max_length=50)
    action_role = models.CharField(max_length=20, choices=Role.choices)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    operator_name = models.CharField(max_length=50, blank=True, default='')
    status_from = models.CharField(max_length=20, choices=LossStatus.choices, blank=True, default='')
    status_to = models.CharField(max_length=20, choices=LossStatus.choices, blank=True, default='')
    responsibility_from = models.CharField(
        max_length=20, choices=LossResponsibility.choices, blank=True, default=''
    )
    responsibility_to = models.CharField(
        max_length=20, choices=LossResponsibility.choices, blank=True, default=''
    )
    remark = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'loss_history'
        ordering = ['created_at']


class NotifyRecord(models.Model):
    NOTIFY_TYPE = (
        ('urge', '催促通知'),
        ('return', '退回通知'),
        ('material', '补材料通知'),
        ('handoff', '接力通知'),
        ('loss', '损耗通知'),
    )
    notify_type = models.CharField(max_length=20, choices=NOTIFY_TYPE)
    target_role = models.CharField(max_length=20, choices=Role.choices, null=True, blank=True)
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    target_name = models.CharField(max_length=50, blank=True, default='')
    content = models.TextField()
    related_aftersale = models.ForeignKey(
        AfterSaleOrder, on_delete=models.CASCADE, null=True, blank=True, related_name='notifies'
    )
    related_loss = models.ForeignKey(
        LossRecord, on_delete=models.CASCADE, null=True, blank=True, related_name='notifies'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notify_record'
        ordering = ['-created_at']
