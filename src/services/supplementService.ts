import type {
  SupplementApplication,
  SupplementListQuery,
  PaginationResult,
  CreateSupplementParams,
  HistoryRecord,
  ExportResult,
  ActionType,
} from '@/types'
import { USERS } from '@/types'
import { mockSupplements, _genHistory, _amount } from './mockData'

const store: SupplementApplication[] = JSON.parse(JSON.stringify(mockSupplements))

function _find(id: string): SupplementApplication | undefined {
  return store.find(s => s.id === id)
}

function _touch(s: SupplementApplication) {
  s.updatedAt = new Date().toISOString()
}

function _pushHistory(
  s: SupplementApplication,
  action: ActionType,
  actionLabel: string,
  userId: string,
  opts: Partial<HistoryRecord> = {}
) {
  s.history.push(_genHistory(action, actionLabel, userId, opts))
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

function _sourceLabel(s: SupplementApplication['source']): string {
  return {
    sample_book: '样板册',
    measurement_sheet: '量房单',
    replenish_form: '补货申请单',
    other: '其他',
  }[s]
}

export const SupplementService = {
  // ========== 列表 / 查询 ==========
  async list(
    query: SupplementListQuery = { page: 1, pageSize: 10 }
  ): Promise<PaginationResult<SupplementApplication>> {
    await new Promise(r => setTimeout(r, 120))
    let data = [...store]
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      data = data.filter(
        s =>
          s.id.toLowerCase().includes(kw) ||
          s.orderNo.toLowerCase().includes(kw) ||
          s.customerName.includes(kw) ||
          s.customerPhone.includes(kw)
      )
    }
    if (query.status) {
      data = data.filter(s => s.status === query.status)
    }
    if (query.dateFrom) {
      data = data.filter(s => s.createdAt.slice(0, 10) >= query.dateFrom!)
    }
    if (query.dateTo) {
      data = data.filter(s => s.createdAt.slice(0, 10) <= query.dateTo!)
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

  // ========== 详情查询 ==========
  async detail(id: string): Promise<SupplementApplication | null> {
    await new Promise(r => setTimeout(r, 60))
    const s = _find(id)
    return s ? JSON.parse(JSON.stringify(s)) : null
  },

  // ========== 回看历史（只返回历史记录） ==========
  async history(id: string): Promise<HistoryRecord[] | null> {
    await new Promise(r => setTimeout(r, 40))
    const s = _find(id)
    if (!s) return null
    const history = [...s.history].sort((a, b) =>
      a.timestamp < b.timestamp ? 1 : -1
    )
    return JSON.parse(JSON.stringify(history))
  },

  // ========== 创建（导购） ==========
  async create(params: CreateSupplementParams): Promise<SupplementApplication> {
    await new Promise(r => setTimeout(r, 100))
    const guide = USERS.find(u => u.id === params.guideId)!
    const now = new Date().toISOString()
    const tiles = params.tiles.map(t => ({ ...t }))
    const s: SupplementApplication = {
      id: _genId('BZ'),
      orderNo: params.orderNo,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      address: params.address,
      projectName: params.projectName,
      guideId: params.guideId,
      guideName: guide.name,
      source: params.source,
      sourceLabel: _sourceLabel(params.source),
      sourceRefNo: params.sourceRefNo,
      reason: params.reason,
      tiles,
      totalAmount: _amount(tiles),
      expectedDeliveryDate: params.expectedDeliveryDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      history: [],
    }
    _pushHistory(s, 'create', '创建补砖申请', params.guideId, {
      toStatus: 'pending',
      remark: `来源：${s.sourceLabel}${params.sourceRefNo ? '，编号 ' + params.sourceRefNo : ''}`,
    })
    store.unshift(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 导购提交 ==========
  async submit(id: string, operatorId: string): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'designing'
    _pushHistory(s, 'submit', '提交设计师复核', operatorId, {
      fromStatus: from,
      toStatus: 'designing',
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 设计师开始量房复核 ==========
  async startDesign(id: string, operatorId: string, remark?: string): Promise<SupplementApplication> {
    const s = _find(id)!
    s.status = 'designing'
    _pushHistory(s, 'start_design', '开始量房复核', operatorId, { remark })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 设计师确认（正常流转到仓库） ==========
  async confirmDesign(
    id: string,
    operatorId: string,
    opts: { remark?: string; changes?: HistoryRecord['changes'] } = {}
  ): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'confirmed'
    _pushHistory(s, 'confirm_design', '设计师确认无误', operatorId, {
      fromStatus: from,
      toStatus: 'confirmed',
      remark: opts.remark,
      changes: opts.changes,
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 驳回（可由设计师、仓库任意角色操作） ==========
  async reject(
    id: string,
    operatorId: string,
    reason: string
  ): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'rejected'
    _pushHistory(s, 'reject', '驳回申请', operatorId, {
      fromStatus: from,
      toStatus: 'rejected',
      remark: reason,
      changes: [{ field: '驳回原因', oldValue: '', newValue: reason }],
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 补录（被驳回后修正信息） ==========
  async supplement(
    id: string,
    operatorId: string,
    opts: {
      remark: string
      changes?: HistoryRecord['changes']
      tiles?: SupplementApplication['tiles']
      expectedDeliveryDate?: string
    }
  ): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'supplemented'
    if (opts.tiles) {
      s.tiles = opts.tiles.map(t => ({ ...t }))
      s.totalAmount = _amount(s.tiles)
    }
    if (opts.expectedDeliveryDate) {
      s.expectedDeliveryDate = opts.expectedDeliveryDate
    }
    _pushHistory(s, 'supplement', '补录信息', operatorId, {
      fromStatus: from,
      toStatus: 'supplemented',
      remark: opts.remark,
      changes: opts.changes,
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 改期 ==========
  async reschedule(
    id: string,
    operatorId: string,
    newDate: string,
    remark: string
  ): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    const oldDate = s.expectedDeliveryDate
    s.status = 'rescheduled'
    s.expectedDeliveryDate = newDate
    _pushHistory(s, 'reschedule', '改期送达', operatorId, {
      fromStatus: from,
      toStatus: 'rescheduled',
      remark,
      changes: [
        { field: '期望送达日期', oldValue: oldDate, newValue: newDate },
      ],
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 仓库开始备货 ==========
  async startWarehouse(id: string, operatorId: string): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'warehousing'
    _pushHistory(s, 'start_warehouse', '仓库开始备货', operatorId, {
      fromStatus: from,
      toStatus: 'warehousing',
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 仓库发货 ==========
  async ship(
    id: string,
    operatorId: string,
    expressNo?: string,
    logisticsRemark?: string
  ): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'shipped'
    if (expressNo) s.expressNo = expressNo
    _pushHistory(s, 'ship', '安排发货', operatorId, {
      fromStatus: from,
      toStatus: 'shipped',
      remark: logisticsRemark || expressNo,
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 完成（客户签收） ==========
  async complete(
    id: string,
    operatorId: string,
    remark?: string
  ): Promise<SupplementApplication> {
    const s = _find(id)!
    const from = s.status
    s.status = 'completed'
    s.actualDeliveryDate = new Date().toISOString().slice(0, 10)
    _pushHistory(s, 'complete', '客户签收完成', operatorId, {
      fromStatus: from,
      toStatus: 'completed',
      remark,
    })
    _touch(s)
    return JSON.parse(JSON.stringify(s))
  },

  // ========== 导出 ==========
  async exportList(
    query: Omit<SupplementListQuery, 'page' | 'pageSize'> = {}
  ): Promise<ExportResult> {
    const { list } = await this.list({ ...query, page: 1, pageSize: 9999 })
    await new Promise(r => setTimeout(r, 200))
    const fileName = `补砖申请清单_${new Date().toISOString().slice(0, 10)}.xlsx`
    const url = `#download/supplements/${Date.now()}`
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
    const s = await this.detail(id)
    if (!s) throw new Error('NOT_FOUND')
    await new Promise(r => setTimeout(r, 150))
    const fileName = `补砖申请_${s.id}.xlsx`
    const url = `#download/supplement/${s.id}`
    return {
      taskId: 'EXP' + Date.now(),
      fileName,
      downloadUrl: url,
      url,
      fileSize: 2048 + s.tiles.length * 256,
      status: 'success',
      generatedAt: new Date().toISOString(),
      recordCount: 1,
    }
  },
}
