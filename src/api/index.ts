import type { User, KeyPerson, VisitRecord, Issue, SystemStats, Role } from '@/types'

export interface FlowRecord {
  id: string
  targetType: 'visit' | 'issue'
  targetId: string
  action: string
  operatorId: string
  operatorName: string
  operatorRole: string
  details?: string
  createdAt: string
}

const API_BASE = 'http://localhost:3001/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '请求失败')
  }
  
  return response.json()
}

export async function login(username: string, password: string): Promise<User> {
  const users = await request<User[]>('/users')
  const user = users.find(u => u.name === username)
  if (!user || password !== '123456') {
    throw new Error('用户名或密码错误')
  }
  return user
}

export async function getUsers(): Promise<User[]> {
  return request<User[]>('/users')
}

export async function getUserById(id: string): Promise<User | undefined> {
  return request<User>(`/users/${id}`)
}

export async function getKeyPersons(): Promise<KeyPerson[]> {
  return request<KeyPerson[]>('/key-persons')
}

export async function getKeyPersonById(id: string): Promise<KeyPerson | undefined> {
  const keyPersons = await getKeyPersons()
  return keyPersons.find(kp => kp.id === id)
}

export async function getVisitRecords(): Promise<VisitRecord[]> {
  return request<VisitRecord[]>('/visits')
}

export async function getVisitRecordById(id: string): Promise<VisitRecord | undefined> {
  return request<VisitRecord>(`/visits/${id}`)
}

export async function createVisitRecord(data: {
  keyPersonId: string
  socialWorkerId: string
  socialWorkerName: string
  scheduledDate: string
  notes?: string
}): Promise<VisitRecord> {
  return request<VisitRecord>('/visits', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateVisitRecord(id: string, data: Partial<VisitRecord> & {
  operatorId?: string
  operatorName?: string
  operatorRole?: string
}): Promise<VisitRecord | undefined> {
  return request<VisitRecord>(`/visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function getIssues(): Promise<Issue[]> {
  return request<Issue[]>('/issues')
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  return request<Issue>(`/issues/${id}`)
}

export async function createIssue(data: {
  visitId: string
  reporterId: string
  reporterName: string
  title: string
  description: string
  category: string
}): Promise<Issue> {
  return request<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateIssue(id: string, data: Partial<Issue> & {
  operatorId?: string
  operatorName?: string
  operatorRole?: string
}): Promise<Issue | undefined> {
  return request<Issue>(`/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function getFlowRecords(type: 'visit' | 'issue', id: string): Promise<FlowRecord[]> {
  return request<FlowRecord[]>(`/flow-records/${type}/${id}`)
}

export async function getSystemStats(): Promise<SystemStats> {
  return request<SystemStats>('/stats')
}

export async function getIssuesByVisitId(visitId: string): Promise<Issue[]> {
  const issues = await getIssues()
  return issues.filter(i => i.visitId === visitId)
}

export async function getRoleOptions(): Promise<{ value: Role; label: string }[]> {
  return [
    { value: 'socialWorker', label: '站点社工' },
    { value: 'volunteerLeader', label: '志愿队长' },
    { value: 'communityLeader', label: '社区干部' }
  ]
}