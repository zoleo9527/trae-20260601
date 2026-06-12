import { initialMockRecords } from '../utils/mockData'

export default defineEventHandler(async () => {
  try {
    const storage = useStorage('data')
    await storage.setItem('acceptance_records', initialMockRecords)
    return {
      success: true,
      message: '数据已重置为初始状态',
      count: initialMockRecords.length
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '数据重置失败'
    })
  }
})
