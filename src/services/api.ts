import axios from 'axios'
import { WorkflowSimpleVO, WorkflowDetailVO, UserVO, ScheduleVO, PatientVO } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => {
    if (response.data.code === '0000') {
      return response.data.data
    }
    return Promise.reject(new Error(response.data.message || '请求失败'))
  },
  error => {
    return Promise.reject(error)
  }
)

export const workflowApi = {
  getList: (handlerId?: number): Promise<WorkflowSimpleVO[]> =>
    api.get('/workflow', { params: { handlerId } }),

  getDetail: (id: number): Promise<WorkflowDetailVO> =>
    api.get(`/workflow/${id}`),

  create: (data: { patientId: number; surgeryType: string; remarks?: string }): Promise<WorkflowDetailVO> =>
    api.post('/workflow', data),

  startCheck: (id: number, handlerId: number): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/start-check`, { handlerId }),

  updateCheckItem: (data: {
    checkId: number
    status: string
    operatorId: number
    checkResult?: string
    measurementValue?: string
    referenceRange?: string
    remarks?: string
    attachmentUrl?: string
  }): Promise<void> =>
    api.post('/workflow/check-item', data),

  submitCheck: (id: number, operatorId: number, remarks?: string): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/submit-check`, { operatorId, remarks }),

  reviewCheck: (id: number, data: {
    reviewerId: number
    approved: boolean
    rejectionReason?: string
  }): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/review-check`, data),

  startScheduling: (id: number, handlerId: number): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/start-scheduling`, { handlerId }),

  submitSchedule: (id: number, data: {
    handlerId: number
    surgeryDate: string
    startTime: string
    operatingRoom: string
    surgeonId?: number
    anesthesiologistId?: number
    materialList?: string
    remarks?: string
  }): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/submit-schedule`, data),

  reviewSchedule: (id: number, data: {
    reviewerId: number
    approved: boolean
    rejectionReason?: string
  }): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/review-schedule`, data),

  complete: (id: number): Promise<WorkflowDetailVO> =>
    api.post(`/workflow/${id}/complete`)
}

export const commonApi = {
  getUsers: (role?: string): Promise<UserVO[]> =>
    api.get('/users', { params: { role } }),

  getPatients: (): Promise<PatientVO[]> =>
    api.get('/patients'),

  getSchedules: (startDate: string, endDate: string): Promise<ScheduleVO[]> =>
    api.get('/schedules', { params: { startDate, endDate } }),

  exportWorkflows: (): Promise<string> =>
    api.get('/export/workflows'),

  exportSchedules: (): Promise<string> =>
    api.get('/export/schedules')
}
