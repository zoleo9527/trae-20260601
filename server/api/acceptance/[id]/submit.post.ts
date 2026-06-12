import { getRecordById, updateRecord } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少记录ID'
      })
    }
    
    const record = await getRecordById(id)
    if (!record) {
      throw createError({
        statusCode: 404,
        statusMessage: '记录不存在'
      })
    }
    
    if (record.status !== 'draft' && record.status !== 'engineer_rejected' && record.status !== 'director_rejected') {
      throw createError({
        statusCode: 400,
        statusMessage: '当前状态不允许提交'
      })
    }
    
    const now = new Date().toISOString()
    const updated = await updateRecord(id, {
      status: 'pending_engineer',
      submitTime: now
    })
    
    return updated
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '提交失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
