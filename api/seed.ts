import { v4 as uuid } from 'uuid'
import db, { resetDatabase } from './db.js'

const today = new Date()
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

export function seed(): void {
  resetDatabase()

  const now = dateStr(today)

  const qualifications = [
    {
      id: uuid(), customer_name: '明德口腔诊所', license_type: '医疗器械经营许可证',
      license_no: 'YX2024001', status: 'approved', submitted_by: '张三',
      reviewed_by: '王五', review_note: '资质齐全，审核通过',
      expire_date: dateStr(addDays(today, 180)), created_at: '2025-01-15T10:00:00', updated_at: '2025-01-16T14:30:00',
    },
    {
      id: uuid(), customer_name: '仁爱牙科医院', license_type: '营业执照',
      license_no: 'YY2024002', status: 'approved', submitted_by: '李四',
      reviewed_by: '王五', review_note: '材料完整，予以通过',
      expire_date: dateStr(addDays(today, 365)), created_at: '2025-02-10T09:00:00', updated_at: '2025-02-11T11:00:00',
    },
    {
      id: uuid(), customer_name: '康贝口腔门诊', license_type: '医疗机构执业许可证',
      license_no: 'YL2024003', status: 'pending', submitted_by: '张三',
      reviewed_by: null, review_note: null,
      expire_date: dateStr(addDays(today, 90)), created_at: '2025-05-20T15:00:00', updated_at: '2025-05-20T15:00:00',
    },
    {
      id: uuid(), customer_name: '瑞尔齿科', license_type: '医疗器械经营许可证',
      license_no: 'YX2024004', status: 'rejected', submitted_by: '赵六',
      reviewed_by: '王五', review_note: '许可证已过期，请更新后重新提交',
      expire_date: dateStr(addDays(today, -30)), created_at: '2025-03-05T08:30:00', updated_at: '2025-03-06T10:00:00',
    },
    {
      id: uuid(), customer_name: '优益口腔', license_type: '营业执照',
      license_no: 'YY2024005', status: 'expiring_soon', submitted_by: '钱七',
      reviewed_by: '王五', review_note: '审核通过，请注意资质即将到期',
      expire_date: dateStr(addDays(today, 12)), created_at: '2024-12-01T10:00:00', updated_at: '2024-12-02T09:00:00',
    },
    {
      id: uuid(), customer_name: '佳美口腔', license_type: '医疗机构执业许可证',
      license_no: 'YL2024006', status: 'expired', submitted_by: '李四',
      reviewed_by: '王五', review_note: '资质已到期',
      expire_date: dateStr(addDays(today, -60)), created_at: '2024-06-15T14:00:00', updated_at: '2024-06-16T10:00:00',
    },
    {
      id: uuid(), customer_name: '明德口腔诊所', license_type: '营业执照',
      license_no: 'YY2024007', status: 'approved', submitted_by: '张三',
      reviewed_by: '王五', review_note: '营业执照有效',
      expire_date: dateStr(addDays(today, 200)), created_at: '2025-01-15T10:30:00', updated_at: '2025-01-16T14:45:00',
    },
    {
      id: uuid(), customer_name: '仁爱牙科医院', license_type: '医疗机构执业许可证',
      license_no: 'YL2024008', status: 'expiring_soon', submitted_by: '赵六',
      reviewed_by: '王五', review_note: '即将到期，请尽快续期',
      expire_date: dateStr(addDays(today, 7)), created_at: '2024-08-20T11:00:00', updated_at: '2024-08-21T09:30:00',
    },
    {
      id: uuid(), customer_name: '康贝口腔门诊', license_type: '医疗器械经营许可证',
      license_no: 'YX2024009', status: 'pending', submitted_by: '钱七',
      reviewed_by: null, review_note: null,
      expire_date: dateStr(addDays(today, 120)), created_at: '2025-06-01T08:00:00', updated_at: '2025-06-01T08:00:00',
    },
  ]

  const insertQual = db.prepare(`
    INSERT INTO qualifications (id, customer_name, license_type, license_no, status, submitted_by, reviewed_by, review_note, expire_date, created_at, updated_at)
    VALUES (@id, @customer_name, @license_type, @license_no, @status, @submitted_by, @reviewed_by, @review_note, @expire_date, @created_at, @updated_at)
  `)

  const insertQualLog = db.prepare(`
    INSERT INTO qualification_review_logs (id, qualification_id, action, operator, role, note, created_at)
    VALUES (@id, @qualification_id, @action, @operator, @role, @note, @created_at)
  `)

  for (const q of qualifications) {
    insertQual.run(q)

    insertQualLog.run({
      id: uuid(), qualification_id: q.id, action: 'submit', operator: q.submitted_by,
      role: 'sales_clerk', note: '提交资质申请', created_at: q.created_at,
    })

    if (q.status === 'approved') {
      insertQualLog.run({
        id: uuid(), qualification_id: q.id, action: 'approve', operator: q.reviewed_by!,
        role: 'director', note: q.review_note!, created_at: q.updated_at,
      })
    } else if (q.status === 'rejected') {
      insertQualLog.run({
        id: uuid(), qualification_id: q.id, action: 'reject', operator: q.reviewed_by!,
        role: 'director', note: q.review_note!, created_at: q.updated_at,
      })
    } else if (q.status === 'expiring_soon') {
      insertQualLog.run({
        id: uuid(), qualification_id: q.id, action: 'approve', operator: q.reviewed_by!,
        role: 'director', note: q.review_note!, created_at: q.updated_at,
      })
      insertQualLog.run({
        id: uuid(), qualification_id: q.id, action: 'expiring_warning', operator: '系统',
        role: 'director', note: '资质即将到期', created_at: now + 'T00:00:00',
      })
    } else if (q.status === 'expired') {
      insertQualLog.run({
        id: uuid(), qualification_id: q.id, action: 'approve', operator: q.reviewed_by!,
        role: 'director', note: '审核通过', created_at: q.updated_at,
      })
      insertQualLog.run({
        id: uuid(), qualification_id: q.id, action: 'expired', operator: '系统',
        role: 'director', note: '资质已过期', created_at: now + 'T00:00:00',
      })
    }
  }

  const approvedQ1 = qualifications[0]
  const approvedQ2 = qualifications[1]
  const pendingQ = qualifications[2]
  const expiringQ = qualifications[4]
  const approvedQ7 = qualifications[6]

  const purchases = [
    {
      id: uuid(), request_no: 'CG20250101001', customer_name: approvedQ1.customer_name,
      qualification_id: approvedQ1.id, qualification_status: 'approved',
      total_amount: 15800, status: 'completed', created_by: '张三', reviewed_by: '王五',
      created_at: '2025-02-01T09:00:00', updated_at: '2025-02-10T16:00:00',
    },
    {
      id: uuid(), request_no: 'CG20250215001', customer_name: approvedQ2.customer_name,
      qualification_id: approvedQ2.id, qualification_status: 'approved',
      total_amount: 23600, status: 'shipped', created_by: '李四', reviewed_by: '王五',
      created_at: '2025-03-10T10:00:00', updated_at: '2025-03-18T11:00:00',
    },
    {
      id: uuid(), request_no: 'CG20250320001', customer_name: approvedQ1.customer_name,
      qualification_id: approvedQ1.id, qualification_status: 'approved',
      total_amount: 8900, status: 'approved', created_by: '张三', reviewed_by: '王五',
      created_at: '2025-04-05T14:00:00', updated_at: '2025-04-06T09:30:00',
    },
    {
      id: uuid(), request_no: 'CG20250401001', customer_name: pendingQ.customer_name,
      qualification_id: pendingQ.id, qualification_status: 'pending',
      total_amount: 12500, status: 'pending_review', created_by: '张三', reviewed_by: null,
      created_at: '2025-05-01T11:00:00', updated_at: '2025-05-01T11:00:00',
    },
    {
      id: uuid(), request_no: 'CG20250510001', customer_name: expiringQ.customer_name,
      qualification_id: expiringQ.id, qualification_status: 'expiring_soon',
      total_amount: 5200, status: 'confirmed_out', created_by: '钱七', reviewed_by: '王五',
      created_at: '2025-05-10T08:30:00', updated_at: '2025-05-12T10:00:00',
    },
    {
      id: uuid(), request_no: 'CG20250525001', customer_name: approvedQ7.customer_name,
      qualification_id: approvedQ7.id, qualification_status: 'approved',
      total_amount: 31200, status: 'draft', created_by: '赵六', reviewed_by: null,
      created_at: '2025-05-25T16:00:00', updated_at: '2025-05-25T16:00:00',
    },
    {
      id: uuid(), request_no: 'CG20250601001', customer_name: approvedQ2.customer_name,
      qualification_id: approvedQ2.id, qualification_status: 'approved',
      total_amount: 6800, status: 'pending_review', created_by: '李四', reviewed_by: null,
      created_at: '2025-06-01T09:00:00', updated_at: '2025-06-01T09:00:00',
    },
  ]

  const purchaseItems: Array<{
    id: string; purchase_id: string; product_name: string;
    specification: string; quantity: number; unit_price: number;
  }> = [
    {
      id: uuid(), purchase_id: purchases[0].id, product_name: '树脂充填材料',
      specification: '3M Z350 XT 4g', quantity: 20, unit_price: 280,
    },
    {
      id: uuid(), purchase_id: purchases[0].id, product_name: '玻璃离子水门汀',
      specification: 'GC Fuji IX GP 15g', quantity: 10, unit_price: 180,
    },
    {
      id: uuid(), purchase_id: purchases[0].id, product_name: '光固化灯',
      specification: 'LED-B 1200mW', quantity: 5, unit_price: 1680,
    },
    {
      id: uuid(), purchase_id: purchases[1].id, product_name: '根管治疗器械包',
      specification: '标准套装 6支/包', quantity: 15, unit_price: 420,
    },
    {
      id: uuid(), purchase_id: purchases[1].id, product_name: '牙科印模材料',
      specification: '硅橡胶 50ml×2', quantity: 30, unit_price: 360,
    },
    {
      id: uuid(), purchase_id: purchases[1].id, product_name: '超声洁牙机头',
      specification: 'G1 通用型', quantity: 8, unit_price: 380,
    },
    {
      id: uuid(), purchase_id: purchases[2].id, product_name: '树脂充填材料',
      specification: '3M Z350 XT 4g', quantity: 10, unit_price: 280,
    },
    {
      id: uuid(), purchase_id: purchases[2].id, product_name: '玻璃离子水门汀',
      specification: 'GC Fuji IX GP 15g', quantity: 15, unit_price: 180,
    },
    {
      id: uuid(), purchase_id: purchases[2].id, product_name: '根管治疗器械包',
      specification: '标准套装 6支/包', quantity: 5, unit_price: 420,
    },
    {
      id: uuid(), purchase_id: purchases[3].id, product_name: '牙科印模材料',
      specification: '硅橡胶 50ml×2', quantity: 20, unit_price: 360,
    },
    {
      id: uuid(), purchase_id: purchases[3].id, product_name: '光固化灯',
      specification: 'LED-B 1200mW', quantity: 3, unit_price: 1680,
    },
    {
      id: uuid(), purchase_id: purchases[4].id, product_name: '超声洁牙机头',
      specification: 'G1 通用型', quantity: 10, unit_price: 380,
    },
    {
      id: uuid(), purchase_id: purchases[4].id, product_name: '树脂充填材料',
      specification: '3M Z350 XT 4g', quantity: 5, unit_price: 280,
    },
    {
      id: uuid(), purchase_id: purchases[5].id, product_name: '根管治疗器械包',
      specification: '标准套装 6支/包', quantity: 25, unit_price: 420,
    },
    {
      id: uuid(), purchase_id: purchases[5].id, product_name: '牙科印模材料',
      specification: '硅橡胶 50ml×2', quantity: 40, unit_price: 360,
    },
    {
      id: uuid(), purchase_id: purchases[5].id, product_name: '玻璃离子水门汀',
      specification: 'GC Fuji IX GP 15g', quantity: 20, unit_price: 180,
    },
    {
      id: uuid(), purchase_id: purchases[5].id, product_name: '光固化灯',
      specification: 'LED-B 1200mW', quantity: 8, unit_price: 1680,
    },
    {
      id: uuid(), purchase_id: purchases[6].id, product_name: '超声洁牙机头',
      specification: 'G1 通用型', quantity: 4, unit_price: 380,
    },
    {
      id: uuid(), purchase_id: purchases[6].id, product_name: '树脂充填材料',
      specification: '3M Z350 XT 4g', quantity: 10, unit_price: 280,
    },
  ]

  const insertPurchase = db.prepare(`
    INSERT INTO purchases (id, request_no, customer_name, qualification_id, qualification_status, total_amount, status, created_by, reviewed_by, created_at, updated_at)
    VALUES (@id, @request_no, @customer_name, @qualification_id, @qualification_status, @total_amount, @status, @created_by, @reviewed_by, @created_at, @updated_at)
  `)

  const insertItem = db.prepare(`
    INSERT INTO purchase_items (id, purchase_id, product_name, specification, quantity, unit_price)
    VALUES (@id, @purchase_id, @product_name, @specification, @quantity, @unit_price)
  `)

  const insertFlowLog = db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (@id, @purchase_id, @action, @operator, @role, @note, @created_at)
  `)

  for (const p of purchases) {
    insertPurchase.run(p)

    insertFlowLog.run({
      id: uuid(), purchase_id: p.id, action: 'create', operator: p.created_by,
      role: 'sales_clerk', note: '创建采购申请', created_at: p.created_at,
    })

    if (p.status !== 'draft') {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'submit', operator: p.created_by,
        role: 'sales_clerk', note: '提交采购申请', created_at: p.created_at,
      })
    }

    if (['approved', 'confirmed_out', 'shipped', 'completed'].includes(p.status)) {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'approve', operator: p.reviewed_by!,
        role: 'director', note: '审核通过', created_at: p.updated_at,
      })
    }

    if (['confirmed_out', 'shipped', 'completed'].includes(p.status)) {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'confirm_out', operator: '孙八',
        role: 'warehouse', note: '确认出库', created_at: p.updated_at,
      })
    }

    if (['shipped', 'completed'].includes(p.status)) {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'ship', operator: '孙八',
        role: 'after_sales', note: '已发货', created_at: p.updated_at,
      })
    }

    if (p.status === 'completed') {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'complete', operator: '孙八',
        role: 'after_sales', note: '客户已签收，订单完成', created_at: p.updated_at,
      })
    }

    if (p.qualification_status === 'expiring_soon') {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'qualification_warning', operator: '系统',
        role: 'director', note: '关联资质即将到期，请提醒客户续期', created_at: p.created_at,
      })
    }

    if (p.qualification_status === 'pending') {
      insertFlowLog.run({
        id: uuid(), purchase_id: p.id, action: 'qualification_info', operator: '系统',
        role: 'director', note: '关联资质尚未审核', created_at: p.created_at,
      })
    }
  }

  for (const item of purchaseItems) {
    insertItem.run(item)
  }

  console.log('Seed data inserted successfully')
}
