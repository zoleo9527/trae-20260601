import type {
  SupplementApplication,
  SupplementListQuery,
  PaginationResult,
  CreateSupplementParams,
  HistoryRecord,
  ExportResult,
} from '@/types'
import { http } from './request'

export const SupplementApi = {
  list: (query: SupplementListQuery): Promise<PaginationResult<SupplementApplication>> =>
    http.get('/supplements', query),

  detail: (id: string): Promise<SupplementApplication | null> =>
    http.get(`/supplements/${id}`),

  history: (id: string): Promise<HistoryRecord[] | null> =>
    http.get(`/supplements/${id}/history`),

  create: (params: CreateSupplementParams): Promise<SupplementApplication> =>
    http.post('/supplements', params),

  submit: (id: string, operatorId: string): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/submit`, { operatorId }),

  startDesign: (id: string, operatorId: string, remark?: string): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/start-design`, { operatorId, remark }),

  confirmDesign: (
    id: string,
    operatorId: string,
    opts: { remark?: string; changes?: HistoryRecord['changes'] }
  ): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/confirm-design`, { operatorId, ...opts }),

  reject: (id: string, operatorId: string, reason: string): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/reject`, { operatorId, reason }),

  supplement: (
    id: string,
    operatorId: string,
    opts: {
      remark: string
      changes?: HistoryRecord['changes']
      tiles?: SupplementApplication['tiles']
      expectedDeliveryDate?: string
    }
  ): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/supplement`, { operatorId, ...opts }),

  reschedule: (
    id: string,
    operatorId: string,
    newDate: string,
    remark: string
  ): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/reschedule`, { operatorId, newDate, remark }),

  startWarehouse: (id: string, operatorId: string): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/start-warehouse`, { operatorId }),

  ship: (
    id: string,
    operatorId: string,
    expressNo?: string,
    logisticsRemark?: string
  ): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/ship`, { operatorId, expressNo, logisticsRemark }),

  complete: (
    id: string,
    operatorId: string,
    remark?: string
  ): Promise<SupplementApplication> =>
    http.post(`/supplements/${id}/complete`, { operatorId, remark }),

  exportList: (query: Omit<SupplementListQuery, 'page' | 'pageSize'>): Promise<ExportResult> =>
    http.download('/supplements/export', query),

  exportDetail: (id: string): Promise<ExportResult> =>
    http.download(`/supplements/${id}/export`),
}
