import type { AcceptanceRecord, UserRole } from '~/types'

const STORAGE_KEY = 'acceptance_records'

const userRoleMap: Record<string, UserRole> = {
  'm1': 'manager',
  'm2': 'manager',
  'd1': 'director',
  'e1': 'engineer',
  'e2': 'engineer'
}

const userNameMap: Record<string, string> = {
  'm1': '张明',
  'm2': '李华',
  'd1': '王芳',
  'e1': '赵强',
  'e2': '刘伟'
}

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

export function getCurrentUserRole(): UserRole | null {
  const userId = getCurrentUserId()
  if (!userId) return null
  return userRoleMap[userId] || null
}

export function getUserName(userId: string): string | null {
  return userNameMap[userId] || null
}

export function requireAuth(): string {
  const userId = getCurrentUserId()
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: '未登录，请先登录' })
  }
  return userId
}

export function requireRole(role: UserRole): string {
  const userId = requireAuth()
  const userRole = userRoleMap[userId]
  if (!userRole) {
    throw createError({ statusCode: 401, statusMessage: '用户不存在' })
  }
  const roleNameMap: Record<UserRole, string> = {
    manager: '招商经理',
    director: '招商主管',
    engineer: '物业工程'
  }
  if (userRole !== role) {
    throw createError({
      statusCode: 403,
      statusMessage: `权限不足：当前角色为${roleNameMap[userRole]}，该操作仅限${roleNameMap[role]}`
    })
  }
  return userId
}
