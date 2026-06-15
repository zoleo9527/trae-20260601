from ninja import NinjaAPI, Schema, ModelSchema
from ninja.security import HttpBearer
from django.contrib.auth import authenticate
from django.http import HttpRequest
from .models import (
    User, PartsRequest, PartsRequestItem, PartsRequestNote,
    CustomerEquipment, PartsInventory, OutboundRecord, OutboundItem, VerificationRecord
)
from typing import List, Optional
from datetime import datetime
import hashlib
import random
import string


class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            user = User.objects.get(username=token)
            return user
        except User.DoesNotExist:
            return None


api = NinjaAPI(
    title='叉车维保配件管理系统',
    description='配件申请与出库核销后端API',
    version='1.0.0',
    auth=AuthBearer(),
)


class UserSchema(ModelSchema):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'phone']


class CustomerEquipmentSchema(ModelSchema):
    class Meta:
        model = CustomerEquipment
        fields = '__all__'


class PartsInventorySchema(ModelSchema):
    class Meta:
        model = PartsInventory
        fields = '__all__'


class PartsRequestItemSchema(ModelSchema):
    part_code: str
    part_name: str
    
    class Meta:
        model = PartsRequestItem
        fields = ['id', 'requested_quantity', 'issued_quantity', 'unit_price']
    
    @staticmethod
    def resolve_part_code(obj):
        return obj.part.part_code
    
    @staticmethod
    def resolve_part_name(obj):
        return obj.part.part_name


class PartsRequestNoteSchema(ModelSchema):
    author_name: str
    note_type_display: str
    
    class Meta:
        model = PartsRequestNote
        fields = ['id', 'note_type', 'content', 'created_at']
    
    @staticmethod
    def resolve_author_name(obj):
        return obj.author.username
    
    @staticmethod
    def resolve_note_type_display(obj):
        return dict(PartsRequestNote.NOTE_TYPE_CHOICES).get(obj.note_type, obj.note_type)


class PartsRequestSchema(ModelSchema):
    equipment_code: str
    customer_name: str
    requester_name: str
    approver_name: Optional[str] = None
    assignee_name: Optional[str] = None
    warehouse_operator_name: Optional[str] = None
    status_display: str
    priority_display: str
    items: List[PartsRequestItemSchema] = []
    notes: List[PartsRequestNoteSchema] = []
    
    class Meta:
        model = PartsRequest
        fields = ['id', 'request_no', 'status', 'priority', 'reason', 'fault_description', 
                       'is_emergency', 'downtime_start', 'created_at', 'updated_at']
    
    @staticmethod
    def resolve_equipment_code(obj):
        return obj.equipment.equipment_code
    
    @staticmethod
    def resolve_customer_name(obj):
        return obj.equipment.customer_name
    
    @staticmethod
    def resolve_requester_name(obj):
        return obj.requester.username
    
    @staticmethod
    def resolve_approver_name(obj):
        return obj.approver.username if obj.approver else None
    
    @staticmethod
    def resolve_assignee_name(obj):
        return obj.assignee.username if obj.assignee else None
    
    @staticmethod
    def resolve_warehouse_operator_name(obj):
        return obj.warehouse_operator.username if obj.warehouse_operator else None
    
    @staticmethod
    def resolve_status_display(obj):
        return dict(PartsRequest.STATUS_CHOICES).get(obj.status, obj.status)
    
    @staticmethod
    def resolve_priority_display(obj):
        return dict(PartsRequest.PRIORITY_CHOICES).get(obj.priority, obj.priority)


class CreateRequestItem(Schema):
    part_code: str
    requested_quantity: int


class CreateRequestSchema(Schema):
    idempotency_key: str
    equipment_code: str
    priority: Optional[str] = 'medium'
    reason: str
    fault_description: Optional[str] = ''
    is_emergency: Optional[bool] = False
    downtime_start: Optional[datetime] = None
    items: List[CreateRequestItem]


class ApproveRequestSchema(Schema):
    approver_username: str
    remark: Optional[str] = ''


class AssignRequestSchema(Schema):
    assignee_username: str
    remark: Optional[str] = ''


class WarehouseCheckSchema(Schema):
    operator_username: str
    items: List[dict]
    remark: Optional[str] = ''


class ShipRequestSchema(Schema):
    operator_username: str
    carrier: Optional[str] = ''
    tracking_no: Optional[str] = ''
    shipping_address: Optional[str] = ''
    remark: Optional[str] = ''


class VerifyRequestSchema(Schema):
    operator_username: str
    actual_used_quantities: dict
    remaining_parts: Optional[str] = ''
    problem_description: Optional[str] = ''
    is_qualified: Optional[bool] = True
    signature: Optional[str] = ''


def generate_request_no():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"PR{timestamp}{random_str}"


def generate_outbound_no():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"OB{timestamp}{random_str}"


def generate_verification_no():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"VF{timestamp}{random_str}"


@api.post('/requests/', response=PartsRequestSchema)
def create_request(request, data: CreateRequestSchema):
    if PartsRequest.objects.filter(idempotency_key=data.idempotency_key).exists():
        return PartsRequest.objects.get(idempotency_key=data.idempotency_key)
    
    equipment = CustomerEquipment.objects.get(equipment_code=data.equipment_code)
    requester = request.auth
    
    parts_request = PartsRequest.objects.create(
        request_no=generate_request_no(),
        equipment=equipment,
        requester=requester,
        priority=data.priority,
        reason=data.reason,
        fault_description=data.fault_description,
        is_emergency=data.is_emergency,
        downtime_start=data.downtime_start,
        idempotency_key=data.idempotency_key,
    )
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=requester,
        note_type='create',
        content=f"创建配件申请单，原因：{data.reason}"
    )
    
    for item_data in data.items:
        part = PartsInventory.objects.get(part_code=item_data.part_code)
        PartsRequestItem.objects.create(
            request=parts_request,
            part=part,
            requested_quantity=item_data.requested_quantity,
        )
    
    return parts_request


@api.get('/requests/', response=List[PartsRequestSchema])
def list_requests(request, status: Optional[str] = None):
    queryset = PartsRequest.objects.prefetch_related('items__part', 'notes__author')
    
    if status:
        queryset = queryset.filter(status=status)
    
    return queryset


@api.get('/requests/{request_id}', response=PartsRequestSchema)
def get_request(request, request_id: int):
    parts_request = PartsRequest.objects.prefetch_related('items__part', 'notes__author').get(id=request_id)
    return parts_request


@api.post('/requests/{request_id}/approve', response=PartsRequestSchema)
def approve_request(request, request_id: int, data: ApproveRequestSchema):
    parts_request = PartsRequest.objects.get(id=request_id)
    
    if parts_request.status != 'pending':
        raise ValueError(f"当前状态为{parts_request.get_status_display()}，无法审核")
    
    approver = User.objects.get(username=data.approver_username)
    if approver.role not in ['manager', 'admin']:
        raise ValueError("只有维保主管或管理员可以审核")
    
    parts_request.status = 'approved'
    parts_request.approver = approver
    parts_request.save()
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=approver,
        note_type='approve',
        content=f"审核通过。{data.remark}" if data.remark else "审核通过"
    )
    
    return parts_request


@api.post('/requests/{request_id}/reject', response=PartsRequestSchema)
def reject_request(request, request_id: int, data: ApproveRequestSchema):
    parts_request = PartsRequest.objects.get(id=request_id)
    
    if parts_request.status != 'pending':
        raise ValueError(f"当前状态为{parts_request.get_status_display()}，无法拒绝")
    
    approver = User.objects.get(username=data.approver_username)
    if approver.role not in ['manager', 'admin']:
        raise ValueError("只有维保主管或管理员可以审核")
    
    parts_request.status = 'rejected'
    parts_request.approver = approver
    parts_request.save()
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=approver,
        note_type='reject',
        content=f"审核拒绝：{data.remark}"
    )
    
    return parts_request


@api.post('/requests/{request_id}/assign', response=PartsRequestSchema)
def assign_request(request, request_id: int, data: AssignRequestSchema):
    parts_request = PartsRequest.objects.get(id=request_id)
    
    if parts_request.status != 'approved':
        raise ValueError(f"当前状态为{parts_request.get_status_display()}，无法分派")
    
    assignee = User.objects.get(username=data.assignee_username)
    if assignee.role not in ['technician', 'warehouse', 'admin']:
        raise ValueError("只能分派给现场技师、仓管或管理员")
    
    parts_request.status = 'assigned'
    parts_request.assignee = assignee
    parts_request.save()
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=request.auth,
        note_type='assign',
        content=f"分派给{assignee.username}。{data.remark}" if data.remark else f"分派给{assignee.username}"
    )
    
    return parts_request


@api.post('/requests/{request_id}/warehouse_check', response=PartsRequestSchema)
def warehouse_check(request, request_id: int, data: WarehouseCheckSchema):
    parts_request = PartsRequest.objects.get(id=request_id)
    
    if parts_request.status != 'assigned':
        raise ValueError(f"当前状态为{parts_request.get_status_display()}，无法仓库确认")
    
    operator = User.objects.get(username=data.operator_username)
    if operator.role not in ['warehouse', 'admin']:
        raise ValueError("只有仓管或管理员可以进行仓库确认")
    
    parts_request.status = 'warehouse_pending'
    parts_request.warehouse_operator = operator
    parts_request.save()
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=operator,
        note_type='warehouse_check',
        content=f"仓库确认完成。{data.remark}" if data.remark else "仓库确认完成"
    )
    
    return parts_request


@api.post('/requests/{request_id}/ship', response=PartsRequestSchema)
def ship_request(request, request_id: int, data: ShipRequestSchema):
    parts_request = PartsRequest.objects.get(id=request_id)
    
    if parts_request.status != 'warehouse_pending':
        raise ValueError(f"当前状态为{parts_request.get_status_display()}，无法出库")
    
    operator = User.objects.get(username=data.operator_username)
    if operator.role not in ['warehouse', 'admin']:
        raise ValueError("只有仓管或管理员可以出库")
    
    outbound = OutboundRecord.objects.create(
        request=parts_request,
        operator=operator,
        outbound_no=generate_outbound_no(),
        carrier=data.carrier,
        tracking_no=data.tracking_no,
        shipping_address=data.shipping_address,
        remark=data.remark,
    )
    
    for item in parts_request.items.all():
        OutboundItem.objects.create(
            outbound=outbound,
            part=item.part,
            quantity=item.requested_quantity,
        )
        
        item.part.quantity -= item.requested_quantity
        item.part.save()
        
        item.issued_quantity = item.requested_quantity
        item.save()
    
    parts_request.status = 'shipped'
    parts_request.save()
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=operator,
        note_type='ship',
        content=f"已出库，运单号：{data.tracking_no}。{data.remark}" if data.remark else f"已出库，运单号：{data.tracking_no}"
    )
    
    return parts_request


@api.post('/requests/{request_id}/verify', response=PartsRequestSchema)
def verify_request(request, request_id: int, data: VerifyRequestSchema):
    parts_request = PartsRequest.objects.get(id=request_id)
    
    if parts_request.status != 'shipped':
        raise ValueError(f"当前状态为{parts_request.get_status_display()}，无法核销")
    
    operator = User.objects.get(username=data.operator_username)
    if operator.role not in ['technician', 'manager', 'admin']:
        raise ValueError("只有现场技师、维保主管或管理员可以核销")
    
    VerificationRecord.objects.create(
        request=parts_request,
        operator=operator,
        verification_no=generate_verification_no(),
        actual_used_quantities=data.actual_used_quantities,
        remaining_parts=data.remaining_parts,
        problem_description=data.problem_description,
        is_qualified=data.is_qualified,
        signature=data.signature,
    )
    
    parts_request.status = 'verified'
    parts_request.save()
    
    content = f"核销完成，合格：{data.is_qualified}"
    if data.problem_description:
        content += f"，问题：{data.problem_description}"
    if data.remark:
        content += f"。{data.remark}"
    
    PartsRequestNote.objects.create(
        request=parts_request,
        author=operator,
        note_type='verify',
        content=content
    )
    
    return parts_request


@api.get('/equipment/', response=List[CustomerEquipmentSchema])
def list_equipment(request):
    return CustomerEquipment.objects.all()


@api.get('/inventory/', response=List[PartsInventorySchema])
def list_inventory(request):
    return PartsInventory.objects.all()


@api.get('/users/', response=List[UserSchema])
def list_users(request, role: Optional[str] = None):
    queryset = User.objects.all()
    if role:
        queryset = queryset.filter(role=role)
    return queryset
