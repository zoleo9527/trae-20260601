import { type Request, type Response, type NextFunction } from 'express'
import { ApiResponse } from '../types/types.js'

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error)

  const statusCode = error instanceof AppError ? error.statusCode : 500
  const message = error.message || 'Internal server error'

  const response: ApiResponse<null> = {
    success: false,
    error: message
  }

  res.status(statusCode).json(response)
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  }

  res.status(404).json(response)
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}