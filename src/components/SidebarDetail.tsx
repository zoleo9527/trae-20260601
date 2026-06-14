import { X, Clock, User, Store, AlertTriangle, CheckCircle, XCircle, Wrench, ArrowRight, MessageSquare, RefreshCcw, Gift, Bell, Zap, Eye, Edit } from 'lucide-react'
import { useState } from 'react'
import { useTicketStore } from '../store/ticketStore'
import { TicketStatus, TicketPriority, UserRole, HandoverType } from '../types'

const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  approved: { label: '待派工', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: ArrowRight },
  repairing: { label: '维修中', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Wrench },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: '已退回', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
}

const priorityConfig: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: '低优先级', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: '中优先级', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  high: { label: '高优先级', color: 'text-red-600', bgColor: 'bg-red-100' },
}

const handoverConfig: Record<HandoverType, { label: string; icon: typeof RefreshCcw; color: string; bgColor: string; description: string }> = {
  shift_close: { label: '班结问题', icon: RefreshCcw, color: 'text-purple-600', bgColor: 'bg-purple-100', description: '销售班结时发现的设备故障' },
  prize_claim: { label: '兑奖异常', icon: Gift, color: 'text-amber-600', bgColor: 'bg-amber-100', description: '兑奖登记时发现的设备故障' },
  normal_fault: { label: '设备故障', icon: AlertTriangle, color: 'text-gray-600', bgColor: 'bg-gray-100', description: '日常使用中发现的设备故障' },
}

const roleLabels: Record<UserRole, string> = {
  clerk: '店员',
  manager: '店长',
  admin: '片区管理员',
}

export function SidebarDetail() {
  const { selectedTicket, selectTicket, updateTicketStatus, addRemark, supplementTicket, currentUser } = useTicketStore()
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
  const handover = selectedTicket.handoverType ? handoverConfig[selectedTicket.handoverType] : null
  const HandoverIcon = handover?.icon

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

  const handleSupplement = () => {
    if (remarkInput.trim()) {
      supplementTicket(selectedTicket.id, remarkInput.trim())
      setRemarkInput('')
      setShowRemarkModal(false)
    }
  }

  const canApprove = (currentUser.role === 'manager' || currentUser.role === 'admin') && selectedTicket.status === 'pending'
  const canReject = (currentUser.role === 'manager' || currentUser.role === 'admin') && selectedTicket.status === 'pending'
  const canDispatch = currentUser.role === 'admin' && selectedTicket.status === 'approved'
  const canComplete = (currentUser.role === 'admin' || currentUser.role === 'manager') && selectedTicket.status === 'repairing'
  const canAddRemark = currentUser.role === 'clerk' || currentUser.role === 'manager' || currentUser.role === 'admin'
  const canSupplement = currentUser.role === 'clerk' && selectedTicket.status === 'rejected'

  const canConfirmAction = selectedAction !== 'rejected' || actionRemark.trim() !== ''

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
            {handover && HandoverIcon && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${handover.color} ${handover.bgColor}`}>
                <HandoverIcon className="w-3 h-3" />
                {handover.label}
              </span>
            )}
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

        {selectedTicket.isAlert && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">异常提醒</p>
                <p className="text-xs text-amber-700 mt-1">{selectedTicket.alertMessage}</p>
              </div>
            </div>
          </div>
        )}

        {selectedTicket.shiftCloseInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCcw className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-semibold text-purple-900">销售班结信息</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">班结单号:</span>
                <span className="text-purple-900 font-mono font-medium">{selectedTicket.shiftCloseInfo.shiftId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">班结日期:</span>
                <span className="text-purple-900">{selectedTicket.shiftCloseInfo.shiftDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">班次:</span>
                <span className="text-purple-900">
                  {selectedTicket.shiftCloseInfo.shiftPeriod === 'morning' ? '早班' :
                   selectedTicket.shiftCloseInfo.shiftPeriod === 'afternoon' ? '中班' :
                   selectedTicket.shiftCloseInfo.shiftPeriod === 'evening' ? '晚班' : '夜班'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">销售额:</span>
                <span className="text-purple-900 font-medium">¥{selectedTicket.shiftCloseInfo.salesAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-700">彩票数量:</span>
                <span className="text-purple-900">{selectedTicket.shiftCloseInfo.ticketCount} 张</span>
              </div>
              {selectedTicket.shiftCloseInfo.remark && (
                <div className="pt-2 border-t border-purple-200">
                  <p className="text-xs text-purple-700">备注: {selectedTicket.shiftCloseInfo.remark}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTicket.prizeClaimInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-semibold text-amber-900">兑奖登记信息</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-amber-700">兑奖单号:</span>
                <span className="text-amber-900 font-mono font-medium">{selectedTicket.prizeClaimInfo.claimId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-700">兑奖日期:</span>
                <span className="text-amber-900">{selectedTicket.prizeClaimInfo.claimDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-700">中奖等级:</span>
                <span className="text-amber-900 font-medium">{selectedTicket.prizeClaimInfo.prizeLevel}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-700">中奖金额:</span>
                <span className="text-amber-900 font-medium">¥{selectedTicket.prizeClaimInfo.prizeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-700">彩票编号:</span>
                <span className="text-amber-900 font-mono">{selectedTicket.prizeClaimInfo.ticketId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-700">设备使用:</span>
                <span className={selectedTicket.prizeClaimInfo.deviceUsed ? 'text-amber-900' : 'text-gray-500'}>
                  {selectedTicket.prizeClaimInfo.deviceUsed ? '是' : '否'}
                </span>
              </div>
              {selectedTicket.prizeClaimInfo.remark && (
                <div className="pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-700">备注: {selectedTicket.prizeClaimInfo.remark}</p>
                </div>
              )}
            </div>
          </div>
        )}

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

        {selectedTicket.status === 'rejected' && selectedTicket.rejectedReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-semibold text-red-900">退回原因</h4>
            </div>
            <p className="text-sm text-red-700">{selectedTicket.rejectedReason}</p>
          </div>
        )}

        {selectedTicket.status === 'rejected' && !selectedTicket.rejectedReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-semibold text-red-900">退回原因</h4>
            </div>
            <p className="text-sm text-red-600">未填写退回原因</p>
          </div>
        )}

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">处理历史</h4>
          <div className="relative">
            {selectedTicket.processHistory.map((step, index) => {
              const stepStatus = step.action.includes('审核通过') || step.action.includes('派工') || step.action.includes('维修完成') ? 'success' :
                                 step.action.includes('退回') ? 'error' :
                                 step.action.includes('提醒') ? 'warning' : 'default'
              
              return (
                <div key={step.id} className="flex gap-3 mb-4 last:mb-0">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${
                      stepStatus === 'success' ? 'bg-green-500' :
                      stepStatus === 'error' ? 'bg-red-500' :
                      stepStatus === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    {index < selectedTicket.processHistory.length - 1 && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{step.action}</span>
                      <span className="text-xs text-gray-400">{formatDate(step.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{step.operator}</span>
                      {step.role && (
                        <>
                          <span className="text-gray-300">-</span>
                          <span>{roleLabels[step.role]}</span>
                        </>
                      )}
                    </div>
                    {step.remark && (
                      <p className="text-xs text-gray-600 mt-2 bg-white rounded p-2">
                        {step.action.includes('退回') ? `退回原因: ${step.remark}` : step.remark}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">状态流程</h4>
          <div className="flex items-center justify-between">
            {['待审核', '待派工', '维修中', '已完成'].map((label, index) => {
              const statusKey = label === '待审核' ? 'pending' :
                               label === '待派工' ? 'approved' :
                               label === '维修中' ? 'repairing' : 'completed'
              const isActive = ['pending', 'approved', 'repairing', 'completed'].indexOf(selectedTicket.status) >= index
              const isCurrent = statusKey === selectedTicket.status

              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-200' :
                      isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs mt-1 ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-1 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">当前角色: {roleLabels[currentUser.role]}</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {canApprove && <p>• 可以审核通过该故障单</p>}
            {canReject && <p>• 可以退回该故障单</p>}
            {canDispatch && <p>• 可以派工维修</p>}
            {canComplete && <p>• 可以完成维修</p>}
            {canAddRemark && <p>• 可以添加备注</p>}
            {canSupplement && <p>• 可以补充说明后重新提交</p>}
            {!canApprove && !canReject && !canDispatch && !canComplete && !canAddRemark && !canSupplement && (
              <p>• 暂无操作权限</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 space-y-3">
        {canAddRemark && !canSupplement && (
          <button
            onClick={() => setShowRemarkModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            添加备注
          </button>
        )}

        {canSupplement && (
          <button
            onClick={() => setShowRemarkModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            补充说明并重新提交
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

        {!canApprove && !canReject && !canDispatch && !canComplete && !canAddRemark && !canSupplement && (
          <p className="text-center text-sm text-gray-400">暂无可用操作</p>
        )}
      </div>

      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {canSupplement ? '补充说明' : '添加备注'}
            </h3>
            <textarea
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              placeholder={canSupplement ? '请补充故障的详细描述...' : '请输入备注内容...'}
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
                onClick={canSupplement ? handleSupplement : handleAddRemark}
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
            <p className="text-sm text-gray-600 mb-4">
              确定要将故障单状态改为「{statusConfig[selectedAction].label}」吗？
              {selectedAction === 'rejected' && (
                <span className="block mt-2 text-amber-600 text-xs">
                  退回后，店员可以补充说明后重新提交
                </span>
              )}
              {selectedAction === 'repairing' && (
                <span className="block mt-2 text-purple-600 text-xs">
                  派工后，维修人员将开始处理
                </span>
              )}
            </p>
            <textarea
              value={actionRemark}
              onChange={(e) => setActionRemark(e.target.value)}
              placeholder={selectedAction === 'rejected' ? '请输入退回原因...' : '可选：添加操作备注...'}
              className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none h-24 ${
                selectedAction === 'rejected' && !actionRemark.trim() ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            {selectedAction === 'rejected' && !actionRemark.trim() && (
              <p className="text-xs text-red-500 mt-1">退回原因不能为空</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                disabled={!canConfirmAction}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !canConfirmAction
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : selectedAction === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
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
