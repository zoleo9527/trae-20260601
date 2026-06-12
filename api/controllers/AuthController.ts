import { type Request, type Response } from 'express'
import * as AuthService from '../services/AuthService.js'
import { ApiResponse, LoginRequest } from '../types/types.js'
import { AppError } from '../middleware/errorHandler.js'

export async function login(req: Request, res: Response): Promise<void> {
  const data: LoginRequest = req.body

  if (!data.username || !data.password) {
    throw new AppError('Username and password are required', 400)
  }

  const result = await AuthService.login(data)

  if (!result) {
    throw new AppError('Invalid username or password', 401)
  }

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
    message: 'Login successful'
  }

  res.json(response)
}

export async function logout(req: Request, res: Response): Promise<void> {
  const response: ApiResponse<null> = {
    success: true,
    message: 'Logout successful'
  }

  res.json(response)
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const user = await AuthService.getCurrentUser(req.user.userId)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const response: ApiResponse<typeof user> = {
    success: true,
    data: user
  }

  res.json(response)
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password, name, role, email, phone } = req.body

  if (!username || !password || !name || !role) {
    throw new AppError('Missing required fields', 400)
  }

  const user = await AuthService.register({
    username,
    password,
    name,
    role,
    email,
    phone
  })

  const response: ApiResponse<typeof user> = {
    success: true,
    data: user,
    message: 'Registration successful'
  }

  res.status(201).json(response)
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) {
    throw new AppError('Old password and new password are required', 400)
  }

  const success = await AuthService.changePassword(req.user.userId, oldPassword, newPassword)

  if (!success) {
    throw new AppError('Invalid old password', 400)
  }

  const response: ApiResponse<null> = {
    success: true,
    message: 'Password changed successfully'
  }

  res.json(response)
}