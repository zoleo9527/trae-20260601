from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from routers import orders, arrivals, logs, attachments, export_csv, notifications

app = FastAPI(title="农资店肥料订购与到货通知系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(arrivals.router)
app.include_router(logs.router)
app.include_router(attachments.router)
app.include_router(export_csv.router)
app.include_router(notifications.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/stats")
def get_stats():
    conn = get_db()
    try:
        today = __import__("datetime").date.today().isoformat()
        today_orders = conn.execute(
            "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = ?",
            (today,),
        ).fetchone()[0]
        pending_arrivals = conn.execute(
            "SELECT COUNT(*) FROM arrivals WHERE status = 'pending'"
        ).fetchone()[0]
        exception_count = conn.execute(
            "SELECT COUNT(*) FROM arrivals WHERE status = 'exception'"
        ).fetchone()[0]
        unread_notifications = conn.execute(
            "SELECT COUNT(*) FROM notifications WHERE is_read = 0"
        ).fetchone()[0]
        return {
            "today_orders": today_orders,
            "pending_arrivals": pending_arrivals,
            "exception_count": exception_count,
            "unread_notifications": unread_notifications,
        }
    finally:
        conn.close()
