import { useState } from 'react'
import { X, Check, XCircle, FilePlus, Package, Clock, User, FileText, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDateTime, cn, roleConfig } from '../../utils'
import { StatusBadge } from '../StatusBadge'
import { ProcessTimeline } from '../ProcessTimeline'

export function AcceptanceDrawer() {
  const { 
    selectedPurchaseId, 
    purchaseOrders, 
    setActiveDrawer, 
    processAcceptance, 
    currentUser,
    loading
  } = useStore()
  const [action, setAction] = useState<'accept' | 'reject' | 'supplement' | null>(null)
  const [remark, setRemark] = useState('')

  const purchase = purchaseOrders.find(p => p.id === selectedPurchaseId)
  if (!purchase) return null

  const isResubmit = purchase.status === 'supplement_submitted'

  const handleSubmit = () => {
    if (!action) return
    processAcceptance(purchase.id, action, remark)
    setAction(null)
    setRemark('')
  }

  const handleClose = () => {
    setActiveDrawer(null)
    setAction(null)
    setRemark('')
  }

  return (
    <>
      <div className="drawer-overlay" onClick={handleClose} />
      <div className="drawer-panel">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isResubmit ? '重新验收' : '采购验收'}
              </h3>
              <p className="text-sm text-gray-500">{purchase.orderNo}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">{purchase.supplierName}</span>
              <StatusBadge status={purchase.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>配送: {formatDateTime(purchase.deliveryTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>采购员: {purchase.purchaserName}</span>
              </div>
            </div>
            {isResubmit && (
              <div className="mt-3 flex items-center gap-2 text-sm text-cyan-600 bg-cyan-50 px-3 py-2 rounded-lg">
                <FilePlus className="w-4 h-4" />
                <span>采购员已补录材料，这是第 {purchase.resubmitCount + 1} 次验收</span>
              </div>
            )}
          </div>

          <ProcessTimeline purchase={purchase} currentRole={currentUser.role} />

          <div className="card p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              采购明细
            </h4>
            <div className="space-y-2">
              {purchase.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.specification} · 批次 {item.batchNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{item.quantity}{item.unit}</div>
                    {item.price && <div className="text-xs text-gray-500">¥{item.price}/{item.unit}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {purchase.acceptanceRecords.length > 0 && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-900 mb-3">验收历史</h4>
              <div className="space-y-3">
                {purchase.acceptanceRecords.map((record) => (
                  <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      record.action === 'accept' ? 'bg-green-100' :
                      record.action === 'reject' ? 'bg-red-100' : 'bg-orange-100'
                    )}>
                      {record.action === 'accept' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : record.action === 'reject' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <FilePlus className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{record.operatorName}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(record.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {record.action === 'accept' ? '验收通过' :
                         record.action === 'reject' ? '验收驳回' : '要求补充材料'}
                      </p>
                      {record.remark && (
                        <p className="text-sm text-gray-500 mt-1">{record.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4 space-y-4">
            <h4 className="font-medium text-gray-900">选择验收结果</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setAction('accept')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  action === 'accept'
                    ? 'border-success-500 bg-success-50'
                    : 'border-gray-200 hover:border-success-300 hover:bg-success-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  action === 'accept' ? 'bg-success-500 text-white' : 'bg-success-100 text-success-600'
                )}>
                  <Check className="w-5 h-5" />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  action === 'accept' ? 'text-success-700' : 'text-gray-700'
                )}>验收通过</span>
              </button>

              <button
                onClick={() => setAction('supplement')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  action === 'supplement'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  action === 'supplement' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                )}>
                  <FilePlus className="w-5 h-5" />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  action === 'supplement' ? 'text-orange-700' : 'text-gray-700'
                )}>需补充</span>
              </button>

              <button
                onClick={() => setAction('reject')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  action === 'reject'
                    ? 'border-danger-500 bg-danger-50'
                    : 'border-gray-200 hover:border-danger-300 hover:bg-danger-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  action === 'reject' ? 'bg-danger-500 text-white' : 'bg-danger-100 text-danger-600'
                )}>
                  <XCircle className="w-5 h-5" />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  action === 'reject' ? 'text-danger-700' : 'text-gray-700'
                )}>驳回</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {action === 'reject' || action === 'supplement' ? '原因说明 *' : '备注（可选）'}
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={
                  action === 'reject' ? '请说明驳回原因...' :
                  action === 'supplement' ? '请说明需要补充的材料...' :
                  '输入验收备注...'
                }
                className="textarea h-24"
              />
            </div>
          </div>

          {action === 'accept' && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">验收通过后将进入留样登记环节</p>
                  <p className="text-sm text-blue-700 mt-1">
                    由 {currentUser.name}（食堂管理员）负责留样登记，然后通知班主任确认
                  </p>
                </div>
              </div>
            </div>
          )}

          {(action === 'reject' || action === 'supplement') && (
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <FilePlus className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    {action === 'reject' ? '驳回后将通知采购员处理' : '补充材料要求将发送给采购员'}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    当前处理人将变更为：{purchase.purchaserName}（采购员）
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              操作人：{currentUser.name}
              <span className={cn('ml-1.5 px-1.5 py-0.5 rounded text-xs', roleConfig[currentUser.role].color)}>
                {roleConfig[currentUser.role].label}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!action || loading || ((action === 'reject' || action === 'supplement') && !remark.trim())}
                className={cn(
                  action === 'accept' ? 'btn-success' :
                  action === 'supplement' ? 'btn-warning' :
                  'btn-danger'
                )}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />处理中...</>
                ) : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
