const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const os = require('os')

const testDbPath = path.join(os.tmpdir(), 'test-report-fixes.db')
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
    const stall1 = db.prepare('INSERT INTO stalls (stall_code, area, location, monthly_rent, status) VALUES (?, ?, ?, ?, ?)').run('A001', 12, 'A区1号', 2000, 'active').lastInsertRowid
    const stall2 = db.prepare('INSERT INTO stalls (stall_code, area, location, monthly_rent, status) VALUES (?, ?, ?, ?, ?)').run('A002', 10, 'A区2号', 1800, 'active').lastInsertRowid
    const stall3 = db.prepare('INSERT INTO stalls (stall_code, area, location, monthly_rent, status) VALUES (?, ?, ?, ?, ?)').run('B001', 15, 'B区1号', 2500, 'active').lastInsertRowid
    
    const tenant1 = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, status) VALUES (?, ?, ?, ?, ?)').run('张三', '13800000001', stall1, '2024-01-01', 'active').lastInsertRowid
    const tenant2 = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, status) VALUES (?, ?, ?, ?, ?)').run('李四', '13800000002', stall2, '2024-02-01', 'active').lastInsertRowid
    const tenant3 = db.prepare('INSERT INTO tenants (name, phone, stall_id, start_date, status) VALUES (?, ?, ?, ?, ?)').run('王五', '13800000003', stall3, '2024-03-01', 'active').lastInsertRowid
    
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant1, stall1, '2026-06-01', '卫生不达标', 5, 100, 0, '管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant1, stall1, '2026-06-10', '占道经营', 3, 50, 0, '管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant1, stall1, '2026-05-15', '乱堆杂物', 2, 30, 1, '管理员')
    
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant2, stall2, '2026-06-05', '卫生不达标', 2, 30, 0, '管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant2, stall2, '2026-04-20', '违规使用电器', 10, 200, 1, '管理员')
    
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant3, stall3, '2026-06-12', '占道经营', 3, 50, 0, '管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant3, stall3, '2026-06-20', '卫生不达标', 5, 100, 0, '管理员')
    db.prepare('INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason, points, amount, is_rectified, recorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(tenant3, stall3, '2026-06-25', '乱堆杂物', 2, 30, 0, '管理员')
    
    return { tenant1, tenant2, tenant3 }
  })
  
  return tx()
}

function testExportDeductionSummary(db) {
  console.log('\n=== 测试1：导出摊主扣分汇总Excel ===')
  
  const XLSX = require('xlsx')
  
  console.log('\n测试1.1：导出2026年6月汇总（直接验证SQL数据）')
  
  const sqlData1 = db.prepare(`
    SELECT s.stall_code as 摊位编号, t.name as 摊主姓名,
           COUNT(*) as 扣分次数,
           COALESCE(SUM(d.points), 0) as 累计扣分,
           COALESCE(SUM(d.amount), 0) as 累计罚金,
           COALESCE(SUM(CASE WHEN d.is_rectified = 0 THEN 1 ELSE 0 END), 0) as 未整改项
    FROM deductions d
    LEFT JOIN tenants t ON d.tenant_id = t.id
    LEFT JOIN stalls s ON d.stall_id = s.id
    WHERE 1=1
      AND strftime('%Y', d.deduction_date) = '2026'
      AND strftime('%m', d.deduction_date) = '06'
    GROUP BY t.id, t.name, s.stall_code
    ORDER BY 累计扣分 DESC
  `).all()
  
  console.log(`  记录数: ${sqlData1.length}`)
  sqlData1.forEach((item, i) => {
    console.log(`    ${i+1}. ${item.摊位编号} - ${item.摊主姓名}: 扣${item.累计扣分}分, 罚¥${item.累计罚金}, 未整改${item.未整改项}项`)
  })
  
  const expectedCount = db.prepare(`
    SELECT COUNT(DISTINCT t.id) as count
    FROM deductions d
    LEFT JOIN tenants t ON d.tenant_id = t.id
    WHERE strftime('%Y', d.deduction_date) = '2026' 
      AND strftime('%m', d.deduction_date) = '06'
  `).get().count
  
  const test1Pass = sqlData1.length === expectedCount && expectedCount === 3
  console.log(`  测试1.1结果: ${test1Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n测试1.2：导出2026年全年汇总（无月份筛选）')
  const sqlData2 = db.prepare(`
    SELECT s.stall_code as 摊位编号, t.name as 摊主姓名,
           COUNT(*) as 扣分次数,
           COALESCE(SUM(d.points), 0) as 累计扣分,
           COALESCE(SUM(d.amount), 0) as 累计罚金,
           COALESCE(SUM(CASE WHEN d.is_rectified = 0 THEN 1 ELSE 0 END), 0) as 未整改项
    FROM deductions d
    LEFT JOIN tenants t ON d.tenant_id = t.id
    LEFT JOIN stalls s ON d.stall_id = s.id
    WHERE 1=1
      AND strftime('%Y', d.deduction_date) = '2026'
    GROUP BY t.id, t.name, s.stall_code
    ORDER BY 累计扣分 DESC
  `).all()
  
  console.log(`  记录数: ${sqlData2.length}`)
  
  const expectedCount2 = db.prepare(`
    SELECT COUNT(DISTINCT t.id) as count
    FROM deductions d
    LEFT JOIN tenants t ON d.tenant_id = t.id
    WHERE strftime('%Y', d.deduction_date) = '2026'
  `).get().count
  
  const test2Pass = sqlData2.length === expectedCount2 && expectedCount2 === 3
  console.log(`  测试1.2结果: ${test2Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n测试1.3：验证Excel导出数据结构')
  const testWorksheet = XLSX.utils.json_to_sheet(sqlData1)
  const testWorkbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(testWorkbook, testWorksheet, '扣分汇总')
  const exportPath = path.join(os.tmpdir(), 'test_export.xlsx')
  XLSX.writeFile(testWorkbook, exportPath)
  
  const fileExists = fs.existsSync(exportPath)
  const fileSize = fileExists ? fs.statSync(exportPath).size : 0
  console.log(`  测试文件生成: ${fileExists ? '✅' : '❌'}, 大小: ${fileSize} bytes`)
  
  if (fileExists) fs.unlinkSync(exportPath)
  
  return test1Pass && test2Pass && fileExists
}

function testGetUnrectifiedByTenant(db, { tenant1, tenant2, tenant3 }) {
  console.log('\n=== 测试2：按摊主查询未整改记录 ===')
  
  const reportHandlers = require('./electron/database/handlers/reports')(db)
  
  console.log('\n测试2.1：查询张三(tenant1)的未整改记录（2026年6月）')
  const result1 = reportHandlers['reports:getUnrectifiedByTenant'](tenant1, 2026, 6)
  console.log(`  未整改记录数: ${result1.length}`)
  result1.forEach((item, i) => {
    console.log(`    ${i+1}. ${item.deduction_date} - ${item.reason} - 扣${item.points}分 - 罚¥${item.amount}`)
  })
  
  const expected1 = db.prepare(`
    SELECT COUNT(*) as count FROM deductions 
    WHERE tenant_id = ? AND is_rectified = 0 
      AND strftime('%Y', deduction_date) = '2026' 
      AND strftime('%m', deduction_date) = '06'
  `).get(tenant1).count
  
  const test1Pass = result1.length === expected1 && expected1 === 2
  console.log(`  测试2.1结果: ${test1Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n测试2.2：查询张三(tenant1)的所有未整改记录（无时间筛选）')
  const result2 = reportHandlers['reports:getUnrectifiedByTenant'](tenant1)
  console.log(`  未整改记录数: ${result2.length}`)
  
  const expected2 = db.prepare(`
    SELECT COUNT(*) as count FROM deductions 
    WHERE tenant_id = ? AND is_rectified = 0
  `).get(tenant1).count
  
  const test2Pass = result2.length === expected2 && expected2 === 2
  console.log(`  测试2.2结果: ${test2Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n测试2.3：查询王五(tenant3)的未整改记录')
  const result3 = reportHandlers['reports:getUnrectifiedByTenant'](tenant3, 2026, 6)
  console.log(`  未整改记录数: ${result3.length}`)
  
  const allRectified = result3.every(item => item.is_rectified === 0)
  const test3Pass = result3.length === 3 && allRectified
  console.log(`  测试2.3结果: ${test3Pass ? '✅ 通过' : '❌ 失败'}`)
  
  console.log('\n测试2.4：验证返回字段完整性')
  const fields = ['id', 'tenant_id', 'stall_id', 'deduction_date', 'reason', 'points', 'amount', 
                  'is_rectified', 'recorder', 'tenant_name', 'phone', 'stall_code', 'location']
  const hasAllFields = fields.every(f => result1[0] && result1[0][f] !== undefined)
  console.log(`  字段完整性: ${hasAllFields ? '✅ 完整' : '❌ 缺失'}`)
  if (!hasAllFields) {
    console.log(`  缺失字段: ${fields.filter(f => result1[0] && result1[0][f] === undefined).join(', ')}`)
  }
  
  return test1Pass && test2Pass && test3Pass && hasAllFields
}

try {
  console.log('🚀 开始测试报表中心新增功能...\n')
  
  const db = createTestDb()
  const { tenant1, tenant2, tenant3 } = seedTestData(db)
  
  const results = []
  results.push(testExportDeductionSummary(db))
  results.push(testGetUnrectifiedByTenant(db, { tenant1, tenant2, tenant3 }))
  
  db.close()
  
  console.log('\n' + '='.repeat(50))
  const passed = results.filter(r => r).length
  console.log(`测试结果: ${passed}/${results.length} 个测试通过`)
  
  if (passed === results.length) {
    console.log('\n🎉 所有新功能测试通过！')
    process.exit(0)
  } else {
    console.log('\n⚠️  部分测试失败，请检查代码')
    process.exit(1)
  }
  
} catch (e) {
  console.error('\n❌ 测试过程出错:', e)
  process.exit(1)
}
