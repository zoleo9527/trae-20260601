import { type Request, type Response } from 'express'
import * as RenewalService from '../services/RenewalService.js'
import * as CustomerService from '../services/CustomerService.js'
import { ApiResponse, CustomerStatus, PaginatedResponse, RenewalFollowUp, Customer } from '../types/types.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getAllFollowUps(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10

  const filter = {
    customerId: req.query.customerId as string | undefined,
    userId: req.query.userId as string | undefined
  }

  const result = await RenewalService.getFollowUpsWithFilter(filter, {
    page,
    pageSize,
    sortBy: 'contact_date',
    sortOrder: 'desc'
  })

  const response: ApiResponse<PaginatedResponse<RenewalFollowUp>> = {
    success: true,
    data: result
  }

  res.json(response)
}

export async function getAlertCustomers(req: Request, res: Response): Promise<void> {
  const days = parseInt(req.query.days as string) || 30

  const customers = await RenewalService.getAlertCustomers(days)

  const response: ApiResponse<typeof customers> = {
    success: true,
    data: customers
  }

  res.json(response)
}

export async function getRiskCustomers(req: Request, res: Response): Promise<void> {
  const customers = await RenewalService.getRiskCustomers()

  const response: ApiResponse<typeof customers> = {
    success: true,
    data: customers
  }

  res.json(response)
}

export async function createFollowUp(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { customerId } = req.params
  const data = req.body

  if (!data.contactDate || !data.contactMethod || !data.content) {
    throw new AppError('Missing required fields', 400)
  }

  try {
    const followUp = await RenewalService.createFollowUp(req.user.userId, {
      customerId,
      ...data
    })

    const response: ApiResponse<typeof followUp> = {
      success: true,
      data: followUp,
      message: 'Follow-up created successfully'
    }

    res.status(201).json(response)
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function updateRenewalStatus(req: Request, res: Response): Promise<void> {
  const { customerId } = req.params
  const { status } = req.body

  if (!status || !Object.values(CustomerStatus).includes(status)) {
    throw new AppError('Invalid status', 400)
  }

  try {
    const customer = await RenewalService.updateRenewalStatus(customerId, status)

    if (!customer) {
      throw new AppError('Customer not found', 404)
    }

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
      message: 'Renewal status updated successfully'
    }

    res.json(response)
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function getFollowUpsByCustomer(req: Request, res: Response): Promise<void> {
  const { customerId } = req.params

  const customer = await CustomerService.getCustomerById(customerId)
  if (!customer) {
    throw new AppError('Customer not found', 404)
  }

  const followUps = await RenewalService.getFollowUpsByCustomerId(customerId)

  const response: ApiResponse<typeof followUps> = {
    success: true,
    data: followUps
  }

  res.json(response)
}