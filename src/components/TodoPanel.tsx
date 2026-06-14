import { useState, useMemo } from 'react'
import {
  ChevronRight,
  AlertTriangle,
  Clock,
  FileText,
  Scale,
  Eye,
  ClipboardList,
  Calculator,
  Handshake,
} from 'lucide-react'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import { ROLE_LABELS, STATUS_LABELS, SETTLEMENT_STATUS_LABELS, RECONCILIATION_STATUS_LABELS } from '@/types'
import type { Role, TodoItem } from '@/types'
import StatusTag from './StatusTag'

const tabs = [
  { key: 'todos' as const, label: '我的待办', icon: ClipboardList },
  { key: 'settlement' as const, label: '工资结算', icon: Calculator },
  { key: 'reconciliation' as const, label: '客户对账', icon: Handshake },
]

const roleIcons: Record<Role, string> = {
  recruiter: '👤',
  onsite: '🏗️',
  payroll: '💰',
}

const typeIcons = {
  settlement: FileText,
  reconciliation: FileText,
  supplement: AlertTriangle,
  dispute: Scale,
}

const typeLabels = {
  settlement: '工资结算',
  reconciliation: '客户对账',
  supplement: '补充材料',
  dispute: '争议处理',
}

const priorityColors = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-gray-600 bg-gray-50 border-gray-200',
}

const priorityLabels = {
  high: '紧急',
  medium: '一般',
  low: '低',
}

export default function TodoPanel() {
  const todos = useWorkbenchStore((s) => s.todos)
  const currentRole = useWorkbenchStore((s) => s.currentRole)
  const activeTab = useWorkbenchStore((s) => s.activeTab)
  const records = useWorkbenchStore((s) => s.records)
  const filters = useWorkbenchStore((s) => s.filters)
  const setCurrentRole = useWorkbenchStore((s) => s.setCurrentRole)
  const setActiveTab = useWorkbenchStore((s) => s.setActiveTab)
  const setFilters = useWorkbenchStore((s) => s.setFilters)
  const markTodoRead = useWorkbenchStore((s) => s.markTodoRead)
  const selectRecord = useWorkbenchStore((s) => s.selectRecord)
  const getResponsibility = useWorkbenchStore((s) => s.getResponsibility)

  const roleRecordIds = useMemo(() => {
    const fromRole = new Set(records.filter((r) => r.role === currentRole).map((r) => r.id))
    const fromTodo = new Set(todos.filter((t) => t.role === currentRole).map((t) => t.recordId))
    return new Set([...fromRole, ...fromTodo])
  }, [records, todos, currentRole])

  const allTodos = todos
    .filter((t) => t.role === currentRole)
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })

  const stats = {
    total: records.filter((r) => roleRecordIds.has(r.id)).length,
    pending: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'normal').length,
    overdue: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'overdue').length,
    disputed: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'disputed').length,
    returned: records.filter((r) => roleRecordIds.has(r.id) && r.recordStatus === 'returned').length,
  }
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const roles: Role[] = ['recruiter', 'onsite', 'payroll']

  const filteredTodos = allTodos.filter((t) => {
    if (activeTab === 'todos') return true
    if (activeTab === 'settlement') return t.type === 'settlement' || t.type === 'supplement'
    if (activeTab === 'reconciliation') return t.type === 'reconciliation' || t.type === 'dispute'
    return true
  })

  const tabCount = {
    todos: allTodos.length,
    settlement: allTodos.filter((t) => t.type === 'settlement' || t.type === 'supplement').length,
    reconciliation: allTodos.filter((t) => t.type === 'reconciliation' || t.type === 'dispute').length,
  }

  const handleTodoClick = (todo: TodoItem) => {
    if (!todo.isRead) markTodoRead(todo.id)
    selectRecord(todo.recordId)
    setExpandedId(expandedId === todo.id ? null : todo.id)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setCurrentRole(role)}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all ${
              currentRole === role
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="text-lg">{roleIcons[role]}</span>
            <span className="text-xs font-medium">{ROLE_LABELS[role]}</span>
            <span className="text-[10px] text-gray-400">
              {role === currentRole ? `${allTodos.length} 待办` : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: '总记录', value: stats.total, color: 'text-gray-700 bg-gray-50', status: 'all' as const },
          { label: '正常', value: stats.pending, color: 'text-emerald-700 bg-emerald-50', status: 'normal' as const },
          { label: '退回', value: stats.returned, color: 'text-amber-700 bg-amber-50', status: 'returned' as const },
          { label: '逾期', value: stats.overdue, color: 'text-red-700 bg-red-50', status: 'overdue' as const },
          { label: '争议', value: stats.disputed, color: 'text-purple-700 bg-purple-50', status: 'disputed' as const },
        ].map((s) => {
          const isActive = filters.status === s.status
          return (
            <button
              key={s.label}
              onClick={() => setFilters({ status: isActive ? 'all' : s.status })}
              className={`rounded-md px-1 py-1.5 text-center transition-all ${s.color} ${
                isActive ? 'ring-2 ring-offset-1 ring-blue-400' : 'hover:opacity-80'
              }`}
            >
              <div className="text-base font-bold">{s.value}</div>
              <div className="text-[9px]">{s.label}</div>
            </button>
          )
        })}
      </div>

      <div className="flex border-b border-gray-200 mb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[10px] px-1 rounded ${activeTab === tab.key ? 'bg-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                {tabCount[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-2 max-h-[calc(100vh-440px)] overflow-y-auto pr-1">
        {filteredTodos.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">当前分类暂无待办事项</div>
        )}
        {filteredTodos.map((todo) => {
          const Icon = typeIcons[todo.type]
          const isExpanded = expandedId === todo.id
          const record = records.find((r) => r.id === todo.recordId)
          return (
            <div
              key={todo.id}
              className={`border rounded-lg transition-all cursor-pointer ${
                !todo.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
              }`}
              onClick={() => handleTodoClick(todo)}
            >
              <div className="flex items-start gap-2 p-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!todo.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 truncate">{todo.title}</span>
                    <span className={`ml-auto flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[todo.priority]}`}>
                      {priorityLabels[todo.priority]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{todo.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-400">{typeLabels[todo.type]}</span>
                    {todo.deadline && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                        <Clock className="w-3 h-3" />
                        {todo.deadline}
                      </span>
                    )}
                    {record && (
                      <StatusTag
                        type="record"
                        status={record.recordStatus}
                        label={STATUS_LABELS[record.recordStatus]}
                        dot={false}
                      />
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
              {isExpanded && record && (
                <div className="border-t border-gray-100 px-3 pb-3 pt-2 bg-gray-50/50 rounded-b-lg">
                  {(() => {
                    const resp = getResponsibility(record)
                    return (
                      <div className={`mb-2 p-2 rounded-md ${resp.isUnclear ? 'bg-purple-50 border border-purple-100' : resp.pendingRole === currentRole ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'}`}>
                        <div className="text-[10px] text-gray-500 mb-1">
                          {resp.isUnclear ? '⚠️ 责任不清' : resp.pendingRole === currentRole ? '👉 待我处理' : '📋 责任归属'}
                        </div>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{resp.responsibilityText}</p>
                        {resp.involvedRoles.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[9px] text-gray-400">涉及：</span>
                            {resp.involvedRoles.map((ir) => (
                              <span key={ir} className="text-[9px] px-1.5 py-0.5 bg-white/70 rounded text-gray-600 border border-gray-100">
                                {ROLE_LABELS[ir]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">批次号</span>
                      <p className="font-medium text-gray-700">{record.batchNo}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">客户</span>
                      <p className="font-medium text-gray-700">{record.clientName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">工资结算</span>
                      <p>
                        <StatusTag type="settlement" status={record.settlement.status} label={SETTLEMENT_STATUS_LABELS[record.settlement.status]} dot={false} />
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">客户对账</span>
                      <p>
                        <StatusTag type="reconciliation" status={record.reconciliation.status} label={RECONCILIATION_STATUS_LABELS[record.reconciliation.status]} dot={false} />
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      selectRecord(record.id)
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-3 h-3" />
                    查看完整记录
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
