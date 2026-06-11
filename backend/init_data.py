from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import models
from database import SessionLocal, engine, Base


Base.metadata.create_all(bind=engine)


def init_users(db: Session):
    users_data = [
        {"username": "zhang_guizhang", "name": "张柜长", "role": "counter_manager", "floor": "2F", "brand": "雅诗兰黛"},
        {"username": "li_guizhang", "name": "李柜长", "role": "counter_manager", "floor": "2F", "brand": "兰蔻"},
        {"username": "wang_louceng", "name": "王主管", "role": "floor_supervisor", "floor": "2F"},
        {"username": "chen_dundao", "name": "陈督导", "role": "brand_supervisor", "brand": "雅诗兰黛"},
        {"username": "liu_dundao", "name": "刘督导", "role": "brand_supervisor", "brand": "兰蔻"},
    ]
    users = []
    for data in users_data:
        u = db.query(models.User).filter(models.User.username == data["username"]).first()
        if not u:
            u = models.User(**data)
            db.add(u)
            db.flush()
        users.append(u)
    db.commit()
    return {u.username: u for u in users}


def init_data(db: Session):
    users = init_users(db)
    zhang = users["zhang_guizhang"]
    li = users["li_guizhang"]
    wang = users["wang_louceng"]
    chen = users["chen_dundao"]
    liu = users["liu_dundao"]

    base_time = datetime.now() - timedelta(days=7)

    allocations_data = [
        {
            "allocation_no": "DB20260604100001AAAA",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "雅诗兰黛-2F-A01",
            "to_counter": "雅诗兰黛-2F-B03",
            "brand": "雅诗兰黛",
            "floor": "2F",
            "goods_code": "EST-001",
            "goods_name": "小棕瓶精华50ml",
            "sku": "SKU-EST-001-50",
            "quantity": 20,
            "unit": "瓶",
            "status": "reviewed",
            "remark": "B柜周庆活动补货",
            "history_remark": "【2026-06-04 10:00】张柜长发起A01→B03调拨20瓶小棕瓶\n【2026-06-04 11:30】王主管审批通过\n【2026-06-04 14:00】陈督导确认发货\n【2026-06-05 09:15】B柜李柜长复核实收20瓶，无差异",
            "version": 1,
            "is_modified": False,
            "created_by": zhang.id,
            "updated_by": chen.id,
            "created_at": base_time + timedelta(days=3, hours=10),
            "updated_at": base_time + timedelta(days=3, hours=14),
            "reviews": [
                {
                    "review_no": "FH20260605090001BBBB",
                    "actual_quantity": 20,
                    "review_status": "reviewed",
                    "difference_reason": None,
                    "has_allocation_modified": False,
                    "modification_acknowledged": False,
                    "reviewed_by": li.id,
                    "reviewed_at": base_time + timedelta(days=4, hours=9, minutes=15),
                    "created_at": base_time + timedelta(days=4, hours=9, minutes=15),
                }
            ],
            "change_logs": [],
        },
        {
            "allocation_no": "DB20260605140002CCCC",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "兰蔻-2F-C02",
            "to_counter": "兰蔻-2F-D05",
            "brand": "兰蔻",
            "floor": "2F",
            "goods_code": "LAN-008",
            "goods_name": "菁纯面霜60ml",
            "sku": "SKU-LAN-008-60",
            "quantity": 15,
            "unit": "瓶",
            "status": "modified",
            "remark": "D柜VIP客户预定备货",
            "history_remark": "【2026-06-05 14:20】李柜长发起C02→D05调拨15瓶菁纯面霜\n【2026-06-05 15:00】王主管审批通过\n【2026-06-05 16:10】刘督导确认发货\n【2026-06-06 10:30】★李柜长修改：数量15→12，原因：D柜VIP临时取消3瓶订单",
            "version": 2,
            "is_modified": True,
            "last_modified_at": base_time + timedelta(days=5, hours=10, minutes=30),
            "created_by": li.id,
            "updated_by": li.id,
            "created_at": base_time + timedelta(days=4, hours=14, minutes=20),
            "updated_at": base_time + timedelta(days=5, hours=10, minutes=30),
            "reviews": [],
            "change_logs": [
                {
                    "field_name": "quantity",
                    "old_value": "15",
                    "new_value": "12",
                    "change_reason": "D柜VIP客户临时取消3瓶订单，减少调拨数量",
                    "operated_by": li.id,
                    "operated_at": base_time + timedelta(days=5, hours=10, minutes=30),
                }
            ],
        },
        {
            "allocation_no": "DB20260607090003DDDD",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "雅诗兰黛-2F-A01",
            "to_counter": "雅诗兰黛-2F-E07",
            "brand": "雅诗兰黛",
            "floor": "2F",
            "goods_code": "EST-015",
            "goods_name": "口红套装礼盒",
            "sku": "SKU-EST-015-SET",
            "quantity": 30,
            "unit": "套",
            "status": "shipped",
            "remark": "E柜父亲节促销活动备货",
            "history_remark": "【2026-06-07 09:00】张柜长发起A01→E07调拨30套口红礼盒\n【2026-06-07 10:15】王主管审批通过\n【2026-06-07 11:20】陈督导确认发货，待E柜到柜复核",
            "version": 1,
            "is_modified": False,
            "created_by": zhang.id,
            "updated_by": chen.id,
            "created_at": base_time + timedelta(days=6, hours=9),
            "updated_at": base_time + timedelta(days=6, hours=11, minutes=20),
            "reviews": [],
            "change_logs": [],
        },
        {
            "allocation_no": "DB20260608150004EEEE",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "兰蔻-2F-D05",
            "to_counter": "兰蔻-2F-C02",
            "brand": "兰蔻",
            "floor": "2F",
            "goods_code": "LAN-022",
            "goods_name": "粉水400ml",
            "sku": "SKU-LAN-022-400",
            "quantity": 25,
            "unit": "瓶",
            "status": "disputed",
            "remark": "C柜日常补货",
            "history_remark": "【2026-06-08 15:00】李柜长发起D05→C02调拨25瓶粉水\n【2026-06-08 15:45】王主管审批通过\n【2026-06-08 16:30】刘督导确认发货\n【2026-06-09 10:00】★数量差异：张柜长复核实收23瓶，差2瓶，标注待核实",
            "version": 1,
            "is_modified": False,
            "created_by": li.id,
            "updated_by": liu.id,
            "created_at": base_time + timedelta(days=7, hours=15),
            "updated_at": base_time + timedelta(days=8, hours=10),
            "reviews": [
                {
                    "review_no": "FH20260609100002FFFF",
                    "actual_quantity": 23,
                    "review_status": "disputed",
                    "difference_reason": "实收23瓶，与调拨单25瓶相差2瓶。外箱完好，疑发货方少装，待品牌督导刘XX核实。",
                    "has_allocation_modified": False,
                    "modification_acknowledged": False,
                    "reviewed_by": zhang.id,
                    "reviewed_at": base_time + timedelta(days=8, hours=10),
                    "created_at": base_time + timedelta(days=8, hours=10),
                }
            ],
            "change_logs": [],
        },
    ]

    for alloc_data in allocations_data:
        existing = db.query(models.GoodsAllocation).filter(
            models.GoodsAllocation.allocation_no == alloc_data["allocation_no"]
        ).first()
        if existing:
            continue

        reviews_data = alloc_data.pop("reviews", [])
        logs_data = alloc_data.pop("change_logs", [])

        db_alloc = models.GoodsAllocation(**alloc_data)
        db.add(db_alloc)
        db.flush()

        for log in logs_data:
            db_log = models.AllocationChangeLog(allocation_id=db_alloc.id, **log)
            db.add(db_log)

        for rev in reviews_data:
            db_rev = models.CabinetReview(allocation_id=db_alloc.id, **rev)
            db.add(db_rev)

    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_data(db)
        print("初始化数据完成")
    finally:
        db.close()
