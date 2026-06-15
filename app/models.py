from datetime import datetime
from app import db

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    equipments = db.relationship('Equipment', backref='customer', lazy=True)
    service_records = db.relationship('ServiceRecord', backref='customer', lazy=True)

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    model = db.Column(db.String(50), nullable=False)
    serial_number = db.Column(db.String(50), unique=True, nullable=False)
    purchase_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='正常')
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    location = db.Column(db.String(100))
    
    maintenance_records = db.relationship('MaintenanceRecord', backref='equipment', lazy=True)
    service_records = db.relationship('ServiceRecord', backref='equipment', lazy=True)

class MaintenanceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    maintenance_date = db.Column(db.DateTime, default=datetime.now)
    type = db.Column(db.String(50))
    description = db.Column(db.Text)
    technician = db.Column(db.String(50))
    next_maintenance_date = db.Column(db.Date)

class ServiceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    service_date = db.Column(db.DateTime, default=datetime.now)
    technician_id = db.Column(db.Integer, db.ForeignKey('technician.id'))
    check_in_time = db.Column(db.DateTime)
    check_in_location = db.Column(db.String(200))
    diagnosis = db.Column(db.Text)
    fault_type = db.Column(db.String(50))
    need_stop = db.Column(db.Boolean, default=False)
    customer_signature = db.Column(db.String(50))
    sign_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='待签到')
    
    technician = db.relationship('Technician', backref='service_records', lazy=True)
    parts_requests = db.relationship('PartsRequest', backref='service_record', lazy=True)

class Technician(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    skill = db.Column(db.String(100))

class PartsRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_record_id = db.Column(db.Integer, db.ForeignKey('service_record.id'), nullable=False)
    parts_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='待审核')
    approver_id = db.Column(db.Integer)
    approve_time = db.Column(db.DateTime)
    warehouse_status = db.Column(db.String(20), default='待处理')
    warehouse_handler = db.Column(db.String(50))