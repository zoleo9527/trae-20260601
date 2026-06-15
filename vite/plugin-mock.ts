import type { Plugin, ViteDevServer } from 'vite'
import {
  mockSupplements,
  mockReturns,
  _genHistory,
  _amount,
  USERS,
  type SupplementApplication,
  type ReturnReview,
  type HistoryRecord,
  type TileItem,
  type SupplementStatus,
  type ReturnStatus,
  type ActionType,
} from './mock-data'

type Store = {
  supplements: SupplementApplication[]
  returns: ReturnReview[]
}

const store: Store = {
  supplements: JSON.parse(JSON.stringify(mockSupplements)),
  returns: JSON.parse(JSON.stringify(mockReturns)),
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

const supplementsApi = {
  list(query: any) {
    let data = clone(store.supplements)
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      data = data.filter(
        (s: SupplementApplication) =>
          s.id.toLowerCase().includes(kw) ||
          s.orderNo.toLowerCase().includes(kw) ||
          s.customerName.includes(kw) ||
          s.customerPhone.includes(kw)
      )
    }
    if (query.status) {
      data = data.filter((s: SupplementApplication) => s.status === query.status)
    }
    if (query.dateFrom) {
      data = data.filter((s: SupplementApplication) => s.createdAt.slice(0, 10) >= query.dateFrom)
    }
    if (query.dateTo) {
      data = data.filter((s: SupplementApplication) => s.createdAt.slice(0, 10) <= query.dateTo)
    }
    data.sort((a: SupplementApplication, b: SupplementApplication) =>
      a.createdAt < b.createdAt ? 1 : -1
    )
    const total = data.length
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    const start = (page - 1) * pageSize
    return {
      list: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    }
  },

  detail(id: string) {
    const s = store.supplements.find(x => x.id === id)
    return s ? clone(s) : null
  },

  history(id: string) {
    const s = store.supplements.find(x => x.id === id)
    if (!s) return null
    const history = clone(s.history)
    history.sort((a: HistoryRecord, b: HistoryRecord) =>
      a.timestamp < b.timestamp ? 1 : -1
    )
    return history
  },

  create(params: any) {
    const list = store.supplements
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
            { field: '瓷砖数量', oldValue: '', newValue: String(params.tiles.reduce((s: number, t: TileItem) => s + t.quantity, 0)) },
          ],
        }),
      ],
    }
    store.supplements.unshift(created)
    return clone(created)
  },

  submit(id: string, operatorId: string) {
    const s = store.supplements.find(x => x.id === id)!
    const from = s.status
    s.status = 'designing'
    _pushHistory(s, 'submit', '提交设计师复核', operatorId, {
      fromStatus: from,
      toStatus: 'designing',
    })
    _touch(s)
    return clone(s)
  },

  startDesign(id: string, operatorId: string, remark?: string) {
    const s = store.supplements.find(x => x.id === id)!
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
    return clone(s)
  },

  confirmDesign(id: string, operatorId: string, opts: any) {
    const s = store.supplements.find(x => x.id === id)!
    const from = s.status
    s.status = 'confirmed'
    _pushHistory(s, 'confirm_design', '设计师复核通过', operatorId, {
      fromStatus: from,
      toStatus: 'confirmed',
      remark: opts.remark,
      changes: opts.changes,
    })
    _touch(s)
    return clone(s)
  },

  reject(id: string, operatorId: string, reason: string) {
    const s = store.supplements.find(x => x.id === id)!
    const from = s.status
    s.status = 'rejected'
    _pushHistory(s, 'reject', `驳回：${reason}`, operatorId, {
      fromStatus: from,
      toStatus: 'rejected',
      changes: [{ field: '驳回原因', oldValue: '', newValue: reason }],
    })
    _touch(s)
    return clone(s)
  },

  supplement(id: string, operatorId: string, opts: any) {
    const s = store.supplements.find(x => x.id === id)!
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
    return clone(s)
  },

  reschedule(id: string, operatorId: string, newDate: string, remark: string) {
    const s = store.supplements.find(x => x.id === id)!
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
    return clone(s)
  },

  startWarehouse(id: string, operatorId: string) {
    const s = store.supplements.find(x => x.id === id)!
    const from = s.status
    s.status = 'warehousing'
    _pushHistory(s, 'start_warehouse', '仓库开始备货', operatorId, {
      fromStatus: from,
      toStatus: 'warehousing',
    })
    _touch(s)
    return clone(s)
  },

  ship(id: string, operatorId: string, expressNo?: string, logisticsRemark?: string) {
    const s = store.supplements.find(x => x.id === id)!
    const from = s.status
    s.status = 'shipped'
    if (expressNo) s.expressNo = expressNo
    _pushHistory(s, 'ship', '安排发货', operatorId, {
      fromStatus: from,
      toStatus: 'shipped',
      remark: logisticsRemark || expressNo,
    })
    _touch(s)
    return clone(s)
  },

  complete(id: string, operatorId: string, remark?: string) {
    const s = store.supplements.find(x => x.id === id)!
    const from = s.status
    s.status = 'completed'
    s.actualDeliveryDate = new Date().toISOString().slice(0, 10)
    _pushHistory(s, 'complete', '客户签收完成', operatorId, {
      fromStatus: from,
      toStatus: 'completed',
      remark,
    })
    _touch(s)
    return clone(s)
  },

  exportList(query: any) {
    const res = this.list({ ...query, page: 1, pageSize: 9999 })
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

  exportDetail(id: string) {
    const s = this.detail(id)
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
}

const returnsApi = {
  list(query: any) {
    let data = clone(store.returns)
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      data = data.filter(
        (r: ReturnReview) =>
          r.id.toLowerCase().includes(kw) ||
          r.orderNo.toLowerCase().includes(kw) ||
          (r.supplementId && r.supplementId.toLowerCase().includes(kw)) ||
          r.customerName.includes(kw) ||
          r.customerPhone.includes(kw)
      )
    }
    if (query.status) {
      data = data.filter((r: ReturnReview) => r.status === query.status)
    }
    if (query.dateFrom) {
      data = data.filter((r: ReturnReview) => r.createdAt.slice(0, 10) >= query.dateFrom)
    }
    if (query.dateTo) {
      data = data.filter((r: ReturnReview) => r.createdAt.slice(0, 10) <= query.dateTo)
    }
    data.sort((a: ReturnReview, b: ReturnReview) =>
      a.createdAt < b.createdAt ? 1 : -1
    )
    const total = data.length
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    const start = (page - 1) * pageSize
    return {
      list: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    }
  },

  detail(id: string) {
    const r = store.returns.find(x => x.id === id)
    return r ? clone(r) : null
  },

  history(id: string) {
    const r = store.returns.find(x => x.id === id)
    if (!r) return null
    const history = clone(r.history)
    history.sort((a: HistoryRecord, b: HistoryRecord) =>
      a.timestamp < b.timestamp ? 1 : -1
    )
    return history
  },

  create(params: any) {
    const list = store.returns
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
            { field: '退货数量', oldValue: '', newValue: String(params.tiles.reduce((s: number, t: TileItem) => s + t.quantity, 0)) },
          ],
        }),
      ],
    }
    store.returns.unshift(created)
    return clone(created)
  },

  inspect(id: string, operatorId: string, opts: any) {
    const r = store.returns.find(x => x.id === id)!
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
    return clone(r)
  },

  pass(id: string, operatorId: string, opts: any) {
    const r = store.returns.find(x => x.id === id)!
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
    return clone(r)
  },

  reject(id: string, operatorId: string, reason: string) {
    const r = store.returns.find(x => x.id === id)!
    const from = r.status
    r.status = 'rejected'
    r.rejectReason = reason
    _pushHistory(r, 'reject', `驳回：${reason}`, operatorId, {
      fromStatus: from,
      toStatus: 'rejected',
      changes: [{ field: '驳回原因', oldValue: '', newValue: reason }],
    })
    _touch(r)
    return clone(r)
  },

  supplement(id: string, operatorId: string, opts: any) {
    const r = store.returns.find(x => x.id === id)!
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
    return clone(r)
  },

  reschedule(id: string, operatorId: string, newDate: string, remark: string) {
    const r = store.returns.find(x => x.id === id)!
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
    return clone(r)
  },

  refund(id: string, operatorId: string, opts: any) {
    const r = store.returns.find(x => x.id === id)!
    const from = r.status
    r.status = 'refunded'
    _pushHistory(r, 'refund', '退款完成', operatorId, {
      fromStatus: from,
      toStatus: 'refunded',
      remark: opts.remark,
      changes: opts.changes,
    })
    _touch(r)
    return clone(r)
  },

  exportList(query: any) {
    const res = this.list({ ...query, page: 1, pageSize: 9999 })
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

  exportDetail(id: string) {
    const r = this.detail(id)
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
}

function ok(data: any, message = 'ok') {
  return { code: 0, message, data }
}

function fail(message: string, code = 1) {
  return { code, message, data: null }
}

function notFound(message = '资源不存在') {
  return { code: 404, message, data: null }
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

function parseQuery(url: string): Record<string, string> {
  const query: Record<string, string> = {}
  const qs = url.split('?')[1]
  if (!qs) return query
  for (const pair of qs.split('&')) {
    const [k, v] = pair.split('=')
    if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return query
}

function sendJson(res: any, data: any, statusCode = 200) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.end(JSON.stringify(data))
}

async function handleSupplementRoutes(pathname: string, method: string, query: Record<string, string>, body: any, res: any) {
  if (pathname === '/api/supplements' && method === 'GET') {
    const result = supplementsApi.list(query)
    sendJson(res, ok(result))
    return true
  }

  if (pathname === '/api/supplements' && method === 'POST') {
    try {
      const result = supplementsApi.create(body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '创建失败'), 400)
    }
    return true
  }

  if (pathname === '/api/supplements/export' && method === 'GET') {
    const result = supplementsApi.exportList(query)
    sendJson(res, ok(result))
    return true
  }

  const detailMatch = pathname.match(/^\/api\/supplements\/([^/]+)$/)
  if (detailMatch && method === 'GET') {
    const result = supplementsApi.detail(detailMatch[1])
    if (!result) {
      sendJson(res, notFound('补砖申请不存在'), 404)
    } else {
      sendJson(res, ok(result))
    }
    return true
  }

  const historyMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/history$/)
  if (historyMatch && method === 'GET') {
    const result = supplementsApi.history(historyMatch[1])
    if (!result) {
      sendJson(res, notFound('补砖申请不存在'), 404)
    } else {
      sendJson(res, ok(result))
    }
    return true
  }

  const exportMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/export$/)
  if (exportMatch && method === 'GET') {
    const result = supplementsApi.exportDetail(exportMatch[1])
    sendJson(res, ok(result))
    return true
  }

  const submitMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/submit$/)
  if (submitMatch && method === 'POST') {
    try {
      const result = supplementsApi.submit(submitMatch[1], body.operatorId)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const startDesignMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/start-design$/)
  if (startDesignMatch && method === 'POST') {
    try {
      const result = supplementsApi.startDesign(startDesignMatch[1], body.operatorId, body.remark)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const confirmDesignMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/confirm-design$/)
  if (confirmDesignMatch && method === 'POST') {
    try {
      const result = supplementsApi.confirmDesign(confirmDesignMatch[1], body.operatorId, body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const rejectMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/reject$/)
  if (rejectMatch && method === 'POST') {
    try {
      const result = supplementsApi.reject(rejectMatch[1], body.operatorId, body.reason)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const supplementMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/supplement$/)
  if (supplementMatch && method === 'POST') {
    try {
      const result = supplementsApi.supplement(supplementMatch[1], body.operatorId, body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const rescheduleMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/reschedule$/)
  if (rescheduleMatch && method === 'POST') {
    try {
      const result = supplementsApi.reschedule(
        rescheduleMatch[1],
        body.operatorId,
        body.newDate,
        body.remark
      )
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const startWarehouseMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/start-warehouse$/)
  if (startWarehouseMatch && method === 'POST') {
    try {
      const result = supplementsApi.startWarehouse(startWarehouseMatch[1], body.operatorId)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const shipMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/ship$/)
  if (shipMatch && method === 'POST') {
    try {
      const result = supplementsApi.ship(
        shipMatch[1],
        body.operatorId,
        body.expressNo,
        body.logisticsRemark
      )
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const completeMatch = pathname.match(/^\/api\/supplements\/([^/]+)\/complete$/)
  if (completeMatch && method === 'POST') {
    try {
      const result = supplementsApi.complete(completeMatch[1], body.operatorId, body.remark)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  return false
}

async function handleReturnRoutes(pathname: string, method: string, query: Record<string, string>, body: any, res: any) {
  if (pathname === '/api/returns' && method === 'GET') {
    const result = returnsApi.list(query)
    sendJson(res, ok(result))
    return true
  }

  if (pathname === '/api/returns' && method === 'POST') {
    try {
      const result = returnsApi.create(body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '创建失败'), 400)
    }
    return true
  }

  if (pathname === '/api/returns/export' && method === 'GET') {
    const result = returnsApi.exportList(query)
    sendJson(res, ok(result))
    return true
  }

  const detailMatch = pathname.match(/^\/api\/returns\/([^/]+)$/)
  if (detailMatch && method === 'GET') {
    const result = returnsApi.detail(detailMatch[1])
    if (!result) {
      sendJson(res, notFound('退货申请不存在'), 404)
    } else {
      sendJson(res, ok(result))
    }
    return true
  }

  const historyMatch = pathname.match(/^\/api\/returns\/([^/]+)\/history$/)
  if (historyMatch && method === 'GET') {
    const result = returnsApi.history(historyMatch[1])
    if (!result) {
      sendJson(res, notFound('退货申请不存在'), 404)
    } else {
      sendJson(res, ok(result))
    }
    return true
  }

  const exportMatch = pathname.match(/^\/api\/returns\/([^/]+)\/export$/)
  if (exportMatch && method === 'GET') {
    const result = returnsApi.exportDetail(exportMatch[1])
    sendJson(res, ok(result))
    return true
  }

  const inspectMatch = pathname.match(/^\/api\/returns\/([^/]+)\/inspect$/)
  if (inspectMatch && method === 'POST') {
    try {
      const result = returnsApi.inspect(inspectMatch[1], body.operatorId, body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const passMatch = pathname.match(/^\/api\/returns\/([^/]+)\/pass$/)
  if (passMatch && method === 'POST') {
    try {
      const result = returnsApi.pass(passMatch[1], body.operatorId, body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const rejectMatch = pathname.match(/^\/api\/returns\/([^/]+)\/reject$/)
  if (rejectMatch && method === 'POST') {
    try {
      const result = returnsApi.reject(rejectMatch[1], body.operatorId, body.reason)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const supplementMatch = pathname.match(/^\/api\/returns\/([^/]+)\/supplement$/)
  if (supplementMatch && method === 'POST') {
    try {
      const result = returnsApi.supplement(supplementMatch[1], body.operatorId, body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const rescheduleMatch = pathname.match(/^\/api\/returns\/([^/]+)\/reschedule$/)
  if (rescheduleMatch && method === 'POST') {
    try {
      const result = returnsApi.reschedule(
        rescheduleMatch[1],
        body.operatorId,
        body.newDate,
        body.remark
      )
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  const refundMatch = pathname.match(/^\/api\/returns\/([^/]+)\/refund$/)
  if (refundMatch && method === 'POST') {
    try {
      const result = returnsApi.refund(refundMatch[1], body.operatorId, body)
      sendJson(res, ok(result))
    } catch (e: any) {
      sendJson(res, fail(e.message || '操作失败'), 400)
    }
    return true
  }

  return false
}

export function viteMockPlugin(): Plugin {
  return {
    name: 'vite-plugin-mock',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        const pathname = url.split('?')[0]

        if (!pathname.startsWith('/api/')) {
          return next()
        }

        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
          res.statusCode = 204
          res.end()
          return
        }

        const query = parseQuery(url)
        const method = req.method || 'GET'
        let body: any = {}

        if (method !== 'GET' && method !== 'HEAD') {
          body = await parseBody(req)
        }

        try {
          if (pathname === '/api/mock/health' && method === 'GET') {
            sendJson(res, ok({ status: 'ok', timestamp: new Date().toISOString() }))
            return
          }

          if (pathname === '/api/mock/reset' && method === 'POST') {
            store.supplements = JSON.parse(JSON.stringify(mockSupplements))
            store.returns = JSON.parse(JSON.stringify(mockReturns))
            sendJson(res, ok({ message: '数据已重置' }))
            return
          }

          if (pathname.startsWith('/api/supplements')) {
            const handled = await handleSupplementRoutes(pathname, method, query, body, res)
            if (handled) return
          }

          if (pathname.startsWith('/api/returns')) {
            const handled = await handleReturnRoutes(pathname, method, query, body, res)
            if (handled) return
          }

          next()
        } catch (e: any) {
          console.error('[Mock API] Error:', e)
          sendJson(res, fail(e.message || '服务器内部错误', 500), 500)
        }
      })
    },
  }
}

export default viteMockPlugin
