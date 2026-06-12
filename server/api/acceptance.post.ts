import { addRecord, generateId, requireRole, getUserName } from '../utils/storage'
import type { CreateAcceptancePayload, AcceptanceRecord } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const userId = requireRole('manager')
    const userName = getUserName(userId)!
    
    const body = await readBody<CreateAcceptancePayload>(event)
    
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
      managerName: userName,
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
      directorRejectReason: null,
      feeStartDate: null,
      supplementRemark: body.supplementRemark || null,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    }
    
    return await addRecord(record)
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '创建记录失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
