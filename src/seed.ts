import { getDb, initDb } from './db'

export function seed() {
  initDb()
  const db = getDb()

  const count = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c
  if (count > 0) {
    console.log('种子数据已存在，跳过')
    return
  }

  const insertUser = db.prepare('INSERT INTO users (name, role, enterprise_id, password) VALUES (?,?,?,?)')
  const insertEnterprise = db.prepare('INSERT INTO enterprises (name, contact_name, contact_phone, floor) VALUES (?,?,?,?)')
  const insertEmployee = db.prepare('INSERT INTO employees (enterprise_id, name, phone, position) VALUES (?,?,?,?)')
  const insertVisitor = db.prepare('INSERT INTO visitors (enterprise_id, host_employee_id, name, phone, purpose, visit_date, status) VALUES (?,?,?,?,?,?,?)')
  const insertAccess = db.prepare('INSERT INTO access_records (visitor_id, gate_no, pass_type, direction, verified_by, note, created_at) VALUES (?,?,?,?,?,?,?)')
  const insertRepair = db.prepare('INSERT INTO repair_orders (enterprise_id, reporter_id, title, description, location, urgency, status, deadline, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
  const insertWorkOrder = db.prepare('INSERT INTO work_orders (repair_order_id, engineer_id, status, assigned_at, accepted_at, completed_at, note) VALUES (?,?,?,?,?,?,?)')
  const insertEvaluation = db.prepare('INSERT INTO evaluations (repair_order_id, rater_id, rating, comment, created_at) VALUES (?,?,?,?,?)')

  const tx = db.transaction(() => {
    insertEnterprise.run('星辰科技有限公司', '王建国', '13800001111', 'A栋3楼')
    insertEnterprise.run('云帆网络科技', '李秀英', '13900002222', 'B栋5楼')
    insertEnterprise.run('碧海贸易公司', '赵明远', '13700003333', 'A栋8楼')

    insertUser.run('门岗-张师傅', 'gate', null, '123456')
    insertUser.run('客服-小陈', 'cs', null, '123456')
    insertUser.run('客服-小刘', 'cs', null, '123456')
    insertUser.run('工程师-老王', 'engineer', null, '123456')
    insertUser.run('工程师-小赵', 'engineer', null, '123456')
    insertUser.run('主管-周经理', 'supervisor', null, '123456')

    insertEmployee.run(1, '陈总监', '15011112222', '技术总监')
    insertEmployee.run(1, '林工', '15011113333', '前端工程师')
    insertEmployee.run(2, '张总', '15022221111', 'CEO')
    insertEmployee.run(2, '刘经理', '15022223333', '产品经理')
    insertEmployee.run(3, '孙主任', '15033331111', '行政主任')

    insertVisitor.run(2, 4, '吴先生', '18600001111', '商务洽谈', '2026-06-03', 'pending')
    insertVisitor.run(1, 1, '郑女士', '18600002222', '面试', '2026-06-01', 'arrived')
    insertVisitor.run(1, 2, '黄先生', '18600003333', '设备维保', '2026-06-02', 'pending')
    insertVisitor.run(3, 5, '周先生', '18600004444', '合同签署', '2026-05-30', 'cancelled')

    insertAccess.run(2, '东门1号', 'normal', 'in', 1, '已核实预约', '2026-06-01 09:15:00')
    insertAccess.run(2, '东门1号', 'normal', 'out', 1, null, '2026-06-01 11:30:00')
    insertAccess.run(null, '东门1号', 'temporary', 'in', 1, '未预约快递员，临时放行', '2026-06-01 14:20:00')
    insertAccess.run(null, '西门2号', 'temporary', 'in', 1, '外卖配送临时放行', '2026-06-01 12:05:00')

    insertRepair.run(1, 2, 'A栋3楼空调不制冷', '会议室空调开启后无冷气，已持续两天', 'A栋3楼会议室', 'high', 'assigned', '2026-06-01', '2026-05-30')
    insertRepair.run(2, 2, 'B栋5楼网络中断', '整层网络断连，影响全员办公', 'B栋5楼', 'high', 'in_progress', '2026-06-05', '2026-06-01')
    insertRepair.run(1, 3, 'A栋3楼卫生间漏水', '男卫生间天花板漏水，地面湿滑', 'A栋3楼男卫生间', 'medium', 'pending', '2026-06-03', '2026-06-01')
    insertRepair.run(3, 2, 'A栋8楼门禁卡失灵', '3张门禁卡无法刷开8楼大门', 'A栋8楼入口', 'low', 'completed', '2026-05-28', '2026-05-25')
    insertRepair.run(2, 3, 'B栋5楼消防通道灯不亮', '消防通道应急灯全部不亮', 'B栋5楼消防通道', 'high', 'pending', '2026-05-20', '2026-05-18')

    insertWorkOrder.run(1, 4, 'accepted', '2026-05-30 10:00:00', '2026-05-30 14:00:00', null, null)
    insertWorkOrder.run(2, 5, 'in_progress', '2026-06-01 09:00:00', '2026-06-01 09:30:00', null, null)
    insertWorkOrder.run(4, 4, 'completed', '2026-05-25 11:00:00', '2026-05-25 11:30:00', '2026-05-26 16:00:00', '已更换门禁读卡器')

    insertEvaluation.run(4, 5, 1, '维修后门禁第二天又坏了，需要再次报修', '2026-05-27')
    insertEvaluation.run(4, 3, 2, '响应速度可以，但问题没彻底解决', '2026-05-28')
  })

  tx()
  console.log('种子数据写入完成')
}

if (require.main === module) {
  seed()
}
