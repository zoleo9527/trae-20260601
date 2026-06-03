import os
import sqlite3
import hashlib
from datetime import datetime, date, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, g, send_file
from io import BytesIO

app = Flask(__name__)
app.secret_key = os.urandom(24).hex()

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'legal_aid.db')

CASE_STATUSES = [
    '待初审', '材料补正中', '已初审', '已分派律师',
    '律师已接案', '办理中', '已结案', '已撤回'
]

CASE_TYPES = ['民事', '刑事', '行政', '劳动争议', '婚姻家庭', '交通事故', '房屋纠纷', '其他']

REQUIRED_MATERIALS = {
    '民事': ['身份证复印件', '低保证/经济困难证明', '案件相关证据材料', '授权委托书'],
    '刑事': ['身份证复印件', '低保证/经济困难证明', '案件相关材料', '公检法指定函'],
    '行政': ['身份证复印件', '低保证/经济困难证明', '行政决定书', '相关证据材料'],
    '劳动争议': ['身份证复印件', '低保证/经济困难证明', '劳动合同', '工资流水/欠条'],
    '婚姻家庭': ['身份证复印件', '低保证/经济困难证明', '结婚证', '相关证据材料'],
    '交通事故': ['身份证复印件', '低保证/经济困难证明', '事故认定书', '医疗费用清单'],
    '房屋纠纷': ['身份证复印件', '低保证/经济困难证明', '房屋产权证明', '租赁合同/相关材料'],
    '其他': ['身份证复印件', '低保证/经济困难证明', '案件相关材料'],
}


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'window_staff',
            display_name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS lawyers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            specialty TEXT,
            status TEXT NOT NULL DEFAULT 'available'
        );
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_number TEXT UNIQUE NOT NULL,
            applicant_name TEXT NOT NULL,
            id_number TEXT,
            phone TEXT,
            address TEXT,
            case_type TEXT NOT NULL,
            case_description TEXT,
            status TEXT NOT NULL DEFAULT '待初审',
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            is_required INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'pending',
            received_at DATETIME,
            notes TEXT
        );
        CREATE TABLE IF NOT EXISTS corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
            notice_date DATE NOT NULL,
            deadline DATE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME
        );
        CREATE TABLE IF NOT EXISTS correction_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            correction_id INTEGER NOT NULL REFERENCES corrections(id) ON DELETE CASCADE,
            material_id INTEGER REFERENCES materials(id),
            description TEXT NOT NULL,
            is_resolved INTEGER NOT NULL DEFAULT 0,
            resolved_at DATETIME
        );
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
            lawyer_id INTEGER NOT NULL REFERENCES lawyers(id),
            assigned_by INTEGER REFERENCES users(id),
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            accepted_at DATETIME,
            status TEXT NOT NULL DEFAULT 'pending'
        );
        CREATE TABLE IF NOT EXISTS progress_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
            from_status TEXT,
            to_status TEXT NOT NULL,
            operator_id INTEGER REFERENCES users(id),
            note TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    db.commit()
    db.close()


def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '请先登录'}), 401
        return f(*args, **kwargs)
    return decorated_function


def manager_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '请先登录'}), 401
        if session.get('role') != 'manager':
            return jsonify({'error': '权限不足，需要负责人权限'}), 403
        return f(*args, **kwargs)
    return decorated_function


def generate_case_number(db):
    year = datetime.now().year
    prefix = f"FA-{year}-"
    row = db.execute(
        "SELECT MAX(CAST(SUBSTR(case_number, ?, 4) AS INTEGER)) as max_num FROM cases WHERE case_number LIKE ?",
        (len(prefix) + 1, f"{prefix}%")
    ).fetchone()
    num = (row['max_num'] or 0) + 1
    return f"{prefix}{num:04d}"


def log_progress(db, case_id, from_status, to_status, operator_id, note=''):
    db.execute(
        "INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note) VALUES (?, ?, ?, ?, ?)",
        (case_id, from_status, to_status, operator_id, note)
    )


# ── Auth ──

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user or user['password_hash'] != hash_password(password):
        return jsonify({'error': '用户名或密码错误'}), 401
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = user['role']
    session['display_name'] = user['display_name']
    return jsonify({'id': user['id'], 'username': user['username'], 'role': user['role'], 'display_name': user['display_name']})


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})


@app.route('/api/me', methods=['GET'])
@login_required
def me():
    return jsonify({'id': session['user_id'], 'username': session['username'], 'role': session['role'], 'display_name': session['display_name']})


# ── Cases ──

@app.route('/api/cases', methods=['GET'])
@login_required
def list_cases():
    db = get_db()
    status_filter = request.args.get('status', '')
    keyword = request.args.get('keyword', '')
    page = int(request.args.get('page', 1))
    per_page = 20
    offset = (page - 1) * per_page

    where_clauses = []
    params = []
    if status_filter:
        where_clauses.append("c.status = ?")
        params.append(status_filter)
    if keyword:
        where_clauses.append("(c.case_number LIKE ? OR c.applicant_name LIKE ? OR c.id_number LIKE ?)")
        params.extend([f'%{keyword}%', f'%{keyword}%', f'%{keyword}%'])

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    total = db.execute(f"SELECT COUNT(*) as cnt FROM cases c{where_sql}", params).fetchone()['cnt']
    rows = db.execute(
        f"SELECT c.*, l.name as lawyer_name FROM cases c LEFT JOIN assignments a ON c.id = a.case_id AND a.status = 'accepted' LEFT JOIN lawyers l ON a.lawyer_id = l.id{where_sql} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?",
        params + [per_page, offset]
    ).fetchall()

    cases = []
    for r in rows:
        mat_count = db.execute("SELECT COUNT(*) as cnt FROM materials WHERE case_id = ?", (r['id'],)).fetchone()['cnt']
        received_count = db.execute("SELECT COUNT(*) as cnt FROM materials WHERE case_id = ? AND status = 'received'", (r['id'],)).fetchone()['cnt']
        cases.append({
            'id': r['id'], 'case_number': r['case_number'], 'applicant_name': r['applicant_name'],
            'id_number': r['id_number'], 'phone': r['phone'], 'case_type': r['case_type'],
            'status': r['status'], 'created_at': r['created_at'], 'updated_at': r['updated_at'],
            'lawyer_name': r['lawyer_name'], 'material_progress': f"{received_count}/{mat_count}"
        })

    return jsonify({'cases': cases, 'total': total, 'page': page, 'per_page': per_page})


@app.route('/api/cases', methods=['POST'])
@login_required
def create_case():
    data = request.get_json()
    db = get_db()
    case_number = generate_case_number(db)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor = db.execute(
        "INSERT INTO cases (case_number, applicant_name, id_number, phone, address, case_type, case_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (case_number, data['applicant_name'], data.get('id_number', ''), data.get('phone', ''),
         data.get('address', ''), data['case_type'], data.get('case_description', ''),
         '待初审', session['user_id'], now, now)
    )
    case_id = cursor.lastrowid

    case_type = data['case_type']
    for mat_name in REQUIRED_MATERIALS.get(case_type, REQUIRED_MATERIALS['其他']):
        db.execute(
            "INSERT INTO materials (case_id, name, is_required, status) VALUES (?, ?, 1, 'pending')",
            (case_id, mat_name)
        )
    for mat_name in data.get('extra_materials', []):
        db.execute(
            "INSERT INTO materials (case_id, name, is_required, status) VALUES (?, ?, 0, 'pending')",
            (case_id, mat_name)
        )

    log_progress(db, case_id, '', '待初审', session['user_id'], '案件登记')
    db.commit()
    return jsonify({'id': case_id, 'case_number': case_number}), 201


@app.route('/api/cases/<int:case_id>', methods=['GET'])
@login_required
def get_case(case_id):
    db = get_db()
    case_row = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not case_row:
        return jsonify({'error': '案件不存在'}), 404

    materials = [dict(r) for r in db.execute("SELECT * FROM materials WHERE case_id = ? ORDER BY is_required DESC, id", (case_id,)).fetchall()]
    corrections = []
    for corr in db.execute("SELECT * FROM corrections WHERE case_id = ? ORDER BY created_at DESC", (case_id,)).fetchall():
        items = [dict(r) for r in db.execute("SELECT ci.*, m.name as material_name FROM correction_items ci LEFT JOIN materials m ON ci.material_id = m.id WHERE ci.correction_id = ?", (corr['id'],)).fetchall()]
        corrections.append({**dict(corr), 'items': items})

    assignments = []
    if session.get('role') == 'manager':
        assignments = [dict(r) for r in db.execute(
            "SELECT a.*, l.name as lawyer_name, l.phone as lawyer_phone, l.specialty as lawyer_specialty FROM assignments a JOIN lawyers l ON a.lawyer_id = l.id WHERE a.case_id = ? ORDER BY a.assigned_at DESC",
            (case_id,)
        ).fetchall()]
    else:
        accepted = db.execute(
            "SELECT a.id, l.name as lawyer_name FROM assignments a JOIN lawyers l ON a.lawyer_id = l.id WHERE a.case_id = ? AND a.status = 'accepted' LIMIT 1",
            (case_id,)
        ).fetchone()
        if accepted:
            assignments = [{'id': accepted['id'], 'lawyer_name': accepted['lawyer_name'], 'status': 'accepted'}]

    progress = []
    if session.get('role') == 'manager':
        progress = [dict(r) for r in db.execute(
            "SELECT p.*, u.display_name as operator_name FROM progress_log p LEFT JOIN users u ON p.operator_id = u.id WHERE p.case_id = ? ORDER BY p.created_at",
            (case_id,)
        ).fetchall()]
    else:
        progress = [dict(r) for r in db.execute(
            "SELECT p.id, p.case_id, p.from_status, p.to_status, p.note, p.created_at FROM progress_log p WHERE p.case_id = ? ORDER BY p.created_at",
            (case_id,)
        ).fetchall()]

    case_data = dict(case_row)
    case_data['materials'] = materials
    case_data['corrections'] = corrections
    case_data['assignments'] = assignments
    case_data['progress'] = progress
    return jsonify(case_data)


ASSIGNMENT_LOCKED_STATUSES = {
    '已分派律师', '律师已接案'
}

MANAGER_ONLY_TRANSITIONS = {
    '办理中', '已结案', '已撤回'
}

STAFF_ALLOWED_TRANSITIONS = {
    '待初审', '材料补正中', '已初审'
}


@app.route('/api/cases/<int:case_id>/status', methods=['PUT'])
@login_required
def update_case_status(case_id):
    data = request.get_json()
    new_status = data.get('status', '')
    note = data.get('note', '')
    if new_status not in CASE_STATUSES:
        return jsonify({'error': '无效的案件状态'}), 400

    if new_status in ASSIGNMENT_LOCKED_STATUSES:
        return jsonify({'error': '该状态需通过律师分派流程变更，不能直接修改'}), 400

    if new_status in MANAGER_ONLY_TRANSITIONS and session.get('role') != 'manager':
        return jsonify({'error': '权限不足，该状态变更需要负责人权限'}), 403

    db = get_db()
    case = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not case:
        return jsonify({'error': '案件不存在'}), 404

    if case['status'] in ASSIGNMENT_LOCKED_STATUSES and new_status == '已初审':
        return jsonify({'error': '已分派的案件需退回分派流程，不能直接回退到已初审'}), 400

    VALID_TRANSITIONS = {
        '待初审': {'材料补正中', '已初审'},
        '材料补正中': {'已初审', '材料补正中'},
        '律师已接案': {'办理中'},
        '办理中': {'已结案', '已撤回'},
    }
    allowed = VALID_TRANSITIONS.get(case['status'], set())
    if new_status not in allowed and new_status != case['status']:
        return jsonify({'error': f'案件当前状态为"{case["status"]}"，不可变更为"{new_status}"'}), 400

    old_status = case['status']
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    db.execute("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?", (new_status, now, case_id))
    log_progress(db, case_id, old_status, new_status, session['user_id'], note)
    db.commit()
    return jsonify({'ok': True})


# ── Materials ──

@app.route('/api/cases/<int:case_id>/materials', methods=['POST'])
@login_required
def add_material(case_id):
    data = request.get_json()
    db = get_db()
    cursor = db.execute(
        "INSERT INTO materials (case_id, name, is_required, status, notes) VALUES (?, ?, ?, 'pending', ?)",
        (case_id, data['name'], int(data.get('is_required', False)), data.get('notes', ''))
    )
    db.commit()
    return jsonify({'id': cursor.lastrowid}), 201


@app.route('/api/materials/<int:material_id>', methods=['PUT'])
@login_required
def update_material(material_id):
    data = request.get_json()
    db = get_db()
    material = db.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
    if not material:
        return jsonify({'error': '材料不存在'}), 404

    new_status = data.get('status', material['status'])
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S') if new_status == 'received' else None
    received_at = now if new_status == 'received' else material['received_at']

    db.execute(
        "UPDATE materials SET status = ?, received_at = ?, notes = ? WHERE id = ?",
        (new_status, received_at, data.get('notes', material['notes']), material_id)
    )

    if new_status == 'received' and material['status'] != 'received':
        log_progress(db, material['case_id'], '', '', session['user_id'], f"材料「{material['name']}」已接收")

    db.execute("UPDATE cases SET updated_at = ? WHERE id = ?", (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), material['case_id']))
    db.commit()
    return jsonify({'ok': True})


@app.route('/api/materials/<int:material_id>', methods=['DELETE'])
@login_required
def delete_material(material_id):
    db = get_db()
    material = db.execute("SELECT * FROM materials WHERE id = ?", (material_id,)).fetchone()
    if not material:
        return jsonify({'error': '材料不存在'}), 404
    db.execute("DELETE FROM materials WHERE id = ?", (material_id,))
    db.commit()
    return jsonify({'ok': True})


# ── Corrections ──

@app.route('/api/cases/<int:case_id>/corrections', methods=['POST'])
@login_required
def create_correction(case_id):
    data = request.get_json()
    db = get_db()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    notice_date = data.get('notice_date', date.today().isoformat())
    deadline = data.get('deadline', (date.today() + timedelta(days=15)).isoformat())

    cursor = db.execute(
        "INSERT INTO corrections (case_id, notice_date, deadline, status, notes, created_at) VALUES (?, ?, ?, 'pending', ?, ?)",
        (case_id, notice_date, deadline, data.get('notes', ''), now)
    )
    correction_id = cursor.lastrowid

    for item in data.get('items', []):
        db.execute(
            "INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
            (correction_id, item.get('material_id'), item['description'])
        )

    db.execute("UPDATE cases SET status = '材料补正中', updated_at = ? WHERE id = ? AND status = '待初审'", (now, case_id))
    log_progress(db, case_id, '', '材料补正中', session['user_id'], '生成补正通知')
    db.commit()
    return jsonify({'id': correction_id}), 201


@app.route('/api/corrections/<int:correction_id>/resolve', methods=['PUT'])
@login_required
def resolve_correction_item(correction_id):
    data = request.get_json()
    db = get_db()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    for item in data.get('resolved_items', []):
        db.execute(
            "UPDATE correction_items SET is_resolved = 1, resolved_at = ? WHERE id = ?",
            (now, item)
        )
        ci = db.execute("SELECT * FROM correction_items WHERE id = ?", (item,)).fetchone()
        if ci and ci['material_id']:
            db.execute("UPDATE materials SET status = 'received', received_at = ? WHERE id = ?", (now, ci['material_id']))

    unresolved = db.execute(
        "SELECT COUNT(*) as cnt FROM correction_items WHERE correction_id = ? AND is_resolved = 0",
        (correction_id,)
    ).fetchone()['cnt']
    if unresolved == 0:
        db.execute("UPDATE corrections SET status = 'resolved', resolved_at = ? WHERE id = ?", (now, correction_id))
    else:
        db.execute("UPDATE corrections SET status = 'partially_resolved' WHERE id = ?", (correction_id,))

    correction = db.execute("SELECT * FROM corrections WHERE id = ?", (correction_id,)).fetchone()
    db.execute("UPDATE cases SET updated_at = ? WHERE id = ?", (now, correction['case_id']))
    log_progress(db, correction['case_id'], '', '', session['user_id'], '补正材料部分/全部提交')
    db.commit()
    return jsonify({'ok': True})


# ── Lawyers ──

@app.route('/api/lawyers', methods=['GET'])
@manager_required
def list_lawyers():
    db = get_db()
    rows = db.execute("SELECT * FROM lawyers ORDER BY name").fetchall()
    return jsonify({'lawyers': [dict(r) for r in rows]})


@app.route('/api/lawyers', methods=['POST'])
@manager_required
def add_lawyer():
    data = request.get_json()
    db = get_db()
    cursor = db.execute(
        "INSERT INTO lawyers (name, phone, specialty, status) VALUES (?, ?, ?, ?)",
        (data['name'], data.get('phone', ''), data.get('specialty', ''), data.get('status', 'available'))
    )
    db.commit()
    return jsonify({'id': cursor.lastrowid}), 201


@app.route('/api/lawyers/<int:lawyer_id>', methods=['PUT'])
@manager_required
def update_lawyer(lawyer_id):
    data = request.get_json()
    db = get_db()
    db.execute(
        "UPDATE lawyers SET name = ?, phone = ?, specialty = ?, status = ? WHERE id = ?",
        (data.get('name'), data.get('phone'), data.get('specialty'), data.get('status', 'available'), lawyer_id)
    )
    db.commit()
    return jsonify({'ok': True})


# ── Assignments ──

@app.route('/api/cases/<int:case_id>/assign', methods=['POST'])
@manager_required
def assign_lawyer(case_id):
    data = request.get_json()
    lawyer_id = data.get('lawyer_id')
    db = get_db()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    case = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not case:
        return jsonify({'error': '案件不存在'}), 404

    if case['status'] != '已初审':
        return jsonify({'error': f'案件当前状态为"{case["status"]}"，仅"已初审"状态可分派律师'}), 400

    existing = db.execute(
        "SELECT * FROM assignments WHERE case_id = ? AND status IN ('pending', 'accepted')", (case_id,)
    ).fetchone()
    if existing:
        return jsonify({'error': '该案件已有待处理或已接受的分派'}), 400

    cursor = db.execute(
        "INSERT INTO assignments (case_id, lawyer_id, assigned_by, assigned_at, status) VALUES (?, ?, ?, ?, 'pending')",
        (case_id, lawyer_id, session['user_id'], now)
    )

    old_status = case['status']
    db.execute("UPDATE cases SET status = '已分派律师', updated_at = ? WHERE id = ?", (now, case_id))
    log_progress(db, case_id, old_status, '已分派律师', session['user_id'], '分派律师')
    db.commit()
    return jsonify({'id': cursor.lastrowid}), 201


@app.route('/api/assignments/<int:assignment_id>/accept', methods=['PUT'])
@manager_required
def accept_assignment(assignment_id):
    db = get_db()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    assignment = db.execute("SELECT * FROM assignments WHERE id = ?", (assignment_id,)).fetchone()
    if not assignment:
        return jsonify({'error': '分派记录不存在'}), 404

    if assignment['status'] != 'pending':
        return jsonify({'error': f'分派记录状态为"{assignment["status"]}"，仅"待接受"记录可确认接案'}), 400

    db.execute("UPDATE assignments SET status = 'accepted', accepted_at = ? WHERE id = ?", (now, assignment_id))
    db.execute("UPDATE cases SET status = '律师已接案', updated_at = ? WHERE id = ?", (now, assignment['case_id']))
    log_progress(db, assignment['case_id'], '已分派律师', '律师已接案', session['user_id'], '律师已接案')
    db.commit()
    return jsonify({'ok': True})


@app.route('/api/assignments/<int:assignment_id>/reject', methods=['PUT'])
@manager_required
def reject_assignment(assignment_id):
    data = request.get_json()
    db = get_db()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    assignment = db.execute("SELECT * FROM assignments WHERE id = ?", (assignment_id,)).fetchone()
    if not assignment:
        return jsonify({'error': '分派记录不存在'}), 404

    if assignment['status'] != 'pending':
        return jsonify({'error': f'分派记录状态为"{assignment["status"]}"，仅"待接受"记录可拒绝'}), 400

    db.execute("UPDATE assignments SET status = 'rejected' WHERE id = ?", (assignment_id,))
    db.execute("UPDATE cases SET status = '已初审', updated_at = ? WHERE id = ?", (now, assignment['case_id']))
    log_progress(db, assignment['case_id'], '已分派律师', '已初审', session['user_id'], data.get('note', '律师拒绝接案'))
    db.commit()
    return jsonify({'ok': True})


# ── Dashboard ──

@app.route('/api/dashboard', methods=['GET'])
@login_required
def dashboard():
    db = get_db()
    today = date.today().isoformat()
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()

    total_cases = db.execute("SELECT COUNT(*) as cnt FROM cases").fetchone()['cnt']
    pending_review = db.execute("SELECT COUNT(*) as cnt FROM cases WHERE status = '待初审'").fetchone()['cnt']
    in_correction = db.execute("SELECT COUNT(*) as cnt FROM cases WHERE status = '材料补正中'").fetchone()['cnt']
    accepted = db.execute("SELECT COUNT(*) as cnt FROM cases WHERE status IN ('律师已接案', '办理中')").fetchone()['cnt']
    closed = db.execute("SELECT COUNT(*) as cnt FROM cases WHERE status = '已结案'").fetchone()['cnt']
    today_registered = db.execute("SELECT COUNT(*) as cnt FROM cases WHERE DATE(created_at) = ?", (today,)).fetchone()['cnt']

    overdue_corrections = []
    if session.get('role') == 'manager':
        overdue_corrections = db.execute(
            "SELECT c.*, cs.case_number, cs.applicant_name, cs.phone FROM corrections c JOIN cases cs ON c.case_id = cs.id WHERE c.status != 'resolved' AND c.deadline < ? ORDER BY c.deadline",
            (today,)
        ).fetchall()

    status_distribution = []
    if session.get('role') == 'manager':
        for s in CASE_STATUSES:
            cnt = db.execute("SELECT COUNT(*) as cnt FROM cases WHERE status = ?", (s,)).fetchone()['cnt']
            if cnt > 0:
                status_distribution.append({'status': s, 'count': cnt})

    recent_cases = [dict(r) for r in db.execute(
        "SELECT id, case_number, applicant_name, case_type, status, created_at FROM cases ORDER BY updated_at DESC LIMIT 10"
    ).fetchall()]

    result = {
        'total_cases': total_cases,
        'pending_review': pending_review,
        'in_correction': in_correction,
        'accepted': accepted,
        'closed': closed,
        'today_registered': today_registered,
        'overdue_corrections': [dict(r) for r in overdue_corrections],
        'status_distribution': status_distribution,
        'recent_cases': recent_cases,
        'role': session.get('role', 'window_staff')
    }
    if session.get('role') != 'manager':
        result.pop('accepted', None)
        result.pop('closed', None)
        result.pop('overdue_corrections', None)
        result.pop('status_distribution', None)
    return jsonify(result)


@app.route('/api/overdue', methods=['GET'])
@manager_required
def list_overdue():
    db = get_db()
    today = date.today().isoformat()
    rows = db.execute(
        "SELECT c.*, cs.case_number, cs.applicant_name, cs.phone FROM corrections c JOIN cases cs ON c.case_id = cs.id WHERE c.status != 'resolved' AND c.deadline < ? ORDER BY c.deadline",
        (today,)
    ).fetchall()
    return jsonify({'overdue_corrections': [dict(r) for r in rows]})


# ── Export ──

@app.route('/api/cases/<int:case_id>/export/registration', methods=['GET'])
@login_required
def export_registration(case_id):
    db = get_db()
    case = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not case:
        return jsonify({'error': '案件不存在'}), 404
    materials = db.execute("SELECT * FROM materials WHERE case_id = ?", (case_id,)).fetchall()

    lines = []
    lines.append("=" * 60)
    lines.append("         法律援助案件登记表")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"案件编号：{case['case_number']}")
    lines.append(f"登记时间：{case['created_at']}")
    lines.append("")
    lines.append("【申请人信息】")
    lines.append(f"  姓    名：{case['applicant_name']}")
    lines.append(f"  身份证号：{case['id_number'] or '未提供'}")
    lines.append(f"  联系电话：{case['phone'] or '未提供'}")
    lines.append(f"  住    址：{case['address'] or '未提供'}")
    lines.append("")
    lines.append("【案件信息】")
    lines.append(f"  案件类型：{case['case_type']}")
    lines.append(f"  案件描述：{case['case_description'] or '无'}")
    lines.append(f"  当前状态：{case['status']}")
    lines.append("")
    lines.append("【材料清单】")
    for i, m in enumerate(materials, 1):
        status_map = {'pending': '未提交', 'received': '已接收', 'rejected': '不合格'}
        required_mark = '★' if m['is_required'] else '○'
        lines.append(f"  {i}. {required_mark} {m['name']}  [{status_map.get(m['status'], m['status'])}]")
        if m['notes']:
            lines.append(f"     备注：{m['notes']}")
    lines.append("")
    lines.append("  ★ = 必需材料  ○ = 补充材料")
    lines.append("")
    lines.append("=" * 60)

    content = "\n".join(lines)
    buf = BytesIO(content.encode('utf-8'))
    buf.seek(0)
    filename = f"登记表_{case['case_number']}.txt"
    return send_file(buf, as_attachment=True, download_name=filename, mimetype='text/plain; charset=utf-8')


@app.route('/api/cases/<int:case_id>/export/correction/<int:correction_id>', methods=['GET'])
@login_required
def export_correction(case_id, correction_id):
    db = get_db()
    case = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not case:
        return jsonify({'error': '案件不存在'}), 404
    correction = db.execute("SELECT * FROM corrections WHERE id = ? AND case_id = ?", (correction_id, case_id)).fetchone()
    if not correction:
        return jsonify({'error': '补正通知不存在'}), 404
    items = db.execute(
        "SELECT ci.*, m.name as material_name FROM correction_items ci LEFT JOIN materials m ON ci.material_id = m.id WHERE ci.correction_id = ?",
        (correction_id,)
    ).fetchall()

    lines = []
    lines.append("=" * 60)
    lines.append("         法律援助补正通知书")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"案件编号：{case['case_number']}")
    lines.append(f"申请人  ：{case['applicant_name']}")
    lines.append(f"通知日期：{correction['notice_date']}")
    lines.append(f"补正期限：{correction['deadline']}")
    lines.append("")
    lines.append("【需补正材料】")
    for i, item in enumerate(items, 1):
        resolved_mark = '✓' if item['is_resolved'] else '✗'
        mat_name = item['material_name'] or ''
        lines.append(f"  {i}. [{resolved_mark}] {item['description']}" + (f"（{mat_name}）" if mat_name else ""))
    lines.append("")
    if correction['notes']:
        lines.append(f"【备注】{correction['notes']}")
        lines.append("")
    lines.append("请在补正期限内将上述材料提交至法律援助中心窗口。")
    lines.append("逾期未补正的，将依法不予受理。")
    lines.append("")
    lines.append("                    法律援助中心（盖章）")
    lines.append(f"                    {correction['notice_date']}")
    lines.append("")
    lines.append("=" * 60)

    content = "\n".join(lines)
    buf = BytesIO(content.encode('utf-8'))
    buf.seek(0)
    filename = f"补正通知_{case['case_number']}_{correction_id}.txt"
    return send_file(buf, as_attachment=True, download_name=filename, mimetype='text/plain; charset=utf-8')


# ── Frontend ──

@app.route('/')
def index():
    return render_template('index.html')


def seed_data():
    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON")
    db.row_factory = sqlite3.Row

    count = db.execute("SELECT COUNT(*) as cnt FROM users").fetchone()[0]
    if count > 0:
        db.close()
        return

    pw = hash_password('123456')
    db.execute("INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)",
               ('staff1', pw, 'window_staff', '窗口工作人员-张红'))
    db.execute("INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)",
               ('staff2', pw, 'window_staff', '窗口工作人员-李明'))
    db.execute("INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)",
               ('admin', pw, 'manager', '中心负责人-王主任'))

    db.execute("INSERT INTO lawyers (name, phone, specialty, status) VALUES (?, ?, ?, ?)",
               ('赵律师', '13800001111', '民事纠纷', 'available'))
    db.execute("INSERT INTO lawyers (name, phone, specialty, status) VALUES (?, ?, ?, ?)",
               ('钱律师', '13800002222', '刑事辩护', 'busy'))
    db.execute("INSERT INTO lawyers (name, phone, specialty, status) VALUES (?, ?, ?, ?)",
               ('孙律师', '13800003333', '劳动争议', 'available'))
    db.execute("INSERT INTO lawyers (name, phone, specialty, status) VALUES (?, ?, ?, ?)",
               ('李律师', '13800004444', '婚姻家庭', 'available'))

    now = datetime.now()
    fmt = '%Y-%m-%d %H:%M:%S'

    db.execute("INSERT INTO cases (case_number, applicant_name, id_number, phone, address, case_type, case_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
               ('FA-2026-0001', '陈建国', '320102198501121234', '13912345678', '南京市玄武区某某路12号', '民事', '邻居装修导致房屋墙体开裂，要求赔偿修缮费用', '材料补正中', 1,
                (now - timedelta(days=7)).strftime(fmt), (now - timedelta(days=2)).strftime(fmt)))

    c1_id = db.execute("SELECT id FROM cases WHERE case_number = 'FA-2026-0001'").fetchone()[0]
    for mat_name, status in [('身份证复印件', 'received'), ('低保证/经济困难证明', 'rejected'), ('案件相关证据材料', 'pending'), ('授权委托书', 'received')]:
        is_req = 1
        received_at = (now - timedelta(days=5)).strftime(fmt) if status == 'received' else None
        notes = '低保证有效期已过，需重新办理' if status == 'rejected' and mat_name == '低保证/经济困难证明' else ''
        db.execute("INSERT INTO materials (case_id, name, is_required, status, received_at, notes) VALUES (?, ?, ?, ?, ?, ?)",
                   (c1_id, mat_name, is_req, status, received_at, notes))

    corr1_date = (now - timedelta(days=2)).strftime('%Y-%m-%d')
    corr1_deadline = (now + timedelta(days=13)).strftime('%Y-%m-%d')
    db.execute("INSERT INTO corrections (case_id, notice_date, deadline, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c1_id, corr1_date, corr1_deadline, 'pending', '低保材料缺失，请尽快补正', (now - timedelta(days=2)).strftime(fmt)))
    corr1_id = db.execute("SELECT id FROM corrections WHERE case_id = ?", (c1_id,)).fetchone()[0]
    m_lowbao = db.execute("SELECT id FROM materials WHERE case_id = ? AND name = '低保证/经济困难证明'", (c1_id,)).fetchone()[0]
    m_evidence = db.execute("SELECT id FROM materials WHERE case_id = ? AND name = '案件相关证据材料'", (c1_id,)).fetchone()[0]
    db.execute("INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
               (corr1_id, m_lowbao, '低保证/经济困难证明：原证明已过期，请提交有效期内的低保证明'))
    db.execute("INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
               (corr1_id, m_evidence, '案件相关证据材料：请补充房屋开裂照片及物业鉴定报告'))

    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c1_id, '', '待初审', 1, '案件登记', (now - timedelta(days=7)).strftime(fmt)))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c1_id, '待初审', '材料补正中', 1, '生成补正通知', (now - timedelta(days=2)).strftime(fmt)))

    db.execute("INSERT INTO cases (case_number, applicant_name, id_number, phone, address, case_type, case_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
               ('FA-2026-0002', '刘美华', '320104199203055678', '13698765432', '南京市秦淮区某某小区3栋502室', '婚姻家庭', '丈夫长期家暴，要求离婚并争取孩子抚养权', '律师已接案', 1,
                (now - timedelta(days=15)).strftime(fmt), (now - timedelta(days=3)).strftime(fmt)))

    c2_id = db.execute("SELECT id FROM cases WHERE case_number = 'FA-2026-0002'").fetchone()[0]
    for mat_name, status in [('身份证复印件', 'received'), ('低保证/经济困难证明', 'received'), ('结婚证', 'received'), ('相关证据材料', 'received')]:
        received_at = (now - timedelta(days=10)).strftime(fmt) if status == 'received' else None
        db.execute("INSERT INTO materials (case_id, name, is_required, status, received_at, notes) VALUES (?, ?, ?, ?, ?, ?)",
                   (c2_id, mat_name, 1, status, received_at, ''))

    db.execute("INSERT INTO assignments (case_id, lawyer_id, assigned_by, assigned_at, accepted_at, status) VALUES (?, ?, ?, ?, ?, ?)",
               (c2_id, 4, 3, (now - timedelta(days=5)).strftime(fmt), (now - timedelta(days=3)).strftime(fmt), 'accepted'))

    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c2_id, '', '待初审', 1, '案件登记', (now - timedelta(days=15)).strftime(fmt)))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c2_id, '待初审', '已初审', 1, '材料齐全，初审通过', (now - timedelta(days=10)).strftime(fmt)))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c2_id, '已初审', '已分派律师', 3, '分派李律师', (now - timedelta(days=5)).strftime(fmt)))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c2_id, '已分派律师', '律师已接案', 3, '李律师已接受分派', (now - timedelta(days=3)).strftime(fmt)))

    db.execute("INSERT INTO cases (case_number, applicant_name, id_number, phone, address, case_type, case_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
               ('FA-2026-0003', '张伟', '320111200108011234', '15000009999', '南京市浦口区某某村', '劳动争议', '工厂拖欠工资6个月，要求支付工资及经济补偿', '材料补正中', 2,
                (now - timedelta(days=20)).strftime(fmt), (now - timedelta(days=1)).strftime(fmt)))

    c3_id = db.execute("SELECT id FROM cases WHERE case_number = 'FA-2026-0003'").fetchone()[0]
    for mat_name, status, notes in [
        ('身份证复印件', 'received', ''),
        ('低保证/经济困难证明', 'received', ''),
        ('劳动合同', 'rejected', '合同部分页面模糊，无法辨认甲方信息'),
        ('工资流水/欠条', 'pending', '')
    ]:
        is_req = 1
        received_at = (now - timedelta(days=18)).strftime(fmt) if status == 'received' else None
        db.execute("INSERT INTO materials (case_id, name, is_required, status, received_at, notes) VALUES (?, ?, ?, ?, ?, ?)",
                   (c3_id, mat_name, is_req, status, received_at, notes))

    corr2_date = (now - timedelta(days=14)).strftime('%Y-%m-%d')
    corr2_deadline = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    db.execute("INSERT INTO corrections (case_id, notice_date, deadline, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c3_id, corr2_date, corr2_deadline, 'pending', '身份证信息不清，劳动合同模糊', (now - timedelta(days=14)).strftime(fmt)))
    corr2_id = db.execute("SELECT id FROM corrections WHERE case_id = ? ORDER BY id DESC LIMIT 1", (c3_id,)).fetchone()[0]
    m_contract = db.execute("SELECT id FROM materials WHERE case_id = ? AND name = '劳动合同'", (c3_id,)).fetchone()[0]
    m_salary = db.execute("SELECT id FROM materials WHERE case_id = ? AND name = '工资流水/欠条'", (c3_id,)).fetchone()[0]
    db.execute("INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
               (corr2_id, m_contract, '劳动合同：部分页面模糊不清，请提交清晰完整版本'))
    db.execute("INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
               (corr2_id, m_salary, '工资流水/欠条：请提交银行工资流水或用人单位出具的欠条'))

    corr3_date = (now - timedelta(days=5)).strftime('%Y-%m-%d')
    corr3_deadline = (now + timedelta(days=10)).strftime('%Y-%m-%d')
    db.execute("INSERT INTO corrections (case_id, notice_date, deadline, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c3_id, corr3_date, corr3_deadline, 'pending', '第二次补正通知：身份证明不清', (now - timedelta(days=5)).strftime(fmt)))
    corr3_id = db.execute("SELECT id FROM corrections WHERE case_id = ? ORDER BY id DESC LIMIT 1", (c3_id,)).fetchone()[0]
    db.execute("INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
               (corr3_id, m_contract, '劳动合同：仍未提交清晰版本，请务必补正'))
    db.execute("INSERT INTO correction_items (correction_id, material_id, description) VALUES (?, ?, ?)",
               (corr3_id, m_salary, '工资流水/欠条：仍未提交，请尽快补正'))

    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c3_id, '', '待初审', 2, '案件登记', (now - timedelta(days=20)).strftime(fmt)))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c3_id, '待初审', '材料补正中', 2, '生成补正通知', (now - timedelta(days=14)).strftime(fmt)))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c3_id, '材料补正中', '材料补正中', 2, '第二次补正通知', (now - timedelta(days=5)).strftime(fmt)))

    db.execute("INSERT INTO cases (case_number, applicant_name, id_number, phone, address, case_type, case_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
               ('FA-2026-0004', '王秀兰', '320105197606078765', '13300001111', '南京市建邺区某某路88号', '民事', '购买的家具存在质量问题，商家拒绝退换', '待初审', 1,
                (now - timedelta(days=1)).strftime(fmt), (now - timedelta(days=1)).strftime(fmt)))
    c4_id = db.execute("SELECT id FROM cases WHERE case_number = 'FA-2026-0004'").fetchone()[0]
    for mat_name in ['身份证复印件', '低保证/经济困难证明', '案件相关证据材料', '授权委托书']:
        db.execute("INSERT INTO materials (case_id, name, is_required, status) VALUES (?, ?, 1, 'pending')", (c4_id, mat_name))
    db.execute("INSERT INTO progress_log (case_id, from_status, to_status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
               (c4_id, '', '待初审', 1, '案件登记', (now - timedelta(days=1)).strftime(fmt)))

    db.commit()
    db.close()


if __name__ == '__main__':
    init_db()
    seed_data()
    app.run(debug=True, port=5000)
