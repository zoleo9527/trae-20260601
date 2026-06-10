import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.db")

DDL = """
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '',
    product_name TEXT NOT NULL,
    product_spec TEXT NOT NULL DEFAULT '',
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    unit_price REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','arrived')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS arrivals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    arrival_no TEXT NOT NULL UNIQUE,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    order_note TEXT NOT NULL DEFAULT '',
    ordered_quantity REAL NOT NULL DEFAULT 0,
    actual_quantity REAL,
    unit TEXT NOT NULL DEFAULT 'kg',
    arrival_note TEXT NOT NULL DEFAULT '',
    exception_note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','exception')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('order','arrival')),
    entity_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'placeholder' CHECK(status IN ('placeholder','uploaded')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('order','arrival','attachment','notification')),
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('create','update','status_change','confirm','delete','attach','notify','read')),
    detail TEXT NOT NULL DEFAULT '',
    operator TEXT NOT NULL DEFAULT '店员',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arrivals_order ON arrivals(order_id);
CREATE INDEX IF NOT EXISTS idx_arrivals_status ON arrivals(status);
CREATE INDEX IF NOT EXISTS idx_arrivals_created ON arrivals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON operation_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(created_at DESC);
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('arrival_reminder','exception_alert')),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    order_id INTEGER,
    order_no TEXT NOT NULL DEFAULT '',
    arrival_id INTEGER,
    arrival_no TEXT NOT NULL DEFAULT '',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
"""


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    try:
        conn.executescript(DDL)
        conn.commit()
        _migrate_operation_logs(conn)
    finally:
        conn.close()


def _migrate_operation_logs(conn):
    try:
        conn.execute("INSERT INTO operation_logs (entity_type, entity_id, action, detail) VALUES ('notification', 0, 'notify', 'test')")
        conn.rollback()
    except Exception:
        conn.rollback()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS operation_logs_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL CHECK(entity_type IN ('order','arrival','attachment','notification')),
                entity_id INTEGER NOT NULL,
                action TEXT NOT NULL CHECK(action IN ('create','update','status_change','confirm','delete','attach','notify','read')),
                detail TEXT NOT NULL DEFAULT '',
                operator TEXT NOT NULL DEFAULT '店员',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO operation_logs_new SELECT * FROM operation_logs;
            DROP TABLE operation_logs;
            ALTER TABLE operation_logs_new RENAME TO operation_logs;
        """)
        conn.commit()


def generate_no(conn, prefix: str) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y%m%d")
    pattern = f"{prefix}{today}%"
    row = conn.execute(
        "SELECT order_no FROM orders WHERE order_no LIKE ? UNION ALL SELECT arrival_no FROM arrivals WHERE arrival_no LIKE ? ORDER BY 1 DESC LIMIT 1",
        (pattern, pattern),
    ).fetchone()
    seq = 1
    if row:
        last_no = row[0] if isinstance(row[0], str) else row[0]
        seq = int(last_no[-4:]) + 1
    return f"{prefix}{today}{seq:04d}"


def insert_log(conn, entity_type: str, entity_id: int, action: str, detail: str = "", operator: str = "店员"):
    conn.execute(
        "INSERT INTO operation_logs (entity_type, entity_id, action, detail, operator) VALUES (?, ?, ?, ?, ?)",
        (entity_type, entity_id, action, detail, operator),
    )


def insert_notification(conn, ntype: str, title: str, content: str = "", order_id: int | None = None, order_no: str = "", arrival_id: int | None = None, arrival_no: str = ""):
    conn.execute(
        "INSERT INTO notifications (type, title, content, order_id, order_no, arrival_id, arrival_no) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (ntype, title, content, order_id, order_no, arrival_id, arrival_no),
    )
