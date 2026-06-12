import * as CustomerRepository from '../repositories/CustomerRepository.js'
import * as UserRepository from '../repositories/UserRepository.js'
import { Customer, CustomerStatus, RiskLevel, CreateCustomerRequest, UpdateCustomerRequest, PaginatedResponse } from '../types/types.js'

export async function getAllCustomers(): Promise<Customer[]> {
  return CustomerRepository.findAll()
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return CustomerRepository.findById(id)
}

export async function getCustomersWithFilter(
  filter: CustomerRepository.CustomerFilter,
  pagination: CustomerRepository.CustomerPagination
): Promise<PaginatedResponse<Customer>> {
  const { items, total } = await CustomerRepository.findWithFilter(filter, pagination)
  const totalPages = Math.ceil(total / pagination.pageSize)

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages
  }
}

export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  if (data.accountantId) {
    const accountant = await UserRepository.findById(data.accountantId)
    if (!accountant) {
      throw new Error('Accountant not found')
    }
  }

  if (data.managerId) {
    const manager = await UserRepository.findById(data.managerId)
    if (!manager) {
      throw new Error('Manager not found')
    }
  }

  const customer = await CustomerRepository.create({
    name: data.name,
    contactPerson: data.contactPerson || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    taxNumber: data.taxNumber || null,
    contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
    contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
    status: data.status || CustomerStatus.ACTIVE,
    riskLevel: data.riskLevel || RiskLevel.NONE,
    riskReasons: data.riskReasons || [],
    accountantId: data.accountantId || null,
    managerId: data.managerId || null,
    notes: data.notes || null
  })

  return customer
}

export async function updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer | null> {
  const existingCustomer = await CustomerRepository.findById(id)
  if (!existingCustomer) {
    return null
  }

  if (data.accountantId) {
    const accountant = await UserRepository.findById(data.accountantId)
    if (!accountant) {
      throw new Error('Accountant not found')
    }
  }

  if (data.managerId) {
    const manager = await UserRepository.findById(data.managerId)
    if (!manager) {
      throw new Error('Manager not found')
    }
  }

  const updateData: Partial<Customer> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson || null
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.address !== undefined) updateData.address = data.address || null
  if (data.taxNumber !== undefined) updateData.taxNumber = data.taxNumber || null
  if (data.contractStartDate !== undefined) updateData.contractStartDate = data.contractStartDate ? new Date(data.contractStartDate) : null
  if (data.contractEndDate !== undefined) updateData.contractEndDate = data.contractEndDate ? new Date(data.contractEndDate) : null
  if (data.status !== undefined) updateData.status = data.status
  if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel
  if (data.riskReasons !== undefined) updateData.riskReasons = data.riskReasons
  if (data.accountantId !== undefined) updateData.accountantId = data.accountantId || null
  if (data.managerId !== undefined) updateData.managerId = data.managerId || null
  if (data.notes !== undefined) updateData.notes = data.notes || null

  return CustomerRepository.update(id, updateData)
}

export async function deleteCustomer(id: string): Promise<boolean> {
  return CustomerRepository.remove(id)
}

export async function getCustomerStats(): Promise<{
  total: number
  byStatus: Record<CustomerStatus, number>
  byRiskLevel: Record<RiskLevel, number>
}> {
  const total = await CustomerRepository.countTotal()
  const byStatus = await CustomerRepository.countByStatus()
  const byRiskLevel = await CustomerRepository.countByRiskLevel()

  return { total, byStatus, byRiskLevel }
}

export async function getExpiringCustomers(days: number = 30): Promise<Customer[]> {
  return CustomerRepository.findExpiringSoon(days)
}

export async function getExpiredCustomers(): Promise<Customer[]> {
  return CustomerRepository.findExpired()
}