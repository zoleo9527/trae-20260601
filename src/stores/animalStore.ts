import { create } from 'zustand'

export interface Animal {
  id: number
  name: string
  species: string
  breed: string
  status: string
  rescue_date: string
  location: string
  description: string
  [key: string]: unknown
}

interface Pagination {
  page: number
  limit: number
  total: number
}

interface FetchAnimalsParams {
  status?: string
  species?: string
  search?: string
  page?: number
  limit?: number
}

interface AnimalState {
  animals: Animal[]
  currentAnimal: Animal | null
  loading: boolean
  pagination: Pagination
  fetchAnimals: (params?: FetchAnimalsParams) => Promise<void>
  fetchAnimal: (id: number) => Promise<void>
  createAnimal: (data: Partial<Animal>) => Promise<void>
  updateAnimal: (id: number, data: Partial<Animal>) => Promise<void>
}

export const useAnimalStore = create<AnimalState>((set) => ({
  animals: [],
  currentAnimal: null,
  loading: false,
  pagination: { page: 1, limit: 10, total: 0 },

  fetchAnimals: async (params = {}) => {
    set({ loading: true })
    try {
      const query = new URLSearchParams()
      if (params.status) query.set('status', params.status)
      if (params.species) query.set('species', params.species)
      if (params.search) query.set('search', params.search)
      query.set('page', String(params.page ?? 1))
      query.set('pageSize', String(params.limit ?? 20))
      const res = await fetch(`/api/animals?${query.toString()}`)
      if (!res.ok) throw new Error('获取救助档案失败')
      const data = await res.json()
      const list = data.list ?? data.data ?? (Array.isArray(data) ? data : [])
      const pagination = data.total != null
        ? { page: data.page ?? 1, limit: data.pageSize ?? 20, total: data.total }
        : { page: 1, limit: 20, total: list.length }
      set({ animals: list, pagination })
    } finally {
      set({ loading: false })
    }
  },

  fetchAnimal: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/animals/${id}`)
      if (!res.ok) throw new Error('获取救助档案详情失败')
      const data = await res.json()
      set({ currentAnimal: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  createAnimal: async (data) => {
    const res = await fetch('/api/animals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('创建救助档案失败')
  },

  updateAnimal: async (id, data) => {
    const res = await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('更新救助档案失败')
  },
}))
