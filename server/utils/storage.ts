import type { AcceptanceRecord } from '~/types'

const STORAGE_KEY = 'acceptance_records'

export async function getRecords(): Promise<AcceptanceRecord[]> {
  const storage = useStorage('data')
  const records = await storage.getItem<AcceptanceRecord[]>(STORAGE_KEY)
  return records || []
}

export async function saveRecords(records: AcceptanceRecord[]): Promise<void> {
  const storage = useStorage('data')
  await storage.setItem(STORAGE_KEY, records)
}

export async function getRecordById(id: string): Promise<AcceptanceRecord | null> {
  const records = await getRecords()
  return records.find(r => r.id === id) || null
}

export async function addRecord(record: AcceptanceRecord): Promise<AcceptanceRecord> {
  const records = await getRecords()
  records.unshift(record)
  await saveRecords(records)
  return record
}

export async function updateRecord(id: string, updates: Partial<AcceptanceRecord>): Promise<AcceptanceRecord | null> {
  const records = await getRecords()
  const index = records.findIndex(r => r.id === id)
  if (index === -1) return null
  
  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  await saveRecords(records)
  return records[index]
}

export function generateId(): string {
  return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getCurrentUserId(): string | null {
  const cookie = getCookie(useEvent(), 'current_user_id')
  return cookie || null
}
