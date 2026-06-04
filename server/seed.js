import { initDb, getDb, closeDb } from './db.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const HERBS_POOL = [
  { name: '黄芪', amount: '30g' },
  { name: '当归', amount: '15g' },
  { name: '白术', amount: '12g' },
  { name: '茯苓', amount: '15g' },
  { name: '甘草', amount: '6g' },
  { name: '党参', amount: '20g' },
  { name: '陈皮', amount: '10g' },
  { name: '半夏', amount: '9g' },
  { name: '柴胡', amount: '10g' },
  { name: '川芎', amount: '10g' },
  { name: '白芍', amount: '15g' },
  { name: '熟地黄', amount: '20g' },
  { name: '枸杞子', amount: '15g' },
  { name: '山药', amount: '20g' },
  { name: '泽泻', amount: '10g' },
  { name: '牡丹皮', amount: '10g' },
  { name: '桂枝', amount: '10g' },
  { name: '防风', amount: '10g' },
  { name: '黄芩', amount: '10g' },
  { name: '栀子', amount: '6g' },
]

const PATIENTS = [
  '张伟', '王芳', '李强', '刘洋', '陈静',
  '杨光', '赵敏', '黄磊', '周琳', '吴涛',
  '徐明', '孙丽', '马超', '朱红', '胡军',
]

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function generateHerbs() {
  const count = 4 + Math.floor(Math.random() * 5)
  const selected = pickRandom(HERBS_POOL, count)
  return selected
}

function generateCode(prefix, index) {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `${prefix}${dateStr}${String(index).padStart(4, '0')}`
}

export function seed() {
  const db = initDb()

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (userCount > 0) {
    console.log('数据库已有数据，跳过种子数据。如需重置，请删除 data/pharmacy.db 后重新运行。')
    return
  }

  const insertUser = db.prepare(`
    INSERT INTO users (name, role, password) VALUES (?, ?, ?)
  `)

  const users = []
  const pharmacistData = [
    { name: '赵药师', role: 'pharmacist' },
    { name: '钱药师', role: 'pharmacist' },
  ]
  const workerData = [
    { name: '孙煎药员', role: 'worker' },
    { name: '李煎药员', role: 'worker' },
  ]
  const deliveryData = [
    { name: '周客服', role: 'delivery' },
    { name: '吴客服', role: 'delivery' },
  ]

  for (const u of [...pharmacistData, ...workerData, ...deliveryData]) {
    const result = insertUser.run(u.name, u.role, '123456')
    users.push({ id: result.lastInsertRowid, ...u })
  }

  const pharmacists = users.filter(u => u.role === 'pharmacist')
  const workers = users.filter(u => u.role === 'worker')

  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions (code, patient_name, herbs, dosage, notes, status, reviewer_id, reviewed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertBatch = db.prepare(`
    INSERT INTO decoction_batches (batch_code, prescription_id, worker_id, status, decoction_method, water_ratio, duration_minutes, started_at, completed_at, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLabel = db.prepare(`
    INSERT INTO packaging_labels (label_code, batch_id, prescription_id, status, package_count, labeled_at, shipped_at, delivered_at, tracking_no, courier, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLog = db.prepare(`
    INSERT INTO status_logs (entity_type, entity_id, entity_code, from_status, to_status, operator_id, operator_name, operator_role, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
  const twoHoursAgo = new Date(Date.now() - 7200000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
  const threeHoursAgo = new Date(Date.now() - 10800000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0]

  const prescriptions = []

  const prescriptionConfigs = [
    { patient: PATIENTS[0], dosage: 7, status: 'approved', herbs: [0, 1, 2, 3, 4, 5] },
    { patient: PATIENTS[1], dosage: 5, status: 'approved', herbs: [1, 3, 5, 7, 9] },
    { patient: PATIENTS[2], dosage: 3, status: 'approved', herbs: [0, 2, 4, 6] },
    { patient: PATIENTS[3], dosage: 7, status: 'approved', herbs: [10, 11, 12, 13, 14] },
    { patient: PATIENTS[4], dosage: 5, status: 'approved', herbs: [5, 6, 7, 8, 9] },
    { patient: PATIENTS[5], dosage: 3, status: 'rejected', herbs: [15, 16, 17] },
    { patient: PATIENTS[6], dosage: 7, status: 'pending_review', herbs: [0, 3, 6, 9, 12, 15] },
    { patient: PATIENTS[7], dosage: 5, status: 'pending_review', herbs: [1, 4, 7, 10] },
    { patient: PATIENTS[8], dosage: 3, status: 'approved', herbs: [2, 5, 8, 11, 14] },
    { patient: PATIENTS[9], dosage: 7, status: 'approved', herbs: [0, 1, 2, 3, 4] },
    { patient: PATIENTS[10], dosage: 5, status: 'pending_review', herbs: [6, 7, 8, 9, 10, 11] },
    { patient: PATIENTS[11], dosage: 3, status: 'approved', herbs: [12, 13, 14, 15] },
  ]

  for (let i = 0; i < prescriptionConfigs.length; i++) {
    const cfg = prescriptionConfigs[i]
    const code = generateCode('RX', i + 1)
    const herbs = cfg.herbs.map(idx => HERBS_POOL[idx])
    const reviewer = cfg.status === 'pending_review' ? null : pharmacists[i % pharmacists.length]
    const reviewedAt = cfg.status === 'pending_review' ? null : (cfg.status === 'rejected' ? oneHourAgo : twoHoursAgo)
    const createdAt = cfg.status === 'pending_review' ? oneHourAgo : threeHoursAgo

    const result = insertPrescription.run(
      code,
      cfg.patient,
      JSON.stringify(herbs),
      cfg.dosage,
      cfg.status === 'rejected' ? '配伍禁忌：半夏与乌头同用' : '',
      cfg.status,
      reviewer ? reviewer.id : null,
      reviewedAt,
      createdAt,
      reviewedAt || createdAt,
    )
    prescriptions.push({ id: result.lastInsertRowid, code, ...cfg, reviewer })

    if (cfg.status === 'approved') {
      insertLog.run(
        'prescription', result.lastInsertRowid, code,
        'pending_review', 'approved',
        reviewer.id, reviewer.name, 'pharmacist',
        '审方通过',
        reviewedAt,
      )
    } else if (cfg.status === 'rejected') {
      insertLog.run(
        'prescription', result.lastInsertRowid, code,
        'pending_review', 'rejected',
        reviewer.id, reviewer.name, 'pharmacist',
        '配伍禁忌：半夏与乌头同用',
        reviewedAt,
      )
    }
  }

  const approvedPrescriptions = prescriptions.filter(p => p.status === 'approved')

  const batches = []
  const batchStatuses = ['completed', 'completed', 'completed', 'processing', 'pending', 'pending']

  for (let i = 0; i < Math.min(batchStatuses.length, approvedPrescriptions.length); i++) {
    const rx = approvedPrescriptions[i]
    const status = batchStatuses[i]
    const worker = workers[i % workers.length]
    const batchCode = generateCode('BATCH', i + 1)
    const createdAt = status === 'completed' ? yesterday : (status === 'processing' ? oneHourAgo : now)
    const startedAt = status !== 'pending' ? new Date(Date.now() - (status === 'completed' ? 86400000 : 3600000)).toISOString().replace('T', ' ').replace('Z', '').split('.')[0] : null
    const completedAt = status === 'completed' ? new Date(Date.now() - 7200000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0] : null

    const result = insertBatch.run(
      batchCode,
      rx.id,
      status !== 'pending' ? worker.id : null,
      status,
      i % 2 === 0 ? '常规煎煮' : '先煎后下',
      i % 2 === 0 ? '1:10' : '1:8',
      i % 2 === 0 ? 60 : 90,
      startedAt,
      completedAt,
      status === 'completed' ? '煎药完成，药液色泽正常' : '',
      createdAt,
      completedAt || startedAt || createdAt,
    )
    batches.push({ id: result.lastInsertRowid, code: batchCode, rx, status, worker })

    if (status !== 'pending') {
      insertLog.run(
        'batch', result.lastInsertRowid, batchCode,
        'pending', 'processing',
        worker.id, worker.name, 'worker',
        '开始煎药',
        startedAt,
      )
    }
    if (status === 'completed') {
      insertLog.run(
        'batch', result.lastInsertRowid, batchCode,
        'processing', 'completed',
        worker.id, worker.name, 'worker',
        '煎药完成，药液色泽正常',
        completedAt,
      )
    }

    if (status === 'completed' || status === 'processing') {
      const labelStatuses = status === 'completed'
        ? (i < 2 ? ['delivered', 'delivered'] : i === 2 ? ['shipping', 'shipping'] : ['ready_ship', 'ready_ship'])
        : ['labeled', 'labeled']

      for (let j = 0; j < labelStatuses.length; j++) {
        const labelCode = `${batchCode}-L${j + 1}`
        const ls = labelStatuses[j]
        const packageCount = rx.dosage
        const labeledAt = ls !== 'pending' ? new Date(Date.now() - 5400000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0] : null
        const shippedAt = ['shipping', 'delivered'].includes(ls) ? new Date(Date.now() - 3600000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0] : null
        const deliveredAt = ls === 'delivered' ? new Date(Date.now() - 1800000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0] : null
        const trackingNo = ['shipping', 'delivered'].includes(ls) ? `SF${String(1000000000 + i * 10 + j)}` : ''
        const courier = ['shipping', 'delivered'].includes(ls) ? '顺丰速运' : ''

        const labelResult = insertLabel.run(
          labelCode,
          result.lastInsertRowid,
          rx.id,
          ls,
          packageCount,
          labeledAt,
          shippedAt,
          deliveredAt,
          trackingNo,
          courier,
          '',
          labeledAt || new Date(Date.now() - 5400000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0],
          deliveredAt || shippedAt || labeledAt || new Date(Date.now() - 5400000).toISOString().replace('T', ' ').replace('Z', '').split('.')[0],
        )

        const labelStatusFlow = []
        if (ls !== 'pending') labelStatusFlow.push({ from: 'pending', to: 'labeled', at: labeledAt, note: '贴标完成' })
        if (['ready_ship', 'shipping', 'delivered'].includes(ls)) labelStatusFlow.push({ from: 'labeled', to: 'ready_ship', at: labeledAt, note: '备货完成待配送' })
        if (['shipping', 'delivered'].includes(ls)) labelStatusFlow.push({ from: 'ready_ship', to: 'shipping', at: shippedAt, note: `已发货，快递单号：${trackingNo}` })
        if (ls === 'delivered') labelStatusFlow.push({ from: 'shipping', to: 'delivered', at: deliveredAt, note: '患者已签收' })

        for (const flow of labelStatusFlow) {
          insertLog.run(
            'label', labelResult.lastInsertRowid, labelCode,
            flow.from, flow.to,
            workers[0].id, workers[0].name, 'worker',
            flow.note,
            flow.at,
          )
        }
      }
    }
  }

  console.log('种子数据已写入：')
  console.log(`  用户: ${users.length} 人 (审方药师 ${pharmacistData.length}, 煎药员 ${workerData.length}, 配送客服 ${deliveryData.length})`)
  console.log(`  处方: ${prescriptions.length} 条`)
  console.log(`  煎药批次: ${batches.length} 条`)
  console.log(`  包装贴标: ${db.prepare('SELECT COUNT(*) as c FROM packaging_labels').get().c} 条`)
  console.log(`  状态日志: ${db.prepare('SELECT COUNT(*) as c FROM status_logs').get().c} 条`)

  closeDb()
}

if (process.argv[1] === __filename) {
  seed()
}
