from django.contrib import admin
from .models import (
    StaffProfile, LockerArea, Locker, Wristband, Technician, TechnicianSchedule,
    LockerAbnormal, AbnormalProgress, Compensation, CompensationProgress
)


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ["employee_id", "user", "role", "phone", "created_at"]
    list_filter = ["role"]
    search_fields = ["employee_id", "user__username", "user__first_name"]


@admin.register(LockerArea)
class LockerAreaAdmin(admin.ModelAdmin):
    list_display = ["name", "floor", "description"]


@admin.register(Locker)
class LockerAdmin(admin.ModelAdmin):
    list_display = ["locker_no", "area", "status", "wristband_code", "customer_name", "check_in_time"]
    list_filter = ["status", "area"]
    search_fields = ["locker_no", "wristband_code", "customer_name"]


@admin.register(Wristband)
class WristbandAdmin(admin.ModelAdmin):
    list_display = ["code", "status", "bound_locker", "customer_name", "issued_at"]
    list_filter = ["status"]
    search_fields = ["code", "customer_name"]


@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ["employee_id", "name", "phone", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["employee_id", "name"]


@admin.register(TechnicianSchedule)
class TechnicianScheduleAdmin(admin.ModelAdmin):
    list_display = ["technician", "shift_date", "shift_type", "assigned_area"]
    list_filter = ["shift_date", "shift_type"]


class AbnormalProgressInline(admin.TabularInline):
    model = AbnormalProgress
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(LockerAbnormal)
class LockerAbnormalAdmin(admin.ModelAdmin):
    list_display = [
        "id", "locker", "abnormal_type", "status", "priority",
        "customer_name", "reported_at", "assigned_to", "processed_at"
    ]
    list_filter = ["status", "abnormal_type", "priority"]
    search_fields = ["locker__locker_no", "customer_name", "description"]
    inlines = [AbnormalProgressInline]
    readonly_fields = ["reported_at", "processed_at", "assigned_at", "returned_at", "updated_at"]


class CompensationProgressInline(admin.TabularInline):
    model = CompensationProgress
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(Compensation)
class CompensationAdmin(admin.ModelAdmin):
    list_display = [
        "id", "abnormal", "customer_name", "compensation_amount",
        "status", "proposed_at", "reviewed_at", "paid_at"
    ]
    list_filter = ["status"]
    search_fields = ["abnormal__locker__locker_no", "customer_name", "item_description"]
    inlines = [CompensationProgressInline]
    readonly_fields = ["proposed_at", "reviewed_at", "paid_at", "signed_at", "updated_at"]
