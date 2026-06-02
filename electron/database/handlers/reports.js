const XLSX = require('xlsx')
const os = require('os')
const path = require('path')

module.exports = function (db) {
  return {
    'reports:getDashboard': function () {
      const stallCount = db.prepare('SELECT COUNT(*) as count FROM stalls').get().count
      const activeStallCount = db.prepare("SELECT COUNT(*) as count FROM stalls WHERE status = 'active'").get().count
      const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get().count
      const activeTenantCount = db.prepare("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'").get().count
      
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const unpaidRent = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount - paid_amount), 0) as amount
        FROM rent_bills 
        WHERE status != 'paid' AND bill_year = ? AND bill_month = ?
      `).get(year, month)
      
      const unrectifiedDeductions = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
        FROM deductions WHERE is_rectified = 0
      `).get()
      
      const abnormalUtilities = db.prepare(`
        SELECT COUNT(*) as count FROM utility_records WHERE is_abnormal = 1
      `).get()
      
      const recentDeductions = db.prepare(`
        SELECT d.*, t.name as tenant_name, s.stall_code
        FROM deductions d
        LEFT JOIN tenants t ON d.tenant_id = t.id
        LEFT JOIN stalls s ON d.stall_id = s.id
        ORDER BY d.deduction_date DESC
        LIMIT 5
      `).all()
      
      const subleaseCount = db.prepare('SELECT COUNT(*) as count FROM tenants WHERE is_sublease = 1').get().count
      
      return {
        stallCount,
        activeStallCount,
        tenantCount,
        activeTenantCount,
        subleaseCount,
        unpaidRent: unpaidRent.amount,
        unpaidRentCount: unpaidRent.count,
        unrectifiedDeductions: unrectifiedDeductions.amount,
        unrectifiedDeductionCount: unrectifiedDeductions.count,
        abnormalUtilityCount: abnormalUtilities.count,
        recentDeductions
      }
    },
    
    'reports:getArrears': function (year, month) {
      let sql = `
        SELECT rb.*, t.name as tenant_name, t.phone, t.id_card,
               s.stall_code, s.location,
               (rb.total_amount - rb.paid_amount) as arrears_amount
        FROM rent_bills rb
        LEFT JOIN tenants t ON rb.tenant_id = t.id
        LEFT JOIN stalls s ON rb.stall_id = s.id
        WHERE rb.status != 'paid'
      `
      const params = []
      if (year) {
        sql += ' AND rb.bill_year = ?'
        params.push(year)
      }
      if (month) {
        sql += ' AND rb.bill_month = ?'
        params.push(month)
      }
      sql += ' ORDER BY arrears_amount DESC'
      
      const list = db.prepare(sql).all(...params)
      
      const total = list.reduce((sum, item) => sum + (item.arrears_amount || 0), 0)
      
      return { list, totalArrears: total }
    },
    
    'reports:getDeductionDetails': function (year, month) {
      let sql = `
        SELECT d.*, t.name as tenant_name, t.phone, s.stall_code, s.location
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
      sql += ' ORDER BY d.deduction_date DESC'
      
      const list = db.prepare(sql).all(...params)
      
      const summary = db.prepare(`
        SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(CASE WHEN is_rectified = 0 THEN 1 ELSE 0 END), 0) as unrectified_count,
          COALESCE(SUM(points), 0) as total_points,
          COALESCE(SUM(amount), 0) as total_amount
        FROM deductions d
        WHERE 1=1
      ` + (year ? ' AND strftime("%Y", d.deduction_date) = ?' : '')
        + (month ? ' AND strftime("%m", d.deduction_date) = ?' : '')
      ).get(...params)
      
      return { list, summary }
    },
    
    'reports:generateNotice': function (tenantId, type, data) {
      const tenant = db.prepare(`
        SELECT t.*, s.stall_code, s.location
        FROM tenants t
        LEFT JOIN stalls s ON t.stall_id = s.id
        WHERE t.id = ?
      `).get(tenantId)
      
      if (!tenant) throw new Error('摊主不存在')
      
      const today = new Date().toLocaleDateString('zh-CN')
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 7)
      const deadlineStr = deadline.toLocaleDateString('zh-CN')
      
      let title = ''
      let content = ''
      let items = []
      let totalAmount = 0
      
      if (type === 'rent') {
        title = '租金催缴通知单'
        content = `您承租的 ${tenant.stall_code} 摊位，以下租金尚未缴纳，请于 ${deadlineStr} 日前到市场管理处缴纳。逾期未缴将按规定收取滞纳金。`
        
        const bills = db.prepare(`
          SELECT * FROM rent_bills 
          WHERE tenant_id = ? AND status != 'paid'
          ORDER BY bill_year, bill_month
        `).all(tenantId)
        
        items = bills.map(b => ({
          period: `${b.bill_year}年${b.bill_month}月`,
          description: '摊位租金',
          amount: b.total_amount - b.paid_amount
        }))
        
        totalAmount = items.reduce((sum, i) => sum + i.amount, 0)
      } else if (type === 'deduction') {
        title = '整改通知单'
        content = `您承租的 ${tenant.stall_code} 摊位，存在以下违规扣分事项，请于 ${deadlineStr} 日前完成整改。逾期未整改将追加处罚。`
        
        const deductions = db.prepare(`
          SELECT * FROM deductions 
          WHERE tenant_id = ? AND is_rectified = 0
          ORDER BY deduction_date
        `).all(tenantId)
        
        items = deductions.map(d => ({
          period: d.deduction_date,
          description: d.reason,
          amount: d.amount,
          points: d.points
        }))
        
        totalAmount = items.reduce((sum, i) => sum + i.amount, 0)
      } else if (type === 'utility') {
        title = '水电费缴纳通知单'
        content = `您承租的 ${tenant.stall_code} 摊位，以下水电费用尚未缴纳，请于 ${deadlineStr} 日前到市场管理处缴纳。`
        
        items = data.items || []
        totalAmount = data.totalAmount || 0
      }
      
      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  body { font-family: "Microsoft YaHei", sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
  .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
  .sub-title { font-size: 14px; color: #666; }
  .info-section { margin-bottom: 20px; line-height: 1.8; }
  .info-row { display: flex; margin-bottom: 5px; }
  .info-label { width: 100px; color: #666; }
  .info-value { flex: 1; }
  .content-text { font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-indent: 2em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #333; padding: 10px; text-align: left; }
  th { background-color: #f5f5f5; font-weight: bold; }
  .total-row { font-weight: bold; background-color: #f9f9f9; }
  .total-amount { color: #d9534f; font-size: 18px; }
  .footer { margin-top: 40px; }
  .footer-right { text-align: right; margin-top: 60px; }
  .signature { margin-top: 20px; }
  .reminder { margin-top: 30px; padding: 15px; background-color: #fcf8e3; border: 1px solid #faebcc; border-radius: 4px; color: #8a6d3b; }
  .reminder-title { font-weight: bold; margin-bottom: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">${title}</div>
    <div class="sub-title">市场管理处 编号：${Date.now()}</div>
  </div>
  
  <div class="info-section">
    <div class="info-row">
      <span class="info-label">摊主姓名：</span>
      <span class="info-value">${tenant.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">联系电话：</span>
      <span class="info-value">${tenant.phone || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">摊位编号：</span>
      <span class="info-value">${tenant.stall_code || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">摊位位置：</span>
      <span class="info-value">${tenant.location || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">通知日期：</span>
      <span class="info-value">${today}</span>
    </div>
  </div>
  
  <div class="content-text">${content}</div>
  
  <table>
    <thead>
      <tr>
        <th width="25%">日期/时段</th>
        <th width="45%">事项说明</th>
        ${type === 'deduction' ? '<th width="10%">扣分</th>' : ''}
        <th width="20%">金额(元)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.period}</td>
          <td>${item.description}</td>
          ${type === 'deduction' ? `<td>${item.points || '-'}</td>` : ''}
          <td>${item.amount.toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="${type === 'deduction' ? 3 : 2}" style="text-align: right;">合计金额：</td>
        <td class="total-amount">¥${totalAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  
  ${type === 'deduction' ? `
    <div class="reminder">
      <div class="reminder-title">温馨提示</div>
      <div>1. 请在规定期限内完成整改，整改完成后联系管理员复查。</div>
      <div>2. 如对本通知有异议，请在3个工作日内到市场管理处提出。</div>
      <div>3. 累计扣分达到规定上限将终止租赁合同。</div>
    </div>
  ` : `
    <div class="reminder">
      <div class="reminder-title">温馨提示</div>
      <div>1. 请在规定期限内到市场管理处财务室缴纳费用。</div>
      <div>2. 逾期未缴将按每日0.5%收取滞纳金。</div>
      <div>3. 缴费时请携带本通知单。</div>
    </div>
  `}
  
  <div class="footer">
    <div class="footer-right">
      <div>市场管理处（盖章）</div>
      <div class="signature">____________________</div>
      <div>经办人：______________</div>
      <div>${today}</div>
    </div>
  </div>
</body>
</html>`
      
      return { html, tenant, items, totalAmount }
    },
    
    'reports:exportToExcel': function (type, params) {
      let data = []
      let fileName = ''
      let sheetName = ''
      
      if (type === 'arrears') {
        const result = db.prepare(`
          SELECT t.name as 摊主姓名, t.phone as 联系电话, s.stall_code as 摊位编号,
                 s.location as 摊位位置, rb.bill_year as 年份, rb.bill_month as 月份,
                 rb.total_amount as 应缴金额, rb.paid_amount as 已缴金额,
                 (rb.total_amount - rb.paid_amount) as 欠费金额, rb.remark as 备注
          FROM rent_bills rb
          LEFT JOIN tenants t ON rb.tenant_id = t.id
          LEFT JOIN stalls s ON rb.stall_id = s.id
          WHERE rb.status != 'paid'
          ${params.year ? ' AND rb.bill_year = ' + params.year : ''}
          ${params.month ? ' AND rb.bill_month = ' + params.month : ''}
          ORDER BY rb.bill_year, rb.bill_month, t.name
        `).all()
        data = result
        fileName = `欠费明细_${new Date().toISOString().slice(0, 10)}.xlsx`
        sheetName = '欠费明细'
      } else if (type === 'deductions') {
        const result = db.prepare(`
          SELECT d.deduction_date as 日期, t.name as 摊主姓名, s.stall_code as 摊位编号,
                 s.location as 摊位位置, d.reason as 原因, d.points as 扣分,
                 d.amount as 罚金, d.is_rectified as 已整改, d.rectify_date as 整改日期,
                 d.rectify_remark as 整改说明, d.recorder as 记录人
          FROM deductions d
          LEFT JOIN tenants t ON d.tenant_id = t.id
          LEFT JOIN stalls s ON d.stall_id = s.id
          WHERE 1=1
          ${params.year ? ' AND strftime("%Y", d.deduction_date) = "' + params.year + '"' : ''}
          ${params.month ? ' AND strftime("%m", d.deduction_date) = "' + String(params.month).padStart(2, '0') + '"' : ''}
          ORDER BY d.deduction_date DESC
        `).all().map(item => ({
          ...item,
          已整改: item.已整改 ? '是' : '否'
        }))
        data = result
        fileName = `扣分明细_${new Date().toISOString().slice(0, 10)}.xlsx`
        sheetName = '扣分明细'
      } else if (type === 'rent') {
        const result = db.prepare(`
          SELECT rb.bill_year as 年份, rb.bill_month as 月份, t.name as 摊主姓名,
                 s.stall_code as 摊位编号, s.location as 摊位位置,
                 rb.base_rent as 基础租金, rb.extra_fee as 附加费用,
                 rb.discount as 优惠减免, rb.total_amount as 应缴总额,
                 rb.paid_amount as 已缴金额, 
                 CASE rb.status WHEN 'paid' THEN '已缴清' WHEN 'partial' THEN '部分缴纳' ELSE '未缴' END as 状态,
                 rb.paid_date as 缴费日期
          FROM rent_bills rb
          LEFT JOIN tenants t ON rb.tenant_id = t.id
          LEFT JOIN stalls s ON rb.stall_id = s.id
          WHERE 1=1
          ${params.year ? ' AND rb.bill_year = ' + params.year : ''}
          ${params.month ? ' AND rb.bill_month = ' + params.month : ''}
          ORDER BY rb.bill_year DESC, rb.bill_month DESC, t.name
        `).all()
        data = result
        fileName = `租金账单_${new Date().toISOString().slice(0, 10)}.xlsx`
        sheetName = '租金账单'
      }
      
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      const exportPath = path.join(os.homedir(), 'Desktop', fileName)
      XLSX.writeFile(workbook, exportPath)
      
      return { filePath: exportPath, fileName, rowCount: data.length }
    }
  }
}
