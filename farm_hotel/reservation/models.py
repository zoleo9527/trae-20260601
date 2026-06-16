from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class Role(models.Model):
    ROLE_CHOICES = [
        ('boss', '老板'),
        ('chef', '后厨'),
        ('housekeeper', '客房阿姨'),
        ('waiter', '服务员'),
    ]
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    permissions = models.JSONField(default=list)
    
    def __str__(self):
        return self.get_name_display()

class StaffManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('用户名必须设置')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)

class Staff(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=50)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='staff')
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    objects = StaffManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name', 'role']
    
    def __str__(self):
        return f"{self.name} ({self.role.get_name_display()})"

class DiningTable(models.Model):
    TABLE_TYPE_CHOICES = [
        ('private', '包间'),
        ('hall', '大厅'),
        ('outdoor', '户外'),
    ]
    table_number = models.CharField(max_length=20, unique=True)
    capacity = models.IntegerField(default=4)
    table_type = models.CharField(max_length=20, choices=TABLE_TYPE_CHOICES)
    status = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.get_table_type_display()} {self.table_number}"

class MenuCategory(models.Model):
    name = models.CharField(max_length=50)
    order = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name

class MenuItem(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='items')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    available = models.BooleanField(default=True)
    image_url = models.URLField(blank=True)
    
    def __str__(self):
        return self.name

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', '待确认'),
        ('confirmed', '已确认'),
        ('menu_confirmed', '菜单已确认'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
        ('rejected', '已驳回'),
    ]
    
    customer_name = models.CharField(max_length=50)
    customer_phone = models.CharField(max_length=20)
    table = models.ForeignKey(DiningTable, on_delete=models.CASCADE, related_name='reservations')
    date = models.DateField()
    time_slot = models.CharField(max_length=20)
    guest_count = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='created_reservations')
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.customer_name} - {self.table} - {self.date}"

class ReservationMenu(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='menus')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    special_request = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.menu_item.name} x {self.quantity}"

class FlowRecord(models.Model):
    ACTION_CHOICES = [
        ('create', '创建预订'),
        ('confirm', '确认预订'),
        ('submit_menu', '提交菜单'),
        ('reject_menu', '驳回菜单'),
        ('approve_menu', '确认菜单'),
        ('complete', '完成用餐'),
        ('cancel', '取消预订'),
        ('reject', '驳回预订'),
        ('supplement', '补录信息'),
    ]
    
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='flow_records')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    operator = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='flow_records')
    remark = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.operator.name} - {self.created_at}"

class Notification(models.Model):
    TYPE_CHOICES = [
        ('pending_reservation', '待确认预订'),
        ('pending_menu', '待确认菜单'),
        ('rejected_menu', '菜单被驳回'),
        ('supplement_required', '需要补录'),
        ('reminder', '提醒'),
    ]
    
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='notifications')
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.staff.name}"
