import { useAppStore } from '@/hooks/useAppStore'
import { CheckCircle, Clock, Eye, LogIn, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PackageItem } from '../../shared/types'
import { ROLE_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from '../../shared/types'

const TYPE_BADGE_COLORS: Record<string, string> = {
  normal: 'bg-blue-100 text-blue-800',
  fragile: 'bg-red-100 text-red-800',
  oversized: 'bg-purple-100 text-purple-800',
}

type TabKey = 'arrived' | 'checked_in'

export default function DispatchPage() {
  const { packages, currentRole, fetchPackages, checkin } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('arrived')
  const [modalPkg, setModalPkg] = useState<PackageItem | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages(activeTab)
  }, [activeTab, fetchPackages])

  const handleCheckin = async () => {
    if (!modalPkg) return
    setSubmitting(true)
    try {
      const operator = OPERATOR_NAMES[currentRole]
      await checkin(modalPkg.id, operator, currentRole, note || undefined)
      setModalPkg(null)
      setNote('')
    } finally {
      setSubmitting(false)
    }
  }

  const canCheckin = currentRole === 'dispatcher' || currentRole === 'customer_service'

  const tabs: { key: TabKey; label: string; icon: typeof Clock }[] = [
    { key: 'arrived', label: '到站待入库', icon: Clock },
    { key: 'checked_in', label: '已入库', icon: CheckCircle },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800">派件入库</h1>
        <span className="text-sm text-zinc-400">
          当前角色：{ROLE_LABELS[currentRole]}
        </span>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-primary-700 text-primary-700'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {activeTab === 'arrived' ? (
          <ArrivedTable
            packages={packages}
            canCheckin={canCheckin}
            onCheckin={(pkg) => { setModalPkg(pkg); setNote('') }}
          />
        ) : (
          <CheckedInTable packages={packages} />
        )}
      </div>

      {modalPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalPkg(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-800">驿站入库</h3>
              <button onClick={() => setModalPkg(null)} className="text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">运单号</span>
                <span className="tracking-no text-sm font-medium text-zinc-800">
                  {modalPkg.trackingNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">类型</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE_COLORS[modalPkg.type]}`}>
                  {TYPE_LABELS[modalPkg.type]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">状态</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[modalPkg.status]}`}>
                  {STATUS_LABELS[modalPkg.status]}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-500 mb-1">备注（选填）</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="输入入库备注..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalPkg(null)}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckin}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <LogIn size={16} />
                {submitting ? '提交中...' : '确认入库'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ArrivedTable({
  packages,
  canCheckin,
  onCheckin,
}: {
  packages: PackageItem[]
  canCheckin: boolean
  onCheckin: (pkg: PackageItem) => void
}) {
  if (packages.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-400 text-sm">暂无到站待入库的包裹</div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 text-zinc-500">
          <th className="text-left px-5 py-3 font-medium">运单号</th>
          <th className="text-left px-5 py-3 font-medium">类型</th>
          <th className="text-left px-5 py-3 font-medium">到达时间</th>
          <th className="text-left px-5 py-3 font-medium">当前处理人</th>
          <th className="text-right px-5 py-3 font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        {packages.map(pkg => (
          <tr key={pkg.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
            <td className="px-5 py-3">
              <span className="tracking-no text-zinc-800">{pkg.trackingNo}</span>
            </td>
            <td className="px-5 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE_COLORS[pkg.type]}`}>
                {TYPE_LABELS[pkg.type]}
              </span>
            </td>
            <td className="px-5 py-3 text-zinc-600">{formatTime(pkg.arrivedAt)}</td>
            <td className="px-5 py-3 text-zinc-600">{pkg.currentHandler}</td>
            <td className="px-5 py-3 text-right">
              {canCheckin ? (
                <button
                  onClick={() => onCheckin(pkg)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-700 text-white hover:bg-primary-800 transition-colors"
                >
                  <LogIn size={14} />
                  驿站入库
                </button>
              ) : (
                <span className="text-xs text-zinc-400">无操作权限</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CheckedInTable({ packages }: { packages: PackageItem[] }) {
  if (packages.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-400 text-sm">暂无已入库的包裹</div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 text-zinc-500">
          <th className="text-left px-5 py-3 font-medium">运单号</th>
          <th className="text-left px-5 py-3 font-medium">类型</th>
          <th className="text-left px-5 py-3 font-medium">入库时间</th>
          <th className="text-left px-5 py-3 font-medium">操作人</th>
          <th className="text-left px-5 py-3 font-medium">备注</th>
          <th className="text-right px-5 py-3 font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        {packages.map(pkg => {
          const checkinEvent = [...pkg.timeline]
            .reverse()
            .find(e => e.status === 'checked_in')

          return (
            <tr key={pkg.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
              <td className="px-5 py-3">
                <span className="tracking-no text-zinc-800">{pkg.trackingNo}</span>
              </td>
              <td className="px-5 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE_COLORS[pkg.type]}`}>
                  {TYPE_LABELS[pkg.type]}
                </span>
              </td>
              <td className="px-5 py-3 text-zinc-600">
                {checkinEvent ? formatTime(checkinEvent.timestamp) : '-'}
              </td>
              <td className="px-5 py-3 text-zinc-600">
                {checkinEvent?.operator ?? '-'}
              </td>
              <td className="px-5 py-3 text-zinc-600 max-w-[200px] truncate">
                {checkinEvent?.note || '-'}
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  to={`/package/${pkg.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary-700 text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <Eye size={14} />
                  查看详情
                </Link>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
