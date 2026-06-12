import { type Request, type Response } from 'express'
import * as NoteService from '../services/NoteService.js'
import * as CustomerService from '../services/CustomerService.js'
import { ApiResponse, NoteType, PaginatedResponse, Note } from '../types/types.js'
import { AppError } from '../middleware/errorHandler.js'

export async function searchNotes(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const sortBy = req.query.sortBy as string
  const sortOrder = req.query.sortOrder as 'asc' | 'desc'

  const filter = {
    customerId: req.query.customerId as string | undefined,
    userId: req.query.userId as string | undefined,
    type: req.query.type as NoteType | undefined,
    search: req.query.search as string | undefined
  }

  const result = await NoteService.getNotesWithFilter(filter, {
    page,
    pageSize,
    sortBy,
    sortOrder
  })

  const response: ApiResponse<PaginatedResponse<Note>> = {
    success: true,
    data: result
  }

  res.json(response)
}

export async function getNoteTimeline(req: Request, res: Response): Promise<void> {
  const { customerId } = req.params

  const customer = await CustomerService.getCustomerById(customerId)
  if (!customer) {
    throw new AppError('Customer not found', 404)
  }

  const notes = await NoteService.getNoteTimeline(customerId)

  const response: ApiResponse<typeof notes> = {
    success: true,
    data: notes
  }

  res.json(response)
}

export async function createNote(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const data = req.body

  if (!data.customerId || !data.type || !data.title || !data.content) {
    throw new AppError('Missing required fields', 400)
  }

  try {
    const note = await NoteService.createNote(req.user.userId, data)

    const response: ApiResponse<typeof note> = {
      success: true,
      data: note,
      message: 'Note created successfully'
    }

    res.status(201).json(response)
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400)
    }
    throw error
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = req.params
  const data = req.body

  try {
    const note = await NoteService.updateNote(id, req.user.userId, data)

    if (!note) {
      throw new AppError('Note not found', 404)
    }

    const response: ApiResponse<typeof note> = {
      success: true,
      data: note,
      message: 'Note updated successfully'
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

export async function deleteNote(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = req.params

  try {
    const success = await NoteService.deleteNote(id, req.user.userId)

    if (!success) {
      throw new AppError('Note not found', 404)
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Note deleted successfully'
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

export async function getNoteById(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const note = await NoteService.getNoteById(id)

  if (!note) {
    throw new AppError('Note not found', 404)
  }

  const response: ApiResponse<typeof note> = {
    success: true,
    data: note
  }

  res.json(response)
}