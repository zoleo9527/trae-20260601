from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import CargoOrder, LocationAllocation, PickupAppointment, StatusChangeLog
import random


def seed_database(db: Session):
    if db.query(CargoOrder).first():
        return

    now = datetime.now()

    orders_data = [
        {
            "order_no": "CA-20260601-001",
            "flight_no": "CA1234",
            "arrival_time": now - timedelta(hours=6),
            "goods_name": "电子元器件-主板模组",
            "goods_type": "普货",
            "weight_kg": 520.0,
            "consignee": "深圳华芯科技有限公司",
            "contact_phone": "13800138001",
            "status": "picked_up",
            "is_urgent": False,
        },
        {
            "order_no": "CA-20260601-002",
            "flight_no": "MU5678",
            "arrival_time": now - timedelta(hours=4),
            "goods_name": "医疗试剂-冷链包",
            "goods_type": "特种-冷链",
            "weight_kg": 85.0,
            "consignee": "上海医药集团",
            "contact_phone": "13900139002",
            "status": "appointed",
            "is_urgent": True,
        },
        {
            "order_no": "CA-20260601-003",
            "flight_no": "CZ3456",
            "arrival_time": now - timedelta(hours=3),
            "goods_name": "汽车零配件-刹车盘",
            "goods_type": "普货",
            "weight_kg": 1200.0,
            "consignee": "广州汽配贸易行",
            "contact_phone": "13700137003",
            "status": "allocated",
            "is_urgent": False,
        },
        {
            "order_no": "CA-20260601-004",
            "flight_no": "HU7890",
            "arrival_time": now - timedelta(hours=2),
            "goods_name": "化工原料-涂料稀释剂",
            "goods_type": "危险品",
            "weight_kg": 300.0,
            "consignee": "东莞化工有限公司",
            "contact_phone": "13600136004",
            "status": "security_rejected",
            "is_urgent": False,
        },
        {
            "order_no": "CA-20260601-005",
            "flight_no": "SZ1234",
            "arrival_time": now - timedelta(hours=1, minutes=30),
            "goods_name": "生鲜水果-进口车厘子",
            "goods_type": "特种-冷链",
            "weight_kg": 450.0,
            "consignee": "北京鲜果商贸有限公司",
            "contact_phone": "13500135005",
            "status": "allocation_changed",
            "is_urgent": True,
        },
        {
            "order_no": "CA-20260601-006",
            "flight_no": "FM5678",
            "arrival_time": now - timedelta(hours=1),
            "goods_name": "文件资料-合同正本",
            "goods_type": "普货",
            "weight_kg": 5.0,
            "consignee": "上海律和律师事务所",
            "contact_phone": "13400134006",
            "status": "supplementing",
            "is_urgent": False,
        },
        {
            "order_no": "CA-20260601-007",
            "flight_no": "3U9012",
            "arrival_time": now - timedelta(minutes=45),
            "goods_name": "锂电池组-动力电池",
            "goods_type": "危险品",
            "weight_kg": 180.0,
            "consignee": "合肥新能源科技公司",
            "contact_phone": "13300133007",
            "status": "pending_allocation",
            "is_urgent": True,
        },
        {
            "order_no": "CA-20260601-008",
            "flight_no": "CA8765",
            "arrival_time": now - timedelta(minutes=20),
            "goods_name": "服装面料-真丝卷",
            "goods_type": "普货",
            "weight_kg": 680.0,
            "consignee": "杭州丝绸进出口公司",
            "contact_phone": "13200132008",
            "status": "pending_security",
            "is_urgent": False,
        },
    ]

    orders = []
    for od in orders_data:
        order = CargoOrder(**od)
        db.add(order)
        db.flush()
        orders.append(order)

    allocations_data = [
        {"order_idx": 0, "zone": "A", "shelf": "01", "position": "03", "allocated_by": "库管-王建国", "status": "released", "notes": "正常出库，提货人已签字确认", "version": 1},
        {"order_idx": 1, "zone": "C", "shelf": "03", "position": "01", "allocated_by": "库管-王建国", "status": "active", "notes": "冷链专区，温度2-8℃要求，提货时需核对冷链记录", "version": 1},
        {"order_idx": 2, "zone": "A", "shelf": "05", "position": "02", "allocated_by": "库管-李明", "status": "active", "notes": "重型件，需叉车协助提货", "version": 1},
        {"order_idx": 4, "zone": "D", "shelf": "02", "position": "01", "allocated_by": "库管-李明", "status": "active", "notes": "原分配C-03-02，因冷链仓满调至D区。提货时注意搬运方式，勿抛掷", "version": 2},
        {"order_idx": 6, "zone": "B", "shelf": "01", "position": "05", "allocated_by": "库管-王建国", "status": "active", "notes": "危险品专区存放，需持危险品操作证提货", "version": 1},
    ]

    allocations = []
    for ad in allocations_data:
        order_idx = ad.pop("order_idx")
        allocation = LocationAllocation(
            order_id=orders[order_idx].id,
            full_location=f"{ad['zone']}-{ad['shelf']}-{ad['position']}",
            **ad,
        )
        db.add(allocation)
        db.flush()
        allocations.append(allocation)

    appointments_data = [
        {"order_idx": 0, "allocation_idx": 0, "appointee": "赵伟", "contact_phone": "18800188001", "appointment_time": now - timedelta(hours=1), "status": "completed", "notes": "提货完成，货物完好", "allocation_snapshot": "A-01-03", "allocation_changed": False},
        {"order_idx": 1, "allocation_idx": 1, "appointee": "钱芳", "contact_phone": "18800188002", "appointment_time": now + timedelta(hours=2), "status": "confirmed", "notes": "冷链提货需提前30分钟到达，携带温控记录表", "allocation_snapshot": "C-03-01", "allocation_changed": False},
        {"order_idx": 4, "allocation_idx": 3, "appointee": "孙磊", "contact_phone": "18800188005", "appointment_time": now + timedelta(hours=3), "status": "pending", "notes": "库位已从C区变更为D区，请提货人注意新库位", "allocation_snapshot": "C-03-02→D-02-01", "allocation_changed": True},
    ]

    for apd in appointments_data:
        order_idx = apd.pop("order_idx")
        allocation_idx = apd.pop("allocation_idx")
        appointment = PickupAppointment(
            order_id=orders[order_idx].id,
            allocation_id=allocations[allocation_idx].id,
            **apd,
        )
        db.add(appointment)

    db.flush()

    logs_data = [
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": None, "to_status": "created", "changed_by": "系统", "role": "system", "notes": "航班CA1234到港，自动生成货单"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "created", "to_status": "accepting", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "货站受理，核对运单与货物一致"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "accepting", "to_status": "pending_security", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "受理完成，移交安检"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "pending_security", "to_status": "inspecting", "changed_by": "陈安检", "role": "security_inspector", "notes": "开始安检"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "inspecting", "to_status": "pending_allocation", "changed_by": "陈安检", "role": "security_inspector", "notes": "安检通过，移交库区"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "pending_allocation", "to_status": "allocated", "changed_by": "王建国", "role": "warehouse_dispatcher", "notes": "分配库位A-01-03"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "allocated", "to_status": "appointed", "changed_by": "赵伟", "role": "cargo_acceptor", "notes": "提货人预约确认"},
        {"entity_type": "cargo_order", "entity_idx": 0, "from_status": "appointed", "to_status": "picked_up", "changed_by": "赵伟", "role": "cargo_acceptor", "notes": "提货完成"},

        {"entity_type": "cargo_order", "entity_idx": 3, "from_status": None, "to_status": "created", "changed_by": "系统", "role": "system", "notes": "航班HU7890到港，自动生成货单"},
        {"entity_type": "cargo_order", "entity_idx": 3, "from_status": "created", "to_status": "accepting", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "货站受理"},
        {"entity_type": "cargo_order", "entity_idx": 3, "from_status": "accepting", "to_status": "pending_security", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "移交安检"},
        {"entity_type": "cargo_order", "entity_idx": 3, "from_status": "pending_security", "to_status": "inspecting", "changed_by": "陈安检", "role": "security_inspector", "notes": "开始安检"},
        {"entity_type": "cargo_order", "entity_idx": 3, "from_status": "inspecting", "to_status": "security_rejected", "changed_by": "陈安检", "role": "security_inspector", "notes": "安检不通过：危险品申报单缺失，MSDS报告过期，需补充材料后重新安检"},

        {"entity_type": "cargo_order", "entity_idx": 5, "from_status": None, "to_status": "created", "changed_by": "系统", "role": "system", "notes": "航班FM5678到港，自动生成货单"},
        {"entity_type": "cargo_order", "entity_idx": 5, "from_status": "created", "to_status": "accepting", "changed_by": "李受理", "role": "cargo_acceptor", "notes": "货站受理"},
        {"entity_type": "cargo_order", "entity_idx": 5, "from_status": "accepting", "to_status": "supplementing", "changed_by": "李受理", "role": "cargo_acceptor", "notes": "缺少收货方授权委托书，通知补材料"},

        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": None, "to_status": "created", "changed_by": "系统", "role": "system", "notes": "航班SZ1234到港，自动生成货单"},
        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": "created", "to_status": "accepting", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "货站受理，标记紧急"},
        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": "accepting", "to_status": "pending_security", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "移交安检"},
        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": "pending_security", "to_status": "inspecting", "changed_by": "陈安检", "role": "security_inspector", "notes": "开始安检"},
        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": "inspecting", "to_status": "pending_allocation", "changed_by": "陈安检", "role": "security_inspector", "notes": "安检通过，移交库区"},
        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": "pending_allocation", "to_status": "allocated", "changed_by": "李明", "role": "warehouse_dispatcher", "notes": "分配库位C-03-02"},
        {"entity_type": "cargo_order", "entity_idx": 4, "from_status": "allocated", "to_status": "allocation_changed", "changed_by": "李明", "role": "warehouse_dispatcher", "notes": "冷链仓已满，库位从C-03-02调整到D-02-01，已通知提货预约方"},

        {"entity_type": "cargo_order", "entity_idx": 6, "from_status": None, "to_status": "created", "changed_by": "系统", "role": "system", "notes": "航班3U9012到港，自动生成货单"},
        {"entity_type": "cargo_order", "entity_idx": 6, "from_status": "created", "to_status": "accepting", "changed_by": "李受理", "role": "cargo_acceptor", "notes": "货站受理，标记紧急"},
        {"entity_type": "cargo_order", "entity_idx": 6, "from_status": "accepting", "to_status": "pending_security", "changed_by": "李受理", "role": "cargo_acceptor", "notes": "移交安检"},
        {"entity_type": "cargo_order", "entity_idx": 6, "from_status": "pending_security", "to_status": "inspecting", "changed_by": "陈安检", "role": "security_inspector", "notes": "开始安检"},
        {"entity_type": "cargo_order", "entity_idx": 6, "from_status": "inspecting", "to_status": "pending_allocation", "changed_by": "陈安检", "role": "security_inspector", "notes": "安检通过，移交库区"},
        {"entity_type": "cargo_order", "entity_idx": 6, "from_status": "pending_allocation", "to_status": "allocated", "changed_by": "王建国", "role": "warehouse_dispatcher", "notes": "分配库位B-01-05，危险品专区"},

        {"entity_type": "cargo_order", "entity_idx": 7, "from_status": None, "to_status": "created", "changed_by": "系统", "role": "system", "notes": "航班CA8765到港，自动生成货单"},
        {"entity_type": "cargo_order", "entity_idx": 7, "from_status": "created", "to_status": "accepting", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "货站受理"},
        {"entity_type": "cargo_order", "entity_idx": 7, "from_status": "accepting", "to_status": "pending_security", "changed_by": "张受理", "role": "cargo_acceptor", "notes": "移交安检"},
    ]

    for ld in logs_data:
        entity_idx = ld.pop("entity_idx")
        log = StatusChangeLog(
            entity_id=orders[entity_idx].id,
            **ld,
        )
        db.add(log)

    db.commit()
