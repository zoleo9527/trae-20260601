import { useAppStore } from '@/hooks/useAppStore'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Flag, Inbox, MessageSquare, Package, RotateCcw, Send, User, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROLE_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, type PackageItem, type PackageStatus } from '../../shared/types'

const STATUS_ICONS: Record<PackageStatus, React.ElementType> = {
  arrived: Inbox,
  checked_in: Package,
  notified: Send,
  verified: CheckCircle2,
  problem: AlertTriangle,
  returned: XCircle,
  completed: Flag,
}

const RESETTABLE_STATUSES: PackageStatus[] = ['arrived', 'checked_in', 'notified', 'verified', 'problem']

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchPackage, currentRole, resetPackageStatus } = useAppStore()
  const [pkg, setPkg] = useState<PackageItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReset, setShowReset] = useState(false)
  const [targetStatus, setTargetStatus] = useState<PackageStatus>('arrived')
  const [resetNote, setResetNote] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchPackage(id).then(data => {
      setPkg(data)
      setLoading(false)
    })
  }, [id])

  const handleReset = async () => {
    if (!id) return
    setResetting(true)
    const operator = OPERATOR_NAMES[currentRole]
    await resetPackageStatus(id, operator, currentRole, targetStatus, resetNote)
    const updated = await fetchPackage(id)
    setPkg(updated)
    setShowReset(false)
    setResetNote('')
    setResetting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-zinc-400">加载中...</div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">快件不存在</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-no">{pkg.trackingNo}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pkg.status]}`}>
              {STATUS_LABELS[pkg.status]}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {TYPE_LABELS[pkg.type]} · 到达时间 {new Date(pkg.arrivedAt).toLocaleString('zh-CN')}
          </p>
        </div>
        {currentRole === 'customer_service' && (
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm text-zinc-700 transition-colors"
          >
            <RotateCcw size={16} />
            重置状态
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-400 mb-1">当前处理人</p>
            <p className="text-sm font-medium">{pkg.currentHandler}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">处理角色</p>
            <p className="text-sm font-medium">{ROLE_LABELS[pkg.currentRole]}</p>
          </div>
          {pkg.problemType && (
            <>
              <div>
                <p className="text-xs text-zinc-400 mb-1">问题类型</p>
                <p className="text-sm font-medium text-warning-600">{pkg.problemType}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">问题描述</p>
                <p className="text-sm font-medium">{pkg.problemDescription}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
        <h2 className="text-base font-semibold mb-6 flex items-center gap-2">
          <Clock size={18} className="text-primary-600" />
          全生命周期时间线
        </h2>

        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-zinc-200" />

          {pkg.timeline.map((event, idx) => {
            const Icon = STATUS_ICONS[event.status] || Inbox
            const isLast = idx === pkg.timeline.length - 1
            const isProblem = event.status === 'problem'

            return (
              <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isLast
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                    : isProblem
                      ? 'bg-warning-100 text-warning-600'
                      : 'bg-zinc-100 text-zinc-500'
                }`}>
                  <Icon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${isLast ? 'text-primary-700' : 'text-zinc-800'}`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                    {isLast && (
                      <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-medium rounded">
                        当前
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {event.operator}
                    </span>
                    <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-[10px]">
                      {ROLE_LABELS[event.role]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(event.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>

                  {event.note && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-zinc-600 bg-zinc-50 rounded-lg p-2.5">
                      <MessageSquare size={12} className="shrink-0 mt-0.5 text-zinc-400" />
                      {event.note}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowReset(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">重置快件状态</h3>
            <p className="text-sm text-zinc-500 mb-4">
              将快件 <span className="font-mono font-medium text-zinc-800">{pkg.trackingNo}</span> 的状态重置到指定节点
            </p>

            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-1.5 block">目标状态</label>
              <select
                value={targetStatus}
                onChange={e => setTargetStatus(e.target.value as PackageStatus)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                {RESETTABLE_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-xs text-zinc-500 mb-1.5 block">重置原因</label>
              <textarea
                value={resetNote}
                onChange={e => setResetNote(e.target.value)}
                placeholder="请填写重置原因..."
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm text-zinc-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {resetting ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
