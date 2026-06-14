import prisma, { createOperationLog } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少案件ID'
    })
  }
  
  const { operatorId, operatorRole, reason } = body
  
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: '缺少操作人ID'
    })
  }
  
  if (operatorRole !== 'SURVEYOR') {
    throw createError({
      statusCode: 403,
      message: '只有查勘员才能驳回报案'
    })
  }
  
  if (!reason) {
    throw createError({
      statusCode: 400,
      message: '驳回原因不能为空'
    })
  }
  
  const currentCase = await prisma.caseReport.findUnique({
    where: { id }
  })
  
  if (!currentCase) {
    throw createError({
      statusCode: 404,
      message: '案件不存在'
    })
  }
  
  if (currentCase.status !== 'SUBMITTED') {
    throw createError({
      statusCode: 400,
      message: '案件状态不符合要求，必须先提交报案'
    })
  }
  
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: 'REJECTED'
    },
    include: {
      materials: true,
      logs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  
  await createOperationLog(
    id,
    operatorId,
    'SURVEYOR',
    'REJECT',
    currentCase.status,
    'REJECTED',
    reason
  )
  
  return { case: updatedCase }
})
