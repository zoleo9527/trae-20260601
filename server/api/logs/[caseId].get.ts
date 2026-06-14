import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const caseId = getRouterParam(event, 'caseId')
  
  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: '缺少案件ID'
    })
  }
  
  const logs = await prisma.operationLog.findMany({
    where: { caseId },
    orderBy: { createdAt: 'desc' }
  })
  
  return { logs }
})
