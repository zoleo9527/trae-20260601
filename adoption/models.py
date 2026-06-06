import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Role(models.TextChoices):
    VOLUNTEER = 'volunteer', '救助志愿者'
    VET = 'vet', '兽医'
    ADOPTION_AUDITOR = 'adoption_auditor', '领养审核员'
    HOME_VISITOR = 'home_visitor', '家访员'
    ADMIN = 'admin', '管理员'


class AnimalStatus(models.TextChoices):
    RESCUED = 'rescued', '已救助'
    IN_TREATMENT = 'in_treatment', '治疗中'
    FOSTERED = 'fostered', '寄养中'
    AVAILABLE = 'available', '待领养'
    ADOPTION_PROCESSING = 'adoption_processing', '领养流程中'
    ADOPTED = 'adopted', '已领养'
    RETURNED = 'returned', '被退回'
    DECEASED = 'deceased', '死亡'


class AdoptionStatus(models.TextChoices):
    SUBMITTED = 'submitted', '已提交'
    MATERIALS_MISSING = 'materials_missing', '材料缺失'
    MATERIALS_RECEIVED = 'materials_received', '材料已收'
    PRE_REVIEW_PASS = 'pre_review_pass', '初审通过'
    PRE_REVIEW_REJECT = 'pre_review_reject', '初审不通过'
    HOME_VISIT_SCHEDULED = 'home_visit_scheduled', '家访已安排'
    HOME_VISIT_COMPLETED = 'home_visit_completed', '家访完成'
    HOME_VISIT_PASS = 'home_visit_pass', '家访通过'
    HOME_VISIT_REJECT = 'home_visit_reject', '家访不通过'
    RECHECK_REQUIRED = 'recheck_required', '需复核'
    RECHECK_PASS = 'recheck_pass', '复核通过'
    RECHECK_REJECT = 'recheck_reject', '复核不通过'
    APPROVED = 'approved', '审核通过'
    REJECTED = 'rejected', '已拒绝'
    ADOPTION_COMPLETED = 'adoption_completed', '领养完成'
    CANCELLED = 'cancelled', '已取消'
    TIMEOUT = 'timeout', '已超时'


class VisitResult(models.TextChoices):
    PASS = 'pass', '通过'
    FAIL = 'fail', '不通过'
    PENDING = 'pending', '待确认'


class Staff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=50, choices=Role.choices)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'staff'

    def __str__(self):
        return f'{self.name} - {self.get_role_display()}'


class Animal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)
    breed = models.CharField(max_length=100, blank=True)
    age_months = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', '公'), ('female', '母')], blank=True)
    color = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=50, choices=AnimalStatus.choices, default=AnimalStatus.RESCUED)
    rescue_date = models.DateField()
    rescue_location = models.CharField(max_length=200)
    rescue_volunteer = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='rescued_animals')
    vet = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='treated_animals', blank=True)
    health_condition = models.TextField(blank=True)
    medical_records = models.TextField(blank=True)
    medical_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    foster_family = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'animal'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.species})'


class AdoptionApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.CharField(max_length=100, unique=True)
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='adoption_applications')
    applicant_name = models.CharField(max_length=100)
    applicant_phone = models.CharField(max_length=20)
    applicant_id_card = models.CharField(max_length=50, blank=True)
    applicant_email = models.EmailField(blank=True)
    address = models.CharField(max_length=500)
    housing_type = models.CharField(max_length=50, choices=[
        ('apartment', '公寓'),
        ('house', '独栋房屋'),
        ('villa', '别墅'),
        ('other', '其他')
    ])
    has_pet_experience = models.BooleanField(default=False)
    current_pets = models.TextField(blank=True)
    family_members = models.IntegerField(default=1)
    has_children = models.BooleanField(default=False)
    work_situation = models.CharField(max_length=200, blank=True)
    monthly_income = models.CharField(max_length=50, blank=True)
    reason_for_adoption = models.TextField()
    status = models.CharField(max_length=50, choices=AdoptionStatus.choices, default=AdoptionStatus.SUBMITTED)
    current_handler = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='handling_applications')
    pre_reviewer = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='pre_reviewed_applications', blank=True)
    home_visitor = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='home_visited_applications', blank=True)
    rechecker = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, related_name='rechecked_applications', blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    last_updated_at = models.DateTimeField(auto_now=True)
    last_action_at = models.DateTimeField(null=True, blank=True)
    deadline_at = models.DateTimeField(null=True, blank=True)
    remark = models.TextField(blank=True)

    class Meta:
        db_table = 'adoption_application'
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.applicant_name} - {self.animal.name}'


class ApplicationTimeline(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(AdoptionApplication, on_delete=models.CASCADE, related_name='timelines')
    action = models.CharField(max_length=200)
    status_from = models.CharField(max_length=50, choices=AdoptionStatus.choices, blank=True)
    status_to = models.CharField(max_length=50, choices=AdoptionStatus.choices)
    operator = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    operator_role = models.CharField(max_length=50, choices=Role.choices)
    remark = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'application_timeline'
        ordering = ['created_at']


class HomeVisitRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(AdoptionApplication, on_delete=models.CASCADE, related_name='home_visit')
    visitor = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    scheduled_at = models.DateTimeField()
    visited_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    result = models.CharField(max_length=20, choices=VisitResult.choices, default=VisitResult.PENDING)
    environment_score = models.IntegerField(null=True, blank=True)
    experience_score = models.IntegerField(null=True, blank=True)
    attitude_score = models.IntegerField(null=True, blank=True)
    total_score = models.IntegerField(null=True, blank=True)
    environment_description = models.TextField(blank=True)
    family_communication = models.TextField(blank=True)
    pet_knowledge = models.TextField(blank=True)
    concerns = models.TextField(blank=True)
    suggestions = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)
    recheck_required = models.BooleanField(default=False)
    recheck_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'home_visit_record'


class FollowUpRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(AdoptionApplication, on_delete=models.CASCADE, related_name='follow_ups')
    follow_up_date = models.DateField()
    follow_up_type = models.CharField(max_length=50, choices=[
        ('week1', '一周回访'),
        ('month1', '一月回访'),
        ('month3', '三月回访'),
        ('month6', '半年回访'),
        ('year1', '一年回访'),
        ('other', '其他')
    ])
    operator = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    animal_health = models.TextField(blank=True)
    adaptation = models.TextField(blank=True)
    problems = models.TextField(blank=True)
    suggestions = models.TextField(blank=True)
    next_follow_up_at = models.DateField(null=True, blank=True)
    is_gap = models.BooleanField(default=False)
    gap_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follow_up_record'
        ordering = ['-follow_up_date']


class MedicalRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='medical_records_list')
    vet = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    visit_date = models.DateField()
    diagnosis = models.TextField()
    treatment = models.TextField(blank=True)
    medication = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    next_visit_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'medical_record'
        ordering = ['-visit_date']


class IdempotencyKey(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    endpoint = models.CharField(max_length=200)
    response_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'idempotency_key'
