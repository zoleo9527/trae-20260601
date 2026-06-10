from fastapi import APIRouter, HTTPException, Query
from database import get_db, generate_no, insert_log, insert_notification
from models import ArrivalCreate, ArrivalConfirm, ArrivalResponse, AttachmentResponse

router = APIRouter(prefix="/api/arrivals", tags=["arrivals"])


def row_to_attachment(row) -> AttachmentResponse:
    return AttachmentResponse(
        id=row["id"],
        entity_type=row["entity_type"],
        entity_id=row["entity_id"],
        file_name=row["file_name"],
        note=row["note"],
        status=row["status"],
        created_at=row["created_at"],
    )


def get_arrival_attachments(conn, arrival_id: int) -> list[AttachmentResponse]:
    rows = conn.execute(
        "SELECT * FROM attachments WHERE entity_type='arrival' AND entity_id=? ORDER BY id",
        (arrival_id,),
    ).fetchall()
    return [row_to_attachment(r) for r in rows]


def row_to_arrival(row, attachments=None) -> ArrivalResponse:
    return ArrivalResponse(
        id=row["id"],
        arrival_no=row["arrival_no"],
        order_id=row["order_id"],
        order_no=row["order_no"],
        product_name=row["product_name"],
        product_spec=row["product_spec"],
        order_note=row["order_note"],
        ordered_quantity=row["ordered_quantity"],
        actual_quantity=row["actual_quantity"],
        unit=row["unit"],
        arrival_note=row["arrival_note"],
        exception_note=row["exception_note"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        attachments=attachments or [],
    )


@router.get("")
def list_arrivals(
    status: str | None = Query(None),
    order_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_db()
    try:
        conditions = []
        params = []
        if status:
            conditions.append("a.status = ?")
            params.append(status)
        if order_id is not None:
            conditions.append("a.order_id = ?")
            params.append(order_id)
        if date_from:
            conditions.append("a.created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("a.created_at <= ?")
            params.append(date_to)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        total = conn.execute(f"SELECT COUNT(*) FROM arrivals a JOIN orders o ON a.order_id=o.id{where}", params).fetchone()[0]
        offset = (page - 1) * page_size
        rows = conn.execute(
            f"SELECT a.*, o.order_no, o.product_name, o.product_spec FROM arrivals a JOIN orders o ON a.order_id=o.id{where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()
        result = []
        for row in rows:
            attachments = get_arrival_attachments(conn, row["id"])
            result.append(row_to_arrival(row, attachments))
        return {"items": result, "total": total}
    finally:
        conn.close()


@router.post("", response_model=ArrivalResponse, status_code=201)
def create_arrival(data: ArrivalCreate):
    conn = get_db()
    try:
        order = conn.execute("SELECT * FROM orders WHERE id=?", (data.order_id,)).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="关联订单不存在")
        arrival_no = generate_no(conn, "DH")
        cursor = conn.execute(
            "INSERT INTO arrivals (arrival_no, order_id, order_note, ordered_quantity, actual_quantity, unit, arrival_note, exception_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                arrival_no,
                data.order_id,
                order["note"],
                order["quantity"],
                data.actual_quantity,
                order["unit"],
                data.arrival_note or "",
                data.exception_note or "",
            ),
        )
        arrival_id = cursor.lastrowid
        order_attachments = conn.execute(
            "SELECT * FROM attachments WHERE entity_type='order' AND entity_id=?",
            (data.order_id,),
        ).fetchall()
        for att in order_attachments:
            conn.execute(
                "INSERT INTO attachments (entity_type, entity_id, file_name, note, status) VALUES (?, ?, ?, ?, ?)",
                ("arrival", arrival_id, att["file_name"], att["note"], att["status"]),
            )
        insert_log(conn, "arrival", arrival_id, "create", f"创建到货单 {arrival_no}，关联订单 {order['order_no']}")
        conn.commit()
        row = conn.execute(
            "SELECT a.*, o.order_no, o.product_name, o.product_spec FROM arrivals a JOIN orders o ON a.order_id=o.id WHERE a.id=?",
            (arrival_id,),
        ).fetchone()
        attachments = get_arrival_attachments(conn, arrival_id)
        return row_to_arrival(row, attachments)
    finally:
        conn.close()


@router.get("/{arrival_id}", response_model=ArrivalResponse)
def get_arrival(arrival_id: int):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT a.*, o.order_no, o.product_name, o.product_spec FROM arrivals a JOIN orders o ON a.order_id=o.id WHERE a.id=?",
            (arrival_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="到货单不存在")
        attachments = get_arrival_attachments(conn, arrival_id)
        return row_to_arrival(row, attachments)
    finally:
        conn.close()


@router.patch("/{arrival_id}/confirm", response_model=ArrivalResponse)
def confirm_arrival(arrival_id: int, data: ArrivalConfirm):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM arrivals WHERE id=?", (arrival_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="到货单不存在")
        if row["status"] != "pending":
            raise HTTPException(status_code=400, detail="只能确认待处理状态的到货单")
        new_status = "confirmed"
        if data.actual_quantity != row["ordered_quantity"]:
            new_status = "exception"
        conn.execute(
            "UPDATE arrivals SET actual_quantity=?, exception_note=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (data.actual_quantity, data.exception_note or "", new_status, arrival_id),
        )
        insert_log(
            conn,
            "arrival",
            arrival_id,
            "confirm",
            f"确认到货，实到数量: {data.actual_quantity}，状态: {new_status}",
        )
        order_id = row["order_id"]
        if new_status == "exception":
            order = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
            insert_notification(
                conn,
                "exception_alert",
                f"到货异常：到货单 {row['arrival_no']} 数量不符",
                f"订单：{order['order_no'] if order else ''}，订货：{row['ordered_quantity']}{row['unit']}，实到：{data.actual_quantity}{row['unit']}，异常说明：{data.exception_note or '未填写'}",
                order_id=order_id,
                order_no=order['order_no'] if order else '',
                arrival_id=arrival_id,
                arrival_no=row["arrival_no"],
            )
            notif_row = conn.execute("SELECT id FROM notifications ORDER BY id DESC LIMIT 1").fetchone()
            if notif_row:
                insert_log(conn, "notification", notif_row["id"], "notify", f"生成异常提醒：到货单 {row['arrival_no']} 数量不符")
        order_row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        if order_row and order_row["status"] != "arrived":
            conn.execute(
                "UPDATE orders SET status='arrived', updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (order_id,),
            )
            insert_log(
                conn,
                "order",
                order_id,
                "status_change",
                f"订单状态: {order_row['status']} -> arrived（到货确认触发）",
            )
        conn.commit()
        result = conn.execute(
            "SELECT a.*, o.order_no, o.product_name, o.product_spec FROM arrivals a JOIN orders o ON a.order_id=o.id WHERE a.id=?",
            (arrival_id,),
        ).fetchone()
        attachments = get_arrival_attachments(conn, arrival_id)
        return row_to_arrival(result, attachments)
    finally:
        conn.close()
