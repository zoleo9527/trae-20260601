module.exports = function (db) {
  return {
    'stalls:list': function (params = {}) {
      let sql = 'SELECT * FROM stalls WHERE 1=1'
      const sqlParams = []
      
      if (params.status) {
        sql += ' AND status = ?'
        sqlParams.push(params.status)
      }
      if (params.keyword) {
        sql += ' AND (stall_code LIKE ? OR location LIKE ? OR type LIKE ?)'
        const kw = `%${params.keyword}%`
        sqlParams.push(kw, kw, kw)
      }
      
      sql += ' ORDER BY stall_code ASC'
      
      if (params.page && params.pageSize) {
        const offset = (params.page - 1) * params.pageSize
        sql += ' LIMIT ? OFFSET ?'
        sqlParams.push(params.pageSize, offset)
      }
      
      const list = db.prepare(sql).all(...sqlParams)
      
      let countSql = 'SELECT COUNT(*) as total FROM stalls WHERE 1=1'
      if (params.status) countSql += ' AND status = ?'
      if (params.keyword) countSql += ' AND (stall_code LIKE ? OR location LIKE ? OR type LIKE ?)'
      const countParams = params.status ? [params.status] : []
      if (params.keyword) {
        const kw = `%${params.keyword}%`
        countParams.push(kw, kw, kw)
      }
      const total = db.prepare(countSql).get(...countParams).total
      
      return { list, total }
    },
    
    'stalls:get': function (id) {
      return db.prepare('SELECT * FROM stalls WHERE id = ?').get(id)
    },
    
    'stalls:create': function (data) {
      const stmt = db.prepare(`
        INSERT INTO stalls (stall_code, area, location, type, monthly_rent, status, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        data.stall_code, data.area, data.location, data.type,
        data.monthly_rent, data.status || 'active', data.remark
      )
      return result.lastInsertRowid
    },
    
    'stalls:update': function (id, data) {
      const stmt = db.prepare(`
        UPDATE stalls SET 
          stall_code = ?, area = ?, location = ?, type = ?, 
          monthly_rent = ?, status = ?, remark = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      const result = stmt.run(
        data.stall_code, data.area, data.location, data.type,
        data.monthly_rent, data.status, data.remark, id
      )
      return result.changes > 0
    },
    
    'stalls:delete': function (id) {
      const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants WHERE stall_id = ?').get(id).count
      if (tenantCount > 0) {
        throw new Error('该摊位下还有摊主，无法删除')
      }
      const result = db.prepare('DELETE FROM stalls WHERE id = ?').run(id)
      return result.changes > 0
    },
    
    'stalls:listWithTenant': function () {
      return db.prepare(`
        SELECT s.*, t.id as tenant_id, t.name as tenant_name, t.phone as tenant_phone,
               t.business_type, t.start_date, t.end_date, t.is_sublease,
               ot.name as original_tenant_name
        FROM stalls s
        LEFT JOIN tenants t ON s.id = t.stall_id AND t.status = 'active'
        LEFT JOIN tenants ot ON t.original_tenant_id = ot.id
        ORDER BY s.stall_code ASC
      `).all()
    }
  }
}
