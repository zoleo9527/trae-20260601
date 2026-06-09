import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { getSession } from './session.js'
import type { Role, Qualification, Purchase } from '../types.js'

interface WorkspaceEntry {
  key: string
  label: string
  description: string
  path: string
  count: number
  items: Array<{
    id: string
    title: string
    subtitle: string
    status: string
    statusLabel: string
    path: string
    urgent?: boolean
  }>
}

interface WorkspaceData {
  role: Role
  roleName: string
  greeting: string
  entries: WorkspaceEntry[]
}

const ROLE_NAMES: Record<Role, string> = {
  sales_clerk: '张三',
  warehouse: '孙八',
  after_sales: '赵六',
  director: '王五',
}

const QUAL_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  expiring_soon: '即将到期',
  expired: '已过期',
}

const PURCHASE_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已审核',
  rejected: '已驳回',
  confirmed_out: '已出库',
  shipped: '已发货',
  completed: '已完成',
}

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const session = getSession()
  const role = session.role

  const entries: WorkspaceEntry[] = []

  if (role === 'sales_clerk') {
    const pendingQuals = db.prepare(
      "SELECT * FROM qualifications WHERE submitted_by = ? AND status IN ('pending', 'rejected') ORDER BY updated_at DESC LIMIT 5"
    ).all(session.name) as Qualification[]

    const expiringQuals = db.prepare(
      "SELECT * FROM qualifications WHERE submitted_by = ? AND status = 'expiring_soon' ORDER BY expire_date ASC LIMIT 5"
    ).all(session.name) as Qualification[]

    const draftPurchases = db.prepare(
      "SELECT * FROM purchases WHERE created_by = ? AND status = 'draft' ORDER BY updated_at DESC LIMIT 5"
    ).all(session.name) as Purchase[]

    const pendingReviewPurchases = db.prepare(
      "SELECT * FROM purchases WHERE created_by = ? AND status = 'pending_review' ORDER BY updated_at DESC LIMIT 5"
    ).all(session.name) as Purchase[]

    const rejectedPurchases = db.prepare(
      "SELECT * FROM purchases WHERE created_by = ? AND status = 'rejected' ORDER BY updated_at DESC LIMIT 5"
    ).all(session.name) as Purchase[]

    const pendingQualCount = (db.prepare(
      "SELECT COUNT(*) as c FROM qualifications WHERE submitted_by = ? AND status IN ('pending', 'rejected')"
    ).get(session.name) as { c: number }).c

    const expiringQualCount = (db.prepare(
      "SELECT COUNT(*) as c FROM qualifications WHERE submitted_by = ? AND status = 'expiring_soon'"
    ).get(session.name) as { c: number }).c

    const draftPurchaseCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE created_by = ? AND status = 'draft'"
    ).get(session.name) as { c: number }).c

    const pendingReviewPurchaseCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE created_by = ? AND status = 'pending_review'"
    ).get(session.name) as { c: number }).c

    const rejectedPurchaseCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE created_by = ? AND status = 'rejected'"
    ).get(session.name) as { c: number }).c

    entries.push({
      key: 'pending_quals',
      label: '待处理资质',
      description: '需要补充或重新提交的客户资质',
      path: '/qualifications?status=pending',
      count: pendingQualCount + expiringQualCount,
      items: [
        ...pendingQuals.map(q => ({
          id: q.id,
          title: q.customer_name,
          subtitle: `${q.license_type} · ${q.license_no}`,
          status: q.status,
          statusLabel: QUAL_STATUS_LABELS[q.status] || q.status,
          path: `/qualifications/${q.id}`,
          urgent: q.status === 'rejected',
        })),
        ...expiringQuals.map(q => ({
          id: q.id,
          title: q.customer_name,
          subtitle: `${q.license_type} · 到期 ${q.expire_date}`,
          status: q.status,
          statusLabel: QUAL_STATUS_LABELS[q.status] || q.status,
          path: `/qualifications/${q.id}`,
          urgent: true,
        })),
      ],
    })

    entries.push({
      key: 'draft_purchases',
      label: '草稿采购单',
      description: '尚未提交的采购申请',
      path: '/purchases?status=draft',
      count: draftPurchaseCount,
      items: draftPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
      })),
    })

    entries.push({
      key: 'pending_purchases',
      label: '审核中采购',
      description: '已提交等待主管审批',
      path: '/purchases?status=pending_review',
      count: pendingReviewPurchaseCount,
      items: pendingReviewPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
      })),
    })

    entries.push({
      key: 'rejected_purchases',
      label: '被驳回采购',
      description: '需要修改后重新提交',
      path: '/purchases?status=rejected',
      count: rejectedPurchaseCount,
      items: rejectedPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
        urgent: true,
      })),
    })
  }

  if (role === 'warehouse') {
    const approvedPurchases = db.prepare(
      "SELECT * FROM purchases WHERE status = 'approved' ORDER BY updated_at ASC LIMIT 10"
    ).all() as Purchase[]

    const confirmedOutPurchases = db.prepare(
      "SELECT * FROM purchases WHERE status = 'confirmed_out' ORDER BY updated_at ASC LIMIT 10"
    ).all() as Purchase[]

    const approvedCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE status = 'approved'"
    ).get() as { c: number }).c

    const confirmedOutCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE status = 'confirmed_out'"
    ).get() as { c: number }).c

    entries.push({
      key: 'to_confirm_out',
      label: '待出库',
      description: '主管已审核，等待确认出库',
      path: '/purchases?status=approved',
      count: approvedCount,
      items: approvedPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
        urgent: true,
      })),
    })

    entries.push({
      key: 'to_ship',
      label: '待发货',
      description: '已确认出库，等待发货',
      path: '/purchases?status=confirmed_out',
      count: confirmedOutCount,
      items: confirmedOutPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
      })),
    })
  }

  if (role === 'after_sales') {
    const shippedPurchases = db.prepare(
      "SELECT * FROM purchases WHERE status = 'shipped' ORDER BY updated_at ASC LIMIT 10"
    ).all() as Purchase[]

    const shippedCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE status = 'shipped'"
    ).get() as { c: number }).c

    const qualExpiringPurchases = db.prepare(`
      SELECT p.* FROM purchases p
      JOIN qualifications q ON p.qualification_id = q.id
      WHERE q.status = 'expiring_soon' AND p.status NOT IN ('completed')
      ORDER BY q.expire_date ASC LIMIT 5
    `).all() as Purchase[]

    entries.push({
      key: 'to_complete',
      label: '待签收确认',
      description: '已发货，等待客户签收确认',
      path: '/purchases?status=shipped',
      count: shippedCount,
      items: shippedPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
      })),
    })

    entries.push({
      key: 'qual_expiring',
      label: '资质即将到期',
      description: '关联采购单的客户资质即将到期',
      path: '/purchases',
      count: qualExpiringPurchases.length,
      items: qualExpiringPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name}`,
        status: p.qualification_status,
        statusLabel: QUAL_STATUS_LABELS[p.qualification_status] || p.qualification_status,
        path: `/purchases/${p.id}`,
        urgent: true,
      })),
    })
  }

  if (role === 'director') {
    const pendingQuals = db.prepare(
      "SELECT * FROM qualifications WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5"
    ).all() as Qualification[]

    const expiringQuals = db.prepare(
      "SELECT * FROM qualifications WHERE status = 'expiring_soon' ORDER BY expire_date ASC LIMIT 5"
    ).all() as Qualification[]

    const expiredQuals = db.prepare(
      "SELECT * FROM qualifications WHERE status = 'expired' ORDER BY expire_date ASC LIMIT 5"
    ).all() as Qualification[]

    const pendingReviewPurchases = db.prepare(
      "SELECT * FROM purchases WHERE status = 'pending_review' ORDER BY created_at ASC LIMIT 10"
    ).all() as Purchase[]

    const qualExpiringPurchases = db.prepare(`
      SELECT p.* FROM purchases p
      JOIN qualifications q ON p.qualification_id = q.id
      WHERE q.status = 'expiring_soon' AND p.status NOT IN ('completed')
      ORDER BY q.expire_date ASC LIMIT 5
    `).all() as Purchase[]

    const pendingQualCount = (db.prepare(
      "SELECT COUNT(*) as c FROM qualifications WHERE status = 'pending'"
    ).get() as { c: number }).c

    const expiringQualCount = (db.prepare(
      "SELECT COUNT(*) as c FROM qualifications WHERE status = 'expiring_soon'"
    ).get() as { c: number }).c

    const expiredQualCount = (db.prepare(
      "SELECT COUNT(*) as c FROM qualifications WHERE status = 'expired'"
    ).get() as { c: number }).c

    const pendingReviewPurchaseCount = (db.prepare(
      "SELECT COUNT(*) as c FROM purchases WHERE status = 'pending_review'"
    ).get() as { c: number }).c

    const qualExpiringPurchaseCount = (db.prepare(`
      SELECT COUNT(*) as c FROM purchases p
      JOIN qualifications q ON p.qualification_id = q.id
      WHERE q.status = 'expiring_soon' AND p.status NOT IN ('completed')
    `).get() as { c: number }).c

    entries.push({
      key: 'pending_quals',
      label: '待审核资质',
      description: '需要审批的客户资质申请',
      path: '/qualifications?status=pending',
      count: pendingQualCount,
      items: pendingQuals.map(q => ({
        id: q.id,
        title: q.customer_name,
        subtitle: `${q.license_type} · 提交人: ${q.submitted_by}`,
        status: q.status,
        statusLabel: QUAL_STATUS_LABELS[q.status] || q.status,
        path: `/qualifications/${q.id}`,
        urgent: true,
      })),
    })

    entries.push({
      key: 'pending_purchases',
      label: '待审批采购',
      description: '需要审批的采购申请',
      path: '/purchases?status=pending_review',
      count: pendingReviewPurchaseCount,
      items: pendingReviewPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · ¥${p.total_amount.toLocaleString()} · ${p.created_by}`,
        status: p.status,
        statusLabel: PURCHASE_STATUS_LABELS[p.status] || p.status,
        path: `/purchases/${p.id}`,
        urgent: true,
      })),
    })

    entries.push({
      key: 'expiring_quals',
      label: '资质到期预警',
      description: '即将到期或已过期的客户资质',
      path: '/qualifications?status=expiring_soon',
      count: expiringQualCount + expiredQualCount,
      items: [
        ...expiringQuals.map(q => ({
          id: q.id,
          title: q.customer_name,
          subtitle: `${q.license_type} · 到期 ${q.expire_date}`,
          status: q.status,
          statusLabel: QUAL_STATUS_LABELS[q.status] || q.status,
          path: `/qualifications/${q.id}`,
          urgent: true,
        })),
        ...expiredQuals.map(q => ({
          id: q.id,
          title: q.customer_name,
          subtitle: `${q.license_type} · 已过期 ${q.expire_date}`,
          status: q.status,
          statusLabel: QUAL_STATUS_LABELS[q.status] || q.status,
          path: `/qualifications/${q.id}`,
          urgent: true,
        })),
      ],
    })

    entries.push({
      key: 'qual_expiring_purchases',
      label: '采购关联资质风险',
      description: '关联资质即将到期的采购单',
      path: '/purchases',
      count: qualExpiringPurchaseCount,
      items: qualExpiringPurchases.map(p => ({
        id: p.id,
        title: p.request_no,
        subtitle: `${p.customer_name} · 资质即将到期`,
        status: p.qualification_status,
        statusLabel: QUAL_STATUS_LABELS[p.qualification_status] || p.qualification_status,
        path: `/purchases/${p.id}`,
        urgent: true,
      })),
    })
  }

  const greetings: Record<Role, string> = {
    sales_clerk: '管理客户资质，创建采购申请',
    warehouse: '处理采购单出库与发货',
    after_sales: '跟踪发货与签收确认',
    director: '审批资质与采购，追踪进度',
  }

  const data: WorkspaceData = {
    role,
    roleName: ROLE_NAMES[role],
    greeting: greetings[role],
    entries,
  }

  res.json({ success: true, data })
})

export default router
