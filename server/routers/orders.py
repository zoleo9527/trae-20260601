from fastapi import APIRouter, HTTPException, Query
from database import get_db, generate_no, insert_log, insert_notification
from models import OrderCreate, OrderUpdate, OrderStatusUpdate, OrderResponse, AttachmentResponse

router = APIRouter(prefix="/api/orders", tags=["orders"])

STATUS_ORDER = ["pending", "confirmed", "shipped", "arrived"]


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


def row_to_order(row, attachments=None) -> OrderResponse:
    return OrderResponse(
        id=row["id"],
        order_no=row["order_no"],
        customer_name=row["customer_name"],
        customer_phone=row["customer_phone"],
        product_name=row["product_name"],
        product_spec=row["product_spec"],
        quantity=row["quantity"],
        unit=row["unit"],
        unit_price=row["unit_price"],
        total_amount=row["total_amount"],
        note=row["note"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        attachments=attachments or [],
    )


def get_order_attachments(conn, order_id: int) -> list[AttachmentResponse]:
    rows = conn.execute(
        "SELECT * FROM attachments WHERE entity_type='order' AND entity_id=? ORDER BY id",
        (order_id,),
    ).fetchall()
    return [row_to_attachment(r) for r in rows]


@router.get("")
def list_orders(
    status: str | None = Query(None),
    customer: str | None = Query(None),
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
            conditions.append("o.status = ?")
            params.append(status)
        if customer:
            conditions.append("o.customer_name LIKE ?")
            params.append(f"%{customer}%")
        if date_from:
            conditions.append("o.created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("o.created_at <= ?")
            params.append(date_to)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        total = conn.execute(f"SELECT COUNT(*) FROM orders o{where}", params).fetchone()[0]
        offset = (page - 1) * page_size
        rows = conn.execute(
            f"SELECT o.* FROM orders o{where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()
        result = []
        for row in rows:
            attachments = get_order_attachments(conn, row["id"])
            result.append(row_to_order(row, attachments))
        return {"items": result, "total": total}
    finally:
        conn.close()


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(data: OrderCreate):
    conn = get_db()
    try:
        order_no = generate_no(conn, "FH")
        total_amount = data.quantity * (data.unit_price or 0)
        cursor = conn.execute(
            "INSERT INTO orders (order_no, customer_name, customer_phone, product_name, product_spec, quantity, unit, unit_price, total_amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                order_no,
                data.customer_name,
                data.customer_phone or "",
                data.product_name,
                data.product_spec or "",
                data.quantity,
                data.unit or "kg",
                data.unit_price or 0,
                total_amount,
                data.note or "",
            ),
        )
        order_id = cursor.lastrowid
        insert_log(conn, "order", order_id, "create", f"创建订单 {order_no}")
        conn.commit()
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        attachments = get_order_attachments(conn, order_id)
        return row_to_order(row, attachments)
    finally:
        conn.close()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="订单不存在")
        attachments = get_order_attachments(conn, order_id)
        return row_to_order(row, attachments)
    finally:
        conn.close()


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, data: OrderUpdate):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="订单不存在")
        updates = []
        params = []
        fields = data.model_dump(exclude_none=True)
        for key, value in fields.items():
            updates.append(f"{key} = ?")
            params.append(value)
        if not updates:
            attachments = get_order_attachments(conn, order_id)
            return row_to_order(row, attachments)
        if "quantity" in fields or "unit_price" in fields:
            qty = fields.get("quantity", row["quantity"])
            price = fields.get("unit_price", row["unit_price"])
            updates.append("total_amount = ?")
            params.append(qty * price)
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(order_id)
        conn.execute(
            f"UPDATE orders SET {', '.join(updates)} WHERE id=?", params
        )
        insert_log(conn, "order", order_id, "update", f"更新订单字段: {', '.join(fields.keys())}")
        conn.commit()
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        attachments = get_order_attachments(conn, order_id)
        return row_to_order(row, attachments)
    finally:
        conn.close()


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, data: OrderStatusUpdate):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="订单不存在")
        current_status = row["status"]
        new_status = data.status.value
        current_idx = STATUS_ORDER.index(current_status) if current_status in STATUS_ORDER else -1
        new_idx = STATUS_ORDER.index(new_status) if new_status in STATUS_ORDER else -1
        if new_idx <= current_idx:
            raise HTTPException(status_code=400, detail=f"状态只能向前推进: {current_status} -> {new_status} 不合法")
        conn.execute(
            "UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (new_status, order_id),
        )
        insert_log(conn, "order", order_id, "status_change", f"订单状态: {current_status} -> {new_status}")
        if new_status == "shipped":
            insert_notification(
                conn,
                "arrival_reminder",
                f"待到货提醒：订单 {row['order_no']} 已发货",
                f"客户：{row['customer_name']}，产品：{row['product_name']}，数量：{row['quantity']}{row['unit']}，请关注到货情况",
                order_id=order_id,
                order_no=row["order_no"],
            )
        conn.commit()
        row = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
        attachments = get_order_attachments(conn, order_id)
        return row_to_order(row, attachments)
    finally:
        conn.close()
