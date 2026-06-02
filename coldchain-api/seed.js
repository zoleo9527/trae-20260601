const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, 'coldchain.db')
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)

const Database = require('better-sqlite3')
const { v7: uuidv7 } = require('uuid')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

require('./src/db').initSchema()

const now = new Date()
const fmt = (d) => d.toISOString()
const hoursAgo = (h) => fmt(new Date(now.getTime() - h * 3600000))

const SID1 = uuidv7()
const SID2 = uuidv7()

db.prepare(`
  INSERT INTO shipments (id, shipment_no, origin, destination, shipper_name, consignee_name,
    driver_name, driver_phone, vehicle_no, temp_min, temp_max, product_name, product_category,
    status, planned_departure, planned_arrival, actual_departure, actual_arrival, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(SID1, 'CC-2026-0601-001', '北京冷库A', '上海医院B', '北京生物制品', '上海瑞金医院',
  '张明', '13800138001', '京A-88956', 2.0, 8.0, '乙肝疫苗', 'vaccine',
  'disputed', hoursAgo(48), hoursAgo(36), hoursAgo(47), hoursAgo(13), '调度员-李芳', hoursAgo(48), hoursAgo(12))

db.prepare(`
  INSERT INTO shipments (id, shipment_no, origin, destination, shipper_name, consignee_name,
    driver_name, driver_phone, vehicle_no, temp_min, temp_max, product_name, product_category,
    status, planned_departure, planned_arrival, actual_departure, actual_arrival, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(SID2, 'CC-2026-0601-002', '广州冷链中心', '深圳配送站', '广东医药集团', '深圳中心医院',
  '王强', '13900139002', '粤B-66231', -25.0, -15.0, '重组蛋白', 'drug',
  'in_transit', hoursAgo(6), hoursAgo(1), hoursAgo(5.5), null, '调度员-陈伟', hoursAgo(6), hoursAgo(5.5))

const insertSample = db.prepare(`
  INSERT INTO temperature_samples (id, shipment_id, device_id, recorded_at, temperature, latitude, longitude, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const temps1 = []
for (let i = 0; i < 34; i++) {
  const t = hoursAgo(46 - i)
  let temp
  if (i < 8) temp = 3.5 + Math.random() * 2
  else if (i < 12) temp = 9.0 + Math.random() * 2.5
  else if (i < 18) temp = 3.0 + Math.random() * 1.5
  else if (i < 22) temp = 10.0 + Math.random() * 3
  else temp = 4.0 + Math.random() * 1.5
  temps1.push({ id: uuidv7(), shipment_id: SID1, device_id: 'TEMP-DEV-001', recorded_at: t, temperature: Math.round(temp * 10) / 10, latitude: 31.2 + Math.random() * 0.1, longitude: 121.4 + Math.random() * 0.1, created_at: t })
}

const temps2 = []
for (let i = 0; i < 12; i++) {
  const t = hoursAgo(5.5 - i * 0.4)
  const temp = -20.0 + Math.random() * 3
  temps2.push({ id: uuidv7(), shipment_id: SID2, device_id: 'TEMP-DEV-002', recorded_at: t, temperature: Math.round(temp * 10) / 10, latitude: 22.5 + Math.random() * 0.1, longitude: 114.0 + Math.random() * 0.1, created_at: t })
}

const insertAllSamples = db.transaction((temps) => {
  for (const s of temps) {
    insertSample.run(s.id, s.shipment_id, s.device_id, s.recorded_at, s.temperature, s.latitude, s.longitude, s.created_at)
  }
})
insertAllSamples([...temps1, ...temps2])

const AID1 = uuidv7()
const AID2 = uuidv7()

db.prepare(`
  INSERT INTO anomaly_intervals (id, shipment_id, started_at, ended_at, min_temp, max_temp,
    temp_lower_bound, temp_upper_bound, duration_seconds, sample_count, confirmed, confirmed_by, confirmed_at, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(AID1, SID1, temps1[8].recorded_at, temps1[11].recorded_at, 9.0, 11.5,
  2.0, 8.0, 10800, 4, 0, null, null, 'detected', hoursAgo(38), hoursAgo(38))

db.prepare(`
  INSERT INTO anomaly_intervals (id, shipment_id, started_at, ended_at, min_temp, max_temp,
    temp_lower_bound, temp_upper_bound, duration_seconds, sample_count, confirmed, confirmed_by, confirmed_at, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(AID2, SID1, temps1[18].recorded_at, temps1[21].recorded_at, 10.0, 13.0,
  2.0, 8.0, 14400, 4, 1, '质控-赵磊', hoursAgo(14), 'confirmed', hoursAgo(30), hoursAgo(14))

const RID1 = uuidv7()
db.prepare(`
  INSERT INTO delivery_receipts (id, shipment_id, receiver_name, receiver_phone, received_at,
    temperature_at_delivery, photo_urls, notes, uploaded_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(RID1, SID1, '刘护士', '021-6400-1234', hoursAgo(13), 4.5,
  JSON.stringify(['/uploads/receipt_001.jpg', '/uploads/thermometer_001.jpg']),
  '外观完好，但司机表示中途曾开箱检查', '张明', hoursAgo(13))

const DID1 = uuidv7()
db.prepare(`
  INSERT INTO disputes (id, shipment_id, initiated_by, reason, status, anomaly_interval_ids, evidence_summary, resolution, resolved_by, resolved_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(DID1, SID1, '客服-孙丽', '客户投诉签收时疫苗温度记录异常，要求提供全程温控证明。两次温度越界均超过30分钟，其中第一次越界区间尚未确认。', 'reviewing',
  JSON.stringify([AID1, AID2]),
  '签收照片显示温度正常，但中途有两次越界记录。调度群聊天记录显示司机曾汇报设备报警。温控平台导出数据显示累计越界时长超7小时。',
  null, null, null, hoursAgo(11), hoursAgo(11))

const insertLog = db.prepare(`
  INSERT INTO audit_logs (id, entity_type, entity_id, action, old_value, new_value, changed_by, changed_at, details)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const auditEntries = [
  [uuidv7(), 'shipment', SID1, 'create', null, 'created', '调度员-李芳', hoursAgo(48), JSON.stringify({ shipment_no: 'CC-2026-0601-001' })],
  [uuidv7(), 'shipment', SID1, 'status_change', 'created', 'in_transit', '调度员-李芳', hoursAgo(47), JSON.stringify({ from: 'created', to: 'in_transit' })],
  [uuidv7(), 'shipment', SID1, 'temperature_samples_added', null, '34 samples', 'TEMP-DEV-001', hoursAgo(38), JSON.stringify({ count: 34 })],
  [uuidv7(), 'shipment', SID1, 'anomalies_detected', null, '2 intervals', 'system', hoursAgo(38), JSON.stringify({ interval_count: 2 })],
  [uuidv7(), 'anomaly_interval', AID2, 'confirm', 'detected', 'confirmed', '质控-赵磊', hoursAgo(14), JSON.stringify({ shipment_id: SID1 })],
  [uuidv7(), 'shipment', SID1, 'delivery_receipt_uploaded', 'in_transit', 'delivered', '张明', hoursAgo(13), JSON.stringify({ receiver: '刘护士', photo_count: 2 })],
  [uuidv7(), 'dispute', DID1, 'create', null, 'open', '客服-孙丽', hoursAgo(11), JSON.stringify({ shipment_id: SID1, reason: '客户投诉签收时疫苗温度记录异常' })],
  [uuidv7(), 'anomaly_interval', AID1, 'status_change', 'detected', 'disputed', '客服-孙丽', hoursAgo(11), JSON.stringify({ dispute_id: DID1 })],
  [uuidv7(), 'anomaly_interval', AID2, 'status_change', 'confirmed', 'disputed', '客服-孙丽', hoursAgo(11), JSON.stringify({ dispute_id: DID1 })],
  [uuidv7(), 'shipment', SID1, 'status_change', 'delivered', 'disputed', '客服-孙丽', hoursAgo(11), JSON.stringify({ dispute_id: DID1, reason: '客户投诉签收时疫苗温度记录异常', anomaly_intervals: [AID1, AID2] })],
  [uuidv7(), 'dispute', DID1, 'update', 'open', 'reviewing', '质控主管-钱工', hoursAgo(11), JSON.stringify({ resolution: '复核中...' })],
]
const insertAllLogs = db.transaction((entries) => {
  for (const e of entries) insertLog.run(...e)
})
insertAllLogs(auditEntries)

console.log('种子数据已写入:')
console.log(`  运单1: ${SID1} (CC-2026-0601-001, 北京→上海, 状态: disputed)`)
console.log(`    - 34条温控采样 (含2段越界)`)
console.log(`    - 2个异常区间 (1个已确认, 1个待确认)`)
console.log(`    - 1条签收记录`)
console.log(`    - 1条争议 (reviewing)`)
console.log(`    - 11条审计日志`)
console.log(`  运单2: ${SID2} (CC-2026-0601-002, 广州→深圳, 状态: in_transit)`)
console.log(`    - 12条温控采样 (无越界)`)
console.log()
console.log('启动服务: npm start')
console.log('运行测试: bash test.sh')

db.close()
