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
  
  if (operatorRole !== 'UNDERWRITER') {
    throw createError({
      statusCode: 403,
      message: '只有核赔主管才能执行复核不通过'
    })
  }
  
  if (!reason) {
    throw createError({
      statusCode: 400,
      message: '复核不通过原因不能为空'
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
  
  if (currentCase.status !== 'PENDING_REVIEW') {
    throw createError({
      statusCode: 400,
      message: '案件状态不符合要求，必须先提交核赔'
    })
  }
  
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: 'REVIEW_FAILED'
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
    'UNDERWRITER',
    'REJECT',
    currentCase.status,
    'REVIEW_FAILED',
    reason
  )
  
  return { case: updatedCase }
})
