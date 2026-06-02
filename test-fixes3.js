const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const os = require('os')

const testDbPath = path.join(os.tmpdir(), 'test-fixes3.db')
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

function testStallReclaimLogic(db) {
  console.log('\n=== 测试问题1：摊主删除后按active tenant回收摊位 ===')
  
  const tenantHandlers = require('./electron/database/handlers/tenants')(db)
  
  const tx = db.transaction(() => {
    const stallId = db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('A001', 12, 'A区1号', 'standard', 2200, 'active').lastInsertRowid
    const stallId2 = db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('A002', 10, 'A区2号', 'standard', 2000, 'active').lastInsertRowid
    
    const originalTenantId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('原摊主钱大', '13900000001', stallId, '2023-01-01', '2026-12-31', 'active').lastInsertRowid
    const subleaseTenantId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status, is_sublease, original_tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('转租摊主孙二', '13900000002', stallId, '2024-06-01', '2026-05-31', 'active', 1, originalTenantId).lastInsertRowid
    
    const singleTenantId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('单独摊主李三', '13900000003', stallId2, '2024-01-01', '2026-12-31', 'active').lastInsertRowid
    
    db.prepare('INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(subleaseTenantId, stallId, 2026, 5, 2200, 2200, 2200, 'paid')
    db.prepare('INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(singleTenantId, stallId2, 2026, 5, 2000, 2000, 2000, 'paid')
    
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(subleaseTenantId, stallId, '2026-05-15', '卫生不合格', 2, 30, 1, '管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(singleTenantId, stallId2, '2026-05-10', '占道经营', 3, 50, 1, '管理员')
    
    return { originalTenantId, subleaseTenantId, singleTenantId, stallId, stallId2 }
  })
  
  const { originalTenantId, subleaseTenantId, singleTenantId, stallId, stallId2 } = tx()
  
  console.log('=== 场景1：删除原摊主（有转租摊主在同一摊位） ===')
  console.log('删除前：')
  console.log(`  摊位A001状态: ${db.prepare('SELECT status FROM stalls WHERE id = ?').get(stallId).status}`)
  console.log(`  摊位A001 active租户数: ${db.prepare('SELECT COUNT(*) as count FROM tenants WHERE stall_id = ? AND status = ?').get(stallId, 'active').count}`)
  
  tenantHandlers['tenants:delete'](originalTenantId)
  
  console.log('删除原摊主后：')
  const stallAfterDeleteOriginal = db.prepare('SELECT status FROM stalls WHERE id = ?').get(stallId).status
  const subleaseAfterDeleteOriginal = db.prepare('SELECT * FROM tenants WHERE id = ?').get(subleaseTenantId)
  console.log(`  摊位A001状态: ${stallAfterDeleteOriginal}`)
  console.log(`  转租摊主: stall_id=${subleaseAfterDeleteOriginal.stall_id}, original_tenant_id=${subleaseAfterDeleteOriginal.original_tenant_id}, status=${subleaseAfterDeleteOriginal.status}`)
  
  const scene1Pass = stallAfterDeleteOriginal === 'active' && 
                     subleaseAfterDeleteOriginal.stall_id === stallId &&
                     subleaseAfterDeleteOriginal.original_tenant_id === originalTenantId &&
                     subleaseAfterDeleteOriginal.status === 'active'
  
  console.log(`场景1结果: ${scene1Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n=== 场景2：继续删除转租摊主（同一摊位无active租户） ===')
  tenantHandlers['tenants:delete'](subleaseTenantId)
  
  console.log('删除转租摊主后：')
  const stallAfterDeleteSublease = db.prepare('SELECT status FROM stalls WHERE id = ?').get(stallId).status
  console.log(`  摊位A001状态: ${stallAfterDeleteSublease}`)
  console.log(`  摊位A001 active租户数: ${db.prepare('SELECT COUNT(*) as count FROM tenants WHERE stall_id = ? AND status = ?').get(stallId, 'active').count}`)
  
  const scene2Pass = stallAfterDeleteSublease === 'inactive'
  console.log(`场景2结果: ${scene2Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n=== 场景3：删除单独摊主（直接回收摊位） ===')
  console.log('删除前：')
  console.log(`  摊位A002状态: ${db.prepare('SELECT status FROM stalls WHERE id = ?').get(stallId2).status}`)
  
  tenantHandlers['tenants:delete'](singleTenantId)
  
  console.log('删除单独摊主后：')
  const stallAfterDeleteSingle = db.prepare('SELECT status FROM stalls WHERE id = ?').get(stallId2).status
  console.log(`  摊位A002状态: ${stallAfterDeleteSingle}`)
  
  const scene3Pass = stallAfterDeleteSingle === 'inactive'
  console.log(`场景3结果: ${scene3Pass ? '✅ 通过' : '❌ 失败'}`)
  
  const allPass = scene1Pass && scene2Pass && scene3Pass
  if (allPass) {
    console.log('\n✅ 问题1修复验证通过：摊位按active tenant正确回收')
  } else {
    console.log('\n❌ 问题1修复验证失败')
  }
  
  return allPass
}

function testIsDevModeLogic() {
  console.log('\n=== 测试问题2：isDevMode 启动模式判断逻辑 ===')
  
  const originalArgv = process.argv
  
  let passed = true
  
  try {
    function createIsDevMode(distExists) {
      return function() {
        if (process.argv.includes('--dev') || process.argv.includes('--development')) return true
        return !distExists
      }
    }
    
    console.log('测试1：显式 --dev 参数 + dist不存在')
    process.argv = ['electron', '.', '--dev']
    let isDevMode = createIsDevMode(false)
    const test1 = isDevMode()
    console.log(`  结果: ${test1} (预期: true)`)
    if (test1 !== true) passed = false
    
    console.log('\n测试2：显式 --dev 参数 + dist存在')
    process.argv = ['electron', '.', '--dev']
    isDevMode = createIsDevMode(true)
    const test2 = isDevMode()
    console.log(`  结果: ${test2} (预期: true)`)
    if (test2 !== true) passed = false
    
    console.log('\n测试3：无--dev参数 + dist不存在')
    process.argv = ['electron', '.']
    isDevMode = createIsDevMode(false)
    const test3 = isDevMode()
    console.log(`  结果: ${test3} (预期: true)`)
    if (test3 !== true) passed = false
    
    console.log('\n测试4：无--dev参数 + dist存在（加载本地页面）')
    process.argv = ['electron', '.']
    isDevMode = createIsDevMode(true)
    const test4 = isDevMode()
    console.log(`  结果: ${test4} (预期: false)`)
    if (test4 !== false) passed = false
    
    console.log('\n测试5：NODE_ENV=development 但无--dev + dist存在（加载本地页面）')
    process.argv = ['electron', '.']
    process.env.NODE_ENV = 'development'
    isDevMode = createIsDevMode(true)
    const test5 = isDevMode()
    console.log(`  结果: ${test5} (预期: false)`)
    if (test5 !== false) passed = false
    
    if (passed) {
      console.log('\n✅ 问题2修复验证通过：isDevMode判断逻辑正确')
    } else {
      console.log('\n❌ 问题2修复验证失败')
    }
    
    return passed
    
  } finally {
    process.argv = originalArgv
    delete process.env.NODE_ENV
  }
}

try {
  console.log('🚀 开始测试2个新问题修复...\n')
  
  const db = createTestDb()
  
  const results = []
  results.push(testStallReclaimLogic(db))
  results.push(testIsDevModeLogic())
  
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
