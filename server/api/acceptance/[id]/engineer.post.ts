import { getRecordById, updateRecord, requireRole, getUserName } from '../../../utils/storage'
import type { EngineerProcessPayload } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const userId = requireRole('engineer')
    const userName = getUserName(userId)!
    
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少记录ID'
      })
    }
    
    const body = await readBody<EngineerProcessPayload>(event)
    
    const record = await getRecordById(id)
    if (!record) {
      throw createError({
        statusCode: 404,
        statusMessage: '记录不存在'
      })
    }
    
    if (record.status !== 'pending_engineer') {
      throw createError({
        statusCode: 400,
        statusMessage: '当前状态不允许物业验收处理'
      })
    }
    
    if (body.result === 'reject' && !body.rejectReason) {
      throw createError({
        statusCode: 400,
        statusMessage: '退回时必须填写退回原因'
      })
    }
    
    const now = new Date().toISOString()
    const updates: Partial<typeof record> = {
      engineerId: userId,
      engineerName: userName,
      engineerAcceptTime: now,
      engineerResult: body.result,
      engineerRemark: body.engineerRemark || null,
      rejectReason: body.result === 'reject' ? body.rejectReason || null : null,
      status: body.result === 'pass' ? 'pending_director' : 'engineer_rejected'
    }
    
    const updated = await updateRecord(id, updates)
    return updated
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '物业验收处理失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
