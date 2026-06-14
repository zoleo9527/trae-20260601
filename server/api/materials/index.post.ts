import prisma, { createOperationLog } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { caseId, materialName, materialType, reporterId } = body
  
  if (!caseId || !materialName || !materialType) {
    throw createError({
      statusCode: 400,
      message: '缺少必填字段'
    })
  }
  
  const newMaterial = await prisma.materialList.create({
    data: {
      caseId,
      materialName,
      materialType,
      uploadStatus: 'NOT_UPLOADED'
    }
  })
  
  if (reporterId) {
    await createOperationLog(
      caseId,
      reporterId,
      'CLAIM_AGENT',
      'SUPPLEMENT',
      undefined,
      'NOT_UPLOADED',
      `添加材料：${materialName}`
    )
  }
  
  return { material: newMaterial }
})
