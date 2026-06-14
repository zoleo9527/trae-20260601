import prisma, { createOperationLog } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少材料ID'
    })
  }
  
  const { operatorId, status, remark } = body
  
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: '缺少操作人ID'
    })
  }
  
  if (!status) {
    throw createError({
      statusCode: 400,
      message: '缺少审核状态'
    })
  }
  
  if (status === 'rejected' && !remark) {
    throw createError({
      statusCode: 400,
      message: '驳回时必须填写原因'
    })
  }
  
  const material = await prisma.materialList.findUnique({
    where: { id }
  })
  
  if (!material) {
    throw createError({
      statusCode: 404,
      message: '材料不存在'
    })
  }
  
  const updatedMaterial = await prisma.materialList.update({
    where: { id },
    data: {
      uploadStatus: status === 'confirmed' ? 'CONFIRMED' : 'NOT_UPLOADED',
      verifiedBy: operatorId,
      verifiedAt: new Date()
    }
  })
  
  await createOperationLog(
    material.caseId,
    operatorId,
    'SURVEYOR',
    status === 'confirmed' ? 'CONFIRM' : 'REJECT',
    material.uploadStatus,
    updatedMaterial.uploadStatus,
    remark || (status === 'confirmed' ? '确认材料' : '驳回材料')
  )
  
  return { material: updatedMaterial }
})
