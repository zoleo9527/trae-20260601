from datetime import datetime
from sqlalchemy.orm import Session
from models import Container, GateRelease, FleetAppointment, TimelineEvent, ExceptionRecord, Attachment


def seed_data(db: Session):
    existing = db.query(Container).first()
    if existing:
        return

    containers = [
        Container(container_no="MSKU1234567", size="40", type="普通", status="在场", yard_block="A", yard_slot="A-01-01", vessel="MSC OSCAR", voyage="26E05", bill_of_lading="MSCU123456"),
        Container(container_no="COSCO9876543", size="20", type="冷藏", status="在场", yard_block="B", yard_slot="B-02-03", vessel="COSCO FORTUNE", voyage="26E08", bill_of_lading="COSU987654"),
        Container(container_no="EGLV4567890", size="40", type="危险品", status="在场", yard_block="C", yard_slot="C-01-02", vessel="EVER GIVEN", voyage="26E12", bill_of_lading="EGLV456789"),
        Container(container_no="OOLU7654321", size="20", type="普通", status="已出", yard_block="A", yard_slot="A-03-01", vessel="OOCL BERLIN", voyage="26E03", bill_of_lading="OOLU765432"),
        Container(container_no="HLCU2345678", size="45", type="普通", status="在场", yard_block="D", yard_slot="D-01-01", vessel="HMM COPENHAGEN", voyage="26E15", bill_of_lading="HLCU234567"),
        Container(container_no="YMLU8765432", size="40", type="冷藏", status="待进", vessel="YM WARRANTY", voyage="26E20", bill_of_lading="YMLU876543"),
        Container(container_no="ONEU3456789", size="20", type="普通", status="在场", yard_block="B", yard_slot="B-04-02", vessel="ONE HARMONY", voyage="26E10", bill_of_lading="ONEU345678"),
        Container(container_no="TCLU5678901", size="40", type="危险品", status="在场", yard_block="C", yard_slot="C-02-01", vessel="TIANSHAN", voyage="26E18", bill_of_lading="TCLU567890"),
    ]
    db.add_all(containers)
    db.flush()

    gate_releases = [
        GateRelease(
            container_id=containers[0].id, release_type="出港",
            truck_company="上海远东物流", truck_plate="沪A12345", driver_name="张明",
            driver_phone="13800138001", status="已放行", notes="正常出港，单证齐全",
            operator="李华", created_at=datetime(2026, 6, 1, 8, 30), released_at=datetime(2026, 6, 1, 9, 15),
        ),
        GateRelease(
            container_id=containers[1].id, release_type="进港",
            truck_company="中远冷链运输", truck_plate="沪B67890", driver_name="王强",
            driver_phone="13900139002", status="待处理", notes="冷藏箱需检查温度记录",
            operator="赵敏", created_at=datetime(2026, 6, 2, 10, 0),
        ),
        GateRelease(
            container_id=containers[2].id, release_type="出港",
            truck_company="中海危险品运输", truck_plate="沪C11111", driver_name="刘伟",
            driver_phone="13700137003", status="已放行", notes="危险品出港，已核实危包证",
            operator="李华", created_at=datetime(2026, 6, 3, 14, 0), released_at=datetime(2026, 6, 3, 14, 45),
        ),
        GateRelease(
            container_id=containers[4].id, release_type="进港",
            truck_company="浦东快运", truck_plate="沪D22222", driver_name="陈刚",
            driver_phone="13600136004", status="待处理", notes="45尺特种箱，需安排大车位",
            operator="赵敏", created_at=datetime(2026, 6, 4, 9, 30),
        ),
        GateRelease(
            container_id=containers[7].id, release_type="出港",
            truck_company="洋山运输有限公司", truck_plate="沪E33333", driver_name="黄磊",
            driver_phone="13500135005", status="异常退回", notes="箱体外观有破损痕迹",
            operator="李华", created_at=datetime(2026, 6, 5, 11, 0),
        ),
    ]
    db.add_all(gate_releases)
    db.flush()

    fleet_appointments = [
        FleetAppointment(
            gate_release_id=gate_releases[0].id, container_id=containers[0].id,
            truck_company="上海远东物流", truck_plate="沪A12345", driver_name="张明",
            driver_phone="13800138001", appointment_time="09:00", appointment_date="2026-06-01",
            status="已完成", notes="正常出港，单证齐全", operator="李华",
            created_at=datetime(2026, 5, 31, 16, 0), confirmed_at=datetime(2026, 5, 31, 17, 0),
            completed_at=datetime(2026, 6, 1, 9, 30),
        ),
        FleetAppointment(
            gate_release_id=gate_releases[1].id, container_id=containers[1].id,
            truck_company="中远冷链运输", truck_plate="沪B67890", driver_name="王强",
            driver_phone="13900139002", appointment_time="10:30", appointment_date="2026-06-02",
            status="已确认", notes="冷藏箱需检查温度记录", operator="赵敏",
            created_at=datetime(2026, 6, 1, 18, 0), confirmed_at=datetime(2026, 6, 1, 19, 0),
        ),
        FleetAppointment(
            gate_release_id=None, container_id=containers[6].id,
            truck_company="宁波联合物流", truck_plate="浙F44444", driver_name="周杰",
            driver_phone="13400134006", appointment_time="14:00", appointment_date="2026-06-06",
            status="待确认", notes="普通箱进港预约", operator="赵敏",
            created_at=datetime(2026, 6, 5, 10, 0),
        ),
        FleetAppointment(
            gate_release_id=gate_releases[3].id, container_id=containers[4].id,
            truck_company="浦东快运", truck_plate="沪D22222", driver_name="陈刚",
            driver_phone="13600136004", appointment_time="11:00", appointment_date="2026-06-04",
            status="已到场", notes="45尺特种箱，需安排大车位", operator="赵敏",
            created_at=datetime(2026, 6, 3, 15, 0), confirmed_at=datetime(2026, 6, 3, 16, 0),
        ),
        FleetAppointment(
            gate_release_id=gate_releases[4].id, container_id=containers[7].id,
            truck_company="洋山运输有限公司", truck_plate="沪E33333", driver_name="黄磊",
            driver_phone="13500135005", appointment_time="13:00", appointment_date="2026-06-05",
            status="异常", notes="箱体外观有破损痕迹", operator="李华",
            created_at=datetime(2026, 6, 4, 16, 0), confirmed_at=datetime(2026, 6, 4, 17, 0),
        ),
    ]
    db.add_all(fleet_appointments)
    db.flush()

    timeline_events = [
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[0].id, event_type="创建", description="创建出港放行记录", operator="李华", created_at=datetime(2026, 6, 1, 8, 30)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[0].id, event_type="放行", description="已放行出港", operator="李华", created_at=datetime(2026, 6, 1, 9, 15)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[1].id, event_type="创建", description="创建进港放行记录", operator="赵敏", created_at=datetime(2026, 6, 2, 10, 0)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[2].id, event_type="创建", description="创建危险品出港放行记录", operator="李华", created_at=datetime(2026, 6, 3, 14, 0)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[2].id, event_type="放行", description="危险品出港已放行", operator="李华", created_at=datetime(2026, 6, 3, 14, 45)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[3].id, event_type="创建", description="创建45尺特种箱进港记录", operator="赵敏", created_at=datetime(2026, 6, 4, 9, 30)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[4].id, event_type="创建", description="创建出港放行记录", operator="李华", created_at=datetime(2026, 6, 5, 11, 0)),
        TimelineEvent(entity_type="gate_release", entity_id=gate_releases[4].id, event_type="退回", description="箱体外观有破损，异常退回", operator="李华", created_at=datetime(2026, 6, 5, 11, 30)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[0].id, event_type="创建", description="创建车队预约", operator="李华", created_at=datetime(2026, 5, 31, 16, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[0].id, event_type="确认", description="预约已确认", operator="李华", created_at=datetime(2026, 5, 31, 17, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[0].id, event_type="到场", description="车辆已到场", operator="李华", created_at=datetime(2026, 6, 1, 9, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[0].id, event_type="完成", description="预约已完成", operator="李华", created_at=datetime(2026, 6, 1, 9, 30)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[1].id, event_type="创建", description="创建冷藏箱进港预约", operator="赵敏", created_at=datetime(2026, 6, 1, 18, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[1].id, event_type="确认", description="预约已确认", operator="赵敏", created_at=datetime(2026, 6, 1, 19, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[2].id, event_type="创建", description="创建普通箱进港预约", operator="赵敏", created_at=datetime(2026, 6, 5, 10, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[3].id, event_type="创建", description="创建45尺箱进港预约", operator="赵敏", created_at=datetime(2026, 6, 3, 15, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[3].id, event_type="确认", description="预约已确认", operator="赵敏", created_at=datetime(2026, 6, 3, 16, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[3].id, event_type="到场", description="车辆已到场", operator="赵敏", created_at=datetime(2026, 6, 4, 10, 45)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[4].id, event_type="创建", description="创建危险品出港预约", operator="李华", created_at=datetime(2026, 6, 4, 16, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[4].id, event_type="确认", description="预约已确认", operator="李华", created_at=datetime(2026, 6, 4, 17, 0)),
        TimelineEvent(entity_type="fleet_appointment", entity_id=fleet_appointments[4].id, event_type="异常", description="箱体外观有破损痕迹，标记为异常", operator="李华", created_at=datetime(2026, 6, 5, 13, 30)),
    ]
    db.add_all(timeline_events)

    exception_records = [
        ExceptionRecord(
            entity_type="gate_release", entity_id=gate_releases[4].id,
            exception_type="箱体损坏", description="集装箱右侧面有明显凹陷和划痕，无法正常出港",
            status="待处理", created_at=datetime(2026, 6, 5, 11, 30),
        ),
        ExceptionRecord(
            entity_type="fleet_appointment", entity_id=fleet_appointments[4].id,
            exception_type="信息不符", description="司机到场后发现集装箱号与预约不符",
            status="待处理", created_at=datetime(2026, 6, 5, 13, 30),
        ),
    ]
    db.add_all(exception_records)

    attachments = [
        Attachment(
            entity_type="gate_release", entity_id=gate_releases[2].id,
            file_name="危包证_MSU1234567.pdf", file_type="application/pdf",
            file_size=1024000, uploaded_by="李华", created_at=datetime(2026, 6, 3, 13, 50),
        ),
        Attachment(
            entity_type="gate_release", entity_id=gate_releases[4].id,
            file_name="箱体损坏照片.jpg", file_type="image/jpeg",
            file_size=3072000, uploaded_by="李华", created_at=datetime(2026, 6, 5, 11, 35),
        ),
    ]
    db.add_all(attachments)

    db.commit()
