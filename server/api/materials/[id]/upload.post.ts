import prisma, { createOperationLog } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少材料ID'
    })
  }
  
  const { attachmentUrl, operatorId } = body
  
  if (!attachmentUrl) {
    throw createError({
      statusCode: 400,
      message: '缺少附件URL'
    })
  }
  
  const material = await prisma.materialList.findUnique({
    where: { id }
  })
  
  if (!material) {
    throw createError({
      statusCode: 404,
      message: '材料不存在'
    })
  }
  
  const updatedMaterial = await prisma.materialList.update({
    where: { id },
    data: {
      attachmentUrl,
      uploadStatus: 'UPLOADED'
    }
  })
  
  if (operatorId) {
    await createOperationLog(
      material.caseId,
      operatorId,
      'CLAIM_AGENT',
      'SUPPLEMENT',
      'NOT_UPLOADED',
      'UPLOADED',
      `上传附件：${material.materialName}`
    )
  }
  
  return { material: updatedMaterial }
})
