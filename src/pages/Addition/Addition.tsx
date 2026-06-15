import { useState, useEffect } from 'react'
import { FileText, Search, Filter, History, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { useUserStore } from '@/contexts/UserContext'
import { Table } from '@/components/Table/Table'
import { Drawer } from '@/components/Drawer/Drawer'
import { Timeline } from '@/components/Timeline/Timeline'
import { additionService } from '@/services/additionService'
import { exceptionService } from '@/services/exceptionService'
import type { AdditionRecord, ExceptionHandle, AdditionHistoryItem } from '@/types'
import { clsx } from 'clsx'

export function Addition() {
  const { additions, incompleteAdditions, loadAdditions, users } = useAppStore()
  const { currentUser } = useUserStore()
  const [selectedAddition, setSelectedAddition] = useState<AdditionRecord | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [handles, setHandles] = useState<ExceptionHandle[]>([])
  const [action, setAction] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [transferTo, setTransferTo] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  
  useEffect(() => {
    loadAdditions()
  }, [loadAdditions])
  
  const filteredAdditions = additions.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false
    if (searchText && !a.additionContent.includes(searchText) && !a.housekeeperName.includes(searchText)) return false
    return true
  })
  
  const handleAdditionClick = (addition: AdditionRecord) => {
    setSelectedAddition(addition)
    const history = exceptionService.getHandlesByTarget('addition', addition.id)
    setHandles(history)
    setDrawerOpen(true)
  }
  
  const handleException = () => {
    if (!selectedAddition || !currentUser || !action || !reason) return
    
    const request: any = {
      targetType: 'addition',
      targetId: selectedAddition.id,
      action: action as any,
      reason,
    }
    
    if (action === 'transfer' && transferTo) {
      request.transferTo = transferTo
    }
    
    exceptionService.handleException(request, currentUser.id, currentUser.name, currentUser.role)
    
    loadAdditions()
    
    const additions = JSON.parse(localStorage.getItem('additions') || '[]')
    const updated = additions.find((a: AdditionRecord) => a.id === selectedAddition.id)
    if (updated) {
      setSelectedAddition(updated)
      const history = exceptionService.getHandlesByTarget('addition', updated.id)
      setHandles(history)
    }
    
    setAction('')
    setReason('')
    setTransferTo('')
  }
  
  const getStatusBadge = (status: AdditionRecord['status']) => {
    const config = {
      pending_confirmation: { label: '待确认', color: 'blue' },
      confirmed: { label: '已确认', color: 'green' },
      rejected_by_housekeeper: { label: '家政员拒绝', color: 'red' },
      pending_approval: { label: '待批准', color: 'orange' },
      approved: { label: '已批准', color: 'green' },
      rejected_by_supervisor: { label: '主管驳回', color: 'red' },
      in_progress: { label: '进行中', color: 'blue' },
      completed: { label: '已完成', color: 'green' },
      incomplete: { label: '未完成', color: 'red' },
    }
    return config[status]
  }
  
  const columns = [
    {
      key: 'id',
      title: '记录ID',
      render: (value: unknown) => (
        <span className="font-medium text-gray-900">{String(value).replace('addition-', '#')}</span>
      ),
    },
    {
      key: 'additionType',
      title: '加项类型',
      render: (value: unknown) => (
        <span className="font-medium text-gray-900">{String(value)}</span>
      ),
    },
    {
      key: 'housekeeperName',
      title: '家政员',
      render: (value: unknown, record: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.housekeeperId}`}
            alt={String(value)}
            className="w-8 h-8 rounded-full bg-gray-200"
          />
          <span className="font-medium">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'estimatedCost',
      title: '预计费用',
      render: (value: unknown) => (
        <span className="font-medium text-gray-900">¥{String(value)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (value: unknown) => {
        const config = getStatusBadge(value as AdditionRecord['status'])
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
      title: '创建时间',
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
          <h1 className="text-2xl font-bold text-gray-900">加项记录管理</h1>
          <p className="text-gray-500 mt-1">管理所有加项记录，追踪完成状态</p>
        </div>
      </div>
      
      {incompleteAdditions.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                {incompleteAdditions.length} 个加项记录未完成
              </p>
              <p className="text-sm text-red-700 mt-1">
                请查看下方未完成原因分析
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            未完成原因分析
          </h2>
          <div className="space-y-3">
            {incompleteAdditions.map(addition => (
              <div 
                key={addition.id}
                className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => handleAdditionClick(addition)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{addition.additionType}</p>
                    <p className="text-sm text-gray-500 mt-1">{addition.housekeeperName}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    未完成
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-700 font-medium">
                    原因: {addition.incompleteReason}
                  </p>
                </div>
              </div>
            ))}
            {incompleteAdditions.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-700">所有加项记录已完成或进行中</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            状态统计
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">待确认</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {additions.filter(a => a.status === 'pending_confirmation').length}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">待批准</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {additions.filter(a => a.status === 'pending_approval').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {additions.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">未完成</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {incompleteAdditions.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索加项内容或家政员..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="pending_confirmation">待确认</option>
          <option value="pending_approval">待批准</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="incomplete">未完成</option>
        </select>
      </div>
      
      <Table 
        columns={columns} 
        data={filteredAdditions as Record<string, unknown>[]}
        onRowClick={(record) => handleAdditionClick(record as unknown as AdditionRecord)}
      />
      
      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        title="加项记录详情"
        width="lg"
      >
        {selectedAddition && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">加项信息</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p><span className="text-gray-500">加项类型:</span> {selectedAddition.additionType}</p>
                <p><span className="text-gray-500">加项内容:</span> {selectedAddition.additionContent}</p>
                <p><span className="text-gray-500">预计费用:</span> ¥{selectedAddition.estimatedCost}</p>
                <p><span className="text-gray-500">家政员:</span> {selectedAddition.housekeeperName}</p>
                <p><span className="text-gray-500">创建人:</span> {selectedAddition.creatorName}</p>
                <p><span className="text-gray-500">当前状态:</span> {getStatusBadge(selectedAddition.status).label}</p>
                {selectedAddition.incompleteReason && (
                  <p><span className="text-gray-500">未完成原因:</span> {selectedAddition.incompleteReason}</p>
                )}
              </div>
            </div>
            
            <div>
                <h3 className="font-semibold text-gray-900 mb-2">责任人</h3>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAddition.currentHandler?.id || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorId : selectedAddition.housekeeperId)}`}
                    alt={selectedAddition.currentHandler?.name || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorName : selectedAddition.housekeeperName)}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedAddition.currentHandler?.name || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorName : selectedAddition.housekeeperName) || '待分配'}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedAddition.currentHandler?.role || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorRole : 'housekeeper')) === 'customer_service' ? '客服' :
                       (selectedAddition.currentHandler?.role || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorRole : 'housekeeper')) === 'housekeeper' ? '家政员' :
                       (selectedAddition.currentHandler?.role || (selectedAddition.history && selectedAddition.history.length > 0 ? selectedAddition.history[selectedAddition.history.length - 1]?.operatorRole : 'housekeeper')) === 'quality_supervisor' ? '质检主管' : '家政员'}
                    </p>
                  </div>
                </div>
              </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">处理历史回看</h3>
              <div className="space-y-2">
                {selectedAddition.history.map((item: AdditionHistoryItem) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{item.operatorName}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {item.operatorRole === 'customer_service' ? '客服' :
                             item.operatorRole === 'housekeeper' ? '家政员' :
                             item.operatorRole === 'quality_supervisor' ? '质检主管' : '管理员'}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-sm text-gray-500 mt-1">原因: {item.reason}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {handles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">异常处理记录</h3>
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
                  {selectedAddition.status === 'pending_confirmation' && (
                    <>
                      <option value="confirm">确认加项</option>
                      <option value="reject">拒绝加项</option>
                    </>
                  )}
                  {selectedAddition.status === 'pending_approval' && (
                    <>
                      <option value="approve">批准加项</option>
                      <option value="reject">主管驳回</option>
                    </>
                  )}
                  {selectedAddition.status === 'approved' && (
                    <>
                      <option value="complete">标记完成</option>
                      <option value="mark_incomplete">标记未完成</option>
                    </>
                  )}
                  {selectedAddition.status === 'in_progress' && (
                    <>
                      <option value="complete">标记完成</option>
                      <option value="mark_incomplete">标记未完成</option>
                    </>
                  )}
                  {selectedAddition.status === 'incomplete' && (
                    <>
                      <option value="confirm">重新提交</option>
                      <option value="transfer">转交处理人</option>
                    </>
                  )}
                  {(selectedAddition.status === 'rejected_by_housekeeper' || 
                    selectedAddition.status === 'rejected_by_supervisor') && (
                    <option value="confirm">重新提交</option>
                  )}
                </select>
                
                {action === 'transfer' && users && (
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择转交对象</option>
                    {users.filter(u => u.role === 'housekeeper' || u.role === 'quality_supervisor').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'housekeeper' ? '家政员' : '质检主管'})
                      </option>
                    ))}
                  </select>
                )}
                
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入处理原因"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                
                <button
                  onClick={handleException}
                  disabled={!action || !reason || (action === 'transfer' && !transferTo)}
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