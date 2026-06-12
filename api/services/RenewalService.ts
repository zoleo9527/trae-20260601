import * as RenewalRepository from '../repositories/RenewalRepository.js'
import * as CustomerRepository from '../repositories/CustomerRepository.js'
import * as UserRepository from '../repositories/UserRepository.js'
import { RenewalFollowUp, CreateFollowUpRequest, PaginatedResponse, Customer, RiskLevel, CustomerStatus } from '../types/types.js'

export async function getAllFollowUps(): Promise<RenewalFollowUp[]> {
  return RenewalRepository.findAll()
}

export async function getFollowUpById(id: string): Promise<RenewalFollowUp | null> {
  return RenewalRepository.findById(id)
}

export async function getFollowUpsByCustomerId(customerId: string): Promise<RenewalFollowUp[]> {
  return RenewalRepository.findByCustomerId(customerId)
}

export async function getFollowUpsWithFilter(
  filter: RenewalRepository.RenewalFilter,
  pagination: RenewalRepository.RenewalPagination
): Promise<PaginatedResponse<RenewalFollowUp>> {
  const { items, total } = await RenewalRepository.findWithFilter(filter, pagination)
  const totalPages = Math.ceil(total / pagination.pageSize)

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages
  }
}

export async function createFollowUp(userId: string, data: CreateFollowUpRequest): Promise<RenewalFollowUp> {
  const customer = await CustomerRepository.findById(data.customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  const user = await UserRepository.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const followUp = await RenewalRepository.create({
    customerId: data.customerId,
    userId,
    contactDate: new Date(data.contactDate),
    contactMethod: data.contactMethod,
    content: data.content,
    result: data.result || null,
    nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
    attachments: data.attachments || []
  })

  return followUp
}

export async function deleteFollowUp(id: string): Promise<boolean> {
  return RenewalRepository.remove(id)
}

export async function getAlertCustomers(days: number = 30): Promise<Customer[]> {
  return CustomerRepository.findExpiringSoon(days)
}

export async function getRiskCustomers(): Promise<Customer[]> {
  const allCustomers = await CustomerRepository.findAll()
  return allCustomers.filter(c => c.riskLevel === RiskLevel.HIGH || c.riskLevel === RiskLevel.MEDIUM)
}

export async function updateRenewalStatus(customerId: string, status: CustomerStatus): Promise<Customer | null> {
  const customer = await CustomerRepository.findById(customerId)
  if (!customer) {
    return null
  }

  return CustomerRepository.update(customerId, { status })
}

export async function getLatestFollowUp(customerId: string): Promise<RenewalFollowUp | null> {
  return RenewalRepository.findLatestByCustomer(customerId)
}