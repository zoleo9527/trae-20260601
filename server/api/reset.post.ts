import { initialMockRecords } from '../utils/mockData'
import { requireAuth } from '../utils/storage'

export default defineEventHandler(async () => {
  try {
    requireAuth()
    const storage = useStorage('data')
    await storage.setItem('acceptance_records', initialMockRecords)
    return {
      success: true,
      message: '数据已重置为初始状态',
      count: initialMockRecords.length
    }
  } catch (error: any) {
    const code = error.status || error.statusCode || 500
    const msg = error.statusMessage || error.message || '数据重置失败'
    throw createError({
      statusCode: code,
      statusMessage: msg
    })
  }
})
