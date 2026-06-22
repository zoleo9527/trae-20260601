import type {
  GasApplication,
  CustomerVisit,
  SafetyCheck,
  HiddenDanger,
  MeterChange,
  Customer,
  GasApplicationListQuery,
  CustomerVisitListQuery,
  SafetyCheckListQuery,
  HiddenDangerListQuery,
  MeterChangeListQuery,
  ApiResponse
} from '../types/gas'

const baseURL = '/api/gas'

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

export async function getCustomers(): Promise<ApiResponse<Customer[]>> {
  return request<Customer[]>('/customers', { method: 'GET' })
}

export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return request<Customer>(`/customers/${id}`, { method: 'GET' })
}

export async function getApplications(
  params?: GasApplicationListQuery
): Promise<ApiResponse<GasApplication[]>> {
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
  return request<GasApplication[]>(`/applications${query}`, { method: 'GET' })
}

export async function getApplication(id: string): Promise<ApiResponse<GasApplication>> {
  return request<GasApplication>(`/applications/${id}`, { method: 'GET' })
}

export interface CreateApplicationPayload {
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  application_type: 'stop' | 'resume' | 'temporary_stop'
  reason: string
  planned_date: string
  applicant: string
  applicant_role: 'safety_inspector' | 'customer_service' | 'repair_technician'
}

export async function createApplication(
  payload: CreateApplicationPayload
): Promise<ApiResponse<GasApplication>> {
  return request<GasApplication>('/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function approveApplication(
  id: string,
  approved_by: string
): Promise<ApiResponse<GasApplication>> {
  return request<GasApplication>(`/applications/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approved_by }),
  })
}

export async function executeApplication(
  id: string,
  executor: string
): Promise<ApiResponse<GasApplication>> {
  return request<GasApplication>(`/applications/${id}/execute`, {
    method: 'PUT',
    body: JSON.stringify({ executor }),
  })
}

export async function completeApplication(id: string): Promise<ApiResponse<GasApplication>> {
  return request<GasApplication>(`/applications/${id}/complete`, { method: 'PUT' })
}

export async function cancelApplication(
  id: string,
  cancelled_by: string
): Promise<ApiResponse<GasApplication>> {
  return request<GasApplication>(`/applications/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ cancelled_by }),
  })
}

export async function getVisits(
  params?: CustomerVisitListQuery
): Promise<ApiResponse<CustomerVisit[]>> {
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
  return request<CustomerVisit[]>(`/visits${query}`, { method: 'GET' })
}

export async function getVisit(id: string): Promise<ApiResponse<CustomerVisit>> {
  return request<CustomerVisit>(`/visits/${id}`, { method: 'GET' })
}

export interface CreateVisitPayload {
  application_id?: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  visit_type: 'pre_visit' | 'post_visit' | 'follow_up'
  purpose: string
  visitor: string
  visitor_role: 'safety_inspector' | 'customer_service' | 'repair_technician'
  scheduled_date: string
}

export async function createVisit(
  payload: CreateVisitPayload
): Promise<ApiResponse<CustomerVisit>> {
  return request<CustomerVisit>('/visits', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface CompleteVisitPayload {
  contact_result: 'reached' | 'not_reached' | 'refused'
  feedback: string
}

export async function completeVisit(
  id: string,
  payload: CompleteVisitPayload
): Promise<ApiResponse<CustomerVisit>> {
  return request<CustomerVisit>(`/visits/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function verifyVisit(
  id: string,
  passed: boolean
): Promise<ApiResponse<CustomerVisit>> {
  return request<CustomerVisit>(`/visits/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ passed }),
  })
}

export async function getSafetyChecks(
  params?: SafetyCheckListQuery
): Promise<ApiResponse<SafetyCheck[]>> {
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
  return request<SafetyCheck[]>(`/safety-checks${query}`, { method: 'GET' })
}

export async function getSafetyCheck(id: string): Promise<ApiResponse<SafetyCheck>> {
  return request<SafetyCheck>(`/safety-checks/${id}`, { method: 'GET' })
}

export interface CreateSafetyCheckPayload {
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  inspector: string
  check_date: string
  items: Array<{
    item_name: string
    standard: string
    actual: string
    passed: boolean
    remark?: string
  }>
  overall_result: 'passed' | 'failed'
  remark?: string
}

export async function createSafetyCheck(
  payload: CreateSafetyCheckPayload
): Promise<ApiResponse<SafetyCheck>> {
  return request<SafetyCheck>('/safety-checks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getHiddenDangers(
  params?: HiddenDangerListQuery
): Promise<ApiResponse<HiddenDanger[]>> {
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
  return request<HiddenDanger[]>(`/hidden-dangers${query}`, { method: 'GET' })
}

export async function getHiddenDanger(id: string): Promise<ApiResponse<HiddenDanger>> {
  return request<HiddenDanger>(`/hidden-dangers/${id}`, { method: 'GET' })
}

export interface CreateHiddenDangerPayload {
  check_id?: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  description: string
  level: 'critical' | 'major' | 'minor'
}

export async function createHiddenDanger(
  payload: CreateHiddenDangerPayload
): Promise<ApiResponse<HiddenDanger>> {
  return request<HiddenDanger>('/hidden-dangers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function notifyHiddenDanger(id: string): Promise<ApiResponse<HiddenDanger>> {
  return request<HiddenDanger>(`/hidden-dangers/${id}/notify`, { method: 'PUT' })
}

export interface RectifyHiddenDangerPayload {
  rectified_by: string
  verify_result: 'passed' | 'failed'
}

export async function rectifyHiddenDanger(
  id: string,
  payload: RectifyHiddenDangerPayload
): Promise<ApiResponse<HiddenDanger>> {
  return request<HiddenDanger>(`/hidden-dangers/${id}/rectify`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getMeterChanges(
  params?: MeterChangeListQuery
): Promise<ApiResponse<MeterChange[]>> {
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
  return request<MeterChange[]>(`/meter-changes${query}`, { method: 'GET' })
}

export async function getMeterChange(id: string): Promise<ApiResponse<MeterChange>> {
  return request<MeterChange>(`/meter-changes/${id}`, { method: 'GET' })
}

export interface CreateMeterChangePayload {
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  old_meter_number: string
  new_meter_number: string
  meter_type: string
  change_date: string
  technician: string
  reason: string
}

export async function createMeterChange(
  payload: CreateMeterChangePayload
): Promise<ApiResponse<MeterChange>> {
  return request<MeterChange>('/meter-changes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function completeMeterChange(id: string): Promise<ApiResponse<MeterChange>> {
  return request<MeterChange>(`/meter-changes/${id}/complete`, { method: 'PUT' })
}

export const gasApi = {
  getCustomers,
  getCustomer,
  getApplications,
  getApplication,
  createApplication,
  approveApplication,
  executeApplication,
  completeApplication,
  cancelApplication,
  getVisits,
  getVisit,
  createVisit,
  completeVisit,
  verifyVisit,
  getSafetyChecks,
  getSafetyCheck,
  createSafetyCheck,
  getHiddenDangers,
  getHiddenDanger,
  createHiddenDanger,
  notifyHiddenDanger,
  rectifyHiddenDanger,
  getMeterChanges,
  getMeterChange,
  createMeterChange,
  completeMeterChange,
}