import { getRecordById, updateRecord, getCurrentUserId } from '../../../utils/storage'
import type { EngineerProcessPayload } from '~/types'

const userMap: Record<string, { name: string }> = {
  'm1': { name: '张明' },
  'm2': { name: '李华' },
  'd1': { name: '王芳' },
  'e1': { name: '赵强' },
  'e2': { name: '刘伟' }
}

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少记录ID'
      })
    }
    
    const body = await readBody<EngineerProcessPayload>(event)
    const userId = getCurrentUserId()
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登录'
      })
    }
    
    const user = userMap[userId]
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户不存在'
      })
    }
    
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
      engineerName: user.name,
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
