from django.contrib import admin
from .models import Recipe, FeedingRecord, Complaint, BatchAnalysis, AuditLog, ErrorCode

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('recipe_code', 'name', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('recipe_code', 'name')
    ordering = ('-created_at',)

@admin.register(FeedingRecord)
class FeedingRecordAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'recipe', 'deviation', 'is_deviation_exceeded', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'is_deviation_exceeded', 'created_at')
    search_fields = ('batch_number',)
    ordering = ('-created_at',)

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('complaint_code', 'customer_name', 'batch_number', 'complaint_type', 'severity', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'complaint_type', 'severity', 'created_at')
    search_fields = ('complaint_code', 'customer_name', 'batch_number')
    ordering = ('-created_at',)

@admin.register(BatchAnalysis)
class BatchAnalysisAdmin(admin.ModelAdmin):
    list_display = ('analysis_code', 'complaint', 'batch_number', 'result', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'result', 'created_at')
    search_fields = ('analysis_code', 'batch_number')
    ordering = ('-created_at',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('module', 'action', 'object_code', 'operator', 'timestamp')
    list_filter = ('module', 'action', 'timestamp')
    search_fields = ('object_code', 'operator')
    ordering = ('-timestamp',)
    readonly_fields = ('module', 'action', 'object_id', 'object_code', 'operator', 'timestamp', 'details', 'ip_address')

@admin.register(ErrorCode)
class ErrorCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'description', 'severity')
    search_fields = ('code', 'description')
    ordering = ('code',)
