import { getDb, initDb } from './db.js'
import { randomUUID } from 'crypto'

export function seed() {
  const db = initDb()

  const staffCount = db.prepare('SELECT COUNT(*) AS c FROM staff').get()
  if (staffCount.c > 0) {
    console.log('数据已存在，跳过 seed')
    return
  }

  const insertStaff = db.prepare(
    `INSERT INTO staff (id, name, role, password) VALUES (?, ?, ?, ?)`
  )
  const insertItem = db.prepare(
    `INSERT INTO lost_items (
      id, room_number, item_name, item_description, category,
      found_by, found_by_role, found_at, location_detail, storage_location,
      status, claimant_name, claimant_id_type, claimant_id_number,
      contact_phone, claim_at, verified_by, return_reason,
      supplementary_notes, handled_by, handled_at,
      exception_type, exception_note
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )`
  )

  const staffData = [
    { id: 's1', name: '王主管', role: 'supervisor', password: '123456' },
    { id: 's2', name: '李保洁', role: 'cleaner', password: '123456' },
    { id: 's3', name: '赵保洁', role: 'cleaner', password: '123456' },
    { id: 's4', name: '张工程师', role: 'engineer', password: '123456' },
  ]

  const insertAll = db.transaction(() => {
    for (const s of staffData) {
      insertStaff.run(s.id, s.name, s.role, s.password)
    }

    const now = new Date().toISOString()

    insertItem.run(
      'li-001', '1201', '黑色钱包', '内有现金约800元及身份证一张', '贵重物品',
      '李保洁', 'cleaner', '2026-06-07T09:30:00', '床头柜抽屉内', '前台保险柜',
      'registered',
      null, null, null, null, null, null, null,
      null, null, null,
      null, null
    )

    insertItem.run(
      'li-002', '1508', 'iPad Air', '银色，贴有猫咪贴纸，屏幕有裂纹', '贵重物品',
      '赵保洁', 'cleaner', '2026-06-07T14:20:00', '衣柜上层', '客房中心',
      'claimed',
      '刘先生', '身份证', '110101199001011234',
      '13800138001', '2026-06-07T18:00:00', '王主管', null,
      '客人称iPad为退房时遗忘，描述与登记一致，贴纸位置核实通过',
      '王主管', '2026-06-07T18:05:00',
      null, null
    )

    insertItem.run(
      'li-003', '902', '两条浴巾', '白色浴巾，无明显污损', '普通物品',
      '李保洁', 'cleaner', '2026-06-08T08:15:00', '浴室', '客房中心',
      'registered',
      null, null, null, null, null, null, null,
      null, null, null,
      '布草亏损', '房间布草记录显示该房间应配4条浴巾，退房时仅2条，客人否认带走，无法确认归属'
    )

    insertItem.run(
      'li-004', '2103', '充电宝', '白色20000mAh，无标识', '普通物品',
      '张工程师', 'engineer', '2026-06-08T10:00:00', '书桌插座旁', '客房中心',
      'registered',
      null, null, null, null, null, null, null,
      null, null, null,
      null, null
    )

    insertItem.run(
      'li-005', '706', '护照', '日本国护照，姓名 Tanaka Yuki', '贵重物品',
      '赵保洁', 'cleaner', '2026-06-08T11:30:00', '枕头下方', '前台保险柜',
      'registered',
      null, null, null, null, null, null, null,
      null, null, null,
      null, null
    )

    insertItem.run(
      'li-006', '1802', '戒指', '银色细环，无宝石', '贵重物品',
      '李保洁', 'cleaner', '2026-06-08T07:00:00', '洗手台台面', '前台保险柜',
      'disputed',
      null, null, null, null, null, null, null,
      null, null, null,
      '客人争议', '两位客人同时声称该戒指为自己所有，正在等待公安介入处理'
    )
  })

  insertAll()
  console.log('seed 完成：4名员工 + 6条遗留物记录')
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seed()
}
