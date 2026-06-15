from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('manager', '维保主管'),
        ('technician', '现场技师'),
        ('warehouse', '仓管'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='technician')
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class CustomerEquipment(models.Model):
    equipment_code = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=100)
    customer_contact = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    equipment_model = models.CharField(max_length=50)
    location = models.CharField(max_length=200)
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('normal', '正常运行'),
        ('warning', '待保养'),
        ('downtime', '停机故障'),
    ], default='normal')

    def __str__(self):
        return f"{self.equipment_code} - {self.customer_name}"


class PartsInventory(models.Model):
    part_code = models.CharField(max_length=50, unique=True)
    part_name = models.CharField(max_length=100)
    specification = models.CharField(max_length=200, blank=True)
    unit = models.CharField(max_length=20, default='件')
    quantity = models.IntegerField(default=0)
    safety_stock = models.IntegerField(default=0)
    location = models.CharField(max_length=100, blank=True)
    supplier = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.part_code} - {self.part_name}"


class PartsRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已审核'),
        ('assigned', '已分派'),
        ('warehouse_pending', '待出库'),
        ('shipped', '已出库'),
        ('verified', '已核销'),
        ('rejected', '已拒绝'),
        ('cancelled', '已取消'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    ]

    request_no = models.CharField(max_length=50, unique=True)
    equipment = models.ForeignKey(CustomerEquipment, on_delete=models.CASCADE)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_requests')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests')
    warehouse_operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='warehouse_operations')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    reason = models.TextField()
    fault_description = models.TextField(blank=True)
    is_emergency = models.BooleanField(default=False)
    downtime_start = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    idempotency_key = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return f"{self.request_no} - {self.equipment.equipment_code}"


class PartsRequestItem(models.Model):
    request = models.ForeignKey(PartsRequest, on_delete=models.CASCADE, related_name='items')
    part = models.ForeignKey(PartsInventory, on_delete=models.CASCADE)
    requested_quantity = models.IntegerField()
    issued_quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.part.part_name} x {self.requested_quantity}"


class PartsRequestNote(models.Model):
    NOTE_TYPE_CHOICES = [
        ('create', '创建'),
        ('approve', '审核通过'),
        ('reject', '审核拒绝'),
        ('assign', '分派'),
        ('warehouse_check', '仓库确认'),
        ('ship', '出库'),
        ('verify', '核销'),
        ('remark', '备注'),
    ]
    
    request = models.ForeignKey(PartsRequest, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_note_type_display()} - {self.author.username}"


class OutboundRecord(models.Model):
    request = models.ForeignKey(PartsRequest, on_delete=models.CASCADE, related_name='outbound_records')
    operator = models.ForeignKey(User, on_delete=models.CASCADE)
    outbound_no = models.CharField(max_length=50, unique=True)
    outbound_date = models.DateTimeField(auto_now_add=True)
    carrier = models.CharField(max_length=100, blank=True)
    tracking_no = models.CharField(max_length=100, blank=True)
    shipping_address = models.TextField(blank=True)
    remark = models.TextField(blank=True)

    def __str__(self):
        return f"{self.outbound_no}"


class OutboundItem(models.Model):
    outbound = models.ForeignKey(OutboundRecord, on_delete=models.CASCADE, related_name='items')
    part = models.ForeignKey(PartsInventory, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    batch_no = models.CharField(max_length=50, blank=True)
    expiry_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.part.part_name} x {self.quantity}"


class VerificationRecord(models.Model):
    request = models.ForeignKey(PartsRequest, on_delete=models.CASCADE, related_name='verification_records')
    operator = models.ForeignKey(User, on_delete=models.CASCADE)
    verification_no = models.CharField(max_length=50, unique=True)
    verification_date = models.DateTimeField(auto_now_add=True)
    actual_used_quantities = models.JSONField(default=dict)
    remaining_parts = models.TextField(blank=True)
    problem_description = models.TextField(blank=True)
    is_qualified = models.BooleanField(default=True)
    signature = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.verification_no}"
