import { getRecordById, updateRecord, requireRole } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  try {
    requireRole('manager')
    
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
    
    if (record.status !== 'engineer_rejected' && record.status !== 'director_rejected') {
      throw createError({
        statusCode: 400,
        statusMessage: '只有退回状态的记录可以重新提交'
      })
    }
    
    const now = new Date().toISOString()
    const updated = await updateRecord(id, {
      status: 'pending_engineer',
      submitTime: now,
      engineerId: null,
      engineerName: null,
      engineerAcceptTime: null,
      engineerResult: null,
      engineerRemark: null,
      rejectReason: null,
      directorId: null,
      directorName: null,
      directorConfirmTime: null,
      directorResult: null,
      directorRemark: null,
      feeStartDate: null,
      directorRejectReason: record.directorRejectReason
    })
    
    return updated
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '重新提交失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
