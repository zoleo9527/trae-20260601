import * as HandoverRepository from '../repositories/HandoverRepository.js'
import * as CustomerRepository from '../repositories/CustomerRepository.js'
import * as UserRepository from '../repositories/UserRepository.js'
import { Handover, HandoverStatus, CreateHandoverRequest, UpdateHandoverRequest, PaginatedResponse } from '../types/types.js'

export async function getAllHandovers(): Promise<Handover[]> {
  return HandoverRepository.findAll()
}

export async function getHandoverById(id: string): Promise<Handover | null> {
  return HandoverRepository.findById(id)
}

export async function getHandoversByCustomerId(customerId: string): Promise<Handover[]> {
  return HandoverRepository.findByCustomerId(customerId)
}

export async function getHandoversWithFilter(
  filter: HandoverRepository.HandoverFilter,
  pagination: HandoverRepository.HandoverPagination
): Promise<PaginatedResponse<Handover>> {
  const { items, total } = await HandoverRepository.findWithFilter(filter, pagination)
  const totalPages = Math.ceil(total / pagination.pageSize)

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages
  }
}

export async function createHandover(userId: string, data: CreateHandoverRequest): Promise<Handover> {
  const customer = await CustomerRepository.findById(data.customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  const toUser = await UserRepository.findById(data.toUserId)
  if (!toUser) {
    throw new Error('Target user not found')
  }

  const handover = await HandoverRepository.create({
    customerId: data.customerId,
    fromUserId: userId,
    toUserId: data.toUserId,
    fromUserRole: data.fromUserRole,
    pendingItems: data.pendingItems,
    customerHabits: data.customerHabits,
    invoiceDetails: data.invoiceDetails,
    nextDeclaration: data.nextDeclaration,
    status: HandoverStatus.PENDING,
    reviewComment: null,
    reviewerId: null
  })

  return handover
}

export async function updateHandover(id: string, userId: string, data: UpdateHandoverRequest): Promise<Handover | null> {
  const existingHandover = await HandoverRepository.findById(id)
  if (!existingHandover) {
    return null
  }

  if (existingHandover.fromUserId !== userId && existingHandover.toUserId !== userId) {
    throw new Error('You are not authorized to update this handover')
  }

  const updateData: Partial<Handover> = {}

  if (data.toUserId !== undefined) {
    const toUser = await UserRepository.findById(data.toUserId)
    if (!toUser) {
      throw new Error('Target user not found')
    }
    updateData.toUserId = data.toUserId
  }
  if (data.fromUserRole !== undefined) updateData.fromUserRole = data.fromUserRole
  if (data.pendingItems !== undefined) updateData.pendingItems = data.pendingItems
  if (data.customerHabits !== undefined) updateData.customerHabits = data.customerHabits
  if (data.invoiceDetails !== undefined) updateData.invoiceDetails = data.invoiceDetails
  if (data.nextDeclaration !== undefined) updateData.nextDeclaration = data.nextDeclaration

  return HandoverRepository.update(id, updateData)
}

export async function approveHandover(id: string, reviewerId: string, comment?: string): Promise<Handover | null> {
  const existingHandover = await HandoverRepository.findById(id)
  if (!existingHandover) {
    return null
  }

  if (existingHandover.status !== HandoverStatus.PENDING) {
    throw new Error('Only pending handovers can be approved')
  }

  const reviewer = await UserRepository.findById(reviewerId)
  if (!reviewer) {
    throw new Error('Reviewer not found')
  }

  const handover = await HandoverRepository.update(id, {
    status: HandoverStatus.APPROVED,
    reviewComment: comment || 'Approved',
    reviewerId,
    completedAt: new Date()
  })

  if (handover) {
    const customer = await CustomerRepository.findById(handover.customerId)
    if (customer) {
      if (handover.fromUserRole === 'accountant') {
        await CustomerRepository.update(handover.customerId, { accountantId: handover.toUserId })
      } else {
        await CustomerRepository.update(handover.customerId, { managerId: handover.toUserId })
      }
    }
  }

  return handover
}

export async function rejectHandover(id: string, reviewerId: string, comment: string): Promise<Handover | null> {
  const existingHandover = await HandoverRepository.findById(id)
  if (!existingHandover) {
    return null
  }

  if (existingHandover.status !== HandoverStatus.PENDING) {
    throw new Error('Only pending handovers can be rejected')
  }

  const reviewer = await UserRepository.findById(reviewerId)
  if (!reviewer) {
    throw new Error('Reviewer not found')
  }

  return HandoverRepository.update(id, {
    status: HandoverStatus.REJECTED,
    reviewComment: comment,
    reviewerId
  })
}

export async function deleteHandover(id: string): Promise<boolean> {
  return HandoverRepository.remove(id)
}

export async function getHandoverStats(): Promise<{
  total: number
  byStatus: Record<HandoverStatus, number>
}> {
  const total = await HandoverRepository.countTotal()
  const byStatus = await HandoverRepository.countByStatus()

  return { total, byStatus }
}