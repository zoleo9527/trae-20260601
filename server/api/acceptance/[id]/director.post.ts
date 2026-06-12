import { getRecordById, updateRecord, requireRole, getUserName } from '../../../utils/storage'
import type { DirectorProcessPayload } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const userId = requireRole('director')
    const userName = getUserName(userId)!
    
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少记录ID'
      })
    }
    
    const body = await readBody<DirectorProcessPayload>(event)
    
    const record = await getRecordById(id)
    if (!record) {
      throw createError({
        statusCode: 404,
        statusMessage: '记录不存在'
      })
    }
    
    if (record.status !== 'pending_director') {
      throw createError({
        statusCode: 400,
        statusMessage: '当前状态不允许主管审核'
      })
    }
    
    if (body.result === 'pass' && !body.feeStartDate) {
      throw createError({
        statusCode: 400,
        statusMessage: '通过时必须填写费用起算日期'
      })
    }
    
    if (body.result === 'reject' && !body.directorRejectReason) {
      throw createError({
        statusCode: 400,
        statusMessage: '退回时必须填写退回原因'
      })
    }
    
    const now = new Date().toISOString()
    const updates: Partial<typeof record> = {
      directorId: userId,
      directorName: userName,
      directorConfirmTime: now,
      directorResult: body.result,
      directorRemark: body.directorRemark || null,
      directorRejectReason: body.result === 'reject' ? body.directorRejectReason || null : null,
      feeStartDate: body.result === 'pass' ? body.feeStartDate || null : null,
      status: body.result === 'pass' ? 'completed' : 'director_rejected'
    }
    
    const updated = await updateRecord(id, updates)
    return updated
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '主管审核失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
