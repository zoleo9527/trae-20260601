import { useState } from 'react'
import { 
  X, AlertTriangle, Clock, User, Send, CheckCircle, FileUp, 
  MessageSquare, Package, FileText, AlertCircle
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDateTime, cn, exceptionTypeConfig, isOverdue, getTimeRemaining, roleConfig } from '../../utils'
import { StatusBadge } from '../StatusBadge'

export function ExceptionDrawer() {
  const { 
    selectedPurchaseId, 
    purchaseOrders, 
    setActiveDrawer, 
    addExceptionComment, 
    resolveException,
    submitSupplement,
    currentUser,
    setActiveDrawer: setDrawer
  } = useStore()
  
  const [comment, setComment] = useState('')
  const [resolution, setResolution] = useState('')
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const purchase = purchaseOrders.find(p => p.id === selectedPurchaseId)

  if (!purchase) return null

  const activeException = selectedExceptionId 
    ? purchase.exceptions.find(ex => ex.id === selectedExceptionId)
    : purchase.exceptions.find(ex => ex.status === 'pending' || ex.status === 'processing') || purchase.exceptions[0]

  const handleAddComment = () => {
    if (!comment.trim() || !activeException) return
    addExceptionComment(purchase.id, activeException.id, comment)
    setComment('')
  }

  const handleResolve = () => {
    if (!resolution.trim() || !activeException) return
    setSubmitting(true)
    setTimeout(() => {
      resolveException(purchase.id, activeException.id, resolution)
      setSubmitting(false)
      setResolution('')
    }, 500)
  }

  const handleSubmitSupplement = () => {
    setSubmitting(true)
    setTimeout(() => {
      submitSupplement(purchase.id, comment || '材料已补充')
      setSubmitting(false)
      setComment('')
      setActiveDrawer(null)
    }, 500)
  }

  const handleGoToAcceptance = () => {
    setDrawer('acceptance')
  }

  const handleGoToSample = () => {
    setDrawer('sample')
  }

  const handleClose = () => {
    setActiveDrawer(null)
    setSelectedExceptionId(null)
    setComment('')
    setResolution('')
  }

  const canResolve = currentUser.role === 'admin' && activeException?.status !== 'resolved' && activeException?.status !== 'closed'
  const canSubmitSupplement = currentUser.role === 'purchaser' && purchase.status === 'supplementing'
  const isMyTurn = purchase.currentHandlerId === currentUser.id

  return (
    <>
      <div className="drawer-overlay" onClick={handleClose} />
      <div className="drawer-panel">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              purchase.status === 'dispute' ? 'bg-purple-100' :
              purchase.status === 'overdue' ? 'bg-red-100' : 'bg-orange-100'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5',
                purchase.status === 'dispute' ? 'text-purple-600' :
                purchase.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">异常处理</h3>
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
            {purchase.deadline && (
              <div className={cn(
                'mt-3 flex items-center gap-2 text-sm',
                isOverdue(purchase.deadline) ? 'text-red-600' : 'text-amber-600'
              )}>
                <AlertCircle className="w-4 h-4" />
                <span>
                  处理期限: {formatDateTime(purchase.deadline)} 
                  ({isOverdue(purchase.deadline) ? '已逾期' : `剩余 ${getTimeRemaining(purchase.deadline)}`})
                </span>
              </div>
            )}
          </div>

          {purchase.items.length > 0 && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                涉及物品
              </h4>
              <div className="flex flex-wrap gap-2">
                {purchase.items.map((item) => (
                  <span key={item.id} className="px-2.5 py-1 bg-gray-100 rounded text-sm text-gray-700">
                    {item.name} {item.quantity}{item.unit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {purchase.exceptions.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              {purchase.exceptions.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExceptionId(ex.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeException?.id === ex.id
                      ? exceptionTypeConfig[ex.type].color.replace('text-', 'bg-').replace('600', '100') + ' ' + exceptionTypeConfig[ex.type].color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    ex.status === 'resolved' ? 'bg-green-500' :
                    ex.status === 'processing' ? 'bg-amber-500' : 'bg-red-500'
                  )} />
                  {exceptionTypeConfig[ex.type].label}
                </button>
              ))}
            </div>
          )}

          {activeException && (
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    activeException.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    activeException.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {activeException.status === 'resolved' ? '已解决' :
                     activeException.status === 'processing' ? '处理中' :
                     activeException.status === 'pending' ? '待处理' : '已关闭'}
                  </span>
                  <span className={cn('text-sm font-medium', exceptionTypeConfig[activeException.type].color)}>
                    {exceptionTypeConfig[activeException.type].label}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDateTime(activeException.createdAt)}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{activeException.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>发起人: {activeException.initiatorName}</span>
                  {activeException.handlerName && <span>处理人: {activeException.handlerName}</span>}
                </div>
              </div>

              {activeException.resolution && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-1">
                    <CheckCircle className="w-4 h-4" />
                    处理结果
                  </div>
                  <p className="text-green-900">{activeException.resolution}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {activeException.resolvedAt && formatDateTime(activeException.resolvedAt)}
                  </p>
                </div>
              )}

              {activeException.comments && activeException.comments.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    沟通记录 ({activeException.comments.length})
                  </h5>
                  <div className="space-y-3">
                    {activeException.comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium',
                          c.userId === currentUser.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                        )}>
                          {c.userName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{c.userName}</span>
                            <span className="text-xs text-gray-500">{formatDateTime(c.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeException.status !== 'resolved' && activeException.status !== 'closed' && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="输入沟通内容..."
                      className="input flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!comment.trim()}
                      className="btn-primary"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {purchase.acceptanceRecords.length > 0 && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                验收记录
              </h4>
              <div className="space-y-2">
                {purchase.acceptanceRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{record.operatorName}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(record.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {record.action === 'accept' ? '验收通过' :
                       record.action === 'reject' ? '验收驳回' : '要求补充材料'}
                    </p>
                    {record.remark && <p className="text-sm text-gray-500 mt-1">{record.remark}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentUser.role === 'admin' && purchase.status === 'sample_pending' && (
            <button onClick={handleGoToSample} className="w-full btn-primary">
              前往留样登记
            </button>
          )}
          {currentUser.role === 'admin' && purchase.status === 'pending_acceptance' && (
            <button onClick={handleGoToAcceptance} className="w-full btn-primary">
              前往验收处理
            </button>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                当前处理人：
                <span className={cn(
                  'font-medium ml-1',
                  isMyTurn ? 'text-primary-600' : 'text-gray-700'
                )}>
                  {purchase.currentHandlerName || '待分配'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                您的身份：<span className={cn('px-1.5 py-0.5 rounded text-xs', roleConfig[currentUser.role].color)}>
                  {roleConfig[currentUser.role].label}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="btn-secondary">
                关闭
              </button>
              {canSubmitSupplement && (
                <button
                  onClick={handleSubmitSupplement}
                  disabled={submitting}
                  className="btn-success"
                >
                  <FileUp className="w-4 h-4 mr-1.5" />
                  {submitting ? '提交中...' : '提交补充材料'}
                </button>
              )}
              {canResolve && (
                <button
                  onClick={() => {
                    if (resolution.trim()) {
                      handleResolve()
                    }
                  }}
                  disabled={submitting || !resolution.trim()}
                  className="btn-success"
                >
                  {submitting ? '处理中...' : '标记解决'}
                </button>
              )}
            </div>
          </div>
          {canResolve && (
            <div className="mt-3">
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="输入处理结果说明..."
                className="textarea h-20"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
