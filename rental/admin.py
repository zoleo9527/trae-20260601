from django.contrib import admin
from rental.models import Equipment, RentalOrder, RentalExtension, DamageReport, FeeSettlement, AuditLog


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'serial_number', 'category', 'status', 'daily_rate']
    list_filter = ['category', 'status']
    search_fields = ['name', 'serial_number']


@admin.register(RentalOrder)
class RentalOrderAdmin(admin.ModelAdmin):
    list_display = ['order_no', 'customer_name', 'equipment', 'status', 'current_end_date', 'deposit_amount']
    list_filter = ['status']
    search_fields = ['order_no', 'customer_name']


@admin.register(RentalExtension)
class RentalExtensionAdmin(admin.ModelAdmin):
    list_display = ['id', 'rental_order', 'status', 'original_end_date', 'requested_end_date', 'fee_delta', 'requested_by', 'reviewed_by']
    list_filter = ['status']


@admin.register(DamageReport)
class DamageReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'rental_order', 'equipment', 'status', 'estimated_cost', 'actual_cost']
    list_filter = ['status']


@admin.register(FeeSettlement)
class FeeSettlementAdmin(admin.ModelAdmin):
    list_display = ['id', 'rental_order', 'status', 'total_fee', 'deposit_deducted', 'refund_amount', 'settled_at']
    list_filter = ['status']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'entity_type', 'entity_id', 'action', 'operator_role', 'created_at']
    list_filter = ['entity_type', 'action', 'operator_role']
    readonly_fields = ['created_at']
    search_fields = ['detail']
