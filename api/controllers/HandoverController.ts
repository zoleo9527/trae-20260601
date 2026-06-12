import { type Request, type Response } from 'express'
import * as HandoverService from '../services/HandoverService.js'
import { ApiResponse, HandoverStatus, PaginatedResponse, Handover } from '../types/types.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getAllHandovers(req: Request, res: Response): Promise<void> {
  const handovers = await HandoverService.getAllHandovers()

  const response: ApiResponse<typeof handovers> = {
    success: true,
    data: handovers
  }

  res.json(response)
}

export async function getHandoverById(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const handover = await HandoverService.getHandoverById(id)

  if (!handover) {
    throw new AppError('Handover not found', 404)
  }

  const response: ApiResponse<typeof handover> = {
    success: true,
    data: handover
  }

  res.json(response)
}

export async function getHandoversWithFilter(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const sortBy = req.query.sortBy as string
  const sortOrder = req.query.sortOrder as 'asc' | 'desc'

  const filter = {
    customerId: req.query.customerId as string | undefined,
    fromUserId: req.query.fromUserId as string | undefined,
    toUserId: req.query.toUserId as string | undefined,
    status: req.query.status as HandoverStatus | undefined
  }

  const result = await HandoverService.getHandoversWithFilter(filter, {
    page,
    pageSize,
    sortBy,
    sortOrder
  })

  const response: ApiResponse<PaginatedResponse<Handover>> = {
    success: true,
    data: result
  }

  res.json(response)
}

export async function createHandover(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const data = req.body

  if (!data.customerId || !data.toUserId || !data.fromUserRole) {
    throw new AppError('Missing required fields', 400)
  }

  try {
    const handover = await HandoverService.createHandover(req.user.userId, data)

    const response: ApiResponse<typeof handover> = {
      success: true,
      data: handover,
      message: 'Handover created successfully'
    }

    res.status(201).json(response)
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function updateHandover(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = req.params
  const data = req.body

  try {
    const handover = await HandoverService.updateHandover(id, req.user.userId, data)

    if (!handover) {
      throw new AppError('Handover not found', 404)
    }

    const response: ApiResponse<typeof handover> = {
      success: true,
      data: handover,
      message: 'Handover updated successfully'
    }

    res.json(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('authorized')) {
        throw new AppError(error.message, 403)
      }
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function approveHandover(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = req.params
  const { comment } = req.body

  try {
    const handover = await HandoverService.approveHandover(id, req.user.userId, comment)

    if (!handover) {
      throw new AppError('Handover not found', 404)
    }

    const response: ApiResponse<typeof handover> = {
      success: true,
      data: handover,
      message: 'Handover approved successfully'
    }

    res.json(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('pending')) {
        throw new AppError(error.message, 400)
      }
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function rejectHandover(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = req.params
  const { comment } = req.body

  if (!comment) {
    throw new AppError('Rejection comment is required', 400)
  }

  try {
    const handover = await HandoverService.rejectHandover(id, req.user.userId, comment)

    if (!handover) {
      throw new AppError('Handover not found', 404)
    }

    const response: ApiResponse<typeof handover> = {
      success: true,
      data: handover,
      message: 'Handover rejected'
    }

    res.json(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('pending')) {
        throw new AppError(error.message, 400)
      }
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function deleteHandover(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const success = await HandoverService.deleteHandover(id)

  if (!success) {
    throw new AppError('Handover not found', 404)
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'Handover deleted successfully'
  }

  res.json(response)
}