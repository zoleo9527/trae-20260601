import { initialMockRecords } from '../utils/mockData'

export default defineNitroPlugin(async () => {
  const storage = useStorage('data')
  const existing = await storage.getItem('acceptance_records')
  
  if (!existing) {
    console.log('初始化演示数据...')
    await storage.setItem('acceptance_records', initialMockRecords)
    console.log('演示数据初始化完成')
  }
})
