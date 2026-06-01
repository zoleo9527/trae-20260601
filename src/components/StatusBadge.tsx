import { cn } from '@/lib/utils'

const statusConfigs: Record<string, Record<string, { label: string; className: string }>> = {
  order: {
    DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
    SENT: { label: '已发送', className: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { label: '已确认', className: 'bg-blue-100 text-blue-700' },
    IN_PRODUCTION: { label: '生产中', className: 'bg-yellow-100 text-yellow-700' },
    SHIPPED: { label: '已发货', className: 'bg-purple-100 text-purple-700' },
    RECEIVED: { label: '已收货', className: 'bg-green-100 text-green-700' },
    COMPLETED: { label: '已完成', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: '已取消', className: 'bg-red-100 text-red-700' },
  },
  inspection: {
    PENDING: { label: '待检验', className: 'bg-gray-100 text-gray-600' },
    IN_PROGRESS: { label: '检验中', className: 'bg-blue-100 text-blue-700' },
    PASSED: { label: '合格', className: 'bg-green-100 text-green-700' },
    FAILED: { label: '不合格', className: 'bg-red-100 text-red-700' },
    CONCESSION: { label: '让步接收', className: 'bg-yellow-100 text-yellow-700' },
  },
  exception: {
    REPORTED: { label: '已上报', className: 'bg-red-100 text-red-700' },
    ANALYZING: { label: '分析中', className: 'bg-yellow-100 text-yellow-700' },
    AWAITING_SUPPLIER_FEEDBACK: { label: '待供应商回复', className: 'bg-orange-100 text-orange-700' },
    SUPPLIER_RESPONDED: { label: '供应商已回复', className: 'bg-blue-100 text-blue-700' },
    RESOLVED: { label: '已解决', className: 'bg-green-100 text-green-700' },
    CLOSED: { label: '已关闭', className: 'bg-gray-100 text-gray-600' },
  },
  drawing: {
    DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
    PENDING_APPROVAL: { label: '待审批', className: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: '已批准', className: 'bg-green-100 text-green-700' },
    OBSOLETE: { label: '已作废', className: 'bg-red-100 text-red-700' },
  },
  concession: {
    PENDING: { label: '待审批', className: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: '已批准', className: 'bg-green-100 text-green-700' },
    REJECTED: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
  },
}

type StatusType = 'order' | 'inspection' | 'exception' | 'drawing' | 'concession'

export default function StatusBadge({
  type,
  status,
}: {
  type: StatusType
  status: string
}) {
  const config = statusConfigs[type]?.[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }

  return (
    <span className={cn('badge', config.className)}>
      {config.label}
    </span>
  )
}
