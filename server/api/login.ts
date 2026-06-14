import { defineEventHandler } from 'h3'

const users = [
  { username: 'clerk', password: '123456', role: '店员', name: '张三', storeCode: 'BJ-WJ-001', storeName: '朝阳区望京店' },
  { username: 'manager', password: '123456', role: '店长', name: '王五', storeCode: 'BJ-ZG-002', storeName: '海淀区中关村店' },
  { username: 'admin', password: '123456', role: '片区管理员', name: '孙八', storeCode: '', storeName: '北京片区' }
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body
  
  const user = users.find(u => u.username === username && u.password === password)
  
  if (user) {
    return {
      success: true,
      data: {
        username: user.username,
        name: user.name,
        role: user.role,
        storeCode: user.storeCode,
        storeName: user.storeName
      }
    }
  }
  
  return { success: false, message: '用户名或密码错误' }
})
