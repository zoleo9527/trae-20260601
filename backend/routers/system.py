from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import (
    User, FruitBatch, GradingRecord, InventoryItem,
    InventoryChangeLog, Reservation, Complaint, PickingLoss, ProcessingLog
)
from ..schemas import DashboardStats

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    pending_grading = db.query(FruitBatch).filter(FruitBatch.status.in_(["picked", "grading"])).count()
    pending_warehousing = db.query(FruitBatch).filter(FruitBatch.status == "graded").count()
    pending_complaints = db.query(Complaint).filter(Complaint.status.in_(["pending", "processing"])).count()
    overbooked = db.query(Reservation).filter(Reservation.overbook_flag == 1, Reservation.status != "completed").count()
    today = __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    today_batches = db.query(FruitBatch).filter(FruitBatch.picking_date == today).count()
    total_inv = sum(i.quantity for i in db.query(InventoryItem).all())
    return DashboardStats(
        pending_grading=pending_grading,
        pending_warehousing=pending_warehousing,
        pending_complaints=pending_complaints,
        overbooked_reservations=overbooked,
        today_batches=today_batches,
        total_inventory_value=total_inv,
    )


@router.post("/reset")
def reset_data():
    db = SessionLocal()
    try:
        db.query(ProcessingLog).delete()
        db.query(InventoryChangeLog).delete()
        db.query(PickingLoss).delete()
        db.query(GradingRecord).delete()
        db.query(Complaint).delete()
        db.query(Reservation).delete()
        db.query(InventoryItem).delete()
        db.query(FruitBatch).delete()
        db.query(User).delete()
        db.commit()
    finally:
        db.close()

    db = SessionLocal()
    try:
        _seed_data(db)
        db.commit()
    finally:
        db.close()

    return {"message": "数据已重置，样例数据已重新加载"}


def _seed_data(db: Session):
    now = __import__("datetime").datetime.now
    dt = now()

    users = [
        User(username="kefu01", display_name="李客服", role="customer_service"),
        User(username="xiangdao01", display_name="王向导", role="picking_guide"),
        User(username="cangku01", display_name="张仓管", role="warehouse"),
    ]
    for u in users:
        db.add(u)
    db.flush()

    batches_data = [
        {"no": "PK-20260608-001", "fruit": "水蜜桃", "date": "2026-06-08", "area": "东坡桃园", "qty": 320.0, "guide": "王向导", "status": "stored"},
        {"no": "PK-20260609-001", "fruit": "巨峰葡萄", "date": "2026-06-09", "area": "北坡葡萄园", "qty": 280.0, "guide": "王向导", "status": "stored"},
        {"no": "PK-20260609-002", "fruit": "水蜜桃", "date": "2026-06-09", "area": "东坡桃园", "qty": 150.0, "guide": "王向导", "status": "graded"},
        {"no": "PK-20260610-001", "fruit": "阳光玫瑰", "date": "2026-06-10", "area": "南湖葡萄园", "qty": 200.0, "guide": "王向导", "status": "grading"},
        {"no": "PK-20260610-002", "fruit": "水蜜桃", "date": "2026-06-10", "area": "东坡桃园", "qty": 180.0, "guide": "王向导", "status": "picked"},
    ]
    batches = []
    for bd in batches_data:
        b = FruitBatch(
            batch_no=bd["no"], fruit_type=bd["fruit"], picking_date=bd["date"],
            picking_area=bd["area"], quantity_picked=bd["qty"], unit="斤",
            guide_name=bd["guide"], status=bd["status"],
        )
        db.add(b)
        db.flush()
        batches.append(b)

    grading_data = [
        {"batch_idx": 0, "a": 120, "b": 100, "c": 60, "d": 40, "status": "confirmed", "grader": "张仓管",
         "notes": "[06-08 14:20] 张仓管: 水蜜桃成熟度好，A级占比高\n[06-08 14:25] 张仓管: 东坡桃园土壤肥沃，果形端正\n[06-08 14:35] 张仓管: C级多为运输碰伤，D级已破损不可售，建议增加防震包装\n[06-08 15:00] 张仓管: 确认分级，库存已更新"},
        {"batch_idx": 1, "a": 80, "b": 90, "c": 60, "d": 50, "status": "confirmed", "grader": "张仓管",
         "notes": "[06-09 10:15] 张仓管: 巨峰葡萄整体品质良好，颗粒饱满\n[06-09 10:30] 张仓管: 部分果穗有日灼痕，归入C级\n[06-09 10:40] 张仓管: D级为落果，需注意采摘手法培训，建议向导采摘时用剪刀\n[06-09 11:00] 张仓管: 确认分级入库"},
        {"batch_idx": 2, "a": 50, "b": 45, "c": 30, "d": 25, "status": "confirmed", "grader": "张仓管",
         "notes": "[06-09 16:00] 张仓管: 下午采摘成熟度偏高，A级略少\n[06-09 16:15] 张仓管: 下午阳光强烈导致部分果实表面有灼伤，归入B级\n[06-09 16:30] 张仓管: 建议后续下午采摘安排在3点后，避免日灼"},
        {"batch_idx": 3, "a": 70, "b": 60, "c": 40, "d": 30, "status": "pending", "grader": "",
         "notes": "[06-10 09:30] 张仓管: 阳光玫瑰分级进行中\n[06-10 09:45] 张仓管: 部分颗粒偏小需重新确认分级标准\n[06-10 10:00] 张仓管: 与主管电话确认，小颗粒统一归入B级"},
    ]
    for gd in grading_data:
        batch = batches[gd["batch_idx"]]
        gr = GradingRecord(
            batch_id=batch.id, grade_a_qty=gd["a"], grade_b_qty=gd["b"],
            grade_c_qty=gd["c"], grade_d_qty=gd["d"], status=gd["status"],
            grader_name=gd["grader"], grading_notes=gd["notes"],
        )
        db.add(gr)
        db.flush()

        log = ProcessingLog(
            entity_type="grading_record", entity_id=gr.id,
            action="创建分级记录" if gd["status"] == "pending" else "确认分级",
            operator_name=gd["grader"] or "张仓管", operator_role="warehouse",
            notes=gd["notes"].split("\n")[0].split("] ")[-1] if gd["notes"] else "",
            batch_id=batch.id, grading_id=gr.id,
        )
        db.add(log)

        if gd["status"] == "confirmed":
            for grade_name, qty in [("A", gd["a"]), ("B", gd["b"]), ("C", gd["c"]), ("D", gd["d"])]:
                if qty <= 0:
                    continue
                inv = db.query(InventoryItem).filter(
                    InventoryItem.fruit_type == batch.fruit_type,
                    InventoryItem.grade == grade_name
                ).first()
                if not inv:
                    inv = InventoryItem(
                        fruit_type=batch.fruit_type, grade=grade_name,
                        quantity=0, unit="斤", warehouse_location="A区冷库",
                    )
                    db.add(inv)
                    db.flush()
                before = inv.quantity
                inv.quantity = before + qty
                inv.updated_at = now()
                db.add(InventoryChangeLog(
                    inventory_item_id=inv.id, change_type="grading_in",
                    quantity_before=before, quantity_after=inv.quantity,
                    change_amount=qty, reason=f"批次{batch.batch_no}分级入库",
                    operator_name=gd["grader"], operator_role="warehouse",
                    related_batch_no=batch.batch_no,
                ))

    for batch in batches:
        actions = {
            "picked": ["创建采摘批次"],
            "grading": ["创建采摘批次", "开始分级"],
            "graded": ["创建采摘批次", "开始分级", "完成分级"],
            "warehousing": ["创建采摘批次", "开始分级", "完成分级", "开始入库"],
            "stored": ["创建采摘批次", "开始分级", "完成分级", "开始入库", "确认入库"],
        }
        for action in actions.get(batch.status, []):
            db.add(ProcessingLog(
                entity_type="fruit_batch", entity_id=batch.id,
                action=action, operator_name="王向导" if "采摘" in action else "张仓管",
                operator_role="picking_guide" if "采摘" in action else "warehouse",
                notes=f"批次{batch.batch_no}{action}",
                batch_id=batch.id,
            ))

    reservations_data = [
        {"name": "赵先生", "phone": "13800001111", "date": "2026-06-10", "fruit": "水蜜桃", "qty": 50, "status": "confirmed", "actual": 45, "overbook": 0, "handler": "李客服",
         "notes": "[06-09 18:00] 系统: 预约50斤，当前AB级库存170斤\n[06-09 18:05] 李客服: 确认有库存，已通知向导\n[06-10 08:30] 李客服: 游客已到园，确认预约\n[06-10 08:35] 李客服: 向导反映实际可摘约45斤，部分区域未成熟"},
        {"name": "钱女士", "phone": "13900002222", "date": "2026-06-10", "fruit": "阳光玫瑰", "qty": 80, "status": "pending", "actual": 0, "overbook": 0, "handler": "",
         "notes": "[06-10 07:00] 系统: 预约80斤，当前AB级库存130斤\n[06-10 07:05] 系统: 当日阳光玫瑰预约量未超限"},
        {"name": "孙先生", "phone": "13700003333", "date": "2026-06-10", "fruit": "水蜜桃", "qty": 100, "status": "pending", "actual": 0, "overbook": 1, "handler": "",
         "notes": "[06-10 07:15] 系统: 预约100斤，当前AB级库存170斤\n[06-10 07:15] 系统: ⚠️ 水蜜桃当日预约总量150斤已超AB级库存上限\n[06-10 07:20] 李客服: 收到超量预警，需确认是否调配库存"},
        {"name": "李大姐", "phone": "13600004444", "date": "2026-06-09", "fruit": "巨峰葡萄", "qty": 30, "status": "completed", "actual": 28, "overbook": 0, "handler": "李客服",
         "notes": "[06-09 09:00] 系统: 预约30斤，当前AB级库存170斤\n[06-09 09:05] 李客服: 确认预约\n[06-09 16:00] 李客服: 完成预约，实际采摘28斤，比预约少2斤\n[06-09 16:05] 李客服: 游客表示已满意，差异因部分果穗未达到预期大小"},
        {"name": "郑女士", "phone": "13500007777", "date": "2026-06-10", "fruit": "水蜜桃", "qty": 60, "status": "pending", "actual": 0, "overbook": 1, "handler": "",
         "notes": "[06-10 08:00] 系统: 预约60斤，当前AB级库存170斤\n[06-10 08:00] 系统: ⚠️ 水蜜桃当日预约总量210斤已超AB级库存上限\n[06-10 08:10] 李客服: 需联系两位超量游客协调改期或减量"},
    ]
    for rd in reservations_data:
        r = Reservation(
            visitor_name=rd["name"], visitor_phone=rd["phone"],
            reserved_date=rd["date"], fruit_type=rd["fruit"],
            reserved_qty=rd["qty"], actual_qty=rd["actual"],
            status=rd["status"], overbook_flag=rd["overbook"],
            notes=rd["notes"], handler_name=rd["handler"],
        )
        db.add(r)
        db.flush()
        action = "创建预约" if rd["status"] == "pending" else "确认预约" if rd["status"] == "confirmed" else "完成预约"
        db.add(ProcessingLog(
            entity_type="reservation", entity_id=r.id,
            action=action + (" [超量预警]" if rd["overbook"] else ""),
            operator_name=rd["handler"] or "system", operator_role="customer_service",
            notes=rd["notes"].split("\n")[0].split("] ")[-1] if rd["notes"] else "",
        ))

    complaints_data = [
        {"name": "赵先生", "phone": "13800001111", "content": "预约了50斤水蜜桃，到园后说只有30斤可摘，浪费了半天时间", "category": "预约问题", "status": "replied",
         "handler": "李客服", "reply": "赵先生您好，已核实当日因前一批次损耗导致库存不足，现为您补偿5斤A级水蜜桃，并赠送下次采摘9折优惠。对此造成的不便深表歉意。",
         "res_id": None, "notes": "[06-10 10:00] 系统: 投诉已提交\n[06-10 10:15] 李客服: 已受理，核实当日水蜜桃库存情况\n[06-10 10:30] 李客服: 确认因PK-20260609-002批次分级损耗导致库存偏少\n[06-10 11:00] 李客服: 已电话回访，游客接受补偿方案"},
        {"name": "周先生", "phone": "13500005555", "content": "孩子被葡萄架划伤，向导没有提醒注意事项，现场也找不到急救箱", "category": "安全问题", "status": "processing",
         "handler": "李客服", "reply": "", "res_id": None, "notes": "[06-10 12:30] 系统: 投诉已提交\n[06-10 12:35] 系统: ⏰ 已超0小时未回复\n[06-10 12:45] 李客服: 已受理，紧急联系向导核实情况\n[06-10 13:00] 李客服: 确认南湖葡萄园区域缺少安全提示牌，已安排补充\n[06-10 13:10] 李客服: 急救箱已送至现场，游客伤口已处理"},
        {"name": "吴女士", "phone": "13400006666", "content": "买的C级桃子回家发现有一半是坏的，分级标准是不是有问题", "category": "品质问题", "status": "pending",
         "handler": "", "reply": "", "res_id": None, "notes": "[06-10 14:00] 系统: 投诉已提交\n[06-10 14:00] 系统: ⚠️ 尚未受理，游客正在等待回复"},
        {"name": "陈先生", "phone": "13300008888", "content": "预约时说有100斤水蜜桃可以摘，结果到了说超量了只能摘40斤，白跑一趟", "category": "预约问题", "status": "pending",
         "handler": "", "reply": "", "res_id": None, "notes": "[06-10 15:00] 系统: 投诉已提交\n[06-10 15:00] 系统: ⚠️ 尚未受理，关联超量预约问题\n[06-10 15:05] 系统: 该游客对应孙先生预约记录，预约量100斤，超量标记"},
    ]
    for cd in complaints_data:
        c = Complaint(
            visitor_name=cd["name"], visitor_phone=cd["phone"],
            content=cd["content"], category=cd["category"],
            status=cd["status"], handler_name=cd["handler"],
            reply_content=cd["reply"], related_reservation_id=cd["res_id"],
        )
        db.add(c)
        db.flush()
        if cd["notes"]:
            for line in cd["notes"].split("\n"):
                if "受理" in line:
                    db.add(ProcessingLog(
                        entity_type="complaint", entity_id=c.id,
                        action="受理投诉", operator_name=cd["handler"], operator_role="customer_service",
                        notes=line.split("] ")[-1] if "] " in line else line,
                        complaint_id=c.id,
                    ))
                    break
            if cd["status"] == "replied":
                db.add(ProcessingLog(
                    entity_type="complaint", entity_id=c.id,
                    action="回复投诉", operator_name=cd["handler"], operator_role="customer_service",
                    notes=f"回复: {cd['reply'][:80]}",
                    complaint_id=c.id,
                ))

    losses_data = [
        {"batch_idx": 0, "expected": 320, "actual": 320, "reason": "当日采摘损耗低，运输防护到位，东坡桃园路途较近", "reporter": "王向导"},
        {"batch_idx": 1, "expected": 280, "actual": 270, "reason": "葡萄运输中部分脱落，建议增加防震包装，北坡路段颠簸较大", "reporter": "王向导"},
        {"batch_idx": 2, "expected": 150, "actual": 150, "reason": "短途运输损耗忽略不计，采摘手法改进后损耗明显下降", "reporter": "王向导"},
    ]
    for ld in losses_data:
        batch = batches[ld["batch_idx"]]
        loss_qty = ld["expected"] - ld["actual"]
        loss_rate = (loss_qty / ld["expected"] * 100) if ld["expected"] > 0 else 0
        loss = PickingLoss(
            batch_id=batch.id, expected_qty=ld["expected"],
            actual_qty=ld["actual"], loss_qty=loss_qty,
            loss_rate=loss_rate, loss_reason=ld["reason"],
            reporter_name=ld["reporter"],
        )
        db.add(loss)
        db.flush()
        db.add(ProcessingLog(
            entity_type="picking_loss", entity_id=loss.id,
            action="上报采摘损耗",
            operator_name=ld["reporter"], operator_role="picking_guide",
            notes=f"批次{batch.batch_no}，损耗{loss_qty}斤({loss_rate:.1f}%)",
            batch_id=batch.id,
        ))

    db.flush()
