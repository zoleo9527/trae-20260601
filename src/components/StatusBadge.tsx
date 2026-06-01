import { cn } from '@/lib/utils'
import { OrderStatus, InspectionStatus, ExceptionStatus, DrawingStatus, ConcessionDecision } from '@prisma/client'

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  [OrderStatus.DRAFT]: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
  [OrderStatus.SENT]: { label: '已发送', className: 'bg-blue-100 text-blue-700' },
  [OrderStatus.CONFIRMED]: { label: '已确认', className: 'bg-blue-100 text-blue-700' },
  [OrderStatus.IN_PRODUCTION]: { label: '生产中', className: 'bg-yellow-100 text-yellow-700' },
  [OrderStatus.SHIPPED]: { label: '已发货', className: 'bg-purple-100 text-purple-700' },
  [OrderStatus.RECEIVED]: { label: '已收货', className: 'bg-green-100 text-green-700' },
  [OrderStatus.COMPLETED]: { label: '已完成', className: 'bg-green-100 text-green-700' },
  [OrderStatus.CANCELLED]: { label: '已取消', className: 'bg-red-100 text-red-700' },
}

const inspectionStatusConfig: Record<InspectionStatus, { label: string; className: string }> = {
  [InspectionStatus.PENDING]: { label: '待检验', className: 'bg-gray-100 text-gray-600' },
  [InspectionStatus.IN_PROGRESS]: { label: '检验中', className: 'bg-blue-100 text-blue-700' },
  [InspectionStatus.PASSED]: { label: '合格', className: 'bg-green-100 text-green-700' },
  [InspectionStatus.FAILED]: { label: '不合格', className: 'bg-red-100 text-red-700' },
  [InspectionStatus.CONCESSION]: { label: '让步接收', className: 'bg-yellow-100 text-yellow-700' },
}

const exceptionStatusConfig: Record<ExceptionStatus, { label: string; className: string }> = {
  [ExceptionStatus.REPORTED]: { label: '已上报', className: 'bg-red-100 text-red-700' },
  [ExceptionStatus.ANALYZING]: { label: '分析中', className: 'bg-yellow-100 text-yellow-700' },
  [ExceptionStatus.AWAITING_SUPPLIER_FEEDBACK]: { label: '待供应商回复', className: 'bg-orange-100 text-orange-700' },
  [ExceptionStatus.SUPPLIER_RESPONDED]: { label: '供应商已回复', className: 'bg-blue-100 text-blue-700' },
  [ExceptionStatus.RESOLVED]: { label: '已解决', className: 'bg-green-100 text-green-700' },
  [ExceptionStatus.CLOSED]: { label: '已关闭', className: 'bg-gray-100 text-gray-600' },
}

const drawingStatusConfig: Record<DrawingStatus, { label: string; className: string }> = {
  [DrawingStatus.DRAFT]: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
  [DrawingStatus.PENDING_APPROVAL]: { label: '待审批', className: 'bg-yellow-100 text-yellow-700' },
  [DrawingStatus.APPROVED]: { label: '已批准', className: 'bg-green-100 text-green-700' },
  [DrawingStatus.OBSOLETE]: { label: '已作废', className: 'bg-red-100 text-red-700' },
}

const concessionDecisionConfig: Record<ConcessionDecision, { label: string; className: string }> = {
  [ConcessionDecision.PENDING]: { label: '待审批', className: 'bg-yellow-100 text-yellow-700' },
  [ConcessionDecision.APPROVED]: { label: '已批准', className: 'bg-green-100 text-green-700' },
  [ConcessionDecision.REJECTED]: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
}

type StatusType = 'order' | 'inspection' | 'exception' | 'drawing' | 'concession'

export default function StatusBadge({
  type,
  status,
}: {
  type: StatusType
  status: string
}) {
  let config: { label: string; className: string }

  switch (type) {
    case 'order':
      config = orderStatusConfig[status as OrderStatus]
      break
    case 'inspection':
      config = inspectionStatusConfig[status as InspectionStatus]
      break
    case 'exception':
      config = exceptionStatusConfig[status as ExceptionStatus]
      break
    case 'drawing':
      config = drawingStatusConfig[status as DrawingStatus]
      break
    case 'concession':
      config = concessionDecisionConfig[status as ConcessionDecision]
      break
    default:
      config = { label: status, className: 'bg-gray-100 text-gray-600' }
  }

  return (
    <span className={cn('badge', config.className)}>
      {config.label}
    </span>
  )
}
