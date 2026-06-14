import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const caseId = query.caseId as string
  
  if (!caseId) {
    throw createError({
      statusCode: 400,
      message: '缺少案件ID'
    })
  }
  
  const materials = await prisma.materialList.findMany({
    where: { caseId },
    orderBy: { createdAt: 'asc' }
  })
  
  return { materials }
})
