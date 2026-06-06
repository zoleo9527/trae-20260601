import { useState } from 'react'
import { useStore } from '@/store'
import { RiskLevelBadge } from '@/components/Badges'
import { RemarkPanel, AttachmentPanel } from '@/components/RemarkPanel'
import { canPerformAction } from '@/services/permissions'
import type { ExceptionRecord } from '@/types'
import {
  ArrowRightLeft,
  Users,
  Monitor,
  Undo2,
  Package,
  Search,
  X,
  ChevronRight,
  Film,
  Clock,
  CheckCircle2,
  Lock,
  Play,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Link } from 'react-router-dom'

const typeConfig = {
  hall_change: { icon: ArrowRightLeft, label: '临时换厅', color: 'text-warning-600 bg-warning-50' },
  group_ticket: { icon: Users, label: '团体票', color: 'text-primary-600 bg-primary-50' },
  equipment_failure: { icon: Monitor, label: '设备故障', color: 'text-danger-600 bg-danger-50' },
  refund: { icon: Undo2, label: '退票', color: 'text-warning-600 bg-warning-50' },
  inventory: { icon: Package, label: '库存', color: 'text-purple-600 bg-purple-50' },
}

export default function Exceptions() {
  const { exceptions, screenings, currentUser, updateExceptionStatus, refreshAll } = useStore()
  const [filter, setFilter] = useState<ExceptionRecord['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ExceptionRecord['type'] | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null)

  const canUpdateStatus = canPerformAction('exception', 'update_status', currentUser.role)
  const canStartHandling = canPerformAction('exception', 'update_status:handling', currentUser.role)
  const canResolve = canPerformAction('exception', 'update_status', currentUser.role)
  const canAddRemark = canPerformAction('exception', 'add_remark', currentUser.role)
  const canAddAttachment = canPerformAction('exception', 'add_attachment', currentUser.role)

  const filteredExceptions = exceptions.filter((e) => {
    const matchesStatus = filter === 'all' || e.status === filter
    const matchesType = typeFilter === 'all' || e.type === typeFilter
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  const handleStatusUpdate = (id: string, status: ExceptionRecord['status']) => {
    if (!canUpdateStatus && !canStartHandling && !canResolve) return
    updateExceptionStatus(id, status, currentUser.id, currentUser.name)
    if (selectedException?.id === id) {
      setSelectedException({ ...selectedException, status })
    }
  }

  const statusLabels = {
    pending: '待处理',
    handling: '处理中',
    resolved: '已解决',
  }

  const ActionButton = ({
    onClick,
    disabled,
    canPerform,
    children,
    className = '',
  }: {
    onClick?: () => void
    disabled?: boolean
    canPerform: boolean
    children: React.ReactNode
    className?: string
  }) => {
    if (!canPerform) {
      return (
        <button
          disabled
          className={`px-3 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium flex items-center justify-center gap-1 ${className}`}
        >
          <Lock className="w-4 h-4" />
          {children}
        </button>
      )
    }
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">异常处理</h1>
          <p className="text-gray-500 mt-1">统一管理所有异常事件，一线处理和管理回看基于同一份数据</p>
        </div>
        <button
          onClick={() => refreshAll()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Clock className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {(['pending', 'handling', 'resolved'] as ExceptionRecord['status'][]).map((status) => {
          const count = exceptions.filter((e) => e.status === status).length
          const colors = {
            pending: 'bg-warning-50 border-warning-200',
            handling: 'bg-primary-50 border-primary-200',
            resolved: 'bg-success-50 border-success-200',
          }
          return (
            <div key={status} className={`p-4 rounded-xl border ${colors[status]}`}>
              <p className="text-sm text-gray-600">{statusLabels[status]}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          )
        })}
        {Object.entries(typeConfig).slice(0, 2).map(([type, config]) => {
          const count = exceptions.filter((e) => e.type === type).length
          return (
            <div key={type} className="p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">{config.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索异常..."
                  className="input pl-9"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as ExceptionRecord['status'] | 'all')}
                className="input w-32"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="handling">处理中</option>
                <option value="resolved">已解决</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ExceptionRecord['type'] | 'all')}
                className="input w-32"
              >
                <option value="all">全部类型</option>
                <option value="hall_change">临时换厅</option>
                <option value="group_ticket">团体票</option>
                <option value="equipment_failure">设备故障</option>
                <option value="refund">退票</option>
                <option value="inventory">库存</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredExceptions.map((exception) => {
                const TypeIcon = typeConfig[exception.type].icon
                return (
                  <div
                    key={exception.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selectedException?.id === exception.id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedException(exception)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig[exception.type].color}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{exception.title}</h3>
                            <RiskLevelBadge
                              level={exception.type === 'equipment_failure' ? 'high' : exception.type === 'hall_change' ? 'medium' : 'low'}
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{exception.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(exception.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                            </span>
                            <span>处理人: {exception.handlerName || '-'}</span>
                            {exception.remarks.length > 0 && (
                              <span>{exception.remarks.length} 条备注</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          exception.status === 'pending' ? 'bg-warning-100 text-warning-600' :
                          exception.status === 'handling' ? 'bg-primary-100 text-primary-600' :
                          'bg-success-100 text-success-600'
                        }`}>
                          {statusLabels[exception.status]}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredExceptions.length === 0 && (
                <p className="text-center text-gray-400 py-12">暂无异常记录</p>
              )}
            </div>
          </div>
        </div>

        {selectedException && (
          <div className="w-96">
            <div className="card space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const TypeIcon = typeConfig[selectedException.type].icon
                      return <TypeIcon className={`w-5 h-5 ${typeConfig[selectedException.type].color.split(' ')[0]}`} />
                    })()}
                    <h2 className="text-lg font-semibold text-gray-900">{selectedException.title}</h2>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{typeConfig[selectedException.type].label}异常</p>
                </div>
                <button
                  onClick={() => setSelectedException(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{selectedException.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">状态</p>
                  <p className={`font-semibold mt-1 ${
                    selectedException.status === 'pending' ? 'text-warning-600' :
                    selectedException.status === 'handling' ? 'text-primary-600' :
                    'text-success-600'
                  }`}>
                    {statusLabels[selectedException.status]}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">处理人</p>
                  <p className="font-semibold mt-1 text-gray-900">{selectedException.handlerName || '-'}</p>
                </div>
              </div>

              {selectedException.screeningId && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">关联场次</p>
                  {(() => {
                    const s = screenings.find((sc) => sc.id === selectedException.screeningId)
                    if (!s) return null
                    return (
                      <Link to="/screenings" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Film className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{s.movieName}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(s.startTime), 'HH:mm', { locale: zhCN })} · {s.currentHall}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    )
                  })()}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">推进动作</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedException.status !== 'handling' && (
                    <ActionButton
                      onClick={() => handleStatusUpdate(selectedException.id, 'handling')}
                      canPerform={canStartHandling || canUpdateStatus}
                      className="bg-primary-50 text-primary-700 hover:bg-primary-100"
                    >
                      <Play className="w-4 h-4" />
                      开始处理
                    </ActionButton>
                  )}
                  {selectedException.status !== 'resolved' && (
                    <ActionButton
                      onClick={() => handleStatusUpdate(selectedException.id, 'resolved')}
                      canPerform={canResolve || canUpdateStatus}
                      className="bg-success-50 text-success-700 hover:bg-success-100"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      标记解决
                    </ActionButton>
                  )}
                </div>
                {(!canStartHandling && !canUpdateStatus && !canResolve) && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    您没有权限处理此异常
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">备注</p>
                  {!canAddRemark && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 无权限添加
                    </span>
                  )}
                </div>
                <RemarkPanel sourceType="exception" sourceId={selectedException.id} readOnly={!canAddRemark} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">附件</p>
                  {!canAddAttachment && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 无权限上传
                    </span>
                  )}
                </div>
                <AttachmentPanel sourceType="exception" sourceId={selectedException.id} readOnly={!canAddAttachment} />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">
                  创建时间: {format(new Date(selectedException.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  最后更新: {format(new Date(selectedException.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
