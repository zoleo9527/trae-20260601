module.exports = function (db) {
  return {
    'hygiene:list': function (params = {}) {
      let sql = `
        SELECT hc.*, t.name as tenant_name, s.stall_code, s.location
        FROM hygiene_checks hc
        LEFT JOIN tenants t ON hc.tenant_id = t.id
        LEFT JOIN stalls s ON hc.stall_id = s.id
        WHERE 1=1
      `
      const sqlParams = []
      
      if (params.stall_id) {
        sql += ' AND hc.stall_id = ?'
        sqlParams.push(params.stall_id)
      }
      if (params.is_rectified !== undefined) {
        sql += ' AND hc.is_rectified = ?'
        sqlParams.push(params.is_rectified ? 1 : 0)
      }
      if (params.start_date) {
        sql += ' AND hc.check_date >= ?'
        sqlParams.push(params.start_date)
      }
      if (params.end_date) {
        sql += ' AND hc.check_date <= ?'
        sqlParams.push(params.end_date)
      }
      if (params.keyword) {
        sql += ' AND (t.name LIKE ? OR s.stall_code LIKE ? OR hc.issues LIKE ?)'
        const kw = `%${params.keyword}%`
        sqlParams.push(kw, kw, kw)
      }
      
      sql += ' ORDER BY hc.check_date DESC, hc.created_at DESC'
      
      if (params.page && params.pageSize) {
        const offset = (params.page - 1) * params.pageSize
        sql += ' LIMIT ? OFFSET ?'
        sqlParams.push(params.pageSize, offset)
      }
      
      const list = db.prepare(sql).all(...sqlParams)
      
      let countSql = `
        SELECT COUNT(*) as total FROM hygiene_checks hc
        LEFT JOIN tenants t ON hc.tenant_id = t.id
        LEFT JOIN stalls s ON hc.stall_id = s.id
        WHERE 1=1
      `
      const countParams = []
      if (params.stall_id) { countSql += ' AND hc.stall_id = ?'; countParams.push(params.stall_id) }
      if (params.is_rectified !== undefined) {
        countSql += ' AND hc.is_rectified = ?'
        countParams.push(params.is_rectified ? 1 : 0)
      }
      if (params.start_date) { countSql += ' AND hc.check_date >= ?'; countParams.push(params.start_date) }
      if (params.end_date) { countSql += ' AND hc.check_date <= ?'; countParams.push(params.end_date) }
      if (params.keyword) {
        countSql += ' AND (t.name LIKE ? OR s.stall_code LIKE ? OR hc.issues LIKE ?)'
        const kw = `%${params.keyword}%`
        countParams.push(kw, kw, kw)
      }
      const total = db.prepare(countSql).get(...countParams).total
      
      return { list, total }
    },
    
    'hygiene:get': function (id) {
      return db.prepare(`
        SELECT hc.*, t.name as tenant_name, t.phone, s.stall_code, s.location
        FROM hygiene_checks hc
        LEFT JOIN tenants t ON hc.tenant_id = t.id
        LEFT JOIN stalls s ON hc.stall_id = s.id
        WHERE hc.id = ?
      `).get(id)
    },
    
    'hygiene:create': function (data) {
      const stmt = db.prepare(`
        INSERT INTO hygiene_checks (stall_id, tenant_id, check_date, checker,
          score, issues, is_rectified, rectify_date, rectify_remark, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        data.stall_id, data.tenant_id || null, data.check_date, data.checker,
        data.score || 100, data.issues || '', data.is_rectified || 0,
        data.rectify_date || null, data.rectify_remark || '', data.remark
      )
      
      if (data.score < 80 && data.is_rectified === 0) {
        const dedStmt = db.prepare(`
          INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason,
            points, amount, is_rectified, recorder, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const points = Math.ceil((80 - data.score) / 5)
        const amount = points * 20
        dedStmt.run(
          data.tenant_id, data.stall_id, data.check_date,
          `卫生检查不合格，得分${data.score}分`,
          points, amount, 0, data.checker, '卫生检查自动生成'
        )
      }
      
      return result.lastInsertRowid
    },
    
    'hygiene:update': function (id, data) {
      const stmt = db.prepare(`
        UPDATE hygiene_checks SET 
          stall_id = ?, tenant_id = ?, check_date = ?, checker = ?,
          score = ?, issues = ?, is_rectified = ?, rectify_date = ?,
          rectify_remark = ?, remark = ?
        WHERE id = ?
      `)
      const result = stmt.run(
        data.stall_id, data.tenant_id || null, data.check_date, data.checker,
        data.score || 100, data.issues || '', data.is_rectified || 0,
        data.rectify_date || null, data.rectify_remark || '', data.remark, id
      )
      return result.changes > 0
    },
    
    'hygiene:delete': function (id) {
      const result = db.prepare('DELETE FROM hygiene_checks WHERE id = ?').run(id)
      return result.changes > 0
    },
    
    'hygiene:getUnrectified': function () {
      return db.prepare(`
        SELECT hc.*, t.name as tenant_name, t.phone, s.stall_code, s.location
        FROM hygiene_checks hc
        LEFT JOIN tenants t ON hc.tenant_id = t.id
        LEFT JOIN stalls s ON hc.stall_id = s.id
        WHERE hc.is_rectified = 0 AND hc.score < 80
        ORDER BY hc.check_date ASC
      `).all()
    }
  }
}
