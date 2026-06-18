import type { User, KeyPerson, VisitRecord, Issue, SystemStats, Role } from '@/types'
import { mockUsers, mockKeyPersons, mockVisitRecords, mockIssues } from '@/data/mockData'

let users = [...mockUsers]
let keyPersons = [...mockKeyPersons]
let visitRecords = [...mockVisitRecords]
let issues = [...mockIssues]

export async function login(username: string, password: string): Promise<User> {
  await delay(500)
  const user = users.find(u => u.name === username)
  if (!user || password !== '123456') {
    throw new Error('用户名或密码错误')
  }
  return user
}

export async function getUsers(): Promise<User[]> {
  await delay(300)
  return users
}

export async function getUserById(id: string): Promise<User | undefined> {
  await delay(200)
  return users.find(u => u.id === id)
}

export async function getKeyPersons(): Promise<KeyPerson[]> {
  await delay(300)
  return keyPersons
}

export async function getKeyPersonById(id: string): Promise<KeyPerson | undefined> {
  await delay(200)
  return keyPersons.find(kp => kp.id === id)
}

export async function getVisitRecords(status?: VisitRecord['status']): Promise<VisitRecord[]> {
  await delay(300)
  if (status) {
    return visitRecords.filter(v => v.status === status)
  }
  return visitRecords
}

export async function getVisitRecordById(id: string): Promise<VisitRecord | undefined> {
  await delay(200)
  return visitRecords.find(v => v.id === id)
}

export async function createVisitRecord(data: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VisitRecord> {
  await delay(300)
  const newRecord: VisitRecord = {
    ...data,
    id: `v${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  visitRecords.push(newRecord)
  return newRecord
}

export async function updateVisitRecord(id: string, data: Partial<VisitRecord>): Promise<VisitRecord | undefined> {
  await delay(300)
  const index = visitRecords.findIndex(v => v.id === id)
  if (index === -1) return undefined
  visitRecords[index] = {
    ...visitRecords[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  return visitRecords[index]
}

export async function getIssues(status?: Issue['status']): Promise<Issue[]> {
  await delay(300)
  if (status) {
    return issues.filter(i => i.status === status)
  }
  return issues
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await delay(200)
  return issues.find(i => i.id === id)
}

export async function createIssue(data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> {
  await delay(300)
  const visitRecord = visitRecords.find(v => v.id === data.visitId)
  const newIssue: Issue = {
    ...data,
    id: `i${Date.now()}`,
    visitRecord,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  issues.push(newIssue)
  return newIssue
}

export async function updateIssue(id: string, data: Partial<Issue>): Promise<Issue | undefined> {
  await delay(300)
  const index = issues.findIndex(i => i.id === id)
  if (index === -1) return undefined
  issues[index] = {
    ...issues[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  return issues[index]
}

export async function getSystemStats(): Promise<SystemStats> {
  await delay(300)
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
  return issues.filter(i => i.visitId === visitId)
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
