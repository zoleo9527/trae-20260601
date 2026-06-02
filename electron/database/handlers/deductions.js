module.exports = function (db) {
  return {
    'deductions:list': function (params = {}) {
      let sql = `
        SELECT d.*, t.name as tenant_name, t.phone, s.stall_code, s.location
        FROM deductions d
        LEFT JOIN tenants t ON d.tenant_id = t.id
        LEFT JOIN stalls s ON d.stall_id = s.id
        WHERE 1=1
      `
      const sqlParams = []
      
      if (params.tenant_id) {
        sql += ' AND d.tenant_id = ?'
        sqlParams.push(params.tenant_id)
      }
      if (params.is_rectified !== undefined) {
        sql += ' AND d.is_rectified = ?'
        sqlParams.push(params.is_rectified ? 1 : 0)
      }
      if (params.start_date) {
        sql += ' AND d.deduction_date >= ?'
        sqlParams.push(params.start_date)
      }
      if (params.end_date) {
        sql += ' AND d.deduction_date <= ?'
        sqlParams.push(params.end_date)
      }
      if (params.year) {
        sql += ' AND strftime("%Y", d.deduction_date) = ?'
        sqlParams.push(String(params.year))
      }
      if (params.month) {
        sql += ' AND strftime("%m", d.deduction_date) = ?'
        sqlParams.push(String(params.month).padStart(2, '0'))
      }
      if (params.keyword) {
        sql += ' AND (t.name LIKE ? OR s.stall_code LIKE ? OR d.reason LIKE ?)'
        const kw = `%${params.keyword}%`
        sqlParams.push(kw, kw, kw)
      }
      
      sql += ' ORDER BY d.deduction_date DESC, d.created_at DESC'
      
      if (params.page && params.pageSize) {
        const offset = (params.page - 1) * params.pageSize
        sql += ' LIMIT ? OFFSET ?'
        sqlParams.push(params.pageSize, offset)
      }
      
      const list = db.prepare(sql).all(...sqlParams)
      
      let countSql = `
        SELECT COUNT(*) as total FROM deductions d
        LEFT JOIN tenants t ON d.tenant_id = t.id
        LEFT JOIN stalls s ON d.stall_id = s.id
        WHERE 1=1
      `
      const countParams = []
      if (params.tenant_id) { countSql += ' AND d.tenant_id = ?'; countParams.push(params.tenant_id) }
      if (params.is_rectified !== undefined) {
        countSql += ' AND d.is_rectified = ?'
        countParams.push(params.is_rectified ? 1 : 0)
      }
      if (params.start_date) { countSql += ' AND d.deduction_date >= ?'; countParams.push(params.start_date) }
      if (params.end_date) { countSql += ' AND d.deduction_date <= ?'; countParams.push(params.end_date) }
      if (params.year) {
        countSql += ' AND strftime("%Y", d.deduction_date) = ?'
        countParams.push(String(params.year))
      }
      if (params.month) {
        countSql += ' AND strftime("%m", d.deduction_date) = ?'
        countParams.push(String(params.month).padStart(2, '0'))
      }
      if (params.keyword) {
        countSql += ' AND (t.name LIKE ? OR s.stall_code LIKE ? OR d.reason LIKE ?)'
        const kw = `%${params.keyword}%`
        countParams.push(kw, kw, kw)
      }
      const total = db.prepare(countSql).get(...countParams).total
      
      return { list, total }
    },
    
    'deductions:get': function (id) {
      return db.prepare(`
        SELECT d.*, t.name as tenant_name, t.phone, t.id_card,
               s.stall_code, s.location
        FROM deductions d
        LEFT JOIN tenants t ON d.tenant_id = t.id
        LEFT JOIN stalls s ON d.stall_id = s.id
        WHERE d.id = ?
      `).get(id)
    },
    
    'deductions:create': function (data) {
      const stmt = db.prepare(`
        INSERT INTO deductions (tenant_id, stall_id, deduction_date, reason,
          points, amount, is_rectified, rectify_date, rectify_remark, recorder, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        data.tenant_id, data.stall_id, data.deduction_date, data.reason,
        data.points || 0, data.amount || 0, data.is_rectified || 0,
        data.rectify_date || null, data.rectify_remark || '',
        data.recorder || '', data.remark
      )
      return result.lastInsertRowid
    },
    
    'deductions:update': function (id, data) {
      const stmt = db.prepare(`
        UPDATE deductions SET 
          tenant_id = ?, stall_id = ?, deduction_date = ?, reason = ?,
          points = ?, amount = ?, is_rectified = ?, rectify_date = ?,
          rectify_remark = ?, recorder = ?, remark = ?
        WHERE id = ?
      `)
      const result = stmt.run(
        data.tenant_id, data.stall_id, data.deduction_date, data.reason,
        data.points || 0, data.amount || 0, data.is_rectified || 0,
        data.rectify_date || null, data.rectify_remark || '',
        data.recorder || '', data.remark, id
      )
      return result.changes > 0
    },
    
    'deductions:delete': function (id) {
      const result = db.prepare('DELETE FROM deductions WHERE id = ?').run(id)
      return result.changes > 0
    },
    
    'deductions:getSummary': function (year, month) {
      let sql = `
        SELECT t.id as tenant_id, t.name as tenant_name, s.stall_code,
               COUNT(*) as deduction_count,
               SUM(d.points) as total_points,
               SUM(d.amount) as total_amount,
               SUM(CASE WHEN d.is_rectified = 0 THEN 1 ELSE 0 END) as unrectified_count
        FROM deductions d
        LEFT JOIN tenants t ON d.tenant_id = t.id
        LEFT JOIN stalls s ON d.stall_id = s.id
        WHERE 1=1
      `
      const params = []
      if (year) {
        sql += ' AND strftime("%Y", d.deduction_date) = ?'
        params.push(String(year))
      }
      if (month) {
        sql += ' AND strftime("%m", d.deduction_date) = ?'
        params.push(String(month).padStart(2, '0'))
      }
      sql += ' GROUP BY t.id, t.name, s.stall_code ORDER BY total_points DESC'
      
      return db.prepare(sql).all(...params)
    },
    
    'deductions:markRectified': function (id, rectifyDate, remark) {
      const stmt = db.prepare(`
        UPDATE deductions SET 
          is_rectified = 1, rectify_date = ?, rectify_remark = ?
        WHERE id = ?
      `)
      const result = stmt.run(rectifyDate || null, remark || '', id)
      
      const deduction = db.prepare('SELECT * FROM deductions WHERE id = ?').get(id)
      if (deduction) {
        db.prepare(`
          UPDATE hygiene_checks SET 
            is_rectified = 1, rectify_date = ?, rectify_remark = ?
          WHERE tenant_id = ? AND stall_id = ? AND check_date = ?
        `).run(rectifyDate || null, remark || '', deduction.tenant_id, deduction.stall_id, deduction.deduction_date)
      }
      
      return result.changes > 0
    }
  }
}
