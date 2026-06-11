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
            "history_remark": "【2026-06-04 10:00】张柜长发起A01→B03调拨20瓶小棕瓶\n【2026-06-04 11:30】王主管(楼层)审批通过\n【2026-06-04 14:00】陈督导(品牌)确认发货\n【2026-06-05 09:15】B柜李柜长到柜复核实收20瓶，数量一致，无差异",
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
            "allocation_no": "DB20260606150002CCCC",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "兰蔻-2F-C02",
            "to_counter": "兰蔻-2F-D05",
            "brand": "兰蔻",
            "floor": "2F",
            "goods_code": "LAN-008",
            "goods_name": "菁纯面霜60ml",
            "sku": "SKU-LAN-008-60",
            "quantity": 12,
            "unit": "瓶",
            "status": "shipped",
            "remark": "D柜VIP客户预定备货（已改量）",
            "history_remark": "【2026-06-06 14:20】李柜长发起C02→D05调拨15瓶菁纯面霜\n【2026-06-06 15:00】王主管(楼层)审批通过\n【2026-06-06 16:10】刘督导(品牌)确认发货\n【2026-06-07 10:30】★李柜长修改：数量15→12，原因：D柜VIP临时取消3瓶订单\n⚠️ 【责任场景A：被修改待复核】该调拨单发货后被修改，调入柜复核时需确认已知晓变更",
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
                    "change_reason": "D柜VIP客户临时取消3瓶订单，减少调拨数量。已电话告知D柜，但系统需留痕确认。",
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
            "history_remark": "【2026-06-07 09:00】张柜长发起A01→E07调拨30套口红礼盒\n【2026-06-07 10:15】王主管(楼层)审批通过\n【2026-06-07 11:20】陈督导(品牌)确认发货，待E柜到柜复核",
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
            "status": "verified",
            "remark": "C柜日常补货（差异已核实：发货方少装）",
            "history_remark": "【2026-06-08 15:00】李柜长发起D05→C02调拨25瓶粉水\n【2026-06-08 15:45】王主管(楼层)审批通过\n【2026-06-08 16:30】刘督导(品牌)确认发货\n【2026-06-09 10:00】★张柜长到柜复核：实收23瓶，差2瓶，标记差异待核实\n【2026-06-09 14:30】★刘督导(品牌)差异核实：结论=发货方少装，调出仓库出库记录确认少装2瓶，责任归属调出方",
            "version": 1,
            "is_modified": False,
            "created_by": li.id,
            "updated_by": liu.id,
            "created_at": base_time + timedelta(days=7, hours=15),
            "updated_at": base_time + timedelta(days=8, hours=14, minutes=30),
            "reviews": [
                {
                    "review_no": "FH20260609100002FFFF",
                    "actual_quantity": 23,
                    "review_status": "disputed",
                    "difference_reason": "实收23瓶，与调拨单25瓶相差2瓶。外箱完好无破损，封条正常，疑发货方出库时少装。已拍照留证，待品牌督导刘XX核查出库记录和监控。",
                    "has_allocation_modified": False,
                    "modification_acknowledged": False,
                    "reviewed_by": zhang.id,
                    "reviewed_at": base_time + timedelta(days=8, hours=10),
                    "created_at": base_time + timedelta(days=8, hours=10),
                }
            ],
            "change_logs": [],
            "verifications": [
                {
                    "verification_no": "HS20260609143001XXXX",
                    "conclusion": "sender_short",
                    "responsibility": "经核查调出仓库出库记录和监控，确认D05仓出库时仅装了23瓶，少装2瓶。责任归属调出方(兰蔻D05柜)，需补发2瓶。",
                    "processing_remark": "已要求D05柜补发2瓶粉水，预计次日送达C02柜。补发后将更新调拨单实收数量。",
                    "verified_by": liu.id,
                    "verified_at": base_time + timedelta(days=8, hours=14, minutes=30),
                    "created_at": base_time + timedelta(days=8, hours=14, minutes=30),
                }
            ],
        },
        {
            "allocation_no": "DB20260610110005GGGG",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "雅诗兰黛-2F-B03",
            "to_counter": "雅诗兰黛-2F-A01",
            "brand": "雅诗兰黛",
            "floor": "2F",
            "goods_code": "EST-031",
            "goods_name": "智妍面霜75ml",
            "sku": "SKU-EST-031-75",
            "quantity": 8,
            "unit": "瓶",
            "status": "modified",
            "remark": "A柜回补（修改后待楼层重审）",
            "history_remark": "【2026-06-10 11:00】张柜长发起B03→A01调拨10瓶智妍面霜\n【2026-06-10 11:30】张柜长修改：数量10→8，原因：B柜库存盘点后实际可调拨量为8瓶\n【待】王主管(楼层)重新审批",
            "version": 2,
            "is_modified": True,
            "last_modified_at": base_time + timedelta(days=9, hours=11, minutes=30),
            "created_by": zhang.id,
            "updated_by": zhang.id,
            "created_at": base_time + timedelta(days=9, hours=11),
            "updated_at": base_time + timedelta(days=9, hours=11, minutes=30),
            "reviews": [],
            "change_logs": [
                {
                    "field_name": "quantity",
                    "old_value": "10",
                    "new_value": "8",
                    "change_reason": "B柜盘点后实际可调拨量为8瓶，原预估10瓶有误",
                    "operated_by": zhang.id,
                    "operated_at": base_time + timedelta(days=9, hours=11, minutes=30),
                }
            ],
        },
        {
            "allocation_no": "DB20260612090006HHHH",
            "idempotent_key": f"init-{uuid.uuid4().hex}",
            "from_counter": "雅诗兰黛-2F-A01",
            "to_counter": "雅诗兰黛-2F-E07",
            "brand": "雅诗兰黛",
            "floor": "2F",
            "goods_code": "EST-020",
            "goods_name": "沁水粉底液30ml",
            "sku": "SKU-EST-020-30",
            "quantity": 15,
            "unit": "瓶",
            "status": "verified",
            "remark": "E柜补货（差异已核实：收货方误报）",
            "history_remark": "【2026-06-12 09:00】张柜长发起A01→E07调拨15瓶沁水粉底液\n【2026-06-12 09:30】王主管(楼层)审批通过\n【2026-06-12 10:15】陈督导(品牌)确认发货\n【2026-06-12 14:00】★E柜复核：实报13瓶，差2瓶，标记差异待核实\n【2026-06-12 16:00】★陈督导(品牌)差异核实：结论=收货方误报，调出仓出库15瓶无误，E柜拆箱后2瓶放错柜位",
            "version": 1,
            "is_modified": False,
            "created_by": zhang.id,
            "updated_by": chen.id,
            "created_at": base_time + timedelta(days=10, hours=9),
            "updated_at": base_time + timedelta(days=10, hours=16),
            "reviews": [
                {
                    "review_no": "FH20260612140001IIII",
                    "actual_quantity": 13,
                    "review_status": "disputed",
                    "difference_reason": "实收13瓶，调拨单15瓶，差2瓶。外箱完好，但E柜拆箱后可能将2瓶放到了隔壁兰蔻柜位，需品牌督导核实出库。",
                    "has_allocation_modified": False,
                    "modification_acknowledged": False,
                    "reviewed_by": zhang.id,
                    "reviewed_at": base_time + timedelta(days=10, hours=14),
                    "created_at": base_time + timedelta(days=10, hours=14),
                }
            ],
            "change_logs": [],
            "verifications": [
                {
                    "verification_no": "HS20260612160001JJJJ",
                    "conclusion": "receiver_false",
                    "responsibility": "经核查A01仓出库记录和发货监控，确认15瓶全部装箱发出。E柜拆箱后将2瓶误放兰蔻柜位，属于收货方内部管理问题。责任归属E柜(收货方)。",
                    "processing_remark": "E柜柜长已确认在兰蔻柜位找到2瓶沁水粉底液，内部调整后数量一致。提醒E柜加强拆箱上架核对流程。",
                    "verified_by": chen.id,
                    "verified_at": base_time + timedelta(days=10, hours=16),
                    "created_at": base_time + timedelta(days=10, hours=16),
                }
            ],
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
        verifications_data = alloc_data.pop("verifications", [])

        db_alloc = models.GoodsAllocation(**alloc_data)
        db.add(db_alloc)
        db.flush()

        for log in logs_data:
            db_log = models.AllocationChangeLog(allocation_id=db_alloc.id, **log)
            db.add(db_log)

        for rev in reviews_data:
            db_rev = models.CabinetReview(allocation_id=db_alloc.id, **rev)
            db.add(db_rev)

        for vf in verifications_data:
            db_vf = models.DisputeVerification(allocation_id=db_alloc.id, **vf)
            db.add(db_vf)

    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_data(db)
        print("初始化数据完成")
    finally:
        db.close()
