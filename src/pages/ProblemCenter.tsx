import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProblemsStore } from '@/stores/problems'
import { type CauseChainItem } from '@/lib/api'
import { AlertTriangle, MapPin, Clock, Bell, RefreshCw, ShieldAlert, Truck, Timer, ChevronRight } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  misplaced: '错放箱',
  overdue: '超期堆存',
  missed_notify: '查验漏通知',
  detained: '海关扣留',
  stuck_inspecting: '查验停滞',
  stuck_move: '移箱超时',
  expiring_soon: '免堆期预警',
  no_inspection: '无查验计划',
  yard_stagnation: '查验后滞留',
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  misplaced: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-l-orange-500',
    icon: <MapPin size={16} />,
  },
  overdue: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-l-red-500',
    icon: <Clock size={16} />,
  },
  missed_notify: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-l-yellow-500',
    icon: <Bell size={16} />,
  },
  detained: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-l-red-600',
    icon: <ShieldAlert size={16} />,
  },
  stuck_inspecting: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-l-amber-500',
    icon: <Timer size={16} />,
  },
  stuck_move: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-l-purple-500',
    icon: <Truck size={16} />,
  },
  expiring_soon: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-l-blue-500',
    icon: <Timer size={16} />,
  },
  no_inspection: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-l-slate-500',
    icon: <Bell size={16} />,
  },
  yard_stagnation: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-l-teal-500',
    icon: <Truck size={16} />,
  },
}

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  rescheduled: '已改期',
  supplemented: '已补录',
  rejected: '已驳回',
  resolved: '已解决',
}

function parseCauseChain(raw: string | undefined | null): CauseChainItem[] {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default function ProblemCenter() {
  const { problems, loading, fetchProblems, detect } = useProblemsStore()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    fetchProblems({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
    })
  }, [fetchProblems, typeFilter, statusFilter, severityFilter])

  const handleDetect = async () => {
    setDetecting(true)
    try {
      await detect()
      await fetchProblems({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      })
    } catch {
    } finally {
      setDetecting(false)
    }
  }

  const criticalCount = problems.filter((p) => p.status === 'open' && p.severity === 'critical').length
  const warningCount = problems.filter((p) => p.status === 'open' && p.severity === 'warning').length
  const openCount = problems.filter((p) => p.status === 'open').length

  const typeOptions = ['', 'misplaced', 'overdue', 'missed_notify', 'detained', 'stuck_inspecting', 'stuck_move', 'expiring_soon', 'no_inspection', 'yard_stagnation']

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-portNavy">问题单中心</h1>
        <div className="flex items-center gap-3">
          {openCount > 0 && (
            <div className="flex items-center gap-3">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                  <AlertTriangle size={14} />
                  {criticalCount} 严重
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                  <Timer size={14} />
                  {warningCount} 预警
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center gap-1.5 bg-portBlue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-portBlue/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={detecting ? 'animate-spin' : ''} />
            运行检测
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                typeFilter === t ? 'bg-portNavy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === '' ? '全部类型' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['', 'critical', 'warning'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                severityFilter === s ? 'bg-portNavy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === '' ? '全部等级' : s === 'critical' ? '严重' : '预警'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['', 'open', 'rescheduled', 'supplemented', 'rejected', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === s ? 'bg-portNavy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === '' ? '全部状态' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : problems.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-100 p-12 text-center text-slate-400">
          <AlertTriangle size={32} className="mx-auto mb-3 text-slate-300" />
          <p>暂无问题单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => {
            const style = TYPE_COLORS[problem.type] || TYPE_COLORS.misplaced
            const chain = parseCauseChain(problem.cause_chain)
            const lastChainItem = chain.length > 0 ? chain[chain.length - 1] : null
            return (
              <button
                key={problem.id}
                onClick={() => navigate(`/service/problems/${problem.id}`)}
                className={`w-full text-left bg-white rounded-lg border border-slate-100 border-l-4 ${style.border} p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${style.bg} ${style.text}`}>
                      {style.icon}
                      {TYPE_LABELS[problem.type]}
                    </div>
                    {problem.severity === 'critical' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">严重</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">预警</span>
                    )}
                    <span className="font-medium text-portNavy">{problem.container_no}</span>
                    <span className="text-sm text-slate-500">{problem.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      problem.status === 'open' ? 'bg-red-100 text-red-700' :
                      problem.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {STATUS_LABELS[problem.status]}
                    </span>
                    <span className="text-xs text-slate-400">{problem.detected_at?.slice(0, 10)}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-4">
                  {problem.yard_slot && (
                    <span className="text-xs text-slate-400">堆位: {problem.yard_slot}</span>
                  )}
                  {problem.cause && (
                    <span className="text-xs text-red-500">原因: {problem.cause}</span>
                  )}
                </div>
                {chain.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-slate-500 font-medium">因果链:</span>
                    {chain.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        <span className="text-slate-500">{item.detail.length > 20 ? item.detail.slice(0, 20) + '...' : item.detail}</span>
                        {idx < Math.min(chain.length, 3) - 1 && <span className="text-slate-300">→</span>}
                      </span>
                    ))}
                    {chain.length > 3 && <span className="text-slate-300">...</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
