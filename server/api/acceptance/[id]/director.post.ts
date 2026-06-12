import { getRecordById, updateRecord, getCurrentUserId } from '../../../utils/storage'
import type { DirectorProcessPayload } from '~/types'

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
    
    const body = await readBody<DirectorProcessPayload>(event)
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
    
    const now = new Date().toISOString()
    const updates: Partial<typeof record> = {
      directorId: userId,
      directorName: user.name,
      directorConfirmTime: now,
      directorResult: body.result,
      directorRemark: body.directorRemark || null,
      feeStartDate: body.result === 'pass' ? body.feeStartDate || null : null,
      status: body.result === 'pass' ? 'completed' : 'director_rejected'
    }
    
    const updated = await updateRecord(id, updates)
    return updated
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '主管审核失败'
    })
  }
})
