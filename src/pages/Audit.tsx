import { useState } from 'react'
import { useStore } from '@/store'
import {
  Search,
  Clock,
  User,
  ArrowRightLeft,
  Monitor,
  Undo2,
  Package,
  Film,
  MessageSquare,
  Paperclip,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const actionIcons: Record<string, React.FC<{ className?: string }>> = {
  hall_changed: ArrowRightLeft,
  equipment_failure: Monitor,
  refund_processed: Undo2,
  inventory_status_updated: Package,
  todo_completed: CheckCircle2,
  remark_added: MessageSquare,
  attachment_uploaded: Paperclip,
  role_switched: Users,
  screening_status_updated: Film,
  group_ticket_redeemed: Users,
  exception_created: AlertTriangle,
  exception_status_updated: AlertTriangle,
}

const actionLabels: Record<string, string> = {
  hall_changed: '临时换厅',
  equipment_failure: '设备故障记录',
  refund_processed: '退票处理',
  inventory_status_updated: '库存状态更新',
  todo_completed: '待办完成',
  remark_added: '添加备注',
  attachment_uploaded: '上传附件',
  role_switched: '切换角色',
  screening_status_updated: '场次状态更新',
  group_ticket_redeemed: '团体票核销',
  exception_created: '创建异常',
  exception_status_updated: '异常状态更新',
}

const typeLabels: Record<string, string> = {
  inventory: '卖品库存',
  screening: '场次对账',
  exception: '异常处理',
  user: '用户操作',
}

const roleLabels = {
  frontline: '一线员工',
  manager: '经理',
  admin: '管理员',
}

export default function Audit() {
  const { operationLogs, screenings, inventoryItems, exceptions, users } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'inventory' | 'screening' | 'exception' | 'user'>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<typeof operationLogs[0] | null>(null)

  const filteredLogs = operationLogs.filter((log) => {
    const matchesType = typeFilter === 'all' || log.targetType === typeFilter
    const matchesUser = userFilter === 'all' || log.operatorId === userFilter
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actionLabels[log.action]?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesUser && matchesSearch
  })

  const getTargetInfo = (log: typeof operationLogs[0]) => {
    if (log.targetType === 'screening') {
      const s = screenings.find((sc) => sc.id === log.targetId)
      return s ? `${s.movieName} (${s.currentHall})` : '未知场次'
    }
    if (log.targetType === 'inventory') {
      const i = inventoryItems.find((it) => it.id === log.targetId)
      return i ? i.productName : '未知商品'
    }
    if (log.targetType === 'exception') {
      const e = exceptions.find((ex) => ex.id === log.targetId)
      return e ? e.title : '未知异常'
    }
    return log.targetId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">回看追溯</h1>
          <p className="text-gray-500 mt-1">所有操作留痕，一线处理和管理回看基于同一份数据</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          导出审计日志
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索操作记录..."
              className="input pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="input w-36"
          >
            <option value="all">全部类型</option>
            <option value="inventory">卖品库存</option>
            <option value="screening">场次对账</option>
            <option value="exception">异常处理</option>
            <option value="user">用户操作</option>
          </select>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="input w-36"
          >
            <option value="all">全部人员</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作人</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作对象</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => {
                const Icon = actionIcons[log.action] || Clock
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">
                        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {actionLabels[log.action] || log.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{log.operatorName}</p>
                          <p className="text-xs text-gray-400">{roleLabels[log.operatorRole]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{typeLabels[log.targetType]}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 font-medium">{getTargetInfo(log)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-500 max-w-xs truncate">{log.description}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <p className="text-center text-gray-400 py-12">暂无操作记录</p>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">操作详情</h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">操作时间</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">操作类型</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">操作人</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedLog.operatorName} ({roleLabels[selectedLog.operatorRole]})
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">对象类型</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {typeLabels[selectedLog.targetType]}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">操作描述</p>
                <p className="text-sm text-gray-900">{selectedLog.description}</p>
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">变更详情</p>
                  <div className="space-y-2">
                    {Object.entries(selectedLog.changes).map(([field, change]) => (
                    <div key={field} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">{field}:</span>
                      <span className="text-danger-600 line-through">{String(change.old)}</span>
                      <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                      <span className="text-success-600 font-medium">{String(change.new)}</span>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setSelectedLog(null)} className="btn-primary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
