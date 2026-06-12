import { run, get, all } from '../database/database.js'
import { Customer, CustomerStatus, RiskLevel } from '../types/types.js'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function rowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    contactPerson: row.contact_person as string | null,
    phone: row.phone as string | null,
    email: row.email as string | null,
    address: row.address as string | null,
    taxNumber: row.tax_number as string | null,
    contractStartDate: row.contract_start_date ? new Date(row.contract_start_date as string) : null,
    contractEndDate: row.contract_end_date ? new Date(row.contract_end_date as string) : null,
    status: row.status as CustomerStatus,
    riskLevel: row.risk_level as RiskLevel,
    riskReasons: JSON.parse(row.risk_reasons as string || '[]'),
    accountantId: row.accountant_id as string | null,
    managerId: row.manager_id as string | null,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export interface CustomerFilter {
  status?: CustomerStatus
  riskLevel?: RiskLevel
  accountantId?: string
  managerId?: string
  search?: string
}

export interface CustomerPagination {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const id = generateId()
  const now = new Date().toISOString()

  await run(
    `INSERT INTO customers (
      id, name, contact_person, phone, email, address, tax_number,
      contract_start_date, contract_end_date, status, risk_level, risk_reasons,
      accountant_id, manager_id, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.name, data.contactPerson, data.phone, data.email, data.address, data.taxNumber,
      data.contractStartDate ? data.contractStartDate.toISOString().split('T')[0] : null,
      data.contractEndDate ? data.contractEndDate.toISOString().split('T')[0] : null,
      data.status, data.riskLevel, JSON.stringify(data.riskReasons),
      data.accountantId, data.managerId, data.notes, now, now
    ]
  )

  return findById(id) as Promise<Customer>
}

export async function findById(id: string): Promise<Customer | null> {
  const row = await get<Record<string, unknown>>('SELECT * FROM customers WHERE id = ?', [id])
  return row ? rowToCustomer(row) : null
}

export async function findAll(): Promise<Customer[]> {
  const rows = await all<Record<string, unknown>>('SELECT * FROM customers ORDER BY created_at DESC')
  return rows.map(rowToCustomer)
}

export async function findWithFilter(filter: CustomerFilter, pagination: CustomerPagination): Promise<{ items: Customer[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.status) {
    conditions.push('status = ?')
    params.push(filter.status)
  }
  if (filter.riskLevel) {
    conditions.push('risk_level = ?')
    params.push(filter.riskLevel)
  }
  if (filter.accountantId) {
    conditions.push('accountant_id = ?')
    params.push(filter.accountantId)
  }
  if (filter.managerId) {
    conditions.push('manager_id = ?')
    params.push(filter.managerId)
  }
  if (filter.search) {
    conditions.push('(name LIKE ? OR contact_person LIKE ? OR phone LIKE ?)')
    const searchPattern = `%${filter.search}%`
    params.push(searchPattern, searchPattern, searchPattern)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = await get<{ count: number }>(`SELECT COUNT(*) as count FROM customers ${whereClause}`, params)
  const total = countRow?.count || 0

  const sortBy = pagination.sortBy || 'created_at'
  const sortOrder = pagination.sortOrder || 'desc'
  const offset = (pagination.page - 1) * pagination.pageSize

  const rows = await all<Record<string, unknown>>(
    `SELECT * FROM customers ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, pagination.pageSize, offset]
  )

  return {
    items: rows.map(rowToCustomer),
    total
  }
}

export async function update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer | null> {
  const fields: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.contactPerson !== undefined) {
    fields.push('contact_person = ?')
    values.push(data.contactPerson)
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?')
    values.push(data.phone)
  }
  if (data.email !== undefined) {
    fields.push('email = ?')
    values.push(data.email)
  }
  if (data.address !== undefined) {
    fields.push('address = ?')
    values.push(data.address)
  }
  if (data.taxNumber !== undefined) {
    fields.push('tax_number = ?')
    values.push(data.taxNumber)
  }
  if (data.contractStartDate !== undefined) {
    fields.push('contract_start_date = ?')
    values.push(data.contractStartDate ? data.contractStartDate.toISOString().split('T')[0] : null)
  }
  if (data.contractEndDate !== undefined) {
    fields.push('contract_end_date = ?')
    values.push(data.contractEndDate ? data.contractEndDate.toISOString().split('T')[0] : null)
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }
  if (data.riskLevel !== undefined) {
    fields.push('risk_level = ?')
    values.push(data.riskLevel)
  }
  if (data.riskReasons !== undefined) {
    fields.push('risk_reasons = ?')
    values.push(JSON.stringify(data.riskReasons))
  }
  if (data.accountantId !== undefined) {
    fields.push('accountant_id = ?')
    values.push(data.accountantId)
  }
  if (data.managerId !== undefined) {
    fields.push('manager_id = ?')
    values.push(data.managerId)
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?')
    values.push(data.notes)
  }

  if (fields.length === 0) {
    return findById(id)
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await run(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values)
  return findById(id)
}

export async function remove(id: string): Promise<boolean> {
  const result = await run('DELETE FROM customers WHERE id = ?', [id])
  return result.changes > 0
}

export async function countByStatus(): Promise<Record<CustomerStatus, number>> {
  const rows = await all<{ status: CustomerStatus; count: number }>(
    'SELECT status, COUNT(*) as count FROM customers GROUP BY status'
  )
  const result: Record<CustomerStatus, number> = {
    [CustomerStatus.ACTIVE]: 0,
    [CustomerStatus.EXPIRING]: 0,
    [CustomerStatus.EXPIRED]: 0,
    [CustomerStatus.SUSPENDED]: 0,
  }
  for (const row of rows) {
    result[row.status] = row.count
  }
  return result
}

export async function countByRiskLevel(): Promise<Record<RiskLevel, number>> {
  const rows = await all<{ risk_level: RiskLevel; count: number }>(
    'SELECT risk_level, COUNT(*) as count FROM customers GROUP BY risk_level'
  )
  const result: Record<RiskLevel, number> = {
    [RiskLevel.HIGH]: 0,
    [RiskLevel.MEDIUM]: 0,
    [RiskLevel.LOW]: 0,
    [RiskLevel.NONE]: 0,
  }
  for (const row of rows) {
    result[row.risk_level] = row.count
  }
  return result
}

export async function countTotal(): Promise<number> {
  const row = await get<{ count: number }>('SELECT COUNT(*) as count FROM customers')
  return row?.count || 0
}

export async function findExpiringSoon(days: number): Promise<Customer[]> {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + days)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  const rows = await all<Record<string, unknown>>(
    `SELECT * FROM customers 
     WHERE contract_end_date <= ? 
     AND contract_end_date >= date('now')
     AND status IN ('active', 'expiring')
     ORDER BY contract_end_date ASC`,
    [targetDateStr]
  )
  return rows.map(rowToCustomer)
}

export async function findExpired(): Promise<Customer[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT * FROM customers 
     WHERE contract_end_date < date('now')
     AND status != 'expired'
     ORDER BY contract_end_date DESC`
  )
  return rows.map(rowToCustomer)
}