from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('manager', '牧场主管'),
        ('milker', '挤奶员'),
        ('vet', '兽医'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='milker')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

class MilkingBatch(models.Model):
    STATUS_CHOICES = [
        ('pending', '待挤奶'),
        ('milking', '挤奶中'),
        ('completed', '已完成'),
        ('abnormal', '异常'),
        ('isolated', '隔离中'),
    ]
    
    batch_no = models.CharField(max_length=50, unique=True)
    cow_count = models.IntegerField()
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_milk = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    avg_milk = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    milker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='milking_batches')
    antibiotic_isolated = models.BooleanField(default=False)
    isolation_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'{self.batch_no} - {self.get_status_display()}'

class QualityTest(models.Model):
    RESULT_CHOICES = [
        ('pending', '待检测'),
        ('testing', '检测中'),
        ('pass', '合格'),
        ('fail', '不合格'),
    ]
    
    TEST_TYPE_CHOICES = [
        ('antibiotic', '抗生素检测'),
        ('fat', '脂肪含量'),
        ('protein', '蛋白质含量'),
        ('somatic_cell', '体细胞计数'),
        ('other', '其他'),
    ]
    
    batch = models.ForeignKey(MilkingBatch, on_delete=models.CASCADE, related_name='quality_tests')
    test_type = models.CharField(max_length=30, choices=TEST_TYPE_CHOICES)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')
    test_value = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    threshold_min = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    threshold_max = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    tester = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='quality_tests')
    test_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'{self.batch.batch_no} - {self.get_test_type_display()}'

class Attachment(models.Model):
    ATTACHMENT_TYPE_CHOICES = [
        ('batch_record', '批次记录'),
        ('test_report', '检测报告'),
        ('photo', '照片'),
        ('other', '其他'),
    ]
    
    batch = models.ForeignKey(MilkingBatch, on_delete=models.CASCADE, related_name='attachments', null=True, blank=True)
    test = models.ForeignKey(QualityTest, on_delete=models.CASCADE, related_name='attachments', null=True, blank=True)
    file = models.FileField(upload_to='attachments/')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()
    attachment_type = models.CharField(max_length=30, choices=ATTACHMENT_TYPE_CHOICES)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.file_name

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('batch_completed', '批次完成'),
        ('quality_fail', '质量不合格'),
        ('antibiotic_alert', '抗生素隔离提醒'),
        ('health_alert', '健康预警'),
        ('system', '系统通知'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    content = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES)
    batch = models.ForeignKey(MilkingBatch, on_delete=models.SET_NULL, null=True, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.title} - {self.user.username}'

class ErrorLog(models.Model):
    ERROR_CODE_CHOICES = [
        ('E001', '奶量异常'),
        ('E002', '抗生素隔离未标记'),
        ('E003', '质量检测超时'),
        ('E004', '犊牛健康记录遗漏'),
        ('E005', '数据同步失败'),
        ('E006', '权限验证失败'),
        ('E007', '文件上传失败'),
        ('E008', '批次状态异常'),
    ]
    
    error_code = models.CharField(max_length=10, choices=ERROR_CODE_CHOICES)
    batch = models.ForeignKey(MilkingBatch, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    occurred_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f'{self.error_code} - {self.get_error_code_display()}'
