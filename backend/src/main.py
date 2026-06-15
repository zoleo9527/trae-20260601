from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict
import sqlite3
import uuid

app = FastAPI(title="电脑装机店返修记录与质保跟踪系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "/Users/zhangliu/Documents/private/model-test/trae-20260601-1/backend/data/store.db"

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS repair_records (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            product_name TEXT NOT NULL,
            product_serial TEXT NOT NULL,
            issue_description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            assignee TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            remark TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS warranty_records (
            id TEXT PRIMARY KEY,
            repair_id TEXT NOT NULL,
            warranty_type TEXT NOT NULL,
            warranty_period TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            remark TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (repair_id) REFERENCES repair_records(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS operation_logs (
            id TEXT PRIMARY KEY,
            repair_id TEXT,
            warranty_id TEXT,
            operator TEXT NOT NULL,
            action TEXT NOT NULL,
            detail TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (repair_id) REFERENCES repair_records(id),
            FOREIGN KEY (warranty_id) REFERENCES warranty_records(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'staff',
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO users (id, username, password, role, name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'admin', 'admin123', 'admin', '管理员', datetime.now().isoformat()))
        cursor.execute('''
            INSERT INTO users (id, username, password, role, name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'sales', 'sales123', 'sales', '销售小王', datetime.now().isoformat()))
        cursor.execute('''
            INSERT INTO users (id, username, password, role, name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'technician', 'tech123', 'technician', '装机师小李', datetime.now().isoformat()))
        cursor.execute('''
            INSERT INTO users (id, username, password, role, name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'service', 'service123', 'service', '客服小张', datetime.now().isoformat()))
    
    cursor.execute("SELECT COUNT(*) FROM repair_records")
    if cursor.fetchone()[0] == 0:
        sample_data = [
            {
                'customer_name': '张三',
                'phone': '13800138001',
                'product_name': '联想拯救者Y9000P',
                'product_serial': 'SN2024001',
                'issue_description': '开机蓝屏，无法正常进入系统',
                'status': 'pending',
                'remark': '客户反映电脑在玩游戏时突然蓝屏，已尝试重启多次仍无法解决'
            },
            {
                'customer_name': '李四',
                'phone': '13800138002',
                'product_name': '华硕ROG幻16',
                'product_serial': 'SN2024002',
                'issue_description': '屏幕出现亮斑，影响使用体验',
                'status': 'processing',
                'remark': '已安排装机师检测，初步判断为屏幕背光问题'
            },
            {
                'customer_name': '王五',
                'phone': '13800138003',
                'product_name': '戴尔XPS 15',
                'product_serial': 'SN2024003',
                'issue_description': '电池续航明显下降',
                'status': 'rejected',
                'remark': '经检测，电池损耗正常（85%健康度），非质量问题，已向客户说明'
            },
            {
                'customer_name': '赵六',
                'phone': '13800138004',
                'product_name': '惠普暗影精灵9',
                'product_serial': 'SN2024004',
                'issue_description': '风扇噪音过大',
                'status': 'closed',
                'remark': '已更换风扇，问题解决，客户满意'
            },
            {
                'customer_name': '钱七',
                'phone': '13800138005',
                'product_name': 'MacBook Pro 14',
                'product_serial': 'SN2024005',
                'issue_description': '键盘部分按键失灵',
                'status': 'review',
                'remark': '客户反馈问题仍存在，需要重新检测和维修'
            },
            {
                'customer_name': '孙八',
                'phone': '13800138006',
                'product_name': '华为MateBook X Pro',
                'product_serial': 'SN2024006',
                'issue_description': '充电器接触不良',
                'status': 'pending',
                'remark': '需要更换充电器'
            },
            {
                'customer_name': '周九',
                'phone': '13800138007',
                'product_name': '小米RedmiBook Pro',
                'product_serial': 'SN2024007',
                'issue_description': '外放无声音',
                'status': 'processing',
                'remark': '音频驱动问题，正在修复中'
            },
            {
                'customer_name': '吴十',
                'phone': '13800138008',
                'product_name': '机械革命蛟龙16',
                'product_serial': 'SN2024008',
                'issue_description': '系统频繁卡顿',
                'status': 'closed',
                'remark': '已优化系统，问题解决'
            }
        ]
        
        now = datetime.now().isoformat()
        for data in sample_data:
            record_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO repair_records 
                (id, customer_name, phone, product_name, product_serial, issue_description, status, assignee, created_at, updated_at, remark)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (record_id, data['customer_name'], data['phone'], data['product_name'], 
                  data['product_serial'], data['issue_description'], data['status'], 
                  None, now, now, data['remark']))
    
    conn.commit()
    conn.close()

init_db()

class User(BaseModel):
    id: str
    username: str
    password: str
    role: str
    name: str
    created_at: str

class UserLogin(BaseModel):
    username: str
    password: str

class RepairRecordUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    product_name: Optional[str] = None
    product_serial: Optional[str] = None
    issue_description: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None
    remark: Optional[str] = None

class WarrantyRecordUpdate(BaseModel):
    warranty_type: Optional[str] = None
    warranty_period: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None

class OperationLog(BaseModel):
    id: Optional[str] = None
    repair_id: Optional[str] = None
    warranty_id: Optional[str] = None
    operator: str
    action: str
    detail: str
    created_at: Optional[str] = None

@app.post("/api/login")
def login(user: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (user.username, user.password))
    row = cursor.fetchone()
    if row:
        return {
            "id": row["id"],
            "username": row["username"],
            "role": row["role"],
            "name": row["name"],
            "created_at": row["created_at"]
        }
    raise HTTPException(status_code=401, detail="用户名或密码错误")

@app.get("/api/users")
def get_users(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, username, role, name, created_at FROM users")
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

@app.get("/api/repair_records")
def get_repair_records(status: Optional[str] = None, assignee: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = "SELECT * FROM repair_records WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if assignee:
        query += " AND assignee = ?"
        params.append(assignee)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

@app.get("/api/repair_records/{record_id}")
def get_repair_record(record_id: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM repair_records WHERE id = ?", (record_id,))
    row = cursor.fetchone()
    if row:
        return dict(row)
    raise HTTPException(status_code=404, detail="记录不存在")

@app.post("/api/repair_records")
def create_repair_record(record: dict, db: sqlite3.Connection = Depends(get_db)):
    record_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO repair_records 
        (id, customer_name, phone, product_name, product_serial, issue_description, status, assignee, created_at, updated_at, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (record_id, record.get('customer_name'), record.get('phone'), record.get('product_name'), 
          record.get('product_serial'), record.get('issue_description'), 
          record.get('status', 'pending'), record.get('assignee'), now, now, record.get('remark')))
    db.commit()
    
    cursor.execute('''
        INSERT INTO operation_logs (id, repair_id, operator, action, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), record_id, 'system', '创建', f'创建返修记录：{record.get("customer_name")}', now))
    db.commit()
    
    result = {k: v for k, v in record.items() if v is not None}
    return {"id": record_id, **result, "created_at": now, "updated_at": now}

@app.put("/api/repair_records/{record_id}")
def update_repair_record(record_id: str, record: RepairRecordUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM repair_records WHERE id = ?", (record_id,))
    old_record = cursor.fetchone()
    if not old_record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    now = datetime.now().isoformat()
    updates = []
    params = []
    
    if record.customer_name is not None:
        updates.append("customer_name = ?")
        params.append(record.customer_name)
    if record.phone is not None:
        updates.append("phone = ?")
        params.append(record.phone)
    if record.product_name is not None:
        updates.append("product_name = ?")
        params.append(record.product_name)
    if record.product_serial is not None:
        updates.append("product_serial = ?")
        params.append(record.product_serial)
    if record.issue_description is not None:
        updates.append("issue_description = ?")
        params.append(record.issue_description)
    if record.status is not None:
        updates.append("status = ?")
        params.append(record.status)
    if record.assignee is not None:
        updates.append("assignee = ?")
        params.append(record.assignee)
    if record.remark is not None:
        updates.append("remark = ?")
        params.append(record.remark)
    
    if not updates:
        return {"message": "没有需要更新的字段"}
    
    updates.append("updated_at = ?")
    params.append(now)
    params.append(record_id)
    
    query = "UPDATE repair_records SET " + ", ".join(updates) + " WHERE id = ?"
    cursor.execute(query, params)
    db.commit()
    
    action = "更新"
    detail = f"更新返修记录：{old_record['customer_name']}"
    if record.status is not None and record.status != old_record['status']:
        action = f"状态变更: {old_record['status']} -> {record.status}"
        detail = f"{action}: {old_record['customer_name']}"
    
    cursor.execute('''
        INSERT INTO operation_logs (id, repair_id, operator, action, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), record_id, 'system', action, detail, now))
    db.commit()
    
    return {"message": "更新成功"}

@app.delete("/api/repair_records/{record_id}")
def delete_repair_record(record_id: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM repair_records WHERE id = ?", (record_id,))
    record = cursor.fetchone()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    cursor.execute("DELETE FROM repair_records WHERE id = ?", (record_id,))
    cursor.execute("DELETE FROM warranty_records WHERE repair_id = ?", (record_id,))
    cursor.execute("DELETE FROM operation_logs WHERE repair_id = ?", (record_id,))
    db.commit()
    
    return {"message": "删除成功"}

@app.get("/api/warranty_records")
def get_warranty_records(repair_id: Optional[str] = None, status: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = "SELECT * FROM warranty_records WHERE 1=1"
    params = []
    if repair_id:
        query += " AND repair_id = ?"
        params.append(repair_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

@app.get("/api/warranty_records/{warranty_id}")
def get_warranty_record(warranty_id: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM warranty_records WHERE id = ?", (warranty_id,))
    row = cursor.fetchone()
    if row:
        return dict(row)
    raise HTTPException(status_code=404, detail="质保记录不存在")

@app.post("/api/warranty_records")
def create_warranty_record(warranty: dict, db: sqlite3.Connection = Depends(get_db)):
    warranty_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO warranty_records 
        (id, repair_id, warranty_type, warranty_period, start_date, end_date, status, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (warranty_id, warranty.get('repair_id'), warranty.get('warranty_type'), 
          warranty.get('warranty_period'), warranty.get('start_date'), warranty.get('end_date'),
          warranty.get('status', 'active'), warranty.get('remark'), now, now))
    db.commit()
    
    cursor.execute('''
        INSERT INTO operation_logs (id, warranty_id, operator, action, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), warranty_id, 'system', '创建', f'创建质保记录：{warranty.get("warranty_type")}', now))
    db.commit()
    
    result = {k: v for k, v in warranty.items() if v is not None}
    return {"id": warranty_id, **result, "created_at": now, "updated_at": now}

@app.put("/api/warranty_records/{warranty_id}")
def update_warranty_record(warranty_id: str, warranty: WarrantyRecordUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM warranty_records WHERE id = ?", (warranty_id,))
    old_warranty = cursor.fetchone()
    if not old_warranty:
        raise HTTPException(status_code=404, detail="质保记录不存在")
    
    now = datetime.now().isoformat()
    updates = []
    params = []
    
    if warranty.warranty_type is not None:
        updates.append("warranty_type = ?")
        params.append(warranty.warranty_type)
    if warranty.warranty_period is not None:
        updates.append("warranty_period = ?")
        params.append(warranty.warranty_period)
    if warranty.start_date is not None:
        updates.append("start_date = ?")
        params.append(warranty.start_date)
    if warranty.end_date is not None:
        updates.append("end_date = ?")
        params.append(warranty.end_date)
    if warranty.status is not None:
        updates.append("status = ?")
        params.append(warranty.status)
    if warranty.remark is not None:
        updates.append("remark = ?")
        params.append(warranty.remark)
    
    if not updates:
        return {"message": "没有需要更新的字段"}
    
    updates.append("updated_at = ?")
    params.append(now)
    params.append(warranty_id)
    
    query = "UPDATE warranty_records SET " + ", ".join(updates) + " WHERE id = ?"
    cursor.execute(query, params)
    db.commit()
    
    action = "更新"
    detail = f"更新质保记录：{old_warranty['warranty_type']}"
    if warranty.status is not None and warranty.status != old_warranty['status']:
        action = f"状态变更: {old_warranty['status']} -> {warranty.status}"
        detail = f"{action}: {old_warranty['warranty_type']}"
    
    cursor.execute('''
        INSERT INTO operation_logs (id, warranty_id, operator, action, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), warranty_id, 'system', action, detail, now))
    db.commit()
    
    return {"message": "更新成功"}

@app.get("/api/operation_logs")
def get_operation_logs(repair_id: Optional[str] = None, warranty_id: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = "SELECT * FROM operation_logs WHERE 1=1"
    params = []
    if repair_id:
        query += " AND repair_id = ?"
        params.append(repair_id)
    if warranty_id:
        query += " AND warranty_id = ?"
        params.append(warranty_id)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

@app.get("/api/statistics")
def get_statistics(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM repair_records WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM repair_records WHERE status = 'processing'")
    processing_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM repair_records WHERE status = 'rejected'")
    rejected_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM repair_records WHERE status = 'closed'")
    closed_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM repair_records WHERE status = 'review'")
    review_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM warranty_records WHERE status = 'active'")
    active_warranty = cursor.fetchone()[0]
    
    return {
        "pending": pending_count,
        "processing": processing_count,
        "rejected": rejected_count,
        "closed": closed_count,
        "review": review_count,
        "active_warranty": active_warranty
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)