import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少案件ID'
    })
  }
  
  const caseReport = await prisma.caseReport.findUnique({
    where: { id },
    include: {
      materials: true,
      logs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  
  if (!caseReport) {
    throw createError({
      statusCode: 404,
      message: '案件不存在'
    })
  }
  
  const processedLogs = caseReport.logs.map(log => {
    if (log.actionType === 'REJECT' && log.afterStatus === 'REVIEW_FAILED') {
      return {
        ...log,
        actionType: 'REVIEW_FAIL' as const
      }
    }
    return log
  })
  
  return { 
    case: {
      ...caseReport,
      logs: processedLogs
    } 
  }
})
