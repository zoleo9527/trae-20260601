import { Package, Clock, AlertTriangle, User, CheckCircle2, FileText } from 'lucide-react'
import { PurchaseOrder } from '../types'
import { StatusBadge } from './StatusBadge'
import { useStore } from '../store/useStore'
import { formatDateTime, getTimeRemaining, isOverdue, cn } from '../utils'

interface PurchaseCardProps {
  purchase: PurchaseOrder
}

export function PurchaseCard({ purchase }: PurchaseCardProps) {
  const { setSelectedPurchaseId, setActiveDrawer, currentUser } = useStore()

  const handleCardClick = () => {
    setSelectedPurchaseId(purchase.id)
    if (purchase.status === 'pending_acceptance' && currentUser.role === 'admin') {
      setActiveDrawer('acceptance')
    } else if (purchase.status === 'sample_pending' && currentUser.role === 'admin') {
      setActiveDrawer('sample')
    } else if (purchase.exceptions.length > 0) {
      setActiveDrawer('exception')
    }
  }

  const needsAction = 
    purchase.currentHandlerId === currentUser.id ||
    (purchase.status === 'pending_acceptance' && currentUser.role === 'admin') ||
    (purchase.status === 'sample_pending' && currentUser.role === 'admin') ||
    (purchase.status === 'supplementing' && currentUser.role === 'purchaser')

  const hasExceptions = purchase.exceptions.length > 0
  const hasUnresolvedExceptions = purchase.exceptions.some(ex => ex.status === 'pending' || ex.status === 'processing')

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'card p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-200',
        needsAction && 'ring-2 ring-primary-200 ring-offset-1',
        hasUnresolvedExceptions && purchase.status !== 'dispute' && 'ring-2 ring-orange-200 ring-offset-1',
        purchase.status === 'overdue' && 'ring-2 ring-red-200 ring-offset-1',
        purchase.status === 'dispute' && 'ring-2 ring-purple-200 ring-offset-1'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{purchase.orderNo}</span>
              {needsAction && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 animate-pulse">
                  待处理
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{purchase.supplierName}</p>
          </div>
        </div>
        <StatusBadge status={purchase.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>配送: {formatDateTime(purchase.deliveryTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span>采购员: {purchase.purchaserName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        {purchase.items.slice(0, 3).map((item) => (
          <span key={item.id} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
            {item.name} {item.quantity}{item.unit}
          </span>
        ))}
        {purchase.items.length > 3 && (
          <span className="px-2 py-1 text-xs text-gray-500">
            +{purchase.items.length - 3}项
          </span>
        )}
      </div>

      {hasExceptions && (
        <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100 mb-4">
          <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-800 truncate">
              {purchase.exceptions.find(ex => ex.status === 'pending' || ex.status === 'processing')?.description || 
               purchase.exceptions[0]?.description}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>验收记录 {purchase.acceptanceRecords.length}</span>
          </div>
          {purchase.sampleRecord && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>已留样</span>
            </div>
          )}
        </div>

        {purchase.deadline && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue(purchase.deadline) ? 'text-red-600' : 'text-gray-500'
          )}>
            <Clock className="w-3.5 h-3.5" />
            <span>{isOverdue(purchase.deadline) ? '已逾期' : `剩余 ${getTimeRemaining(purchase.deadline)}`}</span>
          </div>
        )}
      </div>
    </div>
  )
}
