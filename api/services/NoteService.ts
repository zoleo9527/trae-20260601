import * as NoteRepository from '../repositories/NoteRepository.js'
import * as CustomerRepository from '../repositories/CustomerRepository.js'
import * as UserRepository from '../repositories/UserRepository.js'
import { Note, NoteType, CreateNoteRequest, UpdateNoteRequest, PaginatedResponse } from '../types/types.js'

export async function getAllNotes(): Promise<Note[]> {
  return NoteRepository.findAll()
}

export async function getNoteById(id: string): Promise<Note | null> {
  return NoteRepository.findById(id)
}

export async function getNotesByCustomerId(customerId: string): Promise<Note[]> {
  return NoteRepository.findByCustomerId(customerId)
}

export async function getNotesWithFilter(
  filter: NoteRepository.NoteFilter,
  pagination: NoteRepository.NotePagination
): Promise<PaginatedResponse<Note>> {
  const { items, total } = await NoteRepository.findWithFilter(filter, pagination)
  const totalPages = Math.ceil(total / pagination.pageSize)

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages
  }
}

export async function createNote(userId: string, data: CreateNoteRequest): Promise<Note> {
  const customer = await CustomerRepository.findById(data.customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  const user = await UserRepository.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const note = await NoteRepository.create({
    customerId: data.customerId,
    userId,
    type: data.type,
    title: data.title,
    content: data.content,
    attachments: data.attachments || []
  })

  return note
}

export async function updateNote(id: string, userId: string, data: UpdateNoteRequest): Promise<Note | null> {
  const existingNote = await NoteRepository.findById(id)
  if (!existingNote) {
    return null
  }

  if (existingNote.userId !== userId) {
    throw new Error('You are not authorized to update this note')
  }

  const updateData: Partial<Note> = {}

  if (data.type !== undefined) updateData.type = data.type
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.attachments !== undefined) updateData.attachments = data.attachments

  return NoteRepository.update(id, updateData)
}

export async function deleteNote(id: string, userId: string): Promise<boolean> {
  const existingNote = await NoteRepository.findById(id)
  if (!existingNote) {
    return false
  }

  if (existingNote.userId !== userId) {
    throw new Error('You are not authorized to delete this note')
  }

  return NoteRepository.remove(id)
}

export async function getNoteTimeline(customerId: string): Promise<Note[]> {
  return NoteRepository.findByCustomerId(customerId)
}

export async function searchNotes(keyword: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Note>> {
  return getNotesWithFilter({ search: keyword }, { page, pageSize })
}

export async function getNoteStats(): Promise<Record<NoteType, number>> {
  return NoteRepository.countByType()
}