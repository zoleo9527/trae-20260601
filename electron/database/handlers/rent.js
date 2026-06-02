module.exports = function (db) {
  return {
    'rent:list': function (params = {}) {
      let sql = `
        SELECT rb.*, t.name as tenant_name, t.phone, s.stall_code, s.location
        FROM rent_bills rb
        LEFT JOIN tenants t ON rb.tenant_id = t.id
        LEFT JOIN stalls s ON rb.stall_id = s.id
        WHERE 1=1
      `
      const sqlParams = []
      
      if (params.year) {
        sql += ' AND rb.bill_year = ?'
        sqlParams.push(params.year)
      }
      if (params.month) {
        sql += ' AND rb.bill_month = ?'
        sqlParams.push(params.month)
      }
      if (params.status) {
        sql += ' AND rb.status = ?'
        sqlParams.push(params.status)
      }
      if (params.tenant_id) {
        sql += ' AND rb.tenant_id = ?'
        sqlParams.push(params.tenant_id)
      }
      if (params.keyword) {
        sql += ' AND (t.name LIKE ? OR s.stall_code LIKE ?)'
        const kw = `%${params.keyword}%`
        sqlParams.push(kw, kw)
      }
      
      sql += ' ORDER BY rb.bill_year DESC, rb.bill_month DESC, rb.created_at DESC'
      
      if (params.page && params.pageSize) {
        const offset = (params.page - 1) * params.pageSize
        sql += ' LIMIT ? OFFSET ?'
        sqlParams.push(params.pageSize, offset)
      }
      
      const list = db.prepare(sql).all(...sqlParams)
      
      let countSql = `
        SELECT COUNT(*) as total FROM rent_bills rb
        LEFT JOIN tenants t ON rb.tenant_id = t.id
        LEFT JOIN stalls s ON rb.stall_id = s.id
        WHERE 1=1
      `
      const countParams = []
      if (params.year) { countSql += ' AND rb.bill_year = ?'; countParams.push(params.year) }
      if (params.month) { countSql += ' AND rb.bill_month = ?'; countParams.push(params.month) }
      if (params.status) { countSql += ' AND rb.status = ?'; countParams.push(params.status) }
      if (params.tenant_id) { countSql += ' AND rb.tenant_id = ?'; countParams.push(params.tenant_id) }
      if (params.keyword) {
        countSql += ' AND (t.name LIKE ? OR s.stall_code LIKE ?)'
        const kw = `%${params.keyword}%`
        countParams.push(kw, kw)
      }
      const total = db.prepare(countSql).get(...countParams).total
      
      return { list, total }
    },
    
    'rent:get': function (id) {
      return db.prepare(`
        SELECT rb.*, t.name as tenant_name, t.phone, t.id_card,
               s.stall_code, s.location, s.area
        FROM rent_bills rb
        LEFT JOIN tenants t ON rb.tenant_id = t.id
        LEFT JOIN stalls s ON rb.stall_id = s.id
        WHERE rb.id = ?
      `).get(id)
    },
    
    'rent:create': function (data) {
      const total = data.base_rent + (data.extra_fee || 0) - (data.discount || 0)
      const stmt = db.prepare(`
        INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month,
          base_rent, extra_fee, discount, total_amount, paid_amount, paid_date, status, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        data.tenant_id, data.stall_id, data.bill_year, data.bill_month,
        data.base_rent, data.extra_fee || 0, data.discount || 0, total,
        data.paid_amount || 0, data.paid_date || null,
        data.status || 'unpaid', data.remark
      )
      return result.lastInsertRowid
    },
    
    'rent:update': function (id, data) {
      const total = data.base_rent + (data.extra_fee || 0) - (data.discount || 0)
      const stmt = db.prepare(`
        UPDATE rent_bills SET 
          tenant_id = ?, stall_id = ?, bill_year = ?, bill_month = ?,
          base_rent = ?, extra_fee = ?, discount = ?, total_amount = ?,
          paid_amount = ?, paid_date = ?, status = ?, remark = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      const result = stmt.run(
        data.tenant_id, data.stall_id, data.bill_year, data.bill_month,
        data.base_rent, data.extra_fee || 0, data.discount || 0, total,
        data.paid_amount || 0, data.paid_date || null,
        data.status, data.remark, id
      )
      return result.changes > 0
    },
    
    'rent:delete': function (id) {
      const result = db.prepare('DELETE FROM rent_bills WHERE id = ?').run(id)
      return result.changes > 0
    },
    
    'rent:generateBatch': function (year, month) {
      const existing = db.prepare(`
        SELECT COUNT(*) as count FROM rent_bills WHERE bill_year = ? AND bill_month = ?
      `).get(year, month).count
      
      if (existing > 0) {
        throw new Error(`${year}年${month}月的租金账单已生成`)
      }
      
      const activeTenants = db.prepare(`
        SELECT t.id as tenant_id, t.stall_id, s.monthly_rent
        FROM tenants t
        LEFT JOIN stalls s ON t.stall_id = s.id
        WHERE t.status = 'active' AND t.stall_id IS NOT NULL
      `).all()
      
      const tx = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO rent_bills (tenant_id, stall_id, bill_year, bill_month,
            base_rent, extra_fee, discount, total_amount, paid_amount, status)
          VALUES (?, ?, ?, ?, ?, 0, 0, ?, 0, 'unpaid')
        `)
        
        for (const t of activeTenants) {
          stmt.run(t.tenant_id, t.stall_id, year, month, t.monthly_rent, t.monthly_rent)
        }
        return activeTenants.length
      })
      
      return tx()
    },
    
    'rent:markPaid': function (id, amount, payDate) {
      const bill = db.prepare('SELECT * FROM rent_bills WHERE id = ?').get(id)
      if (!bill) throw new Error('账单不存在')
      
      const newPaid = (bill.paid_amount || 0) + amount
      let status = 'unpaid'
      if (newPaid >= bill.total_amount) status = 'paid'
      else if (newPaid > 0) status = 'partial'
      
      const stmt = db.prepare(`
        UPDATE rent_bills SET paid_amount = ?, paid_date = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      const result = stmt.run(newPaid, payDate || null, status, id)
      return result.changes > 0
    }
  }
}
