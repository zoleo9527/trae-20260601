from django.http import HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import NinjaAPI, Schema, ModelSchema, File
from ninja.security import HttpBearer
from .models import User, MilkingBatch, QualityTest, Attachment, Notification, ErrorLog
import csv
import os
from io import StringIO
from typing import List, Optional, Dict, Any

api = NinjaAPI()

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            user = User.objects.get(username=token)
            return user
        except User.DoesNotExist:
            return None

auth = AuthBearer()

def get_role_actions(user: User, batch: MilkingBatch = None) -> List[Dict[str, str]]:
    actions = []
    role = user.role
    
    if role == 'manager':
        actions = [
            {'action': 'view_all', 'label': '查看所有批次'},
            {'action': 'view_detail', 'label': '查看详情'},
            {'action': 'create_batch', 'label': '创建批次'},
            {'action': 'edit_batch', 'label': '编辑批次'},
            {'action': 'delete_batch', 'label': '删除批次'},
            {'action': 'view_errors', 'label': '查看错误日志'},
            {'action': 'resolve_error', 'label': '处理异常'},
            {'action': 'export_data', 'label': '导出数据'},
        ]
    elif role == 'milker':
        base_actions = [
            {'action': 'view_my_batches', 'label': '查看我的批次'},
            {'action': 'view_detail', 'label': '查看详情'},
            {'action': 'add_attachment', 'label': '上传附件'},
        ]
        actions.extend(base_actions)
        if batch and batch.milker_id == user.id:
            if batch.status == 'pending':
                actions.append({'action': 'start_milking', 'label': '开始挤奶'})
            elif batch.status == 'milking':
                actions.append({'action': 'end_milking', 'label': '结束挤奶'})
                actions.append({'action': 'record_milk', 'label': '记录奶量'})
    elif role == 'vet':
        actions = [
            {'action': 'view_all', 'label': '查看所有批次'},
            {'action': 'view_detail', 'label': '查看详情'},
            {'action': 'view_tests', 'label': '查看检测结果'},
            {'action': 'create_test', 'label': '创建检测'},
            {'action': 'update_test', 'label': '更新检测结果'},
            {'action': 'mark_isolation', 'label': '标记隔离'},
            {'action': 'add_health_note', 'label': '添加健康记录'},
        ]
    
    return actions

class UserSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'phone']

class MilkingBatchDetailSchema(ModelSchema):
    milker_username: Optional[str] = None
    quality_tests_count: int = 0
    quality_summary: Dict[str, Any] = {}
    available_actions: List[Dict[str, str]] = []
    attachments_count: int = 0
    error_logs_count: int = 0
    
    class Meta:
        model = MilkingBatch
        fields = ['id', 'batch_no', 'cow_count', 'start_time', 'end_time', 'total_milk', 'avg_milk', 'status', 'antibiotic_isolated', 'isolation_reason', 'created_at', 'updated_at']

class QualityTestDetailSchema(ModelSchema):
    tester_username: Optional[str] = None
    batch_no: str = ''
    batch_status: str = ''
    error_code: Optional[str] = None
    processed_by_username: Optional[str] = None
    processed_at: Optional[str] = None
    process_notes: Optional[str] = None
    
    class Meta:
        model = QualityTest
        fields = ['id', 'test_type', 'result', 'test_value', 'threshold_min', 'threshold_max', 'test_time', 'notes', 'created_at', 'updated_at']

class AttachmentDetailSchema(ModelSchema):
    uploaded_by_username: Optional[str] = None
    download_url: str = ''
    
    class Meta:
        model = Attachment
        fields = ['id', 'file_name', 'file_size', 'attachment_type', 'uploaded_at']

class NotificationSchema(ModelSchema):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'notification_type', 'read', 'created_at']

class ErrorLogDetailSchema(ModelSchema):
    batch_no: Optional[str] = None
    resolved_by_username: Optional[str] = None
    
    class Meta:
        model = ErrorLog
        fields = ['id', 'error_code', 'description', 'occurred_at', 'resolved', 'resolved_at']

class WorkItemSchema(Schema):
    id: int
    batch_no: str
    status: str
    status_label: str
    cow_count: int
    created_at: str
    available_actions: List[Dict[str, str]] = []
    latest_test_result: Optional[str] = None
    has_unread_notifications: bool = False

class CreateBatchSchema(Schema):
    batch_no: str
    cow_count: int

class UpdateBatchSchema(Schema):
    cow_count: Optional[int] = None
    status: Optional[str] = None
    antibiotic_isolated: Optional[bool] = None
    isolation_reason: Optional[str] = None
    total_milk: Optional[float] = None

class CreateTestSchema(Schema):
    batch_id: int
    test_type: str
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None

class UpdateTestSchema(Schema):
    result: Optional[str] = None
    test_value: Optional[float] = None
    notes: Optional[str] = None

class UploadAttachmentSchema(Schema):
    attachment_type: str
    batch_id: Optional[int] = None
    test_id: Optional[int] = None

def trigger_notifications(batch: MilkingBatch, notification_type: str, content: str):
    if notification_type == 'quality_fail':
        managers = User.objects.filter(role='manager')
        vets = User.objects.filter(role='vet')
        recipients = list(managers) + list(vets)
        for user in recipients:
            Notification.objects.create(
                user=user,
                title='质量检测不合格',
                content=content,
                notification_type='quality_fail',
                batch=batch
            )
    elif notification_type == 'antibiotic_alert':
        managers = User.objects.filter(role='manager')
        milker = batch.milker
        recipients = list(managers)
        if milker:
            recipients.append(milker)
        for user in recipients:
            Notification.objects.create(
                user=user,
                title='抗生素隔离提醒',
                content=content,
                notification_type='antibiotic_alert',
                batch=batch
            )
    elif notification_type == 'batch_completed':
        managers = User.objects.filter(role='manager')
        for user in managers:
            Notification.objects.create(
                user=user,
                title='批次完成通知',
                content=content,
                notification_type='batch_completed',
                batch=batch
            )

def update_batch_status_from_tests(batch: MilkingBatch):
    tests = batch.quality_tests.all()
    if not tests.exists():
        return
    
    has_pending = tests.filter(result='pending').exists()
    has_testing = tests.filter(result='testing').exists()
    has_fail = tests.filter(result='fail').exists()
    has_pass = tests.filter(result='pass').exists()
    
    antibiotic_fail = tests.filter(test_type='antibiotic', result='fail').exists()
    
    if antibiotic_fail:
        batch.status = 'isolated'
        batch.antibiotic_isolated = True
        batch.isolation_reason = '抗生素检测不合格'
        trigger_notifications(batch, 'antibiotic_alert', f'批次 {batch.batch_no} 抗生素检测不合格，已自动隔离')
    elif has_fail:
        batch.status = 'abnormal'
        batch.antibiotic_isolated = False
        trigger_notifications(batch, 'quality_fail', f'批次 {batch.batch_no} 质量检测不合格')
    elif has_pending or has_testing:
        batch.status = 'testing'
    elif has_pass and not has_pending and not has_testing and not has_fail:
        batch.status = 'completed'
    
    batch.save()

@api.get("/error-codes", response=List[dict])
def get_error_codes(request):
    error_codes = [{'code': code[0], 'description': code[1]} for code in ErrorLog.ERROR_CODE_CHOICES]
    return error_codes

@api.get("/batches", response=List[MilkingBatchDetailSchema])
def list_batches(request, status: Optional[str] = None, antibiotic_isolated: Optional[bool] = None):
    queryset = MilkingBatch.objects.all().order_by('-created_at')
    
    if status:
        queryset = queryset.filter(status=status)
    if antibiotic_isolated is not None:
        queryset = queryset.filter(antibiotic_isolated=antibiotic_isolated)
    
    result = []
    for batch in queryset:
        schema = MilkingBatchDetailSchema.from_orm(batch)
        schema.milker_username = batch.milker.username if batch.milker else None
        schema.quality_tests_count = batch.quality_tests.count()
        schema.attachments_count = batch.attachments.count()
        schema.error_logs_count = ErrorLog.objects.filter(batch=batch, resolved=False).count()
        
        tests = batch.quality_tests.all()
        test_summary = {}
        for test in tests:
            test_summary[test.test_type] = {
                'result': test.result,
                'result_label': dict(QualityTest.RESULT_CHOICES).get(test.result, test.result),
                'test_value': float(test.test_value) if test.test_value else None,
                'threshold_min': float(test.threshold_min) if test.threshold_min else None,
                'threshold_max': float(test.threshold_max) if test.threshold_max else None,
            }
        schema.quality_summary = test_summary
        result.append(schema)
    
    return result

@api.get("/batches/{batch_id}", response=MilkingBatchDetailSchema, auth=auth)
def get_batch_detail(request, batch_id: int):
    batch = get_object_or_404(MilkingBatch, id=batch_id)
    schema = MilkingBatchDetailSchema.from_orm(batch)
    schema.milker_username = batch.milker.username if batch.milker else None
    schema.quality_tests_count = batch.quality_tests.count()
    schema.attachments_count = batch.attachments.count()
    schema.error_logs_count = ErrorLog.objects.filter(batch=batch, resolved=False).count()
    
    tests = batch.quality_tests.all()
    test_summary = {}
    for test in tests:
        test_summary[test.test_type] = {
            'result': test.result,
            'result_label': dict(QualityTest.RESULT_CHOICES).get(test.result, test.result),
            'test_value': float(test.test_value) if test.test_value else None,
            'threshold_min': float(test.threshold_min) if test.threshold_min else None,
            'threshold_max': float(test.threshold_max) if test.threshold_max else None,
            'tester': test.tester.username if test.tester else None,
            'test_time': test.test_time.isoformat() if test.test_time else None,
        }
    schema.quality_summary = test_summary
    
    schema.available_actions = get_role_actions(request.auth, batch)
    
    return schema

@api.post("/batches", response=MilkingBatchDetailSchema, auth=auth)
def create_batch(request, data: CreateBatchSchema):
    if MilkingBatch.objects.filter(batch_no=data.batch_no).exists():
        return api.create_response(request, {'error': '批次号已存在'}, status=400)
    
    batch = MilkingBatch.objects.create(
        batch_no=data.batch_no,
        cow_count=data.cow_count,
        milker=request.auth
    )
    
    schema = MilkingBatchDetailSchema.from_orm(batch)
    schema.milker_username = request.auth.username
    schema.available_actions = get_role_actions(request.auth, batch)
    return schema

@api.put("/batches/{batch_id}", response=MilkingBatchDetailSchema, auth=auth)
def update_batch(request, batch_id: int, data: UpdateBatchSchema):
    batch = get_object_or_404(MilkingBatch, id=batch_id)
    old_status = batch.status
    
    if data.cow_count is not None:
        batch.cow_count = data.cow_count
    if data.status is not None:
        batch.status = data.status
        if data.status == 'milking' and not batch.start_time:
            batch.start_time = timezone.now()
        elif data.status == 'completed' and not batch.end_time:
            batch.end_time = timezone.now()
            trigger_notifications(batch, 'batch_completed', f'批次 {batch.batch_no} 已完成挤奶')
    if data.antibiotic_isolated is not None:
        batch.antibiotic_isolated = data.antibiotic_isolated
        if data.antibiotic_isolated:
            batch.status = 'isolated'
            trigger_notifications(batch, 'antibiotic_alert', f'批次 {batch.batch_no} 已标记抗生素隔离')
    if data.isolation_reason is not None:
        batch.isolation_reason = data.isolation_reason
    if data.total_milk is not None:
        batch.total_milk = data.total_milk
        if batch.cow_count > 0:
            batch.avg_milk = round(data.total_milk / batch.cow_count, 2)
    
    batch.save()
    
    if old_status != 'completed' and batch.status == 'completed':
        QualityTest.objects.get_or_create(
            batch=batch,
            test_type='antibiotic',
            defaults={'threshold_max': 0.05}
        )
    
    schema = MilkingBatchDetailSchema.from_orm(batch)
    schema.milker_username = batch.milker.username if batch.milker else None
    schema.quality_tests_count = batch.quality_tests.count()
    schema.available_actions = get_role_actions(request.auth, batch)
    return schema

@api.delete("/batches/{batch_id}", auth=auth)
def delete_batch(request, batch_id: int):
    batch = get_object_or_404(MilkingBatch, id=batch_id)
    batch.delete()
    return {'success': True}

@api.get("/quality-tests", response=List[QualityTestDetailSchema])
def list_quality_tests(request, batch_id: Optional[int] = None, result: Optional[str] = None):
    queryset = QualityTest.objects.all().order_by('-created_at')
    
    if batch_id:
        queryset = queryset.filter(batch_id=batch_id)
    if result:
        queryset = queryset.filter(result=result)
    
    result_list = []
    for test in queryset:
        schema = QualityTestDetailSchema.from_orm(test)
        schema.tester_username = test.tester.username if test.tester else None
        schema.batch_no = test.batch.batch_no
        schema.batch_status = test.batch.status
        
        error_code = 'E002' if test.test_type == 'antibiotic' else 'E001'
        error_log = ErrorLog.objects.filter(
            batch=test.batch, 
            error_code=error_code, 
            resolved=True
        ).order_by('-resolved_at').first()
        if error_log:
            schema.processed_by_username = error_log.resolved_by.username if error_log.resolved_by else None
            schema.processed_at = error_log.resolved_at.isoformat() if error_log.resolved_at else None
            schema.process_notes = f'已处理: {error_log.description}'
        
        if test.result == 'fail':
            schema.error_code = error_code
        
        result_list.append(schema)
    
    return result_list

@api.get("/quality-tests/{test_id}", response=QualityTestDetailSchema)
def get_quality_test(request, test_id: int):
    test = get_object_or_404(QualityTest, id=test_id)
    schema = QualityTestDetailSchema.from_orm(test)
    schema.tester_username = test.tester.username if test.tester else None
    schema.batch_no = test.batch.batch_no
    schema.batch_status = test.batch.status
    
    error_code = 'E002' if test.test_type == 'antibiotic' else 'E001'
    error_log = ErrorLog.objects.filter(
        batch=test.batch, 
        error_code=error_code, 
        resolved=True
    ).order_by('-resolved_at').first()
    if error_log:
        schema.processed_by_username = error_log.resolved_by.username if error_log.resolved_by else None
        schema.processed_at = error_log.resolved_at.isoformat() if error_log.resolved_at else None
        schema.process_notes = f'已处理: {error_log.description}'
    
    if test.result == 'fail':
        schema.error_code = error_code
    
    return schema

@api.post("/quality-tests", response=QualityTestDetailSchema, auth=auth)
def create_quality_test(request, data: CreateTestSchema):
    batch = get_object_or_404(MilkingBatch, id=data.batch_id)
    
    test = QualityTest.objects.create(
        batch=batch,
        test_type=data.test_type,
        threshold_min=data.threshold_min,
        threshold_max=data.threshold_max,
        tester=request.auth
    )
    
    batch.status = 'testing'
    batch.save()
    
    schema = QualityTestDetailSchema.from_orm(test)
    schema.tester_username = request.auth.username
    schema.batch_no = batch.batch_no
    schema.batch_status = batch.status
    return schema

@api.put("/quality-tests/{test_id}", response=QualityTestDetailSchema, auth=auth)
def update_quality_test(request, test_id: int, data: UpdateTestSchema):
    test = get_object_or_404(QualityTest, id=test_id)
    old_result = test.result
    
    if data.result is not None:
        test.result = data.result
    if data.test_value is not None:
        test.test_value = data.test_value
        test.test_time = timezone.now()
    if data.notes is not None:
        test.notes = data.notes
    
    test.save()
    
    if old_result != 'fail' and test.result == 'fail':
        ErrorLog.objects.create(
            error_code='E002' if test.test_type == 'antibiotic' else 'E001',
            description=f'{dict(QualityTest.TEST_TYPE_CHOICES).get(test.test_type)}检测不合格',
            batch=test.batch
        )
    
    update_batch_status_from_tests(test.batch)
    
    schema = QualityTestDetailSchema.from_orm(test)
    schema.tester_username = test.tester.username if test.tester else None
    schema.batch_no = test.batch.batch_no
    schema.batch_status = test.batch.status
    
    error_code = 'E002' if test.test_type == 'antibiotic' else 'E001'
    error_log = ErrorLog.objects.filter(
        batch=test.batch, 
        error_code=error_code, 
        resolved=True
    ).order_by('-resolved_at').first()
    if error_log:
        schema.processed_by_username = error_log.resolved_by.username if error_log.resolved_by else None
        schema.processed_at = error_log.resolved_at.isoformat() if error_log.resolved_at else None
        schema.process_notes = f'已处理: {error_log.description}'
    
    if test.result == 'fail':
        schema.error_code = error_code
    
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

@api.post("/notifications/{notification_id}/resolve", auth=auth)
def resolve_notification(request, notification_id: int):
    notification = get_object_or_404(Notification, id=notification_id, user=request.auth)
    notification.read = True
    notification.save()
    
    if notification.batch:
        update_batch_status_from_tests(notification.batch)
    
    return {'success': True}

@api.get("/error-logs", response=List[ErrorLogDetailSchema], auth=auth)
def list_error_logs(request, resolved: Optional[bool] = None, error_code: Optional[str] = None):
    queryset = ErrorLog.objects.all().order_by('-occurred_at')
    
    if resolved is not None:
        queryset = queryset.filter(resolved=resolved)
    if error_code:
        queryset = queryset.filter(error_code=error_code)
    
    result = []
    for log in queryset:
        schema = ErrorLogDetailSchema.from_orm(log)
        schema.batch_no = log.batch.batch_no if log.batch else None
        schema.resolved_by_username = log.resolved_by.username if log.resolved_by else None
        result.append(schema)
    
    return result

@api.post("/error-logs", response=ErrorLogDetailSchema, auth=auth)
def create_error_log(request, error_code: str, description: str, batch_id: Optional[int] = None):
    batch = MilkingBatch.objects.filter(id=batch_id).first() if batch_id else None
    
    error_log = ErrorLog.objects.create(
        error_code=error_code,
        description=description,
        batch=batch
    )
    
    schema = ErrorLogDetailSchema.from_orm(error_log)
    schema.batch_no = batch.batch_no if batch else None
    return schema

@api.put("/error-logs/{log_id}/resolve", auth=auth)
def resolve_error_log(request, log_id: int):
    error_log = get_object_or_404(ErrorLog, id=log_id)
    error_log.resolved = True
    error_log.resolved_by = request.auth
    error_log.resolved_at = timezone.now()
    error_log.save()
    
    if error_log.batch:
        if error_log.error_code == 'E002':
            error_log.batch.antibiotic_isolated = False
            error_log.batch.isolation_reason = None
            error_log.batch.save()
        update_batch_status_from_tests(error_log.batch)
    
    return {'success': True}

@api.get("/attachments", response=List[AttachmentDetailSchema], auth=auth)
def list_attachments(request, batch_id: Optional[int] = None):
    queryset = Attachment.objects.all().order_by('-uploaded_at')
    
    if batch_id:
        queryset = queryset.filter(batch_id=batch_id)
    
    result = []
    for attachment in queryset:
        schema = AttachmentDetailSchema.from_orm(attachment)
        schema.uploaded_by_username = attachment.uploaded_by.username if attachment.uploaded_by else None
        schema.download_url = f'/api/attachments/{attachment.id}/download'
        result.append(schema)
    
    return result

@api.post("/attachments", response=AttachmentDetailSchema, auth=auth)
def upload_attachment(request):
    attachment_type = request.POST.get('attachment_type')
    batch_id = request.POST.get('batch_id')
    test_id = request.POST.get('test_id')
    
    batch = MilkingBatch.objects.filter(id=batch_id).first() if batch_id else None
    test = QualityTest.objects.filter(id=test_id).first() if test_id else None
    
    if not batch and not test:
        return api.create_response(request, {'error': '必须指定批次或检测记录'}, status=400)
    
    if not attachment_type:
        return api.create_response(request, {'error': '请指定附件类型'}, status=400)
    
    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return api.create_response(request, {'error': '请上传文件'}, status=400)
    
    filename = uploaded_file.name
    filesize = uploaded_file.size
    
    attachment = Attachment.objects.create(
        batch=batch,
        test=test,
        file=uploaded_file,
        file_name=filename,
        file_size=filesize,
        attachment_type=attachment_type,
        uploaded_by=request.auth
    )
    
    schema = AttachmentDetailSchema.from_orm(attachment)
    schema.uploaded_by_username = request.auth.username
    schema.download_url = f'/api/attachments/{attachment.id}/download'
    return schema

@api.delete("/attachments/{attachment_id}", auth=auth)
def delete_attachment(request, attachment_id: int):
    attachment = get_object_or_404(Attachment, id=attachment_id)
    
    if attachment.file:
        file_path = attachment.file.path
        if os.path.exists(file_path):
            os.remove(file_path)
    
    attachment.delete()
    return {'success': True}

@api.get("/attachments/{attachment_id}/download", auth=auth)
def download_attachment(request, attachment_id: int):
    attachment = get_object_or_404(Attachment, id=attachment_id)
    response = FileResponse(attachment.file.open(), content_type='application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="{attachment.file_name}"'
    return response

@api.get("/work/my", response=List[WorkItemSchema], auth=auth)
def my_work(request):
    user = request.auth
    work_items = []
    
    if user.role == 'milker':
        batches = MilkingBatch.objects.filter(milker=user).order_by('-created_at')
    else:
        batches = MilkingBatch.objects.all().order_by('-created_at')
    
    for batch in batches:
        latest_test = batch.quality_tests.order_by('-created_at').first()
        unread_count = Notification.objects.filter(user=user, batch=batch, read=False).count()
        
        work_items.append(WorkItemSchema(
            id=batch.id,
            batch_no=batch.batch_no,
            status=batch.status,
            status_label=dict(MilkingBatch.STATUS_CHOICES).get(batch.status, batch.status),
            cow_count=batch.cow_count,
            created_at=batch.created_at.isoformat(),
            available_actions=get_role_actions(user, batch),
            latest_test_result=latest_test.result if latest_test else None,
            has_unread_notifications=unread_count > 0
        ))
    
    return work_items

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

@api.get("/user/actions", response=List[Dict[str, str]], auth=auth)
def get_user_actions(request, batch_id: Optional[int] = None):
    batch = None
    if batch_id:
        batch = MilkingBatch.objects.filter(id=batch_id).first()
    return get_role_actions(request.auth, batch)
