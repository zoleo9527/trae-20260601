from fastapi import APIRouter, HTTPException, Query
from database import get_db, insert_log
from models import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def row_to_notification(row) -> NotificationResponse:
    return NotificationResponse(
        id=row["id"],
        type=row["type"],
        title=row["title"],
        content=row["content"],
        order_id=row["order_id"],
        order_no=row["order_no"],
        arrival_id=row["arrival_id"],
        arrival_no=row["arrival_no"],
        is_read=bool(row["is_read"]),
        created_at=row["created_at"],
    )


@router.get("")
def list_notifications(
    type: str | None = Query(None),
    is_read: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_db()
    try:
        conditions = []
        params = []
        if type:
            conditions.append("type = ?")
            params.append(type)
        if is_read is not None:
            conditions.append("is_read = ?")
            params.append(is_read)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        total = conn.execute(f"SELECT COUNT(*) FROM notifications{where}", params).fetchone()[0]
        offset = (page - 1) * page_size
        rows = conn.execute(
            f"SELECT * FROM notifications{where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()
        items = [row_to_notification(r) for r in rows]
        return {"items": items, "total": total}
    finally:
        conn.close()


@router.get("/unread-count")
def unread_count():
    conn = get_db()
    try:
        count = conn.execute("SELECT COUNT(*) FROM notifications WHERE is_read = 0").fetchone()[0]
        return {"count": count}
    finally:
        conn.close()


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(notification_id: int):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM notifications WHERE id=?", (notification_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="通知不存在")
        if row["is_read"]:
            return row_to_notification(row)
        conn.execute("UPDATE notifications SET is_read=1 WHERE id=?", (notification_id,))
        insert_log(conn, "notification", notification_id, "read", f"标记通知已读：{row['title']}")
        conn.commit()
        row = conn.execute("SELECT * FROM notifications WHERE id=?", (notification_id,)).fetchone()
        return row_to_notification(row)
    finally:
        conn.close()


@router.post("/mark-all-read")
def mark_all_read():
    conn = get_db()
    try:
        rows = conn.execute("SELECT id, title FROM notifications WHERE is_read=0").fetchall()
        conn.execute("UPDATE notifications SET is_read=1 WHERE is_read=0")
        for r in rows:
            insert_log(conn, "notification", r["id"], "read", f"批量标记已读：{r['title']}")
        conn.commit()
        return {"message": "全部标记已读", "count": len(rows)}
    finally:
        conn.close()
