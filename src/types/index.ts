export type ProcessStage = 'registration' | 'verification' | 'payment' | 'completed' | 'exception'

export const stageLabels: Record<ProcessStage, string> = {
  registration: '登记',
  verification: '审核',
  payment: '打款',
  completed: '完成',
  exception: '异常'
}

export interface StatusChange {
  status: string
  operator: string
  operatorRole: string
  time: string
  remark: string
  stage: ProcessStage
}

export interface Material {
  type: string
  uploaded: boolean
  uploadedBy: string
  uploadedAt: string
}

export interface PrizeRecord {
  id: string
  ticketNumber: string
  prizeAmount: number
  prizeType: string
  storeName: string
  storeCode: string
  status: 'pending' | 'processing' | 'completed' | 'exception'
  currentHandler: string
  currentHandlerName: string
  createdAt: string
  lastUpdatedAt: string
  statusChanges: StatusChange[]
  customerName: string
  customerId: string
  materialsStatus: 'uploading' | 'pending' | 'completed' | 'exception'
  materials: Material[]
  remark: string
  currentStage: ProcessStage
}

export interface User {
  username: string
  name: string
  role: string
  storeCode: string
  storeName: string
}
