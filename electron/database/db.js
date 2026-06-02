const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const os = require('os')

function getDbPath() {
  const appDir = path.join(os.homedir(), 'market-stall-manager')
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true })
  }
  return path.join(appDir, 'data.db')
}

function initDatabase() {
  const dbPath = getDbPath()
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createTables(db)
  return db
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stalls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stall_code TEXT NOT NULL UNIQUE,
      area REAL NOT NULL DEFAULT 0,
      location TEXT,
      type TEXT DEFAULT 'standard',
      monthly_rent REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'active',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      id_card TEXT,
      address TEXT,
      business_type TEXT,
      stall_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      is_sublease INTEGER DEFAULT 0,
      original_tenant_id INTEGER,
      status TEXT DEFAULT 'active',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stall_id) REFERENCES stalls(id),
      FOREIGN KEY (original_tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS rent_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      stall_id INTEGER NOT NULL,
      bill_year INTEGER NOT NULL,
      bill_month INTEGER NOT NULL,
      base_rent REAL NOT NULL DEFAULT 0,
      extra_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      paid_date TEXT,
      status TEXT DEFAULT 'unpaid',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (stall_id) REFERENCES stalls(id)
    );

    CREATE TABLE IF NOT EXISTS utility_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stall_id INTEGER NOT NULL,
      tenant_id INTEGER,
      utility_type TEXT NOT NULL,
      record_date TEXT NOT NULL,
      last_reading REAL NOT NULL DEFAULT 0,
      current_reading REAL NOT NULL DEFAULT 0,
      usage REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      is_abnormal INTEGER DEFAULT 0,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stall_id) REFERENCES stalls(id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS hygiene_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stall_id INTEGER NOT NULL,
      tenant_id INTEGER,
      check_date TEXT NOT NULL,
      checker TEXT,
      score INTEGER NOT NULL DEFAULT 100,
      issues TEXT,
      is_rectified INTEGER DEFAULT 0,
      rectify_date TEXT,
      rectify_remark TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stall_id) REFERENCES stalls(id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      stall_id INTEGER NOT NULL,
      deduction_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      amount REAL DEFAULT 0,
      is_rectified INTEGER DEFAULT 0,
      rectify_date TEXT,
      rectify_remark TEXT,
      recorder TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (stall_id) REFERENCES stalls(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rent_bills_tenant ON rent_bills(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_rent_bills_stall ON rent_bills(stall_id);
    CREATE INDEX IF NOT EXISTS idx_rent_bills_date ON rent_bills(bill_year, bill_month);
    CREATE INDEX IF NOT EXISTS idx_utility_stall ON utility_records(stall_id);
    CREATE INDEX IF NOT EXISTS idx_utility_type ON utility_records(utility_type);
    CREATE INDEX IF NOT EXISTS idx_hygiene_stall ON hygiene_checks(stall_id);
    CREATE INDEX IF NOT EXISTS idx_deductions_tenant ON deductions(tenant_id);
  `)
}

function seedDemoData(db) {
  const stallCount = db.prepare('SELECT COUNT(*) as count FROM stalls').get().count
  if (stallCount > 0) return

  const tx = db.transaction(() => {
    const stallInsert = db.prepare(`
      INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const stalls = [
      ['A001', 15.5, 'A区1号', 'standard', 2800, 'active', '蔬菜摊位'],
      ['A002', 12.0, 'A区2号', 'standard', 2500, 'active', '水果摊位'],
      ['A003', 18.0, 'A区3号', 'premium', 3500, 'active', '肉类摊位'],
      ['B001', 10.0, 'B区1号', 'standard', 2000, 'active', '干货摊位'],
      ['B002', 20.0, 'B区2号', 'premium', 4000, 'active', '海鲜摊位'],
      ['B003', 14.0, 'B区3号', 'standard', 2600, 'active', '豆制品摊位'],
      ['C001', 8.0, 'C区1号', 'standard', 1800, 'active', '调料摊位'],
      ['C002', 25.0, 'C区2号', 'premium', 4500, 'inactive', '待出租'],
      ['D001', 30.0, 'D区1号', 'restaurant', 6000, 'active', '餐饮档口']
    ]

    const stallIds = []
    for (const s of stalls) {
      const result = stallInsert.run(...s)
      stallIds.push(result.lastInsertRowid)
    }

    const tenantInsert = db.prepare(`
      INSERT INTO tenants (name, phone, id_card, address, business_type, stall_id, start_date, end_date, is_sublease, original_tenant_id, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const tenants = [
      ['张建国', '13800138001', '110101197001011234', '北京市朝阳区', '蔬菜零售', stallIds[0], '2024-01-01', '2026-12-31', 0, null, 'active', '老摊主，经营多年'],
      ['李翠花', '13800138002', '110102197502022345', '北京市海淀区', '水果零售', stallIds[1], '2024-03-01', '2025-12-31', 0, null, 'active', ''],
      ['王大力', '13800138003', '110103198003033456', '北京市丰台区', '猪肉零售', stallIds[2], '2023-06-01', '2026-05-31', 0, null, 'active', '本月租金拖欠中'],
      ['赵四', '13800138004', '110104198504044567', '北京市东城区', '干货批发', stallIds[3], '2024-06-01', '2025-05-31', 0, null, 'active', ''],
      ['钱多多', '13800138005', '110105197805055678', '北京市西城区', '海鲜零售', stallIds[4], '2024-01-01', '2025-12-31', 0, null, 'active', '卫生情况较差'],
      ['孙小美', '13800138006', '110106199006066789', '北京市通州区', '豆制品零售', stallIds[5], '2024-09-01', '2026-08-31', 1, 3, 'active', '从王大力处转租'],
      ['周老八', '13800138007', '110107196907077890', '北京市昌平区', '调料批发', stallIds[6], '2024-02-01', '2026-01-31', 0, null, 'active', ''],
      ['吴胖子', '13800138008', '110108198808088901', '北京市大兴区', '中式快餐', stallIds[8], '2024-04-01', '2027-03-31', 0, null, 'active', '水电用量大']
    ]

    const tenantIds = []
    for (const t of tenants) {
      const result = tenantInsert.run(...t)
      tenantIds.push(result.lastInsertRowid)
    }

    const rentInsert = db.prepare(`
      INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, extra_fee, discount, total_amount, paid_amount, paid_date, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const rentData = []
    for (let i = 0; i < tenantIds.length; i++) {
      for (let m = 1; m <= currentMonth; m++) {
        const stall = stalls[i]
        const tenant = tenants[i]
        let status = 'paid'
        let paidAmount = stall[4]
        let paidDate = `${currentYear}-${String(m).padStart(2, '0')}-05`
        let remark = ''

        if (i === 2 && m >= currentMonth - 1) {
          status = 'unpaid'
          paidAmount = 0
          paidDate = null
          remark = '王大力拖欠租金'
        }

        if (i === 4 && m === currentMonth) {
          status = 'partial'
          paidAmount = stall[4] * 0.5
          remark = '钱多多部分缴纳'
        }

        rentData.push([
          tenantIds[i], stallIds[i], currentYear, m, stall[4], 0, 0, stall[4], paidAmount, paidDate, status, remark
        ])
      }
    }

    for (const r of rentData) {
      rentInsert.run(...r)
    }

    const utilityInsert = db.prepare(`
      INSERT INTO utility_records (stall_id, tenant_id, utility_type, record_date, last_reading, current_reading, usage, unit_price, amount, is_abnormal, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const utilityData = []
    const utilityTypes = ['water', 'electric']
    const unitPrices = { water: 5.5, electric: 1.2 }

    for (let i = 0; i < stallIds.length; i++) {
      for (const type of utilityTypes) {
        let lastReading = 100
        for (let m = 1; m <= currentMonth; m++) {
          let usage = type === 'water' ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 200) + 100
          let isAbnormal, remark
          
          if (i === 7 && type === 'electric' && m === currentMonth) {
            usage = 800
            isAbnormal = 1
            remark = '吴胖子餐饮档口本月用电异常增长'
          } else {
            isAbnormal = 0
            remark = ''
          }

          const currentReading = lastReading + usage
          const amount = usage * unitPrices[type]

          utilityData.push([
            stallIds[i], tenantIds[i] || null, type, `${currentYear}-${String(m).padStart(2, '0')}-28`,
            lastReading, currentReading, usage, unitPrices[type], amount, isAbnormal, remark
          ])

          lastReading = currentReading
        }
      }
    }

    for (const u of utilityData) {
      utilityInsert.run(...u)
    }

    const hygieneInsert = db.prepare(`
      INSERT INTO hygiene_checks (stall_id, tenant_id, check_date, checker, score, issues, is_rectified, rectify_date, rectify_remark, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const hygieneData = []
    const checkers = ['刘管理员', '陈主任']

    for (let m = 1; m <= currentMonth; m++) {
      for (let d = 1; d <= 15; d += 7) {
        for (let i = 0; i < stallIds.length; i++) {
          const checkDate = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          let score = Math.floor(Math.random() * 20) + 80
          let issues = ''
          let isRectified = 1
          let rectifyDate = `${currentYear}-${String(m).padStart(2, '0')}-${String(d + 2).padStart(2, '0')}`
          let rectifyRemark = '已整改'

          if (i === 4 && (d === 8 || d === 15)) {
            score = 55 + Math.floor(Math.random() * 10)
            issues = '摊位前垃圾堆积、地面积水、物料摆放混乱'
            isRectified = 0
            rectifyDate = null
            rectifyRemark = ''
            remark = '钱多多摊位卫生问题未整改'
          } else if (score < 85) {
            issues = ' minor issue'
          } else {
            issues = ''
          }

          hygieneData.push([
            stallIds[i], tenantIds[i] || null, checkDate, checkers[Math.floor(Math.random() * 2)],
            score, issues, isRectified, rectifyDate, rectifyRemark, score < 85 ? '需注意' : ''
          ])
        }
      }
    }

    for (const h of hygieneData) {
      hygieneInsert.run(...h)
    }

    const deductionInsert = db.prepare(`
      INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, rectify_date, rectify_remark, recorder, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const deductionData = [
      [tenantIds[4], stallIds[4], `${currentYear}-03-10`, '连续两次卫生检查不合格', 10, 200, 0, null, '', '刘管理员', '钱多多卫生扣分未整改'],
      [tenantIds[2], stallIds[2], `${currentYear}-04-05`, '摊位占道经营', 5, 100, 1, `${currentYear}-04-08`, '已清理占道物品', '陈主任', ''],
      [tenantIds[4], stallIds[4], `${currentYear}-05-12`, '垃圾未分类投放', 8, 150, 0, null, '', '刘管理员', '未整改'],
      [tenantIds[7], stallIds[8], `${currentYear}-05-20`, '油烟排放超标', 6, 300, 1, `${currentYear}-05-25`, '已安装净化器', '陈主任', ''],
      [tenantIds[5], stallIds[5], `${currentYear}-06-01`, '临时转租未及时报备', 3, 50, 1, `${currentYear}-06-02`, '已补办手续', '刘管理员', '孙小美转租问题']
    ]

    for (const d of deductionData) {
      deductionInsert.run(...d)
    }
  })

  tx()
  console.log('演示数据已初始化')
}

module.exports = { initDatabase, seedDemoData, getDbPath }
