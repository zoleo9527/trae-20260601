import { defineEventHandler } from 'h3'
import type { PrizeRecord, StatusChange, ProcessStage } from '~/types'
import { stageLabels } from '~/types'

const prizeRecords: PrizeRecord[] = [
  {
    id: 'P001',
    ticketNumber: '20241201001',
    prizeAmount: 50000,
    prizeType: '一等奖',
    storeName: '朝阳区望京店',
    storeCode: 'BJ-WJ-001',
    status: 'pending',
    currentHandler: '店员',
    currentHandlerName: '张三',
    createdAt: '2024-12-01 09:15:30',
    lastUpdatedAt: '2024-12-01 09:15:30',
    statusChanges: [
      { status: 'pending', operator: '张三', operatorRole: '店员', time: '2024-12-01 09:15:30', remark: '顾客持彩票到店申请兑奖', stage: 'registration' }
    ],
    customerName: '李四',
    customerId: '110101199001011234',
    materialsStatus: 'uploading',
    materials: [
      { type: '身份证正面', uploaded: true, uploadedBy: '张三', uploadedAt: '2024-12-01 09:18:00' },
      { type: '身份证反面', uploaded: true, uploadedBy: '张三', uploadedAt: '2024-12-01 09:19:00' },
      { type: '彩票原件', uploaded: false, uploadedBy: '', uploadedAt: '' },
      { type: '兑奖申请表', uploaded: false, uploadedBy: '', uploadedAt: '' }
    ],
    remark: '顾客表示急需用钱，希望尽快处理',
    currentStage: 'registration'
  },
  {
    id: 'P002',
    ticketNumber: '20241201002',
    prizeAmount: 10000,
    prizeType: '二等奖',
    storeName: '海淀区中关村店',
    storeCode: 'BJ-ZG-002',
    status: 'processing',
    currentHandler: '店长',
    currentHandlerName: '王五',
    createdAt: '2024-12-01 10:20:00',
    lastUpdatedAt: '2024-12-01 14:30:00',
    statusChanges: [
      { status: 'pending', operator: '赵六', operatorRole: '店员', time: '2024-12-01 10:20:00', remark: '顾客到店兑奖', stage: 'registration' },
      { status: 'processing', operator: '王五', operatorRole: '店长', time: '2024-12-01 14:30:00', remark: '已审核彩票信息，进入处理流程', stage: 'verification' }
    ],
    customerName: '钱七',
    customerId: '110102198505156789',
    materialsStatus: 'pending',
    materials: [
      { type: '身份证正面', uploaded: true, uploadedBy: '赵六', uploadedAt: '2024-12-01 10:25:00' },
      { type: '身份证反面', uploaded: true, uploadedBy: '赵六', uploadedAt: '2024-12-01 10:26:00' },
      { type: '彩票原件', uploaded: true, uploadedBy: '赵六', uploadedAt: '2024-12-01 10:27:00' },
      { type: '兑奖申请表', uploaded: true, uploadedBy: '赵六', uploadedAt: '2024-12-01 10:28:00' }
    ],
    remark: '',
    currentStage: 'verification'
  },
  {
    id: 'P003',
    ticketNumber: '20241202001',
    prizeAmount: 500000,
    prizeType: '一等奖',
    storeName: '西城区西单店',
    storeCode: 'BJ-XD-003',
    status: 'exception',
    currentHandler: '片区管理员',
    currentHandlerName: '孙八',
    createdAt: '2024-12-02 11:00:00',
    lastUpdatedAt: '2024-12-02 15:45:00',
    statusChanges: [
      { status: 'pending', operator: '周九', operatorRole: '店员', time: '2024-12-02 11:00:00', remark: '大额兑奖申请', stage: 'registration' },
      { status: 'processing', operator: '吴十', operatorRole: '店长', time: '2024-12-02 11:30:00', remark: '已初审，上报片区管理员', stage: 'verification' },
      { status: 'exception', operator: '孙八', operatorRole: '片区管理员', time: '2024-12-02 15:45:00', remark: '彩票信息与系统不符，需进一步核实', stage: 'exception' }
    ],
    customerName: '郑十一',
    customerId: '110103197808201122',
    materialsStatus: 'exception',
    materials: [
      { type: '身份证正面', uploaded: true, uploadedBy: '周九', uploadedAt: '2024-12-02 11:05:00' },
      { type: '身份证反面', uploaded: true, uploadedBy: '周九', uploadedAt: '2024-12-02 11:06:00' },
      { type: '彩票原件', uploaded: true, uploadedBy: '周九', uploadedAt: '2024-12-02 11:07:00' },
      { type: '兑奖申请表', uploaded: true, uploadedBy: '周九', uploadedAt: '2024-12-02 11:08:00' }
    ],
    remark: '彩票序列号存在疑问，需联系省中心核实',
    currentStage: 'exception'
  },
  {
    id: 'P004',
    ticketNumber: '20241202002',
    prizeAmount: 5000,
    prizeType: '三等奖',
    storeName: '东城区王府井店',
    storeCode: 'BJ-WF-004',
    status: 'completed',
    currentHandler: '店员',
    currentHandlerName: '郑十二',
    createdAt: '2024-12-02 08:30:00',
    lastUpdatedAt: '2024-12-02 09:15:00',
    statusChanges: [
      { status: 'pending', operator: '郑十二', operatorRole: '店员', time: '2024-12-02 08:30:00', remark: '顾客到店兑奖', stage: 'registration' },
      { status: 'processing', operator: '郑十二', operatorRole: '店员', time: '2024-12-02 08:45:00', remark: '审核通过，准备打款', stage: 'verification' },
      { status: 'processing', operator: '郑十二', operatorRole: '店员', time: '2024-12-02 09:00:00', remark: '奖金已转账', stage: 'payment' },
      { status: 'completed', operator: '郑十二', operatorRole: '店员', time: '2024-12-02 09:15:00', remark: '兑奖完成，奖金已发放', stage: 'completed' }
    ],
    customerName: '王十三',
    customerId: '110104199512123456',
    materialsStatus: 'completed',
    materials: [
      { type: '身份证正面', uploaded: true, uploadedBy: '郑十二', uploadedAt: '2024-12-02 08:35:00' },
      { type: '身份证反面', uploaded: true, uploadedBy: '郑十二', uploadedAt: '2024-12-02 08:36:00' },
      { type: '彩票原件', uploaded: true, uploadedBy: '郑十二', uploadedAt: '2024-12-02 08:37:00' },
      { type: '兑奖申请表', uploaded: true, uploadedBy: '郑十二', uploadedAt: '2024-12-02 08:38:00' }
    ],
    remark: '',
    currentStage: 'completed'
  },
  {
    id: 'P005',
    ticketNumber: '20241203001',
    prizeAmount: 20000,
    prizeType: '二等奖',
    storeName: '朝阳区望京店',
    storeCode: 'BJ-WJ-001',
    status: 'pending',
    currentHandler: '店员',
    currentHandlerName: '张三',
    createdAt: '2024-12-03 14:20:00',
    lastUpdatedAt: '2024-12-03 14:20:00',
    statusChanges: [
      { status: 'pending', operator: '张三', operatorRole: '店员', time: '2024-12-03 14:20:00', remark: '顾客持彩票到店申请兑奖', stage: 'registration' }
    ],
    customerName: '刘十四',
    customerId: '110105199203156789',
    materialsStatus: 'uploading',
    materials: [
      { type: '身份证正面', uploaded: true, uploadedBy: '张三', uploadedAt: '2024-12-03 14:25:00' },
      { type: '身份证反面', uploaded: false, uploadedBy: '', uploadedAt: '' },
      { type: '彩票原件', uploaded: false, uploadedBy: '', uploadedAt: '' },
      { type: '兑奖申请表', uploaded: false, uploadedBy: '', uploadedAt: '' }
    ],
    remark: '顾客身份证照片模糊，需要重新上传',
    currentStage: 'registration'
  }
]

const getNextStage = (currentStage: ProcessStage, newStatus: string): ProcessStage => {
  if (newStatus === 'completed') return 'completed'
  if (newStatus === 'exception') return 'exception'
  
  const stages: ProcessStage[] = ['registration', 'verification', 'payment', 'completed']
  const currentIndex = stages.indexOf(currentStage)
  if (currentIndex < stages.length - 1) {
    return stages[currentIndex + 1]
  }
  return currentStage
}

export default defineEventHandler(async (event) => {
  const { method } = event.node.req
  
  if (method === 'GET') {
    const query = getQuery(event)
    let records = [...prizeRecords]
    
    if (query.status) {
      records = records.filter(r => r.status === query.status)
    }
    if (query.storeCode) {
      records = records.filter(r => r.storeCode === query.storeCode)
    }
    if (query.handler) {
      records = records.filter(r => r.currentHandler === query.handler)
    }
    
    return { success: true, data: records }
  }
  
  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, status, operator, operatorRole, remark } = body
    
    const recordIndex = prizeRecords.findIndex(r => r.id === id)
    if (recordIndex === -1) {
      return { success: false, message: '记录不存在' }
    }
    
    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
    
    const newStage = getNextStage(prizeRecords[recordIndex].currentStage, status)
    
    prizeRecords[recordIndex].status = status
    prizeRecords[recordIndex].currentHandler = operatorRole
    prizeRecords[recordIndex].currentHandlerName = operator
    prizeRecords[recordIndex].lastUpdatedAt = now
    prizeRecords[recordIndex].currentStage = newStage
    prizeRecords[recordIndex].remark = remark !== undefined ? remark : ''
    
    prizeRecords[recordIndex].statusChanges.push({
      status,
      operator,
      operatorRole,
      time: now,
      remark: remark !== undefined ? remark : '',
      stage: newStage
    })
    
    return { success: true, data: prizeRecords[recordIndex] }
  }
  
  if (method === 'POST') {
    const body = await readBody(event)
    const { ticketNumber, prizeAmount, prizeType, storeName, storeCode, customerName, customerId } = body
    
    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
    
    const newRecord: PrizeRecord = {
      id: `P${String(prizeRecords.length + 1).padStart(3, '0')}`,
      ticketNumber,
      prizeAmount: Number(prizeAmount),
      prizeType,
      storeName,
      storeCode,
      status: 'pending',
      currentHandler: '店员',
      currentHandlerName: body.operator || '系统',
      createdAt: now,
      lastUpdatedAt: now,
      statusChanges: [
        { status: 'pending', operator: body.operator || '系统', operatorRole: '店员', time: now, remark: '新建兑奖申请', stage: 'registration' }
      ],
      customerName,
      customerId,
      materialsStatus: 'uploading',
      materials: [
        { type: '身份证正面', uploaded: false, uploadedBy: '', uploadedAt: '' },
        { type: '身份证反面', uploaded: false, uploadedBy: '', uploadedAt: '' },
        { type: '彩票原件', uploaded: false, uploadedBy: '', uploadedAt: '' },
        { type: '兑奖申请表', uploaded: false, uploadedBy: '', uploadedAt: '' }
      ],
      remark: '',
      currentStage: 'registration'
    }
    
    prizeRecords.push(newRecord)
    return { success: true, data: newRecord }
  }
  
  return { success: false, message: '不支持的方法' }
})
