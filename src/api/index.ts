import type {
  Role,
  RoleInfo,
  JointTest,
  Issue,
  StatsData,
  OperationLog,
  ApiResponse,
} from '../types'

const baseURL = '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${baseURL}${path}`
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  }

  try {
    const response = await fetch(url, finalOptions)
    const data = await response.json()
    return data as ApiResponse<T>
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export async function getRole(): Promise<ApiResponse<RoleInfo>> {
  return request<RoleInfo>('/role', { method: 'GET' })
}

export async function setRole(role: Role): Promise<ApiResponse<RoleInfo>> {
  return request<RoleInfo>('/role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export interface GetTestsParams {
  status?: string
  project?: string
  date_from?: string
  date_to?: string
}

export async function getTests(
  params?: GetTestsParams
): Promise<ApiResponse<JointTest[]>> {
  let query = ''
  if (params) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value)
      }
    })
    query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  }
  return request<JointTest[]>(`/tests${query}`, { method: 'GET' })
}

export async function getTest(id: string): Promise<ApiResponse<JointTest>> {
  return request<JointTest>(`/tests/${id}`, { method: 'GET' })
}

export interface CreateTestPayload {
  project_id: string
  title: string
  executor?: string
  planned_at?: string
  items?: Array<{ name: string; expected_result?: string }>
}

export async function createTest(
  payload: CreateTestPayload
): Promise<ApiResponse<JointTest>> {
  return request<JointTest>('/tests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ExecuteTestItemPayload {
  testItemId: string
  passed: boolean
  remark?: string
}

export async function executeTestItem(
  testId: string,
  payload: ExecuteTestItemPayload
): Promise<ApiResponse<JointTest>> {
  return request<JointTest>(`/tests/${testId}/execute`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function completeTest(
  id: string
): Promise<ApiResponse<JointTest>> {
  return request<JointTest>(`/tests/${id}/complete`, { method: 'PUT' })
}

export async function convertToIssue(
  testId: string,
  failedItemIds: string[]
): Promise<ApiResponse<Issue[]>> {
  return request<Issue[]>(`/tests/${testId}/convert-to-issue`, {
    method: 'POST',
    body: JSON.stringify({ failedItemIds }),
  })
}

export interface GetIssuesParams {
  status?: string
  assignee?: string
  severity?: string
}

export async function getIssues(
  params?: GetIssuesParams
): Promise<ApiResponse<Issue[]>> {
  let query = ''
  if (params) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value)
      }
    })
    query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  }
  return request<Issue[]>(`/issues${query}`, { method: 'GET' })
}

export async function getIssue(id: string): Promise<ApiResponse<Issue>> {
  return request<Issue>(`/issues/${id}`, { method: 'GET' })
}

export interface CreateIssuePayload {
  test_id?: string
  test_item_id?: string
  project_id: string
  title: string
  severity: 'critical' | 'major' | 'minor'
  description?: string
  assignee?: string
}

export async function createIssue(
  payload: CreateIssuePayload
): Promise<ApiResponse<Issue>> {
  return request<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function assignIssue(
  id: string,
  assignee: string
): Promise<ApiResponse<Issue>> {
  return request<Issue>(`/issues/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ assignee }),
  })
}

export async function updateIssueProgress(
  id: string,
  description: string
): Promise<ApiResponse<Issue>> {
  return request<Issue>(`/issues/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  })
}

export async function completeIssue(id: string): Promise<ApiResponse<Issue>> {
  return request<Issue>(`/issues/${id}/complete`, { method: 'PUT' })
}

export interface VerifyIssuePayload {
  passed: boolean
  remark?: string
}

export async function verifyIssue(
  id: string,
  payload: VerifyIssuePayload
): Promise<ApiResponse<Issue>> {
  return request<Issue>(`/issues/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getStats(): Promise<ApiResponse<StatsData>> {
  return request<StatsData>('/stats', { method: 'GET' })
}

export interface GetLogsParams {
  entity_type?: 'test' | 'issue'
  entity_id?: string
}

export async function getLogs(
  params?: GetLogsParams
): Promise<ApiResponse<OperationLog[]>> {
  let query = ''
  if (params) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value)
      }
    })
    query = queryParams.toString() ? `?${queryParams.toString()}` : ''
  }
  return request<OperationLog[]>(`/logs${query}`, { method: 'GET' })
}

export const testApi = {
  getTests,
  getTest,
  createTest,
  executeTestItem,
  completeTest,
  convertToIssue,
}

export const issueApi = {
  getIssues,
  getIssue,
  createIssue,
  assignIssue,
  updateIssueProgress,
  completeIssue,
  verifyIssue,
}
