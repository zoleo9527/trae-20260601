import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_DIR = path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DB_DIR, 'factory.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    mkdirSync(DB_DIR, { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      material_status TEXT NOT NULL DEFAULT 'complete',
      current_stage TEXT NOT NULL DEFAULT 'reception',
      current_handler TEXT NOT NULL DEFAULT 'receptionist',
      priority TEXT NOT NULL DEFAULT 'normal',
      delivery_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      time_in_stage INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS handoff_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      from_role TEXT NOT NULL,
      to_role TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS anomalies (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS material_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      name TEXT NOT NULL,
      specification TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'available'
    );

    CREATE INDEX IF NOT EXISTS idx_orders_stage ON orders(current_stage);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_handler ON orders(current_handler);
    CREATE INDEX IF NOT EXISTS idx_handoff_order ON handoff_records(order_id);
    CREATE INDEX IF NOT EXISTS idx_anomaly_order ON anomalies(order_id);
    CREATE INDEX IF NOT EXISTS idx_anomaly_type ON anomalies(type);
    CREATE INDEX IF NOT EXISTS idx_material_order ON material_items(order_id);
  `)

  const count = database.prepare('SELECT COUNT(*) as cnt FROM orders').get() as { cnt: number }
  if (count.cnt === 0) {
    seedData(database)
  }
}

function seedData(db: Database.Database): void {
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_no, customer_name, patient_name, product_type, material_status, current_stage, current_handler, priority, delivery_date, status, time_in_stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertHandoff = db.prepare(`
    INSERT INTO handoff_records (id, order_id, from_role, to_role, action, reason, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAnomaly = db.prepare(`
    INSERT INTO anomalies (id, order_id, type, description, detected_at, resolved_at, resolved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMaterial = db.prepare(`
    INSERT INTO material_items (id, order_id, name, specification, quantity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const seed = db.transaction(() => {
    // ===== Order 1: DN-2024-0087 - 张氏口腔, 全瓷冠, stage=reception, status=blocked =====
    const o1Id = randomUUID()
    insertOrder.run(o1Id, 'DN-2024-0087', '张氏口腔', '张伟', '全瓷冠', 'incomplete', 'reception', 'receptionist', 'urgent', '2024-11-18', 'blocked', 72, '2024-11-15 09:30:00', '2024-11-15 14:20:00')

    insertAnomaly.run(
      randomUUID(), o1Id, 'missing_material',
      '氧化锆瓷块缺货，预计3天后到货，工单卡在客服阶段',
      '2024-11-15 10:15:00', null, null
    )

    insertMaterial.run(randomUUID(), o1Id, '氧化锆瓷块', 'A2色 98mm圆盘', 2, 'missing')
    insertMaterial.run(randomUUID(), o1Id, '透明瓷粉', 'ENAMEL PLUS 20g', 1, 'available')
    insertMaterial.run(randomUUID(), o1Id, '釉膏', 'GLAZE PASTE 3g', 1, 'available')
    insertMaterial.run(randomUUID(), o1Id, '染色剂', 'STAIN KIT A2', 1, 'available')

    // ===== Order 2: DN-2024-0092 - 李记齿科, 种植修复, stage=design, status=in_progress =====
    const o2Id = randomUUID()
    insertOrder.run(o2Id, 'DN-2024-0092', '李记齿科', '李明', '种植修复', 'complete', 'design', 'designer', 'normal', '2024-11-19', 'in_progress', 52, '2024-11-14 11:00:00', '2024-11-16 09:00:00')

    insertAnomaly.run(
      randomUUID(), o2Id, 'timeout',
      '设计阶段停留超过48小时，客户临时要求修改色号从A2改为A3，重新沟通确认占用额外时间',
      '2024-11-16 11:00:00', null, null
    )

    insertMaterial.run(randomUUID(), o2Id, '钛合金基台', 'Regular 直径 4.5mm', 1, 'available')
    insertMaterial.run(randomUUID(), o2Id, '氧化锆瓷块', 'A3色 98mm圆盘', 1, 'available')
    insertMaterial.run(randomUUID(), o2Id, '种植体代型', 'Nobel Replace 5.0mm', 1, 'available')
    insertMaterial.run(randomUUID(), o2Id, '牙龈瓷粉', 'GINGIVA 20g', 1, 'available')

    insertHandoff.run(
      randomUUID(), o2Id, 'receptionist', 'designer', 'submit',
      '种植修复工单，口扫数据完整，患者要求延期修复，请注意颈缘密合度',
      JSON.stringify({
        reception: {
          scanFileType: '口扫STL',
          modelType: 'digital',
          scanFileCount: 2,
          notes: '患者左上6缺失，近中倾斜，需注意就位道设计'
        }
      }),
      '2024-11-14 14:30:00'
    )

    // ===== Order 3: DN-2024-0095 - 仁爱口腔, 贴面, stage=qc, status=in_progress =====
    const o3Id = randomUUID()
    insertOrder.run(o3Id, 'DN-2024-0095', '仁爱口腔', '王芳', '贴面', 'complete', 'qc', 'inspector', 'urgent', '2024-11-17', 'in_progress', 4, '2024-11-13 16:00:00', '2024-11-16 11:00:00')

    insertAnomaly.run(
      randomUUID(), o3Id, 'qc_failed',
      '质检发现咬合偏差0.3mm，需打回设计师修改，已二次提交待复核',
      '2024-11-15 14:30:00', null, null
    )

    insertMaterial.run(randomUUID(), o3Id, '铸瓷贴面材料', 'e.max A1 HT 0.4mm', 6, 'available')
    insertMaterial.run(randomUUID(), o3Id, '粘接剂', 'RelyX Veneer A1', 1, 'available')
    insertMaterial.run(randomUUID(), o3Id, '试色糊剂', 'Try-In Paste A1', 1, 'available')
    insertMaterial.run(randomUUID(), o3Id, '氢氟酸', 'IPS Ceramic Etch 5%', 1, 'available')

    // Handoff: reception → design
    insertHandoff.run(
      randomUUID(), o3Id, 'receptionist', 'designer', 'submit',
      '前牙美学贴面6颗，患者对颜色要求高，请严格匹配比色板A1',
      JSON.stringify({
        reception: {
          scanFileType: '口扫STL+照片',
          modelType: 'digital',
          scanFileCount: 3,
          notes: '上前牙6颗贴面，患者要求自然白，比色A1'
        }
      }),
      '2024-11-13 17:20:00'
    )

    // Handoff: design → qc
    const d2qcId = randomUUID()
    insertHandoff.run(
      d2qcId, o3Id, 'designer', 'inspector', 'submit',
      '贴面设计完成，颈缘0.3mm就位，形态按比色板A1设计',
      JSON.stringify({
        design: {
          softwareVersion: 'exocad 3.2',
          modifications: ['颈部形态微调', '切端纹理修正'],
          colorChangeReason: null,
          specialProcess: '超薄贴面0.4mm，注意烧结收缩补偿'
        }
      }),
      '2024-11-14 16:00:00'
    )

    // Handoff: qc reject back to design
    insertHandoff.run(
      randomUUID(), o3Id, 'inspector', 'designer', 'reject',
      '咬合偏差0.3mm，左侧侧方咬合干扰，需调整舌侧形态',
      JSON.stringify({
        qc: {
          checkItems: [
            { name: '边缘密合度', standard: '≤0.05mm', actual: '0.03mm', passed: true },
            { name: '咬合接触', standard: '轻接触无干扰', actual: '左侧侧方干扰0.3mm', passed: false },
            { name: '形态对称性', standard: '对称度≥95%', actual: '97%', passed: true },
            { name: '颜色匹配', standard: '比色板A1', actual: 'A1', passed: true }
          ],
          result: 'fail',
          failReason: '咬合偏差0.3mm，左侧侧方咬合干扰',
          reworkTarget: 'designer'
        }
      }),
      '2024-11-15 14:30:00'
    )

    // Handoff: design resubmit to qc
    insertHandoff.run(
      randomUUID(), o3Id, 'designer', 'inspector', 'submit',
      '已调整舌侧形态，消除侧方干扰，重新提交质检',
      JSON.stringify({
        design: {
          softwareVersion: 'exocad 3.2',
          modifications: ['舌侧形态调整消除侧方干扰', '重新校验咬合接触点'],
          colorChangeReason: null,
          specialProcess: null
        }
      }),
      '2024-11-16 09:30:00'
    )

    // ===== Order 4: DN-2024-0089 - 康美口腔, 嵌体, stage=production, status=completed =====
    const o4Id = randomUUID()
    insertOrder.run(o4Id, 'DN-2024-0089', '康美口腔', '赵强', '嵌体', 'complete', 'production', 'inspector', 'normal', '2024-11-16', 'completed', 0, '2024-11-12 10:00:00', '2024-11-15 16:00:00')

    insertMaterial.run(randomUUID(), o4Id, '二硅酸锂瓷块', 'e.max MO A2 12mm', 1, 'available')
    insertMaterial.run(randomUUID(), o4Id, '粘接套装', 'Nexus 3 Kit', 1, 'available')
    insertMaterial.run(randomUUID(), o4Id, '酸蚀剂', 'IPS Ceramic Etch 5%', 1, 'available')

    // Full handoff chain
    insertHandoff.run(
      randomUUID(), o4Id, 'receptionist', 'designer', 'submit',
      '嵌体工单，右下6远中MOD嵌体，口扫数据完整',
      JSON.stringify({
        reception: {
          scanFileType: '口扫STL',
          modelType: 'digital',
          scanFileCount: 1,
          notes: '右下6 MOD嵌体，根管治疗完成，暂封完好'
        }
      }),
      '2024-11-12 11:30:00'
    )

    insertHandoff.run(
      randomUUID(), o4Id, 'designer', 'inspector', 'submit',
      '嵌体设计完成，边缘密合度良好，邻接关系已校验',
      JSON.stringify({
        design: {
          softwareVersion: 'exocad 3.2',
          modifications: ['邻接面微调', '边缘线优化'],
          colorChangeReason: null,
          specialProcess: 'MOD嵌体，注意邻接关系'
        }
      }),
      '2024-11-13 14:00:00'
    )

    insertHandoff.run(
      randomUUID(), o4Id, 'inspector', 'production', 'submit',
      '质检通过，嵌体精度达标，可安排排产',
      JSON.stringify({
        qc: {
          checkItems: [
            { name: '边缘密合度', standard: '≤0.05mm', actual: '0.02mm', passed: true },
            { name: '邻接关系', standard: '牙线轻阻力', actual: '适中', passed: true },
            { name: '咬合接触', standard: '轻接触', actual: '轻接触', passed: true }
          ],
          result: 'pass',
          failReason: null,
          reworkTarget: null
        }
      }),
      '2024-11-14 10:00:00'
    )

    insertHandoff.run(
      randomUUID(), o4Id, 'inspector', 'production', 'schedule',
      '排产完成，分配A线生产',
      JSON.stringify({
        production: {
          productionLine: 'A线',
          estimatedCompletion: '2024-11-15 18:00:00',
          splitFrom: null
        }
      }),
      '2024-11-14 14:00:00'
    )

    // ===== Order 5: DN-2024-0091 - 明德齿科, 活动义齿, stage=design, status=in_progress =====
    const o5Id = randomUUID()
    insertOrder.run(o5Id, 'DN-2024-0091', '明德齿科', '孙丽', '活动义齿', 'complete', 'design', 'designer', 'normal', '2024-11-20', 'in_progress', 6, '2024-11-15 08:00:00', '2024-11-16 10:00:00')

    insertMaterial.run(randomUUID(), o5Id, '树脂牙', '三层色A2 上前牙6颗', 1, 'available')
    insertMaterial.run(randomUUID(), o5Id, '钴铬合金', 'BEGO 500g', 1, 'available')
    insertMaterial.run(randomUUID(), o5Id, '基托树脂', 'Meliodent 粉液套装', 1, 'available')
    insertMaterial.run(randomUUID(), o5Id, '卡环丝', '0.8mm 钴铬', 2, 'available')

    insertHandoff.run(
      randomUUID(), o5Id, 'receptionist', 'designer', 'submit',
      '活动义齿工单，下颌双侧游离缺失，设计RPI卡环',
      JSON.stringify({
        reception: {
          scanFileType: '藻酸盐印模+超硬石膏模型',
          modelType: 'physical',
          scanFileCount: 1,
          notes: '下颌双侧游离缺失，设计RPI卡环，患者经济型方案'
        }
      }),
      '2024-11-15 10:30:00'
    )
  })

  seed()
}
