export const Role = {
  PURCHASER: 'PURCHASER',
  PROCESS_ENGINEER: 'PROCESS_ENGINEER',
  QUALITY_INSPECTOR: 'QUALITY_INSPECTOR',
  SUPPLIER: 'SUPPLIER',
} as const

export type RoleType = typeof Role[keyof typeof Role]

export const OrderStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export const InspectionStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  CONCESSION: 'CONCESSION',
} as const

export const ExceptionStatus = {
  REPORTED: 'REPORTED',
  ANALYZING: 'ANALYZING',
  AWAITING_SUPPLIER_FEEDBACK: 'AWAITING_SUPPLIER_FEEDBACK',
  SUPPLIER_RESPONDED: 'SUPPLIER_RESPONDED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const

export const DrawingStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  OBSOLETE: 'OBSOLETE',
} as const

export const ConcessionDecision = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export const DispositionType = {
  REWORK: 'REWORK',
  SCRAP: 'SCRAP',
  CONCESSION: 'CONCESSION',
  RETURN: 'RETURN',
} as const

export const roleLabels: Record<string, string> = {
  [Role.PURCHASER]: '采购',
  [Role.PROCESS_ENGINEER]: '工艺工程师',
  [Role.QUALITY_INSPECTOR]: '质检',
  [Role.SUPPLIER]: '供应商',
}

export const orderStatusLabels: Record<string, string> = {
  [OrderStatus.DRAFT]: '草稿',
  [OrderStatus.SENT]: '已发送',
  [OrderStatus.CONFIRMED]: '已确认',
  [OrderStatus.IN_PRODUCTION]: '生产中',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.RECEIVED]: '已收货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
}

export const inspectionStatusLabels: Record<string, string> = {
  [InspectionStatus.PENDING]: '待检验',
  [InspectionStatus.IN_PROGRESS]: '检验中',
  [InspectionStatus.PASSED]: '合格',
  [InspectionStatus.FAILED]: '不合格',
  [InspectionStatus.CONCESSION]: '让步接收',
}

export const exceptionStatusLabels: Record<string, string> = {
  [ExceptionStatus.REPORTED]: '已上报',
  [ExceptionStatus.ANALYZING]: '分析中',
  [ExceptionStatus.AWAITING_SUPPLIER_FEEDBACK]: '待供应商回复',
  [ExceptionStatus.SUPPLIER_RESPONDED]: '供应商已回复',
  [ExceptionStatus.RESOLVED]: '已解决',
  [ExceptionStatus.CLOSED]: '已关闭',
}

export const drawingStatusLabels: Record<string, string> = {
  [DrawingStatus.DRAFT]: '草稿',
  [DrawingStatus.PENDING_APPROVAL]: '待审批',
  [DrawingStatus.APPROVED]: '已批准',
  [DrawingStatus.OBSOLETE]: '已作废',
}

export const concessionDecisionLabels: Record<string, string> = {
  [ConcessionDecision.PENDING]: '待审批',
  [ConcessionDecision.APPROVED]: '已批准',
  [ConcessionDecision.REJECTED]: '已拒绝',
}

export const dispositionLabels: Record<string, string> = {
  [DispositionType.REWORK]: '返工',
  [DispositionType.SCRAP]: '报废',
  [DispositionType.CONCESSION]: '让步接收',
  [DispositionType.RETURN]: '退货',
}

export const exceptionTypeLabels: Record<string, string> = {
  DRAWING_VERSION_MISMATCH: '图纸版本不匹配',
  DIMENSION_OUT_OF_TOLERANCE: '尺寸超差',
  SURFACE_QUALITY_ISSUE: '表面质量问题',
  MATERIAL_DEFECT: '材料缺陷',
}
