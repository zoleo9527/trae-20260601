import { mockExceptionRecords } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, status } = body

  const exception = mockExceptionRecords.find(e => e.id === id)

  if (!exception) {
    throw createError({
      statusCode: 404,
      message: '异常记录不存在'
    })
  }

  exception.status = status
  exception.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)

  return {
    code: 200,
    message: '异常记录更新成功',
    data: exception
  }
})