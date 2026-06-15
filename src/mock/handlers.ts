import { http, HttpResponse, delay } from 'msw'
import { mockService } from './mockService'
import type { ApiResponse } from '@/api/request'

function ok<T>(data: T, message = 'ok'): HttpResponse<ApiResponse<any>> {
  return HttpResponse.json<ApiResponse<T>>({
    code: 0,
    message,
    data,
  }) as HttpResponse<ApiResponse<any>>
}

function fail(message: string, code = 1): HttpResponse<ApiResponse<any>> {
  return HttpResponse.json<ApiResponse<null>>(
    {
      code,
      message,
      data: null,
    },
    { status: 400 }
  ) as HttpResponse<ApiResponse<any>>
}

function notFound(message = '资源不存在'): HttpResponse<ApiResponse<any>> {
  return HttpResponse.json<ApiResponse<null>>(
    {
      code: 404,
      message,
      data: null,
    },
    { status: 404 }
  ) as HttpResponse<ApiResponse<any>>
}

async function parseJson(req: Request): Promise<any> {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

function getQueryParams(req: Request): Record<string, any> {
  const url = new URL(req.url)
  const params: Record<string, any> = {}
  url.searchParams.forEach((v, k) => {
    if (k.endsWith('[]')) {
      const key = k.slice(0, -2)
      if (!params[key]) params[key] = []
      params[key].push(v)
    } else {
      params[k] = v
    }
  })
  return params
}

export const handlers = [
  http.get('/api/supplements', async ({ request }) => {
    await delay(120)
    const params = getQueryParams(request)
    const query = {
      ...params,
      page: params.page ? Number(params.page) : 1,
      pageSize: params.pageSize ? Number(params.pageSize) : 10,
    }
    const res = await mockService.supplements.list(query)
    return ok(res)
  }),

  http.get('/api/supplements/:id', async ({ params }) => {
    await delay(80)
    const id = params.id as string
    const data = await mockService.supplements.detail(id)
    if (!data) return notFound('补砖申请不存在')
    return ok(data)
  }),

  http.get('/api/supplements/:id/history', async ({ params }) => {
    await delay(60)
    const id = params.id as string
    const data = await mockService.supplements.history(id)
    if (!data) return notFound('补砖申请不存在')
    return ok(data)
  }),

  http.post('/api/supplements', async ({ request }) => {
    await delay(180)
    const body = await parseJson(request)
    const data = await mockService.supplements.create(body)
    return ok(data, '创建成功')
  }),

  http.post('/api/supplements/:id/submit', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.submit(id, body.operatorId)
    return ok(data, '已提交')
  }),

  http.post('/api/supplements/:id/start-design', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.startDesign(id, body.operatorId, body.remark)
    return ok(data, '已开始量房')
  }),

  http.post('/api/supplements/:id/confirm-design', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.confirmDesign(id, body.operatorId, {
      remark: body.remark,
      changes: body.changes,
    })
    return ok(data, '已复核通过')
  }),

  http.post('/api/supplements/:id/reject', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    if (!body.reason) return fail('请填写驳回原因')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.reject(id, body.operatorId, body.reason)
    return ok(data, '已驳回')
  }),

  http.post('/api/supplements/:id/supplement', async ({ params, request }) => {
    await delay(120)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    if (!body.remark) return fail('请填写补录说明')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.supplement(id, body.operatorId, {
      remark: body.remark,
      changes: body.changes,
      tiles: body.tiles,
      expectedDeliveryDate: body.expectedDeliveryDate,
    })
    return ok(data, '已补录')
  }),

  http.post('/api/supplements/:id/reschedule', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    if (!body.newDate) return fail('请选择新日期')
    if (!body.remark) return fail('请填写改期说明')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.reschedule(id, body.operatorId, body.newDate, body.remark)
    return ok(data, '已改期')
  }),

  http.post('/api/supplements/:id/start-warehouse', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.startWarehouse(id, body.operatorId)
    return ok(data, '已开始备货')
  }),

  http.post('/api/supplements/:id/ship', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.ship(id, body.operatorId, body.expressNo, body.logisticsRemark)
    return ok(data, '已安排发货')
  }),

  http.post('/api/supplements/:id/complete', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.supplements.detail(id)
    if (!exists) return notFound('补砖申请不存在')
    const data = await mockService.supplements.complete(id, body.operatorId, body.remark)
    return ok(data, '已完成')
  }),

  http.get('/api/supplements/export', async ({ request }) => {
    await delay(350)
    const params = getQueryParams(request)
    const data = await mockService.supplements.exportList(params)
    return ok(data)
  }),

  http.get('/api/supplements/:id/export', async ({ params }) => {
    await delay(250)
    const id = params.id as string
    const data = await mockService.supplements.exportDetail(id)
    if (data.status === 'error') return notFound('导出失败')
    return ok(data)
  }),

  http.get('/api/returns', async ({ request }) => {
    await delay(120)
    const params = getQueryParams(request)
    const query = {
      ...params,
      page: params.page ? Number(params.page) : 1,
      pageSize: params.pageSize ? Number(params.pageSize) : 10,
    }
    const res = await mockService.returns.list(query)
    return ok(res)
  }),

  http.get('/api/returns/:id', async ({ params }) => {
    await delay(80)
    const id = params.id as string
    const data = await mockService.returns.detail(id)
    if (!data) return notFound('退货复核不存在')
    return ok(data)
  }),

  http.get('/api/returns/:id/history', async ({ params }) => {
    await delay(60)
    const id = params.id as string
    const data = await mockService.returns.history(id)
    if (!data) return notFound('退货复核不存在')
    return ok(data)
  }),

  http.post('/api/returns', async ({ request }) => {
    await delay(180)
    const body = await parseJson(request)
    const data = await mockService.returns.create(body)
    return ok(data, '创建成功')
  }),

  http.post('/api/returns/:id/inspect', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.returns.detail(id)
    if (!exists) return notFound('退货复核不存在')
    const data = await mockService.returns.inspect(id, body.operatorId, {
      remark: body.remark,
      warehouseId: body.warehouseId,
    })
    return ok(data, '已启动验货')
  }),

  http.post('/api/returns/:id/pass', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.returns.detail(id)
    if (!exists) return notFound('退货复核不存在')
    const data = await mockService.returns.pass(id, body.operatorId, {
      remark: body.remark,
      inspectionResult: body.inspectionResult,
      changes: body.changes,
    })
    return ok(data, '已复核通过')
  }),

  http.post('/api/returns/:id/reject', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    if (!body.reason) return fail('请填写驳回原因')
    const exists = await mockService.returns.detail(id)
    if (!exists) return notFound('退货复核不存在')
    const data = await mockService.returns.reject(id, body.operatorId, body.reason)
    return ok(data, '已驳回')
  }),

  http.post('/api/returns/:id/supplement', async ({ params, request }) => {
    await delay(120)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    if (!body.remark) return fail('请填写补录说明')
    const exists = await mockService.returns.detail(id)
    if (!exists) return notFound('退货复核不存在')
    const data = await mockService.returns.supplement(id, body.operatorId, {
      remark: body.remark,
      changes: body.changes,
      tiles: body.tiles,
      inspectionResult: body.inspectionResult,
      attachments: body.attachments,
    })
    return ok(data, '已补录')
  }),

  http.post('/api/returns/:id/reschedule', async ({ params, request }) => {
    await delay(100)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    if (!body.newDate) return fail('请选择新日期')
    if (!body.remark) return fail('请填写改期说明')
    const exists = await mockService.returns.detail(id)
    if (!exists) return notFound('退货复核不存在')
    const data = await mockService.returns.reschedule(id, body.operatorId, body.newDate, body.remark)
    return ok(data, '已改期')
  }),

  http.post('/api/returns/:id/refund', async ({ params, request }) => {
    await delay(120)
    const id = params.id as string
    const body = await parseJson(request)
    if (!body.operatorId) return fail('缺少操作人ID')
    const exists = await mockService.returns.detail(id)
    if (!exists) return notFound('退货复核不存在')
    const data = await mockService.returns.refund(id, body.operatorId, {
      remark: body.remark,
      changes: body.changes,
    })
    return ok(data, '退款完成')
  }),

  http.get('/api/returns/export', async ({ request }) => {
    await delay(350)
    const params = getQueryParams(request)
    const data = await mockService.returns.exportList(params)
    return ok(data)
  }),

  http.get('/api/returns/:id/export', async ({ params }) => {
    await delay(250)
    const id = params.id as string
    const data = await mockService.returns.exportDetail(id)
    if (data.status === 'error') return notFound('导出失败')
    return ok(data)
  }),

  http.post('/api/mock/reset', async () => {
    mockService.reset()
    return ok({ success: true }, '数据已重置')
  }),

  http.get('/api/mock/health', () => {
    return ok({ status: 'ok', timestamp: new Date().toISOString() })
  }),
]
