import { type Request, type Response } from 'express'
import * as CustomerService from '../services/CustomerService.js'
import * as HandoverService from '../services/HandoverService.js'
import { ApiResponse, CustomerStatus, RiskLevel, PaginatedResponse, Customer } from '../types/types.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getAllCustomers(req: Request, res: Response): Promise<void> {
  const customers = await CustomerService.getAllCustomers()

  const response: ApiResponse<typeof customers> = {
    success: true,
    data: customers
  }

  res.json(response)
}

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const customer = await CustomerService.getCustomerById(id)

  if (!customer) {
    throw new AppError('Customer not found', 404)
  }

  const response: ApiResponse<typeof customer> = {
    success: true,
    data: customer
  }

  res.json(response)
}

export async function getCustomersWithFilter(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const sortBy = req.query.sortBy as string
  const sortOrder = req.query.sortOrder as 'asc' | 'desc'

  const filter = {
    status: req.query.status as CustomerStatus | undefined,
    riskLevel: req.query.riskLevel as RiskLevel | undefined,
    accountantId: req.query.accountantId as string | undefined,
    managerId: req.query.managerId as string | undefined,
    search: req.query.search as string | undefined
  }

  const result = await CustomerService.getCustomersWithFilter(filter, {
    page,
    pageSize,
    sortBy,
    sortOrder
  })

  const response: ApiResponse<PaginatedResponse<Customer>> = {
    success: true,
    data: result
  }

  res.json(response)
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const data = req.body

  if (!data.name) {
    throw new AppError('Customer name is required', 400)
  }

  try {
    const customer = await CustomerService.createCustomer(data)

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
      message: 'Customer created successfully'
    }

    res.status(201).json(response)
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const data = req.body

  try {
    const customer = await CustomerService.updateCustomer(id, data)

    if (!customer) {
      throw new AppError('Customer not found', 404)
    }

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    }

    res.json(response)
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const success = await CustomerService.deleteCustomer(id)

  if (!success) {
    throw new AppError('Customer not found', 404)
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'Customer deleted successfully'
  }

  res.json(response)
}

export async function getCustomerHandovers(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const customer = await CustomerService.getCustomerById(id)
  if (!customer) {
    throw new AppError('Customer not found', 404)
  }

  const handovers = await HandoverService.getHandoversByCustomerId(id)

  const response: ApiResponse<typeof handovers> = {
    success: true,
    data: handovers
  }

  res.json(response)
}