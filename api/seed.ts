import db, { initTables } from './db.js'

function ago(hours: number): string {
  const d = new Date(Date.now() - hours * 3600000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function future(hours: number): string {
  const d = new Date(Date.now() + hours * 3600000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function seed(): void {
  db.exec(`
    DROP TABLE IF EXISTS operation_logs;
    DROP TABLE IF EXISTS complaints;
    DROP TABLE IF EXISTS cupping_scores;
    DROP TABLE IF EXISTS inventory_batches;
    DROP TABLE IF EXISTS curve_versions;
    DROP TABLE IF EXISTS roast_curves;
  `)

  initTables()

  const insertCurve = db.prepare(
    `INSERT INTO roast_curves (bean_type, roast_level, status, current_version, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertVersion = db.prepare(
    `INSERT INTO curve_versions (curve_id, version_number, status, charge_temp, turn_point_temp, turn_point_time, first_crack_temp, first_crack_time, development_time, drop_temp, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertCupping = db.prepare(
    `INSERT INTO cupping_scores (curve_id, curve_version_id, batch_code, dry_aroma, wet_aroma, acidity, body, aftertaste, balance, overall, total_score, flavor_anomaly, anomaly_description, cupper_name, cupped_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertComplaint = db.prepare(
    `INSERT INTO complaints (customer_name, channel, content, curve_id, cupping_score_id, batch_code, status, handler, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertBatch = db.prepare(
    `INSERT INTO inventory_batches (bean_type, batch_code, quantity_kg, remaining_kg, roast_date, expiry_date, status, curve_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertLog = db.prepare(
    `INSERT INTO operation_logs (module, action, operator, target_type, target_id, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const tx = db.transaction(() => {
    const c1 = insertCurve.run('埃塞俄比亚 耶加雪菲', '浅烘', 'active', 1, '王烘焙', ago(72), ago(72))
    const c2 = insertCurve.run('哥伦比亚 慧兰', '中烘', 'active', 2, '王烘焙', ago(68), ago(12))
    const c3 = insertCurve.run('肯尼亚 AA', '浅烘', 'draft', 1, '王烘焙', ago(48), ago(48))
    const c4 = insertCurve.run('危地马拉 安提瓜', '中深烘', 'active', 1, '王烘焙', ago(96), ago(96))
    const c5 = insertCurve.run('巴西 桑托斯', '中烘', 'deprecated', 1, '王烘焙', ago(240), ago(72))
    const c6 = insertCurve.run('巴拿马 瑰夏', '浅烘', 'active', 1, '王烘焙', ago(36), ago(36))
    const c7 = insertCurve.run('苏门答腊 曼特宁', '深烘', 'draft', 1, '王烘焙', ago(8), ago(8))
    const c8 = insertCurve.run('哥斯达黎加 塔拉珠', '中烘', 'active', 2, '王烘焙', ago(120), ago(6))

    const v1 = insertVersion.run(c1.lastInsertRowid, 1, 'active', 200, 98, 1.5, 196, 6.2, 3.8, 198, '经典耶加雪菲曲线，花果香调', '王烘焙', ago(72))

    insertVersion.run(c2.lastInsertRowid, 1, 'draft', 195, 100, 1.8, 198, 7.0, 4.2, 200, '初版曲线，酸质偏高需调整', '王烘焙', ago(68))
    const v2v2 = insertVersion.run(c2.lastInsertRowid, 2, 'active', 198, 102, 1.6, 200, 6.8, 4.0, 202, '调整入豆温度和回温点，改善平衡度', '王烘焙', ago(12))

    const v3 = insertVersion.run(c3.lastInsertRowid, 1, 'draft', 202, 96, 1.3, 194, 5.8, 3.5, 196, '新曲线草稿，一爆偏早需验证', '王烘焙', ago(48))

    const v4 = insertVersion.run(c4.lastInsertRowid, 1, 'active', 190, 105, 2.0, 202, 8.5, 5.0, 204, '稳定中深烘曲线，巧克力调', '王烘焙', ago(96))

    insertVersion.run(c5.lastInsertRowid, 1, 'deprecated', 188, 108, 2.2, 200, 9.0, 5.5, 202, '已弃用，焦苦味过重', '王烘焙', ago(240))

    const v6 = insertVersion.run(c6.lastInsertRowid, 1, 'active', 205, 95, 1.2, 192, 5.5, 3.2, 194, '珍稀瑰夏专用浅烘曲线', '王烘焙', ago(36))

    insertVersion.run(c7.lastInsertRowid, 1, 'draft', 185, 110, 2.5, 205, 9.5, 6.0, 208, '深烘草稿，发展期过长需修正', '王烘焙', ago(8))

    insertVersion.run(c8.lastInsertRowid, 1, 'draft', 192, 103, 1.7, 197, 7.2, 4.5, 199, '初版，甜感不足', '王烘焙', ago(120))
    const v8v2 = insertVersion.run(c8.lastInsertRowid, 2, 'active', 195, 101, 1.5, 199, 6.5, 4.0, 201, '调整后甜感提升明显', '王烘焙', ago(6))

    insertCupping.run(c1.lastInsertRowid, v1.lastInsertRowid, 'BATCH-2024-001', 8.5, 8.0, 8.5, 7.5, 7.5, 8.0, 8.0, 56.0, 0, null, '李杯测', ago(70), ago(70))
    const cs2 = insertCupping.run(c2.lastInsertRowid, v2v2.lastInsertRowid, 'BATCH-2024-002', 7.0, 6.5, 5.0, 6.0, 5.5, 5.5, 5.0, 40.5, 1, '酸质尖锐不愉悦，入口刺舌，后段涩感明显', '李杯测', ago(60), ago(60))
    insertCupping.run(c4.lastInsertRowid, v4.lastInsertRowid, 'BATCH-2024-003', 7.5, 7.5, 7.0, 8.0, 7.5, 7.5, 7.5, 52.5, 0, null, '李杯测', ago(50), ago(50))
    const cs4 = insertCupping.run(c5.lastInsertRowid, 5, 'BATCH-2024-004', 5.0, 5.5, 4.0, 5.0, 4.0, 4.5, 4.0, 32.0, 1, '焦苦味明显，疑似过烘，炭烧味遮盖原有风味', '李杯测', ago(45), ago(45))
    insertCupping.run(c6.lastInsertRowid, v6.lastInsertRowid, 'BATCH-2024-005', 9.0, 9.0, 8.5, 7.5, 8.5, 8.5, 9.0, 60.0, 0, null, '李杯测', ago(30), ago(30))
    const cs6 = insertCupping.run(c3.lastInsertRowid, v3.lastInsertRowid, 'BATCH-2024-006', 6.5, 6.0, 4.5, 5.5, 5.0, 5.0, 4.5, 37.0, 1, '风味发展不充分，草青味重，疑似发展不足', '李杯测', ago(24), ago(24))
    insertCupping.run(c8.lastInsertRowid, v8v2.lastInsertRowid, 'BATCH-2024-007', 8.0, 7.5, 7.5, 7.5, 7.5, 8.0, 7.5, 53.5, 0, null, '李杯测', ago(5), ago(5))
    insertCupping.run(c2.lastInsertRowid, v2v2.lastInsertRowid, 'BATCH-2024-008', 7.5, 7.5, 7.0, 7.5, 7.0, 7.5, 7.0, 51.0, 0, null, '李杯测', ago(10), ago(10))
    const cs9 = insertCupping.run(c4.lastInsertRowid, v4.lastInsertRowid, 'BATCH-2024-009', 6.0, 5.5, 5.0, 6.5, 4.5, 5.0, 5.0, 37.5, 1, '该批次与同曲线其他批次差异大，怀疑烘焙不均匀', '李杯测', ago(3), ago(3))
    insertCupping.run(c1.lastInsertRowid, v1.lastInsertRowid, 'BATCH-2024-010', 8.0, 8.0, 8.0, 7.5, 7.5, 8.0, 7.5, 54.5, 0, null, '李杯测', ago(2), ago(2))

    insertComplaint.run('陈先生', '电话', '咖啡酸到喝不下，跟上次买的完全不一样', c2.lastInsertRowid, cs2.lastInsertRowid, 'BATCH-2024-002', 'resolved', '张客服', ago(55), ago(40))
    insertComplaint.run('刘女士', '微信', '这批巴西豆有很重的焦味，完全不能喝，要求退换', c5.lastInsertRowid, cs4.lastInsertRowid, 'BATCH-2024-004', 'processing', '张客服', ago(42), ago(18))
    insertComplaint.run('赵先生', '门店', '买到的危地马拉风味不对，感觉像换了一批豆子', c4.lastInsertRowid, cs9.lastInsertRowid, 'BATCH-2024-009', 'pending', null, ago(2), ago(2))
    insertComplaint.run('孙女士', '电商', '这批肯尼亚完全不是之前的风味了，感觉没烘好', c3.lastInsertRowid, cs6.lastInsertRowid, 'BATCH-2024-006', 'pending', null, ago(1), ago(1))

    insertBatch.run('埃塞俄比亚 耶加雪菲', 'BATCH-2024-001', 50.0, 30.0, ago(72), future(672), 'normal', c1.lastInsertRowid, ago(72))
    insertBatch.run('哥伦比亚 慧兰', 'BATCH-2024-002', 40.0, 15.0, ago(360), future(48), 'near_expiry', c2.lastInsertRowid, ago(360))
    insertBatch.run('危地马拉 安提瓜', 'BATCH-2024-003', 60.0, 45.0, ago(50), future(690), 'normal', c4.lastInsertRowid, ago(50))
    insertBatch.run('巴西 桑托斯', 'BATCH-2024-004', 30.0, 20.0, ago(720), ago(48), 'expired', c5.lastInsertRowid, ago(720))
    insertBatch.run('巴拿马 瑰夏', 'BATCH-2024-005', 10.0, 8.0, ago(30), future(714), 'normal', c6.lastInsertRowid, ago(30))
    insertBatch.run('哥斯达黎加 塔拉珠', 'BATCH-2024-007', 35.0, 20.0, ago(480), future(72), 'near_expiry', c8.lastInsertRowid, ago(480))

    insertLog.run('roast_curve', 'create', '王烘焙', 'roast_curve', Number(c1.lastInsertRowid), '创建曲线：埃塞俄比亚 耶加雪菲', ago(48))
    insertLog.run('roast_curve', 'create', '王烘焙', 'roast_curve', Number(c3.lastInsertRowid), '创建曲线：肯尼亚 AA', ago(48))
    insertLog.run('roast_curve', 'create', '王烘焙', 'roast_curve', Number(c7.lastInsertRowid), '创建曲线：苏门答腊 曼特宁', ago(8))
    insertLog.run('cupping_score', 'create', '李杯测', 'cupping_score', 2, '录入杯测评分：哥伦比亚 慧兰 BATCH-2024-002 异常', ago(60))
    insertLog.run('cupping_score', 'create', '李杯测', 'cupping_score', 4, '录入杯测评分：巴西 桑托斯 BATCH-2024-004 异常', ago(45))
    insertLog.run('complaint', 'create', '张客服', 'complaint', 1, '收到客诉：陈先生-咖啡酸到喝不下', ago(55))
    insertLog.run('complaint', 'update', '张客服', 'complaint', 1, '客诉处理完成：已为陈先生更换同款新批次', ago(40))
    insertLog.run('complaint', 'create', '张客服', 'complaint', 2, '收到客诉：刘女士-巴西豆焦味严重', ago(42))
    insertLog.run('complaint', 'update', '张客服', 'complaint', 2, '客诉处理中：已联系刘女士确认退换流程', ago(18))
    insertLog.run('roast_curve', 'update', '王烘焙', 'roast_curve', Number(c2.lastInsertRowid), '更新曲线版本：哥伦比亚 慧兰 v2', ago(12))
    insertLog.run('cupping_score', 'create', '李杯测', 'cupping_score', 6, '录入杯测评分：肯尼亚 AA BATCH-2024-006 异常', ago(24))
    insertLog.run('cupping_score', 'create', '李杯测', 'cupping_score', 8, '录入杯测评分：哥伦比亚 慧兰 BATCH-2024-008', ago(10))
    insertLog.run('complaint', 'create', '张客服', 'complaint', 3, '收到客诉：赵先生-危地马拉风味不对', ago(2))
    insertLog.run('cupping_score', 'create', '李杯测', 'cupping_score', 9, '录入杯测评分：危地马拉 安提瓜 BATCH-2024-009 异常', ago(3))
    insertLog.run('roast_curve', 'update', '王烘焙', 'roast_curve', Number(c8.lastInsertRowid), '更新曲线版本：哥斯达黎加 塔拉珠 v2', ago(6))
    insertLog.run('complaint', 'create', '张客服', 'complaint', 4, '收到客诉：孙女士-肯尼亚风味不足', ago(1))
    insertLog.run('inventory', 'update', '王烘焙', 'inventory_batch', 2, '库存批次状态更新：哥伦比亚 慧兰 临期', ago(6))
    insertLog.run('cupping_score', 'create', '李杯测', 'cupping_score', 10, '录入杯测评分：埃塞俄比亚 耶加雪菲 BATCH-2024-010', ago(2))
  })

  tx()
}

export default seed
