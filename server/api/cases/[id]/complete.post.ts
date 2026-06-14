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
  
  const { operatorId } = body
  
  if (!operatorId) {
    throw createError({
      statusCode: 400,
      message: '缺少操作人ID'
    })
  }
  
  const currentCase = await prisma.caseReport.findUnique({
    where: { id },
    include: {
      materials: true
    }
  })
  
  if (!currentCase) {
    throw createError({
      statusCode: 404,
      message: '案件不存在'
    })
  }
  
  const allMaterialsConfirmed = currentCase.materials.every(
    m => m.uploadStatus === 'CONFIRMED'
  )
  
  if (!allMaterialsConfirmed) {
    throw createError({
      statusCode: 400,
      message: '所有材料必须确认后才能完成报案'
    })
  }
  
  const updatedCase = await prisma.caseReport.update({
    where: { id },
    data: {
      status: 'COMPLETED'
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
    'CONFIRM',
    currentCase.status,
    'COMPLETED',
    '核赔通过'
  )
  
  return { case: updatedCase }
})
