import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  let where = {}
  
  if (query.status) {
    where = { ...where, status: query.status as any }
  }
  
  if (query.role) {
    const role = query.role as string
    where = {
      ...where,
      reporterId: role === 'CLAIM_AGENT' ? { not: '' } : undefined
    }
  }
  
  const cases = await prisma.caseReport.findMany({
    where,
    include: {
      materials: true,
      logs: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  const processedCases = cases.map(caseItem => {
    const processedLogs = caseItem.logs.map(log => {
      if (log.actionType === 'REJECT' && log.afterStatus === 'REVIEW_FAILED') {
        return {
          ...log,
          actionType: 'REVIEW_FAIL' as const
        }
      }
      return log
    })
    return {
      ...caseItem,
      logs: processedLogs
    }
  })
  
  return { cases: processedCases }
})
