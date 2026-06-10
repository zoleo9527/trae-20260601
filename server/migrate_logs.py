import sqlite3

conn = sqlite3.connect("data.db")
try:
    conn.execute("INSERT INTO operation_logs (entity_type, entity_id, action, detail) VALUES ('notification', 0, 'notify', 'test')")
    conn.rollback()
    print("CHECK already allows notification/notify")
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
    print("Migrated operation_logs table successfully")
finally:
    conn.close()
