export default defineEventHandler(async (event) => {
  return {
    accounts: [
      { role: 'rental', name: '张租赁', description: '租赁柜台人员，可创建巡查单、查看租赁相关待办' },
      { role: 'coach', name: '李教练', description: '教练主管，可审核风险上报、处理改期或驳回' },
      { role: 'patrol', name: '王巡逻', description: '安全巡逻员，可执行巡查、上报风险、补充备注' },
    ],
  }
})
