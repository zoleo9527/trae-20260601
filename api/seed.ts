import dotenv from 'dotenv'
dotenv.config()
import bcrypt from 'bcryptjs'
import pool from './db.js'

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash('123456', 10)

    await client.query(
      `INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
      ['cs001', passwordHash, '运营专员王明', 'operations']
    )
    await client.query(
      `INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
      ['cs002', passwordHash, '客服李芳', 'customer_service']
    )
    await client.query(
      `INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
      ['cs003', passwordHash, '设备维护员张伟', 'maintenance']
    )

    const userResult = await client.query('SELECT id, username, name, role FROM users ORDER BY id')
    const users = userResult.rows
    const operationsUser = users.find((u: any) => u.role === 'operations')
    const customerServiceUser = users.find((u: any) => u.role === 'customer_service')
    const maintenanceUser = users.find((u: any) => u.role === 'maintenance')

    const parkingLogs = [
      { plate_number: '京A12345', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 08:15:00', image_url: null },
      { plate_number: '京A12345', direction: 'out', gate_id: 2, gate_name: 'A区出口', timestamp: '2026-06-10 18:30:00', image_url: null },
      { plate_number: '京B67890', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 07:45:00', image_url: null },
      { plate_number: '京B67890', direction: 'out', gate_id: 3, gate_name: 'B区出口', timestamp: '2026-06-10 20:10:00', image_url: null },
      { plate_number: '京C11111', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-09 09:00:00', image_url: null },
      { plate_number: '京C11111', direction: 'out', gate_id: 2, gate_name: 'A区出口', timestamp: '2026-06-09 17:30:00', image_url: null },
      { plate_number: '京D22222', direction: 'in', gate_id: 4, gate_name: 'C区入口', timestamp: '2026-06-10 06:30:00', image_url: null },
      { plate_number: '京E33333', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 10:00:00', image_url: null },
      { plate_number: '京E33333', direction: 'out', gate_id: 2, gate_name: 'A区出口', timestamp: '2026-06-10 16:45:00', image_url: null },
      { plate_number: '京F44444', direction: 'in', gate_id: 3, gate_name: 'B区入口', timestamp: '2026-06-09 14:20:00', image_url: null },
      { plate_number: '京G55555', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 11:30:00', image_url: null },
      { plate_number: '京G55555', direction: 'out', gate_id: 2, gate_name: 'A区出口', timestamp: '2026-06-10 19:00:00', image_url: null },
      { plate_number: '京H66666', direction: 'in', gate_id: 4, gate_name: 'C区入口', timestamp: '2026-06-08 08:00:00', image_url: null },
      { plate_number: '京H66666', direction: 'out', gate_id: 4, gate_name: 'C区出口', timestamp: '2026-06-08 22:00:00', image_url: null },
      { plate_number: '京J77777', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 07:00:00', image_url: null },
      { plate_number: '京K88888', direction: 'in', gate_id: 3, gate_name: 'B区入口', timestamp: '2026-06-09 16:00:00', image_url: null },
      { plate_number: '京K88888', direction: 'out', gate_id: 3, gate_name: 'B区出口', timestamp: '2026-06-10 08:00:00', image_url: null },
      { plate_number: '京L99999', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 09:15:00', image_url: null },
      { plate_number: '京M00000', direction: 'in', gate_id: 4, gate_name: 'C区入口', timestamp: '2026-06-10 13:00:00', image_url: null },
      { plate_number: '京N12345', direction: 'in', gate_id: 1, gate_name: 'A区入口', timestamp: '2026-06-10 14:30:00', image_url: null },
      { plate_number: '京N12345', direction: 'out', gate_id: 2, gate_name: 'A区出口', timestamp: '2026-06-10 17:00:00', image_url: null },
      { plate_number: '京P56789', direction: 'in', gate_id: 3, gate_name: 'B区入口', timestamp: '2026-06-10 12:00:00', image_url: null },
    ]

    for (const log of parkingLogs) {
      await client.query(
        `INSERT INTO parking_logs (plate_number, direction, gate_id, gate_name, timestamp, image_url)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [log.plate_number, log.direction, log.gate_id, log.gate_name, log.timestamp, log.image_url]
      )
    }

    const monthlyRentals = [
      { plate_number: '京A12345', owner_name: '张建国', start_date: '2026-01-01', end_date: '2026-06-30', status: 'active', last_renewed_at: '2025-12-28 10:00:00' },
      { plate_number: '京B67890', owner_name: '李秀英', start_date: '2026-03-01', end_date: '2026-05-31', status: 'expired', last_renewed_at: '2026-02-25 14:30:00' },
      { plate_number: '京C11111', owner_name: '王大力', start_date: '2026-04-01', end_date: '2026-09-30', status: 'active', last_renewed_at: '2026-03-28 09:00:00' },
      { plate_number: '京D22222', owner_name: '赵小明', start_date: '2025-06-01', end_date: '2025-12-31', status: 'expired', last_renewed_at: null },
      { plate_number: '京E33333', owner_name: '陈美丽', start_date: '2026-01-01', end_date: '2026-12-31', status: 'active', last_renewed_at: '2025-12-30 11:00:00' },
      { plate_number: '京F44444', owner_name: '周伟强', start_date: '2026-02-01', end_date: '2026-04-30', status: 'suspended', last_renewed_at: '2026-01-28 16:00:00' },
      { plate_number: '京G55555', owner_name: '吴晓峰', start_date: '2026-05-01', end_date: '2026-10-31', status: 'active', last_renewed_at: '2026-04-28 08:30:00' },
      { plate_number: '京H66666', owner_name: '孙丽华', start_date: '2025-07-01', end_date: '2025-12-31', status: 'expired', last_renewed_at: null },
      { plate_number: '京J77777', owner_name: '黄明辉', start_date: '2026-06-01', end_date: '2026-11-30', status: 'active', last_renewed_at: '2026-05-29 10:15:00' },
      { plate_number: '京K88888', owner_name: '杨秀芳', start_date: '2026-03-01', end_date: '2026-05-15', status: 'suspended', last_renewed_at: '2026-02-27 13:00:00' },
      { plate_number: '京L99999', owner_name: '刘德强', start_date: '2026-04-01', end_date: '2026-03-31', status: 'expired', last_renewed_at: null },
      { plate_number: '京M00000', owner_name: '林志明', start_date: '2026-06-01', end_date: '2026-12-31', status: 'active', last_renewed_at: '2026-05-30 09:00:00' },
    ]

    for (const rental of monthlyRentals) {
      await client.query(
        `INSERT INTO monthly_rentals (plate_number, owner_name, start_date, end_date, status, parking_lot_id, last_renewed_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6) ON CONFLICT DO NOTHING`,
        [rental.plate_number, rental.owner_name, rental.start_date, rental.end_date, rental.status, rental.last_renewed_at]
      )
    }

    const gateAnomalies = [
      { gate_id: 1, gate_name: 'A区入口', anomaly_type: 'stuck_open', detected_at: '2026-06-08 07:30:00', resolved_at: '2026-06-08 09:00:00', resolved_by: '设备维护员张伟', impact_hours: 1.50, description: 'A区入口道闸无法关闭，栏杆卡在上位，排查为电机控制板故障' },
      { gate_id: 2, gate_name: 'A区出口', anomaly_type: 'sensor_error', detected_at: '2026-06-09 14:00:00', resolved_at: '2026-06-09 16:30:00', resolved_by: '设备维护员张伟', impact_hours: 2.50, description: 'A区出口地感线圈故障，车辆通过时无法触发抬杆信号' },
      { gate_id: 3, gate_name: 'B区入口', anomaly_type: 'force_open', detected_at: '2026-06-10 06:15:00', resolved_at: null, resolved_by: null, impact_hours: null, description: 'B区入口道闸被人工强行抬升，疑似违规放行' },
      { gate_id: 4, gate_name: 'C区入口', anomaly_type: 'stuck_closed', detected_at: '2026-06-10 08:00:00', resolved_at: null, resolved_by: null, impact_hours: null, description: 'C区入口道闸无法抬升，栏杆卡在下位，车主无法入场' },
      { gate_id: 1, gate_name: 'A区入口', anomaly_type: 'sensor_error', detected_at: '2026-06-07 22:00:00', resolved_at: '2026-06-08 01:00:00', resolved_by: '设备维护员张伟', impact_hours: 3.00, description: '夜间A区入口红外传感器误触发，道闸反复开合' },
      { gate_id: 3, gate_name: 'B区出口', anomaly_type: 'stuck_open', detected_at: '2026-06-05 11:00:00', resolved_at: '2026-06-05 12:00:00', resolved_by: '设备维护员张伟', impact_hours: 1.00, description: 'B区出口道闸卡在开启位置，弹簧断裂' },
    ]

    for (const anomaly of gateAnomalies) {
      await client.query(
        `INSERT INTO gate_anomalies (gate_id, gate_name, anomaly_type, detected_at, resolved_at, resolved_by, impact_hours, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
        [anomaly.gate_id, anomaly.gate_name, anomaly.anomaly_type, anomaly.detected_at, anomaly.resolved_at, anomaly.resolved_by, anomaly.impact_hours, anomaly.description]
      )
    }

    const complaints = [
      { complaint_no: 'CP20260610001', type: 'monthly_rental_expired', status: 'pending', plate_number: '京B67890', description: '车主李秀英月租已于5月31日到期，但系统仍显示可入场，需核实权限状态', parking_lot_id: 1, assignee_id: null, created_at: '2026-06-10 08:30:00', updated_at: '2026-06-10 08:30:00', deadline: '2026-06-11 08:30:00' },
      { complaint_no: 'CP20260610002', type: 'gate_malfunction', status: 'pending', plate_number: null, description: 'B区入口道闸被人工强行抬升，监控显示可疑人员手动操作放行无牌车辆', parking_lot_id: 1, assignee_id: null, created_at: '2026-06-10 06:30:00', updated_at: '2026-06-10 06:30:00', deadline: '2026-06-11 06:30:00' },
      { complaint_no: 'CP20260610003', type: 'unlicensed_vehicle', status: 'pending', plate_number: null, description: 'C区发现一辆无牌照白色SUV长期占用月租车位，车牌位置空置无法识别', parking_lot_id: 1, assignee_id: null, created_at: '2026-06-10 10:00:00', updated_at: '2026-06-10 10:00:00', deadline: '2026-06-11 10:00:00' },
      { complaint_no: 'CP20260609001', type: 'monthly_rental_expired', status: 'assigned', plate_number: '京D22222', description: '车主赵小明月租已于去年12月到期但仍有入场记录，需核查是否系统漏洞', parking_lot_id: 1, assignee_id: operationsUser.id, created_at: '2026-06-09 09:15:00', updated_at: '2026-06-09 10:00:00', deadline: '2026-06-10 09:15:00' },
      { complaint_no: 'CP20260609002', type: 'gate_malfunction', status: 'assigned', plate_number: null, description: 'A区出口地感线圈故障导致多辆车无法正常出场，车主投诉严重', parking_lot_id: 1, assignee_id: maintenanceUser.id, created_at: '2026-06-09 14:30:00', updated_at: '2026-06-09 15:00:00', deadline: '2026-06-10 14:30:00' },
      { complaint_no: 'CP20260608001', type: 'unlicensed_vehicle', status: 'processing', plate_number: null, description: '停车场B区发现两辆无牌车交替使用同一月租车位，疑似套用车位', parking_lot_id: 1, assignee_id: customerServiceUser.id, created_at: '2026-06-08 11:00:00', updated_at: '2026-06-09 09:00:00', deadline: '2026-06-09 11:00:00' },
      { complaint_no: 'CP20260608002', type: 'gate_malfunction', status: 'processing', plate_number: null, description: 'A区入口道闸夜间反复开合，红外传感器误触发，已影响夜间安全', parking_lot_id: 1, assignee_id: maintenanceUser.id, created_at: '2026-06-08 07:45:00', updated_at: '2026-06-08 08:30:00', deadline: '2026-06-09 07:45:00' },
      { complaint_no: 'CP20260607001', type: 'monthly_rental_expired', status: 'appealing', plate_number: '京F44444', description: '车主周伟强月租被暂停，车主申诉称已按时缴费但系统未更新，要求恢复权限', parking_lot_id: 1, assignee_id: operationsUser.id, created_at: '2026-06-07 10:00:00', updated_at: '2026-06-08 14:00:00', deadline: '2026-06-08 10:00:00' },
      { complaint_no: 'CP20260606001', type: 'gate_malfunction', status: 'appealing', plate_number: null, description: 'B区出口道闸弹簧断裂导致道闸无法关闭，车主质疑停车场安全管理', parking_lot_id: 1, assignee_id: maintenanceUser.id, created_at: '2026-06-06 13:00:00', updated_at: '2026-06-07 10:00:00', deadline: '2026-06-07 13:00:00' },
      { complaint_no: 'CP20260609003', type: 'unlicensed_vehicle', status: 'rejected', plate_number: null, description: '举报一辆无牌红色轿车长期停放，经核查为停车场管理人员临时车辆', parking_lot_id: 1, assignee_id: operationsUser.id, created_at: '2026-06-09 16:00:00', updated_at: '2026-06-10 09:00:00', deadline: '2026-06-10 16:00:00' },
      { complaint_no: 'CP20260609004', type: 'monthly_rental_expired', status: 'rejected', plate_number: '京K88888', description: '车主杨秀芳月租已过期但申诉称已续费，经查缴费记录未到账属个人原因', parking_lot_id: 1, assignee_id: customerServiceUser.id, created_at: '2026-06-09 08:00:00', updated_at: '2026-06-10 10:00:00', deadline: '2026-06-10 08:00:00' },
      { complaint_no: 'CP20260610004', type: 'gate_malfunction', status: 'rejected', plate_number: null, description: 'C区入口道闸无法抬升，但经核查为正常维护期间临时关闭，非故障', parking_lot_id: 1, assignee_id: maintenanceUser.id, created_at: '2026-06-10 08:15:00', updated_at: '2026-06-10 11:00:00', deadline: '2026-06-11 08:15:00' },
      { complaint_no: 'CP20260605001', type: 'monthly_rental_expired', status: 'closed', plate_number: '京H66666', description: '车主孙丽华月租已过期半年，经沟通确认不再续租，已注销权限', parking_lot_id: 1, assignee_id: operationsUser.id, created_at: '2026-06-05 09:00:00', updated_at: '2026-06-06 15:00:00', deadline: '2026-06-06 09:00:00' },
      { complaint_no: 'CP20260604001', type: 'gate_malfunction', status: 'closed', plate_number: null, description: 'A区入口电机控制板故障导致道闸卡住无法关闭，已更换控制板修复', parking_lot_id: 1, assignee_id: maintenanceUser.id, created_at: '2026-06-04 07:30:00', updated_at: '2026-06-04 16:00:00', deadline: '2026-06-05 07:30:00' },
      { complaint_no: 'CP20260610005', type: 'monthly_rental_expired', status: 'pending', plate_number: '京L99999', description: '车主刘德强月租权限失效但仍有入场记录，系统显示租期矛盾需核查', parking_lot_id: 1, assignee_id: null, created_at: '2026-06-10 11:00:00', updated_at: '2026-06-10 11:00:00', deadline: '2026-06-11 11:00:00' },
    ]

    for (const c of complaints) {
      await client.query(
        `INSERT INTO complaints (complaint_no, type, status, plate_number, description, parking_lot_id, assignee_id, created_at, updated_at, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (complaint_no) DO NOTHING`,
        [c.complaint_no, c.type, c.status, c.plate_number, c.description, c.parking_lot_id, c.assignee_id, c.created_at, c.updated_at, c.deadline]
      )
    }

    const complaintResult = await client.query('SELECT id, complaint_no, status, type, plate_number, assignee_id, created_at, updated_at FROM complaints ORDER BY id')
    const complaintRows = complaintResult.rows

    const timelineEntries: { complaint_idx: number; action: string; operator_id: number; operator_name: string; operator_role: string; detail: string; created_at: string }[] = []

    for (let i = 0; i < complaintRows.length; i++) {
      const c = complaintRows[i]
      timelineEntries.push({
        complaint_idx: i,
        action: 'created',
        operator_id: operationsUser.id,
        operator_name: operationsUser.name,
        operator_role: operationsUser.role,
        detail: '投诉已创建',
        created_at: c.created_at,
      })

      if (c.status === 'assigned' || c.status === 'processing' || c.status === 'appealing' || c.status === 'rejected' || c.status === 'closed') {
        const assignee = c.assignee_id === maintenanceUser.id ? maintenanceUser : (c.assignee_id === customerServiceUser.id ? customerServiceUser : operationsUser)
        timelineEntries.push({
          complaint_idx: i,
          action: 'assigned',
          operator_id: operationsUser.id,
          operator_name: operationsUser.name,
          operator_role: operationsUser.role,
          detail: `分配给: ${assignee.name}`,
          created_at: new Date(new Date(c.created_at).getTime() + 30 * 60000).toISOString().slice(0, 19).replace('T', ' '),
        })
        timelineEntries.push({
          complaint_idx: i,
          action: 'status_changed',
          operator_id: operationsUser.id,
          operator_name: operationsUser.name,
          operator_role: operationsUser.role,
          detail: '状态变更为: 已分配',
          created_at: new Date(new Date(c.created_at).getTime() + 35 * 60000).toISOString().slice(0, 19).replace('T', ' '),
        })
      }

      if (c.status === 'processing' || c.status === 'appealing' || c.status === 'rejected' || c.status === 'closed') {
        const assignee = c.assignee_id === maintenanceUser.id ? maintenanceUser : (c.assignee_id === customerServiceUser.id ? customerServiceUser : operationsUser)
        timelineEntries.push({
          complaint_idx: i,
          action: 'status_changed',
          operator_id: assignee.id,
          operator_name: assignee.name,
          operator_role: assignee.role,
          detail: '状态变更为: 处理中',
          created_at: new Date(new Date(c.created_at).getTime() + 120 * 60000).toISOString().slice(0, 19).replace('T', ' '),
        })
      }

      if (c.status === 'appealing') {
        const assignee = c.assignee_id === maintenanceUser.id ? maintenanceUser : (c.assignee_id === customerServiceUser.id ? customerServiceUser : operationsUser)
        timelineEntries.push({
          complaint_idx: i,
          action: 'appeal_submitted',
          operator_id: assignee.id,
          operator_name: assignee.name,
          operator_role: assignee.role,
          detail: '申诉理由: 当事人对处理结果不满意，要求重新审核',
          created_at: new Date(new Date(c.created_at).getTime() + 1440 * 60000).toISOString().slice(0, 19).replace('T', ' '),
        })
        timelineEntries.push({
          complaint_idx: i,
          action: 'status_changed',
          operator_id: assignee.id,
          operator_name: assignee.name,
          operator_role: assignee.role,
          detail: '状态变更为: 申诉中',
          created_at: new Date(new Date(c.created_at).getTime() + 1445 * 60000).toISOString().slice(0, 19).replace('T', ' '),
        })
      }

      if (c.status === 'rejected') {
        const assignee = c.assignee_id === maintenanceUser.id ? maintenanceUser : (c.assignee_id === customerServiceUser.id ? customerServiceUser : operationsUser)
        timelineEntries.push({
          complaint_idx: i,
          action: 'status_changed',
          operator_id: operationsUser.id,
          operator_name: operationsUser.name,
          operator_role: operationsUser.role,
          detail: '状态变更为: 已退回',
          created_at: new Date(new Date(c.updated_at).getTime() - 60 * 60000).toISOString().slice(0, 19).replace('T', ' '),
        })
      }

      if (c.status === 'closed') {
        const assignee = c.assignee_id === maintenanceUser.id ? maintenanceUser : (c.assignee_id === customerServiceUser.id ? customerServiceUser : operationsUser)
        timelineEntries.push({
          complaint_idx: i,
          action: 'status_changed',
          operator_id: assignee.id,
          operator_name: assignee.name,
          operator_role: assignee.role,
          detail: '状态变更为: 已关闭',
          created_at: c.updated_at,
        })
      }
    }

    for (const t of timelineEntries) {
      const complaintId = complaintRows[t.complaint_idx].id
      await client.query(
        `INSERT INTO complaint_timeline (complaint_id, action, operator_id, operator_name, operator_role, detail, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [complaintId, t.action, t.operator_id, t.operator_name, t.operator_role, t.detail, t.created_at]
      )
    }

    const parkingLogResult = await client.query('SELECT id, plate_number FROM parking_logs ORDER BY id')
    const rentalResult = await client.query('SELECT id, plate_number FROM monthly_rentals ORDER BY id')
    const anomalyResult = await client.query('SELECT id, gate_id FROM gate_anomalies ORDER BY id')

    const evidenceLinks: { complaint_id: number; evidence_type: string; evidence_id: number; linked_by: number }[] = []

    for (const c of complaintRows) {
      if (c.type === 'monthly_rental_expired' && c.plate_number) {
        const rental = rentalResult.rows.find((r: any) => r.plate_number === c.plate_number)
        if (rental) {
          evidenceLinks.push({ complaint_id: c.id, evidence_type: 'monthly_rental', evidence_id: rental.id, linked_by: operationsUser.id })
        }
        const logs = parkingLogResult.rows.filter((l: any) => l.plate_number === c.plate_number)
        for (const log of logs.slice(0, 2)) {
          evidenceLinks.push({ complaint_id: c.id, evidence_type: 'parking_log', evidence_id: log.id, linked_by: operationsUser.id })
        }
      }

      if (c.type === 'gate_malfunction') {
        const anomalies = anomalyResult.rows
        for (const anomaly of anomalies.slice(0, 2)) {
          evidenceLinks.push({ complaint_id: c.id, evidence_type: 'gate_anomaly', evidence_id: anomaly.id, linked_by: maintenanceUser.id })
        }
      }

      if (c.type === 'unlicensed_vehicle' && c.plate_number) {
        const logs = parkingLogResult.rows.filter((l: any) => l.plate_number === c.plate_number)
        for (const log of logs.slice(0, 2)) {
          evidenceLinks.push({ complaint_id: c.id, evidence_type: 'parking_log', evidence_id: log.id, linked_by: customerServiceUser.id })
        }
      }
    }

    for (const link of evidenceLinks) {
      await client.query(
        `INSERT INTO evidence_links (complaint_id, evidence_type, evidence_id, linked_by)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [link.complaint_id, link.evidence_type, link.evidence_id, link.linked_by]
      )
    }

    const evidenceReviews = [
      { complaint_idx: 0, reviewer_id: operationsUser.id, status: 'pending', blocked_reason: null },
      { complaint_idx: 1, reviewer_id: maintenanceUser.id, status: 'pending', blocked_reason: null },
      { complaint_idx: 2, reviewer_id: customerServiceUser.id, status: 'pending', blocked_reason: null },
      { complaint_idx: 3, reviewer_id: operationsUser.id, status: 'in_progress', blocked_reason: null },
      { complaint_idx: 4, reviewer_id: maintenanceUser.id, status: 'in_progress', blocked_reason: null },
      { complaint_idx: 5, reviewer_id: customerServiceUser.id, status: 'blocked', blocked_reason: '涉事车辆为无牌车，车场日志无法匹配车牌号' },
      { complaint_idx: 6, reviewer_id: maintenanceUser.id, status: 'blocked', blocked_reason: '道闸监控录像存储设备故障，无法调取当日视频' },
      { complaint_idx: 7, reviewer_id: operationsUser.id, status: 'in_progress', blocked_reason: null },
      { complaint_idx: 8, reviewer_id: maintenanceUser.id, status: 'completed', blocked_reason: null },
      { complaint_idx: 11, reviewer_id: operationsUser.id, status: 'blocked', blocked_reason: '月租缴费记录在旧系统中，尚未完成数据迁移' },
    ]

    for (const er of evidenceReviews) {
      const complaintId = complaintRows[er.complaint_idx].id
      await client.query(
        `INSERT INTO evidence_reviews (complaint_id, reviewer_id, status, blocked_reason)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [complaintId, er.reviewer_id, er.status, er.blocked_reason]
      )
    }

    await client.query('COMMIT')
    console.log('Seed data inserted successfully')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed error:', err)
    throw err
  } finally {
    client.release()
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
