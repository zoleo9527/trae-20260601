from app import create_app, db
from app.models import Customer, Equipment, MaintenanceRecord, Technician, ServiceRecord, PartsRequest
from datetime import datetime, date

app = create_app()

with app.app_context():
    db.create_all()
    
    if Customer.query.count() == 0:
        c1 = Customer(name='上海物流仓储有限公司', contact='王经理', phone='13800138001', address='上海市浦东新区张江高科技园区')
        c2 = Customer(name='杭州制造业集团', contact='李主任', phone='13900139002', address='杭州市萧山区经济技术开发区')
        c3 = Customer(name='苏州工业园区', contact='张厂长', phone='13700137003', address='苏州市工业园区金鸡湖大道')
        db.session.add_all([c1, c2, c3])
        db.session.commit()
    
    if Equipment.query.count() == 0:
        e1 = Equipment(model='TCM FD30', serial_number='TCM2023001', purchase_date=date(2023, 1, 15), status='使用中', customer_id=1, location='A区仓库')
        e2 = Equipment(model='合力 H2000', serial_number='HELI2022001', purchase_date=date(2022, 6, 20), status='使用中', customer_id=1, location='B区仓库')
        e3 = Equipment(model='林德 E16C', serial_number='LIND2023002', purchase_date=date(2023, 3, 10), status='维修中', customer_id=2, location='生产车间')
        e4 = Equipment(model='丰田 8FBN', serial_number='TOYO2021001', purchase_date=date(2021, 11, 5), status='使用中', customer_id=3, location='物流中心')
        db.session.add_all([e1, e2, e3, e4])
        db.session.commit()
    
    if MaintenanceRecord.query.count() == 0:
        m1 = MaintenanceRecord(equipment_id=1, maintenance_date=datetime(2024, 1, 10), type='定期保养', description='更换液压油，检查刹车系统', technician='陈技师', next_maintenance_date=date(2024, 4, 10))
        m2 = MaintenanceRecord(equipment_id=1, maintenance_date=datetime(2024, 4, 8), type='定期保养', description='更换机油滤清器，检查电瓶', technician='李技师', next_maintenance_date=date(2024, 7, 8))
        m3 = MaintenanceRecord(equipment_id=2, maintenance_date=datetime(2024, 2, 15), type='专项保养', description='调整门架链条，检查液压系统', technician='王技师', next_maintenance_date=date(2024, 5, 15))
        m4 = MaintenanceRecord(equipment_id=3, maintenance_date=datetime(2024, 3, 20), type='故障维修', description='更换驱动电机', technician='陈技师', next_maintenance_date=date(2024, 6, 20))
        db.session.add_all([m1, m2, m3, m4])
        db.session.commit()
    
    if Technician.query.count() == 0:
        t1 = Technician(name='陈技术', phone='13500135001', skill='液压系统、电气维修')
        t2 = Technician(name='李工', phone='13600136002', skill='电池维护、电路检修')
        t3 = Technician(name='王师傅', phone='13400134003', skill='机械故障、传动系统')
        db.session.add_all([t1, t2, t3])
        db.session.commit()
    
    if ServiceRecord.query.count() == 0:
        sr1 = ServiceRecord(
            customer_id=1,
            equipment_id=1,
            technician_id=1,
            service_date=datetime(2024, 5, 20, 9, 30),
            check_in_time=datetime(2024, 5, 20, 9, 35),
            check_in_location='上海市浦东新区张江高科技园区A区仓库',
            diagnosis='液压系统压力异常，液压泵磨损严重，建议立即更换液压泵并补充液压油',
            fault_type='液压异常',
            need_stop=True,
            customer_signature='王经理',
            sign_time=datetime(2024, 5, 20, 11, 30),
            status='已签收'
        )
        
        sr2 = ServiceRecord(
            customer_id=2,
            equipment_id=3,
            technician_id=2,
            service_date=datetime(2024, 5, 21, 10, 0),
            check_in_time=datetime(2024, 5, 21, 10, 15),
            check_in_location='杭州市萧山区经济技术开发区生产车间',
            diagnosis='电池组老化严重，容量下降至设计容量的60%，建议更换新电池组',
            fault_type='电池老化',
            need_stop=False,
            customer_signature='李主任',
            sign_time=datetime(2024, 5, 21, 12, 0),
            status='已签收'
        )
        
        sr3 = ServiceRecord(
            customer_id=3,
            equipment_id=4,
            technician_id=3,
            service_date=datetime(2024, 5, 22, 8, 30),
            check_in_time=datetime(2024, 5, 22, 8, 45),
            check_in_location='苏州市工业园区金鸡湖大道物流中心',
            diagnosis='传动齿轮箱异响，轴承磨损严重，需要现场停机维修，更换轴承和密封件',
            fault_type='客户现场停机',
            need_stop=True,
            status='诊断完成'
        )
        
        sr4 = ServiceRecord(
            customer_id=1,
            equipment_id=2,
            technician_id=1,
            service_date=datetime(2024, 5, 23, 14, 0),
            status='待签到'
        )
        
        db.session.add_all([sr1, sr2, sr3, sr4])
        db.session.commit()
    
    if PartsRequest.query.count() == 0:
        pr1 = PartsRequest(service_record_id=1, parts_name='液压泵总成', quantity=1, status='已审核', approver_id=1, approve_time=datetime(2024, 5, 20, 10, 0), warehouse_status='已发货', warehouse_handler='仓库管理员')
        pr2 = PartsRequest(service_record_id=2, parts_name='锂电池组(48V/80Ah)', quantity=2, status='已审核', approver_id=1, approve_time=datetime(2024, 5, 21, 11, 0), warehouse_status='备货中', warehouse_handler=None)
        pr3 = PartsRequest(service_record_id=3, parts_name='齿轮箱轴承', quantity=2, status='待审核', warehouse_status='待处理')
        pr4 = PartsRequest(service_record_id=3, parts_name='密封件套装', quantity=1, status='待审核', warehouse_status='待处理')
        db.session.add_all([pr1, pr2, pr3, pr4])
        db.session.commit()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)