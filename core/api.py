from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import NinjaAPI, Schema, ModelSchema
from ninja.security import HttpBearer
from .models import User, MilkingBatch, QualityTest, Attachment, Notification, ErrorLog
import csv
from io import StringIO
from typing import List, Optional

api = NinjaAPI()

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            user = User.objects.get(username=token)
            return user
        except User.DoesNotExist:
            return None

auth = AuthBearer()

class UserSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'phone']

class MilkingBatchSchema(ModelSchema):
    milker_username: Optional[str] = None
    quality_tests_count: int = 0
    
    class Meta:
        model = MilkingBatch
        fields = ['id', 'batch_no', 'cow_count', 'start_time', 'end_time', 'total_milk', 'avg_milk', 'status', 'antibiotic_isolated', 'isolation_reason', 'created_at', 'updated_at']

class QualityTestSchema(ModelSchema):
    tester_username: Optional[str] = None
    
    class Meta:
        model = QualityTest
        fields = ['id', 'test_type', 'result', 'test_value', 'threshold_min', 'threshold_max', 'test_time', 'notes', 'created_at']

class AttachmentSchema(ModelSchema):
    class Meta:
        model = Attachment
        fields = ['id', 'file_name', 'file_size', 'attachment_type', 'uploaded_at']

class NotificationSchema(ModelSchema):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'notification_type', 'read', 'created_at']

class ErrorLogSchema(ModelSchema):
    class Meta:
        model = ErrorLog
        fields = ['id', 'error_code', 'description', 'occurred_at', 'resolved']

class CreateBatchSchema(Schema):
    batch_no: str
    cow_count: int

class UpdateBatchSchema(Schema):
    cow_count: Optional[int] = None
    status: Optional[str] = None
    antibiotic_isolated: Optional[bool] = None
    isolation_reason: Optional[str] = None

class CreateTestSchema(Schema):
    batch_id: int
    test_type: str
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None

class UpdateTestSchema(Schema):
    result: Optional[str] = None
    test_value: Optional[float] = None
    notes: Optional[str] = None

@api.get("/error-codes", response=List[dict])
def get_error_codes(request):
    error_codes = [{'code': code[0], 'description': code[1]} for code in ErrorLog.ERROR_CODE_CHOICES]
    return error_codes

@api.get("/batches", response=List[MilkingBatchSchema])
def list_batches(request, status: Optional[str] = None, antibiotic_isolated: Optional[bool] = None):
    queryset = MilkingBatch.objects.all().order_by('-created_at')
    
    if status:
        queryset = queryset.filter(status=status)
    if antibiotic_isolated is not None:
        queryset = queryset.filter(antibiotic_isolated=antibiotic_isolated)
    
    result = []
    for batch in queryset:
        schema = MilkingBatchSchema.from_orm(batch)
        schema.milker_username = batch.milker.username if batch.milker else None
        schema.quality_tests_count = batch.quality_tests.count()
        result.append(schema)
    
    return result

@api.get("/batches/{batch_id}", response=MilkingBatchSchema)
def get_batch_detail(request, batch_id: int):
    batch = get_object_or_404(MilkingBatch, id=batch_id)
    schema = MilkingBatchSchema.from_orm(batch)
    schema.milker_username = batch.milker.username if batch.milker else None
    schema.quality_tests_count = batch.quality_tests.count()
    return schema

@api.post("/batches", response=MilkingBatchSchema, auth=auth)
def create_batch(request, data: CreateBatchSchema):
    if MilkingBatch.objects.filter(batch_no=data.batch_no).exists():
        return api.create_response(request, {'error': '批次号已存在'}, status=400)
    
    batch = MilkingBatch.objects.create(
        batch_no=data.batch_no,
        cow_count=data.cow_count,
        milker=request.auth
    )
    
    schema = MilkingBatchSchema.from_orm(batch)
    schema.milker_username = request.auth.username
    return schema

@api.put("/batches/{batch_id}", response=MilkingBatchSchema, auth=auth)
def update_batch(request, batch_id: int, data: UpdateBatchSchema):
    batch = get_object_or_404(MilkingBatch, id=batch_id)
    
    if data.cow_count is not None:
        batch.cow_count = data.cow_count
    if data.status is not None:
        batch.status = data.status
        if data.status == 'milking' and not batch.start_time:
            batch.start_time = timezone.now()
        elif data.status == 'completed' and not batch.end_time:
            batch.end_time = timezone.now()
    if data.antibiotic_isolated is not None:
        batch.antibiotic_isolated = data.antibiotic_isolated
    if data.isolation_reason is not None:
        batch.isolation_reason = data.isolation_reason
    
    batch.save()
    
    schema = MilkingBatchSchema.from_orm(batch)
    schema.milker_username = batch.milker.username if batch.milker else None
    schema.quality_tests_count = batch.quality_tests.count()
    return schema

@api.delete("/batches/{batch_id}", auth=auth)
def delete_batch(request, batch_id: int):
    batch = get_object_or_404(MilkingBatch, id=batch_id)
    batch.delete()
    return {'success': True}

@api.get("/quality-tests", response=List[QualityTestSchema])
def list_quality_tests(request, batch_id: Optional[int] = None, result: Optional[str] = None):
    queryset = QualityTest.objects.all().order_by('-created_at')
    
    if batch_id:
        queryset = queryset.filter(batch_id=batch_id)
    if result:
        queryset = queryset.filter(result=result)
    
    result_list = []
    for test in queryset:
        schema = QualityTestSchema.from_orm(test)
        schema.tester_username = test.tester.username if test.tester else None
        result_list.append(schema)
    
    return result_list

@api.get("/quality-tests/{test_id}", response=QualityTestSchema)
def get_quality_test(request, test_id: int):
    test = get_object_or_404(QualityTest, id=test_id)
    schema = QualityTestSchema.from_orm(test)
    schema.tester_username = test.tester.username if test.tester else None
    return schema

@api.post("/quality-tests", response=QualityTestSchema, auth=auth)
def create_quality_test(request, data: CreateTestSchema):
    batch = get_object_or_404(MilkingBatch, id=data.batch_id)
    
    test = QualityTest.objects.create(
        batch=batch,
        test_type=data.test_type,
        threshold_min=data.threshold_min,
        threshold_max=data.threshold_max,
        tester=request.auth
    )
    
    schema = QualityTestSchema.from_orm(test)
    schema.tester_username = request.auth.username
    return schema

@api.put("/quality-tests/{test_id}", response=QualityTestSchema, auth=auth)
def update_quality_test(request, test_id: int, data: UpdateTestSchema):
    test = get_object_or_404(QualityTest, id=test_id)
    
    if data.result is not None:
        test.result = data.result
    if data.test_value is not None:
        test.test_value = data.test_value
        test.test_time = timezone.now()
    if data.notes is not None:
        test.notes = data.notes
    
    test.save()
    
    schema = QualityTestSchema.from_orm(test)
    schema.tester_username = test.tester.username if test.tester else None
    return schema

@api.get("/notifications", response=List[NotificationSchema], auth=auth)
def list_notifications(request, read: Optional[bool] = None):
    queryset = Notification.objects.filter(user=request.auth).order_by('-created_at')
    
    if read is not None:
        queryset = queryset.filter(read=read)
    
    return [NotificationSchema.from_orm(n) for n in queryset]

@api.put("/notifications/{notification_id}/read", auth=auth)
def mark_notification_read(request, notification_id: int):
    notification = get_object_or_404(Notification, id=notification_id, user=request.auth)
    notification.read = True
    notification.save()
    return {'success': True}

@api.get("/error-logs", response=List[ErrorLogSchema], auth=auth)
def list_error_logs(request, resolved: Optional[bool] = None, error_code: Optional[str] = None):
    queryset = ErrorLog.objects.all().order_by('-occurred_at')
    
    if resolved is not None:
        queryset = queryset.filter(resolved=resolved)
    if error_code:
        queryset = queryset.filter(error_code=error_code)
    
    return [ErrorLogSchema.from_orm(e) for e in queryset]

@api.post("/error-logs", response=ErrorLogSchema, auth=auth)
def create_error_log(request, error_code: str, description: str, batch_id: Optional[int] = None):
    batch = MilkingBatch.objects.filter(id=batch_id).first() if batch_id else None
    
    error_log = ErrorLog.objects.create(
        error_code=error_code,
        description=description,
        batch=batch
    )
    
    return ErrorLogSchema.from_orm(error_log)

@api.put("/error-logs/{log_id}/resolve", auth=auth)
def resolve_error_log(request, log_id: int):
    error_log = get_object_or_404(ErrorLog, id=log_id)
    error_log.resolved = True
    error_log.resolved_by = request.auth
    error_log.resolved_at = timezone.now()
    error_log.save()
    return {'success': True}

@api.get("/export/batches")
def export_batches(request):
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['批次号', '奶牛数量', '开始时间', '结束时间', '总奶量', '平均奶量', '状态', '抗生素隔离', '隔离原因', '挤奶员', '创建时间'])
    
    batches = MilkingBatch.objects.all().order_by('-created_at')
    for batch in batches:
        writer.writerow([
            batch.batch_no,
            batch.cow_count,
            batch.start_time,
            batch.end_time,
            batch.total_milk,
            batch.avg_milk,
            batch.get_status_display(),
            '是' if batch.antibiotic_isolated else '否',
            batch.isolation_reason or '',
            batch.milker.username if batch.milker else '',
            batch.created_at
        ])
    
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="milking_batches.csv"'
    return response

@api.get("/export/quality-tests")
def export_quality_tests(request):
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['批次号', '检测类型', '结果', '检测值', '阈值下限', '阈值上限', '检测时间', '检测员', '备注', '创建时间'])
    
    tests = QualityTest.objects.all().order_by('-created_at')
    for test in tests:
        writer.writerow([
            test.batch.batch_no,
            test.get_test_type_display(),
            test.get_result_display(),
            test.test_value,
            test.threshold_min,
            test.threshold_max,
            test.test_time,
            test.tester.username if test.tester else '',
            test.notes or '',
            test.created_at
        ])
    
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="quality_tests.csv"'
    return response

@api.get("/user/me", response=UserSchema, auth=auth)
def get_current_user(request):
    return UserSchema.from_orm(request.auth)
