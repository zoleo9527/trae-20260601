import type { SupplementApplication, ReturnReview } from '@/types'

type Store = {
  supplements: SupplementApplication[]
  returns: ReturnReview[]
}

const store: Store = {
  supplements: [],
  returns: [],
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function list<T extends keyof Store>(key: T): Store[T][number][] {
  return clone(store[key] as any)
}

function save<T extends keyof Store>(key: T, data: Store[T][number][]): void {
  ;(store[key] as any) = clone(data)
}

function find<T extends keyof Store>(key: T, id: string): Store[T][number] | undefined {
  return (store[key] as any[]).find((x: any) => x.id === id)
}

function insert<T extends keyof Store>(key: T, item: Store[T][number]): Store[T][number] {
  ;(store[key] as any[]).unshift(clone(item) as any)
  return clone(item)
}

function update<T extends keyof Store>(key: T, id: string, item: Store[T][number]): Store[T][number] {
  const arr = store[key] as any[]
  const idx = arr.findIndex((x: any) => x.id === id)
  if (idx !== -1) {
    arr[idx] = clone(item) as any
  }
  return clone(item)
}

function initIfEmpty<T extends keyof Store>(key: T, seedData: Store[T][number][]): void {
  if ((store[key] as any[]).length === 0) {
    ;(store[key] as any) = clone(seedData)
  }
}

function reset<T extends keyof Store>(key: T, seedData?: Store[T][number][]): void {
  ;(store[key] as any) = clone(seedData || [])
}

export const serverMockDB = {
  supplements: {
    list: (): SupplementApplication[] => list('supplements'),
    save: (data: SupplementApplication[]): void => save('supplements', data),
    find: (id: string): SupplementApplication | undefined => find('supplements', id),
    insert: (item: SupplementApplication): SupplementApplication => insert('supplements', item),
    update: (id: string, item: SupplementApplication): SupplementApplication => update('supplements', id, item),
    initIfEmpty: (seedData: SupplementApplication[]): void => initIfEmpty('supplements', seedData),
    reset: (seedData?: SupplementApplication[]): void => reset('supplements', seedData),
  },
  returns: {
    list: (): ReturnReview[] => list('returns'),
    save: (data: ReturnReview[]): void => save('returns', data),
    find: (id: string): ReturnReview | undefined => find('returns', id),
    insert: (item: ReturnReview): ReturnReview => insert('returns', item),
    update: (id: string, item: ReturnReview): ReturnReview => update('returns', id, item),
    initIfEmpty: (seedData: ReturnReview[]): void => initIfEmpty('returns', seedData),
    reset: (seedData?: ReturnReview[]): void => reset('returns', seedData),
  },
  clearAll: (): void => {
    store.supplements = []
    store.returns = []
  },
}
