import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Container, GateRelease, FleetAppointment, TimelineEvent, ExceptionRecord


def seed_exceptions(db: Session):
    containers = db.query(Container).all()
    c_map = {c.container_no: c for c in containers}

    gate_releases = db.query(GateRelease).order_by(GateRelease.id).all()
    fleet_appointments = db.query(FleetAppointment).order_by(FleetAppointment.id).all()

    if not gate_releases:
        print("请先运行 seed.py 初始化基础数据")
        return

    new_gate_releases = [
        GateRelease(
            container_id=c_map["HLCU2345678"].id,
            release_type="出港",
            truck_company="浦东快运",
            truck_plate="沪D22222",
            driver_name="陈刚",
            driver_phone="13600136004",
            status="异常退回",
            notes="单证信息与实际不符，提单号缺失",
            operator="李华",
            created_at=datetime(2026, 6, 6, 9, 0),
        ),
        GateRelease(
            container_id=c_map["COSCO9876543"].id,
            release_type="进港",
            truck_company="中远冷链运输",
            truck_plate="沪B67890",
            driver_name="王强",
            driver_phone="13900139002",
            status="异常退回",
            notes="冷藏箱温度异常，记录显示-12°C超出设定范围",
            operator="赵敏",
            created_at=datetime(2026, 6, 7, 10, 30),
        ),
        GateRelease(
            container_id=c_map["ONEU3456789"].id,
            release_type="出港",
            truck_company="宁波联合物流",
            truck_plate="浙F44444",
            driver_name="周杰",
            driver_phone="13400134006",
            status="异常退回",
            notes="海关查验未通过，需补充申报材料",
            operator="李华",
            created_at=datetime(2026, 6, 7, 14, 0),
        ),
    ]
    db.add_all(new_gate_releases)
    db.flush()

    new_fleet_appointments = [
        FleetAppointment(
            gate_release_id=new_gate_releases[0].id,
            container_id=c_map["HLCU2345678"].id,
            truck_company="浦东快运",
            truck_plate="沪D22222",
            driver_name="陈刚",
            driver_phone="13600136004",
            appointment_time="10:00",
            appointment_date="2026-06-06",
            status="异常",
            notes="单证信息与实际不符，提单号缺失",
            operator="李华",
            created_at=datetime(2026, 6, 5, 16, 0),
            confirmed_at=datetime(2026, 6, 5, 17, 0),
        ),
        FleetAppointment(
            gate_release_id=None,
            container_id=c_map["YMLU8765432"].id,
            truck_company="浙江永利运输",
            truck_plate="浙G55555",
            driver_name="孙鹏",
            driver_phone="13300133007",
            appointment_time="15:00",
            appointment_date="2026-06-08",
            status="异常",
            notes="预约到场后发现集装箱未到港",
            operator="赵敏",
            created_at=datetime(2026, 6, 7, 9, 0),
            confirmed_at=datetime(2026, 6, 7, 10, 0),
        ),
        FleetAppointment(
            gate_release_id=new_gate_releases[1].id,
            container_id=c_map["COSCO9876543"].id,
            truck_company="中远冷链运输",
            truck_plate="沪B67890",
            driver_name="王强",
            driver_phone="13900139002",
            appointment_time="11:00",
            appointment_date="2026-06-07",
            status="异常",
            notes="冷藏箱温度异常",
            operator="赵敏",
            created_at=datetime(2026, 6, 6, 18, 0),
            confirmed_at=datetime(2026, 6, 6, 19, 0),
        ),
    ]
    db.add_all(new_fleet_appointments)
    db.flush()

    new_timeline_events = [
        TimelineEvent(
            entity_type="gate_release", entity_id=new_gate_releases[0].id,
            event_type="创建", description="创建45尺箱出港放行记录", operator="李华",
            created_at=datetime(2026, 6, 6, 9, 0),
        ),
        TimelineEvent(
            entity_type="gate_release", entity_id=new_gate_releases[0].id,
            event_type="退回", description="单证信息与提单号不符，异常退回", operator="李华",
            created_at=datetime(2026, 6, 6, 9, 30),
        ),
        TimelineEvent(
            entity_type="gate_release", entity_id=new_gate_releases[1].id,
            event_type="创建", description="创建冷藏箱进港放行记录", operator="赵敏",
            created_at=datetime(2026, 6, 7, 10, 30),
        ),
        TimelineEvent(
            entity_type="gate_release", entity_id=new_gate_releases[1].id,
            event_type="退回", description="冷藏箱温度-12°C超出设定范围-18°C±2°C，异常退回", operator="赵敏",
            created_at=datetime(2026, 6, 7, 11, 0),
        ),
        TimelineEvent(
            entity_type="gate_release", entity_id=new_gate_releases[2].id,
            event_type="创建", description="创建普通箱出港放行记录", operator="李华",
            created_at=datetime(2026, 6, 7, 14, 0),
        ),
        TimelineEvent(
            entity_type="gate_release", entity_id=new_gate_releases[2].id,
            event_type="退回", description="海关查验未通过，需补充申报材料，异常退回", operator="李华",
            created_at=datetime(2026, 6, 7, 15, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[0].id,
            event_type="创建", description="创建45尺箱出港预约", operator="李华",
            created_at=datetime(2026, 6, 5, 16, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[0].id,
            event_type="确认", description="预约已确认", operator="李华",
            created_at=datetime(2026, 6, 5, 17, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[0].id,
            event_type="异常", description="到场后核实单证信息与实际不符，提单号缺失", operator="李华",
            created_at=datetime(2026, 6, 6, 10, 15),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[1].id,
            event_type="创建", description="创建冷藏箱出港预约", operator="赵敏",
            created_at=datetime(2026, 6, 7, 9, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[1].id,
            event_type="确认", description="预约已确认", operator="赵敏",
            created_at=datetime(2026, 6, 7, 10, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[1].id,
            event_type="异常", description="司机到场后发现集装箱尚未到港，无法提箱", operator="赵敏",
            created_at=datetime(2026, 6, 8, 15, 10),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[2].id,
            event_type="创建", description="创建冷藏箱进港预约", operator="赵敏",
            created_at=datetime(2026, 6, 6, 18, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[2].id,
            event_type="确认", description="预约已确认", operator="赵敏",
            created_at=datetime(2026, 6, 6, 19, 0),
        ),
        TimelineEvent(
            entity_type="fleet_appointment", entity_id=new_fleet_appointments[2].id,
            event_type="异常", description="冷藏箱温度异常-12°C，超出设定范围", operator="赵敏",
            created_at=datetime(2026, 6, 7, 11, 30),
        ),
    ]
    db.add_all(new_timeline_events)

    exception_records = [
        ExceptionRecord(
            entity_type="gate_release",
            entity_id=new_gate_releases[0].id,
            exception_type="单证异常",
            description="提单号MSCU123456与系统记录HLCU234567不一致，缺少正本提单，无法确认货权归属",
            status="待处理",
            created_at=datetime(2026, 6, 6, 9, 30),
        ),
        ExceptionRecord(
            entity_type="gate_release",
            entity_id=new_gate_releases[1].id,
            exception_type="设备异常",
            description="冷藏箱温度记录显示-12°C，超出设定范围-18°C±2°C，疑似制冷设备故障，需安排检修",
            status="待处理",
            created_at=datetime(2026, 6, 7, 11, 0),
        ),
        ExceptionRecord(
            entity_type="gate_release",
            entity_id=new_gate_releases[2].id,
            exception_type="海关扣留",
            description="海关查验发现申报品名与实际货物不符，需补充提供原产地证明和商检报告",
            status="待处理",
            created_at=datetime(2026, 6, 7, 15, 0),
        ),
        ExceptionRecord(
            entity_type="fleet_appointment",
            entity_id=new_fleet_appointments[0].id,
            exception_type="单证异常",
            description="司机到场后核实提单号缺失，与闸口放行记录信息不一致，无法确认出港手续",
            status="待处理",
            created_at=datetime(2026, 6, 6, 10, 15),
        ),
        ExceptionRecord(
            entity_type="fleet_appointment",
            entity_id=new_fleet_appointments[1].id,
            exception_type="货物未到",
            description="司机按预约时间到场提箱，系统显示集装箱YMLU8765432尚未到港，船舶YM WARRANTY仍在途中",
            status="待处理",
            created_at=datetime(2026, 6, 8, 15, 10),
        ),
        ExceptionRecord(
            entity_type="fleet_appointment",
            entity_id=new_fleet_appointments[2].id,
            exception_type="设备异常",
            description="冷藏箱COSCO9876543到场时温度异常-12°C，超出冷藏运输要求范围-18°C±2°C，需返厂检修",
            status="待处理",
            created_at=datetime(2026, 6, 7, 11, 30),
        ),
    ]
    db.add_all(exception_records)

    db.commit()

    print("=== 异常样例数据写入完成 ===")
    print(f"新增闸口放行（异常退回）: {len(new_gate_releases)} 条")
    print(f"  - #{new_gate_releases[0].id}: HLCU2345678 单证异常（提单号缺失）")
    print(f"  - #{new_gate_releases[1].id}: COSCO9876543 设备异常（冷藏箱温度异常）")
    print(f"  - #{new_gate_releases[2].id}: ONEU3456789 海关扣留（申报不符）")
    print(f"新增车队预约（异常）: {len(new_fleet_appointments)} 条")
    print(f"  - #{new_fleet_appointments[0].id}: 45尺箱单证异常")
    print(f"  - #{new_fleet_appointments[1].id}: 冷藏箱货物未到港")
    print(f"  - #{new_fleet_appointments[2].id}: 冷藏箱温度异常")
    print(f"新增异常记录: {len(exception_records)} 条（全部待处理）")
    print(f"  - 闸口放行: 单证异常 / 设备异常 / 海关扣留")
    print(f"  - 车队预约: 单证异常 / 货物未到 / 设备异常")
    print(f"新增时间线事件: {len(new_timeline_events)} 条")
    print()
    print("=== 验证指引 ===")
    print("闸口放行异常：")
    print(f"  curl http://localhost:8001/api/gate-releases/{new_gate_releases[0].id}  # 单证异常")
    print(f"  curl http://localhost:8001/api/gate-releases/{new_gate_releases[1].id}  # 设备异常")
    print(f"  curl http://localhost:8001/api/gate-releases/{new_gate_releases[2].id}  # 海关扣留")
    print("车队预约异常：")
    print(f"  curl http://localhost:8001/api/fleet-appointments/{new_fleet_appointments[0].id}  # 单证异常")
    print(f"  curl http://localhost:8001/api/fleet-appointments/{new_fleet_appointments[1].id}  # 货物未到")
    print(f"  curl http://localhost:8001/api/fleet-appointments/{new_fleet_appointments[2].id}  # 设备异常")
    print("异常处理接口：")
    print("  curl -X PUT http://localhost:8001/api/exceptions/{id}/handle -H 'Content-Type: application/json' -d '{\"handler\": \"处理人\", \"result\": \"处理结果\"}'")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_exceptions(db)
    finally:
        db.close()
