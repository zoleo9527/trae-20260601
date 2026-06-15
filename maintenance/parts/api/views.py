from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from parts.models import Customer, SiteSurvey, SurveyItem, Quotation, QuotationItem, Attachment, HistoryRecord
from .serializers import CustomerSerializer, SiteSurveySerializer, SurveyCreateSerializer, SurveyItemSerializer, QuotationSerializer, QuotationCreateSerializer, QuotationItemSerializer, AttachmentSerializer, HistoryRecordSerializer

def generate_survey_no():
    now = timezone.now()
    prefix = 'KC'
    date_str = now.strftime('%Y%m%d')
    count = SiteSurvey.objects.filter(survey_no__startswith=f'{prefix}{date_str}').count() + 1
    return f'{prefix}{date_str}{str(count).zfill(4)}'

def generate_quotation_no():
    now = timezone.now()
    prefix = 'BQ'
    date_str = now.strftime('%Y%m%d')
    count = Quotation.objects.filter(quotation_no__startswith=f'{prefix}{date_str}').count() + 1
    return f'{prefix}{date_str}{str(count).zfill(4)}'

class CustomerList(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        customers = Customer.objects.all()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = CustomerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerDetail(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        customer = Customer.objects.get(pk=pk)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        customer = Customer.objects.get(pk=pk)
        serializer = CustomerSerializer(customer, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        customer = Customer.objects.get(pk=pk)
        customer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SiteSurveyList(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        surveys = SiteSurvey.objects.all().select_related('customer', 'surveyor').prefetch_related('items')
        serializer = SiteSurveySerializer(surveys, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = SurveyCreateSerializer(data=request.data)
        if serializer.is_valid():
            survey = serializer.save(survey_no=generate_survey_no(), surveyor=request.user)
            HistoryRecord.objects.create(
                survey=survey,
                history_type='survey_create',
                description=f'创建勘测单 {survey.survey_no}',
                operator=request.user
            )
            return Response(SiteSurveySerializer(survey).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SiteSurveyDetail(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        survey = SiteSurvey.objects.select_related('customer', 'surveyor').prefetch_related('items').get(pk=pk)
        serializer = SiteSurveySerializer(survey)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        survey = SiteSurvey.objects.get(pk=pk)
        old_status = survey.status
        serializer = SiteSurveySerializer(survey, data=request.data, partial=True)
        if serializer.is_valid():
            survey = serializer.save()
            changed_fields = {}
            if old_status != survey.status:
                changed_fields['status'] = {'old': old_status, 'new': survey.status}
            HistoryRecord.objects.create(
                survey=survey,
                history_type='survey_update',
                description=f'更新勘测单 {survey.survey_no}',
                changed_fields=changed_fields,
                operator=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        survey = SiteSurvey.objects.get(pk=pk)
        survey.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CompleteSurvey(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request, pk=None):
        survey = SiteSurvey.objects.get(pk=pk)
        if survey.status != 'pending':
            return Response({'error': f'当前状态为{survey.get_status_display()}，无法完成'}, status=status.HTTP_400_BAD_REQUEST)
        survey.status = 'completed'
        survey.save()
        HistoryRecord.objects.create(
            survey=survey,
            history_type='survey_complete',
            description=f'完成勘测 {survey.survey_no}',
            operator=request.user
        )
        return Response(SiteSurveySerializer(survey).data)

class SurveyItemList(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, pk=None):
        items = SurveyItem.objects.filter(survey_id=pk)
        serializer = SurveyItemSerializer(items, many=True)
        return Response(serializer.data)
    
    def create(self, request, pk=None):
        survey = SiteSurvey.objects.get(pk=pk)
        serializer = SurveyItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(survey=survey)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SurveyAttachmentList(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, pk=None):
        attachments = Attachment.objects.filter(survey_id=pk)
        serializer = AttachmentSerializer(attachments, many=True)
        return Response(serializer.data)
    
    def create(self, request, pk=None):
        survey = SiteSurvey.objects.get(pk=pk)
        data = request.data.copy()
        data['survey'] = pk
        data['uploaded_by'] = request.user.id
        serializer = AttachmentSerializer(data=data)
        if serializer.is_valid():
            attachment = serializer.save()
            HistoryRecord.objects.create(
                survey=survey,
                history_type='attachment_upload',
                description=f'上传附件 {attachment.file_name}',
                operator=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SurveyHistory(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, pk=None):
        history = HistoryRecord.objects.filter(survey_id=pk)
        serializer = HistoryRecordSerializer(history, many=True)
        return Response(serializer.data)

class QuotationHistory(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, pk=None):
        history = HistoryRecord.objects.filter(quotation_id=pk)
        serializer = HistoryRecordSerializer(history, many=True)
        return Response(serializer.data)

class QuotationList(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        quotations = Quotation.objects.all().select_related('survey__customer', 'created_by').prefetch_related('items')
        serializer = QuotationSerializer(quotations, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = QuotationCreateSerializer(data=request.data)
        if serializer.is_valid():
            survey = SiteSurvey.objects.get(pk=request.data.get('survey'))
            if hasattr(survey, 'quotation'):
                return Response({'error': '该勘测单已有报价单'}, status=status.HTTP_400_BAD_REQUEST)
            quotation = serializer.save(quotation_no=generate_quotation_no(), created_by=request.user)
            HistoryRecord.objects.create(
                quotation=quotation,
                survey=quotation.survey,
                history_type='quotation_create',
                description=f'创建报价单 {quotation.quotation_no}',
                operator=request.user
            )
            return Response(QuotationSerializer(quotation).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuotationDetail(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        quotation = Quotation.objects.select_related('survey__customer', 'created_by').prefetch_related('items').get(pk=pk)
        serializer = QuotationSerializer(quotation)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        quotation = Quotation.objects.get(pk=pk)
        if quotation.status != 'draft':
            return Response({'error': f'当前状态为{quotation.get_status_display()}，无法修改'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = QuotationSerializer(quotation, data=request.data, partial=True)
        if serializer.is_valid():
            quotation = serializer.save()
            HistoryRecord.objects.create(
                quotation=quotation,
                survey=quotation.survey,
                history_type='quotation_update',
                description=f'更新报价单 {quotation.quotation_no}',
                operator=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        quotation = Quotation.objects.get(pk=pk)
        quotation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SubmitQuotation(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request, pk=None):
        quotation = Quotation.objects.get(pk=pk)
        if quotation.status != 'draft':
            return Response({'error': f'当前状态为{quotation.get_status_display()}，无法提交'}, status=status.HTTP_400_BAD_REQUEST)
        quotation.status = 'submitted'
        quotation.save()
        HistoryRecord.objects.create(
            quotation=quotation,
            survey=quotation.survey,
            history_type='quotation_submit',
            description=f'提交报价单 {quotation.quotation_no}',
            operator=request.user
        )
        return Response(QuotationSerializer(quotation).data)

class ApproveQuotation(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request, pk=None):
        quotation = Quotation.objects.get(pk=pk)
        if quotation.status != 'submitted':
            return Response({'error': f'当前状态为{quotation.get_status_display()}，无法批准'}, status=status.HTTP_400_BAD_REQUEST)
        quotation.status = 'approved'
        quotation.save()
        HistoryRecord.objects.create(
            quotation=quotation,
            survey=quotation.survey,
            history_type='quotation_approve',
            description=f'批准报价单 {quotation.quotation_no}',
            operator=request.user
        )
        return Response(QuotationSerializer(quotation).data)

class RejectQuotation(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request, pk=None):
        quotation = Quotation.objects.get(pk=pk)
        if quotation.status != 'submitted':
            return Response({'error': f'当前状态为{quotation.get_status_display()}，无法拒绝'}, status=status.HTTP_400_BAD_REQUEST)
        quotation.status = 'rejected'
        quotation.save()
        HistoryRecord.objects.create(
            quotation=quotation,
            survey=quotation.survey,
            history_type='quotation_reject',
            description=f'拒绝报价单 {quotation.quotation_no}',
            operator=request.user
        )
        return Response(QuotationSerializer(quotation).data)

class QuotationItemList(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request, pk=None):
        items = QuotationItem.objects.filter(quotation_id=pk)
        serializer = QuotationItemSerializer(items, many=True)
        return Response(serializer.data)
    
    def create(self, request, pk=None):
        quotation = Quotation.objects.get(pk=pk)
        if quotation.status != 'draft':
            return Response({'error': f'当前状态为{quotation.get_status_display()}，无法添加项目'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = QuotationItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(quotation=quotation)
            quotation.total_amount = sum(item.total_price + item.installation_fee for item in quotation.items.all())
            quotation.final_amount = quotation.total_amount * (1 - quotation.discount / 100)
            quotation.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardTodo(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        pending_surveys = SiteSurvey.objects.filter(status='pending').select_related('customer')
        draft_quotations = Quotation.objects.filter(status='draft').select_related('survey__customer')
        submitted_quotations = Quotation.objects.filter(status='submitted').select_related('survey__customer')
        
        todo_items = []
        
        for survey in pending_surveys:
            todo_items.append({
                'id': survey.id,
                'title': f'勘测: {survey.location}',
                'type': 'survey',
                'priority': 'high',
                'due_date': survey.survey_date,
                'customer_name': survey.customer.name
            })
        
        for quotation in draft_quotations:
            todo_items.append({
                'id': quotation.id,
                'title': f'报价: {quotation.quotation_no}',
                'type': 'quotation',
                'priority': 'medium',
                'due_date': quotation.created_at,
                'customer_name': quotation.survey.customer.name
            })
        
        for quotation in submitted_quotations:
            todo_items.append({
                'id': quotation.id,
                'title': f'审批: {quotation.quotation_no}',
                'type': 'approval',
                'priority': 'high',
                'due_date': quotation.created_at,
                'customer_name': quotation.survey.customer.name
            })
        
        todo_items.sort(key=lambda x: x['due_date'])
        return Response(todo_items[:20])

class DashboardRisk(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        overdue_surveys = SiteSurvey.objects.filter(
            status='pending',
            survey_date__lt=timezone.now()
        ).select_related('customer')
        
        expired_quotations = Quotation.objects.filter(
            status__in=['submitted', 'approved'],
            valid_until__lt=timezone.now().date()
        ).select_related('survey__customer')
        
        risk_items = []
        
        for survey in overdue_surveys:
            risk_items.append({
                'id': survey.id,
                'title': f'勘测超时: {survey.location}',
                'type': 'survey_overdue',
                'level': 'high',
                'customer_name': survey.customer.name,
                'created_at': survey.created_at
            })
        
        for quotation in expired_quotations:
            risk_items.append({
                'id': quotation.id,
                'title': f'报价过期: {quotation.quotation_no}',
                'type': 'quotation_expired',
                'level': 'medium',
                'customer_name': quotation.survey.customer.name,
                'created_at': quotation.created_at
            })
        
        risk_items.sort(key=lambda x: x['created_at'], reverse=True)
        return Response(risk_items[:20])

class DashboardChanges(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        recent_history = HistoryRecord.objects.select_related(
            'survey__customer', 'quotation', 'operator'
        ).order_by('-created_at')[:30]
        
        changes = []
        for record in recent_history:
            if record.survey:
                title = record.survey.survey_no
                customer_name = record.survey.customer.name
            elif record.quotation:
                title = record.quotation.quotation_no
                customer_name = record.quotation.survey.customer.name
            else:
                title = '未知'
                customer_name = '未知'
            
            changes.append({
                'id': record.id,
                'title': f'{record.get_history_type_display()}: {title}',
                'type': record.history_type,
                'customer_name': customer_name,
                'operator': record.operator.username if record.operator else '系统',
                'created_at': record.created_at
            })
        
        return Response(changes)