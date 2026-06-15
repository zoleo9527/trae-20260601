from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Customer(models.Model):
    name = models.CharField(max_length=100)
    contact = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

class SiteSurvey(models.Model):
    SURVEY_STATUS_CHOICES = [
        ('pending', '待勘测'),
        ('completed', '已完成'),
        ('reviewing', '审核中'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='surveys')
    survey_no = models.CharField(max_length=50, unique=True)
    survey_date = models.DateTimeField()
    location = models.CharField(max_length=200)
    building_type = models.CharField(max_length=50)
    floor_count = models.IntegerField(null=True, blank=True)
    wall_material = models.CharField(max_length=50, null=True, blank=True)
    power_supply = models.BooleanField(default=False)
    installation_height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    access_condition = models.TextField(null=True, blank=True)
    photos = models.JSONField(default=list)
    notes = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=SURVEY_STATUS_CHOICES, default='pending')
    surveyor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='surveys')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.survey_no} - {self.customer.name}"

class SurveyItem(models.Model):
    SURVEY_ITEM_TYPES = [
        ('sign', '标识牌'),
        ('light_box', '灯箱'),
        ('letter', '发光字'),
        ('banner', '横幅'),
        ('other', '其他'),
    ]
    
    survey = models.ForeignKey(SiteSurvey, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=20, choices=SURVEY_ITEM_TYPES)
    description = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    dimensions = models.CharField(max_length=100, null=True, blank=True)
    material_requirements = models.TextField(null=True, blank=True)
    installation_requirements = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return self.description

class Quotation(models.Model):
    QUOTATION_STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
        ('signed', '已签约'),
    ]
    
    survey = models.OneToOneField(SiteSurvey, on_delete=models.CASCADE, related_name='quotation')
    quotation_no = models.CharField(max_length=50, unique=True)
    quotation_date = models.DateTimeField(default=timezone.now)
    valid_until = models.DateField()
    status = models.CharField(max_length=20, choices=QUOTATION_STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_terms = models.TextField(null=True, blank=True)
    delivery_time = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='quotations')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.quotation_no} - {self.survey.customer.name}"

class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=200)
    item_type = models.CharField(max_length=50)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    material = models.CharField(max_length=100, null=True, blank=True)
    process = models.CharField(max_length=200, null=True, blank=True)
    installation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return self.item_name

class Attachment(models.Model):
    ATTACHMENT_TYPE_CHOICES = [
        ('design', '设计图'),
        ('production', '生产单'),
        ('survey', '勘测报告'),
        ('other', '其他'),
    ]
    
    survey = models.ForeignKey(SiteSurvey, on_delete=models.CASCADE, related_name='attachments', null=True)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='attachments', null=True)
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)
    file_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPE_CHOICES)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.file_name

class HistoryRecord(models.Model):
    HISTORY_TYPE_CHOICES = [
        ('survey_create', '创建勘测'),
        ('survey_update', '更新勘测'),
        ('survey_complete', '完成勘测'),
        ('quotation_create', '创建报价'),
        ('quotation_update', '更新报价'),
        ('quotation_submit', '提交报价'),
        ('quotation_approve', '批准报价'),
        ('quotation_reject', '拒绝报价'),
        ('attachment_upload', '上传附件'),
    ]
    
    survey = models.ForeignKey(SiteSurvey, on_delete=models.CASCADE, related_name='history', null=True)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='history', null=True)
    history_type = models.CharField(max_length=30, choices=HISTORY_TYPE_CHOICES)
    description = models.TextField()
    changed_fields = models.JSONField(default=dict)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_history_type_display()} - {self.created_at}"