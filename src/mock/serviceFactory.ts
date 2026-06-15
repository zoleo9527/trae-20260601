import type {
  SupplementApplication,
  SupplementListQuery,
  PaginationResult,
  CreateSupplementParams,
  HistoryRecord,
  ExportResult,
  ActionType,
  ReturnReview,
  ReturnListQuery,
  CreateReturnParams,
  TileItem,
} from '@/types'
import { USERS } from '@/types'
import { mockSupplements, mockReturns, _genHistory, _amount } from '@/services/mockData'

export type MockDB = {
  supplements: {
    list: () => SupplementApplication[]
    find: (id: string) => SupplementApplication | undefined
    insert: (item: SupplementApplication) => SupplementApplication
    update: (id: string, item: SupplementApplication) => SupplementApplication
    initIfEmpty: (seedData: SupplementApplication[]) => void
    reset: (seedData?: SupplementApplication[]) => void
  }
  returns: {
    list: () => ReturnReview[]
    find: (id: string) => ReturnReview | undefined
    insert: (item: ReturnReview) => ReturnReview
    update: (id: string, item: ReturnReview) => ReturnReview
    initIfEmpty: (seedData: ReturnReview[]) => void
    reset: (seedData?: ReturnReview[]) => void
  }
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function _touch(s: { updatedAt: string }) {
  s.updatedAt = new Date().toISOString()
}

function _pushHistory(
  s: { history: HistoryRecord[] },
  action: ActionType,
  actionLabel: string,
  userId: string,
  opts: Partial<HistoryRecord> = {}
) {
  s.history.push(_genHistory(action, actionLabel, userId, opts))
}

function _sourceLabel(s: SupplementApplication['source']): string {
  return {
    sample_book: '样板册',
    measurement_sheet: '量房单',
    replenish_form: '补货申请单',
    other: '其他',
  }[s]
}

export function createMockService(db: MockDB, options?: { delay?: boolean | number }) {
  const useDelay = options?.delay !== false
  const defaultDelay = typeof options?.delay === 'number' ? options.delay : 80

  async function delay(ms?: number): Promise<void> {
    if (!useDelay) return
    const wait = ms ?? defaultDelay
    return new Promise(r => setTimeout(r, wait))
  }

  return {
    init: () => {
      db.supplements.initIfEmpty(clone(mockSupplements))
      db.returns.initIfEmpty(clone(mockReturns))
    },

    reset: () => {
      db.supplements.reset(clone(mockSupplements))
      db.returns.reset(clone(mockReturns))
    },

    supplements: {
      async list(
        query: SupplementListQuery = { page: 1, pageSize: 10 }
      ): Promise<PaginationResult<SupplementApplication>> {
        await delay(100)
        let data = db.supplements.list()
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
        const page = query.page || 1
        const pageSize = query.pageSize || 10
        const start = (page - 1) * pageSize
        return {
          list: data.slice(start, start + pageSize),
          total,
          page,
          pageSize,
        }
      },

      async detail(id: string): Promise<SupplementApplication | null> {
        await delay(60)
        const s = db.supplements.find(id)
        return s ? clone(s) : null
      },

      async history(id: string): Promise<HistoryRecord[] | null> {
        await delay(40)
        const s = db.supplements.find(id)
        if (!s) return null
        const history = clone(s.history)
        history.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
        return history
      },

      async create(params: CreateSupplementParams): Promise<SupplementApplication> {
        await delay(150)
        const list = db.supplements.list()
        const now = new Date()
        const ymd =
          now.getFullYear().toString() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0')
        const seq = String(list.length + 1).padStart(3, '0')
        const id = `BZ${ymd}${seq}`

        const totalAmount = _amount(params.tiles)
        const guide = USERS.find(u => u.id === params.guideId)
        const nowStr = now.toISOString()

        const created: SupplementApplication = {
          id,
          orderNo: params.orderNo,
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          address: params.address,
          projectName: params.projectName,
          guideId: params.guideId,
          guideName: guide?.name || '导购员',
          source: params.source,
          sourceLabel: _sourceLabel(params.source),
          sourceRefNo: params.sourceRefNo,
          reason: params.reason,
          tiles: params.tiles,
          totalAmount,
          expectedDeliveryDate: params.expectedDeliveryDate,
          status: 'pending',
          createdAt: nowStr,
          updatedAt: nowStr,
          history: [
            _genHistory('create', '创建补砖申请', params.guideId, {
              changes: [
                { field: '补砖原因', oldValue: '', newValue: params.reason },
                { field: '期望送达日期', oldValue: '', newValue: params.expectedDeliveryDate },
                { field: '瓷砖数量', oldValue: '', newValue: String(params.tiles.reduce((s, t) => s + t.quantity, 0)) },
              ],
            }),
          ],
        }
        return db.supplements.insert(created)
      },

      async submit(id: string, operatorId: string): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        s.status = 'designing'
        _pushHistory(s, 'submit', '提交设计师复核', operatorId, {
          fromStatus: from,
          toStatus: 'designing',
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async startDesign(id: string, operatorId: string, remark?: string): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        const designer = USERS.find(u => u.id === operatorId)
        s.status = 'designing'
        s.designerId = operatorId
        s.designerName = designer?.name || '设计师'
        _pushHistory(s, 'start_design', '开始量房设计', operatorId, {
          fromStatus: from,
          toStatus: 'designing',
          remark,
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async confirmDesign(
        id: string,
        operatorId: string,
        opts: { remark?: string; changes?: HistoryRecord['changes'] }
      ): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        s.status = 'confirmed'
        _pushHistory(s, 'confirm_design', '设计师复核通过', operatorId, {
          fromStatus: from,
          toStatus: 'confirmed',
          remark: opts.remark,
          changes: opts.changes,
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async reject(id: string, operatorId: string, reason: string): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        s.status = 'rejected'
        _pushHistory(s, 'reject', `驳回：${reason}`, operatorId, {
          fromStatus: from,
          toStatus: 'rejected',
          changes: [{ field: '驳回原因', oldValue: '', newValue: reason }],
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async supplement(
        id: string,
        operatorId: string,
        opts: {
          remark: string
          changes?: HistoryRecord['changes']
          tiles?: TileItem[]
          expectedDeliveryDate?: string
        }
      ): Promise<SupplementApplication> {
        await delay(100)
        const s = db.supplements.find(id)!
        const from = s.status
        if (opts.tiles) {
          s.tiles = opts.tiles
          s.totalAmount = _amount(opts.tiles)
        }
        if (opts.expectedDeliveryDate) {
          s.expectedDeliveryDate = opts.expectedDeliveryDate
        }
        s.status = 'supplemented'
        _pushHistory(s, 'supplement', '补录信息', operatorId, {
          fromStatus: from,
          toStatus: 'supplemented',
          remark: opts.remark,
          changes: opts.changes,
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async reschedule(
        id: string,
        operatorId: string,
        newDate: string,
        remark: string
      ): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        const oldDate = s.expectedDeliveryDate
        s.expectedDeliveryDate = newDate
        s.status = 'rescheduled'
        _pushHistory(s, 'reschedule', '改期', operatorId, {
          fromStatus: from,
          toStatus: 'rescheduled',
          remark,
          changes: [{ field: '期望送达日期', oldValue: oldDate, newValue: newDate }],
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async startWarehouse(id: string, operatorId: string): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        s.status = 'warehousing'
        _pushHistory(s, 'start_warehouse', '仓库开始备货', operatorId, {
          fromStatus: from,
          toStatus: 'warehousing',
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async ship(
        id: string,
        operatorId: string,
        expressNo?: string,
        logisticsRemark?: string
      ): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        s.status = 'shipped'
        if (expressNo) s.expressNo = expressNo
        _pushHistory(s, 'ship', '安排发货', operatorId, {
          fromStatus: from,
          toStatus: 'shipped',
          remark: logisticsRemark || expressNo,
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async complete(
        id: string,
        operatorId: string,
        remark?: string
      ): Promise<SupplementApplication> {
        await delay(80)
        const s = db.supplements.find(id)!
        const from = s.status
        s.status = 'completed'
        s.actualDeliveryDate = new Date().toISOString().slice(0, 10)
        _pushHistory(s, 'complete', '客户签收完成', operatorId, {
          fromStatus: from,
          toStatus: 'completed',
          remark,
        })
        _touch(s)
        return db.supplements.update(id, s)
      },

      async exportList(query: Omit<SupplementListQuery, 'page' | 'pageSize'>): Promise<ExportResult> {
        await delay(300)
        const res = await this.list({ ...query, page: 1, pageSize: 9999 })
        const now = new Date()
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        const fileName = `补砖申请清单_${ts}.xlsx`
        return {
          status: 'success',
          fileName,
          url: `#export-supplements-${ts}`,
          downloadUrl: `#export-supplements-${ts}`,
          taskId: `export-supplements-${ts}`,
          fileSize: 1024 * res.total,
          generatedAt: now.toISOString(),
          recordCount: res.total,
        }
      },

      async exportDetail(id: string): Promise<ExportResult> {
        await delay(200)
        const s = await this.detail(id)
        const now = new Date()
        if (!s) {
          return {
            status: 'error',
            fileName: '',
            url: '',
            downloadUrl: '',
            taskId: '',
            fileSize: 0,
            generatedAt: now.toISOString(),
            recordCount: 0,
          }
        }
        const fileName = `补砖申请_${id}.xlsx`
        return {
          status: 'success',
          fileName,
          url: `#export-supplement-${id}`,
          downloadUrl: `#export-supplement-${id}`,
          taskId: `export-supplement-${id}`,
          fileSize: 2048,
          generatedAt: now.toISOString(),
          recordCount: 1,
        }
      },
    },

    returns: {
      async list(
        query: ReturnListQuery = { page: 1, pageSize: 10 }
      ): Promise<PaginationResult<ReturnReview>> {
        await delay(100)
        let data = db.returns.list()
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
        const page = query.page || 1
        const pageSize = query.pageSize || 10
        const start = (page - 1) * pageSize
        return {
          list: data.slice(start, start + pageSize),
          total,
          page,
          pageSize,
        }
      },

      async detail(id: string): Promise<ReturnReview | null> {
        await delay(60)
        const r = db.returns.find(id)
        return r ? clone(r) : null
      },

      async history(id: string): Promise<HistoryRecord[] | null> {
        await delay(40)
        const r = db.returns.find(id)
        if (!r) return null
        const history = clone(r.history)
        history.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
        return history
      },

      async create(params: CreateReturnParams): Promise<ReturnReview> {
        await delay(150)
        const list = db.returns.list()
        const now = new Date()
        const ymd =
          now.getFullYear().toString() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0')
        const seq = String(list.length + 1).padStart(3, '0')
        const id = `TH${ymd}${seq}`

        const totalAmount = _amount(params.tiles)
        const applicant = USERS.find(u => u.id === params.applicantId)
        const nowStr = now.toISOString()

        const created: ReturnReview = {
          id,
          orderNo: params.orderNo,
          supplementId: params.supplementId,
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          address: params.address,
          applicantId: params.applicantId,
          applicantName: applicant?.name || '导购员',
          applicantRole: applicant?.role || 'guide',
          reason: params.reason,
          tiles: params.tiles,
          totalAmount,
          pickupDate: params.pickupDate,
          status: 'pending',
          createdAt: nowStr,
          updatedAt: nowStr,
          history: [
            _genHistory('create', '创建退货申请', params.applicantId, {
              changes: [
                { field: '退货原因', oldValue: '', newValue: params.reason },
                { field: '预约取货日期', oldValue: '', newValue: params.pickupDate },
                { field: '退货数量', oldValue: '', newValue: String(params.tiles.reduce((s, t) => s + t.quantity, 0)) },
              ],
            }),
          ],
        }
        return db.returns.insert(created)
      },

      async inspect(
        id: string,
        operatorId: string,
        opts: { remark?: string; warehouseId?: string }
      ): Promise<ReturnReview> {
        await delay(80)
        const r = db.returns.find(id)!
        const from = r.status
        const warehouse = USERS.find(u => u.id === (opts.warehouseId || operatorId))
        r.status = 'inspecting'
        r.warehouseId = opts.warehouseId || operatorId
        r.warehouseName = warehouse?.name || '仓库员'
        _pushHistory(r, 'inspect', '启动仓库验货', operatorId, {
          fromStatus: from,
          toStatus: 'inspecting',
          remark: opts.remark,
        })
        _touch(r)
        return db.returns.update(id, r)
      },

      async pass(
        id: string,
        operatorId: string,
        opts: {
          remark?: string
          inspectionResult?: string
          changes?: HistoryRecord['changes']
        }
      ): Promise<ReturnReview> {
        await delay(80)
        const r = db.returns.find(id)!
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
        return db.returns.update(id, r)
      },

      async reject(id: string, operatorId: string, reason: string): Promise<ReturnReview> {
        await delay(80)
        const r = db.returns.find(id)!
        const from = r.status
        r.status = 'rejected'
        r.rejectReason = reason
        _pushHistory(r, 'reject', `驳回：${reason}`, operatorId, {
          fromStatus: from,
          toStatus: 'rejected',
          changes: [{ field: '驳回原因', oldValue: '', newValue: reason }],
        })
        _touch(r)
        return db.returns.update(id, r)
      },

      async supplement(
        id: string,
        operatorId: string,
        opts: {
          remark: string
          changes?: HistoryRecord['changes']
          tiles?: TileItem[]
          inspectionResult?: string
          attachments?: HistoryRecord['attachments']
        }
      ): Promise<ReturnReview> {
        await delay(100)
        const r = db.returns.find(id)!
        const from = r.status
        if (opts.tiles) {
          r.tiles = opts.tiles
          r.totalAmount = _amount(opts.tiles)
        }
        if (opts.inspectionResult) {
          r.inspectionResult = opts.inspectionResult
        }
        r.status = 'supplemented'
        _pushHistory(r, 'supplement', '补录信息', operatorId, {
          fromStatus: from,
          toStatus: 'supplemented',
          remark: opts.remark,
          changes: opts.changes,
          attachments: opts.attachments,
        })
        _touch(r)
        return db.returns.update(id, r)
      },

      async reschedule(
        id: string,
        operatorId: string,
        newDate: string,
        remark: string
      ): Promise<ReturnReview> {
        await delay(80)
        const r = db.returns.find(id)!
        const from = r.status
        const oldDate = r.pickupDate
        r.pickupDate = newDate
        r.status = 'rescheduled'
        _pushHistory(r, 'reschedule', '改期', operatorId, {
          fromStatus: from,
          toStatus: 'rescheduled',
          remark,
          changes: [{ field: '取货日期', oldValue: oldDate, newValue: newDate }],
        })
        _touch(r)
        return db.returns.update(id, r)
      },

      async refund(
        id: string,
        operatorId: string,
        opts: { remark?: string; changes?: HistoryRecord['changes'] }
      ): Promise<ReturnReview> {
        await delay(100)
        const r = db.returns.find(id)!
        const from = r.status
        r.status = 'refunded'
        _pushHistory(r, 'refund', '退款完成', operatorId, {
          fromStatus: from,
          toStatus: 'refunded',
          remark: opts.remark,
          changes: opts.changes,
        })
        _touch(r)
        return db.returns.update(id, r)
      },

      async exportList(query: Omit<ReturnListQuery, 'page' | 'pageSize'>): Promise<ExportResult> {
        await delay(300)
        const res = await this.list({ ...query, page: 1, pageSize: 9999 })
        const now = new Date()
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        const fileName = `退货复核清单_${ts}.xlsx`
        return {
          status: 'success',
          fileName,
          url: `#export-returns-${ts}`,
          downloadUrl: `#export-returns-${ts}`,
          taskId: `export-returns-${ts}`,
          fileSize: 1024 * res.total,
          generatedAt: now.toISOString(),
          recordCount: res.total,
        }
      },

      async exportDetail(id: string): Promise<ExportResult> {
        await delay(200)
        const r = await this.detail(id)
        const now = new Date()
        if (!r) {
          return {
            status: 'error',
            fileName: '',
            url: '',
            downloadUrl: '',
            taskId: '',
            fileSize: 0,
            generatedAt: now.toISOString(),
            recordCount: 0,
          }
        }
        const fileName = `退货复核_${id}.xlsx`
        return {
          status: 'success',
          fileName,
          url: `#export-return-${id}`,
          downloadUrl: `#export-return-${id}`,
          taskId: `export-return-${id}`,
          fileSize: 2048,
          generatedAt: now.toISOString(),
          recordCount: 1,
        }
      },
    },
  }
}

export type MockService = ReturnType<typeof createMockService>
