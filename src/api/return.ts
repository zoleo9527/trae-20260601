import type {
  ReturnReview,
  ReturnListQuery,
  PaginationResult,
  CreateReturnParams,
  HistoryRecord,
  ExportResult,
} from '@/types'
import { http } from './request'

export const ReturnApi = {
  list: (query: ReturnListQuery): Promise<PaginationResult<ReturnReview>> =>
    http.get('/returns', query),

  detail: (id: string): Promise<ReturnReview | null> =>
    http.get(`/returns/${id}`),

  history: (id: string): Promise<HistoryRecord[] | null> =>
    http.get(`/returns/${id}/history`),

  create: (params: CreateReturnParams): Promise<ReturnReview> =>
    http.post('/returns', params),

  inspect: (
    id: string,
    operatorId: string,
    opts: { remark?: string; warehouseId?: string }
  ): Promise<ReturnReview> =>
    http.post(`/returns/${id}/inspect`, { operatorId, ...opts }),

  pass: (
    id: string,
    operatorId: string,
    opts: {
      remark?: string
      inspectionResult?: string
      changes?: HistoryRecord['changes']
    }
  ): Promise<ReturnReview> =>
    http.post(`/returns/${id}/pass`, { operatorId, ...opts }),

  reject: (id: string, operatorId: string, reason: string): Promise<ReturnReview> =>
    http.post(`/returns/${id}/reject`, { operatorId, reason }),

  supplement: (
    id: string,
    operatorId: string,
    opts: {
      remark: string
      changes?: HistoryRecord['changes']
      tiles?: ReturnReview['tiles']
      inspectionResult?: string
      attachments?: HistoryRecord['attachments']
    }
  ): Promise<ReturnReview> =>
    http.post(`/returns/${id}/supplement`, { operatorId, ...opts }),

  reschedule: (
    id: string,
    operatorId: string,
    newDate: string,
    remark: string
  ): Promise<ReturnReview> =>
    http.post(`/returns/${id}/reschedule`, { operatorId, newDate, remark }),

  refund: (
    id: string,
    operatorId: string,
    opts: { remark?: string; changes?: HistoryRecord['changes'] }
  ): Promise<ReturnReview> =>
    http.post(`/returns/${id}/refund`, { operatorId, ...opts }),

  exportList: (query: Omit<ReturnListQuery, 'page' | 'pageSize'>): Promise<ExportResult> =>
    http.download('/returns/export', query),

  exportDetail: (id: string): Promise<ExportResult> =>
    http.download(`/returns/${id}/export`),
}
