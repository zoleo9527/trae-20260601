import os
import django
import random
import string
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maintenance.settings')
django.setup()

from parts.models import (
    User, CustomerEquipment, PartsInventory, PartsRequest,
    PartsRequestItem, PartsRequestNote, OutboundRecord, OutboundItem, VerificationRecord
)


def generate_random_id(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_users():
    users = [
        {'username': 'admin', 'role': 'admin', 'phone': '13800138000'},
        {'username': 'manager', 'role': 'manager', 'phone': '13800138001'},
        {'username': 'technician', 'role': 'technician', 'phone': '13800138002'},
        {'username': 'warehouse', 'role': 'warehouse', 'phone': '13800138003'},
        {'username': 'technician2', 'role': 'technician', 'phone': '13800138004'},
    ]
    
    for user_data in users:
        if not User.objects.filter(username=user_data['username']).exists():
            User.objects.create_user(
                username=user_data['username'],
                password='password123',
                role=user_data['role'],
                phone=user_data['phone']
            )
            print(f"Created user: {user_data['username']}")


def create_equipment():
    equipment_list = [
        {
            'equipment_code': 'FD30-001',
            'customer_name': '上海顺丰物流',
            'customer_contact': '王经理',
            'customer_phone': '13900139001',
            'equipment_model': '合力FD30',
            'location': '上海市闵行区物流园A区',
            'last_maintenance_date': datetime(2024, 1, 15).date(),
            'next_maintenance_date': datetime(2024, 4, 15).date(),
            'status': 'normal'
        },
        {
            'equipment_code': 'FD30-002',
            'customer_name': '上海顺丰物流',
            'customer_contact': '王经理',
            'customer_phone': '13900139001',
            'equipment_model': '合力FD30',
            'location': '上海市闵行区物流园B区',
            'last_maintenance_date': datetime(2023, 11, 20).date(),
            'next_maintenance_date': datetime(2024, 2, 20).date(),
            'status': 'downtime'
        },
        {
            'equipment_code': 'TCM25-001',
            'customer_name': '京东仓储',
            'customer_contact': '李主管',
            'customer_phone': '13900139002',
            'equipment_model': 'TCM FD25',
            'location': '上海市浦东新区仓储中心',
            'last_maintenance_date': datetime(2024, 2, 10).date(),
            'next_maintenance_date': datetime(2024, 5, 10).date(),
            'status': 'normal'
        },
        {
            'equipment_code': 'KOMATSU-001',
            'customer_name': '菜鸟网络',
            'customer_contact': '张工',
            'customer_phone': '13900139003',
            'equipment_model': '小松FG30',
            'location': '杭州市余杭区物流基地',
            'last_maintenance_date': datetime(2024, 1, 5).date(),
            'next_maintenance_date': datetime(2024, 4, 5).date(),
            'status': 'warning'
        },
        {
            'equipment_code': 'KOMATSU-002',
            'customer_name': '菜鸟网络',
            'customer_contact': '张工',
            'customer_phone': '13900139003',
            'equipment_model': '小松FG30',
            'location': '杭州市余杭区物流基地',
            'last_maintenance_date': datetime(2023, 12, 1).date(),
            'next_maintenance_date': datetime(2024, 3, 1).date(),
            'status': 'downtime'
        },
    ]
    
    for eq in equipment_list:
        if not CustomerEquipment.objects.filter(equipment_code=eq['equipment_code']).exists():
            CustomerEquipment.objects.create(**eq)
            print(f"Created equipment: {eq['equipment_code']}")


def create_inventory():
    inventory_list = [
        {'part_code': 'P001', 'part_name': '液压油滤芯', 'specification': 'HF6301', 'unit': '个', 'quantity': 50, 'safety_stock': 10, 'location': 'A区-01货架', 'supplier': '杭州液压配件公司'},
        {'part_code': 'P002', 'part_name': '空气滤芯', 'specification': 'AF25543', 'unit': '个', 'quantity': 30, 'safety_stock': 8, 'location': 'A区-02货架', 'supplier': '上海滤清器厂'},
        {'part_code': 'P003', 'part_name': '机油滤芯', 'specification': 'LF3349', 'unit': '个', 'quantity': 40, 'safety_stock': 10, 'location': 'A区-03货架', 'supplier': '北京机油配件公司'},
        {'part_code': 'P004', 'part_name': '刹车片', 'specification': '适用于合力FD30', 'unit': '副', 'quantity': 20, 'safety_stock': 5, 'location': 'B区-01货架', 'supplier': '广州制动配件厂'},
        {'part_code': 'P005', 'part_name': '驱动轮轮胎', 'specification': '6.50-10', 'unit': '个', 'quantity': 15, 'safety_stock': 3, 'location': 'B区-02货架', 'supplier': '厦门轮胎公司'},
        {'part_code': 'P006', 'part_name': '转向油缸油封', 'specification': '35*52*8', 'unit': '个', 'quantity': 25, 'safety_stock': 5, 'location': 'C区-01货架', 'supplier': '宁波密封件厂'},
        {'part_code': 'P007', 'part_name': '起升链条', 'specification': 'BL634 10节', 'unit': '条', 'quantity': 10, 'safety_stock': 2, 'location': 'C区-02货架', 'supplier': '江苏链条厂'},
        {'part_code': 'P008', 'part_name': '蓄电池', 'specification': '48V 40AH', 'unit': '组', 'quantity': 8, 'safety_stock': 2, 'location': 'D区-01货架', 'supplier': '上海蓄电池公司'},
    ]
    
    for item in inventory_list:
        if not PartsInventory.objects.filter(part_code=item['part_code']).exists():
            PartsInventory.objects.create(**item)
            print(f"Created inventory: {item['part_code']}")


def create_sample_requests():
    admin = User.objects.get(username='admin')
    manager = User.objects.get(username='manager')
    technician = User.objects.get(username='technician')
    warehouse = User.objects.get(username='warehouse')
    
    equipment1 = CustomerEquipment.objects.get(equipment_code='FD30-002')
    equipment2 = CustomerEquipment.objects.get(equipment_code='KOMATSU-002')
    equipment3 = CustomerEquipment.objects.get(equipment_code='FD30-001')
    
    part_brake = PartsInventory.objects.get(part_code='P004')
    part_seal = PartsInventory.objects.get(part_code='P006')
    part_hydraulic_filter = PartsInventory.objects.get(part_code='P001')
    part_air_filter = PartsInventory.objects.get(part_code='P002')
    part_oil_filter = PartsInventory.objects.get(part_code='P003')
    
    sample_request1 = PartsRequest.objects.create(
        request_no=f"PR{datetime.now().strftime('%Y%m%d')}001",
        equipment=equipment1,
        requester=technician,
        approver=manager,
        assignee=warehouse,
        warehouse_operator=warehouse,
        status='verified',
        priority='urgent',
        reason='客户现场叉车制动失灵，紧急更换刹车片',
        fault_description='叉车行驶中刹车踏板下沉，制动距离明显变长，已影响正常作业，客户要求紧急处理',
        is_emergency=True,
        downtime_start=datetime(2024, 3, 10, 8, 30),
        idempotency_key=generate_random_id(64)
    )
    
    PartsRequestItem.objects.create(request=sample_request1, part=part_brake, requested_quantity=2, issued_quantity=2)
    PartsRequestItem.objects.create(request=sample_request1, part=part_seal, requested_quantity=1, issued_quantity=1)
    
    PartsRequestNote.objects.create(request=sample_request1, author=technician, note_type='create', content='客户反馈叉车刹车失灵，已确认故障，需要紧急更换刹车片和油封', created_at=datetime(2024, 3, 10, 8, 35))
    PartsRequestNote.objects.create(request=sample_request1, author=manager, note_type='approve', content='紧急审批通过，仓库优先处理', created_at=datetime(2024, 3, 10, 8, 40))
    PartsRequestNote.objects.create(request=sample_request1, author=manager, note_type='assign', content='分派给仓管张三处理出库', created_at=datetime(2024, 3, 10, 8, 42))
    PartsRequestNote.objects.create(request=sample_request1, author=warehouse, note_type='warehouse_check', content='配件库存充足，已备好待出库', created_at=datetime(2024, 3, 10, 9, 0))
    PartsRequestNote.objects.create(request=sample_request1, author=warehouse, note_type='ship', content='已出库，快递单号SF1234567890，预计当日送达', created_at=datetime(2024, 3, 10, 9, 30))
    PartsRequestNote.objects.create(request=sample_request1, author=technician, note_type='verify', content='核销完成，刹车片已更换，制动恢复正常。客户确认签字', created_at=datetime(2024, 3, 10, 14, 0))
    
    outbound1 = OutboundRecord.objects.create(
        request=sample_request1,
        operator=warehouse,
        outbound_no=f"OB{datetime.now().strftime('%Y%m%d')}001",
        carrier='顺丰速运',
        tracking_no='SF1234567890',
        shipping_address='上海市闵行区物流园B区',
        remark='紧急配件，优先派送'
    )
    OutboundItem.objects.create(outbound=outbound1, part=part_brake, quantity=2, batch_no='20240301', expiry_date=datetime(2026, 3, 1).date())
    OutboundItem.objects.create(outbound=outbound1, part=part_seal, quantity=1, batch_no='20240215', expiry_date=datetime(2026, 2, 15).date())
    
    VerificationRecord.objects.create(
        request=sample_request1,
        operator=technician,
        verification_no=f"VF{datetime.now().strftime('%Y%m%d')}001",
        actual_used_quantities={'P004': 2, 'P006': 1},
        remaining_parts='无剩余配件',
        problem_description='',
        is_qualified=True,
        signature='王经理'
    )
    
    print(f"Created sample request 1: {sample_request1.request_no}")
    
    sample_request2 = PartsRequest.objects.create(
        request_no=f"PR{datetime.now().strftime('%Y%m%d')}002",
        equipment=equipment2,
        requester=technician,
        approver=manager,
        assignee=warehouse,
        warehouse_operator=warehouse,
        status='shipped',
        priority='high',
        reason='叉车液压系统漏油，需要更换密封件',
        fault_description='液压油缸漏油严重，已影响起升功能，客户现场停机等待维修',
        is_emergency=True,
        downtime_start=datetime(2024, 3, 11, 10, 0),
        idempotency_key=generate_random_id(64)
    )
    
    PartsRequestItem.objects.create(request=sample_request2, part=part_seal, requested_quantity=2, issued_quantity=2)
    PartsRequestItem.objects.create(request=sample_request2, part=part_hydraulic_filter, requested_quantity=1, issued_quantity=1)
    
    PartsRequestNote.objects.create(request=sample_request2, author=technician, note_type='create', content='杭州菜鸟基地叉车液压系统漏油，需要紧急处理', created_at=datetime(2024, 3, 11, 10, 5))
    PartsRequestNote.objects.create(request=sample_request2, author=manager, note_type='approve', content='审批通过，安排出库', created_at=datetime(2024, 3, 11, 10, 15))
    PartsRequestNote.objects.create(request=sample_request2, author=manager, note_type='assign', content='分派仓管处理', created_at=datetime(2024, 3, 11, 10, 18))
    PartsRequestNote.objects.create(request=sample_request2, author=warehouse, note_type='warehouse_check', content='油封库存充足，滤芯需要从B仓调拨', created_at=datetime(2024, 3, 11, 11, 0))
    PartsRequestNote.objects.create(request=sample_request2, author=warehouse, note_type='ship', content='已出库，德邦快递DB9876543210', created_at=datetime(2024, 3, 11, 14, 0))
    
    outbound2 = OutboundRecord.objects.create(
        request=sample_request2,
        operator=warehouse,
        outbound_no=f"OB{datetime.now().strftime('%Y%m%d')}002",
        carrier='德邦快递',
        tracking_no='DB9876543210',
        shipping_address='杭州市余杭区物流基地',
        remark=''
    )
    OutboundItem.objects.create(outbound=outbound2, part=part_seal, quantity=2, batch_no='20240305', expiry_date=datetime(2026, 3, 5).date())
    OutboundItem.objects.create(outbound=outbound2, part=part_hydraulic_filter, quantity=1, batch_no='20240220', expiry_date=datetime(2026, 2, 20).date())
    
    print(f"Created sample request 2: {sample_request2.request_no}")
    
    sample_request3 = PartsRequest.objects.create(
        request_no=f"PR{datetime.now().strftime('%Y%m%d')}003",
        equipment=equipment3,
        requester=technician,
        status='pending',
        priority='medium',
        reason='定期保养，更换三滤',
        fault_description='按保养计划进行季度保养，需要更换机油滤芯、空气滤芯、液压油滤芯',
        is_emergency=False,
        idempotency_key=generate_random_id(64)
    )
    
    PartsRequestItem.objects.create(request=sample_request3, part=part_hydraulic_filter, requested_quantity=1, issued_quantity=0)
    PartsRequestItem.objects.create(request=sample_request3, part=part_air_filter, requested_quantity=1, issued_quantity=0)
    PartsRequestItem.objects.create(request=sample_request3, part=part_oil_filter, requested_quantity=1, issued_quantity=0)
    
    PartsRequestNote.objects.create(request=sample_request3, author=technician, note_type='create', content='上海顺丰FD30-001叉车季度保养申请', created_at=datetime(2024, 3, 12, 9, 0))
    PartsRequestNote.objects.create(request=sample_request3, author=technician, note_type='remark', content='客户希望本周五前完成保养', created_at=datetime(2024, 3, 12, 9, 5))
    
    print(f"Created sample request 3: {sample_request3.request_no}")


if __name__ == '__main__':
    print("Creating initial data...")
    create_users()
    create_equipment()
    create_inventory()
    create_sample_requests()
    print("Initial data created successfully!")
