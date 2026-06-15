import type {
  ReturnReview,
  ReturnListQuery,
  PaginationResult,
  CreateReturnParams,
  HistoryRecord,
  ExportResult,
} from '@/types'
import { ReturnService } from '@/services/returnService'

/**
 * 退货复核 API
 * 协议层：所有接口都以标准 HTTP 请求形式封装
 * 实际后端对接时，只需将下面的 Service 调用替换为 http.get/post 即可
 */
export const ReturnApi = {
  list: (query: ReturnListQuery): Promise<PaginationResult<ReturnReview>> =>
    // 真实后端: return http.get('/returns', query)
    ReturnService.list(query),

  detail: (id: string): Promise<ReturnReview | null> =>
    // 真实后端: return http.get(`/returns/${id}`)
    ReturnService.detail(id),

  history: (id: string): Promise<HistoryRecord[] | null> =>
    // 真实后端: return http.get(`/returns/${id}/history`)
    ReturnService.history(id),

  create: (params: CreateReturnParams): Promise<ReturnReview> =>
    // 真实后端: return http.post('/returns', params)
    ReturnService.create(params),

  inspect: (
    id: string,
    operatorId: string,
    opts: { remark?: string; warehouseId?: string }
  ): Promise<ReturnReview> =>
    // 真实后端: return http.post(`/returns/${id}/inspect`, { operatorId, ...opts })
    ReturnService.inspect(id, operatorId, opts),

  pass: (
    id: string,
    operatorId: string,
    opts: {
      remark?: string
      inspectionResult?: string
      changes?: HistoryRecord['changes']
    }
  ): Promise<ReturnReview> =>
    // 真实后端: return http.post(`/returns/${id}/pass`, { operatorId, ...opts })
    ReturnService.pass(id, operatorId, opts),

  reject: (id: string, operatorId: string, reason: string): Promise<ReturnReview> =>
    // 真实后端: return http.post(`/returns/${id}/reject`, { operatorId, reason })
    ReturnService.reject(id, operatorId, reason),

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
    // 真实后端: return http.post(`/returns/${id}/supplement`, { operatorId, ...opts })
    ReturnService.supplement(id, operatorId, opts),

  reschedule: (
    id: string,
    operatorId: string,
    newDate: string,
    remark: string
  ): Promise<ReturnReview> =>
    // 真实后端: return http.post(`/returns/${id}/reschedule`, { operatorId, newDate, remark })
    ReturnService.reschedule(id, operatorId, newDate, remark),

  refund: (
    id: string,
    operatorId: string,
    opts: { remark?: string; changes?: HistoryRecord['changes'] }
  ): Promise<ReturnReview> =>
    // 真实后端: return http.post(`/returns/${id}/refund`, { operatorId, ...opts })
    ReturnService.refund(id, operatorId, opts),

  exportList: (query: Omit<ReturnListQuery, 'page' | 'pageSize'>): Promise<ExportResult> =>
    // 真实后端: return http.download('/returns/export', query)
    ReturnService.exportList(query),

  exportDetail: (id: string): Promise<ExportResult> =>
    // 真实后端: return http.download(`/returns/${id}/export`)
    ReturnService.exportDetail(id),
}
