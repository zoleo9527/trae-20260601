import axios from 'axios'
import { User, Cattle, CattleNote, BreedingRecord, BreedingNote } from '../types'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
})

export const authApi = {
  login: (username: string, password: string) =>
    api.post<User>('/auth/login', { username, password }),
  
  getUsers: () => api.get<User[]>('/auth/users'),
}

export const cattleApi = {
  getCattle: (params?: { status?: string; keyword?: string }) =>
    api.get<Cattle[]>('/cattle', { params }),
  
  getCattleById: (id: number) => api.get<Cattle>(`/cattle/${id}`),
  
  createCattle: (data: Omit<Cattle, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Cattle>('/cattle', data),
  
  updateCattle: (id: number, data: Partial<Cattle>) =>
    api.put<Cattle>(`/cattle/${id}`, data),
  
  deleteCattle: (id: number) => api.delete(`/cattle/${id}`),
}

export const cattleNotesApi = {
  getNotes: (params?: { cattleId?: number; status?: string; type?: string }) =>
    api.get<CattleNote[]>('/cattle-notes', { params }),
  
  getNoteById: (id: number) => api.get<CattleNote>(`/cattle-notes/${id}`),
  
  createNote: (data: Omit<CattleNote, 'id' | 'createdAt' | 'updatedAt' | 'author'>) =>
    api.post<CattleNote>('/cattle-notes', data),
  
  updateNote: (id: number, data: Partial<CattleNote>) =>
    api.put<CattleNote>(`/cattle-notes/${id}`, data),
  
  deleteNote: (id: number) => api.delete(`/cattle-notes/${id}`),
}

export const breedingApi = {
  getRecords: (params?: { cowId?: number; status?: string; startDate?: string; endDate?: string }) =>
    api.get<BreedingRecord[]>('/breeding', { params }),
  
  getRecordById: (id: number) => api.get<BreedingRecord>(`/breeding/${id}`),
  
  createRecord: (data: Omit<BreedingRecord, 'id' | 'createdAt' | 'updatedAt' | 'cow' | 'bull' | 'operator'>) =>
    api.post<BreedingRecord>('/breeding', data),
  
  updateRecord: (id: number, data: Partial<BreedingRecord>) =>
    api.put<BreedingRecord>(`/breeding/${id}`, data),
  
  deleteRecord: (id: number) => api.delete(`/breeding/${id}`),
}

export const breedingNotesApi = {
  getNotes: (params?: { breedingRecordId?: number; status?: string }) =>
    api.get<BreedingNote[]>('/breeding-notes', { params }),
  
  getNoteById: (id: number) => api.get<BreedingNote>(`/breeding-notes/${id}`),
  
  createNote: (data: Omit<BreedingNote, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'relatedCattleNote'>) =>
    api.post<BreedingNote>('/breeding-notes', data),
  
  updateNote: (id: number, data: Partial<BreedingNote>) =>
    api.put<BreedingNote>(`/breeding-notes/${id}`, data),
  
  deleteNote: (id: number) => api.delete(`/breeding-notes/${id}`),
}