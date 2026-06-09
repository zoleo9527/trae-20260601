import { getDB } from '../db.js'
import type { BatchIssue, ProcessBatchIssueRequest } from '../../shared/types.js'
import {
  transitionOrderToPendingReview,
  transitionOrderToClosed,
  transitionOrderToCompleted,
} from './outbound.js'

interface BatchIssueRow {
  id: string; order_id: string; item_id: string; abnormal_type: string;
  abnormal_note: string; process_status: string; process_result: string | null;
  process_note: string | null; processed_by: string | null; processed_at: string | null;
  created_at: string; order_no: string; consumableName: string; batchNo: string;
}

interface ItemRow {
  id: string; consumable_name: string; batch_no: string;
}

function mapBatchIssue(r: BatchIssueRow): BatchIssue {
  return {
    id: r.id, orderId: r.order_id, orderNo: r.order_no, itemId: r.item_id,
    consumableName: r.consumableName, batchNo: r.batchNo,
    abnormalType: r.abnormal_type as BatchIssue['abnormalType'],
    abnormalNote: r.abnormal_note,
    processStatus: r.process_status as BatchIssue['processStatus'],
    processResult: r.process_result as BatchIssue['processResult'],
    processNote: r.process_note, processedBy: r.processed_by, processedAt: r.processed_at,
    createdAt: r.created_at,
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function checkIdempotency(key: string): { statusCode: number; body: string } | null {
  const db = getDB()
  const row = db.prepare('SELECT response_body, status_code FROM idempotency_keys WHERE key = ?').get(key) as { response_body: string; status_code: number } | undefined
  if (row) {
    return { statusCode: row.status_code, body: row.response_body }
  }
  return null
}

function storeIdempotency(key: string, statusCode: number, body: string): void {
  const db = getDB()
  db.prepare('INSERT INTO idempotency_keys (key, response_body, status_code, created_at) VALUES (?, ?, ?, datetime(\'now\'))').run(key, body, statusCode)
}

export function listBatchIssues(processStatus?: string): BatchIssue[] {
  const db = getDB()
  if (processStatus) {
    const rows = db.prepare(
      'SELECT bi.*, o.order_no, bi.item_id, bi.abnormal_type, bi.abnormal_note, bi.process_status, bi.process_result, bi.process_note, bi.processed_by, bi.processed_at, bi.created_at, (SELECT consumable_name FROM outbound_items WHERE id = bi.item_id) as consumableName, (SELECT batch_no FROM outbound_items WHERE id = bi.item_id) as batchNo FROM batch_issues bi JOIN outbound_orders o ON bi.order_id = o.id WHERE bi.process_status = ? ORDER BY bi.created_at DESC'
    ).all(processStatus) as BatchIssueRow[]
    return rows.map(mapBatchIssue)
  }
  const rows = db.prepare(
    'SELECT bi.*, o.order_no, (SELECT consumable_name FROM outbound_items WHERE id = bi.item_id) as consumableName, (SELECT batch_no FROM outbound_items WHERE id = bi.item_id) as batchNo FROM batch_issues bi JOIN outbound_orders o ON bi.order_id = o.id ORDER BY bi.created_at DESC'
  ).all() as BatchIssueRow[]
  return rows.map(mapBatchIssue)
}

export function getBatchIssueDetail(id: string): {
  issue: BatchIssue;
  order: { id: string; orderNo: string; customerName: string; status: string } | null;
} | null {
  const db = getDB()
  const row = db.prepare(
    'SELECT bi.*, o.order_no, (SELECT consumable_name FROM outbound_items WHERE id = bi.item_id) as consumableName, (SELECT batch_no FROM outbound_items WHERE id = bi.item_id) as batchNo FROM batch_issues bi JOIN outbound_orders o ON bi.order_id = o.id WHERE bi.id = ?'
  ).get(id) as BatchIssueRow | undefined
  if (!row) return null

  const issue = mapBatchIssue(row)

  const orderRow = db.prepare(
    'SELECT id, order_no, customer_name, status FROM outbound_orders WHERE id = ?'
  ).get(row.order_id) as { id: string; order_no: string; customer_name: string; status: string } | undefined

  return {
    issue,
    order: orderRow ? { id: orderRow.id, orderNo: orderRow.order_no, customerName: orderRow.customer_name, status: orderRow.status } : null,
  }
}

export function processBatchIssue(issueId: string, req: ProcessBatchIssueRequest): BatchIssue {
  const db = getDB()

  const cached = checkIdempotency(req.idempotencyKey)
  if (cached) {
    return JSON.parse(cached.body)
  }

  const issueRow = db.prepare(
    'SELECT bi.*, o.order_no, (SELECT consumable_name FROM outbound_items WHERE id = bi.item_id) as consumableName, (SELECT batch_no FROM outbound_items WHERE id = bi.item_id) as batchNo FROM batch_issues bi JOIN outbound_orders o ON bi.order_id = o.id WHERE bi.id = ?'
  ).get(issueId) as BatchIssueRow | undefined

  if (!issueRow) throw new Error('批号异常工单不存在')
  if (issueRow.process_status === 'processed') throw new Error('该异常工单已处理，不可重复处理')

  const issue = mapBatchIssue(issueRow)
  const now = new Date().toISOString()

  const transaction = db.transaction(() => {
    db.prepare(
      'UPDATE batch_issues SET process_status = ?, process_result = ?, process_note = ?, processed_by = ?, processed_at = ? WHERE id = ?'
    ).run('processed', req.processResult, req.processNote, req.processedBy, now, issueId)

    if (req.processResult === 'exchange') {
      const itemRow = db.prepare('SELECT * FROM outbound_items WHERE id = ?').get(issue.itemId) as ItemRow | undefined
      if (itemRow) {
        db.prepare(
          'UPDATE outbound_items SET review_status = ?, abnormal_type = ?, abnormal_note = ?, batch_no = ?, expiry_date = ? WHERE id = ?'
        ).run('pending', null, null, req.newBatchNo ?? itemRow.batch_no, req.newExpiryDate ?? '', issue.itemId)
      }
    }

    const processResultLabel: Record<string, string> = {
      exchange: '换货',
      return: '退货',
      special_approval: '特批放行',
    }

    const detailParts: string[] = [
      `售后${req.processedBy}处理异常：${issue.consumableName}(${issue.batchNo})`,
      `${abnormalTypeLabel(issue.abnormalType)}→${processResultLabel[req.processResult]}处理`,
    ]
    if (req.processResult === 'exchange' && req.newBatchNo) {
      detailParts.push(`新批号：${req.newBatchNo}`)
    }
    if (req.processNote) {
      detailParts.push(`备注：${req.processNote}`)
    }

    db.prepare(
      'INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(generateId('tl'), issue.orderId, 'process_issue', req.processedBy, '售后', detailParts.join('，'), now)

    const allIssueRows = db.prepare('SELECT * FROM batch_issues WHERE order_id = ?').all(issue.orderId) as { id: string; process_status: string; process_result: string | null }[]
    const allProcessed = allIssueRows.every((i) => i.process_status === 'processed')

    if (allProcessed) {
      const allReturn = allIssueRows.every((i) => i.process_result === 'return')
      const allSpecialApproval = allIssueRows.every((i) => i.process_result === 'special_approval')
      const hasExchange = allIssueRows.some((i) => i.process_result === 'exchange')

      if (allReturn) {
        transitionOrderToClosed(issue.orderId)
        db.prepare(
          'INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(generateId('tl'), issue.orderId, 'issue_processed', req.processedBy, '售后', '所有异常均退货处理，出库单已关闭', now)
      } else if (hasExchange) {
        transitionOrderToPendingReview(issue.orderId)
        db.prepare(
          'INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(generateId('tl'), issue.orderId, 'issue_processed', req.processedBy, '售后', '换货处理完成，出库单重新进入待复核状态', now)
      } else if (allSpecialApproval) {
        transitionOrderToCompleted(issue.orderId)
        db.prepare(
          'INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(generateId('tl'), issue.orderId, 'issue_processed', req.processedBy, '售后', '所有异常经特批放行，出库单已完成', now)
      } else {
        transitionOrderToCompleted(issue.orderId)
        db.prepare(
          'INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(generateId('tl'), issue.orderId, 'issue_processed', req.processedBy, '售后', '所有异常已处理完成，出库单状态更新为已完成', now)
      }
    }
  })

  transaction()

  const updatedRow = db.prepare(
    'SELECT bi.*, o.order_no, (SELECT consumable_name FROM outbound_items WHERE id = bi.item_id) as consumableName, (SELECT batch_no FROM outbound_items WHERE id = bi.item_id) as batchNo FROM batch_issues bi JOIN outbound_orders o ON bi.order_id = o.id WHERE bi.id = ?'
  ).get(issueId) as BatchIssueRow

  const result = mapBatchIssue(updatedRow)
  storeIdempotency(req.idempotencyKey, 200, JSON.stringify(result))
  return result
}

function abnormalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    batch_error: '批号错误',
    near_expiry: '临期',
    expired: '已过期',
    qual_expired: '资质过期',
  }
  return labels[type] ?? type
}
