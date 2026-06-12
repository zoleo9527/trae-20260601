import { run, get, all } from '../database/database.js'
import { Handover, HandoverStatus, PendingItems, CustomerHabits, InvoiceDetails, NextDeclaration } from '../types/types.js'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function rowToHandover(row: Record<string, unknown>): Handover {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    fromUserId: row.from_user_id as string,
    toUserId: row.to_user_id as string,
    fromUserRole: row.from_user_role as 'accountant' | 'manager',
    pendingItems: JSON.parse(row.pending_items as string || '{}') as PendingItems,
    customerHabits: JSON.parse(row.customer_habits as string || '{}') as CustomerHabits,
    invoiceDetails: JSON.parse(row.invoice_details as string || '{}') as InvoiceDetails,
    nextDeclaration: JSON.parse(row.next_declaration as string || '{}') as NextDeclaration,
    status: row.status as HandoverStatus,
    reviewComment: row.review_comment as string | null,
    reviewerId: row.reviewer_id as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
  }
}

export interface HandoverFilter {
  customerId?: string
  fromUserId?: string
  toUserId?: string
  status?: HandoverStatus
}

export interface HandoverPagination {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function create(data: Omit<Handover, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<Handover> {
  const id = generateId()
  const now = new Date().toISOString()

  await run(
    `INSERT INTO handovers (
      id, customer_id, from_user_id, to_user_id, from_user_role,
      pending_items, customer_habits, invoice_details, next_declaration,
      status, review_comment, reviewer_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.customerId, data.fromUserId, data.toUserId, data.fromUserRole,
      JSON.stringify(data.pendingItems), JSON.stringify(data.customerHabits),
      JSON.stringify(data.invoiceDetails), JSON.stringify(data.nextDeclaration),
      data.status, data.reviewComment, data.reviewerId, now, now
    ]
  )

  return findById(id) as Promise<Handover>
}

export async function findById(id: string): Promise<Handover | null> {
  const row = await get<Record<string, unknown>>('SELECT * FROM handovers WHERE id = ?', [id])
  return row ? rowToHandover(row) : null
}

export async function findByCustomerId(customerId: string): Promise<Handover[]> {
  const rows = await all<Record<string, unknown>>(
    'SELECT * FROM handovers WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  )
  return rows.map(rowToHandover)
}

export async function findAll(): Promise<Handover[]> {
  const rows = await all<Record<string, unknown>>('SELECT * FROM handovers ORDER BY created_at DESC')
  return rows.map(rowToHandover)
}

export async function findWithFilter(filter: HandoverFilter, pagination: HandoverPagination): Promise<{ items: Handover[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.customerId) {
    conditions.push('customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.fromUserId) {
    conditions.push('from_user_id = ?')
    params.push(filter.fromUserId)
  }
  if (filter.toUserId) {
    conditions.push('to_user_id = ?')
    params.push(filter.toUserId)
  }
  if (filter.status) {
    conditions.push('status = ?')
    params.push(filter.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = await get<{ count: number }>(`SELECT COUNT(*) as count FROM handovers ${whereClause}`, params)
  const total = countRow?.count || 0

  const sortBy = pagination.sortBy || 'created_at'
  const sortOrder = pagination.sortOrder || 'desc'
  const offset = (pagination.page - 1) * pagination.pageSize

  const rows = await all<Record<string, unknown>>(
    `SELECT * FROM handovers ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, pagination.pageSize, offset]
  )

  return {
    items: rows.map(rowToHandover),
    total
  }
}

export async function update(id: string, data: Partial<Omit<Handover, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Handover | null> {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.customerId !== undefined) {
    fields.push('customer_id = ?')
    values.push(data.customerId)
  }
  if (data.fromUserId !== undefined) {
    fields.push('from_user_id = ?')
    values.push(data.fromUserId)
  }
  if (data.toUserId !== undefined) {
    fields.push('to_user_id = ?')
    values.push(data.toUserId)
  }
  if (data.fromUserRole !== undefined) {
    fields.push('from_user_role = ?')
    values.push(data.fromUserRole)
  }
  if (data.pendingItems !== undefined) {
    fields.push('pending_items = ?')
    values.push(JSON.stringify(data.pendingItems))
  }
  if (data.customerHabits !== undefined) {
    fields.push('customer_habits = ?')
    values.push(JSON.stringify(data.customerHabits))
  }
  if (data.invoiceDetails !== undefined) {
    fields.push('invoice_details = ?')
    values.push(JSON.stringify(data.invoiceDetails))
  }
  if (data.nextDeclaration !== undefined) {
    fields.push('next_declaration = ?')
    values.push(JSON.stringify(data.nextDeclaration))
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }
  if (data.reviewComment !== undefined) {
    fields.push('review_comment = ?')
    values.push(data.reviewComment)
  }
  if (data.reviewerId !== undefined) {
    fields.push('reviewer_id = ?')
    values.push(data.reviewerId)
  }
  if (data.completedAt !== undefined) {
    fields.push('completed_at = ?')
    values.push(data.completedAt ? data.completedAt.toISOString() : null)
  }

  if (fields.length === 0) {
    return findById(id)
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await run(`UPDATE handovers SET ${fields.join(', ')} WHERE id = ?`, values)
  return findById(id)
}

export async function remove(id: string): Promise<boolean> {
  const result = await run('DELETE FROM handovers WHERE id = ?', [id])
  return result.changes > 0
}

export async function countByStatus(): Promise<Record<HandoverStatus, number>> {
  const rows = await all<{ status: HandoverStatus; count: number }>(
    'SELECT status, COUNT(*) as count FROM handovers GROUP BY status'
  )
  const result: Record<HandoverStatus, number> = {
    [HandoverStatus.DRAFT]: 0,
    [HandoverStatus.PENDING]: 0,
    [HandoverStatus.APPROVED]: 0,
    [HandoverStatus.REJECTED]: 0,
  }
  for (const row of rows) {
    result[row.status] = row.count
  }
  return result
}

export async function countTotal(): Promise<number> {
  const row = await get<{ count: number }>('SELECT COUNT(*) as count FROM handovers')
  return row?.count || 0
}