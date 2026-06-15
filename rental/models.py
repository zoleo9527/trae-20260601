from django.db import models
from django.conf import settings


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Role(models.TextChoices):
    RENTAL_MANAGER = "rental_manager", "租赁经理"
    DISPATCHER = "dispatcher", "调度"
    MECHANIC = "mechanic", "维修师傅"


class EquipmentStatus(models.TextChoices):
    AVAILABLE = "available", "空闲"
    RENTED = "rented", "出租中"
    IN_MAINTENANCE = "in_maintenance", "维修中"
    SUSPENDED = "suspended", "停租"


class Equipment(TimeStampedModel):
    code = models.CharField("设备编号", max_length=64, unique=True)
    name = models.CharField("设备名称", max_length=128)
    category = models.CharField("设备类型", max_length=64, blank=True, default="")
    model_spec = models.CharField("型号规格", max_length=128, blank=True, default="")
    status = models.CharField(
        "设备状态", max_length=32, choices=EquipmentStatus.choices, default=EquipmentStatus.AVAILABLE
    )
    daily_rent = models.DecimalField("日租金(元)", max_digits=12, decimal_places=2, default=0)
    fuel_type = models.CharField("燃油类型", max_length=32, blank=True, default="")
    current_project = models.CharField("当前项目", max_length=128, blank=True, default="")

    class Meta:
        verbose_name = "设备"
        verbose_name_plural = verbose_name
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class RentalContract(TimeStampedModel):
    contract_no = models.CharField("合同编号", max_length=64, unique=True)
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, verbose_name="设备", related_name="contracts")
    lessee = models.CharField("承租方", max_length=128)
    start_date = models.DateField("租赁开始日")
    end_date = models.DateField("租赁结束日")
    daily_rent = models.DecimalField("合同日租金(元)", max_digits=12, decimal_places=2)
    deposit = models.DecimalField("押金(元)", max_digits=12, decimal_places=2, default=0)
    is_overdue = models.BooleanField("是否超期", default=False)
    remarks = models.TextField("备注", blank=True, default="")

    class Meta:
        verbose_name = "租赁合同"
        verbose_name_plural = verbose_name
        ordering = ["-start_date"]

    def __str__(self):
        return self.contract_no


class MaintenanceType(models.TextChoices):
    ROUTINE = "routine", "日常保养"
    REPAIR = "repair", "故障维修"
    OVERHAUL = "overhaul", "大修"


class MaintenanceStatus(models.TextChoices):
    PENDING = "pending", "待处理"
    IN_PROGRESS = "in_progress", "处理中"
    COMPLETED = "completed", "已完成"
    CANCELLED = "cancelled", "已取消"


class MaintenanceRecord(TimeStampedModel):
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, verbose_name="设备", related_name="maintenance_records")
    contract = models.ForeignKey(
        RentalContract, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="关联合同", related_name="maintenance_records"
    )
    maintenance_type = models.CharField("维保类型", max_length=32, choices=MaintenanceType.choices)
    status = models.CharField("维保状态", max_length=32, choices=MaintenanceStatus.choices, default=MaintenanceStatus.PENDING)
    reported_by = models.CharField("报修人", max_length=64, blank=True, default="")
    assigned_mechanic = models.CharField("维修师傅", max_length=64, blank=True, default="")
    fault_description = models.TextField("故障描述", blank=True, default="")
    repair_notes = models.TextField("维修备注", blank=True, default="")
    cost = models.DecimalField("维修费用(元)", max_digits=12, decimal_places=2, default=0)
    cost_bearer = models.CharField("费用承担方", max_length=64, blank=True, default="")
    started_at = models.DateTimeField("开始维修时间", null=True, blank=True)
    completed_at = models.DateTimeField("维修完成时间", null=True, blank=True)

    class Meta:
        verbose_name = "维修保养记录"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.equipment.code} - {self.get_maintenance_type_display()} - {self.status}"


class SuspensionStatus(models.TextChoices):
    PENDING = "pending", "待审核"
    APPROVED = "approved", "已批准"
    REJECTED = "rejected", "已驳回"
    SETTLED = "settled", "已结算"


class RentalSuspension(TimeStampedModel):
    contract = models.ForeignKey(RentalContract, on_delete=models.PROTECT, verbose_name="合同", related_name="suspensions")
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, verbose_name="设备", related_name="suspensions")
    suspension_date = models.DateField("停租日期")
    return_condition = models.TextField("还机状况", blank=True, default="")
    fuel_level = models.CharField("还机油量", max_length=64, blank=True, default="")
    meter_reading = models.CharField("还机读数", max_length=64, blank=True, default="")
    damage_description = models.TextField("损坏描述", blank=True, default="")
    deduction_amount = models.DecimalField("扣款金额(元)", max_digits=12, decimal_places=2, default=0)
    deduction_reason = models.TextField("扣款原因", blank=True, default="")
    status = models.CharField("停租状态", max_length=32, choices=SuspensionStatus.choices, default=SuspensionStatus.PENDING)
    reviewed_by = models.CharField("审核人", max_length=64, blank=True, default="")
    settlement_date = models.DateField("结算日期", null=True, blank=True)
    maintenance_snapshot = models.JSONField("维修快照", default=dict, blank=True)

    class Meta:
        verbose_name = "停租处理"
        verbose_name_plural = verbose_name
        ordering = ["-suspension_date"]

    def __str__(self):
        return f"{self.contract.contract_no} - {self.suspension_date} - {self.status}"


class NotificationType(models.TextChoices):
    MAINTENANCE_CREATED = "maintenance_created", "维保创建"
    MAINTENANCE_UPDATED = "maintenance_updated", "维保变更"
    MAINTENANCE_COMPLETED = "maintenance_completed", "维保完成"
    SUSPENSION_CREATED = "suspension_created", "停租创建"
    SUSPENSION_STATUS_CHANGED = "suspension_status_changed", "停租状态变更"
    CONTRACT_OVERDUE = "contract_overdue", "合同超期"
    EQUIPMENT_STATUS_CHANGED = "equipment_status_changed", "设备状态变更"


class NotificationLog(TimeStampedModel):
    notification_type = models.CharField("通知类型", max_length=64, choices=NotificationType.choices)
    target_role = models.CharField("目标角色", max_length=32, choices=Role.choices)
    title = models.CharField("通知标题", max_length=256)
    content = models.TextField("通知内容", blank=True, default="")
    related_maintenance = models.ForeignKey(
        MaintenanceRecord, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="关联维保", related_name="notifications"
    )
    related_suspension = models.ForeignKey(
        RentalSuspension, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="关联停租", related_name="notifications"
    )
    related_equipment = models.ForeignKey(
        Equipment, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="关联设备", related_name="notifications"
    )
    is_read = models.BooleanField("已读", default=False)

    class Meta:
        verbose_name = "通知记录"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.title}"


class StatusChangeLog(TimeStampedModel):
    entity_type = models.CharField("实体类型", max_length=64)
    entity_id = models.PositiveIntegerField("实体ID")
    old_status = models.CharField("原状态", max_length=64)
    new_status = models.CharField("新状态", max_length=64)
    changed_by = models.CharField("操作人", max_length=64, blank=True, default="")
    reason = models.TextField("变更原因", blank=True, default="")

    class Meta:
        verbose_name = "状态变更日志"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.entity_type}#{self.entity_id}: {self.old_status} -> {self.new_status}"
