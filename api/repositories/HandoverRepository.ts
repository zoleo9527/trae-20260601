import { run, get, all } from '../database/database.js'
import { Handover, HandoverStatus, PendingItems, CustomerHabits, InvoiceDetails, NextDeclaration, Customer, SafeUser, CustomerStatus, RiskLevel, UserRole } from '../types/types.js'

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
    fromUser: row.from_user_name ? {
      id: row.from_user_id as string,
      username: row.from_user_username as string,
      name: row.from_user_name as string,
      role: row.from_user_role as UserRole,
      email: row.from_user_email as string | null,
      phone: row.from_user_phone as string | null,
      status: row.from_user_status as 'active' | 'inactive',
      createdAt: new Date(row.from_user_created_at as string),
      updatedAt: new Date(row.from_user_updated_at as string),
    } : undefined,
    toUser: row.to_user_name ? {
      id: row.to_user_id as string,
      username: row.to_user_username as string,
      name: row.to_user_name as string,
      role: row.to_user_role as UserRole,
      email: row.to_user_email as string | null,
      phone: row.to_user_phone as string | null,
      status: row.to_user_status as 'active' | 'inactive',
      createdAt: new Date(row.to_user_created_at as string),
      updatedAt: new Date(row.to_user_updated_at as string),
    } : undefined,
    reviewer: row.reviewer_name ? {
      id: row.reviewer_id as string,
      username: row.reviewer_username as string,
      name: row.reviewer_name as string,
      role: row.reviewer_role as UserRole,
      email: row.reviewer_email as string | null,
      phone: row.reviewer_phone as string | null,
      status: row.reviewer_status as 'active' | 'inactive',
      createdAt: new Date(row.reviewer_created_at as string),
      updatedAt: new Date(row.reviewer_updated_at as string),
    } : undefined,
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
  const row = await get<Record<string, unknown>>(`
    SELECT 
      h.*,
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
      fu.username as from_user_username,
      fu.name as from_user_name,
      fu.role as from_user_role,
      fu.email as from_user_email,
      fu.phone as from_user_phone,
      fu.status as from_user_status,
      fu.created_at as from_user_created_at,
      fu.updated_at as from_user_updated_at,
      tu.username as to_user_username,
      tu.name as to_user_name,
      tu.role as to_user_role,
      tu.email as to_user_email,
      tu.phone as to_user_phone,
      tu.status as to_user_status,
      tu.created_at as to_user_created_at,
      tu.updated_at as to_user_updated_at,
      r.username as reviewer_username,
      r.name as reviewer_name,
      r.role as reviewer_role,
      r.email as reviewer_email,
      r.phone as reviewer_phone,
      r.status as reviewer_status,
      r.created_at as reviewer_created_at,
      r.updated_at as reviewer_updated_at
    FROM handovers h
    LEFT JOIN customers c ON h.customer_id = c.id
    LEFT JOIN users fu ON h.from_user_id = fu.id
    LEFT JOIN users tu ON h.to_user_id = tu.id
    LEFT JOIN users r ON h.reviewer_id = r.id
    WHERE h.id = ?
  `, [id])
  return row ? rowToHandover(row) : null
}

export async function findByCustomerId(customerId: string): Promise<Handover[]> {
  const rows = await all<Record<string, unknown>>(`
    SELECT 
      h.*,
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
      fu.username as from_user_username,
      fu.name as from_user_name,
      fu.role as from_user_role,
      fu.email as from_user_email,
      fu.phone as from_user_phone,
      fu.status as from_user_status,
      fu.created_at as from_user_created_at,
      fu.updated_at as from_user_updated_at,
      tu.username as to_user_username,
      tu.name as to_user_name,
      tu.role as to_user_role,
      tu.email as to_user_email,
      tu.phone as to_user_phone,
      tu.status as to_user_status,
      tu.created_at as to_user_created_at,
      tu.updated_at as to_user_updated_at,
      r.username as reviewer_username,
      r.name as reviewer_name,
      r.role as reviewer_role,
      r.email as reviewer_email,
      r.phone as reviewer_phone,
      r.status as reviewer_status,
      r.created_at as reviewer_created_at,
      r.updated_at as reviewer_updated_at
    FROM handovers h
    LEFT JOIN customers c ON h.customer_id = c.id
    LEFT JOIN users fu ON h.from_user_id = fu.id
    LEFT JOIN users tu ON h.to_user_id = tu.id
    LEFT JOIN users r ON h.reviewer_id = r.id
    WHERE h.customer_id = ?
    ORDER BY h.created_at DESC
  `, [customerId])
  return rows.map(rowToHandover)
}

export async function findAll(): Promise<Handover[]> {
  const rows = await all<Record<string, unknown>>(`
    SELECT 
      h.*,
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
      fu.username as from_user_username,
      fu.name as from_user_name,
      fu.role as from_user_role,
      fu.email as from_user_email,
      fu.phone as from_user_phone,
      fu.status as from_user_status,
      fu.created_at as from_user_created_at,
      fu.updated_at as from_user_updated_at,
      tu.username as to_user_username,
      tu.name as to_user_name,
      tu.role as to_user_role,
      tu.email as to_user_email,
      tu.phone as to_user_phone,
      tu.status as to_user_status,
      tu.created_at as to_user_created_at,
      tu.updated_at as to_user_updated_at,
      r.username as reviewer_username,
      r.name as reviewer_name,
      r.role as reviewer_role,
      r.email as reviewer_email,
      r.phone as reviewer_phone,
      r.status as reviewer_status,
      r.created_at as reviewer_created_at,
      r.updated_at as reviewer_updated_at
    FROM handovers h
    LEFT JOIN customers c ON h.customer_id = c.id
    LEFT JOIN users fu ON h.from_user_id = fu.id
    LEFT JOIN users tu ON h.to_user_id = tu.id
    LEFT JOIN users r ON h.reviewer_id = r.id
    ORDER BY h.created_at DESC
  `)
  return rows.map(rowToHandover)
}

export async function findWithFilter(filter: HandoverFilter, pagination: HandoverPagination): Promise<{ items: Handover[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.customerId) {
    conditions.push('h.customer_id = ?')
    params.push(filter.customerId)
  }
  if (filter.fromUserId) {
    conditions.push('h.from_user_id = ?')
    params.push(filter.fromUserId)
  }
  if (filter.toUserId) {
    conditions.push('h.to_user_id = ?')
    params.push(filter.toUserId)
  }
  if (filter.status) {
    conditions.push('h.status = ?')
    params.push(filter.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = await get<{ count: number }>(`SELECT COUNT(*) as count FROM handovers h ${whereClause}`, params)
  const total = countRow?.count || 0

  const sortBy = pagination.sortBy || 'h.created_at'
  const sortOrder = pagination.sortOrder || 'desc'
  const offset = (pagination.page - 1) * pagination.pageSize

  const rows = await all<Record<string, unknown>>(
    `
    SELECT 
      h.*,
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
      fu.username as from_user_username,
      fu.name as from_user_name,
      fu.role as from_user_role,
      fu.email as from_user_email,
      fu.phone as from_user_phone,
      fu.status as from_user_status,
      fu.created_at as from_user_created_at,
      fu.updated_at as from_user_updated_at,
      tu.username as to_user_username,
      tu.name as to_user_name,
      tu.role as to_user_role,
      tu.email as to_user_email,
      tu.phone as to_user_phone,
      tu.status as to_user_status,
      tu.created_at as to_user_created_at,
      tu.updated_at as to_user_updated_at,
      r.username as reviewer_username,
      r.name as reviewer_name,
      r.role as reviewer_role,
      r.email as reviewer_email,
      r.phone as reviewer_phone,
      r.status as reviewer_status,
      r.created_at as reviewer_created_at,
      r.updated_at as reviewer_updated_at
    FROM handovers h
    LEFT JOIN customers c ON h.customer_id = c.id
    LEFT JOIN users fu ON h.from_user_id = fu.id
    LEFT JOIN users tu ON h.to_user_id = tu.id
    LEFT JOIN users r ON h.reviewer_id = r.id
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
    `,
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