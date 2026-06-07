from django.db import models
from django.contrib.auth.models import User


class RoleType(models.TextChoices):
    RECEPTION = "reception", "前台"
    FLOOR_SUPERVISOR = "floor_supervisor", "楼层主管"
    FINANCE = "finance", "财务"
    ADMIN = "admin", "管理员"


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    role = models.CharField(max_length=32, choices=RoleType.choices, verbose_name="角色")
    phone = models.CharField(max_length=20, blank=True, verbose_name="联系电话")
    employee_id = models.CharField(max_length=32, unique=True, verbose_name="工号")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "员工档案"
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.employee_id}-{self.user.get_full_name() or self.user.username}"


class LockerArea(models.Model):
    name = models.CharField(max_length=64, verbose_name="区域名称")
    floor = models.IntegerField(verbose_name="楼层")
    description = models.TextField(blank=True, verbose_name="描述")

    class Meta:
        verbose_name = "储物柜区域"
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.floor}F-{self.name}"


class Locker(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "空闲"
        OCCUPIED = "occupied", "占用"
        DAMAGED = "damaged", "损坏"
        MAINTENANCE = "maintenance", "维护中"

    locker_no = models.CharField(max_length=32, unique=True, verbose_name="柜号")
    area = models.ForeignKey(LockerArea, on_delete=models.PROTECT, related_name="lockers", verbose_name="所属区域")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.AVAILABLE, verbose_name="状态")
    wristband_code = models.CharField(max_length=64, blank=True, verbose_name="绑定手牌")
    customer_name = models.CharField(max_length=64, blank=True, verbose_name="客人姓名")
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name="入柜时间")
    remark = models.TextField(blank=True, verbose_name="备注")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "储物柜"
        verbose_name_plural = verbose_name
        ordering = ["area", "locker_no"]

    def __str__(self):
        return self.locker_no


class Wristband(models.Model):
    class Status(models.TextChoices):
        IDLE = "idle", "空闲"
        ISSUED = "issued", "已发放"
        LOST = "lost", "遗失"
        DAMAGED = "damaged", "损坏"

    code = models.CharField(max_length=64, unique=True, verbose_name="手牌编号")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.IDLE, verbose_name="状态")
    bound_locker = models.OneToOneField(
        Locker, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="wristband", verbose_name="绑定储物柜"
    )
    customer_name = models.CharField(max_length=64, blank=True, verbose_name="客人姓名")
    customer_phone = models.CharField(max_length=20, blank=True, verbose_name="客人电话")
    issued_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="issued_wristbands", verbose_name="发放人"
    )
    issued_at = models.DateTimeField(null=True, blank=True, verbose_name="发放时间")
    remark = models.TextField(blank=True, verbose_name="备注")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "手牌"
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.code


class Technician(models.Model):
    name = models.CharField(max_length=64, verbose_name="技师姓名")
    employee_id = models.CharField(max_length=32, unique=True, verbose_name="工号")
    phone = models.CharField(max_length=20, blank=True, verbose_name="联系电话")
    is_active = models.BooleanField(default=True, verbose_name="在职")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "技师"
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.employee_id}-{self.name}"


class TechnicianSchedule(models.Model):
    technician = models.ForeignKey(Technician, on_delete=models.CASCADE, related_name="schedules", verbose_name="技师")
    shift_date = models.DateField(verbose_name="排班日期")
    shift_type = models.CharField(max_length=32, verbose_name="班次")
    assigned_area = models.ForeignKey(
        LockerArea, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="technicians", verbose_name="负责区域"
    )
    remark = models.TextField(blank=True, verbose_name="备注")

    class Meta:
        verbose_name = "技师排班"
        verbose_name_plural = verbose_name
        unique_together = ["technician", "shift_date"]


class LockerAbnormal(models.Model):
    class Type(models.TextChoices):
        CANNOT_OPEN = "cannot_open", "无法开门"
        WRONG_ITEM = "wrong_item", "物品错放"
        ITEM_MISSING = "item_missing", "物品遗失"
        LOCKER_DAMAGE = "locker_damage", "柜体损坏"
        WRISTBAND_LOST = "wristband_lost", "手牌遗失"
        CUSTOMER_COMPLAINT = "customer_complaint", "客人投诉"
        OTHER = "other", "其他"

    class Status(models.TextChoices):
        PENDING = "pending", "待处理"
        PROCESSING = "processing", "处理中"
        NEED_COMPENSATION = "need_compensation", "待赔付"
        RESOLVED = "resolved", "已解决"
        RETURNED = "returned", "已退回"

    locker = models.ForeignKey(Locker, on_delete=models.PROTECT, related_name="abnormal_records", verbose_name="储物柜")
    wristband = models.ForeignKey(
        Wristband, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="abnormal_records", verbose_name="相关手牌"
    )
    abnormal_type = models.CharField(max_length=32, choices=Type.choices, verbose_name="异常类型")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING, verbose_name="状态")
    priority = models.IntegerField(default=1, verbose_name="优先级")
    customer_name = models.CharField(max_length=64, blank=True, verbose_name="客人姓名")
    customer_phone = models.CharField(max_length=20, blank=True, verbose_name="客人电话")
    description = models.TextField(verbose_name="异常描述")
    reported_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reported_abnormals", verbose_name="登记人(前台)"
    )
    reported_at = models.DateTimeField(auto_now_add=True, verbose_name="登记时间")
    assigned_to = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_abnormals", verbose_name="处理人(楼层主管)"
    )
    assigned_at = models.DateTimeField(null=True, blank=True, verbose_name="派单时间")
    processed_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="processed_abnormals", verbose_name="处理人"
    )
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name="处理时间")
    process_result = models.TextField(blank=True, verbose_name="处理结果")
    return_reason = models.TextField(blank=True, verbose_name="退回原因")
    returned_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="returned_abnormals", verbose_name="退回人"
    )
    returned_at = models.DateTimeField(null=True, blank=True, verbose_name="退回时间")
    expected_deadline = models.DateTimeField(null=True, blank=True, verbose_name="期望处理时限")
    related_technician = models.ForeignKey(
        Technician, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="abnormal_records", verbose_name="涉及技师"
    )
    remark = models.TextField(blank=True, verbose_name="备注")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "储物柜异常记录"
        verbose_name_plural = verbose_name
        ordering = ["-reported_at"]

    def __str__(self):
        return f"{self.locker.locker_no}-{self.get_abnormal_type_display()}"


class AbnormalProgress(models.Model):
    abnormal = models.ForeignKey(LockerAbnormal, on_delete=models.CASCADE, related_name="progresses", verbose_name="异常记录")
    action = models.CharField(max_length=128, verbose_name="操作动作")
    operator = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="actions", verbose_name="操作人"
    )
    detail = models.TextField(verbose_name="操作详情")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="操作时间")

    class Meta:
        verbose_name = "异常处理进度"
        verbose_name_plural = verbose_name
        ordering = ["created_at"]


class Compensation(models.Model):
    class Status(models.TextChoices):
        PENDING_REVIEW = "pending_review", "待审核"
        REVIEWED = "reviewed", "已审核"
        PAID = "paid", "已支付"
        REJECTED = "rejected", "已拒绝"

    abnormal = models.OneToOneField(
        LockerAbnormal, on_delete=models.PROTECT, related_name="compensation", verbose_name="关联异常"
    )
    customer_name = models.CharField(max_length=64, verbose_name="客人姓名")
    customer_phone = models.CharField(max_length=20, blank=True, verbose_name="客人电话")
    item_description = models.TextField(verbose_name="遗失/损坏物品描述")
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="预估价值")
    compensation_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="赔付金额")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING_REVIEW, verbose_name="状态")
    proposed_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="proposed_compensations", verbose_name="提出人(楼层主管)"
    )
    proposed_at = models.DateTimeField(auto_now_add=True, verbose_name="提出时间")
    reviewed_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reviewed_compensations", verbose_name="审核人(财务)"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="审核时间")
    review_comment = models.TextField(blank=True, verbose_name="审核意见")
    paid_by = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="paid_compensations", verbose_name="支付人(财务)"
    )
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name="支付时间")
    payment_method = models.CharField(max_length=32, blank=True, verbose_name="支付方式")
    payment_voucher = models.CharField(max_length=256, blank=True, verbose_name="支付凭证号")
    customer_signature = models.CharField(max_length=64, blank=True, verbose_name="客人签收")
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name="签收时间")
    reject_reason = models.TextField(blank=True, verbose_name="拒绝原因")
    remark = models.TextField(blank=True, verbose_name="备注")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "赔付记录"
        verbose_name_plural = verbose_name
        ordering = ["-proposed_at"]

    def __str__(self):
        return f"{self.abnormal.locker.locker_no}-赔付{self.compensation_amount}元"


class CompensationProgress(models.Model):
    compensation = models.ForeignKey(Compensation, on_delete=models.CASCADE, related_name="progresses", verbose_name="赔付记录")
    action = models.CharField(max_length=128, verbose_name="操作动作")
    operator = models.ForeignKey(
        StaffProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="compensation_actions", verbose_name="操作人"
    )
    detail = models.TextField(verbose_name="操作详情")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="操作时间")

    class Meta:
        verbose_name = "赔付处理进度"
        verbose_name_plural = verbose_name
        ordering = ["created_at"]
