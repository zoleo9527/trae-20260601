export type CargoStatus = "待通知" | "已通知" | "已预约" | "提货中" | "超期未提" | "已完成"
export type NotifyMethod = "短信" | "电话"
export type VerifyItemName = "身份证" | "提货单" | "委托书" | "单位证明"

export interface Cargo {
  id: string
  trainNo: string
  ticketNo: string
  goodsName: string
  weight: number
  consignee: string
  consigneePhone: string
  arrivalTime: string
  status: CargoStatus
  pickupPort?: string
  signer?: string
  signTime?: string
  exceptionRemark?: string
}

export interface NotifyRecord {
  id: string
  cargoId: string
  method: NotifyMethod
  time: string
  operator: string
  result: string
}

export interface PickupAppointment {
  id: string
  cargoId: string
  pickerName: string
  pickerIdCard: string
  relation: string
  appointmentTime: string
}

export interface VerifyChecklist {
  cargoId: string
  items: { name: VerifyItemName; passed: boolean }[]
  verifiedBy: string
  verifiedTime: string
}

export interface ExceptionRelease {
  id: string
  cargoId: string
  reason: string
  approver: string
  condition: string
  releaseTime: string
}
