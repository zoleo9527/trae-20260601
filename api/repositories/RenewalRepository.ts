import { run, get, all } from '../database/database.js'
import { RenewalFollowUp, ContactMethod } from '../types/types.js'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function rowToRenewalFollowUp(row: Record<string, unknown>): RenewalFollowUp {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    userId: row.user_id as string,
    contactDate: new Date(row.contact_date as string),
    contactMethod: row.contact_method as ContactMethod,
    content: row.content as string,
    result: row.result as string | null,
    nextFollowUpDate: row.next_follow_up_date ? new Date(row.next_follow_up_date as string) : null,
    attachments: JSON.parse(row.attachments as string || '[]'),
    createdAt: new Date(row.created_at as string),
  }
}

export interface RenewalFilter {
  customerId?: string
  userId?: string
}

export interface RenewalPagination {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function create(data: Omit<RenewalFollowUp, 'id' | 'createdAt'>): Promise<RenewalFollowUp> {
  const id = generateId()
  const now = new Date().toISOString()

  await run(
    `INSERT INTO renewal_follow_ups (
      id, customer_id, user_id, contact_date, contact_method,
      content, result, next_follow_up_date, attachments, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.customerId, data.userId,
      data.contactDate.toISOString().split('T')[0],
      data.contactMethod, data.content, data.result,
      data.nextFollowUpDate ? data.nextFollowUpDate.toISOString().split('T')[0] : null,
      JSON.stringify(data.attachments), now
    ]
  )

  return findById(id) as Promise<RenewalFollowUp>
}

export async function findById(id: string): Promise<RenewalFollowUp | null> {
  const row = await get<Record<string, unknown>>('SELECT * FROM renewal_follow_ups WHERE id = ?', [id])
  return row ? rowToRenewalFollowUp(row) : null
}

export async function findByCustomerId(customerId: string): Promise<RenewalFollowUp[]> {
  const rows = await all<Record<string, unknown>>(
    'SELECT * FROM renewal_follow_ups WHERE customer_id = ? ORDER BY contact_date DESC',
    [customerId]
  )
  return rows.map(rowToRenewalFollowUp)
}

export async function findAll(): Promise<RenewalFollowUp[]> {
  const rows = await all<Record<string, unknown>>('SELECT * FROM renewal_follow_ups ORDER BY contact_date DESC')
  return rows.map(rowToRenewalFollowUp)
}

export async function findWithFilter(filter: RenewalFilter, pagination: RenewalPagination): Promise<{ items: RenewalFollowUp[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.customerId) {
    conditions.push('customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.userId) {
    conditions.push('user_id = ?')
    params.push(filter.userId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = await get<{ count: number }>(`SELECT COUNT(*) as count FROM renewal_follow_ups ${whereClause}`, params)
  const total = countRow?.count || 0

  const sortBy = pagination.sortBy || 'contact_date'
  const sortOrder = pagination.sortOrder || 'desc'
  const offset = (pagination.page - 1) * pagination.pageSize

  const rows = await all<Record<string, unknown>>(
    `SELECT * FROM renewal_follow_ups ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, pagination.pageSize, offset]
  )

  return {
    items: rows.map(rowToRenewalFollowUp),
    total
  }
}

export async function remove(id: string): Promise<boolean> {
  const result = await run('DELETE FROM renewal_follow_ups WHERE id = ?', [id])
  return result.changes > 0
}

export async function countByCustomer(customerId: string): Promise<number> {
  const row = await get<{ count: number }>(
    'SELECT COUNT(*) as count FROM renewal_follow_ups WHERE customer_id = ?',
    [customerId]
  )
  return row?.count || 0
}

export async function findLatestByCustomer(customerId: string): Promise<RenewalFollowUp | null> {
  const row = await get<Record<string, unknown>>(
    'SELECT * FROM renewal_follow_ups WHERE customer_id = ? ORDER BY contact_date DESC LIMIT 1',
    [customerId]
  )
  return row ? rowToRenewalFollowUp(row) : null
}