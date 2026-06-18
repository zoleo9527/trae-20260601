import type { User, KeyPerson, VisitRecord, Issue, SystemStats, Role } from '@/types'
import { mockUsers, mockKeyPersons, mockVisitRecords, mockIssues } from '@/data/mockData'

const STORAGE_KEYS = {
  users: 'cv_users',
  keyPersons: 'cv_keyPersons',
  visitRecords: 'cv_visitRecords',
  issues: 'cv_issues'
}

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers))
  }
  if (!localStorage.getItem(STORAGE_KEYS.keyPersons)) {
    localStorage.setItem(STORAGE_KEYS.keyPersons, JSON.stringify(mockKeyPersons))
  }
  if (!localStorage.getItem(STORAGE_KEYS.visitRecords)) {
    localStorage.setItem(STORAGE_KEYS.visitRecords, JSON.stringify(mockVisitRecords))
  }
  if (!localStorage.getItem(STORAGE_KEYS.issues)) {
    localStorage.setItem(STORAGE_KEYS.issues, JSON.stringify(mockIssues))
  }
}

initStorage()

function getUsersFromStorage(): User[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]')
}

function getKeyPersonsFromStorage(): KeyPerson[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.keyPersons) || '[]')
}

function getVisitRecordsFromStorage(): VisitRecord[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.visitRecords) || '[]')
}

function getIssuesFromStorage(): Issue[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.issues) || '[]')
}

function saveVisitRecordsToStorage(records: VisitRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.visitRecords, JSON.stringify(records))
}

function saveIssuesToStorage(data: Issue[]): void {
  localStorage.setItem(STORAGE_KEYS.issues, JSON.stringify(data))
}

export async function login(username: string, password: string): Promise<User> {
  await delay(500)
  const users = getUsersFromStorage()
  const user = users.find(u => u.name === username)
  if (!user || password !== '123456') {
    throw new Error('用户名或密码错误')
  }
  return user
}

export async function getUsers(): Promise<User[]> {
  await delay(300)
  return getUsersFromStorage()
}

export async function getUserById(id: string): Promise<User | undefined> {
  await delay(200)
  return getUsersFromStorage().find(u => u.id === id)
}

export async function getKeyPersons(): Promise<KeyPerson[]> {
  await delay(300)
  return getKeyPersonsFromStorage()
}

export async function getKeyPersonById(id: string): Promise<KeyPerson | undefined> {
  await delay(200)
  return getKeyPersonsFromStorage().find(kp => kp.id === id)
}

export async function getVisitRecords(status?: VisitRecord['status']): Promise<VisitRecord[]> {
  await delay(300)
  const records = getVisitRecordsFromStorage()
  if (status) {
    return records.filter(v => v.status === status)
  }
  return records
}

export async function getVisitRecordById(id: string): Promise<VisitRecord | undefined> {
  await delay(200)
  return getVisitRecordsFromStorage().find(v => v.id === id)
}

export async function createVisitRecord(data: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VisitRecord> {
  await delay(300)
  const records = getVisitRecordsFromStorage()
  const newRecord: VisitRecord = {
    ...data,
    id: `v${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  records.push(newRecord)
  saveVisitRecordsToStorage(records)
  return newRecord
}

export async function updateVisitRecord(id: string, data: Partial<VisitRecord>): Promise<VisitRecord | undefined> {
  await delay(300)
  const records = getVisitRecordsFromStorage()
  const index = records.findIndex(v => v.id === id)
  if (index === -1) return undefined
  records[index] = {
    ...records[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  saveVisitRecordsToStorage(records)
  return records[index]
}

export async function getIssues(status?: Issue['status']): Promise<Issue[]> {
  await delay(300)
  const issues = getIssuesFromStorage()
  if (status) {
    return issues.filter(i => i.status === status)
  }
  return issues
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await delay(200)
  return getIssuesFromStorage().find(i => i.id === id)
}

export async function createIssue(data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> {
  await delay(300)
  const issues = getIssuesFromStorage()
  const visitRecords = getVisitRecordsFromStorage()
  const visitRecord = visitRecords.find(v => v.id === data.visitId)
  const newIssue: Issue = {
    ...data,
    id: `i${Date.now()}`,
    visitRecord,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  issues.push(newIssue)
  saveIssuesToStorage(issues)
  return newIssue
}

export async function updateIssue(id: string, data: Partial<Issue>): Promise<Issue | undefined> {
  await delay(300)
  const issues = getIssuesFromStorage()
  const index = issues.findIndex(i => i.id === id)
  if (index === -1) return undefined
  issues[index] = {
    ...issues[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  saveIssuesToStorage(issues)
  return issues[index]
}

export async function getSystemStats(): Promise<SystemStats> {
  await delay(300)
  const visitRecords = getVisitRecordsFromStorage()
  const issues = getIssuesFromStorage()
  return {
    totalVisits: visitRecords.length,
    pendingVisits: visitRecords.filter(v => v.status === 'pending').length,
    overdueVisits: visitRecords.filter(v => v.status === 'overdue').length,
    blockedVisits: visitRecords.filter(v => v.status === 'blocked').length,
    totalIssues: issues.length,
    pendingIssues: issues.filter(i => i.status === 'pending').length,
    processingIssues: issues.filter(i => i.status === 'processing').length,
    resolvedIssues: issues.filter(i => i.status === 'resolved').length,
    escalatedIssues: issues.filter(i => i.status === 'escalated').length
  }
}

export async function getIssuesByVisitId(visitId: string): Promise<Issue[]> {
  await delay(200)
  return getIssuesFromStorage().filter(i => i.visitId === visitId)
}

export async function getRoleOptions(): Promise<{ value: Role; label: string }[]> {
  await delay(100)
  return [
    { value: 'socialWorker', label: '站点社工' },
    { value: 'volunteerLeader', label: '志愿队长' },
    { value: 'communityLeader', label: '社区干部' }
  ]
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
