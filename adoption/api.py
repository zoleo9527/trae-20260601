import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import NinjaAPI, Schema, Query
from ninja.errors import HttpError
from .models import (
    Staff, Animal, AdoptionApplication, ApplicationTimeline,
    HomeVisitRecord, FollowUpRecord, MedicalRecord, IdempotencyKey,
    Role, AnimalStatus, AdoptionStatus, VisitResult
)

api = NinjaAPI(title='动物救助站领养系统API', version='1.0.0')


class ErrorCode:
    SUCCESS = 0
    PARAM_ERROR = 40001
    IDEMPOTENCY_KEY_REUSED = 40002
    ANIMAL_NOT_FOUND = 40401
    APPLICATION_NOT_FOUND = 40402
    STAFF_NOT_FOUND = 40403
    INVALID_STATUS_TRANSITION = 40901
    APPLICATION_ALREADY_PROCESSED = 40902
    HOME_VISIT_NOT_EXISTS = 40404
    INSUFFICIENT_PERMISSION = 40301
    TIMEOUT_ERROR = 40801
    INTERNAL_ERROR = 50001
    FOLLOW_UP_NOT_FOUND = 40405
    MEDICAL_RECORD_NOT_FOUND = 40406
    FOLLOW_UP_GAP_MARKED = 40903


ERROR_MESSAGES = {
    ErrorCode.PARAM_ERROR: '参数错误',
    ErrorCode.IDEMPOTENCY_KEY_REUSED: '幂等键已被使用',
    ErrorCode.ANIMAL_NOT_FOUND: '动物不存在',
    ErrorCode.APPLICATION_NOT_FOUND: '领养申请不存在',
    ErrorCode.STAFF_NOT_FOUND: '工作人员不存在',
    ErrorCode.INVALID_STATUS_TRANSITION: '无效的状态转换',
    ErrorCode.APPLICATION_ALREADY_PROCESSED: '申请已处理',
    ErrorCode.HOME_VISIT_NOT_EXISTS: '家访记录不存在',
    ErrorCode.INSUFFICIENT_PERMISSION: '权限不足',
    ErrorCode.TIMEOUT_ERROR: '操作超时',
    ErrorCode.INTERNAL_ERROR: '内部错误',
    ErrorCode.FOLLOW_UP_NOT_FOUND: '回访记录不存在',
    ErrorCode.MEDICAL_RECORD_NOT_FOUND: '医疗记录不存在',
    ErrorCode.FOLLOW_UP_GAP_MARKED: '回访断档已标记',
}


def check_idempotency(key: str, endpoint: str) -> Optional[dict]:
    try:
        ik = IdempotencyKey.objects.get(key=key, endpoint=endpoint)
        if ik.expires_at > timezone.now():
            return ik.response_data
        ik.delete()
    except IdempotencyKey.DoesNotExist:
        pass
    return None


def save_idempotency(key: str, endpoint: str, response_data: dict, ttl_hours: int = 24):
    IdempotencyKey.objects.create(
        key=key,
        endpoint=endpoint,
        response_data=response_data,
        expires_at=timezone.now() + timedelta(hours=ttl_hours)
    )


def create_timeline(application: AdoptionApplication, action: str, status_to: str,
                    operator: Optional[Staff], remark: str = ''):
    ApplicationTimeline.objects.create(
        application=application,
        action=action,
        status_from=application.status,
        status_to=status_to,
        operator=operator,
        operator_role=operator.role if operator else Role.ADMIN,
        remark=remark
    )


class StaffSchema(Schema):
    id: int
    name: str
    role: str
    role_display: str
    phone: str = ''

    @staticmethod
    def from_orm(obj: Staff):
        return StaffSchema(
            id=obj.id,
            name=obj.name,
            role=obj.role,
            role_display=obj.get_role_display(),
            phone=obj.phone or ''
        )


class AnimalSchema(Schema):
    id: str
    name: str
    species: str
    breed: str
    age_months: Optional[int]
    gender: str
    color: str
    status: str
    status_display: str
    rescue_date: str
    rescue_location: str
    rescue_volunteer: Optional[StaffSchema]
    vet: Optional[StaffSchema]
    health_condition: str
    medical_cost: float
    description: str

    @staticmethod
    def from_orm(obj: Animal):
        return AnimalSchema(
            id=str(obj.id),
            name=obj.name,
            species=obj.species,
            breed=obj.breed,
            age_months=obj.age_months,
            gender=obj.gender,
            color=obj.color,
            status=obj.status,
            status_display=obj.get_status_display(),
            rescue_date=obj.rescue_date.isoformat(),
            rescue_location=obj.rescue_location,
            rescue_volunteer=StaffSchema.from_orm(obj.rescue_volunteer) if obj.rescue_volunteer else None,
            vet=StaffSchema.from_orm(obj.vet) if obj.vet else None,
            health_condition=obj.health_condition,
            medical_cost=float(obj.medical_cost),
            description=obj.description
        )


class TimelineSchema(Schema):
    id: str
    action: str
    status_from: str
    status_from_display: str
    status_to: str
    status_to_display: str
    operator: Optional[StaffSchema]
    operator_role: str
    operator_role_display: str
    remark: str
    created_at: str

    @staticmethod
    def from_orm(obj: ApplicationTimeline):
        return TimelineSchema(
            id=str(obj.id),
            action=obj.action,
            status_from=obj.status_from,
            status_from_display=AdoptionStatus(obj.status_from).label if obj.status_from else '',
            status_to=obj.status_to,
            status_to_display=AdoptionStatus(obj.status_to).label,
            operator=StaffSchema.from_orm(obj.operator) if obj.operator else None,
            operator_role=obj.operator_role,
            operator_role_display=Role(obj.operator_role).label,
            remark=obj.remark,
            created_at=obj.created_at.isoformat()
        )


class HomeVisitSchema(Schema):
    id: str
    visitor: Optional[StaffSchema]
    scheduled_at: str
    visited_at: Optional[str]
    completed_at: Optional[str]
    result: str
    result_display: str
    environment_score: Optional[int]
    experience_score: Optional[int]
    attitude_score: Optional[int]
    total_score: Optional[int]
    environment_description: str
    family_communication: str
    pet_knowledge: str
    concerns: str
    suggestions: str
    recheck_required: bool
    recheck_reason: str

    @staticmethod
    def from_orm(obj: HomeVisitRecord):
        return HomeVisitSchema(
            id=str(obj.id),
            visitor=StaffSchema.from_orm(obj.visitor) if obj.visitor else None,
            scheduled_at=obj.scheduled_at.isoformat(),
            visited_at=obj.visited_at.isoformat() if obj.visited_at else None,
            completed_at=obj.completed_at.isoformat() if obj.completed_at else None,
            result=obj.result,
            result_display=obj.get_result_display(),
            environment_score=obj.environment_score,
            experience_score=obj.experience_score,
            attitude_score=obj.attitude_score,
            total_score=obj.total_score,
            environment_description=obj.environment_description,
            family_communication=obj.family_communication,
            pet_knowledge=obj.pet_knowledge,
            concerns=obj.concerns,
            suggestions=obj.suggestions,
            recheck_required=obj.recheck_required,
            recheck_reason=obj.recheck_reason
        )


class ApplicationDetailSchema(Schema):
    id: str
    idempotency_key: str
    animal: AnimalSchema
    applicant_name: str
    applicant_phone: str
    applicant_id_card: str
    address: str
    housing_type: str
    has_pet_experience: bool
    current_pets: str
    family_members: int
    has_children: bool
    reason_for_adoption: str
    status: str
    status_display: str
    current_handler: Optional[StaffSchema]
    pre_reviewer: Optional[StaffSchema]
    home_visitor: Optional[StaffSchema]
    rechecker: Optional[StaffSchema]
    submitted_at: str
    last_updated_at: str
    deadline_at: Optional[str]
    remark: str
    is_timeout: bool
    has_follow_up_gap: bool = False
    latest_gap_reason: str = ""
    timelines: List[TimelineSchema]
    home_visit: Optional[HomeVisitSchema]

    @staticmethod
    def from_orm(obj: AdoptionApplication):
        is_timeout = bool(obj.deadline_at and obj.deadline_at < timezone.now() and obj.status not in [
            AdoptionStatus.APPROVED, AdoptionStatus.REJECTED, AdoptionStatus.ADOPTION_COMPLETED,
            AdoptionStatus.CANCELLED, AdoptionStatus.TIMEOUT
        ])
        try:
            home_visit = HomeVisitSchema.from_orm(obj.home_visit)
        except HomeVisitRecord.DoesNotExist:
            home_visit = None
        return ApplicationDetailSchema(
            id=str(obj.id),
            idempotency_key=obj.idempotency_key,
            animal=AnimalSchema.from_orm(obj.animal),
            applicant_name=obj.applicant_name,
            applicant_phone=obj.applicant_phone,
            applicant_id_card=obj.applicant_id_card,
            address=obj.address,
            housing_type=obj.housing_type,
            has_pet_experience=obj.has_pet_experience,
            current_pets=obj.current_pets,
            family_members=obj.family_members,
            has_children=obj.has_children,
            reason_for_adoption=obj.reason_for_adoption,
            status=obj.status,
            status_display=obj.get_status_display(),
            current_handler=StaffSchema.from_orm(obj.current_handler) if obj.current_handler else None,
            pre_reviewer=StaffSchema.from_orm(obj.pre_reviewer) if obj.pre_reviewer else None,
            home_visitor=StaffSchema.from_orm(obj.home_visitor) if obj.home_visitor else None,
            rechecker=StaffSchema.from_orm(obj.rechecker) if obj.rechecker else None,
            submitted_at=obj.submitted_at.isoformat(),
            last_updated_at=obj.last_updated_at.isoformat(),
            deadline_at=obj.deadline_at.isoformat() if obj.deadline_at else None,
            remark=obj.remark,
            is_timeout=is_timeout,
            has_follow_up_gap=obj.follow_ups.filter(is_gap=True).exists(),
            latest_gap_reason=obj.follow_ups.filter(is_gap=True).order_by("-follow_up_date").first().gap_reason if obj.follow_ups.filter(is_gap=True).exists() else "",
            timelines=[TimelineSchema.from_orm(t) for t in obj.timelines.all()],
            home_visit=home_visit
        )


class ApplicationListItemSchema(Schema):
    id: str
    animal_name: str
    animal_species: str
    applicant_name: str
    applicant_phone: str
    status: str
    status_display: str
    current_handler_name: Optional[str]
    submitted_at: str
    deadline_at: Optional[str]
    is_timeout: bool
    has_materials_missing: bool
    has_review_issue: bool

    @staticmethod
    def from_orm(obj: AdoptionApplication):
        is_timeout = bool(obj.deadline_at and obj.deadline_at < timezone.now() and obj.status not in [
            AdoptionStatus.APPROVED, AdoptionStatus.REJECTED, AdoptionStatus.ADOPTION_COMPLETED,
            AdoptionStatus.CANCELLED, AdoptionStatus.TIMEOUT
        ])
        has_materials_missing = obj.status == AdoptionStatus.MATERIALS_MISSING
        has_review_issue = obj.status in [
            AdoptionStatus.PRE_REVIEW_REJECT,
            AdoptionStatus.HOME_VISIT_REJECT,
            AdoptionStatus.RECHECK_REJECT,
            AdoptionStatus.REJECTED
        ]
        return ApplicationListItemSchema(
            id=str(obj.id),
            animal_name=obj.animal.name,
            animal_species=obj.animal.species,
            applicant_name=obj.applicant_name,
            applicant_phone=obj.applicant_phone,
            status=obj.status,
            status_display=obj.get_status_display(),
            current_handler_name=obj.current_handler.name if obj.current_handler else None,
            submitted_at=obj.submitted_at.isoformat(),
            deadline_at=obj.deadline_at.isoformat() if obj.deadline_at else None,
            is_timeout=is_timeout,
            has_follow_up_gap=obj.follow_ups.filter(is_gap=True).exists(),
            latest_gap_reason=obj.follow_ups.filter(is_gap=True).order_by("-follow_up_date").first().gap_reason if obj.follow_ups.filter(is_gap=True).exists() else "",
            has_materials_missing=has_materials_missing,
            has_review_issue=has_review_issue
        )


class ApiResponse(Schema):
    code: int
    message: str
    data: Optional[dict] = None


class CreateApplicationIn(Schema):
    idempotency_key: str
    animal_id: str
    applicant_name: str
    applicant_phone: str
    applicant_id_card: str = ''
    applicant_email: str = ''
    address: str
    housing_type: str
    has_pet_experience: bool = False
    current_pets: str = ''
    family_members: int = 1
    has_children: bool = False
    work_situation: str = ''
    monthly_income: str = ''
    reason_for_adoption: str


class AssignHandlerIn(Schema):
    staff_id: int
    remark: str = ''


class ProcessMaterialsIn(Schema):
    action: str
    remark: str = ''


class PreReviewIn(Schema):
    passed: bool
    remark: str = ''


class ScheduleHomeVisitIn(Schema):
    visitor_id: int
    scheduled_at: str
    remark: str = ''


class HomeVisitResultIn(Schema):
    visited_at: str
    result: str
    environment_score: int
    experience_score: int
    attitude_score: int
    environment_description: str = ''
    family_communication: str = ''
    pet_knowledge: str = ''
    concerns: str = ''
    suggestions: str = ''
    recheck_required: bool = False
    recheck_reason: str = ''


class RecheckIn(Schema):
    passed: bool
    remark: str = ''


class ApproveIn(Schema):
    remark: str = ''


class CompleteAdoptionIn(Schema):
    adoption_date: str
    remark: str = ''


class CreateFollowUpIn(Schema):
    idempotency_key: str = ''
    follow_up_date: str
    follow_up_type: str
    operator_id: Optional[int] = None
    animal_health: str = ''
    adaptation: str = ''
    problems: str = ''
    suggestions: str = ''
    next_follow_up_at: Optional[str] = None
    is_gap: bool = False
    gap_reason: str = ''


class MedicalRecordSchema(Schema):
    id: str
    vet: Optional[StaffSchema]
    visit_date: str
    diagnosis: str
    treatment: str
    medication: str
    cost: float
    next_visit_date: Optional[str]
    created_at: str

    @staticmethod
    def from_orm(obj: MedicalRecord):
        return MedicalRecordSchema(
            id=str(obj.id),
            vet=StaffSchema.from_orm(obj.vet) if obj.vet else None,
            visit_date=obj.visit_date.isoformat(),
            diagnosis=obj.diagnosis,
            treatment=obj.treatment,
            medication=obj.medication,
            cost=float(obj.cost),
            next_visit_date=obj.next_visit_date.isoformat() if obj.next_visit_date else None,
            created_at=obj.created_at.isoformat()
        )


class FollowUpSchema(Schema):
    id: str
    follow_up_date: str
    follow_up_type: str
    follow_up_type_display: str
    operator: Optional[StaffSchema]
    animal_health: str
    adaptation: str
    problems: str
    suggestions: str
    next_follow_up_at: Optional[str]
    is_gap: bool
    gap_reason: str
    created_at: str

    @staticmethod
    def from_orm(obj: FollowUpRecord):
        return FollowUpSchema(
            id=str(obj.id),
            follow_up_date=obj.follow_up_date.isoformat(),
            follow_up_type=obj.follow_up_type,
            follow_up_type_display=obj.get_follow_up_type_display(),
            operator=StaffSchema.from_orm(obj.operator) if obj.operator else None,
            animal_health=obj.animal_health,
            adaptation=obj.adaptation,
            problems=obj.problems,
            suggestions=obj.suggestions,
            next_follow_up_at=obj.next_follow_up_at.isoformat() if obj.next_follow_up_at else None,
            is_gap=getattr(obj, 'is_gap', False),
            gap_reason=getattr(obj, 'gap_reason', ''),
            created_at=obj.created_at.isoformat()
        )


class AnimalDetailSchema(Schema):
    id: str
    name: str
    species: str
    breed: str
    age_months: Optional[int]
    gender: str
    color: str
    status: str
    status_display: str
    rescue_date: str
    rescue_location: str
    rescue_volunteer: Optional[StaffSchema]
    vet: Optional[StaffSchema]
    health_condition: str
    medical_cost: float
    foster_family: str
    description: str
    medical_records: List[MedicalRecordSchema]

    @staticmethod
    def from_orm(obj: Animal):
        return AnimalDetailSchema(
            id=str(obj.id),
            name=obj.name,
            species=obj.species,
            breed=obj.breed,
            age_months=obj.age_months,
            gender=obj.gender,
            color=obj.color,
            status=obj.status,
            status_display=obj.get_status_display(),
            rescue_date=obj.rescue_date.isoformat(),
            rescue_location=obj.rescue_location,
            rescue_volunteer=StaffSchema.from_orm(obj.rescue_volunteer) if obj.rescue_volunteer else None,
            vet=StaffSchema.from_orm(obj.vet) if obj.vet else None,
            health_condition=obj.health_condition,
            medical_cost=float(obj.medical_cost),
            foster_family=obj.foster_family,
            description=obj.description,
            medical_records=[MedicalRecordSchema.from_orm(m) for m in obj.medical_records_list.all()]
        )


class ApplicationFullDetailSchema(Schema):
    id: str
    idempotency_key: str
    animal: AnimalDetailSchema
    applicant_name: str
    applicant_phone: str
    applicant_id_card: str
    address: str
    housing_type: str
    has_pet_experience: bool
    current_pets: str
    family_members: int
    has_children: bool
    reason_for_adoption: str
    status: str
    status_display: str
    current_handler: Optional[StaffSchema]
    pre_reviewer: Optional[StaffSchema]
    home_visitor: Optional[StaffSchema]
    rechecker: Optional[StaffSchema]
    submitted_at: str
    last_updated_at: str
    deadline_at: Optional[str]
    remark: str
    is_timeout: bool
    has_follow_up_gap: bool
    timelines: List[TimelineSchema]
    home_visit: Optional[HomeVisitSchema]
    follow_ups: List[FollowUpSchema]
    medical_summary: dict

    @staticmethod
    def from_orm(obj: AdoptionApplication):
        is_timeout = bool(obj.deadline_at and obj.deadline_at < timezone.now() and obj.status not in [
            AdoptionStatus.APPROVED, AdoptionStatus.REJECTED, AdoptionStatus.ADOPTION_COMPLETED,
            AdoptionStatus.CANCELLED, AdoptionStatus.TIMEOUT
        ])
        try:
            home_visit = HomeVisitSchema.from_orm(obj.home_visit)
        except HomeVisitRecord.DoesNotExist:
            home_visit = None
        
        follow_ups = [FollowUpSchema.from_orm(f) for f in obj.follow_ups.all()]
        has_follow_up_gap = any(getattr(f, 'is_gap', False) for f in obj.follow_ups.all())
        
        medical_records = obj.animal.medical_records_list.all()
        total_cost = sum(m.cost for m in medical_records)
        
        return ApplicationFullDetailSchema(
            id=str(obj.id),
            idempotency_key=obj.idempotency_key,
            animal=AnimalDetailSchema.from_orm(obj.animal),
            applicant_name=obj.applicant_name,
            applicant_phone=obj.applicant_phone,
            applicant_id_card=obj.applicant_id_card,
            address=obj.address,
            housing_type=obj.housing_type,
            has_pet_experience=obj.has_pet_experience,
            current_pets=obj.current_pets,
            family_members=obj.family_members,
            has_children=obj.has_children,
            reason_for_adoption=obj.reason_for_adoption,
            status=obj.status,
            status_display=obj.get_status_display(),
            current_handler=StaffSchema.from_orm(obj.current_handler) if obj.current_handler else None,
            pre_reviewer=StaffSchema.from_orm(obj.pre_reviewer) if obj.pre_reviewer else None,
            home_visitor=StaffSchema.from_orm(obj.home_visitor) if obj.home_visitor else None,
            rechecker=StaffSchema.from_orm(obj.rechecker) if obj.rechecker else None,
            submitted_at=obj.submitted_at.isoformat(),
            last_updated_at=obj.last_updated_at.isoformat(),
            deadline_at=obj.deadline_at.isoformat() if obj.deadline_at else None,
            remark=obj.remark,
            is_timeout=is_timeout,
            has_follow_up_gap=obj.follow_ups.filter(is_gap=True).exists(),
            latest_gap_reason=obj.follow_ups.filter(is_gap=True).order_by("-follow_up_date").first().gap_reason if obj.follow_ups.filter(is_gap=True).exists() else "",
            timelines=[TimelineSchema.from_orm(t) for t in obj.timelines.all()],
            home_visit=home_visit,
            follow_ups=follow_ups,
            medical_summary={
                'total_cost': float(total_cost),
                'record_count': medical_records.count(),
                'last_visit': medical_records.first().visit_date.isoformat() if medical_records.exists() else None
            }
        )


@api.get('/staff', response=List[StaffSchema], summary='获取工作人员列表')
def list_staff(request, role: Optional[str] = Query(None)):
    queryset = Staff.objects.all()
    if role:
        queryset = queryset.filter(role=role)
    return [StaffSchema.from_orm(s) for s in queryset]


@api.get('/animals', response=List[AnimalSchema], summary='获取动物列表')
def list_animals(request, status: Optional[str] = Query(None)):
    queryset = Animal.objects.all()
    if status:
        queryset = queryset.filter(status=status)
    return [AnimalSchema.from_orm(a) for a in queryset]


@api.get('/animals/{animal_id}', response=AnimalSchema, summary='获取动物详情')
def get_animal(request, animal_id: str):
    animal = get_object_or_404(Animal, id=animal_id)
    return AnimalSchema.from_orm(animal)


@api.get('/applications', response=List[ApplicationListItemSchema], summary='获取领养申请列表')
def list_applications(request, status: Optional[str] = Query(None), handler_id: Optional[int] = Query(None),
                      only_abnormal: bool = False):
    queryset = AdoptionApplication.objects.select_related('animal', 'current_handler')
    if status:
        queryset = queryset.filter(status=status)
    if handler_id:
        queryset = queryset.filter(current_handler_id=handler_id)
    if only_abnormal:
        now = timezone.now()
        queryset = queryset.filter(
            Q(status=AdoptionStatus.MATERIALS_MISSING) |
            Q(status__in=[
                AdoptionStatus.PRE_REVIEW_REJECT,
                AdoptionStatus.HOME_VISIT_REJECT,
                AdoptionStatus.RECHECK_REJECT
            ]) |
            (Q(deadline_at__lt=now) & ~Q(status__in=[
                AdoptionStatus.APPROVED, AdoptionStatus.REJECTED,
                AdoptionStatus.ADOPTION_COMPLETED, AdoptionStatus.CANCELLED,
                AdoptionStatus.TIMEOUT
            ]))
        )
    return [ApplicationListItemSchema.from_orm(a) for a in queryset]


@api.get('/applications/{application_id}', response=ApiResponse, summary='获取领养申请详情')
def get_application(request, application_id: str):
    try:
        app = AdoptionApplication.objects.select_related(
            'animal', 'current_handler', 'pre_reviewer', 'home_visitor', 'rechecker'
        ).prefetch_related('timelines').get(id=application_id)
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='成功',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.post('/applications', response=ApiResponse, summary='提交领养申请（幂等）')
@transaction.atomic
def create_application(request, payload: CreateApplicationIn):
    cached = check_idempotency(payload.idempotency_key, 'create_application')
    if cached:
        return ApiResponse(code=ErrorCode.SUCCESS, message='成功（幂等）', data=cached)

    try:
        animal = Animal.objects.get(id=payload.animal_id)
    except Animal.DoesNotExist:
        return ApiResponse(code=ErrorCode.ANIMAL_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.ANIMAL_NOT_FOUND])

    try:
        auditor = Staff.objects.filter(role=Role.ADOPTION_AUDITOR).first()
        app = AdoptionApplication.objects.create(
            idempotency_key=payload.idempotency_key,
            animal=animal,
            applicant_name=payload.applicant_name,
            applicant_phone=payload.applicant_phone,
            applicant_id_card=payload.applicant_id_card,
            applicant_email=payload.applicant_email,
            address=payload.address,
            housing_type=payload.housing_type,
            has_pet_experience=payload.has_pet_experience,
            current_pets=payload.current_pets,
            family_members=payload.family_members,
            has_children=payload.has_children,
            work_situation=payload.work_situation,
            monthly_income=payload.monthly_income,
            reason_for_adoption=payload.reason_for_adoption,
            status=AdoptionStatus.SUBMITTED,
            current_handler=auditor,
            deadline_at=timezone.now() + timedelta(days=3)
        )
        create_timeline(app, '提交领养申请', AdoptionStatus.SUBMITTED, auditor, '申请已提交')
        animal.status = AnimalStatus.ADOPTION_PROCESSING
        animal.save()

        result = ApplicationDetailSchema.from_orm(app).dict()
        save_idempotency(payload.idempotency_key, 'create_application', result)

        return ApiResponse(code=ErrorCode.SUCCESS, message='提交成功', data=result)
    except Exception as e:
        return ApiResponse(code=ErrorCode.INTERNAL_ERROR, message=str(e))


@api.post('/applications/{application_id}/assign', response=ApiResponse, summary='分配处理人')
@transaction.atomic
def assign_handler(request, application_id: str, payload: AssignHandlerIn):
    try:
        app = AdoptionApplication.objects.get(id=application_id)
        staff = Staff.objects.get(id=payload.staff_id)
        app.current_handler = staff
        app.last_action_at = timezone.now()
        app.save()
        create_timeline(app, f'分配处理人: {staff.name}', app.status, staff, payload.remark)
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='分配成功',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])
    except Staff.DoesNotExist:
        return ApiResponse(code=ErrorCode.STAFF_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.STAFF_NOT_FOUND])


@api.post('/applications/{application_id}/materials', response=ApiResponse, summary='材料处理（标记缺失/确认收到）')
@transaction.atomic
def process_materials(request, application_id: str, payload: ProcessMaterialsIn):
    try:
        app = AdoptionApplication.objects.select_related('current_handler').get(id=application_id)
        handler = app.current_handler

        if payload.action == 'mark_missing':
            if app.status not in [AdoptionStatus.SUBMITTED, AdoptionStatus.MATERIALS_RECEIVED]:
                return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法标记材料缺失')
            new_status = AdoptionStatus.MATERIALS_MISSING
            action = '标记材料缺失'
            app.deadline_at = timezone.now() + timedelta(days=7)
        elif payload.action == 'confirm_received':
            if app.status != AdoptionStatus.MATERIALS_MISSING:
                return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法确认材料')
            new_status = AdoptionStatus.MATERIALS_RECEIVED
            action = '确认材料已收到'
            app.deadline_at = timezone.now() + timedelta(days=3)
        else:
            return ApiResponse(code=ErrorCode.PARAM_ERROR, message='无效的action参数')

        create_timeline(app, action, new_status, handler, payload.remark)
        app.status = new_status
        app.last_action_at = timezone.now()
        app.save()

        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='处理成功',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.post('/applications/{application_id}/pre-review', response=ApiResponse, summary='初审')
@transaction.atomic
def pre_review(request, application_id: str, payload: PreReviewIn):
    try:
        app = AdoptionApplication.objects.select_related('current_handler').get(id=application_id)
        if app.status not in [AdoptionStatus.MATERIALS_RECEIVED, AdoptionStatus.SUBMITTED]:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法进行初审')

        reviewer = app.current_handler
        if reviewer and reviewer.role not in [Role.ADOPTION_AUDITOR, Role.ADMIN]:
            return ApiResponse(code=ErrorCode.INSUFFICIENT_PERMISSION, message='无权进行初审')

        app.pre_reviewer = reviewer
        if payload.passed:
            new_status = AdoptionStatus.PRE_REVIEW_PASS
            action = '初审通过'
            app.deadline_at = timezone.now() + timedelta(days=7)
            visitors = Staff.objects.filter(role=Role.HOME_VISITOR).first()
            if visitors:
                app.current_handler = visitors
        else:
            new_status = AdoptionStatus.PRE_REVIEW_REJECT
            action = '初审不通过'
            app.animal.status = AnimalStatus.AVAILABLE
            app.animal.save()

        create_timeline(app, action, new_status, reviewer, payload.remark)
        app.status = new_status
        app.last_action_at = timezone.now()
        app.save()

        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='初审完成',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.post('/applications/{application_id}/schedule-visit', response=ApiResponse, summary='安排家访')
@transaction.atomic
def schedule_home_visit(request, application_id: str, payload: ScheduleHomeVisitIn):
    try:
        app = AdoptionApplication.objects.get(id=application_id)
        if app.status != AdoptionStatus.PRE_REVIEW_PASS:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法安排家访')

        visitor = Staff.objects.get(id=payload.visitor_id)
        if visitor.role not in [Role.HOME_VISITOR, Role.ADMIN]:
            return ApiResponse(code=ErrorCode.INSUFFICIENT_PERMISSION, message='该人员无家访权限')

        scheduled_at = datetime.fromisoformat(payload.scheduled_at.replace('Z', '+00:00'))

        home_visit = HomeVisitRecord.objects.create(
            application=app,
            visitor=visitor,
            scheduled_at=scheduled_at
        )

        app.home_visitor = visitor
        app.current_handler = visitor
        new_status = AdoptionStatus.HOME_VISIT_SCHEDULED
        create_timeline(app, f'安排家访: {visitor.name}', new_status, visitor, payload.remark)
        app.status = new_status
        app.deadline_at = scheduled_at + timedelta(days=3)
        app.last_action_at = timezone.now()
        app.save()

        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='家访已安排',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])
    except Staff.DoesNotExist:
        return ApiResponse(code=ErrorCode.STAFF_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.STAFF_NOT_FOUND])


@api.post('/applications/{application_id}/home-visit', response=ApiResponse, summary='提交家访结果')
@transaction.atomic
def submit_home_visit(request, application_id: str, payload: HomeVisitResultIn):
    try:
        app = AdoptionApplication.objects.select_related('home_visit').get(id=application_id)
        if app.status != AdoptionStatus.HOME_VISIT_SCHEDULED:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法提交家访结果')

        home_visit = app.home_visit
        visited_at = datetime.fromisoformat(payload.visited_at.replace('Z', '+00:00'))
        total = (payload.environment_score + payload.experience_score + payload.attitude_score) // 3

        home_visit.visited_at = visited_at
        home_visit.completed_at = timezone.now()
        home_visit.result = payload.result
        home_visit.environment_score = payload.environment_score
        home_visit.experience_score = payload.experience_score
        home_visit.attitude_score = payload.attitude_score
        home_visit.total_score = total
        home_visit.environment_description = payload.environment_description
        home_visit.family_communication = payload.family_communication
        home_visit.pet_knowledge = payload.pet_knowledge
        home_visit.concerns = payload.concerns
        home_visit.suggestions = payload.suggestions
        home_visit.recheck_required = payload.recheck_required
        home_visit.recheck_reason = payload.recheck_reason
        home_visit.save()

        if payload.result == VisitResult.PASS:
            if payload.recheck_required:
                new_status = AdoptionStatus.RECHECK_REQUIRED
                action = '家访通过，需复核'
                recheckers = Staff.objects.filter(role=Role.ADOPTION_AUDITOR).first()
                app.current_handler = recheckers
                app.deadline_at = timezone.now() + timedelta(days=3)
            else:
                new_status = AdoptionStatus.HOME_VISIT_PASS
                action = '家访通过'
                app.deadline_at = timezone.now() + timedelta(days=2)
        else:
            new_status = AdoptionStatus.HOME_VISIT_REJECT
            action = '家访不通过'
            app.animal.status = AnimalStatus.AVAILABLE
            app.animal.save()

        create_timeline(app, action, new_status, home_visit.visitor, payload.concerns or payload.suggestions)
        app.status = new_status
        app.last_action_at = timezone.now()
        app.save()

        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='家访结果已提交',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])
    except HomeVisitRecord.DoesNotExist:
        return ApiResponse(code=ErrorCode.HOME_VISIT_NOT_EXISTS, message=ERROR_MESSAGES[ErrorCode.HOME_VISIT_NOT_EXISTS])


@api.post('/applications/{application_id}/recheck', response=ApiResponse, summary='复核')
@transaction.atomic
def recheck(request, application_id: str, payload: RecheckIn):
    try:
        app = AdoptionApplication.objects.get(id=application_id)
        if app.status not in [AdoptionStatus.RECHECK_REQUIRED, AdoptionStatus.HOME_VISIT_PASS]:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法复核')

        rechecker = app.current_handler
        if rechecker and rechecker.role not in [Role.ADOPTION_AUDITOR, Role.ADMIN]:
            return ApiResponse(code=ErrorCode.INSUFFICIENT_PERMISSION, message='无权复核')

        app.rechecker = rechecker
        if payload.passed:
            new_status = AdoptionStatus.RECHECK_PASS
            action = '复核通过'
            app.deadline_at = timezone.now() + timedelta(days=1)
        else:
            new_status = AdoptionStatus.RECHECK_REJECT
            action = '复核不通过'
            app.animal.status = AnimalStatus.AVAILABLE
            app.animal.save()

        create_timeline(app, action, new_status, rechecker, payload.remark)
        app.status = new_status
        app.last_action_at = timezone.now()
        app.save()

        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='复核完成',
            data=ApplicationDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.get('/applications/{application_id}/timeline', response=ApiResponse, summary='获取申请时间线')
def get_application_timeline(request, application_id: str):
    try:
        app = AdoptionApplication.objects.prefetch_related('timelines').get(id=application_id)
        timelines = [TimelineSchema.from_orm(t).dict() for t in app.timelines.all()]
        return ApiResponse(code=ErrorCode.SUCCESS, message='成功', data={'timelines': timelines})
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.get('/applications/{application_id}/home-visit', response=ApiResponse, summary='家访审核回看')
def get_home_visit_review(request, application_id: str):
    try:
        app = AdoptionApplication.objects.select_related('home_visit').get(id=application_id)
        if not hasattr(app, 'home_visit'):
            return ApiResponse(code=ErrorCode.HOME_VISIT_NOT_EXISTS, message=ERROR_MESSAGES[ErrorCode.HOME_VISIT_NOT_EXISTS])
        home_visit_data = HomeVisitSchema.from_orm(app.home_visit).dict()
        timelines = [TimelineSchema.from_orm(t).dict() for t in app.timelines.filter(
            status_to__in=[
                AdoptionStatus.HOME_VISIT_SCHEDULED,
                AdoptionStatus.HOME_VISIT_COMPLETED,
                AdoptionStatus.HOME_VISIT_PASS,
                AdoptionStatus.HOME_VISIT_REJECT,
                AdoptionStatus.RECHECK_REQUIRED,
                AdoptionStatus.RECHECK_PASS,
                AdoptionStatus.RECHECK_REJECT
            ]
        )]
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='成功',
            data={
                'home_visit': home_visit_data,
                'timelines': timelines,
                'application': {
                    'id': str(app.id),
                    'applicant_name': app.applicant_name,
                    'animal_name': app.animal.name,
                    'status': app.status,
                    'status_display': app.get_status_display()
                }
            }
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.get('/error-codes', summary='获取错误码列表')
def get_error_codes(request):
    return {
        'code': ErrorCode.SUCCESS,
        'message': '成功',
        'data': {
            str(code): {'code': code, 'message': msg}
            for code, msg in ERROR_MESSAGES.items()
        }
    }


@api.get('/dashboard/stats', summary='获取统计面板数据')
def get_dashboard_stats(request):
    now = timezone.now()
    total = AdoptionApplication.objects.count()
    processing = AdoptionApplication.objects.filter(status__in=[
        AdoptionStatus.SUBMITTED,
        AdoptionStatus.MATERIALS_MISSING,
        AdoptionStatus.MATERIALS_RECEIVED,
        AdoptionStatus.PRE_REVIEW_PASS,
        AdoptionStatus.HOME_VISIT_SCHEDULED,
        AdoptionStatus.RECHECK_REQUIRED
    ]).count()
    materials_missing = AdoptionApplication.objects.filter(status=AdoptionStatus.MATERIALS_MISSING).count()
    timeout = AdoptionApplication.objects.filter(
        deadline_at__lt=now,
        status__in=[
            AdoptionStatus.SUBMITTED,
            AdoptionStatus.MATERIALS_MISSING,
            AdoptionStatus.MATERIALS_RECEIVED,
            AdoptionStatus.PRE_REVIEW_PASS,
            AdoptionStatus.HOME_VISIT_SCHEDULED,
            AdoptionStatus.RECHECK_REQUIRED
        ]
    ).count()
    rejected = AdoptionApplication.objects.filter(status__in=[
        AdoptionStatus.PRE_REVIEW_REJECT,
        AdoptionStatus.HOME_VISIT_REJECT,
        AdoptionStatus.RECHECK_REJECT,
        AdoptionStatus.REJECTED
    ]).count()
    approved = AdoptionApplication.objects.filter(status__in=[
        AdoptionStatus.APPROVED,
        AdoptionStatus.ADOPTION_COMPLETED
    ]).count()

    return ApiResponse(
        code=ErrorCode.SUCCESS,
        message='成功',
        data={
            'total_applications': total,
            'processing': processing,
            'materials_missing': materials_missing,
            'timeout': timeout,
            'rejected': rejected,
            'approved': approved
        }
    )


@api.post('/applications/{application_id}/confirm-materials', response=ApiResponse, summary='提交后直接确认材料')
@transaction.atomic
def confirm_materials_directly(request, application_id: str, payload: ApproveIn):
    try:
        app = AdoptionApplication.objects.select_related('current_handler').get(id=application_id)
        if app.status != AdoptionStatus.SUBMITTED:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法直接确认材料')
        
        handler = app.current_handler
        new_status = AdoptionStatus.MATERIALS_RECEIVED
        action = '直接确认材料齐全'
        
        create_timeline(app, action, new_status, handler, payload.remark)
        app.status = new_status
        app.deadline_at = timezone.now() + timedelta(days=3)
        app.last_action_at = timezone.now()
        app.save()
        
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='材料已确认',
            data=ApplicationFullDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.post('/applications/{application_id}/approve', response=ApiResponse, summary='复核通过后审核通过')
@transaction.atomic
def approve_application(request, application_id: str, payload: ApproveIn):
    try:
        app = AdoptionApplication.objects.select_related('current_handler', 'animal').get(id=application_id)
        if app.status not in [AdoptionStatus.RECHECK_PASS, AdoptionStatus.HOME_VISIT_PASS]:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法审核通过')
        
        approver = app.current_handler
        if approver and approver.role not in [Role.ADOPTION_AUDITOR, Role.ADMIN]:
            return ApiResponse(code=ErrorCode.INSUFFICIENT_PERMISSION, message='无权审核通过')
        
        new_status = AdoptionStatus.APPROVED
        action = '审核通过'
        
        create_timeline(app, action, new_status, approver, payload.remark)
        app.status = new_status
        app.deadline_at = timezone.now() + timedelta(days=7)
        app.last_action_at = timezone.now()
        app.save()
        
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='审核通过',
            data=ApplicationFullDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.post('/applications/{application_id}/complete', response=ApiResponse, summary='确认领养完成')
@transaction.atomic
def complete_adoption(request, application_id: str, payload: CompleteAdoptionIn):
    try:
        app = AdoptionApplication.objects.select_related('current_handler', 'animal').get(id=application_id)
        if app.status != AdoptionStatus.APPROVED:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法确认领养完成')
        
        handler = app.current_handler
        new_status = AdoptionStatus.ADOPTION_COMPLETED
        action = '领养完成'
        
        create_timeline(app, action, new_status, handler, payload.remark)
        app.status = new_status
        app.last_action_at = timezone.now()
        app.deadline_at = None
        app.animal.status = AnimalStatus.ADOPTED
        app.animal.save()
        app.save()
        
        FollowUpRecord.objects.create(
            application=app,
            follow_up_date=datetime.fromisoformat(payload.adoption_date.replace('Z', '+00:00')).date(),
            follow_up_type='other',
            operator=handler,
            animal_health='健康',
            adaptation='领养交接完成',
            problems='无',
            suggestions='请按计划进行后续回访'
        )
        
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='领养已完成',
            data=ApplicationFullDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.get('/applications/{application_id}/follow-ups', response=ApiResponse, summary='获取领养回访记录列表')
def list_follow_ups(request, application_id: str):
    try:
        app = AdoptionApplication.objects.prefetch_related('follow_ups').get(id=application_id)
        follow_ups = [FollowUpSchema.from_orm(f).dict() for f in app.follow_ups.all()]
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='成功',
            data={
                'follow_ups': follow_ups,
                'has_gap': any(getattr(f, 'is_gap', False) for f in app.follow_ups.all())
            }
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.post('/applications/{application_id}/follow-ups', response=ApiResponse, summary='新增领养回访记录')
@transaction.atomic
def create_follow_up(request, application_id: str, payload: CreateFollowUpIn):
    try:
        if payload.idempotency_key:
            cached = check_idempotency(payload.idempotency_key, f'create_follow_up_{application_id}')
            if cached:
                return ApiResponse(code=ErrorCode.SUCCESS, message='成功（幂等）', data=cached)
        
        app = AdoptionApplication.objects.get(id=application_id)
        if app.status not in [AdoptionStatus.APPROVED, AdoptionStatus.ADOPTION_COMPLETED]:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法添加回访记录')
        
        operator = None
        if payload.operator_id:
            operator = Staff.objects.get(id=payload.operator_id)
        
        follow_up_date = datetime.fromisoformat(payload.follow_up_date.replace('Z', '+00:00')).date()
        next_follow_up = None
        if payload.next_follow_up_at:
            next_follow_up = datetime.fromisoformat(payload.next_follow_up_at.replace('Z', '+00:00')).date()
        
        follow_up = FollowUpRecord.objects.create(
            application=app,
            follow_up_date=follow_up_date,
            follow_up_type=payload.follow_up_type,
            operator=operator,
            animal_health=payload.animal_health,
            adaptation=payload.adaptation,
            problems=payload.problems,
            suggestions=payload.suggestions,
            next_follow_up_at=next_follow_up
        )
        
        if payload.is_gap:
            follow_up.is_gap = True
            follow_up.gap_reason = payload.gap_reason
            follow_up.save()
            create_timeline(app, '标记回访断档', app.status, operator, payload.gap_reason)
        
        result = FollowUpSchema.from_orm(follow_up).dict()
        
        if payload.idempotency_key:
            save_idempotency(payload.idempotency_key, f'create_follow_up_{application_id}', result)
        
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='回访记录已创建',
            data=result
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])
    except Staff.DoesNotExist:
        return ApiResponse(code=ErrorCode.STAFF_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.STAFF_NOT_FOUND])


@api.post('/applications/{application_id}/follow-ups/mark-gap', response=ApiResponse, summary='标记回访断档')
@transaction.atomic
def mark_follow_up_gap(request, application_id: str, remark: str = '', follow_up_date: str = ''):
    try:
        app = AdoptionApplication.objects.select_related("current_handler").get(id=application_id)
        
        if app.status not in [AdoptionStatus.APPROVED, AdoptionStatus.ADOPTION_COMPLETED]:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message="当前状态无法标记回访断档")
        
        latest_follow_up = app.follow_ups.order_by('-follow_up_date').first()
        
        # 无回访记录时直接创建断档记录
        
        if latest_follow_up and not latest_follow_up.is_gap:
            latest_follow_up.is_gap = True
            latest_follow_up.gap_reason = remark or '回访断档'
            latest_follow_up.save()
            gap_record = latest_follow_up
        
        create_timeline(app, '标记回访断档', app.status, app.current_handler, remark)
        
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='已标记回访断档',
            data=FollowUpSchema.from_orm(gap_record).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.get('/animals/{animal_id}/medical-records', response=ApiResponse, summary='获取动物医疗记录明细')
def get_animal_medical_records(request, animal_id: str):
    try:
        animal = Animal.objects.prefetch_related('medical_records_list').get(id=animal_id)
        records = [MedicalRecordSchema.from_orm(m).dict() for m in animal.medical_records_list.all()]
        total_cost = sum(m.cost for m in animal.medical_records_list.all())
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='成功',
            data={
                'animal': {
                    'id': str(animal.id),
                    'name': animal.name,
                    'species': animal.species
                },
                'medical_records': records,
                'summary': {
                    'total_cost': float(total_cost),
                    'record_count': len(records)
                }
            }
        )
    except Animal.DoesNotExist:
        return ApiResponse(code=ErrorCode.ANIMAL_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.ANIMAL_NOT_FOUND])


@api.get('/applications/{application_id}/medical-summary', response=ApiResponse, summary='获取申请关联的医疗费用汇总')
def get_application_medical_summary(request, application_id: str):
    try:
        app = AdoptionApplication.objects.select_related('animal').prefetch_related('animal__medical_records_list').get(id=application_id)
        records = app.animal.medical_records_list.all()
        total_cost = sum(m.cost for m in records)
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='成功',
            data={
                'application_id': str(app.id),
                'animal': {
                    'id': str(app.animal.id),
                    'name': app.animal.name,
                    'species': app.animal.species,
                    'foster_family': app.animal.foster_family,
                    'status': app.animal.status,
                    'status_display': app.animal.get_status_display()
                },
                'medical_summary': {
                    'total_cost': float(total_cost),
                    'record_count': records.count(),
                    'records': [MedicalRecordSchema.from_orm(m).dict() for m in records]
                }
            }
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])


@api.get('/applications/{application_id}/full-detail', response=ApiResponse, summary='获取完整申请详情（含动物、寄养、回访、费用）')
def get_application_full_detail(request, application_id: str):
    try:
        app = AdoptionApplication.objects.select_related(
            'animal', 'current_handler', 'pre_reviewer', 'home_visitor', 'rechecker'
        ).prefetch_related(
            'timelines', 'follow_ups', 'animal__medical_records_list', 'animal__rescue_volunteer', 'animal__vet'
        ).get(id=application_id)
        return ApiResponse(
            code=ErrorCode.SUCCESS,
            message='成功',
            data=ApplicationFullDetailSchema.from_orm(app).dict()
        )
    except AdoptionApplication.DoesNotExist:
        return ApiResponse(code=ErrorCode.APPLICATION_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.APPLICATION_NOT_FOUND])
