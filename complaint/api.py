from ninja import NinjaAPI, Schema
from ninja.orm import ModelSchema
from .models import Complaint, BatchAnalysis, Recipe, FeedingRecord, AuditLog, ErrorCode
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import datetime, timedelta

api = NinjaAPI()

class RecipeSchema(ModelSchema):
    class Meta:
        model = Recipe
        fields = '__all__'

class RecipeCreateSchema(Schema):
    recipe_code: str
    name: str
    ingredients: dict
    specifications: dict
    created_by: str

class RecipeUpdateSchema(Schema):
    name: str = None
    ingredients: dict = None
    specifications: dict = None

class FeedingRecordSchema(ModelSchema):
    class Meta:
        model = FeedingRecord
        fields = '__all__'

class FeedingRecordCreateSchema(Schema):
    batch_number: str
    recipe_id: int
    feeding_data: dict
    deviation: float = 0
    created_by: str

class ComplaintSchema(ModelSchema):
    class Meta:
        model = Complaint
        fields = '__all__'

class ComplaintCreateSchema(Schema):
    customer_name: str
    contact_info: str
    batch_number: str
    complaint_type: str
    severity: str = 'medium'
    description: str
    created_by: str

class ComplaintUpdateSchema(Schema):
    status: str = None
    processed_by: str = None
    resolved_by: str = None
    description: str = None

class BatchAnalysisSchema(ModelSchema):
    class Meta:
        model = BatchAnalysis
        fields = '__all__'

class BatchAnalysisCreateSchema(Schema):
    complaint_id: int
    batch_number: str
    recipe_id: int = None
    feeding_record_id: int = None
    analysis_data: dict
    conclusion: str
    result: str
    recommendations: str = None
    created_by: str

class BatchAnalysisUpdateSchema(Schema):
    status: str = None
    reviewed_by: str = None
    conclusion: str = None
    recommendations: str = None

class AuditLogSchema(ModelSchema):
    class Meta:
        model = AuditLog
        fields = '__all__'

class ErrorCodeSchema(ModelSchema):
    class Meta:
        model = ErrorCode
        fields = '__all__'

class DashboardStatsSchema(Schema):
    pending_complaints: int
    processing_complaints: int
    risk_items: int
    recent_changes: int

def generate_complaint_code():
    count = Complaint.objects.count() + 1
    return f'COMP-{datetime.now().strftime("%Y%m%d")}-{count:04d}'

def generate_analysis_code():
    count = BatchAnalysis.objects.count() + 1
    return f'ANA-{datetime.now().strftime("%Y%m%d")}-{count:04d}'

def log_action(module, action, obj, operator, details=None):
    AuditLog.objects.create(
        module=module,
        action=action,
        object_id=obj.id,
        object_code=getattr(obj, 'complaint_code', getattr(obj, 'analysis_code', str(obj.id))),
        operator=operator,
        details=details or {}
    )

@api.post('/recipes/', response=RecipeSchema)
def create_recipe(request, data: RecipeCreateSchema):
    recipe = Recipe.objects.create(
        recipe_code=data.recipe_code,
        name=data.name,
        ingredients=data.ingredients,
        specifications=data.specifications,
        created_by=data.created_by
    )
    log_action(AuditLog.MODULE_RECIPE, AuditLog.ACTION_CREATE, recipe, data.created_by)
    return recipe

@api.get('/recipes/', response=list[RecipeSchema])
def list_recipes(request):
    return Recipe.objects.all()

@api.get('/recipes/{recipe_id}', response=RecipeSchema)
def get_recipe(request, recipe_id: int):
    return get_object_or_404(Recipe, id=recipe_id)

@api.put('/recipes/{recipe_id}', response=RecipeSchema)
def update_recipe(request, recipe_id: int, data: RecipeUpdateSchema):
    recipe = get_object_or_404(Recipe, id=recipe_id)
    old_status = recipe.status
    if data.name:
        recipe.name = data.name
    if data.ingredients:
        recipe.ingredients = data.ingredients
    if data.specifications:
        recipe.specifications = data.specifications
    recipe.save()
    log_action(AuditLog.MODULE_RECIPE, AuditLog.ACTION_UPDATE, recipe, request.GET.get('operator', 'system'),
               {'old_status': old_status, 'new_status': recipe.status})
    return recipe

@api.post('/recipes/{recipe_id}/approve')
def approve_recipe(request, recipe_id: int, operator: str):
    recipe = get_object_or_404(Recipe, id=recipe_id)
    recipe.status = Recipe.STATUS_APPROVED
    recipe.approved_by = operator
    recipe.approved_at = datetime.now()
    recipe.save()
    log_action(AuditLog.MODULE_RECIPE, AuditLog.ACTION_APPROVE, recipe, operator)
    return {'success': True, 'message': '配方单已审核通过'}

@api.post('/feeding-records/', response=FeedingRecordSchema)
def create_feeding_record(request, data: FeedingRecordCreateSchema):
    recipe = get_object_or_404(Recipe, id=data.recipe_id)
    is_deviation_exceeded = data.deviation > recipe.specifications.get('max_deviation', 5)
    feeding_record = FeedingRecord.objects.create(
        batch_number=data.batch_number,
        recipe=recipe,
        feeding_data=data.feeding_data,
        deviation=data.deviation,
        is_deviation_exceeded=is_deviation_exceeded,
        created_by=data.created_by
    )
    log_action(AuditLog.MODULE_FEEDING, AuditLog.ACTION_CREATE, feeding_record, data.created_by)
    return feeding_record

@api.get('/feeding-records/', response=list[FeedingRecordSchema])
def list_feeding_records(request):
    return FeedingRecord.objects.all()

@api.get('/feeding-records/{record_id}', response=FeedingRecordSchema)
def get_feeding_record(request, record_id: int):
    return get_object_or_404(FeedingRecord, id=record_id)

@api.post('/feeding-records/{record_id}/confirm')
def confirm_feeding_record(request, record_id: int, operator: str):
    record = get_object_or_404(FeedingRecord, id=record_id)
    record.status = FeedingRecord.STATUS_CONFIRMED
    record.confirmed_by = operator
    record.confirmed_at = datetime.now()
    record.save()
    log_action(AuditLog.MODULE_FEEDING, AuditLog.ACTION_APPROVE, record, operator)
    return {'success': True, 'message': '投料记录已确认'}

@api.post('/complaints/', response=ComplaintSchema)
def create_complaint(request, data: ComplaintCreateSchema):
    complaint_code = generate_complaint_code()
    
    feeding_record = None
    try:
        feeding_record = FeedingRecord.objects.filter(batch_number=data.batch_number).first()
    except:
        pass
    
    complaint = Complaint.objects.create(
        complaint_code=complaint_code,
        customer_name=data.customer_name,
        contact_info=data.contact_info,
        batch_number=data.batch_number,
        complaint_type=data.complaint_type,
        severity=data.severity,
        description=data.description,
        created_by=data.created_by,
        related_feeding_record=feeding_record
    )
    log_action(AuditLog.MODULE_COMPLAINT, AuditLog.ACTION_CREATE, complaint, data.created_by)
    return complaint

@api.get('/complaints/', response=list[ComplaintSchema])
def list_complaints(request, status: str = None):
    queryset = Complaint.objects.all()
    if status:
        queryset = queryset.filter(status=status)
    return queryset

@api.get('/complaints/{complaint_id}', response=ComplaintSchema)
def get_complaint(request, complaint_id: int):
    return get_object_or_404(Complaint, id=complaint_id)

@api.put('/complaints/{complaint_id}', response=ComplaintSchema)
def update_complaint(request, complaint_id: int, data: ComplaintUpdateSchema):
    complaint = get_object_or_404(Complaint, id=complaint_id)
    old_status = complaint.status
    
    if data.status:
        complaint.status = data.status
    if data.description:
        complaint.description = data.description
    if data.processed_by and complaint.status == Complaint.STATUS_PENDING:
        complaint.processed_by = data.processed_by
        complaint.processed_at = datetime.now()
    if data.resolved_by and complaint.status == Complaint.STATUS_RESOLVED:
        complaint.resolved_by = data.resolved_by
        complaint.resolved_at = datetime.now()
    
    complaint.save()
    log_action(AuditLog.MODULE_COMPLAINT, AuditLog.ACTION_UPDATE, complaint, 
               data.processed_by or data.resolved_by or 'system',
               {'old_status': old_status, 'new_status': complaint.status})
    return complaint

@api.post('/complaints/{complaint_id}/process')
def process_complaint(request, complaint_id: int, operator: str):
    complaint = get_object_or_404(Complaint, id=complaint_id)
    if complaint.status != Complaint.STATUS_PENDING:
        return {'success': False, 'message': '投诉状态不是待处理'}
    
    complaint.status = Complaint.STATUS_PROCESSING
    complaint.processed_by = operator
    complaint.processed_at = datetime.now()
    complaint.save()
    log_action(AuditLog.MODULE_COMPLAINT, AuditLog.ACTION_UPDATE, complaint, operator,
               {'old_status': Complaint.STATUS_PENDING, 'new_status': Complaint.STATUS_PROCESSING})
    return {'success': True, 'message': '投诉已开始处理'}

@api.post('/complaints/{complaint_id}/resolve')
def resolve_complaint(request, complaint_id: int, operator: str, conclusion: str):
    complaint = get_object_or_404(Complaint, id=complaint_id)
    if complaint.status not in [Complaint.STATUS_PROCESSING, Complaint.STATUS_ANALYZED]:
        return {'success': False, 'message': '投诉状态不允许解决'}
    
    complaint.status = Complaint.STATUS_RESOLVED
    complaint.resolved_by = operator
    complaint.resolved_at = datetime.now()
    complaint.description = f'{complaint.description}\n\n处理结果: {conclusion}'
    complaint.save()
    log_action(AuditLog.MODULE_COMPLAINT, AuditLog.ACTION_RESOLVE, complaint, operator,
               {'conclusion': conclusion})
    return {'success': True, 'message': '投诉已解决'}

@api.post('/batch-analysis/', response=BatchAnalysisSchema)
def create_batch_analysis(request, data: BatchAnalysisCreateSchema):
    complaint = get_object_or_404(Complaint, id=data.complaint_id)
    
    recipe = None
    if data.recipe_id:
        recipe = get_object_or_404(Recipe, id=data.recipe_id)
    
    feeding_record = None
    if data.feeding_record_id:
        feeding_record = get_object_or_404(FeedingRecord, id=data.feeding_record_id)
    
    analysis_code = generate_analysis_code()
    analysis = BatchAnalysis.objects.create(
        analysis_code=analysis_code,
        complaint=complaint,
        batch_number=data.batch_number,
        recipe=recipe,
        feeding_record=feeding_record,
        analysis_data=data.analysis_data,
        conclusion=data.conclusion,
        result=data.result,
        recommendations=data.recommendations,
        status=BatchAnalysis.STATUS_ANALYZING,
        created_by=data.created_by
    )
    
    complaint.status = Complaint.STATUS_ANALYZED
    complaint.save()
    
    log_action(AuditLog.MODULE_ANALYSIS, AuditLog.ACTION_CREATE, analysis, data.created_by)
    return analysis

@api.get('/batch-analysis/', response=list[BatchAnalysisSchema])
def list_batch_analysis(request, status: str = None):
    queryset = BatchAnalysis.objects.all()
    if status:
        queryset = queryset.filter(status=status)
    return queryset

@api.get('/batch-analysis/{analysis_id}', response=BatchAnalysisSchema)
def get_batch_analysis(request, analysis_id: int):
    return get_object_or_404(BatchAnalysis, id=analysis_id)

@api.put('/batch-analysis/{analysis_id}', response=BatchAnalysisSchema)
def update_batch_analysis(request, analysis_id: int, data: BatchAnalysisUpdateSchema):
    analysis = get_object_or_404(BatchAnalysis, id=analysis_id)
    old_status = analysis.status
    
    if data.status:
        analysis.status = data.status
    if data.conclusion:
        analysis.conclusion = data.conclusion
    if data.recommendations:
        analysis.recommendations = data.recommendations
    if data.reviewed_by and analysis.status == BatchAnalysis.STATUS_COMPLETED:
        analysis.status = BatchAnalysis.STATUS_REVIEWED
        analysis.reviewed_by = data.reviewed_by
        analysis.reviewed_at = datetime.now()
    
    analysis.save()
    log_action(AuditLog.MODULE_ANALYSIS, AuditLog.ACTION_UPDATE, analysis, 
               data.reviewed_by or 'system',
               {'old_status': old_status, 'new_status': analysis.status})
    return analysis

@api.post('/batch-analysis/{analysis_id}/complete')
def complete_analysis(request, analysis_id: int, operator: str):
    analysis = get_object_or_404(BatchAnalysis, id=analysis_id)
    analysis.status = BatchAnalysis.STATUS_COMPLETED
    analysis.save()
    log_action(AuditLog.MODULE_ANALYSIS, AuditLog.ACTION_UPDATE, analysis, operator,
               {'old_status': analysis.status, 'new_status': BatchAnalysis.STATUS_COMPLETED})
    return {'success': True, 'message': '批次分析已完成'}

@api.post('/batch-analysis/{analysis_id}/review')
def review_analysis(request, analysis_id: int, operator: str):
    analysis = get_object_or_404(BatchAnalysis, id=analysis_id)
    if analysis.status != BatchAnalysis.STATUS_COMPLETED:
        return {'success': False, 'message': '分析未完成，无法复核'}
    
    analysis.status = BatchAnalysis.STATUS_REVIEWED
    analysis.reviewed_by = operator
    analysis.reviewed_at = datetime.now()
    analysis.save()
    log_action(AuditLog.MODULE_ANALYSIS, AuditLog.ACTION_REVIEW, analysis, operator)
    return {'success': True, 'message': '批次分析已复核'}

@api.get('/audit-logs/', response=list[AuditLogSchema])
def list_audit_logs(request, module: str = None, operator: str = None):
    queryset = AuditLog.objects.all()
    if module:
        queryset = queryset.filter(module=module)
    if operator:
        queryset = queryset.filter(operator=operator)
    return queryset[:100]

@api.get('/error-codes/', response=list[ErrorCodeSchema])
def list_error_codes(request):
    return ErrorCode.objects.all()

@api.get('/dashboard/stats', response=DashboardStatsSchema)
def get_dashboard_stats(request):
    pending = Complaint.objects.filter(status=Complaint.STATUS_PENDING).count()
    processing = Complaint.objects.filter(status=Complaint.STATUS_PROCESSING).count()
    risk_items = Complaint.objects.filter(severity__in=[Complaint.SEVERITY_HIGH, Complaint.SEVERITY_CRITICAL]).count()
    recent_changes = AuditLog.objects.filter(timestamp__gte=datetime.now()-timedelta(hours=24)).count()
    
    return {
        'pending_complaints': pending,
        'processing_complaints': processing,
        'risk_items': risk_items,
        'recent_changes': recent_changes
    }

@api.get('/dashboard/pending', response=list[ComplaintSchema])
def get_pending_complaints(request):
    return Complaint.objects.filter(status=Complaint.STATUS_PENDING)[:20]

@api.get('/dashboard/risk', response=list[ComplaintSchema])
def get_risk_complaints(request):
    return Complaint.objects.filter(severity__in=[Complaint.SEVERITY_HIGH, Complaint.SEVERITY_CRITICAL])[:20]

@api.get('/dashboard/recent', response=list[ComplaintSchema])
def get_recent_complaints(request):
    return Complaint.objects.order_by('-created_at')[:20]
