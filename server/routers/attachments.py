from fastapi import APIRouter, HTTPException
from database import get_db, insert_log
from models import AttachmentCreate, AttachmentUpdate, AttachmentResponse

router = APIRouter(prefix="/api/attachments", tags=["attachments"])


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


@router.post("", response_model=AttachmentResponse, status_code=201)
def create_attachment(data: AttachmentCreate):
    conn = get_db()
    try:
        if data.entity_type.value == "order":
            row = conn.execute("SELECT id FROM orders WHERE id=?", (data.entity_id,)).fetchone()
        else:
            row = conn.execute("SELECT id FROM arrivals WHERE id=?", (data.entity_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="关联实体不存在")
        cursor = conn.execute(
            "INSERT INTO attachments (entity_type, entity_id, file_name, note) VALUES (?, ?, ?, ?)",
            (data.entity_type.value, data.entity_id, data.file_name, data.note or ""),
        )
        att_id = cursor.lastrowid
        insert_log(
            conn,
            "attachment",
            att_id,
            "attach",
            f"添加附件 {data.file_name} 到 {data.entity_type.value}#{data.entity_id}",
        )
        conn.commit()
        row = conn.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone()
        return row_to_attachment(row)
    finally:
        conn.close()


@router.delete("/{att_id}", status_code=204)
def delete_attachment(att_id: int):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="附件不存在")
        conn.execute("DELETE FROM attachments WHERE id=?", (att_id,))
        insert_log(
            conn,
            "attachment",
            att_id,
            "delete",
            f"删除附件 {row['file_name']}",
        )
        conn.commit()
    finally:
        conn.close()


@router.patch("/{att_id}", response_model=AttachmentResponse)
def update_attachment(att_id: int, data: AttachmentUpdate):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="附件不存在")
        conn.execute(
            "UPDATE attachments SET status=? WHERE id=?",
            (data.status.value, att_id),
        )
        insert_log(
            conn,
            "attachment",
            att_id,
            "update",
            f"附件状态更新为 {data.status.value}",
        )
        conn.commit()
        row = conn.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone()
        return row_to_attachment(row)
    finally:
        conn.close()
