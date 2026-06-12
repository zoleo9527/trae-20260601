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
      feeStartDate: null
    })
    
    return updated
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '重新提交失败'
    })
  }
})
