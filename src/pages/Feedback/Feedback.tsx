import { useState, useEffect } from 'react'
import { MessageSquarePlus, Filter, Search, Clock, Users } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { useUserStore } from '@/contexts/UserContext'
import { Table } from '@/components/Table/Table'
import { Drawer } from '@/components/Drawer/Drawer'
import { feedbackService } from '@/services/feedbackService'
import { exceptionService } from '@/services/exceptionService'
import type { ProcessFeedback, ExceptionHandle } from '@/types'
import { clsx } from 'clsx'

export function Feedback() {
  const { feedbacks, stuckFeedbacks, loadFeedbacks } = useAppStore()
  const { currentUser } = useUserStore()
  const [selectedFeedback, setSelectedFeedback] = useState<ProcessFeedback | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [handles, setHandles] = useState<ExceptionHandle[]>([])
  const [action, setAction] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  
  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])
  
  const filteredFeedbacks = feedbacks.filter(f => {
    if (filterStatus && f.status !== filterStatus) return false
    if (searchText && !f.content.includes(searchText) && !f.submitterName.includes(searchText)) return false
    return true
  })
  
  const handleFeedbackClick = (feedback: ProcessFeedback) => {
    setSelectedFeedback(feedback)
    const history = exceptionService.getHandlesByTarget('feedback', feedback.id)
    setHandles(history)
    setDrawerOpen(true)
  }
  
  const handleException = () => {
    if (!selectedFeedback || !currentUser || !action || !reason) return
    
    exceptionService.handleException({
      targetType: 'feedback',
      targetId: selectedFeedback.id,
      action: action as any,
      reason,
    }, currentUser.id, currentUser.name, currentUser.role)
    
    loadFeedbacks()
    setDrawerOpen(false)
    setSelectedFeedback(null)
    setAction('')
    setReason('')
  }
  
  const getStatusBadge = (status: ProcessFeedback['status']) => {
    const config = {
      pending: { label: '待处理', color: 'blue' },
      processing: { label: '处理中', color: 'orange' },
      rejected: { label: '已驳回', color: 'red' },
      supplemented: { label: '已补录', color: 'green' },
      completed: { label: '已完成', color: 'green' },
      stuck: { label: '卡住', color: 'red' },
    }
    return config[status]
  }
  
  const getTypeBadge = (type: ProcessFeedback['type']) => {
    const config = {
      complaint: { label: '投诉', color: 'red' },
      suggestion: { label: '建议', color: 'blue' },
      issue: { label: '问题', color: 'orange' },
      addition_request: { label: '加项请求', color: 'green' },
    }
    return config[type]
  }
  
  const columns = [
    {
      key: 'id',
      title: '反馈ID',
      render: (value: unknown) => (
        <span className="font-medium text-gray-900">{String(value).replace('feedback-', '#')}</span>
      ),
    },
    {
      key: 'submitterName',
      title: '提交人',
      render: (value: unknown, record: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.submitterId}`}
            alt={String(value)}
            className="w-8 h-8 rounded-full bg-gray-200"
          />
          <div>
            <p className="font-medium">{String(value)}</p>
            <p className="text-xs text-gray-500">
              {record.submitterRole === 'housekeeper' ? '家政员' : '客户'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (value: unknown) => {
        const config = getTypeBadge(value as ProcessFeedback['type'])
        return (
          <span className={clsx(
            'px-2 py-1 rounded text-xs font-medium',
            config.color === 'red' && 'bg-red-100 text-red-700',
            config.color === 'blue' && 'bg-blue-100 text-blue-700',
            config.color === 'orange' && 'bg-orange-100 text-orange-700',
            config.color === 'green' && 'bg-green-100 text-green-700',
          )}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'content',
      title: '内容',
      render: (value: unknown) => (
        <p className="text-sm text-gray-700 max-w-xs truncate">{String(value)}</p>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: unknown) => {
        const config = getStatusBadge(value as ProcessFeedback['status'])
        return (
          <span className={clsx(
            'px-2 py-1 rounded text-xs font-medium',
            config.color === 'red' && 'bg-red-100 text-red-700',
            config.color === 'blue' && 'bg-blue-100 text-blue-700',
            config.color === 'orange' && 'bg-orange-100 text-orange-700',
            config.color === 'green' && 'bg-green-100 text-green-700',
          )}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      title: '提交时间',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {new Date(String(value)).toLocaleString('zh-CN')}
        </span>
      ),
    },
  ]
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">过程反馈管理</h1>
          <p className="text-gray-500 mt-1">管理所有过程反馈，追踪处理进度</p>
        </div>
      </div>
      
      {stuckFeedbacks.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <MessageSquarePlus className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900">
                {stuckFeedbacks.length} 个反馈卡住需要处理
              </p>
              <p className="text-sm text-orange-700 mt-1">
                点击下方列表中的卡住反馈进行快速处理
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索反馈内容或提交人..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="stuck">卡住</option>
          <option value="rejected">已驳回</option>
          <option value="supplemented">已补录</option>
          <option value="completed">已完成</option>
        </select>
      </div>
      
      <Table 
        columns={columns} 
        data={filteredFeedbacks as Record<string, unknown>[]}
        onRowClick={(record) => handleFeedbackClick(record as unknown as ProcessFeedback)}
      />
      
      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        title="反馈处理"
        width="lg"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">反馈信息</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p><span className="text-gray-500">提交人:</span> {selectedFeedback.submitterName} ({selectedFeedback.submitterRole === 'housekeeper' ? '家政员' : '客户'})</p>
                <p><span className="text-gray-500">反馈类型:</span> {getTypeBadge(selectedFeedback.type).label}</p>
                <p><span className="text-gray-500">反馈内容:</span> {selectedFeedback.content}</p>
                <p><span className="text-gray-500">当前状态:</span> {getStatusBadge(selectedFeedback.status).label}</p>
                {selectedFeedback.stuckInfo && (
                  <>
                    <p><span className="text-gray-500">卡住时长:</span> {selectedFeedback.stuckInfo.stuckDuration} 分钟</p>
                    <p><span className="text-gray-500">卡住原因:</span> {selectedFeedback.stuckInfo.stuckReason}</p>
                  </>
                )}
              </div>
            </div>
            
            {selectedFeedback.currentHandler && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">当前处理人</h3>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFeedback.currentHandler.id}`}
                    alt={selectedFeedback.currentHandler.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedFeedback.currentHandler.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedFeedback.currentHandler.role === 'customer_service' ? '客服' : '质检主管'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">处理进度追踪</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-700">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">提交反馈</p>
                    <p className="text-xs text-gray-500">{new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      selectedFeedback.status === 'pending' ? 'bg-orange-100' : 'bg-green-100'
                    )}>
                      <span className={clsx(
                        "text-xs font-medium",
                        selectedFeedback.status === 'pending' ? 'text-orange-700' : 'text-green-700'
                      )}>2</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">分配处理人</p>
                      {selectedFeedback.currentHandler ? (
                        <p className="text-xs text-gray-500">{selectedFeedback.currentHandler.name}</p>
                      ) : (
                        <p className="text-xs text-orange-600">待分配</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      selectedFeedback.status === 'stuck' ? 'bg-red-100' :
                      selectedFeedback.status === 'completed' || selectedFeedback.status === 'rejected' || selectedFeedback.status === 'supplemented' ? 'bg-green-100' : 'bg-gray-100'
                    )}>
                      <span className={clsx(
                        "text-xs font-medium",
                        selectedFeedback.status === 'stuck' ? 'text-red-700' :
                        selectedFeedback.status === 'completed' || selectedFeedback.status === 'rejected' || selectedFeedback.status === 'supplemented' ? 'text-green-700' : 'text-gray-700'
                      )}>3</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">处理反馈</p>
                      {selectedFeedback.status === 'stuck' ? (
                        <p className="text-xs text-red-600">卡住 - {selectedFeedback.stuckInfo?.stuckReason}</p>
                      ) : selectedFeedback.status === 'completed' ? (
                        <p className="text-xs text-green-600">已完成</p>
                      ) : selectedFeedback.status === 'rejected' ? (
                        <p className="text-xs text-red-600">已驳回</p>
                      ) : selectedFeedback.status === 'supplemented' ? (
                        <p className="text-xs text-green-600">已补录</p>
                      ) : (
                        <p className="text-xs text-gray-500">进行中</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {handles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">处理历史</h3>
                <div className="space-y-2">
                  {handles.map(handle => (
                    <div key={handle.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{handle.action}</p>
                          <p className="text-sm text-gray-500">{handle.handlerName} · {handle.reason}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(handle.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">处理操作</h3>
              <div className="space-y-3">
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择处理方式</option>
                  <option value="reject">驳回</option>
                  <option value="supplement">补录信息</option>
                  <option value="transfer">转交其他处理人</option>
                  <option value="complete">完成处理</option>
                </select>
                
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入处理原因"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                
                <button
                  onClick={handleException}
                  disabled={!action || !reason}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  提交处理
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}