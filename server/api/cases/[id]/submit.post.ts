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
  
  const { operatorId, operatorRole } = body
  
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: '缺少操作人ID'
    })
  }
  
  if (operatorRole !== 'CLAIM_AGENT') {
    throw createError({
      statusCode: 403,
      message: '只有理赔专员才能提交报案'
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
  
  if (currentCase.status !== 'PENDING_SUBMIT' && currentCase.status !== 'REJECTED' && currentCase.status !== 'REVIEW_FAILED') {
    throw createError({
      statusCode: 400,
      message: '当前状态不允许提交'
    })
  }
  
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: 'SUBMITTED'
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
    'CLAIM_AGENT',
    'SUBMIT',
    currentCase.status,
    'SUBMITTED',
    '理赔专员提交报案'
  )
  
  return { case: updatedCase }
})
