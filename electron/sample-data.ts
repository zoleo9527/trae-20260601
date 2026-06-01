import type { Database } from 'better-sqlite3'

export function insertSampleData(db: Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }
  if (count.c > 0) return

  const tx = db.transaction(() => {
    const userIdSales = 1
    const userIdDesign = 2
    const userIdProduction = 3

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260528001', 1, '华润万家超市', '端午促销宣传单', 50000, '210x285',
      '铜版纸', 157, '四色', '过光胶', 'normal', 'proof_rejected', 18500.00,
      '含10%损耗，另计送货费300元', '2026-05-28 10:30:00', userIdSales,
      '2026-06-08', '客户要求6月5日前必须出货，已备注加急', userIdSales
    )
    const order1Id = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }

    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order1Id.id, 1, '/samples/dw_duanwu_v1.pdf', 'dw_duanwu_v1.pdf', 'rejected',
      userIdDesign, userIdSales, '2026-05-29 14:20:00',
      'logo颜色偏暗，Pantone 186C改成Pantone 185C；右下角二维码扫描失败，请重新生成', 1
    )

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260529002', 2, '腾讯科技', 'Q2员工手册', 8000, '148x210',
      '哑粉纸', 200, '四色', '胶装', 'normal', 'proof_uploaded', 96800.00,
      '封面烫银，内页128P含插页', '2026-05-29 15:00:00', userIdSales,
      '2026-06-15', '共1200本，分深圳、北京、上海三地发货', userIdSales
    )
    const order2Id = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }

    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(order2Id.id, 1, '/samples/tencent_hr_v2.pdf', 'tencent_hr_v2.pdf', 'uploaded', userIdDesign, 1)

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260530003', 3, '星巴克咖啡', '夏季新品杯套', 200000, '110x260',
      '白卡纸', 250, '四色', '击凸', 'urgent', 'proof_approved', 72000.00,
      '专色印刷，需匹配星巴克绿 Pantone 3425C', '2026-05-30 09:15:00', userIdSales,
      '2026-06-05', '原纸张230g客户改250g，加厚度提升质感，差价已确认', userIdSales
    )
    const order3Id = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }

    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order3Id.id, 1, '/samples/sb_summer_v1.pdf', 'sb_summer_v1.pdf', 'rejected',
      userIdDesign, userIdSales, '2026-05-30 16:00:00', '请将纸张从230g改为250g白卡纸', 0
    )
    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order3Id.id, 2, '/samples/sb_summer_v2.pdf', 'sb_summer_v2.pdf', 'approved',
      userIdDesign, userIdSales, '2026-05-31 11:30:00', '纸张已更新为250g，颜色正确，可生产', 1
    )

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260531004', 4, '华为技术', 'Mate70发布会邀请函', 3000, '180x90',
      '特种纸', 300, '五色+UV', '烫金', 'emergency', 'scheduled', 31200.00,
      '加急订单，特急处理，插单优先', '2026-05-31 16:45:00', userIdSales,
      '2026-06-03', '6月3日下午6点前必须交货，发布会紧急插单！！！', userIdSales
    )
    const order4Id = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }

    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order4Id.id, 1, '/samples/hw_invite_final.pdf', 'hw_invite_final.pdf', 'approved',
      userIdDesign, userIdProduction, '2026-05-31 20:00:00', '生产总监特批，直接上线', 1
    )

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260601005', 5, '小米科技', '米家IoT产品包装盒', 20000, '260x180x80',
      '灰板纸', 350, '四色', '裱糊', 'normal', 'pending_schedule', 128000.00,
      '裱1200g灰板，覆哑膜', '2026-06-01 08:30:00', userIdSales,
      '2026-06-20', '', userIdSales
    )
    const order5Id = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }

    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order5Id.id, 1, '/samples/mi_box_v1.pdf', 'mi_box_v1.pdf', 'approved',
      userIdDesign, userIdSales, '2026-06-01 10:30:00', '确认无误，可以排产', 1
    )

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260601006', 1, '华润万家超市', '618购物节海报', 500, '570x840',
      '铜版纸', 200, '四色', '过哑胶', 'urgent', 'in_production', 6800.00,
      '618大促，加急', '2026-06-01 09:00:00', userIdSales,
      '2026-06-04', '全国门店同步使用', userIdSales
    )
    const order6Id = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }

    db.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order6Id.id, 1, '/samples/crv_618_v1.pdf', 'crv_618_v1.pdf', 'approved',
      userIdDesign, userIdSales, '2026-06-01 11:00:00', '确认生产', 1
    )

    db.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PF20260601007', 3, '星巴克咖啡', '会员卡包装封套', 50000, '90x60',
      '特种纸', 180, '烫金', '过光胶', 'normal', 'pending_quote', 0,
      null, null, null,
      '2026-06-25', '新会员体系升级包装', userIdSales
    )

    db.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order6Id.id, 2, '2026-06-01 08:00:00', '2026-06-01 12:30:00', 'in_progress', 0,
      '618海报，正四色印刷', userIdProduction
    )

    db.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order4Id.id, 1, '2026-06-01 13:00:00', '2026-06-01 17:00:00', 'scheduled', 100,
      '华为邀请函紧急插单！！！优先级最高，原单延后', userIdProduction
    )

    db.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order3Id.id, 1, '2026-06-01 18:00:00', '2026-06-02 02:00:00', 'scheduled', 50,
      '星巴克杯套，夜班赶货', userIdProduction
    )

    db.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order5Id.id, 6, '2026-06-02 08:00:00', '2026-06-03 18:00:00', 'scheduled', 0,
      '小米包装盒模切', userIdProduction
    )

    db.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order2Id.id, 3, '2026-06-03 08:00:00', '2026-06-05 18:00:00', 'scheduled', 0,
      '腾讯员工手册印刷', userIdProduction
    )

    db.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(order1Id.id, 'proof_uploaded', 'proof_rejected', userIdSales,
      'logo颜色Pantone 186C改185C，二维码重新生成')
    
    db.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(order3Id.id, 'pending_quote', 'quoted', userIdSales,
      '原230g客户改250g白卡纸，差价+3200元已确认')
    
    db.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(order3Id.id, 'proof_uploaded', 'proof_rejected', userIdSales,
      '纸张厚度不达标，请换250g')
    
    db.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(order3Id.id, 'proof_uploaded', 'proof_approved', userIdSales,
      'V2版本确认')
    
    db.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(order4Id.id, 'pending_quote', 'quoted', userIdSales,
      '特急订单，加60%加急费')
    
    db.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(order4Id.id, 'proof_approved', 'scheduled', userIdProduction,
      '紧急插单海德堡CD102-1，下午1点开机')
  })

  tx()
  console.log('Sample data inserted successfully')
}
