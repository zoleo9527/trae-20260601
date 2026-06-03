from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Employee, BanquetBooking, MenuItem, MenuConfirmation,
    MenuConfirmationItem, AuditLog, BookingStatus, StuckLevel
)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'role_display', 'phone', 'is_active', 'created_at')
    list_filter = ('role', 'is_active')
    search_fields = ('name', 'phone')

    def role_display(self, obj):
        return obj.get_role_display()
    role_display.short_description = '角色'


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'category')


class MenuConfirmationItemInline(admin.TabularInline):
    model = MenuConfirmationItem
    extra = 0
    raw_id_fields = ('menu_item',)


@admin.register(MenuConfirmation)
class MenuConfirmationAdmin(admin.ModelAdmin):
    list_display = ('booking_no', 'customer_name', 'total_amount', 'confirmed_by', 'confirmed_at', 'customer_signed')
    list_filter = ('customer_signed', 'confirmed_at')
    search_fields = ('booking__booking_no', 'booking__customer_name')
    inlines = [MenuConfirmationItemInline]
    readonly_fields = ('confirmed_at',)

    def booking_no(self, obj):
        return obj.booking.booking_no
    booking_no.short_description = '预订单号'

    def customer_name(self, obj):
        return obj.booking.customer_name
    customer_name.short_description = '客户姓名'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('booking_no', 'action', 'from_status_display', 'to_status_display', 'operator', 'operator_role_display', 'timestamp')
    list_filter = ('action', 'operator_role', 'timestamp')
    search_fields = ('booking__booking_no', 'action', 'operator__name')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'

    def booking_no(self, obj):
        return obj.booking.booking_no
    booking_no.short_description = '预订单号'

    def from_status_display(self, obj):
        return BookingStatus(obj.from_status).label if obj.from_status else '-'
    from_status_display.short_description = '原状态'

    def to_status_display(self, obj):
        return BookingStatus(obj.to_status).label if obj.to_status else '-'
    to_status_display.short_description = '新状态'

    def operator_role_display(self, obj):
        return obj.get_operator_role_display()
    operator_role_display.short_description = '角色'


class MenuConfirmationInline(admin.StackedInline):
    model = MenuConfirmation
    extra = 0
    show_change_link = True
    readonly_fields = ('confirmed_at',)


@admin.register(BanquetBooking)
class BanquetBookingAdmin(admin.ModelAdmin):
    list_display = (
        'booking_no', 'customer_name', 'banquet_type', 'banquet_date',
        'venue', 'table_count', 'status_display', 'stuck_level_display',
        'sales_person', 'floor_supervisor', 'kitchen_coordinator',
        'submitted_at'
    )
    list_filter = ('status', 'banquet_type', 'venue', 'banquet_date')
    search_fields = ('booking_no', 'customer_name', 'customer_phone')
    readonly_fields = ('booking_no', 'created_at', 'updated_at', 'submitted_at')
    date_hierarchy = 'banquet_date'
    inlines = [MenuConfirmationInline]

    def status_display(self, obj):
        status_map = {
            'draft': 'badge-secondary',
            'submitted': 'badge-primary',
            'menu_confirmed': 'badge-info',
            'kitchen_received': 'badge-warning',
            'in_progress': 'badge-success',
            'completed': 'badge-dark',
            'cancelled': 'badge-danger',
        }
        badge_class = status_map.get(obj.status, 'badge-secondary')
        return format_html(
            '<span class="badge {}">{}</span>',
            badge_class, obj.get_status_display()
        )
    status_display.short_description = '状态'
    status_display.admin_order_field = 'status'

    def stuck_level_display(self, obj):
        level = obj.get_stuck_level()
        if level == StuckLevel.STUCK:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">{}</span>',
                StuckLevel(level).label
            )
        elif level == StuckLevel.WARNING:
            return format_html(
                '<span style="color: #ffc107; font-weight: bold;">{}</span>',
                StuckLevel(level).label
            )
        return format_html(
            '<span style="color: #28a745;">{}</span>',
            StuckLevel(level).label
        )
    stuck_level_display.short_description = '卡住状态'

    class Media:
        css = {
            'all': ('https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css',)
        }
