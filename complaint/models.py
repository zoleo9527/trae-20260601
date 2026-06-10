from django.db import models
from django.utils import timezone

class Recipe(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_APPROVED = 'approved'
    STATUS_PRODUCTION = 'production'
    STATUS_ARCHIVED = 'archived'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_APPROVED, '已审核'),
        (STATUS_PRODUCTION, '生产中'),
        (STATUS_ARCHIVED, '已归档'),
    ]
    
    recipe_code = models.CharField(max_length=50, unique=True, verbose_name='配方编号')
    name = models.CharField(max_length=100, verbose_name='配方名称')
    ingredients = models.JSONField(verbose_name='配料清单')
    specifications = models.JSONField(verbose_name='技术规格')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name='状态')
    created_by = models.CharField(max_length=50, verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    approved_by = models.CharField(max_length=50, blank=True, null=True, verbose_name='审核人')
    approved_at = models.DateTimeField(blank=True, null=True, verbose_name='审核时间')

    class Meta:
        verbose_name = '配方单'
        verbose_name_plural = '配方单'

    def __str__(self):
        return f'{self.recipe_code} - {self.name}'


class FeedingRecord(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_VERIFIED = 'verified'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, '待确认'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_VERIFIED, '已验证'),
    ]
    
    batch_number = models.CharField(max_length=50, verbose_name='批次号')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, verbose_name='配方单')
    feeding_data = models.JSONField(verbose_name='投料数据')
    deviation = models.DecimalField(max_digits=10, decimal_places=4, default=0, verbose_name='投料偏差')
    is_deviation_exceeded = models.BooleanField(default=False, verbose_name='偏差超限')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    created_by = models.CharField(max_length=50, verbose_name='投料人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='投料时间')
    confirmed_by = models.CharField(max_length=50, blank=True, null=True, verbose_name='确认人')
    confirmed_at = models.DateTimeField(blank=True, null=True, verbose_name='确认时间')

    class Meta:
        verbose_name = '投料记录'
        verbose_name_plural = '投料记录'

    def __str__(self):
        return f'{self.batch_number}'


class Complaint(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_ANALYZED = 'analyzed'
    STATUS_RESOLVED = 'resolved'
    STATUS_CLOSED = 'closed'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, '待处理'),
        (STATUS_PROCESSING, '处理中'),
        (STATUS_ANALYZED, '已分析'),
        (STATUS_RESOLVED, '已解决'),
        (STATUS_CLOSED, '已关闭'),
    ]
    
    TYPE_WEIGHT_GAIN = 'weight_gain'
    TYPE_LABEL_ERROR = 'label_error'
    TYPE_INGREDIENT_DEVIATION = 'ingredient_deviation'
    TYPE_OTHER = 'other'
    
    TYPE_CHOICES = [
        (TYPE_WEIGHT_GAIN, '增重缓慢'),
        (TYPE_LABEL_ERROR, '标签错误'),
        (TYPE_INGREDIENT_DEVIATION, '投料偏差'),
        (TYPE_OTHER, '其他'),
    ]
    
    SEVERITY_LOW = 'low'
    SEVERITY_MEDIUM = 'medium'
    SEVERITY_HIGH = 'high'
    SEVERITY_CRITICAL = 'critical'
    
    SEVERITY_CHOICES = [
        (SEVERITY_LOW, '低'),
        (SEVERITY_MEDIUM, '中'),
        (SEVERITY_HIGH, '高'),
        (SEVERITY_CRITICAL, '严重'),
    ]
    
    complaint_code = models.CharField(max_length=50, unique=True, verbose_name='投诉编号')
    customer_name = models.CharField(max_length=100, verbose_name='客户名称')
    contact_info = models.CharField(max_length=200, verbose_name='联系方式')
    batch_number = models.CharField(max_length=50, verbose_name='涉及批次')
    complaint_type = models.CharField(max_length=30, choices=TYPE_CHOICES, verbose_name='投诉类型')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_MEDIUM, verbose_name='严重程度')
    description = models.TextField(verbose_name='投诉描述')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    related_feeding_record = models.ForeignKey(FeedingRecord, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='关联投料记录')
    created_by = models.CharField(max_length=50, verbose_name='登记人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='登记时间')
    processed_by = models.CharField(max_length=50, blank=True, null=True, verbose_name='处理人')
    processed_at = models.DateTimeField(blank=True, null=True, verbose_name='处理时间')
    resolved_by = models.CharField(max_length=50, blank=True, null=True, verbose_name='解决人')
    resolved_at = models.DateTimeField(blank=True, null=True, verbose_name='解决时间')

    class Meta:
        verbose_name = '投诉登记'
        verbose_name_plural = '投诉登记'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.complaint_code} - {self.customer_name}'


class BatchAnalysis(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ANALYZING = 'analyzing'
    STATUS_COMPLETED = 'completed'
    STATUS_REVIEWED = 'reviewed'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, '待分析'),
        (STATUS_ANALYZING, '分析中'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_REVIEWED, '已复核'),
    ]
    
    RESULT_NORMAL = 'normal'
    RESULT_WARNING = 'warning'
    RESULT_ABNORMAL = 'abnormal'
    
    RESULT_CHOICES = [
        (RESULT_NORMAL, '正常'),
        (RESULT_WARNING, '警告'),
        (RESULT_ABNORMAL, '异常'),
    ]
    
    analysis_code = models.CharField(max_length=50, unique=True, verbose_name='分析编号')
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, verbose_name='关联投诉')
    batch_number = models.CharField(max_length=50, verbose_name='批次号')
    recipe = models.ForeignKey(Recipe, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='配方单')
    feeding_record = models.ForeignKey(FeedingRecord, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='投料记录')
    analysis_data = models.JSONField(verbose_name='分析数据')
    conclusion = models.TextField(verbose_name='分析结论')
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, verbose_name='分析结果')
    recommendations = models.TextField(blank=True, null=True, verbose_name='处理建议')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    created_by = models.CharField(max_length=50, verbose_name='分析人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='分析时间')
    reviewed_by = models.CharField(max_length=50, blank=True, null=True, verbose_name='复核人')
    reviewed_at = models.DateTimeField(blank=True, null=True, verbose_name='复核时间')

    class Meta:
        verbose_name = '批次分析'
        verbose_name_plural = '批次分析'

    def __str__(self):
        return f'{self.analysis_code} - {self.batch_number}'


class AuditLog(models.Model):
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_APPROVE = 'approve'
    ACTION_REVIEW = 'review'
    ACTION_RESOLVE = 'resolve'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, '创建'),
        (ACTION_UPDATE, '更新'),
        (ACTION_DELETE, '删除'),
        (ACTION_APPROVE, '审核'),
        (ACTION_REVIEW, '复核'),
        (ACTION_RESOLVE, '解决'),
    ]
    
    MODULE_COMPLAINT = 'complaint'
    MODULE_ANALYSIS = 'analysis'
    MODULE_RECIPE = 'recipe'
    MODULE_FEEDING = 'feeding'
    
    MODULE_CHOICES = [
        (MODULE_COMPLAINT, '投诉登记'),
        (MODULE_ANALYSIS, '批次分析'),
        (MODULE_RECIPE, '配方单'),
        (MODULE_FEEDING, '投料记录'),
    ]
    
    module = models.CharField(max_length=30, choices=MODULE_CHOICES, verbose_name='模块')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='操作类型')
    object_id = models.IntegerField(verbose_name='对象ID')
    object_code = models.CharField(max_length=50, verbose_name='对象编号')
    operator = models.CharField(max_length=50, verbose_name='操作人')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')
    details = models.JSONField(verbose_name='操作详情')
    ip_address = models.CharField(max_length=50, blank=True, null=True, verbose_name='IP地址')

    class Meta:
        verbose_name = '审计日志'
        verbose_name_plural = '审计日志'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.module} - {self.action} - {self.object_code}'


class ErrorCode(models.Model):
    code = models.CharField(max_length=20, unique=True, verbose_name='错误码')
    description = models.CharField(max_length=200, verbose_name='错误描述')
    solution = models.TextField(blank=True, null=True, verbose_name='解决方案')
    severity = models.CharField(max_length=20, choices=Complaint.SEVERITY_CHOICES, default=Complaint.SEVERITY_MEDIUM, verbose_name='严重程度')

    class Meta:
        verbose_name = '错误码'
        verbose_name_plural = '错误码'

    def __str__(self):
        return f'{self.code} - {self.description}'
