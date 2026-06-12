import { getRecords, requireAuth } from '../utils/storage'

export default defineEventHandler(async () => {
  try {
    requireAuth()
    const records = await getRecords()
    return records
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '获取数据失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
