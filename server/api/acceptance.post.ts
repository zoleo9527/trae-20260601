import { addRecord, generateId, getCurrentUserId } from '../utils/storage'
import type { CreateAcceptancePayload, AcceptanceRecord } from '~/types'

const userMap: Record<string, { name: string }> = {
  'm1': { name: '张明' },
  'm2': { name: '李华' },
  'd1': { name: '王芳' },
  'e1': { name: '赵强' },
  'e2': { name: '刘伟' }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateAcceptancePayload>(event)
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
    
    const now = new Date().toISOString()
    const record: AcceptanceRecord = {
      id: generateId(),
      enterpriseName: body.enterpriseName,
      contractNo: body.contractNo,
      floor: body.floor,
      roomNumber: body.roomNumber,
      area: body.area,
      contractDate: body.contractDate,
      plannedMoveInDate: body.plannedMoveInDate,
      managerId: userId,
      managerName: user.name,
      submitTime: null,
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
      supplementRemark: body.supplementRemark || null,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    }
    
    return await addRecord(record)
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '创建记录失败'
    })
  }
})
