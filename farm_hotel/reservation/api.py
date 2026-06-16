from django.http import HttpRequest
from django.contrib.auth import authenticate
from django.db.models import Q
from ninja import NinjaAPI, Schema
from ninja.security import HttpBasicAuth, HttpBearer
from datetime import date, datetime
from decimal import Decimal
from .models import (
    Staff, Role, DiningTable, MenuItem, MenuCategory,
    Reservation, ReservationMenu, FlowRecord, Notification
)

api = NinjaAPI()

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            staff = Staff.objects.get(username=token)
            if staff.is_active:
                return staff
        except Staff.DoesNotExist:
            return None

class LoginSchema(Schema):
    username: str
    password: str

class TokenSchema(Schema):
    token: str
    username: str
    name: str
    role: str

@api.post("/login", response=TokenSchema)
def login(request, data: LoginSchema):
    staff = authenticate(username=data.username, password=data.password)
    if staff and staff.is_active:
        return {"token": staff.username, "username": staff.username, "name": staff.name, "role": staff.role.name}
    return api.create_response(request, {"detail": "Invalid credentials"}, status=401)

class DiningTableSchema(Schema):
    id: int
    table_number: str
    capacity: int
    table_type: str
    table_type_display: str
    status: bool

class LastRejectInfoSchema(Schema):
    operator_name: str = None
    operator_role: str = None
    remark: str = None
    created_at: datetime = None

class ReservationSchema(Schema):
    id: int
    customer_name: str
    customer_phone: str
    table: DiningTableSchema
    date: date
    time_slot: str
    guest_count: int
    status: str
    status_display: str
    created_at: datetime
    updated_at: datetime
    last_reject_info: LastRejectInfoSchema = None

class MenuItemSchema(Schema):
    id: int
    name: str
    price: Decimal
    description: str
    category_name: str

class ReservationMenuSchema(Schema):
    id: int
    menu_item: MenuItemSchema
    quantity: int
    special_request: str

class FlowRecordSchema(Schema):
    id: int
    action: str
    action_display: str
    operator_name: str
    operator_role: str
    remark: str
    created_at: datetime

class ReservationDetailSchema(Schema):
    reservation: ReservationSchema
    menus: list[ReservationMenuSchema]
    flow_records: list[FlowRecordSchema]
    last_reject_info: LastRejectInfoSchema = None

class CreateReservationSchema(Schema):
    customer_name: str
    customer_phone: str
    table_id: int
    date: date
    time_slot: str
    guest_count: int

class UpdateReservationSchema(Schema):
    customer_name: str = None
    customer_phone: str = None
    table_id: int = None
    date: date = None
    time_slot: str = None
    guest_count: int = None

class AddMenuSchema(Schema):
    menu_item_id: int
    quantity: int = 1
    special_request: str = ""

class ProcessMenuSchema(Schema):
    action: str
    remark: str = ""

class NotificationSchema(Schema):
    id: int
    type: str
    type_display: str
    message: str
    is_read: bool
    created_at: datetime
    reservation_id: int

def get_last_reject_info(reservation):
    last_reject = FlowRecord.objects.filter(
        reservation=reservation,
        action__in=['reject_menu']
    ).order_by('-created_at').first()
    
    if last_reject:
        return {
            "operator_name": last_reject.operator.name,
            "operator_role": last_reject.operator.role.get_name_display(),
            "remark": last_reject.remark,
            "created_at": last_reject.created_at
        }
    return None

@api.get("/reservations", response=list[ReservationSchema], auth=AuthBearer())
def list_reservations(request, status: str = None, date: date = None, table_type: str = None, page: int = 1, page_size: int = 10):
    queryset = Reservation.objects.select_related('table').order_by('-created_at')
    
    if status:
        queryset = queryset.filter(status=status)
    if date:
        queryset = queryset.filter(date=date)
    if table_type:
        queryset = queryset.filter(table__table_type=table_type)
    
    start = (page - 1) * page_size
    end = start + page_size
    reservations = queryset[start:end]
    
    result = []
    for r in reservations:
        last_reject = get_last_reject_info(r)
        result.append({
            "id": r.id,
            "customer_name": r.customer_name,
            "customer_phone": r.customer_phone,
            "table": {
                "id": r.table.id,
                "table_number": r.table.table_number,
                "capacity": r.table.capacity,
                "table_type": r.table.table_type,
                "table_type_display": r.table.get_table_type_display(),
                "status": r.table.status
            },
            "date": r.date,
            "time_slot": r.time_slot,
            "guest_count": r.guest_count,
            "status": r.status,
            "status_display": r.get_status_display(),
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "last_reject_info": last_reject
        })
    return result

@api.get("/reservations/{reservation_id}", response=ReservationDetailSchema, auth=AuthBearer())
def get_reservation(request, reservation_id: int):
    try:
        reservation = Reservation.objects.select_related('table').get(id=reservation_id)
        menus = ReservationMenu.objects.filter(reservation=reservation).select_related('menu_item__category')
        flow_records = FlowRecord.objects.filter(reservation=reservation).select_related('operator__role').order_by('created_at')
        last_reject = get_last_reject_info(reservation)
        
        return {
            "reservation": {
                "id": reservation.id,
                "customer_name": reservation.customer_name,
                "customer_phone": reservation.customer_phone,
                "table": {
                    "id": reservation.table.id,
                    "table_number": reservation.table.table_number,
                    "capacity": reservation.table.capacity,
                    "table_type": reservation.table.table_type,
                    "table_type_display": reservation.table.get_table_type_display(),
                    "status": reservation.table.status
                },
                "date": reservation.date,
                "time_slot": reservation.time_slot,
                "guest_count": reservation.guest_count,
                "status": reservation.status,
                "status_display": reservation.get_status_display(),
                "created_at": reservation.created_at,
                "updated_at": reservation.updated_at,
                "last_reject_info": last_reject
            },
            "menus": [{
                "id": m.id,
                "menu_item": {
                    "id": m.menu_item.id,
                    "name": m.menu_item.name,
                    "price": m.menu_item.price,
                    "description": m.menu_item.description,
                    "category_name": m.menu_item.category.name
                },
                "quantity": m.quantity,
                "special_request": m.special_request
            } for m in menus],
            "flow_records": [{
                "id": f.id,
                "action": f.action,
                "action_display": f.get_action_display(),
                "operator_name": f.operator.name,
                "operator_role": f.operator.role.get_name_display(),
                "remark": f.remark,
                "created_at": f.created_at
            } for f in flow_records],
            "last_reject_info": last_reject
        }
    except Reservation.DoesNotExist:
        return api.create_response(request, {"detail": "Reservation not found"}, status=404)

@api.post("/reservations", response=ReservationSchema, auth=AuthBearer())
def create_reservation(request, data: CreateReservationSchema):
    try:
        table = DiningTable.objects.get(id=data.table_id)
    except DiningTable.DoesNotExist:
        return api.create_response(request, {"detail": "Table not found"}, status=404)
    
    reservation = Reservation.objects.create(
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        table=table,
        date=data.date,
        time_slot=data.time_slot,
        guest_count=data.guest_count,
        created_by=request.auth
    )
    
    FlowRecord.objects.create(
        reservation=reservation,
        action='create',
        operator=request.auth,
        remark=f"创建预订: {data.customer_name} {data.time_slot}"
    )
    
    return {
        "id": reservation.id,
        "customer_name": reservation.customer_name,
        "customer_phone": reservation.customer_phone,
        "table": {
            "id": reservation.table.id,
            "table_number": reservation.table.table_number,
            "capacity": reservation.table.capacity,
            "table_type": reservation.table.table_type,
            "table_type_display": reservation.table.get_table_type_display(),
            "status": reservation.table.status
        },
        "date": reservation.date,
        "time_slot": reservation.time_slot,
        "guest_count": reservation.guest_count,
        "status": reservation.status,
        "status_display": reservation.get_status_display(),
        "created_at": reservation.created_at,
        "updated_at": reservation.updated_at
    }

@api.put("/reservations/{reservation_id}", response=ReservationSchema, auth=AuthBearer())
def update_reservation(request, reservation_id: int, data: UpdateReservationSchema):
    try:
        reservation = Reservation.objects.select_related('table').get(id=reservation_id)
    except Reservation.DoesNotExist:
        return api.create_response(request, {"detail": "Reservation not found"}, status=404)
    
    if data.customer_name:
        reservation.customer_name = data.customer_name
    if data.customer_phone:
        reservation.customer_phone = data.customer_phone
    if data.table_id:
        try:
            table = DiningTable.objects.get(id=data.table_id)
            reservation.table = table
        except DiningTable.DoesNotExist:
            return api.create_response(request, {"detail": "Table not found"}, status=404)
    if data.date:
        reservation.date = data.date
    if data.time_slot:
        reservation.time_slot = data.time_slot
    if data.guest_count:
        reservation.guest_count = data.guest_count
    
    reservation.save()
    
    FlowRecord.objects.create(
        reservation=reservation,
        action='supplement',
        operator=request.auth,
        remark="补录预订信息"
    )
    
    return {
        "id": reservation.id,
        "customer_name": reservation.customer_name,
        "customer_phone": reservation.customer_phone,
        "table": {
            "id": reservation.table.id,
            "table_number": reservation.table.table_number,
            "capacity": reservation.table.capacity,
            "table_type": reservation.table.table_type,
            "table_type_display": reservation.table.get_table_type_display(),
            "status": reservation.table.status
        },
        "date": reservation.date,
        "time_slot": reservation.time_slot,
        "guest_count": reservation.guest_count,
        "status": reservation.status,
        "status_display": reservation.get_status_display(),
        "created_at": reservation.created_at,
        "updated_at": reservation.updated_at
    }

@api.post("/reservations/{reservation_id}/confirm", response=ReservationSchema, auth=AuthBearer())
def confirm_reservation(request, reservation_id: int):
    try:
        reservation = Reservation.objects.select_related('table').get(id=reservation_id)
    except Reservation.DoesNotExist:
        return api.create_response(request, {"detail": "Reservation not found"}, status=404)
    
    if reservation.status != 'pending':
        return api.create_response(request, {"detail": "Reservation is not pending"}, status=400)
    
    reservation.status = 'confirmed'
    reservation.save()
    
    FlowRecord.objects.create(
        reservation=reservation,
        action='confirm',
        operator=request.auth,
        remark="确认预订"
    )
    
    return {
        "id": reservation.id,
        "customer_name": reservation.customer_name,
        "customer_phone": reservation.customer_phone,
        "table": {
            "id": reservation.table.id,
            "table_number": reservation.table.table_number,
            "capacity": reservation.table.capacity,
            "table_type": reservation.table.table_type,
            "table_type_display": reservation.table.get_table_type_display(),
            "status": reservation.table.status
        },
        "date": reservation.date,
        "time_slot": reservation.time_slot,
        "guest_count": reservation.guest_count,
        "status": reservation.status,
        "status_display": reservation.get_status_display(),
        "created_at": reservation.created_at,
        "updated_at": reservation.updated_at
    }

@api.post("/reservations/{reservation_id}/reject", response=ReservationSchema, auth=AuthBearer())
def reject_reservation(request, reservation_id: int, remark: str = ""):
    try:
        reservation = Reservation.objects.select_related('table').get(id=reservation_id)
    except Reservation.DoesNotExist:
        return api.create_response(request, {"detail": "Reservation not found"}, status=404)
    
    if reservation.status not in ['pending', 'confirmed']:
        return api.create_response(request, {"detail": "Cannot reject this reservation"}, status=400)
    
    reservation.status = 'rejected'
    reservation.save()
    
    FlowRecord.objects.create(
        reservation=reservation,
        action='reject',
        operator=request.auth,
        remark=remark or "驳回预订"
    )
    
    return {
        "id": reservation.id,
        "customer_name": reservation.customer_name,
        "customer_phone": reservation.customer_phone,
        "table": {
            "id": reservation.table.id,
            "table_number": reservation.table.table_number,
            "capacity": reservation.table.capacity,
            "table_type": reservation.table.table_type,
            "table_type_display": reservation.table.get_table_type_display(),
            "status": reservation.table.status
        },
        "date": reservation.date,
        "time_slot": reservation.time_slot,
        "guest_count": reservation.guest_count,
        "status": reservation.status,
        "status_display": reservation.get_status_display(),
        "created_at": reservation.created_at,
        "updated_at": reservation.updated_at
    }

@api.post("/reservations/{reservation_id}/menus", auth=AuthBearer())
def add_menu(request, reservation_id: int, data: AddMenuSchema):
    try:
        reservation = Reservation.objects.get(id=reservation_id)
    except Reservation.DoesNotExist:
        return api.create_response(request, {"detail": "Reservation not found"}, status=404)
    
    try:
        menu_item = MenuItem.objects.get(id=data.menu_item_id)
    except MenuItem.DoesNotExist:
        return api.create_response(request, {"detail": "Menu item not found"}, status=404)
    
    allowed_statuses = ['confirmed', 'menu_submitted', 'menu_rejected', 'menu_resubmitted']
    if reservation.status not in allowed_statuses:
        return api.create_response(request, {"detail": "Cannot add menu for this reservation status"}, status=400)
    
    existing_menu = ReservationMenu.objects.filter(reservation=reservation, menu_item=menu_item).first()
    if existing_menu:
        existing_menu.quantity += data.quantity
        if data.special_request:
            existing_menu.special_request = data.special_request
        existing_menu.save()
    else:
        ReservationMenu.objects.create(
            reservation=reservation,
            menu_item=menu_item,
            quantity=data.quantity,
            special_request=data.special_request
        )
    
    has_menu = ReservationMenu.objects.filter(reservation=reservation).exists()
    if has_menu:
        if reservation.status == 'confirmed':
            reservation.status = 'menu_submitted'
            reservation.save()
            FlowRecord.objects.create(
                reservation=reservation,
                action='submit_menu',
                operator=request.auth,
                remark="提交菜单"
            )
        elif reservation.status == 'menu_rejected':
            reservation.status = 'menu_resubmitted'
            reservation.save()
            FlowRecord.objects.create(
                reservation=reservation,
                action='submit_menu',
                operator=request.auth,
                remark="重新提交菜单"
            )
    
    return {"detail": "Menu added successfully"}

@api.delete("/reservations/{reservation_id}/menus/{menu_id}", auth=AuthBearer())
def remove_menu(request, reservation_id: int, menu_id: int):
    try:
        menu = ReservationMenu.objects.get(id=menu_id, reservation_id=reservation_id)
        menu.delete()
        return {"detail": "Menu removed successfully"}
    except ReservationMenu.DoesNotExist:
        return api.create_response(request, {"detail": "Menu not found"}, status=404)

@api.post("/reservations/{reservation_id}/menu/process", auth=AuthBearer())
def process_menu(request, reservation_id: int, data: ProcessMenuSchema):
    try:
        reservation = Reservation.objects.select_related('table').get(id=reservation_id)
    except Reservation.DoesNotExist:
        return api.create_response(request, {"detail": "Reservation not found"}, status=404)
    
    if data.action == 'approve':
        allowed_statuses = ['menu_submitted', 'menu_resubmitted']
        if reservation.status not in allowed_statuses:
            return api.create_response(request, {"detail": "Cannot approve menu for this status"}, status=400)
        
        has_menu = ReservationMenu.objects.filter(reservation=reservation).exists()
        if not has_menu:
            return api.create_response(request, {"detail": "No menu items added"}, status=400)
        
        reservation.status = 'menu_confirmed'
        reservation.save()
        
        FlowRecord.objects.create(
            reservation=reservation,
            action='approve_menu',
            operator=request.auth,
            remark=data.remark or "确认菜单"
        )
        
        chefs = Staff.objects.filter(role__name='chef')
        for chef in chefs:
            Notification.objects.create(
                staff=chef,
                reservation=reservation,
                type='pending_menu',
                message=f"新菜单待处理: {reservation.customer_name} {reservation.date} {reservation.time_slot}"
            )
        
    elif data.action == 'reject':
        allowed_statuses = ['menu_submitted', 'menu_resubmitted']
        if reservation.status not in allowed_statuses:
            return api.create_response(request, {"detail": "Cannot reject menu for this status"}, status=400)
        
        reservation.status = 'menu_rejected'
        reservation.save()
        
        FlowRecord.objects.create(
            reservation=reservation,
            action='reject_menu',
            operator=request.auth,
            remark=data.remark or "驳回菜单"
        )
        
        waiters = Staff.objects.filter(role__name='waiter')
        for waiter in waiters:
            Notification.objects.create(
                staff=waiter,
                reservation=reservation,
                type='rejected_menu',
                message=f"菜单被驳回: {reservation.customer_name} - {data.remark}"
            )
    
    else:
        return api.create_response(request, {"detail": "Invalid action"}, status=400)
    
    return {"detail": "Menu processed successfully"}

@api.get("/notifications", response=list[NotificationSchema], auth=AuthBearer())
def get_notifications(request):
    notifications = Notification.objects.filter(
        staff=request.auth
    ).order_by('-created_at')
    
    return [{
        "id": n.id,
        "type": n.type,
        "type_display": n.get_type_display(),
        "message": n.message,
        "is_read": n.is_read,
        "created_at": n.created_at,
        "reservation_id": n.reservation.id
    } for n in notifications]

@api.put("/notifications/{notification_id}/read", auth=AuthBearer())
def mark_notification_read(request, notification_id: int):
    try:
        notification = Notification.objects.get(id=notification_id, staff=request.auth)
        notification.is_read = True
        notification.save()
        return {"detail": "Notification marked as read"}
    except Notification.DoesNotExist:
        return api.create_response(request, {"detail": "Notification not found"}, status=404)

@api.get("/menu", response=list[MenuItemSchema], auth=AuthBearer())
def get_menu(request, category: str = None):
    queryset = MenuItem.objects.select_related('category').filter(available=True)
    
    if category:
        queryset = queryset.filter(category__name=category)
    
    return [{
        "id": m.id,
        "name": m.name,
        "price": m.price,
        "description": m.description,
        "category_name": m.category.name
    } for m in queryset]

@api.get("/tables", response=list[DiningTableSchema], auth=AuthBearer())
def get_tables(request, table_type: str = None):
    queryset = DiningTable.objects.all()
    
    if table_type:
        queryset = queryset.filter(table_type=table_type)
    
    return [{
        "id": t.id,
        "table_number": t.table_number,
        "capacity": t.capacity,
        "table_type": t.table_type,
        "table_type_display": t.get_table_type_display(),
        "status": t.status
    } for t in queryset]

@api.get("/dashboard", auth=AuthBearer())
def get_dashboard(request):
    today = date.today()
    role_name = request.auth.role.name
    
    pending_count = Reservation.objects.filter(status='pending').count()
    confirmed_count = Reservation.objects.filter(status='confirmed').count()
    menu_submitted_count = Reservation.objects.filter(status='menu_submitted').count()
    menu_rejected_count = Reservation.objects.filter(status='menu_rejected').count()
    menu_resubmitted_count = Reservation.objects.filter(status='menu_resubmitted').count()
    menu_confirmed_count = Reservation.objects.filter(status='menu_confirmed').count()
    today_reservations = Reservation.objects.filter(date=today).count()
    
    pending_notifications = Notification.objects.filter(staff=request.auth, is_read=False).count()
    
    if role_name == 'boss':
        return {
            "pending_count": pending_count,
            "confirmed_count": confirmed_count,
            "menu_submitted_count": menu_submitted_count,
            "menu_rejected_count": menu_rejected_count,
            "menu_resubmitted_count": menu_resubmitted_count,
            "menu_confirmed_count": menu_confirmed_count,
            "today_reservations": today_reservations,
            "pending_notifications": pending_notifications,
            "role": role_name,
            "role_display": request.auth.role.get_name_display(),
            "pending_actions": [
                {"type": "pending_reservation", "count": pending_count, "label": "待确认预订"},
                {"type": "pending_menu", "count": menu_submitted_count + menu_resubmitted_count, "label": "待确认菜单"}
            ]
        }
    
    elif role_name == 'chef':
        return {
            "pending_count": pending_count,
            "confirmed_count": confirmed_count,
            "menu_submitted_count": menu_submitted_count,
            "menu_rejected_count": menu_rejected_count,
            "menu_resubmitted_count": menu_resubmitted_count,
            "menu_confirmed_count": menu_confirmed_count,
            "today_reservations": today_reservations,
            "pending_notifications": pending_notifications,
            "role": role_name,
            "role_display": request.auth.role.get_name_display(),
            "pending_actions": [
                {"type": "pending_menu", "count": menu_submitted_count + menu_resubmitted_count, "label": "待确认菜单"}
            ]
        }
    
    elif role_name == 'housekeeper':
        return {
            "pending_count": pending_count,
            "confirmed_count": confirmed_count,
            "menu_confirmed_count": menu_confirmed_count,
            "today_reservations": today_reservations,
            "pending_notifications": pending_notifications,
            "role": role_name,
            "role_display": request.auth.role.get_name_display(),
            "pending_actions": [
                {"type": "cleaning_task", "count": today_reservations, "label": "今日客房清洁"}
            ]
        }
    
    elif role_name == 'waiter':
        return {
            "pending_count": pending_count,
            "confirmed_count": confirmed_count,
            "menu_submitted_count": menu_submitted_count,
            "menu_rejected_count": menu_rejected_count,
            "menu_resubmitted_count": menu_resubmitted_count,
            "menu_confirmed_count": menu_confirmed_count,
            "today_reservations": today_reservations,
            "pending_notifications": pending_notifications,
            "role": role_name,
            "role_display": request.auth.role.get_name_display(),
            "pending_actions": [
                {"type": "rejected_menu", "count": menu_rejected_count, "label": "菜单驳回待补录"}
            ]
        }
    
    else:
        return {
            "pending_count": pending_count,
            "confirmed_count": confirmed_count,
            "menu_confirmed_count": menu_confirmed_count,
            "today_reservations": today_reservations,
            "pending_notifications": pending_notifications,
            "role": role_name,
            "role_display": request.auth.role.get_name_display()
        }
