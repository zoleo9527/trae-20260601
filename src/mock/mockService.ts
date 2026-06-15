import { createMockService, type MockDB } from './serviceFactory'
import type { SupplementApplication, ReturnReview } from '@/types'

const DB_KEYS = {
  SUPPLEMENTS: 'mock_db_supplements',
  RETURNS: 'mock_db_returns',
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Mock DB write failed:', e)
  }
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const browserDB: MockDB = {
  supplements: {
    list: (): SupplementApplication[] => read<SupplementApplication>(DB_KEYS.SUPPLEMENTS),
    find: (id: string): SupplementApplication | undefined => {
      return read<SupplementApplication>(DB_KEYS.SUPPLEMENTS).find(x => x.id === id)
    },
    insert: (item: SupplementApplication): SupplementApplication => {
      const list = read<SupplementApplication>(DB_KEYS.SUPPLEMENTS)
      list.unshift(item)
      write(DB_KEYS.SUPPLEMENTS, list)
      return clone(item)
    },
    update: (id: string, item: SupplementApplication): SupplementApplication => {
      const list = read<SupplementApplication>(DB_KEYS.SUPPLEMENTS)
      const idx = list.findIndex(x => x.id === id)
      if (idx !== -1) {
        list[idx] = item
        write(DB_KEYS.SUPPLEMENTS, list)
      }
      return clone(item)
    },
    initIfEmpty: (seedData: SupplementApplication[]): void => {
      const existing = read<SupplementApplication>(DB_KEYS.SUPPLEMENTS)
      if (existing.length === 0) {
        write(DB_KEYS.SUPPLEMENTS, seedData)
      }
    },
    reset: (seedData?: SupplementApplication[]): void => {
      write(DB_KEYS.SUPPLEMENTS, seedData || [])
    },
  },
  returns: {
    list: (): ReturnReview[] => read<ReturnReview>(DB_KEYS.RETURNS),
    find: (id: string): ReturnReview | undefined => {
      return read<ReturnReview>(DB_KEYS.RETURNS).find(x => x.id === id)
    },
    insert: (item: ReturnReview): ReturnReview => {
      const list = read<ReturnReview>(DB_KEYS.RETURNS)
      list.unshift(item)
      write(DB_KEYS.RETURNS, list)
      return clone(item)
    },
    update: (id: string, item: ReturnReview): ReturnReview => {
      const list = read<ReturnReview>(DB_KEYS.RETURNS)
      const idx = list.findIndex(x => x.id === id)
      if (idx !== -1) {
        list[idx] = item
        write(DB_KEYS.RETURNS, list)
      }
      return clone(item)
    },
    initIfEmpty: (seedData: ReturnReview[]): void => {
      const existing = read<ReturnReview>(DB_KEYS.RETURNS)
      if (existing.length === 0) {
        write(DB_KEYS.RETURNS, seedData)
      }
    },
    reset: (seedData?: ReturnReview[]): void => {
      write(DB_KEYS.RETURNS, seedData || [])
    },
  },
}

export const mockDB = browserDB

export const mockService = createMockService(browserDB)

export type { MockService } from './serviceFactory'
