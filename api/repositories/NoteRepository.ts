import { all, get, run } from '../database/database.js'
import { CustomerStatus, Note, NoteType, RiskLevel, UserRole } from '../types/types.js'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    userId: row.user_id as string,
    type: row.type as NoteType,
    title: row.title as string,
    content: row.content as string,
    attachments: JSON.parse(row.attachments as string || '[]'),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    customer: row.customer_name ? {
      id: row.customer_id as string,
      name: row.customer_name as string,
      contactPerson: row.customer_contact_person as string | null,
      phone: row.customer_phone as string | null,
      email: row.customer_email as string | null,
      address: row.customer_address as string | null,
      taxNumber: row.customer_tax_number as string | null,
      contractStartDate: row.customer_contract_start_date ? new Date(row.customer_contract_start_date as string) : null,
      contractEndDate: row.customer_contract_end_date ? new Date(row.customer_contract_end_date as string) : null,
      status: row.customer_status as CustomerStatus,
      riskLevel: row.customer_risk_level as RiskLevel,
      riskReasons: JSON.parse(row.customer_risk_reasons as string || '[]'),
      accountantId: row.customer_accountant_id as string | null,
      managerId: row.customer_manager_id as string | null,
      notes: row.customer_notes as string | null,
      createdAt: new Date(row.customer_created_at as string),
      updatedAt: new Date(row.customer_updated_at as string),
    } : undefined,
    user: row.user_name ? {
      id: row.user_id as string,
      username: row.user_username as string,
      name: row.user_name as string,
      role: row.user_role as UserRole,
      email: row.user_email as string | null,
      phone: row.user_phone as string | null,
      status: row.user_status as 'active' | 'inactive',
      createdAt: new Date(row.user_created_at as string),
      updatedAt: new Date(row.user_updated_at as string),
    } : undefined,
  }
}

export interface NoteFilter {
  customerId?: string
  userId?: string
  type?: NoteType
  search?: string
}

export interface NotePagination {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function create(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const id = generateId()
  const now = new Date().toISOString()

  await run(
    `INSERT INTO notes (
      id, customer_id, user_id, type, title, content, attachments, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.customerId, data.userId, data.type, data.title, data.content, JSON.stringify(data.attachments), now, now]
  )

  return findById(id) as Promise<Note>
}

export async function findById(id: string): Promise<Note | null> {
  const row = await get<Record<string, unknown>>('SELECT * FROM notes WHERE id = ?', [id])
  return row ? rowToNote(row) : null
}

export async function findByCustomerId(customerId: string): Promise<Note[]> {
  const rows = await all<Record<string, unknown>>(`
    SELECT 
      n.*,
      c.name as customer_name,
      c.contact_person as customer_contact_person,
      c.phone as customer_phone,
      c.email as customer_email,
      c.address as customer_address,
      c.tax_number as customer_tax_number,
      c.contract_start_date as customer_contract_start_date,
      c.contract_end_date as customer_contract_end_date,
      c.status as customer_status,
      c.risk_level as customer_risk_level,
      c.risk_reasons as customer_risk_reasons,
      c.accountant_id as customer_accountant_id,
      c.manager_id as customer_manager_id,
      c.notes as customer_notes,
      c.created_at as customer_created_at,
      c.updated_at as customer_updated_at,
      u.username as user_username,
      u.name as user_name,
      u.role as user_role,
      u.email as user_email,
      u.phone as user_phone,
      u.status as user_status,
      u.created_at as user_created_at,
      u.updated_at as user_updated_at
    FROM notes n
    LEFT JOIN customers c ON n.customer_id = c.id
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.customer_id = ?
    ORDER BY n.created_at DESC
  `, [customerId])
  return rows.map(rowToNote)
}

export async function findAll(): Promise<Note[]> {
  const rows = await all<Record<string, unknown>>(`
    SELECT 
      n.*,
      c.name as customer_name,
      c.contact_person as customer_contact_person,
      c.phone as customer_phone,
      c.email as customer_email,
      c.address as customer_address,
      c.tax_number as customer_tax_number,
      c.contract_start_date as customer_contract_start_date,
      c.contract_end_date as customer_contract_end_date,
      c.status as customer_status,
      c.risk_level as customer_risk_level,
      c.risk_reasons as customer_risk_reasons,
      c.accountant_id as customer_accountant_id,
      c.manager_id as customer_manager_id,
      c.notes as customer_notes,
      c.created_at as customer_created_at,
      c.updated_at as customer_updated_at,
      u.username as user_username,
      u.name as user_name,
      u.role as user_role,
      u.email as user_email,
      u.phone as user_phone,
      u.status as user_status,
      u.created_at as user_created_at,
      u.updated_at as user_updated_at
    FROM notes n
    LEFT JOIN customers c ON n.customer_id = c.id
    LEFT JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC
  `)
  return rows.map(rowToNote)
}

export async function findWithFilter(filter: NoteFilter, pagination: NotePagination): Promise<{ items: Note[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.customerId) {
    conditions.push('n.customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.userId) {
    conditions.push('n.user_id = ?')
    params.push(filter.userId)
  }
  if (filter.type) {
    conditions.push('n.type = ?')
    params.push(filter.type)
  }
  if (filter.search) {
    conditions.push('(n.title LIKE ? OR n.content LIKE ?)')
    const searchPattern = `%${filter.search}%`
    params.push(searchPattern, searchPattern)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = await get<{ count: number }>(`SELECT COUNT(*) as count FROM notes n ${whereClause}`, params)
  const total = countRow?.count || 0

  const sortBy = pagination.sortBy || 'n.created_at'
  const sortOrder = pagination.sortOrder || 'desc'
  const offset = (pagination.page - 1) * pagination.pageSize

  const rows = await all<Record<string, unknown>>(
    `
    SELECT 
      n.*,
      c.name as customer_name,
      c.contact_person as customer_contact_person,
      c.phone as customer_phone,
      c.email as customer_email,
      c.address as customer_address,
      c.tax_number as customer_tax_number,
      c.contract_start_date as customer_contract_start_date,
      c.contract_end_date as customer_contract_end_date,
      c.status as customer_status,
      c.risk_level as customer_risk_level,
      c.risk_reasons as customer_risk_reasons,
      c.accountant_id as customer_accountant_id,
      c.manager_id as customer_manager_id,
      c.notes as customer_notes,
      c.created_at as customer_created_at,
      c.updated_at as customer_updated_at,
      u.username as user_username,
      u.name as user_name,
      u.role as user_role,
      u.email as user_email,
      u.phone as user_phone,
      u.status as user_status,
      u.created_at as user_created_at,
      u.updated_at as user_updated_at
    FROM notes n
    LEFT JOIN customers c ON n.customer_id = c.id
    LEFT JOIN users u ON n.user_id = u.id
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
    `,
    [...params, pagination.pageSize, offset]
  )

  return {
    items: rows.map(rowToNote),
    total
  }
}

export async function update(id: string, data: Partial<Omit<Note, 'id' | 'customerId' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Note | null> {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.type !== undefined) {
    fields.push('type = ?')
    values.push(data.type)
  }
  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }
  if (data.content !== undefined) {
    fields.push('content = ?')
    values.push(data.content)
  }
  if (data.attachments !== undefined) {
    fields.push('attachments = ?')
    values.push(JSON.stringify(data.attachments))
  }

  if (fields.length === 0) {
    return findById(id)
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values)
  return findById(id)
}

export async function remove(id: string): Promise<boolean> {
  const result = await run('DELETE FROM notes WHERE id = ?', [id])
  return result.changes > 0
}

export async function countByCustomer(customerId: string): Promise<number> {
  const row = await get<{ count: number }>(
    'SELECT COUNT(*) as count FROM notes WHERE customer_id = ?',
    [customerId]
  )
  return row?.count || 0
}

export async function countByType(): Promise<Record<NoteType, number>> {
  const rows = await all<{ type: NoteType; count: number }>(
    'SELECT type, COUNT(*) as count FROM notes GROUP BY type'
  )
  const result: Record<NoteType, number> = {
    [NoteType.GENERAL]: 0,
    [NoteType.HANDOVER]: 0,
    [NoteType.RENEWAL]: 0,
    [NoteType.ISSUE]: 0,
  }
  for (const row of rows) {
    result[row.type] = row.count
  }
  return result
}