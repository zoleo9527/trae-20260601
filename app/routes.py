from datetime import datetime
from flask import Blueprint, jsonify, request
from app import db
from app.models import Customer, Equipment, MaintenanceRecord, ServiceRecord, Technician, PartsRequest

bp = Blueprint('api', __name__)

@bp.route('/api/customers', methods=['GET'])
def get_customers():
    customers = Customer.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'contact': c.contact,
        'phone': c.phone,
        'address': c.address
    } for c in customers])

@bp.route('/api/equipments', methods=['GET'])
def get_equipments():
    equipments = Equipment.query.all()
    return jsonify([{
        'id': e.id,
        'model': e.model,
        'serial_number': e.serial_number,
        'purchase_date': e.purchase_date.strftime('%Y-%m-%d') if e.purchase_date else None,
        'status': e.status,
        'customer_id': e.customer_id,
        'location': e.location,
        'customer_name': e.customer.name
    } for e in equipments])

@bp.route('/api/equipments/<int:id>', methods=['GET'])
def get_equipment(id):
    equipment = Equipment.query.get_or_404(id)
    maintenance_records = MaintenanceRecord.query.filter_by(equipment_id=id).order_by(MaintenanceRecord.maintenance_date.desc()).all()
    service_records = ServiceRecord.query.filter_by(equipment_id=id).order_by(ServiceRecord.service_date.desc()).all()
    
    return jsonify({
        'id': equipment.id,
        'model': equipment.model,
        'serial_number': equipment.serial_number,
        'purchase_date': equipment.purchase_date.strftime('%Y-%m-%d') if equipment.purchase_date else None,
        'status': equipment.status,
        'customer_id': equipment.customer_id,
        'location': equipment.location,
        'customer_name': equipment.customer.name,
        'maintenance_records': [{
            'id': m.id,
            'maintenance_date': m.maintenance_date.strftime('%Y-%m-%d %H:%M'),
            'type': m.type,
            'description': m.description,
            'technician': m.technician,
            'next_maintenance_date': m.next_maintenance_date.strftime('%Y-%m-%d') if m.next_maintenance_date else None
        } for m in maintenance_records],
        'service_records': [{
            'id': s.id,
            'service_date': s.service_date.strftime('%Y-%m-%d %H:%M'),
            'technician_name': s.technician.name if s.technician else None,
            'check_in_time': s.check_in_time.strftime('%Y-%m-%d %H:%M') if s.check_in_time else None,
            'diagnosis': s.diagnosis,
            'fault_type': s.fault_type,
            'need_stop': s.need_stop,
            'status': s.status
        } for s in service_records]
    })

@bp.route('/api/technicians', methods=['GET'])
def get_technicians():
    technicians = Technician.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'phone': t.phone,
        'skill': t.skill
    } for t in technicians])

@bp.route('/api/service_records', methods=['GET'])
def get_service_records():
    records = ServiceRecord.query.order_by(ServiceRecord.service_date.desc()).all()
    return jsonify([{
        'id': r.id,
        'customer_name': r.customer.name,
        'equipment_model': r.equipment.model,
        'equipment_serial': r.equipment.serial_number,
        'service_date': r.service_date.strftime('%Y-%m-%d %H:%M'),
        'technician_name': r.technician.name if r.technician else None,
        'check_in_time': r.check_in_time.strftime('%Y-%m-%d %H:%M') if r.check_in_time else None,
        'check_in_location': r.check_in_location,
        'diagnosis': r.diagnosis,
        'fault_type': r.fault_type,
        'need_stop': r.need_stop,
        'customer_signature': r.customer_signature,
        'sign_time': r.sign_time.strftime('%Y-%m-%d %H:%M') if r.sign_time else None,
        'status': r.status
    } for r in records])

@bp.route('/api/service_records/<int:id>', methods=['GET'])
def get_service_record(id):
    record = ServiceRecord.query.get_or_404(id)
    parts_requests = PartsRequest.query.filter_by(service_record_id=id).all()
    
    return jsonify({
        'id': record.id,
        'customer_id': record.customer_id,
        'customer_name': record.customer.name,
        'customer_phone': record.customer.phone,
        'equipment_id': record.equipment_id,
        'equipment_model': record.equipment.model,
        'equipment_serial': record.equipment.serial_number,
        'service_date': record.service_date.strftime('%Y-%m-%d %H:%M'),
        'technician_id': record.technician_id,
        'technician_name': record.technician.name if record.technician else None,
        'check_in_time': record.check_in_time.strftime('%Y-%m-%d %H:%M') if record.check_in_time else None,
        'check_in_location': record.check_in_location,
        'diagnosis': record.diagnosis,
        'fault_type': record.fault_type,
        'need_stop': record.need_stop,
        'customer_signature': record.customer_signature,
        'sign_time': record.sign_time.strftime('%Y-%m-%d %H:%M') if record.sign_time else None,
        'status': record.status,
        'parts_requests': [{
            'id': p.id,
            'parts_name': p.parts_name,
            'quantity': p.quantity,
            'status': p.status,
            'warehouse_status': p.warehouse_status,
            'warehouse_handler': p.warehouse_handler
        } for p in parts_requests]
    })

@bp.route('/api/service_records', methods=['POST'])
def create_service_record():
    data = request.json
    record = ServiceRecord(
        customer_id=data['customer_id'],
        equipment_id=data['equipment_id'],
        technician_id=data.get('technician_id'),
        status='待签到'
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({'id': record.id}), 201

@bp.route('/api/service_records/<int:id>/checkin', methods=['POST'])
def check_in(id):
    record = ServiceRecord.query.get_or_404(id)
    data = request.json
    record.check_in_time = datetime.now()
    record.check_in_location = data.get('location', '客户现场')
    record.status = '已签到'
    db.session.commit()
    return jsonify({'status': 'success'})

@bp.route('/api/service_records/<int:id>/diagnosis', methods=['POST'])
def submit_diagnosis(id):
    record = ServiceRecord.query.get_or_404(id)
    data = request.json
    record.diagnosis = data['diagnosis']
    record.fault_type = data['fault_type']
    record.need_stop = data.get('need_stop', False)
    record.status = '诊断完成'
    db.session.commit()
    return jsonify({'status': 'success'})

@bp.route('/api/service_records/<int:id>/sign', methods=['POST'])
def customer_sign(id):
    record = ServiceRecord.query.get_or_404(id)
    data = request.json
    record.customer_signature = data['signature']
    record.sign_time = datetime.now()
    record.status = '已签收'
    db.session.commit()
    return jsonify({'status': 'success'})

@bp.route('/api/parts_requests', methods=['POST'])
def create_parts_request():
    data = request.json
    request_obj = PartsRequest(
        service_record_id=data['service_record_id'],
        parts_name=data['parts_name'],
        quantity=data.get('quantity', 1)
    )
    db.session.add(request_obj)
    db.session.commit()
    return jsonify({'id': request_obj.id}), 201

@bp.route('/api/parts_requests', methods=['GET'])
def get_parts_requests():
    requests = PartsRequest.query.order_by(PartsRequest.id.desc()).all()
    return jsonify([{
        'id': r.id,
        'service_record_id': r.service_record_id,
        'parts_name': r.parts_name,
        'quantity': r.quantity,
        'status': r.status,
        'warehouse_status': r.warehouse_status,
        'warehouse_handler': r.warehouse_handler,
        'service_info': {
            'customer_name': r.service_record.customer.name,
            'equipment_model': r.service_record.equipment.model,
            'fault_type': r.service_record.fault_type
        }
    } for r in requests])

@bp.route('/api/parts_requests/<int:id>/approve', methods=['POST'])
def approve_parts_request(id):
    request_obj = PartsRequest.query.get_or_404(id)
    data = request.json
    request_obj.status = '已审核'
    request_obj.approver_id = data.get('approver_id')
    request_obj.approve_time = datetime.now()
    db.session.commit()
    return jsonify({'status': 'success'})

@bp.route('/api/parts_requests/<int:id>/warehouse', methods=['POST'])
def warehouse_process(id):
    request_obj = PartsRequest.query.get_or_404(id)
    data = request.json
    request_obj.warehouse_status = data.get('status', '已发货')
    request_obj.warehouse_handler = data.get('handler')
    db.session.commit()
    return jsonify({'status': 'success'})