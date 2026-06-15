export interface Customer {
  id: string
  name: string
  contact: string
  phone: string
  address: string
}

export interface DesignSpec {
  fontName: string
  fontVersion: string
  colorCode: string
  material: string
  size: string
  thickness: string
}

export interface SiteSurvey {
  id: string
  height: number
  installationType: 'wall' | 'ground' | 'hanging' | 'ceiling'
  accessType: 'ladder' | 'scaffold' | 'crane' | 'elevator'
  powerSupply: boolean
  notes: string
  surveyDate: string
  surveyor: string
}

export interface ProductionOrder {
  id: string
  orderNo: string
  customer: Customer
  designSpec: DesignSpec
  siteSurvey: SiteSurvey
  productName: string
  quantity: number
  deadline: string
  status: 'pending' | 'producing' | 'completed' | 'quality_check' | 'packaging' | 'shipped'
  createdAt: string
  updatedAt: string
}

export interface QualityCheckItem {
  id: string
  name: string
  standard: string
  result: 'pass' | 'fail' | 'pending'
  remark: string
  checkedBy: string
  checkedAt: string
}

export interface QualityInspection {
  id: string
  productionOrderId: string
  order: ProductionOrder
  checkItems: QualityCheckItem[]
  overallResult: 'pass' | 'fail' | 'pending'
  remarks: string
  inspector: string
  inspectedAt: string
  updatedAt: string
  revisionCount: number
}

export interface PackagingItem {
  id: string
  name: string
  quantity: number
  status: 'packed' | 'missing' | 'pending'
}

export interface Shipment {
  id: string
  productionOrderId: string
  order: ProductionOrder
  qualityInspection: QualityInspection
  packagingItems: PackagingItem[]
  boxCount: number
  weight: number
  shippingMethod: string
  trackingNo: string
  shipper: string
  shippedAt: string
  createdAt: string
  status: 'packaging' | 'ready' | 'shipped' | 'delivered'
}

export interface Notification {
  id: string
  type: 'quality_update' | 'packaging_ready' | 'shipping_update' | 'alert'
  title: string
  message: string
  read: boolean
  targetRole: 'project_manager' | 'producer' | 'installer'
  createdAt: string
  relatedOrderId: string
}

export interface User {
  id: string
  name: string
  role: 'project_manager' | 'producer' | 'installer' | 'admin'
  department: string
  phone: string
}

export type Role = 'project_manager' | 'producer' | 'installer' | 'admin'

export interface ProcessRecord {
  id: string
  orderId: string
  type: 'quality_check' | 'quality_update' | 'packaging_create' | 'packaging_update' | 'shipment'
  title: string
  description: string
  operatorName: string
  operatorRole: Role
  timestamp: string
  statusBefore?: string
  statusAfter?: string
  offline: boolean
}