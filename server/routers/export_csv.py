import csv
import io
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from database import get_db

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/orders")
def export_orders(
    status: str | None = Query(None),
    customer: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    conn = get_db()
    try:
        conditions = []
        params = []
        if status:
            conditions.append("status = ?")
            params.append(status)
        if customer:
            conditions.append("customer_name LIKE ?")
            params.append(f"%{customer}%")
        if date_from:
            conditions.append("created_at >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("created_at <= ?")
            params.append(date_to)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        rows = conn.execute(
            f"SELECT * FROM orders{where} ORDER BY created_at DESC",
            params,
        ).fetchall()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "id", "order_no", "customer_name", "customer_phone",
            "product_name", "product_spec", "quantity", "unit",
            "unit_price", "total_amount", "note", "status",
            "created_at", "updated_at",
        ])
        for r in rows:
            writer.writerow([
                r["id"], r["order_no"], r["customer_name"], r["customer_phone"],
                r["product_name"], r["product_spec"], r["quantity"], r["unit"],
                r["unit_price"], r["total_amount"], r["note"], r["status"],
                r["created_at"], r["updated_at"],
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=orders.csv"},
        )
    finally:
        conn.close()


@router.get("/arrivals")
def export_arrivals(
    status: str | None = Query(None),
    order_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
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
        rows = conn.execute(
            f"SELECT a.*, o.order_no, o.product_name, o.product_spec FROM arrivals a JOIN orders o ON a.order_id=o.id{where} ORDER BY a.created_at DESC",
            params,
        ).fetchall()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "id", "arrival_no", "order_id", "order_no", "product_name",
            "product_spec", "order_note", "ordered_quantity", "actual_quantity",
            "unit", "arrival_note", "exception_note", "status",
            "created_at", "updated_at",
        ])
        for r in rows:
            writer.writerow([
                r["id"], r["arrival_no"], r["order_id"], r["order_no"],
                r["product_name"], r["product_spec"], r["order_note"],
                r["ordered_quantity"], r["actual_quantity"], r["unit"],
                r["arrival_note"], r["exception_note"], r["status"],
                r["created_at"], r["updated_at"],
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=arrivals.csv"},
        )
    finally:
        conn.close()
