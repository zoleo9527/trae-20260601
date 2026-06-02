module.exports = function (db) {
  return {
    'tenants:list': function (params = {}) {
      let sql = `
        SELECT t.*, s.stall_code, s.location, s.monthly_rent,
               ot.name as original_tenant_name
        FROM tenants t
        LEFT JOIN stalls s ON t.stall_id = s.id
        LEFT JOIN tenants ot ON t.original_tenant_id = ot.id
        WHERE 1=1
      `
      const sqlParams = []
      
      if (params.status) {
        sql += ' AND t.status = ?'
        sqlParams.push(params.status)
      }
      if (params.keyword) {
        sql += ' AND (t.name LIKE ? OR t.phone LIKE ? OR t.business_type LIKE ? OR s.stall_code LIKE ?)'
        const kw = `%${params.keyword}%`
        sqlParams.push(kw, kw, kw, kw)
      }
      
      sql += ' ORDER BY t.created_at DESC'
      
      if (params.page && params.pageSize) {
        const offset = (params.page - 1) * params.pageSize
        sql += ' LIMIT ? OFFSET ?'
        sqlParams.push(params.pageSize, offset)
      }
      
      const list = db.prepare(sql).all(...sqlParams)
      
      let countSql = `
        SELECT COUNT(*) as total FROM tenants t
        LEFT JOIN stalls s ON t.stall_id = s.id
        WHERE 1=1
      `
      const countParams = []
      if (params.status) {
        countSql += ' AND t.status = ?'
        countParams.push(params.status)
      }
      if (params.keyword) {
        countSql += ' AND (t.name LIKE ? OR t.phone LIKE ? OR t.business_type LIKE ? OR s.stall_code LIKE ?)'
        const kw = `%${params.keyword}%`
        countParams.push(kw, kw, kw, kw)
      }
      const total = db.prepare(countSql).get(...countParams).total
      
      return { list, total }
    },
    
    'tenants:get': function (id) {
      return db.prepare(`
        SELECT t.*, s.stall_code, s.location, s.area, s.monthly_rent,
               ot.name as original_tenant_name
        FROM tenants t
        LEFT JOIN stalls s ON t.stall_id = s.id
        LEFT JOIN tenants ot ON t.original_tenant_id = ot.id
        WHERE t.id = ?
      `).get(id)
    },
    
    'tenants:create': function (data) {
      const existingTenant = db.prepare('SELECT id FROM tenants WHERE stall_id = ? AND status = ?').get(data.stall_id, 'active')
      if (existingTenant && !data.is_sublease) {
        throw new Error('该摊位已有活跃摊主，请先处理转租或退租')
      }
      
      const stmt = db.prepare(`
        INSERT INTO tenants (name, phone, id_card, address, business_type, stall_id,
          start_date, end_date, is_sublease, original_tenant_id, status, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        data.name, data.phone, data.id_card, data.address, data.business_type,
        data.stall_id, data.start_date, data.end_date,
        data.is_sublease || 0, data.original_tenant_id || null,
        data.status || 'active', data.remark
      )
      return result.lastInsertRowid
    },
    
    'tenants:update': function (id, data) {
      const stmt = db.prepare(`
        UPDATE tenants SET 
          name = ?, phone = ?, id_card = ?, address = ?, business_type = ?,
          stall_id = ?, start_date = ?, end_date = ?, is_sublease = ?,
          original_tenant_id = ?, status = ?, remark = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      const result = stmt.run(
        data.name, data.phone, data.id_card, data.address, data.business_type,
        data.stall_id, data.start_date, data.end_date, data.is_sublease || 0,
        data.original_tenant_id || null, data.status, data.remark, id
      )
      return result.changes > 0
    },
    
    'tenants:delete': function (id) {
      const unpaidCount = db.prepare('SELECT COUNT(*) as count FROM rent_bills WHERE tenant_id = ? AND status != ?').get(id, 'paid').count
      if (unpaidCount > 0) {
        throw new Error('该摊主还有未结清的账单，无法删除')
      }
      
      const unrectifiedCount = db.prepare('SELECT COUNT(*) as count FROM deductions WHERE tenant_id = ? AND is_rectified = 0').get(id).count
      if (unrectifiedCount > 0) {
        throw new Error('该摊主还有未整改的扣分记录，无法删除')
      }
      
      const tenant = db.prepare('SELECT stall_id FROM tenants WHERE id = ?').get(id)
      if (!tenant) throw new Error('摊主不存在')
      
      const tx = db.transaction(() => {
        db.prepare('UPDATE tenants SET status = ?, end_date = date(\'now\'), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('inactive', id)
        
        const subleaseCount = db.prepare('SELECT COUNT(*) as count FROM tenants WHERE original_tenant_id = ?').get(id).count
        if (subleaseCount === 0) {
          db.prepare('UPDATE stalls SET status = ? WHERE id = ?').run('inactive', tenant.stall_id)
        }
      })
      tx()
      return true
    },
    
    'tenants:getActive': function () {
      return db.prepare(`
        SELECT t.*, s.stall_code, s.location, s.monthly_rent
        FROM tenants t
        LEFT JOIN stalls s ON t.stall_id = s.id
        WHERE t.status = 'active'
        ORDER BY s.stall_code ASC
      `).all()
    }
  }
}
