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
  
  const { operatorId, reason } = body
  
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: '缺少操作人ID'
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
