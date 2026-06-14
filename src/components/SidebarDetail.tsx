
import { X, Clock, User, Store, AlertTriangle, CheckCircle, XCircle, Wrench, ArrowRight, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTicketStore } from '../store/ticketStore'
import { TicketStatus, TicketPriority, UserRole } from '../types'

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  approved: { label: '已派工', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: ArrowRight },
  repairing: { label: '维修中', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Wrench },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: '已退回', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
}

const priorityConfig: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: '低优先级', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: '中优先级', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  high: { label: '高优先级', color: 'text-red-600', bgColor: 'bg-red-100' },
}

export function SidebarDetail() {
  const { selectedTicket, selectTicket, updateTicketStatus, addRemark, currentUser } = useTicketStore()
  const [remarkInput, setRemarkInput] = useState('')
  const [showRemarkModal, setShowRemarkModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState<TicketStatus | null>(null)
  const [actionRemark, setActionRemark] = useState('')

  if (!selectedTicket) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">请选择一个故障单查看详情</p>
      </div>
    )
  }

  const status = statusConfig[selectedTicket.status]
  const priority = priorityConfig[selectedTicket.priority]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleStatusUpdate = (newStatus: TicketStatus) => {
    setSelectedAction(newStatus)
    setActionRemark('')
    setShowActionModal(true)
  }

  const confirmAction = () => {
    if (selectedAction) {
      updateTicketStatus(selectedTicket.id, selectedAction, actionRemark || undefined)
    }
    setShowActionModal(false)
    setSelectedAction(null)
  }

  const handleAddRemark = () => {
    if (remarkInput.trim()) {
      addRemark(selectedTicket.id, remarkInput.trim())
      setRemarkInput('')
      setShowRemarkModal(false)
    }
  }

  const canApprove = (currentUser.role === 'manager' || currentUser.role === 'admin') && selectedTicket.status === 'pending'
  const canReject = (currentUser.role === 'manager' || currentUser.role === 'admin') && selectedTicket.status === 'pending'
  const canDispatch = (currentUser.role === 'admin') && selectedTicket.status === 'approved'
  const canComplete = (currentUser.role === 'admin' || currentUser.role === 'manager') && selectedTicket.status === 'repairing'
  const canAddRemark = currentUser.role === 'clerk' || currentUser.role === 'manager' || currentUser.role === 'admin'

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">故障单详情</h2>
        <button
          onClick={() => selectTicket(null)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-gray-900">{selectedTicket.deviceId}</span>
          </div>
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTicket.deviceName}</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Store className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{selectedTicket.storeName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">提交人: {selectedTicket.createdBy}</span>
          </div>
          {selectedTicket.assignedTo && (
            <div className="flex items-center gap-3 text-sm">
              <Wrench className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">维修人员: {selectedTicket.assignedTo}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">创建时间: {formatDate(selectedTicket.createdAt)}</span>
          </div>
        </div>

        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${priority.color} ${priority.bgColor} mb-4`}>
          <AlertTriangle className="w-4 h-4" />
          {priority.label}
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">故障描述</h4>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedTicket.description}</p>
        </div>

        {selectedTicket.remarks && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">处理备注</h4>
            <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">{selectedTicket.remarks}</p>
          </div>
        )}

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">处理历史</h4>
          <div className="relative">
            {selectedTicket.processHistory.map((step, index) => (
              <div key={step.id} className="flex gap-3 mb-4 last:mb-0">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  {index < selectedTicket.processHistory.length - 1 && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{step.action}</span>
                    <span className="text-xs text-gray-400">{formatDate(step.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-500">操作人: {step.operator}</p>
                  {step.remark && (
                    <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-2">{step.remark}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 space-y-3">
        {canAddRemark && (
          <button
            onClick={() => setShowRemarkModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            添加备注
          </button>
        )}

        <div className="flex gap-2">
          {canApprove && (
            <button
              onClick={() => handleStatusUpdate('approved')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              审核通过
            </button>
          )}
          {canReject && (
            <button
              onClick={() => handleStatusUpdate('rejected')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              退回
            </button>
          )}
          {canDispatch && (
            <button
              onClick={() => handleStatusUpdate('repairing')}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              派工维修
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              完成维修
            </button>
          )}
        </div>

        {!canApprove && !canReject && !canDispatch && !canComplete && !canAddRemark && (
          <p className="text-center text-sm text-gray-400">暂无可用操作</p>
        )}
      </div>

      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加备注</h3>
            <textarea
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder="请输入备注内容..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRemarkModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRemark}
                disabled={!remarkInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showActionModal && selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认操作</h3>
            <p className="text-sm text-gray-600 mb-4">确定要将故障单状态改为「{statusConfig[selectedAction].label}」吗？</p>
            <textarea
              value={actionRemark}
              onChange={(e) => setActionRemark(e.target.value)}
              placeholder="可选：添加操作备注..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 ${selectedAction === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
