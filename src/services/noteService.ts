import api from './api'
import type {
  ApiResponse,
  Note,
  PaginatedResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteQueryParams,
} from '@/types/types'

export const noteService = {
  getNotes: async (params: NoteQueryParams): Promise<ApiResponse<PaginatedResponse<Note>>> => {
    return api.get('/notes', { params })
  },

  getCustomerTimeline: async (customerId: string): Promise<ApiResponse<Note[]>> => {
    return api.get(`/notes/${customerId}/timeline`)
  },

  createNote: async (data: CreateNoteRequest): Promise<ApiResponse<Note>> => {
    return api.post('/notes', data)
  },

  updateNote: async (id: string, data: UpdateNoteRequest): Promise<ApiResponse<Note>> => {
    return api.put(`/notes/${id}`, data)
  },

  deleteNote: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/notes/${id}`)
  },
}

export default noteService