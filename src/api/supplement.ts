import type {
  SupplementApplication,
  SupplementListQuery,
  PaginationResult,
  CreateSupplementParams,
  HistoryRecord,
  ExportResult,
} from '@/types'
import { SupplementService } from '@/services/supplementService'

/**
 * 补砖申请 API
 * 协议层：所有接口都以标准 HTTP 请求形式封装
 * 实际后端对接时，只需将下面的 Service 调用替换为 http.get/post 即可
 */
export const SupplementApi = {
  list: (query: SupplementListQuery): Promise<PaginationResult<SupplementApplication>> =>
    // 真实后端: return http.get('/supplements', query)
    SupplementService.list(query),

  detail: (id: string): Promise<SupplementApplication | null> =>
    // 真实后端: return http.get(`/supplements/${id}`)
    SupplementService.detail(id),

  history: (id: string): Promise<HistoryRecord[] | null> =>
    // 真实后端: return http.get(`/supplements/${id}/history`)
    SupplementService.history(id),

  create: (params: CreateSupplementParams): Promise<SupplementApplication> =>
    // 真实后端: return http.post('/supplements', params)
    SupplementService.create(params),

  submit: (id: string, operatorId: string): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/submit`, { operatorId })
    SupplementService.submit(id, operatorId),

  startDesign: (id: string, operatorId: string, remark?: string): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/start-design`, { operatorId, remark })
    SupplementService.startDesign(id, operatorId, remark),

  confirmDesign: (
    id: string,
    operatorId: string,
    opts: { remark?: string; changes?: HistoryRecord['changes'] }
  ): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/confirm-design`, { operatorId, ...opts })
    SupplementService.confirmDesign(id, operatorId, opts),

  reject: (id: string, operatorId: string, reason: string): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/reject`, { operatorId, reason })
    SupplementService.reject(id, operatorId, reason),

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
    // 真实后端: return http.post(`/supplements/${id}/supplement`, { operatorId, ...opts })
    SupplementService.supplement(id, operatorId, opts),

  reschedule: (
    id: string,
    operatorId: string,
    newDate: string,
    remark: string
  ): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/reschedule`, { operatorId, newDate, remark })
    SupplementService.reschedule(id, operatorId, newDate, remark),

  startWarehouse: (id: string, operatorId: string): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/start-warehouse`, { operatorId })
    SupplementService.startWarehouse(id, operatorId),

  ship: (
    id: string,
    operatorId: string,
    expressNo?: string,
    logisticsRemark?: string
  ): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/ship`, { operatorId, expressNo, logisticsRemark })
    SupplementService.ship(id, operatorId, expressNo, logisticsRemark),

  complete: (
    id: string,
    operatorId: string,
    remark?: string
  ): Promise<SupplementApplication> =>
    // 真实后端: return http.post(`/supplements/${id}/complete`, { operatorId, remark })
    SupplementService.complete(id, operatorId, remark),

  exportList: (query: Omit<SupplementListQuery, 'page' | 'pageSize'>): Promise<ExportResult> =>
    // 真实后端: return http.download('/supplements/export', query)
    SupplementService.exportList(query),

  exportDetail: (id: string): Promise<ExportResult> =>
    // 真实后端: return http.download(`/supplements/${id}/export`)
    SupplementService.exportDetail(id),
}
