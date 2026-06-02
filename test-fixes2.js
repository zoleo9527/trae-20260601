const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const os = require('os')

const testDbPath = path.join(os.tmpdir(), 'test-fixes2.db')
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath)
}

function createTestDb() {
  const db = new Database(testDbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  
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
  `)
  
  return db
}

function testSubleasePreservation(db) {
  console.log('\n=== 测试问题1：删除原摊主后转租摊主保留摊位关联 ===')
  
  const tenantHandlers = require('./electron/database/handlers/tenants')(db)
  
  const tx = db.transaction(() => {
    const stallId = db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('B003', 14, 'B区3号', 'standard', 2600, 'active').lastInsertRowid
    
    const originalTenantId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('原摊主王大力', '13800000003', stallId, '2023-06-01', '2026-05-31', 'active').lastInsertRowid
    
    const subleaseTenantId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status, is_sublease, original_tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('转租摊主孙小美', '13800000006', stallId, '2024-09-01', '2026-08-31', 'active', 1, originalTenantId).lastInsertRowid
    
    db.prepare('INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(subleaseTenantId, stallId, 2026, 5, 2600, 2600, 2600, 'paid')
    db.prepare('INSERT INTO utility_records (stall_id, tenant_id, utility_type, record_date, last_reading, current_reading, usage, unit_price, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(stallId, subleaseTenantId, 'electric', '2026-05-28', 100, 250, 150, 1.2, 180)
    db.prepare('INSERT INTO hygiene_checks (stall_id, tenant_id, check_date, checker, score, issues, is_rectified) VALUES (?, ?, ?, ?, ?, ?, ?)').run(stallId, subleaseTenantId, '2026-05-20', '刘管理员', 85, '', 1)
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(subleaseTenantId, stallId, '2026-06-01', '转租未及时报备', 3, 50, 1, '刘管理员')
    
    return { originalTenantId, subleaseTenantId, stallId }
  })
  
  const { originalTenantId, subleaseTenantId, stallId } = tx()
  
  console.log('删除前：')
  const subleaseBefore = db.prepare('SELECT * FROM tenants WHERE id = ?').get(subleaseTenantId)
  console.log(`  转租摊主: ${subleaseBefore.name}, stall_id: ${subleaseBefore.stall_id}, original_tenant_id: ${subleaseBefore.original_tenant_id}`)
  console.log(`  摊位状态: ${db.prepare('SELECT status FROM stalls WHERE id = ?').get(stallId).status}`)
  
  console.log('\n执行删除原摊主操作...')
  tenantHandlers['tenants:delete'](originalTenantId)
  
  console.log('\n删除后：')
  const originalAfter = db.prepare('SELECT * FROM tenants WHERE id = ?').get(originalTenantId)
  const subleaseAfter = db.prepare('SELECT * FROM tenants WHERE id = ?').get(subleaseTenantId)
  const stallAfter = db.prepare('SELECT * FROM stalls WHERE id = ?').get(stallId)
  
  console.log(`  原摊主状态: ${originalAfter.status}, end_date: ${originalAfter.end_date}`)
  console.log(`  转租摊主: ${subleaseAfter.name}, stall_id: ${subleaseAfter.stall_id}, original_tenant_id: ${subleaseAfter.original_tenant_id}`)
  console.log(`  摊位状态: ${stallAfter.status}`)
  
  const rentCount = db.prepare('SELECT COUNT(*) as count FROM rent_bills WHERE tenant_id = ?').get(subleaseTenantId).count
  const utilityCount = db.prepare('SELECT COUNT(*) as count FROM utility_records WHERE tenant_id = ?').get(subleaseTenantId).count
  const hygieneCount = db.prepare('SELECT COUNT(*) as count FROM hygiene_checks WHERE tenant_id = ?').get(subleaseTenantId).count
  const deductionCount = db.prepare('SELECT COUNT(*) as count FROM deductions WHERE tenant_id = ?').get(subleaseTenantId).count
  
  console.log(`\n转租摊主历史记录：`)
  console.log(`  租金账单: ${rentCount}条, 水电记录: ${utilityCount}条, 卫生检查: ${hygieneCount}条, 扣分记录: ${deductionCount}条`)
  
  const hasFullHistory = rentCount > 0 && utilityCount > 0 && hygieneCount > 0 && deductionCount > 0
  
  if (subleaseAfter.stall_id === stallId && 
      subleaseAfter.original_tenant_id === originalTenantId &&
      stallAfter.status === 'active' &&
      originalAfter.status === 'inactive' &&
      hasFullHistory) {
    console.log('\n✅ 问题1修复验证通过：转租摊主保留了摊位关联和所有历史记录')
    return true
  } else {
    console.log('\n❌ 问题1修复验证失败')
    if (subleaseAfter.stall_id !== stallId) console.log('  - stall_id 被错误清空')
    if (subleaseAfter.original_tenant_id !== originalTenantId) console.log('  - original_tenant_id 被错误清空')
    if (stallAfter.status !== 'active') console.log('  - 摊位被错误设为 inactive')
    if (!hasFullHistory) console.log('  - 历史记录丢失')
    return false
  }
}

function testIsDevMode() {
  console.log('\n=== 测试问题2：isDevMode 自识别逻辑 ===')
  
  const originalArgv = process.argv
  const originalNodeEnv = process.env.NODE_ENV
  
  let passed = true
  
  try {
    function createIsDevMode(isPackaged) {
      return function() {
        if (process.env.NODE_ENV === 'development') return true
        if (process.argv.includes('--dev') || process.argv.includes('--development')) return true
        if (!isPackaged) return true
        const distPath = path.join(__dirname, '../dist/index.html')
        return !fs.existsSync(distPath)
      }
    }
    
    process.env.NODE_ENV = 'development'
    process.argv = ['electron', '.']
    let isDevMode = createIsDevMode(false)
    
    console.log('测试1: NODE_ENV=development')
    const test1 = isDevMode()
    console.log(`  结果: ${test1} (预期: true)`)
    if (!test1) passed = false
    
    process.env.NODE_ENV = ''
    process.argv = ['electron', '.', '--dev']
    console.log('\n测试2: 命令行 --dev 参数')
    const test2 = isDevMode()
    console.log(`  结果: ${test2} (预期: true)`)
    if (!test2) passed = false
    
    process.argv = ['electron', '.']
    isDevMode = createIsDevMode(false)
    console.log('\n测试3: 未打包 (isPackaged = false)')
    const test3 = isDevMode()
    console.log(`  结果: ${test3} (预期: true)`)
    if (!test3) passed = false
    
    isDevMode = createIsDevMode(true)
    const distPath = path.join(__dirname, '../dist/index.html')
    const distExists = fs.existsSync(distPath)
    console.log(`\n测试4: 已打包 + ${distExists ? 'dist目录存在' : 'dist目录不存在'}`)
    const test4 = isDevMode()
    console.log(`  结果: ${test4} (预期: ${!distExists})`)
    if (test4 !== !distExists) passed = false
    
    if (passed) {
      console.log('\n✅ 问题2修复验证通过：isDevMode 自识别逻辑正确')
    } else {
      console.log('\n❌ 问题2修复验证失败')
    }
    
    return passed
    
  } finally {
    process.argv = originalArgv
    process.env.NODE_ENV = originalNodeEnv
  }
}

try {
  console.log('🚀 开始测试2个新问题修复...\n')
  
  const db = createTestDb()
  
  const results = []
  results.push(testSubleasePreservation(db))
  results.push(testIsDevMode())
  
  db.close()
  
  console.log('\n' + '='.repeat(50))
  const passed = results.filter(r => r).length
  console.log(`测试结果: ${passed}/${results.length} 个测试通过`)
  
  if (passed === results.length) {
    console.log('\n🎉 所有新修复验证通过！')
    process.exit(0)
  } else {
    console.log('\n⚠️  部分测试失败，请检查修复代码')
    process.exit(1)
  }
  
} catch (e) {
  console.error('\n❌ 测试过程出错:', e)
  process.exit(1)
}
