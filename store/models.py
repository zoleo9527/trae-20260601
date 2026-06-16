"""
母婴零售店 - 核心数据模型
包含会员档案、退换货、客户回访、审计日志等核心业务模型
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Employee(models.Model):
    """员工模型：包含店员、店长、采购等角色"""
    ROLE_CHOICES = [
        ('clerk', '店员'),
        ('manager', '店长'),
        ('purchaser', '采购'),
        ('admin', '系统管理员'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField('员工编号', max_length=20, unique=True)
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    is_active = models.BooleanField('是否在职', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'employees'
        verbose_name = '员工'
        verbose_name_plural = '员工列表'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name() or self.user.username} ({self.get_role_display()})"

    def can_handle_returns(self):
        """店员和店长可以处理退换货"""
        return self.role in ['clerk', 'manager']

    def can_approve_returns(self):
        """只有店长可以审批退换货"""
        return self.role == 'manager'

    def can_handle_purchasing(self):
        """只有采购可以处理采购相关业务"""
        return self.role in ['purchaser', 'manager']

    def can_view_dashboard(self):
        """所有员工都可以查看仪表板"""
        return True


class Member(models.Model):
    """会员档案"""
    GENDER_CHOICES = [
        ('M', '男'),
        ('F', '女'),
        ('O', '其他'),
    ]

    member_id = models.CharField('会员编号', max_length=20, unique=True)
    name = models.CharField('姓名', max_length=100)
    phone = models.CharField('手机号', max_length=20, unique=True)
    gender = models.CharField('性别', max_length=1, choices=GENDER_CHOICES, blank=True)
    birthday = models.DateField('生日', null=True, blank=True)
    baby_due_date = models.DateField('预产期', null=True, blank=True, help_text='备孕/孕期会员')
    baby_birthday = models.DateField('宝宝出生日期', null=True, blank=True)
    address = models.TextField('地址', blank=True)
    total_points = models.IntegerField('积分', default=0)
    member_level = models.CharField('会员等级', max_length=20, default='bronze',
                                   choices=[
                                       ('bronze', '青铜'),
                                       ('silver', '白银'),
                                       ('gold', '黄金'),
                                       ('diamond', '钻石'),
                                   ])
    registered_by = models.ForeignKey(Employee, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='registered_members',
                                      verbose_name='登记店员')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'members'
        verbose_name = '会员'
        verbose_name_plural = '会员列表'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.member_id} - {self.name}"


class ProductCategory(models.Model):
    """商品分类"""
    name = models.CharField('分类名称', max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                               related_name='children', verbose_name='父分类')
    description = models.TextField('描述', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'product_categories'
        verbose_name = '商品分类'
        verbose_name_plural = '商品分类列表'

    def __str__(self):
        return self.name


class Product(models.Model):
    """商品档案"""
    STATUS_CHOICES = [
        ('active', '在售'),
        ('discontinued', '已停售'),
        ('out_of_stock', '缺货'),
    ]

    product_code = models.CharField('商品编码', max_length=50, unique=True)
    name = models.CharField('商品名称', max_length=200)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL,
                                null=True, related_name='products', verbose_name='分类')
    brand = models.CharField('品牌', max_length=100, blank=True)
    unit = models.CharField('单位', max_length=20, default='件')
    price = models.DecimalField('售价', max_digits=10, decimal_places=2)
    cost = models.DecimalField('成本', max_digits=10, decimal_places=2, default=0)
    stock_quantity = models.IntegerField('库存数量', default=0)
    min_stock_level = models.IntegerField('最低库存', default=10)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    image = models.ImageField('商品图片', upload_to='products/', null=True, blank=True)
    description = models.TextField('商品描述', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'products'
        verbose_name = '商品'
        verbose_name_plural = '商品列表'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product_code} - {self.name}"

    def is_low_stock(self):
        """检查是否低于最低库存"""
        return self.stock_quantity < self.min_stock_level


class ProductBatch(models.Model):
    """商品批号管理"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches',
                               verbose_name='商品')
    batch_number = models.CharField('批号', max_length=50)
    production_date = models.DateField('生产日期')
    expiry_date = models.DateField('有效期至')
    quantity = models.IntegerField('数量')
    supplier = models.CharField('供应商', max_length=200, blank=True)
    cost = models.DecimalField('采购成本', max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'product_batches'
        verbose_name = '商品批号'
        verbose_name_plural = '商品批号列表'
        unique_together = ['product', 'batch_number']

    def __str__(self):
        return f"{self.product.name} - {self.batch_number}"


class ReturnExchange(models.Model):
    """退换货记录"""
    TYPE_CHOICES = [
        ('return', '退货'),
        ('exchange', '换货'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('clerk_reviewing', '店员审核中'),
        ('manager_reviewing', '店长审批中'),
        ('purchaser_handling', '采购处理中'),
        ('completed', '已完成'),
        ('rejected', '已拒绝'),
    ]

    REASON_CATEGORY_CHOICES = [
        ('quality', '质量问题'),
        ('wrong_item', '发错商品'),
        ('damaged', '运输损坏'),
        ('expired', '过期商品'),
        ('member_request', '会员要求'),
        ('other', '其他'),
    ]

    return_number = models.CharField('退换货单号', max_length=30, unique=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='return_exchanges',
                              verbose_name='会员')
    type = models.CharField('类型', max_length=20, choices=TYPE_CHOICES)
    status = models.CharField('状态', max_length=30, choices=STATUS_CHOICES, default='pending')

    original_product = models.ForeignKey(Product, on_delete=models.SET_NULL,
                                        null=True, related_name='return_originals',
                                        verbose_name='原商品')
    original_batch = models.ForeignKey(ProductBatch, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='return_originals',
                                      verbose_name='原批号')
    quantity = models.IntegerField('数量', default=1)
    reason_category = models.CharField('原因分类', max_length=30,
                                      choices=REASON_CATEGORY_CHOICES, default='other')
    reason_detail = models.TextField('详细原因', help_text='记录为什么会发生退换货')

    exchange_product = models.ForeignKey(Product, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='return_exchanges',
                                        verbose_name='换货商品')

    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='assigned_returns',
                                   verbose_name='处理人')

    current_handler_role = models.CharField('当前处理角色', max_length=20,
                                           choices=[
                                               ('clerk', '店员'),
                                               ('manager', '店长'),
                                               ('purchaser', '采购'),
                                           ],
                                           help_text='记录谁应该处理这个退换货')
    stuck_reason = models.TextField('卡住原因', blank=True,
                                   help_text='如果退换货超过3天未完成，记录卡住的原因')

    amount_refunded = models.DecimalField('退款金额', max_digits=10, decimal_places=2, default=0)

    attachments = models.ManyToManyField('Attachment', related_name='return_exchanges',
                                       blank=True, verbose_name='附件')

    clerk_notes = models.TextField('店员备注', blank=True)
    manager_notes = models.TextField('店长备注', blank=True)
    purchaser_notes = models.TextField('采购备注', blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)

    class Meta:
        db_table = 'return_exchanges'
        verbose_name = '退换货'
        verbose_name_plural = '退换货列表'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.return_number} - {self.get_type_display()} - {self.get_status_display()}"

    def get_stuck_info(self):
        """获取卡住信息"""
        if self.status in ['completed', 'rejected']:
            return None

        days_pending = (timezone.now() - self.created_at).days
        
        current_handler_info = None
        if self.assigned_to:
            current_handler_info = {
                'id': self.assigned_to.id,
                'employee_id': self.assigned_to.employee_id,
                'name': self.assigned_to.user.get_full_name(),
                'role': self.assigned_to.role,
                'role_display': self.assigned_to.get_role_display(),
            }

        if days_pending >= 3:
            return {
                'is_stuck': True,
                'days': days_pending,
                'reason': self.stuck_reason or f'已等待{days_pending}天未处理',
                'current_handler': current_handler_info,
                'expected_handler': self.get_current_expected_handler(),
            }
        return {
            'is_stuck': False,
            'days': days_pending,
            'current_handler': current_handler_info,
            'expected_handler': self.get_current_expected_handler(),
        }

    def get_current_expected_handler(self):
        """根据状态返回当前应该处理的人"""
        role_map = {
            'pending': 'clerk',
            'clerk_reviewing': 'clerk',
            'manager_reviewing': 'manager',
            'purchaser_handling': 'purchaser',
        }
        return role_map.get(self.status, 'clerk')


class VisitRecord(models.Model):
    """客户回访记录"""
    TYPE_CHOICES = [
        ('phone', '电话回访'),
        ('sms', '短信回访'),
        ('wechat', '微信回访'),
        ('in_store', '到店回访'),
    ]

    STATUS_CHOICES = [
        ('pending', '待回访'),
        ('in_progress', '回访中'),
        ('completed', '已完成'),
        ('failed', '回访失败'),
        ('skipped', '已跳过'),
    ]

    PRIORITY_CHOICES = [
        ('high', '高优先级'),
        ('normal', '普通'),
        ('low', '低优先级'),
    ]

    visit_number = models.CharField('回访编号', max_length=30, unique=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='visit_records',
                              verbose_name='会员')
    type = models.CharField('回访方式', max_length=20, choices=TYPE_CHOICES)

    related_return = models.ForeignKey(ReturnExchange, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='visit_records',
                                      verbose_name='关联退换货',
                                      help_text='如果回访是因为退换货而发起')

    purpose = models.TextField('回访目的', help_text='为什么要回访这个客户')

    priority = models.CharField('优先级', max_length=20, choices=PRIORITY_CHOICES, default='normal')

    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='assigned_visits',
                                   verbose_name='回访人')

    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')

    scheduled_date = models.DateField('计划回访日期')
    scheduled_time = models.TimeField('计划回访时间', null=True, blank=True)

    completed_date = models.DateField('实际回访日期', null=True, blank=True)
    completed_time = models.TimeField('实际回访时间', null=True, blank=True)

    content = models.TextField('回访内容', blank=True,
                              help_text='记录回访时说了什么')
    result = models.TextField('回访结果', blank=True,
                             help_text='回访结果如何，客户有什么反馈')

    satisfaction_score = models.IntegerField('满意度评分', null=True, blank=True,
                                           help_text='1-5分')

    stuck_reason = models.TextField('卡住原因', blank=True,
                                   help_text='为什么还没完成回访')

    attachments = models.ManyToManyField('Attachment', related_name='visit_records',
                                        blank=True, verbose_name='附件')

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'visit_records'
        verbose_name = '客户回访'
        verbose_name_plural = '客户回访列表'
        ordering = ['-scheduled_date', '-scheduled_time']

    def __str__(self):
        return f"{self.visit_number} - {self.member.name} - {self.get_status_display()}"

    def get_stuck_info(self):
        """获取卡住信息"""
        if self.status in ['completed', 'failed', 'skipped']:
            return None

        today = timezone.now().date()
        
        assigned_to_info = None
        if self.assigned_to:
            assigned_to_info = {
                'id': self.assigned_to.id,
                'employee_id': self.assigned_to.employee_id,
                'name': self.assigned_to.user.get_full_name(),
                'role': self.assigned_to.role,
                'role_display': self.assigned_to.get_role_display(),
            }

        if self.scheduled_date < today:
            return {
                'is_stuck': True,
                'days_overdue': (today - self.scheduled_date).days,
                'reason': self.stuck_reason or '已超过计划回访日期',
                'assigned_to': assigned_to_info,
            }
        return {
            'is_stuck': False,
            'days_until': (self.scheduled_date - today).days,
            'assigned_to': assigned_to_info,
        }


class Attachment(models.Model):
    """附件管理"""
    ATTACHMENT_TYPE_CHOICES = [
        ('image', '图片'),
        ('document', '文档'),
        ('other', '其他'),
    ]

    file = models.FileField('文件', upload_to='attachments/%Y/%m/')
    name = models.CharField('文件名', max_length=200)
    file_type = models.CharField('文件类型', max_length=20,
                                choices=ATTACHMENT_TYPE_CHOICES, default='other')
    file_size = models.IntegerField('文件大小(字节)', default=0)
    uploaded_by = models.ForeignKey(Employee, on_delete=models.SET_NULL,
                                   null=True, related_name='uploaded_attachments',
                                   verbose_name='上传人')
    description = models.TextField('描述', blank=True)
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        db_table = 'attachments'
        verbose_name = '附件'
        verbose_name_plural = '附件列表'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class AuditLog(models.Model):
    """审计日志"""
    ACTION_CHOICES = [
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('status_change', '状态变更'),
        ('assignment', '任务分配'),
        ('approval', '审批'),
        ('rejection', '拒绝'),
        ('view', '查看'),
        ('export', '导出'),
        ('login', '登录'),
        ('logout', '登出'),
    ]

    ENTITY_CHOICES = [
        ('return_exchange', '退换货'),
        ('visit_record', '客户回访'),
        ('member', '会员'),
        ('product', '商品'),
        ('employee', '员工'),
        ('system', '系统'),
    ]

    action = models.CharField('操作', max_length=30, choices=ACTION_CHOICES)
    entity_type = models.CharField('实体类型', max_length=30, choices=ENTITY_CHOICES)
    entity_id = models.CharField('实体ID', max_length=50)
    entity_name = models.CharField('实体名称', max_length=200, blank=True)

    user = models.ForeignKey(Employee, on_delete=models.SET_NULL,
                           null=True, related_name='audit_logs',
                           verbose_name='操作用户')
    ip_address = models.GenericIPAddressField('IP地址', null=True, blank=True)

    old_value = models.JSONField('旧值', null=True, blank=True)
    new_value = models.JSONField('新值', null=True, blank=True)

    description = models.TextField('描述', blank=True,
                                  help_text='详细描述这次操作的内容')

    user_agent = models.TextField('用户代理', blank=True)
    created_at = models.DateTimeField('操作时间', auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        verbose_name = '审计日志'
        verbose_name_plural = '审计日志列表'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f"{self.created_at.strftime('%Y-%m-%d %H:%M')} - {self.user} - {self.get_action_display()} - {self.entity_name}"


class Notification(models.Model):
    """消息通知"""
    TYPE_CHOICES = [
        ('return_stuck', '退换货卡住提醒'),
        ('visit_overdue', '回访逾期提醒'),
        ('approval_required', '待审批提醒'),
        ('assignment', '任务分配提醒'),
        ('system', '系统通知'),
    ]

    CHANNEL_CHOICES = [
        ('internal', '站内通知'),
        ('email', '邮件通知'),
        ('sms', '短信通知'),
    ]

    type = models.CharField('类型', max_length=30, choices=TYPE_CHOICES)
    channel = models.CharField('渠道', max_length=20, choices=CHANNEL_CHOICES, default='internal')

    recipient = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                related_name='notifications',
                                verbose_name='接收人')
    sender = models.ForeignKey(Employee, on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='sent_notifications',
                              verbose_name='发送人')

    title = models.CharField('标题', max_length=200)
    content = models.TextField('内容')

    related_entity_type = models.CharField('关联实体类型', max_length=30, blank=True)
    related_entity_id = models.CharField('关联实体ID', max_length=50, blank=True)

    is_read = models.BooleanField('已读', default=False)
    read_at = models.DateTimeField('阅读时间', null=True, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = '消息通知'
        verbose_name_plural = '消息通知列表'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient} - {self.get_type_display()}"


class PromotionCoupon(models.Model):
    """促销券"""
    STATUS_CHOICES = [
        ('active', '有效'),
        ('used', '已使用'),
        ('expired', '已过期'),
        ('cancelled', '已作废'),
    ]

    TYPE_CHOICES = [
        ('discount', '折扣券'),
        ('cash', '代金券'),
        ('gift', '赠品券'),
    ]

    coupon_code = models.CharField('券码', max_length=50, unique=True)
    type = models.CharField('类型', max_length=20, choices=TYPE_CHOICES)
    name = models.CharField('名称', max_length=200)
    description = models.TextField('说明', blank=True)

    discount_amount = models.DecimalField('折扣金额', max_digits=10, decimal_places=2, default=0,
                                         help_text='代金券金额或折扣百分比')
    discount_percent = models.IntegerField('折扣百分比', default=0,
                                          help_text='如果是折扣券，填写折扣百分比')

    min_purchase_amount = models.DecimalField('最低消费', max_digits=10, decimal_places=2, default=0)

    valid_from = models.DateTimeField('生效时间')
    valid_until = models.DateTimeField('失效时间')

    member = models.ForeignKey(Member, on_delete=models.CASCADE,
                             related_name='coupons',
                             verbose_name='所属会员')
    used_by = models.ForeignKey('ReturnExchange', on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='used_coupons',
                               verbose_name='使用于退换货')

    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'promotion_coupons'
        verbose_name = '促销券'
        verbose_name_plural = '促销券列表'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.coupon_code} - {self.name}"
