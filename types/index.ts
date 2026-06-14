export interface StatusChange {
  status: string
  operator: string
  operatorRole: string
  time: string
  remark: string
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
}

export interface User {
  username: string
  name: string
  role: string
  storeCode: string
  storeName: string
}
