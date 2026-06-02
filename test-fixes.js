const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const os = require('os')

const testDbPath = path.join(os.tmpdir(), 'test-fixes.db')
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

function seedTestData(db) {
  const tx = db.transaction(() => {
    const stallIds = []
    stallIds.push(db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('A001', 15, 'A区1号', 'standard', 2800, 'active').lastInsertRowid)
    stallIds.push(db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('A002', 12, 'A区2号', 'standard', 2500, 'active').lastInsertRowid)
    stallIds.push(db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('B001', 10, 'B区1号', 'standard', 2000, 'active').lastInsertRowid)

    const tenantIds = []
    tenantIds.push(db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('测试摊主1', '13800000001', stallIds[0], '2024-01-01', '2026-12-31', 'active').lastInsertRowid)
    tenantIds.push(db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('测试摊主2', '13800000002', stallIds[1], '2024-01-01', '2026-12-31', 'active').lastInsertRowid)
    tenantIds.push(db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status, is_sublease, original_tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('转租摊主', '13800000003', stallIds[2], '2024-06-01', '2025-05-31', 'active', 1, tenantIds[0]).lastInsertRowid)

    db.prepare('INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenantIds[0], stallIds[0], 2026, 5, 2800, 2800, 2800, 'paid')
    db.prepare('INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenantIds[1], stallIds[1], 2026, 5, 2500, 2500, 2500, 'paid')

    db.prepare('INSERT INTO hygiene_checks (stall_id, tenant_id, check_date, checker, score, issues, is_rectified) VALUES (?, ?, ?, ?, ?, ?, ?)').run(stallIds[0], tenantIds[0], '2026-05-15', '刘管理员', 70, '摊位前垃圾堆积', 0)
    db.prepare('INSERT INTO hygiene_checks (stall_id, tenant_id, check_date, checker, score, issues, is_rectified) VALUES (?, ?, ?, ?, ?, ?, ?)').run(stallIds[1], tenantIds[1], '2026-05-15', '刘管理员', 90, '', 1)

    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenantIds[0], stallIds[0], '2026-05-15', '卫生检查不合格，得分70分', 2, 40, 0, '刘管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenantIds[1], stallIds[1], '2026-05-10', '占道经营', 5, 100, 1, '陈主任')
  })
  tx()
  console.log('✅ 测试数据初始化完成')
}

function testFix2(db) {
  console.log('\n=== 测试问题2：卫生检查整改 ===')
  
  const unrectifiedBefore = db.prepare('SELECT COUNT(*) as count FROM hygiene_checks WHERE is_rectified = 0').get().count
  const unrectifiedDedBefore = db.prepare('SELECT COUNT(*) as count FROM deductions WHERE is_rectified = 0 AND reason LIKE \'%卫生检查%\'').get().count
  console.log(`整改前 - 未整改卫生检查: ${unrectifiedBefore}, 关联未整改扣分: ${unrectifiedDedBefore}`)
  
  const hygieneHandlers = require('./electron/database/handlers/hygiene')(db)
  const check = db.prepare('SELECT * FROM hygiene_checks WHERE is_rectified = 0').get()
  
  const result = hygieneHandlers['hygiene:markRectified'](check.id, '2026-06-02', '已清理垃圾')
  console.log(`整改操作结果: ${result}`)
  
  const unrectifiedAfter = db.prepare('SELECT COUNT(*) as count FROM hygiene_checks WHERE is_rectified = 0').get().count
  const unrectifiedDedAfter = db.prepare('SELECT COUNT(*) as count FROM deductions WHERE is_rectified = 0 AND reason LIKE \'%卫生检查%\'').get().count
  console.log(`整改后 - 未整改卫生检查: ${unrectifiedAfter}, 关联未整改扣分: ${unrectifiedDedAfter}`)
  
  if (unrectifiedBefore > unrectifiedAfter && unrectifiedDedBefore > unrectifiedDedAfter) {
    console.log('✅ 问题2修复验证通过：卫生检查整改同时更新了检查记录和关联扣分')
    return true
  } else {
    console.log('❌ 问题2修复验证失败')
    return false
  }
}

function testFix3(db) {
  console.log('\n=== 测试问题3：扣分统计卡 ===')
  
  const deductionHandlers = require('./electron/database/handlers/deductions')(db)
  
  const summary = deductionHandlers['deductions:getStats'](2026, null)
  console.log('统计结果:', JSON.stringify(summary, null, 2))
  
  if (summary && 
      typeof summary.total_count === 'number' && 
      typeof summary.total_points === 'number' && 
      typeof summary.total_amount === 'number' && 
      typeof summary.unrectified_count === 'number') {
    console.log(`✅ 问题3修复验证通过：getStats返回正确的统计对象
  - 总记录数: ${summary.total_count}
  - 总扣分: ${summary.total_points}
  - 总罚金: ¥${summary.total_amount}
  - 未整改: ${summary.unrectified_count}`)
    return true
  } else {
    console.log('❌ 问题3修复验证失败：getStats返回格式不正确')
    return false
  }
}

function testFix4(db) {
  console.log('\n=== 测试问题4：摊主删除 ===')
  
  const tenantHandlers = require('./electron/database/handlers/tenants')(db)
  
  const tx = db.transaction(() => {
    const newStallId = db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('C001', 8, 'C区1号', 'standard', 1800, 'active').lastInsertRowid
    const newStallId2 = db.prepare('INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status) VALUES (?, ?, ?, ?, ?, ?)').run('C002', 10, 'C区2号', 'standard', 2000, 'active').lastInsertRowid
    
    const tenantWithUnrectifiedId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('待删除摊主1', '13900000001', newStallId, '2024-01-01', '2026-12-31', 'active').lastInsertRowid
    const tenantCleanId = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)').run('待删除摊主2', '13900000002', newStallId2, '2024-01-01', '2026-12-31', 'active').lastInsertRowid
    
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenantWithUnrectifiedId, newStallId, '2026-06-01', '违规经营', 5, 100, 0, '测试员')
    
    db.prepare('INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month, base_rent, total_amount, paid_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenantCleanId, newStallId2, 2026, 5, 2000, 2000, 2000, 'paid')
    
    return { tenantWithUnrectifiedId, tenantCleanId }
  })
  
  const { tenantWithUnrectifiedId, tenantCleanId } = tx()
  
  console.log(`尝试删除有未整改扣分的摊主(待删除摊主1)...`)
  try {
    tenantHandlers['tenants:delete'](tenantWithUnrectifiedId)
    console.log('❌ 问题4修复验证失败：应该拒绝删除有未整改扣分的摊主')
    return false
  } catch (e) {
    console.log(`✅ 正确拒绝删除: ${e.message}`)
  }
  
  console.log(`尝试删除所有费用已结清的摊主(待删除摊主2)...`)
  try {
    const result = tenantHandlers['tenants:delete'](tenantCleanId)
    const updatedTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantCleanId)
    
    console.log(`删除结果: ${result}`)
    console.log(`摊主状态: ${updatedTenant.status}`)
    console.log(`摊主结束日期: ${updatedTenant.end_date}`)
    
    if (result && updatedTenant.status === 'inactive') {
      console.log('✅ 问题4修复验证通过：摊主软删除成功，保留历史记录，无外键错误')
      return true
    } else {
      console.log('❌ 问题4修复验证失败')
      return false
    }
  } catch (e) {
    console.log(`❌ 问题4修复验证失败: ${e.message}`)
    return false
  }
}

try {
  console.log('🚀 开始测试4个问题修复...\n')
  
  const db = createTestDb()
  seedTestData(db)
  
  const results = []
  results.push(testFix2(db))
  results.push(testFix3(db))
  results.push(testFix4(db))
  
  db.close()
  
  console.log('\n' + '='.repeat(50))
  const passed = results.filter(r => r).length
  console.log(`测试结果: ${passed}/${results.length} 个测试通过`)
  
  if (passed === results.length) {
    console.log('\n🎉 所有修复验证通过！')
    process.exit(0)
  } else {
    console.log('\n⚠️  部分测试失败，请检查修复代码')
    process.exit(1)
  }
  
} catch (e) {
  console.error('\n❌ 测试过程出错:', e)
  process.exit(1)
}
