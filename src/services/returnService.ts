import type {
  ReturnReview,
  ReturnListQuery,
  PaginationResult,
  CreateReturnParams,
  HistoryRecord,
  ExportResult,
  ActionType,
  Role,
} from '@/types'
import { USERS } from '@/types'
import { mockReturns, _genHistory, _amount } from './mockData'

const store: ReturnReview[] = JSON.parse(JSON.stringify(mockReturns))

function _find(id: string): ReturnReview | undefined {
  return store.find(r => r.id === id)
}

function _touch(r: ReturnReview) {
  r.updatedAt = new Date().toISOString()
}

function _pushHistory(
  r: ReturnReview,
  action: ActionType,
  actionLabel: string,
  userId: string,
  opts: Partial<HistoryRecord> = {}
) {
  r.history.push(_genHistory(action, actionLabel, userId, opts))
}

function _roleName(role: Role): string {
  return { guide: '导购', designer: '设计师', warehouse: '仓库员' }[role]
}

function _genId(prefix: string): string {
  const now = new Date()
  const ymd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const seq = String(store.length + 1).padStart(3, '0')
  return `${prefix}${ymd}${seq}`
}

export const ReturnService = {
  async list(
    query: ReturnListQuery = { page: 1, pageSize: 10 }
  ): Promise<PaginationResult<ReturnReview>> {
    await new Promise(r => setTimeout(r, 120))
    let data = [...store]
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      data = data.filter(
        r =>
          r.id.toLowerCase().includes(kw) ||
          r.orderNo.toLowerCase().includes(kw) ||
          (r.supplementId && r.supplementId.toLowerCase().includes(kw)) ||
          r.customerName.includes(kw) ||
          r.customerPhone.includes(kw)
      )
    }
    if (query.status) {
      data = data.filter(r => r.status === query.status)
    }
    if (query.dateFrom) {
      data = data.filter(r => r.createdAt.slice(0, 10) >= query.dateFrom!)
    }
    if (query.dateTo) {
      data = data.filter(r => r.createdAt.slice(0, 10) <= query.dateTo!)
    }
    data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    const total = data.length
    const start = (query.page - 1) * query.pageSize
    return {
      list: data.slice(start, start + query.pageSize),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  },

  async detail(id: string): Promise<ReturnReview | null> {
    await new Promise(r => setTimeout(r, 60))
    const r = _find(id)
    return r ? JSON.parse(JSON.stringify(r)) : null
  },

  async history(id: string): Promise<HistoryRecord[] | null> {
    await new Promise(r => setTimeout(r, 40))
    const r = _find(id)
    if (!r) return null
    const history = [...r.history].sort((a, b) =>
      a.timestamp < b.timestamp ? 1 : -1
    )
    return JSON.parse(JSON.stringify(history))
  },

  async create(params: CreateReturnParams): Promise<ReturnReview> {
    await new Promise(r => setTimeout(r, 100))
    const applicant = USERS.find(u => u.id === params.applicantId)!
    const now = new Date().toISOString()
    const tiles = params.tiles.map(t => ({ ...t }))
    const r: ReturnReview = {
      id: _genId('TH'),
      orderNo: params.orderNo,
      supplementId: params.supplementId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      address: params.address,
      applicantId: params.applicantId,
      applicantName: applicant.name,
      applicantRole: applicant.role,
      reason: params.reason,
      tiles,
      totalAmount: _amount(tiles),
      pickupDate: params.pickupDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      history: [],
    }
    _pushHistory(r, 'create', '创建退货申请', params.applicantId, {
      toStatus: 'pending',
      remark: params.supplementId
        ? `关联补砖单 ${params.supplementId}`
        : '独立退货申请',
    })
    store.unshift(r)
    return JSON.parse(JSON.stringify(r))
  },

  async inspect(
    id: string,
    operatorId: string,
    opts: { remark?: string; warehouseId?: string } = {}
  ): Promise<ReturnReview> {
    const r = _find(id)!
    const from = r.status
    r.status = 'inspecting'
    if (opts.warehouseId) {
      const wh = USERS.find(u => u.id === opts.warehouseId)!
      r.warehouseId = opts.warehouseId
      r.warehouseName = wh.name
    }
    _pushHistory(r, 'inspect', '仓库验货', operatorId, {
      fromStatus: from,
      toStatus: 'inspecting',
      remark: opts.remark,
    })
    _touch(r)
    return JSON.parse(JSON.stringify(r))
  },

  async pass(
    id: string,
    operatorId: string,
    opts: {
      remark?: string
      inspectionResult?: string
      changes?: HistoryRecord['changes']
    } = {}
  ): Promise<ReturnReview> {
    const r = _find(id)!
    const from = r.status
    r.status = 'confirmed'
    if (opts.inspectionResult) {
      r.inspectionResult = opts.inspectionResult
    }
    _pushHistory(r, 'pass', '复核通过', operatorId, {
      fromStatus: from,
      toStatus: 'confirmed',
      remark: opts.remark,
      changes: opts.changes,
    })
    _touch(r)
    return JSON.parse(JSON.stringify(r))
  },

  async reject(
    id: string,
    operatorId: string,
    reason: string
  ): Promise<ReturnReview> {
    const r = _find(id)!
    const from = r.status
    r.status = 'rejected'
    r.rejectReason = reason
    _pushHistory(r, 'reject', '复核驳回', operatorId, {
      fromStatus: from,
      toStatus: 'rejected',
      remark: reason,
      changes: [{ field: '驳回原因', oldValue: r.rejectReason || '', newValue: reason }],
    })
    _touch(r)
    return JSON.parse(JSON.stringify(r))
  },

  async supplement(
    id: string,
    operatorId: string,
    opts: {
      remark: string
      changes?: HistoryRecord['changes']
      tiles?: ReturnReview['tiles']
      inspectionResult?: string
      attachments?: HistoryRecord['attachments']
    }
  ): Promise<ReturnReview> {
    const r = _find(id)!
    const from = r.status
    r.status = 'supplemented'
    if (opts.tiles) {
      r.tiles = opts.tiles.map(t => ({ ...t }))
      r.totalAmount = _amount(r.tiles)
    }
    if (opts.inspectionResult) {
      r.inspectionResult = opts.inspectionResult
    }
    _pushHistory(r, 'supplement', '补录信息', operatorId, {
      fromStatus: from,
      toStatus: 'supplemented',
      remark: opts.remark,
      changes: opts.changes,
      attachments: opts.attachments,
    })
    _touch(r)
    return JSON.parse(JSON.stringify(r))
  },

  async reschedule(
    id: string,
    operatorId: string,
    newDate: string,
    remark: string
  ): Promise<ReturnReview> {
    const r = _find(id)!
    const from = r.status
    const oldDate = r.pickupDate
    r.status = 'rescheduled'
    r.pickupDate = newDate
    _pushHistory(r, 'reschedule', '改期取货', operatorId, {
      fromStatus: from,
      toStatus: 'rescheduled',
      remark,
      changes: [
        { field: '预约取货日期', oldValue: oldDate, newValue: newDate },
      ],
    })
    _touch(r)
    return JSON.parse(JSON.stringify(r))
  },

  async refund(
    id: string,
    operatorId: string,
    opts: { remark?: string; changes?: HistoryRecord['changes'] } = {}
  ): Promise<ReturnReview> {
    const r = _find(id)!
    const from = r.status
    r.status = 'refunded'
    _pushHistory(r, 'refund', '退款完成', operatorId, {
      fromStatus: from,
      toStatus: 'refunded',
      remark: opts.remark,
      changes: opts.changes,
    })
    _touch(r)
    return JSON.parse(JSON.stringify(r))
  },

  async exportList(
    query: Omit<ReturnListQuery, 'page' | 'pageSize'> = {}
  ): Promise<ExportResult> {
    const { list } = await this.list({ ...query, page: 1, pageSize: 9999 })
    await new Promise(r => setTimeout(r, 200))
    const fileName = `退货复核清单_${new Date().toISOString().slice(0, 10)}.xlsx`
    const url = `#download/returns/${Date.now()}`
    return {
      taskId: 'EXP' + Date.now(),
      fileName,
      downloadUrl: url,
      url,
      fileSize: list.length * 256 + 1024,
      status: 'success',
      generatedAt: new Date().toISOString(),
      recordCount: list.length,
    }
  },

  async exportDetail(id: string): Promise<ExportResult> {
    const r = await this.detail(id)
    if (!r) throw new Error('NOT_FOUND')
    await new Promise(r => setTimeout(r, 150))
    const fileName = `退货复核_${r.id}.xlsx`
    const url = `#download/return/${r.id}`
    return {
      taskId: 'EXP' + Date.now(),
      fileName,
      downloadUrl: url,
      url,
      fileSize: 2048 + r.tiles.length * 256,
      status: 'success',
      generatedAt: new Date().toISOString(),
      recordCount: 1,
    }
  },
}
