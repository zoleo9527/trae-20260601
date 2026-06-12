import { getRecords } from '../utils/storage'

export default defineEventHandler(async () => {
  try {
    const records = await getRecords()
    return records
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '获取数据失败'
    })
  }
})
