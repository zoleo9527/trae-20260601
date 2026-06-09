import { useAppStore } from '@/hooks/useAppStore'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Package,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_LABELS,
  type PackageItem,
  type TimelineEvent
} from '../../shared/types'

function isOverdue(arrivedAt: string): boolean {
  return Date.now() - new Date(arrivedAt).getTime() > 24 * 60 * 60 * 1000
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractVerificationInfo(pkg: PackageItem) {
  const event = pkg.timeline.find((e: TimelineEvent) => e.status === 'verified')
  return {
    time: event?.timestamp ?? '',
    operator: event?.operator ?? '',
    note: event?.note ?? '',
    pickupPerson: (event as TimelineEvent & { pickupPerson?: string })
      ?.pickupPerson ?? '',
  }
}

interface VerifyModalProps {
  pkg: PackageItem | null
  onClose: () => void
  onConfirm: (pickupPerson: string, note: string) => void
}

function VerifyModal({ pkg, onClose, onConfirm }: VerifyModalProps) {
  const [pickupPerson, setPickupPerson] = useState('')
  const [note, setNote] = useState('')

  if (!pkg) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">确认核销</h3>
        <div className="mb-4">
          <span className="text-sm text-zinc-500">运单号</span>
          <p className="tracking-no text-base font-medium mt-0.5">
            {pkg.trackingNo}
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-zinc-500 mb-1">
            取件人姓名
          </label>
          <input
            type="text"
            value={pickupPerson}
            onChange={(e) => setPickupPerson(e.target.value)}
            placeholder="请输入取件人姓名"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm text-zinc-500 mb-1">备注（可选）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可选备注信息"
            rows={3}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(pickupPerson, note)}
            className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            确认核销
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PickupPage() {
  const { packages, currentRole, fetchPackages, verify } = useAppStore()
  const [modalPkg, setModalPkg] = useState<PackageItem | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const pendingPkgs = packages.filter(
    (p) => p.status === 'checked_in' || p.status === 'notified'
  )
  const reviewedPkgs = packages.filter(
    (p) => p.status === 'verified' || p.status === 'completed'
  )

  const canVerify =
    currentRole === 'station_manager' || currentRole === 'customer_service'

  const handleVerify = async (
    id: string,
    pickupPerson: string,
    note: string
  ) => {
    await verify(id, OPERATOR_NAMES[currentRole], currentRole, pickupPerson, note)
    setModalPkg(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CheckCircle size={24} className="text-primary-700" />
        <h1 className="text-xl font-bold">取件核销</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-primary-700" />
            <h2 className="font-semibold">待核销</h2>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {pendingPkgs.length}
            </span>
          </div>
        </div>

        {pendingPkgs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            暂无待核销包裹
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500">
                <th className="text-left px-5 py-3 font-medium">运单号</th>
                <th className="text-left px-5 py-3 font-medium">类型</th>
                <th className="text-left px-5 py-3 font-medium">入库时间</th>
                <th className="text-left px-5 py-3 font-medium">超时标记</th>
                <th className="text-left px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {pendingPkgs.map((pkg) => {
                const overdue = isOverdue(pkg.arrivedAt)
                return (
                  <tr
                    key={pkg.id}
                    className={cn(
                      'border-t border-zinc-100',
                      overdue && 'bg-red-50'
                    )}
                  >
                    <td className="px-5 py-3">
                      <span className="tracking-no font-medium">
                        {pkg.trackingNo}
                      </span>
                      <span
                        className={cn(
                          'ml-2 inline-block text-xs px-1.5 py-0.5 rounded',
                          STATUS_COLORS[pkg.status]
                        )}
                      >
                        {STATUS_LABELS[pkg.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">{TYPE_LABELS[pkg.type]}</td>
                    <td className="px-5 py-3 text-zinc-500">
                      {formatTime(pkg.arrivedAt)}
                    </td>
                    <td className="px-5 py-3">
                      {overdue && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          <Clock size={12} />
                          超时
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {canVerify && (
                        <button
                          onClick={() => setModalPkg(pkg)}
                          className="text-xs bg-primary-700 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors"
                        >
                          确认核销
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <button
          onClick={() => setReviewOpen(!reviewOpen)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary-700" />
            <h2 className="font-semibold">核销回看</h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {reviewedPkgs.length}
            </span>
          </div>
          {reviewOpen ? (
            <ChevronUp size={18} className="text-zinc-400" />
          ) : (
            <ChevronDown size={18} className="text-zinc-400" />
          )}
        </button>

        {reviewOpen && (
          <>
            {reviewedPkgs.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-sm">
                暂无核销记录
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500">
                    <th className="text-left px-5 py-3 font-medium">运单号</th>
                    <th className="text-left px-5 py-3 font-medium">类型</th>
                    <th className="text-left px-5 py-3 font-medium">核销时间</th>
                    <th className="text-left px-5 py-3 font-medium">操作人</th>
                    <th className="text-left px-5 py-3 font-medium">取件人</th>
                    <th className="text-left px-5 py-3 font-medium">备注</th>
                    <th className="text-left px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedPkgs.map((pkg) => {
                    const info = extractVerificationInfo(pkg)
                    return (
                      <tr
                        key={pkg.id}
                        className="border-t border-zinc-100"
                      >
                        <td className="px-5 py-3">
                          <span className="tracking-no font-medium">
                            {pkg.trackingNo}
                          </span>
                          <span
                            className={cn(
                              'ml-2 inline-block text-xs px-1.5 py-0.5 rounded',
                              STATUS_COLORS[pkg.status]
                            )}
                          >
                            {STATUS_LABELS[pkg.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3">{TYPE_LABELS[pkg.type]}</td>
                        <td className="px-5 py-3 text-zinc-500">
                          {info.time ? formatTime(info.time) : '-'}
                        </td>
                        <td className="px-5 py-3">{info.operator || '-'}</td>
                        <td className="px-5 py-3">
                          {info.pickupPerson || '-'}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 max-w-[160px] truncate">
                          {info.note || '-'}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            to={`/package/${pkg.id}`}
                            className="text-xs text-primary-700 hover:underline"
                          >
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <VerifyModal
        pkg={modalPkg}
        onClose={() => setModalPkg(null)}
        onConfirm={(pickupPerson, note) => {
          if (modalPkg) handleVerify(modalPkg.id, pickupPerson, note)
        }}
      />
    </div>
  )
}
