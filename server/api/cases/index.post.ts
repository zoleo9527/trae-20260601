import prisma, { generateReportNo, createOperationLog } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { policyNo, policyHolder, accidentDesc, reporterId } = body
  
  if (!policyNo || !policyHolder || !accidentDesc || !reporterId) {
    throw createError({
      statusCode: 400,
      message: '缺少必填字段'
    })
  }
  
  const reportNo = generateReportNo()
  
  const newCase = await prisma.caseReport.create({
    data: {
      reportNo,
      policyNo,
      policyHolder,
      accidentDesc,
      reporterId,
      status: 'PENDING_SUBMIT'
    },
    include: {
      materials: true,
      logs: true
    }
  })
  
  await createOperationLog(
    newCase.id,
    reporterId,
    'CLAIM_AGENT',
    'SUBMIT',
    undefined,
    'PENDING_SUBMIT',
    '创建报案'
  )
  
  return { case: newCase }
})
