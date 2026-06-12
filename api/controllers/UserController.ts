import { type Request, type Response } from 'express'
import * as UserService from '../services/UserService.js'
import { ApiResponse, UserRole, CreateUserRequest, UpdateUserRequest, PaginatedResponse, SafeUser } from '../types/types.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10

  const result = await UserService.getAllUsers(page, pageSize)

  const response: ApiResponse<PaginatedResponse<SafeUser>> = {
    success: true,
    data: result
  }

  res.json(response)
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const user = await UserService.getUserById(id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const response: ApiResponse<typeof user> = {
    success: true,
    data: user
  }

  res.json(response)
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const data: CreateUserRequest = req.body

  if (!data.username || !data.password || !data.name || !data.role) {
    throw new AppError('Missing required fields', 400)
  }

  try {
    const user = await UserService.createUser(data)

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      message: 'User created successfully'
    }

    res.status(201).json(response)
  } catch (error) {
    if (error instanceof Error && error.message === 'Username already exists') {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const data: UpdateUserRequest = req.body

  try {
    const user = await UserService.updateUser(id, data)

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      message: 'User updated successfully'
    }

    res.json(response)
  } catch (error) {
    if (error instanceof Error && error.message === 'Username already exists') {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const success = await UserService.deleteUser(id)

  if (!success) {
    throw new AppError('User not found', 404)
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'User deleted successfully'
  }

  res.json(response)
}

export async function getUsersByRole(req: Request, res: Response): Promise<void> {
  const { role } = req.params

  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new AppError('Invalid role', 400)
  }

  const users = await UserService.getUsersByRole(role as UserRole)

  const response: ApiResponse<typeof users> = {
    success: true,
    data: users
  }

  res.json(response)
}

export async function getActiveUsers(req: Request, res: Response): Promise<void> {
  const users = await UserService.getActiveUsers()

  const response: ApiResponse<typeof users> = {
    success: true,
    data: users
  }

  res.json(response)
}

export async function getHandoverableUsers(req: Request, res: Response): Promise<void> {
  const { role } = req.query

  if (!role || !['accountant', 'manager'].includes(role as string)) {
    throw new AppError('Invalid role parameter. Must be "accountant" or "manager"', 400)
  }

  const users = await UserService.getHandoverableUsers(role as 'accountant' | 'manager')

  const response: ApiResponse<typeof users> = {
    success: true,
    data: users
  }

  res.json(response)
}