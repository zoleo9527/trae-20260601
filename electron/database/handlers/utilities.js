module.exports = function (db) {
  return {
    'utilities:list': function (params = {}) {
      let sql = `
        SELECT ur.*, t.name as tenant_name, s.stall_code, s.location
        FROM utility_records ur
        LEFT JOIN tenants t ON ur.tenant_id = t.id
        LEFT JOIN stalls s ON ur.stall_id = s.id
        WHERE 1=1
      `
      const sqlParams = []
      
      if (params.utility_type) {
        sql += ' AND ur.utility_type = ?'
        sqlParams.push(params.utility_type)
      }
      if (params.stall_id) {
        sql += ' AND ur.stall_id = ?'
        sqlParams.push(params.stall_id)
      }
      if (params.start_date) {
        sql += ' AND ur.record_date >= ?'
        sqlParams.push(params.start_date)
      }
      if (params.end_date) {
        sql += ' AND ur.record_date <= ?'
        sqlParams.push(params.end_date)
      }
      if (params.is_abnormal !== undefined) {
        sql += ' AND ur.is_abnormal = ?'
        sqlParams.push(params.is_abnormal ? 1 : 0)
      }
      if (params.keyword) {
        sql += ' AND (t.name LIKE ? OR s.stall_code LIKE ?)'
        const kw = `%${params.keyword}%`
        sqlParams.push(kw, kw)
      }
      
      sql += ' ORDER BY ur.record_date DESC, ur.created_at DESC'
      
      if (params.page && params.pageSize) {
        const offset = (params.page - 1) * params.pageSize
        sql += ' LIMIT ? OFFSET ?'
        sqlParams.push(params.pageSize, offset)
      }
      
      const list = db.prepare(sql).all(...sqlParams)
      
      let countSql = `
        SELECT COUNT(*) as total FROM utility_records ur
        LEFT JOIN tenants t ON ur.tenant_id = t.id
        LEFT JOIN stalls s ON ur.stall_id = s.id
        WHERE 1=1
      `
      const countParams = []
      if (params.utility_type) { countSql += ' AND ur.utility_type = ?'; countParams.push(params.utility_type) }
      if (params.stall_id) { countSql += ' AND ur.stall_id = ?'; countParams.push(params.stall_id) }
      if (params.start_date) { countSql += ' AND ur.record_date >= ?'; countParams.push(params.start_date) }
      if (params.end_date) { countSql += ' AND ur.record_date <= ?'; countParams.push(params.end_date) }
      if (params.is_abnormal !== undefined) {
        countSql += ' AND ur.is_abnormal = ?'
        countParams.push(params.is_abnormal ? 1 : 0)
      }
      if (params.keyword) {
        countSql += ' AND (t.name LIKE ? OR s.stall_code LIKE ?)'
        const kw = `%${params.keyword}%`
        countParams.push(kw, kw)
      }
      const total = db.prepare(countSql).get(...countParams).total
      
      return { list, total }
    },
    
    'utilities:get': function (id) {
      return db.prepare(`
        SELECT ur.*, t.name as tenant_name, t.phone, s.stall_code, s.location
        FROM utility_records ur
        LEFT JOIN tenants t ON ur.tenant_id = t.id
        LEFT JOIN stalls s ON ur.stall_id = s.id
        WHERE ur.id = ?
      `).get(id)
    },
    
    'utilities:create': function (data) {
      const usage = data.current_reading - data.last_reading
      const amount = usage * data.unit_price
      
      let isAbnormal = 0
      if (data.utility_type === 'electric' && usage > 500) isAbnormal = 1
      if (data.utility_type === 'water' && usage > 50) isAbnormal = 1
      
      const stmt = db.prepare(`
        INSERT INTO utility_records (stall_id, tenant_id, utility_type, record_date,
          last_reading, current_reading, usage, unit_price, amount, is_abnormal, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        data.stall_id, data.tenant_id || null, data.utility_type, data.record_date,
        data.last_reading, data.current_reading, usage, data.unit_price,
        amount, isAbnormal, data.remark
      )
      return result.lastInsertRowid
    },
    
    'utilities:update': function (id, data) {
      const usage = data.current_reading - data.last_reading
      const amount = usage * data.unit_price
      
      let isAbnormal = 0
      if (data.utility_type === 'electric' && usage > 500) isAbnormal = 1
      if (data.utility_type === 'water' && usage > 50) isAbnormal = 1
      
      const stmt = db.prepare(`
        UPDATE utility_records SET 
          stall_id = ?, tenant_id = ?, utility_type = ?, record_date = ?,
          last_reading = ?, current_reading = ?, usage = ?, unit_price = ?,
          amount = ?, is_abnormal = ?, remark = ?
        WHERE id = ?
      `)
      const result = stmt.run(
        data.stall_id, data.tenant_id || null, data.utility_type, data.record_date,
        data.last_reading, data.current_reading, usage, data.unit_price,
        amount, isAbnormal, data.remark, id
      )
      return result.changes > 0
    },
    
    'utilities:delete': function (id) {
      const result = db.prepare('DELETE FROM utility_records WHERE id = ?').run(id)
      return result.changes > 0
    },
    
    'utilities:getLastReading': function (stallId, type) {
      return db.prepare(`
        SELECT * FROM utility_records 
        WHERE stall_id = ? AND utility_type = ?
        ORDER BY record_date DESC, id DESC
        LIMIT 1
      `).get(stallId, type)
    },
    
    'utilities:getAbnormal': function () {
      return db.prepare(`
        SELECT ur.*, t.name as tenant_name, s.stall_code, s.location
        FROM utility_records ur
        LEFT JOIN tenants t ON ur.tenant_id = t.id
        LEFT JOIN stalls s ON ur.stall_id = s.id
        WHERE ur.is_abnormal = 1
        ORDER BY ur.record_date DESC
        LIMIT 20
      `).all()
    }
  }
}
