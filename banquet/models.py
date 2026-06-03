from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Role(models.TextChoices):
    SALES = 'sales', '宴会销售'
    FLOOR_SUPERVISOR = 'floor_supervisor', '厅面主管'
    KITCHEN_COORDINATOR = 'kitchen_coordinator', '后厨统筹'


class BookingStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    SUBMITTED = 'submitted', '已提交待确认'
    MENU_CONFIRMED = 'menu_confirmed', '菜单已确认'
    KITCHEN_RECEIVED = 'kitchen_received', '后厨已接收'
    IN_PROGRESS = 'in_progress', '进行中'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class StuckLevel(models.TextChoices):
    NORMAL = 'normal', '正常'
    WARNING = 'warning', '预警'
    STUCK = 'stuck', '已卡住'


class Employee(models.Model):
    name = models.CharField('姓名', max_length=100)
    role = models.CharField('角色', max_length=50, choices=Role.choices)
    phone = models.CharField('电话', max_length=20, blank=True)
    is_active = models.BooleanField('是否在职', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '员工'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name} - {self.get_role_display()}'


class BanquetBooking(models.Model):
    booking_no = models.CharField('预订单号', max_length=50, unique=True)
    customer_name = models.CharField('客户姓名', max_length=100)
    customer_phone = models.CharField('联系电话', max_length=20)
    banquet_type = models.CharField('宴会类型', max_length=100)
    banquet_date = models.DateField('宴会日期')
    start_time = models.TimeField('开始时间')
    end_time = models.TimeField('结束时间')
    venue = models.CharField('场地', max_length=100)
    expected_guests = models.IntegerField('预计人数')
    table_count = models.IntegerField('桌数')
    budget_per_table = models.DecimalField('每桌预算', max_digits=10, decimal_places=2)

    status = models.CharField(
        '状态',
        max_length=30,
        choices=BookingStatus.choices,
        default=BookingStatus.DRAFT
    )

    sales_person = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name='bookings_created',
        verbose_name='销售人员'
    )

    remarks = models.TextField('备注', blank=True)

    submitted_at = models.DateTimeField('提交时间', null=True, blank=True)
    floor_supervisor = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name='bookings_handled',
        null=True,
        blank=True,
        verbose_name='厅面主管'
    )
    kitchen_coordinator = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name='bookings_kitchen',
        null=True,
        blank=True,
        verbose_name='后厨统筹'
    )

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '宴会预订'
        verbose_name_plural = verbose_name
        ordering = ['-banquet_date', '-created_at']

    def __str__(self):
        return f'{self.booking_no} - {self.customer_name}'

    def get_stuck_level(self):
        now = timezone.now()
        config = settings.BANQUET_CONFIG

        if self.status == BookingStatus.SUBMITTED and self.submitted_at:
            timeout_hours = config['MENU_CONFIRMATION_TIMEOUT_HOURS']
            deadline = self.submitted_at + timedelta(hours=timeout_hours)
            if now > deadline:
                return StuckLevel.STUCK
            elif now > deadline - timedelta(hours=4):
                return StuckLevel.WARNING

        if self.status == BookingStatus.MENU_CONFIRMED:
            try:
                menu_confirm = self.menu_confirmation
                if menu_confirm.confirmed_at:
                    timeout_hours = config['KITCHEN_RECEIVE_TIMEOUT_HOURS']
                    deadline = menu_confirm.confirmed_at + timedelta(hours=timeout_hours)
                    if now > deadline:
                        return StuckLevel.STUCK
                    elif now > deadline - timedelta(hours=2):
                        return StuckLevel.WARNING
            except MenuConfirmation.DoesNotExist:
                pass

        return StuckLevel.NORMAL

    def get_stuck_deadline(self):
        config = settings.BANQUET_CONFIG
        if self.status == BookingStatus.SUBMITTED and self.submitted_at:
            return self.submitted_at + timedelta(hours=config['MENU_CONFIRMATION_TIMEOUT_HOURS'])
        if self.status == BookingStatus.MENU_CONFIRMED:
            try:
                menu_confirm = self.menu_confirmation
                if menu_confirm.confirmed_at:
                    return menu_confirm.confirmed_at + timedelta(hours=config['KITCHEN_RECEIVE_TIMEOUT_HOURS'])
            except MenuConfirmation.DoesNotExist:
                pass
        return None


class MenuItem(models.Model):
    name = models.CharField('菜品名称', max_length=200)
    category = models.CharField('菜品分类', max_length=50)
    price = models.DecimalField('单价', max_digits=8, decimal_places=2)
    description = models.TextField('描述', blank=True)
    is_active = models.BooleanField('是否启用', default=True)

    class Meta:
        verbose_name = '菜品'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class MenuConfirmation(models.Model):
    booking = models.OneToOneField(
        BanquetBooking,
        on_delete=models.CASCADE,
        related_name='menu_confirmation',
        verbose_name='宴会预订'
    )

    menu_items = models.ManyToManyField(MenuItem, through='MenuConfirmationItem', verbose_name='菜单菜品')

    total_amount = models.DecimalField('总金额', max_digits=12, decimal_places=2, default=0)
    special_requirements = models.TextField('特殊要求', blank=True)
    wine_arrangement = models.TextField('酒水安排', blank=True)
    table_layout = models.TextField('台型布置', blank=True)

    confirmed_by = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name='menu_confirmations',
        verbose_name='确认人'
    )
    confirmed_at = models.DateTimeField('确认时间', null=True, blank=True)

    customer_signed = models.BooleanField('客户已签字', default=False)
    customer_signature = models.TextField('客户签字', blank=True)

    remarks = models.TextField('备注', blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '菜单确认'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'菜单确认 - {self.booking.booking_no}'


class MenuConfirmationItem(models.Model):
    menu_confirmation = models.ForeignKey(MenuConfirmation, on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.IntegerField('数量')
    unit_price = models.DecimalField('单价', max_digits=8, decimal_places=2)
    subtotal = models.DecimalField('小计', max_digits=10, decimal_places=2)
    remarks = models.CharField('备注', max_length=500, blank=True)

    class Meta:
        verbose_name = '菜单确认明细'
        verbose_name_plural = verbose_name


class AuditLog(models.Model):
    booking = models.ForeignKey(
        BanquetBooking,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        verbose_name='宴会预订'
    )
    action = models.CharField('操作', max_length=100)
    from_status = models.CharField('原状态', max_length=30, choices=BookingStatus.choices, blank=True)
    to_status = models.CharField('新状态', max_length=30, choices=BookingStatus.choices, blank=True)
    operator = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name='audit_logs',
        verbose_name='操作人'
    )
    operator_role = models.CharField('操作人角色', max_length=50, choices=Role.choices)
    timestamp = models.DateTimeField('操作时间', default=timezone.now)
    remarks = models.TextField('备注', blank=True)
    ip_address = models.GenericIPAddressField('IP地址', null=True, blank=True)

    class Meta:
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.booking.booking_no} - {self.action} - {self.timestamp}'
