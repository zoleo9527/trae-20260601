import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.resolve(__dirname, '..', 'data.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('客服', '派件员', '驿站负责人')),
    display_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_no TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '待派件员确认',
    created_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS return_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_id INTEGER NOT NULL REFERENCES returns(id),
    from_status TEXT,
    to_status TEXT NOT NULL,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    operator_role TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    action TEXT NOT NULL,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_id INTEGER NOT NULL REFERENCES returns(id),
    conclusion TEXT NOT NULL,
    improvement TEXT,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    operator_role TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
  CREATE INDEX IF NOT EXISTS idx_returns_created_by ON returns(created_by);
  CREATE INDEX IF NOT EXISTS idx_returns_tracking_no ON returns(tracking_no);
  CREATE INDEX IF NOT EXISTS idx_return_logs_return_id ON return_logs(return_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_return_id ON reviews(return_id);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('123456', 10)
  const insertUser = db.prepare(
    'INSERT INTO users (username, password, role, display_name) VALUES (?, ?, ?, ?)'
  )
  insertUser.run('kefu01', hashedPassword, '客服', '张客服')
  insertUser.run('paijian01', hashedPassword, '派件员', '李派件')
  insertUser.run('yizhan01', hashedPassword, '驿站负责人', '王站长')

  const insertReturn = db.prepare(
    'INSERT INTO returns (tracking_no, reason, status, created_by, assigned_to) VALUES (?, ?, ?, ?, ?)'
  )
  const insertLog = db.prepare(
    'INSERT INTO return_logs (return_id, from_status, to_status, operator_id, operator_role, operator_name, action, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertReview = db.prepare(
    'INSERT INTO reviews (return_id, conclusion, improvement, operator_id, operator_role, operator_name) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const seedTransaction = db.transaction(() => {
    insertReturn.run('SF2024060900001', '收件人拒收', '待派件员确认', 1, null)
    const r1 = (db.prepare('SELECT last_insert_rowid() as id').get() as any).id || 1
    insertLog.run(r1, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', '客户电话拒收')

    insertReturn.run('SF2024060900002', '地址错误无法送达', '复盘完成', 1, 2)
    const r2Id = db.prepare('SELECT id FROM returns WHERE tracking_no = ?').get('SF2024060900002') as any
    const r2 = r2Id.id
    insertLog.run(r2, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', null)
    insertLog.run(r2, '待派件员确认', '待驿站认定', 2, '派件员', '李派件', '派件员确认', '已联系收件人确认地址有误')
    insertLog.run(r2, '待驿站认定', '退回处理完成', 3, '驿站负责人', '王站长', '驿站认定通过', null)
    insertLog.run(r2, '退回处理完成', '复盘进行中', 3, '驿站负责人', '王站长', '开始复盘', null)
    insertReview.run(r2, '派件员未核实地址导致投递失败', '增加派件前电话确认环节', 3, '驿站负责人', '王站长')
    insertLog.run(r2, '复盘进行中', '复盘完成', 3, '驿站负责人', '王站长', '追加复盘', null)
    insertReview.run(r2, '后续需加强地址核验培训', null, 3, '驿站负责人', '王站长')

    insertReturn.run('SF2024060900003', '包裹破损退回', '已驳回-待补录', 1, 2)
    const r3Id = db.prepare('SELECT id FROM returns WHERE tracking_no = ?').get('SF2024060900003') as any
    const r3 = r3Id.id
    insertLog.run(r3, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', '外包装明显破损')
    insertLog.run(r3, '待派件员确认', '待驿站认定', 2, '派件员', '李派件', '派件员确认', '签收时已破损')
    insertLog.run(r3, '待驿站认定', '已驳回-待补录', 3, '驿站负责人', '王站长', '驿站驳回', '需提供破损照片证据')

    insertReturn.run('SF2024060900004', '超时未取件', '待驿站认定', 1, 2)
    const r4Id = db.prepare('SELECT id FROM returns WHERE tracking_no = ?').get('SF2024060900004') as any
    const r4 = r4Id.id
    insertLog.run(r4, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', null)
    insertLog.run(r4, '待派件员确认', '待驿站认定', 2, '派件员', '李派件', '派件员确认', '驿站超5天未取件')

    insertReturn.run('SF2024060900005', '联系方式错误', '退回处理完成', 1, 2)
    const r5Id = db.prepare('SELECT id FROM returns WHERE tracking_no = ?').get('SF2024060900005') as any
    const r5 = r5Id.id
    insertLog.run(r5, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', null)
    insertLog.run(r5, '待派件员确认', '待驿站认定', 2, '派件员', '李派件', '派件员确认', null)
    insertLog.run(r5, '待驿站认定', '退回处理完成', 3, '驿站负责人', '王站长', '驿站认定通过', null)

    insertReturn.run('SF2024060900006', '收件人不在指定地址', '已驳回-待客服补录', 1, 1)
    const r6Id = db.prepare('SELECT id FROM returns WHERE tracking_no = ?').get('SF2024060900006') as any
    const r6 = r6Id.id
    insertLog.run(r6, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', null)
    insertLog.run(r6, '待派件员确认', '待驿站认定', 2, '派件员', '李派件', '派件员确认', '联系不上收件人')
    insertLog.run(r6, '待驿站认定', '已驳回-待补录', 3, '驿站负责人', '王站长', '驿站驳回', '需确认是否有二次派送记录')
    insertLog.run(r6, '已驳回-待补录', '已驳回-待客服补录', 2, '派件员', '李派件', '派件员驳回至客服', '无法提供二次派送记录，需客服核实原始信息')

    insertReturn.run('SF2024060900007', '重复投递', '复盘进行中', 1, 2)
    const r7Id = db.prepare('SELECT id FROM returns WHERE tracking_no = ?').get('SF2024060900007') as any
    const r7 = r7Id.id
    insertLog.run(r7, null, '待派件员确认', 1, '客服', '张客服', '创建退回单', '系统显示已签收但实际未收到')
    insertLog.run(r7, '待派件员确认', '待驿站认定', 2, '派件员', '李派件', '派件员确认', '确认是系统误标记')
    insertLog.run(r7, '待驿站认定', '退回处理完成', 3, '驿站负责人', '王站长', '驿站认定通过', null)
    insertLog.run(r7, '退回处理完成', '复盘进行中', 3, '驿站负责人', '王站长', '开始复盘', null)
    insertReview.run(r7, '系统签收状态与实际不符，存在操作风险', '加强签收确认流程，增加扫码签收二次确认', 3, '驿站负责人', '王站长')
  })

  seedTransaction()
}

export default db
