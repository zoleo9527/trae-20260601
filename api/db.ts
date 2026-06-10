import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(path.join(dataDir, 'maintenance.db'))

db.pragma('journal_mode = WAL')

db.exec(`
  DROP TABLE IF EXISTS order_notes;
  DROP TABLE IF EXISTS timeline_events;
  DROP TABLE IF EXISTS maintenance_orders;
`)

db.exec(`
  CREATE TABLE maintenance_orders (
    id TEXT PRIMARY KEY,
    elevator_no TEXT NOT NULL,
    elevator_address TEXT NOT NULL,
    maintenance_type TEXT NOT NULL CHECK(maintenance_type IN ('routine', 'quarterly', 'annual')),
    planned_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'checked_in', 'in_service', 'reviewing', 'completed', 'rejected')),
    assigned_technician TEXT NOT NULL,
    checkin_time TEXT,
    checkin_anomaly INTEGER DEFAULT 0,
    checkin_anomaly_desc TEXT,
    current_handler TEXT NOT NULL DEFAULT 'technician' CHECK(current_handler IN ('technician', 'service', 'supervisor')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE timeline_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES maintenance_orders(id),
    role TEXT NOT NULL CHECK(role IN ('technician', 'service', 'supervisor', 'system')),
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE order_notes (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES maintenance_orders(id),
    role TEXT NOT NULL CHECK(role IN ('technician', 'service', 'supervisor')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_orders_status ON maintenance_orders(status);
  CREATE INDEX idx_orders_handler ON maintenance_orders(current_handler);
  CREATE INDEX idx_timeline_order ON timeline_events(order_id);
  CREATE INDEX idx_notes_order ON order_notes(order_id);
`)

const seedOrders = [
  {
    id: 'ORD-001', elevator_no: 'DT-2026-A001', elevator_address: '上海市浦东新区陆家嘴环路1088号',
    maintenance_type: 'routine', planned_date: '2026-06-10', status: 'pending',
    assigned_technician: '张伟', checkin_time: null, checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'technician',
    created_at: '2026-06-08 09:00:00', updated_at: '2026-06-08 09:00:00',
  },
  {
    id: 'ORD-002', elevator_no: 'DT-2026-A002', elevator_address: '北京市朝阳区建国路93号万达广场',
    maintenance_type: 'quarterly', planned_date: '2026-06-11', status: 'pending',
    assigned_technician: '李明', checkin_time: null, checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'technician',
    created_at: '2026-06-08 09:15:00', updated_at: '2026-06-08 09:15:00',
  },
  {
    id: 'ORD-003', elevator_no: 'DT-2026-A003', elevator_address: '广州市天河区体育西路191号中石化大厦',
    maintenance_type: 'routine', planned_date: '2026-06-12', status: 'pending',
    assigned_technician: '王强', checkin_time: null, checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'technician',
    created_at: '2026-06-08 09:30:00', updated_at: '2026-06-08 09:30:00',
  },
  {
    id: 'ORD-004', elevator_no: 'DT-2026-B001', elevator_address: '深圳市南山区科技园南路18号',
    maintenance_type: 'annual', planned_date: '2026-06-05', status: 'checked_in',
    assigned_technician: '刘洋', checkin_time: '2026-06-05 08:45:00', checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'service',
    created_at: '2026-06-03 10:00:00', updated_at: '2026-06-05 08:45:00',
  },
  {
    id: 'ORD-005', elevator_no: 'DT-2026-B002', elevator_address: '杭州市西湖区文三路398号',
    maintenance_type: 'routine', planned_date: '2026-06-06', status: 'checked_in',
    assigned_technician: '陈刚', checkin_time: '2026-06-06 09:20:00', checkin_anomaly: 1,
    checkin_anomaly_desc: '电梯运行时出现异响，需进一步检查', current_handler: 'service',
    created_at: '2026-06-04 10:30:00', updated_at: '2026-06-06 09:20:00',
  },
  {
    id: 'ORD-006', elevator_no: 'DT-2026-C001', elevator_address: '成都市锦江区红星路三段1号',
    maintenance_type: 'quarterly', planned_date: '2026-05-28', status: 'reviewing',
    assigned_technician: '张伟', checkin_time: '2026-05-28 08:30:00', checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'supervisor',
    created_at: '2026-05-26 09:00:00', updated_at: '2026-05-29 14:00:00',
  },
  {
    id: 'ORD-007', elevator_no: 'DT-2026-C002', elevator_address: '武汉市江汉区解放大道688号武商广场',
    maintenance_type: 'annual', planned_date: '2026-05-25', status: 'reviewing',
    assigned_technician: '李明', checkin_time: '2026-05-25 09:00:00', checkin_anomaly: 1,
    checkin_anomaly_desc: '厅门闭合不严，已临时处理', current_handler: 'supervisor',
    created_at: '2026-05-23 08:30:00', updated_at: '2026-05-26 10:30:00',
  },
  {
    id: 'ORD-008', elevator_no: 'DT-2026-D001', elevator_address: '南京市鼓楼区中山北路283号',
    maintenance_type: 'routine', planned_date: '2026-05-20', status: 'completed',
    assigned_technician: '王强', checkin_time: '2026-05-20 08:30:00', checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'supervisor',
    created_at: '2026-05-18 10:00:00', updated_at: '2026-05-22 16:00:00',
  },
  {
    id: 'ORD-009', elevator_no: 'DT-2026-D002', elevator_address: '重庆市渝中区民权路28号',
    maintenance_type: 'quarterly', planned_date: '2026-05-15', status: 'completed',
    assigned_technician: '刘洋', checkin_time: '2026-05-15 09:45:00', checkin_anomaly: 0,
    checkin_anomaly_desc: null, current_handler: 'supervisor',
    created_at: '2026-05-13 09:00:00', updated_at: '2026-05-17 11:00:00',
  },
  {
    id: 'ORD-010', elevator_no: 'DT-2026-E001', elevator_address: '天津市和平区南京路189号',
    maintenance_type: 'routine', planned_date: '2026-05-22', status: 'rejected',
    assigned_technician: '陈刚', checkin_time: '2026-05-22 08:00:00', checkin_anomaly: 1,
    checkin_anomaly_desc: '制动器磨损严重，已更换但需复查', current_handler: 'service',
    created_at: '2026-05-20 08:00:00', updated_at: '2026-05-25 09:30:00',
  },
]

const seedTimelineEvents = [
  { id: 'TL-001', order_id: 'ORD-001', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-06-08 09:00:00' },
  { id: 'TL-002', order_id: 'ORD-002', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-06-08 09:15:00' },
  { id: 'TL-003', order_id: 'ORD-003', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-06-08 09:30:00' },
  { id: 'TL-004', order_id: 'ORD-004', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-06-03 10:00:00' },
  { id: 'TL-005', order_id: 'ORD-004', role: 'technician', action: '到场签到', detail: '技师刘洋已到场，现场正常', timestamp: '2026-06-05 08:45:00' },
  { id: 'TL-006', order_id: 'ORD-005', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-06-04 10:30:00' },
  { id: 'TL-007', order_id: 'ORD-005', role: 'technician', action: '到场签到', detail: '技师陈刚已到场，发现异常：电梯运行时出现异响', timestamp: '2026-06-06 09:20:00' },
  { id: 'TL-008', order_id: 'ORD-006', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-05-26 09:00:00' },
  { id: 'TL-009', order_id: 'ORD-006', role: 'technician', action: '到场签到', detail: '技师张伟已到场，现场正常', timestamp: '2026-05-28 08:30:00' },
  { id: 'TL-010', order_id: 'ORD-006', role: 'service', action: '跟进处理', detail: '客服已跟进，确认维保完成', timestamp: '2026-05-29 10:00:00' },
  { id: 'TL-011', order_id: 'ORD-006', role: 'service', action: '提交审核', detail: '客服提交主管审核', timestamp: '2026-05-29 14:00:00' },
  { id: 'TL-012', order_id: 'ORD-007', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-05-23 08:30:00' },
  { id: 'TL-013', order_id: 'ORD-007', role: 'technician', action: '到场签到', detail: '技师李明已到场，发现异常：厅门闭合不严', timestamp: '2026-05-25 09:00:00' },
  { id: 'TL-014', order_id: 'ORD-007', role: 'service', action: '跟进处理', detail: '客服已安排专项检修，厅门问题已临时处理', timestamp: '2026-05-26 09:00:00' },
  { id: 'TL-015', order_id: 'ORD-007', role: 'service', action: '提交审核', detail: '客服提交主管审核', timestamp: '2026-05-26 10:30:00' },
  { id: 'TL-016', order_id: 'ORD-008', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-05-18 10:00:00' },
  { id: 'TL-017', order_id: 'ORD-008', role: 'technician', action: '到场签到', detail: '技师王强已到场，现场正常', timestamp: '2026-05-20 08:30:00' },
  { id: 'TL-018', order_id: 'ORD-008', role: 'service', action: '提交审核', detail: '客服提交主管审核', timestamp: '2026-05-21 11:00:00' },
  { id: 'TL-019', order_id: 'ORD-008', role: 'supervisor', action: '审核通过', detail: '主管审核通过，维保合格', timestamp: '2026-05-22 16:00:00' },
  { id: 'TL-020', order_id: 'ORD-009', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-05-13 09:00:00' },
  { id: 'TL-021', order_id: 'ORD-009', role: 'technician', action: '到场签到', detail: '技师刘洋已到场，现场正常', timestamp: '2026-05-15 09:45:00' },
  { id: 'TL-022', order_id: 'ORD-009', role: 'service', action: '提交审核', detail: '客服提交主管审核', timestamp: '2026-05-16 14:30:00' },
  { id: 'TL-023', order_id: 'ORD-009', role: 'supervisor', action: '审核通过', detail: '主管审核通过，维保合格', timestamp: '2026-05-17 11:00:00' },
  { id: 'TL-024', order_id: 'ORD-010', role: 'system', action: '创建工单', detail: '系统自动生成维保计划', timestamp: '2026-05-20 08:00:00' },
  { id: 'TL-025', order_id: 'ORD-010', role: 'technician', action: '到场签到', detail: '技师陈刚已到场，发现异常：制动器磨损严重', timestamp: '2026-05-22 08:00:00' },
  { id: 'TL-026', order_id: 'ORD-010', role: 'service', action: '提交审核', detail: '客服提交主管审核，制动器已更换', timestamp: '2026-05-24 10:00:00' },
  { id: 'TL-027', order_id: 'ORD-010', role: 'supervisor', action: '审核退回', detail: '制动器更换后需复查确认，退回客服跟进', timestamp: '2026-05-25 09:30:00' },
]

const seedNotes = [
  { id: 'NT-001', order_id: 'ORD-005', role: 'technician', content: '电梯在3楼到4楼之间运行有异响，疑似导轨润滑不足，建议安排专项检修', timestamp: '2026-06-06 09:30:00' },
  { id: 'NT-002', order_id: 'ORD-006', role: 'service', content: '已与物业确认，维保期间电梯正常停用，物业配合良好', timestamp: '2026-05-29 10:30:00' },
  { id: 'NT-003', order_id: 'ORD-007', role: 'technician', content: '厅门闭合不严已临时调整，建议后续更换门滑块', timestamp: '2026-05-25 10:30:00' },
  { id: 'NT-004', order_id: 'ORD-007', role: 'service', content: '已通知物业厅门问题，安排下周更换门滑块配件', timestamp: '2026-05-26 09:30:00' },
  { id: 'NT-005', order_id: 'ORD-008', role: 'technician', content: '常规维保完成，各部件运行正常，润滑已补充', timestamp: '2026-05-20 11:00:00' },
  { id: 'NT-006', order_id: 'ORD-008', role: 'service', content: '物业反馈满意，维保后电梯运行平稳', timestamp: '2026-05-21 09:00:00' },
  { id: 'NT-007', order_id: 'ORD-009', role: 'service', content: '季度维保已完成，已与物业确认签字', timestamp: '2026-05-16 10:00:00' },
  { id: 'NT-008', order_id: 'ORD-010', role: 'technician', content: '制动器磨损严重已现场更换，但需复查确认制动效果', timestamp: '2026-05-22 11:00:00' },
  { id: 'NT-009', order_id: 'ORD-010', role: 'service', content: '已安排技师下周复查制动器，配件已申请', timestamp: '2026-05-24 11:00:00' },
  { id: 'NT-010', order_id: 'ORD-010', role: 'supervisor', content: '制动器更换后必须现场复查，退回客服安排', timestamp: '2026-05-25 09:30:00' },
]

const insertOrder = db.prepare(`
  INSERT INTO maintenance_orders (id, elevator_no, elevator_address, maintenance_type, planned_date, status, assigned_technician, checkin_time, checkin_anomaly, checkin_anomaly_desc, current_handler, created_at, updated_at)
  VALUES (@id, @elevator_no, @elevator_address, @maintenance_type, @planned_date, @status, @assigned_technician, @checkin_time, @checkin_anomaly, @checkin_anomaly_desc, @current_handler, @created_at, @updated_at)
`)

const insertTimeline = db.prepare(`
  INSERT INTO timeline_events (id, order_id, role, action, detail, timestamp)
  VALUES (@id, @order_id, @role, @action, @detail, @timestamp)
`)

const insertNote = db.prepare(`
  INSERT INTO order_notes (id, order_id, role, content, timestamp)
  VALUES (@id, @order_id, @role, @content, @timestamp)
`)

const seed = db.transaction(() => {
  for (const order of seedOrders) insertOrder.run(order)
  for (const event of seedTimelineEvents) insertTimeline.run(event)
  for (const note of seedNotes) insertNote.run(note)
})

seed()

export function rowToCamel(row: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    if (camelKey === 'checkinAnomaly') {
      result[camelKey] = Boolean(value)
    } else {
      result[camelKey] = value
    }
  }
  return result
}

export default db
