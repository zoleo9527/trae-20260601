import { useAppStore } from '@/hooks/useAppStore'
import {
    AlertTriangle,
    ArrowLeftRight,
    Clock,
    CornerDownLeft,
    Eye,
    Package,
    RefreshCw,
    User,
    X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { OPERATOR_NAMES, ROLE_LABELS, STATUS_LABELS, type PackageItem } from '../../shared/types'

const PROBLEM_TYPE_COLORS: Record<string, string> = {
  破损: 'bg-red-500',
  地址错误: 'bg-blue-500',
  拒收: 'bg-orange-500',
  其他: 'bg-zinc-500',
}

const PROBLEM_TYPE_BADGE_COLORS: Record<string, string> = {
  破损: 'bg-red-100 text-red-800',
  地址错误: 'bg-blue-100 text-blue-800',
  拒收: 'bg-orange-100 text-orange-800',
  其他: 'bg-zinc-100 text-zinc-800',
}

const PROBLEM_TYPE_OPTIONS = ['破损', '地址错误', '拒收', '其他']

type ResolveModalState = {
  open: boolean
  pkg: PackageItem | null
  action: 'recheckin' | 'return' | null
  resolution: string
}

type MarkModalState = {
  open: boolean
  pkg: PackageItem | null
  problemType: string
  description: string
}

type TimelineModalState = {
  open: boolean
  pkg: PackageItem | null
}

export default function ProblemPage() {
  const { packages, currentRole, fetchPackages, resolveProblem, markProblem } =
    useAppStore()

  const [resolveModal, setResolveModal] = useState<ResolveModalState>({
    open: false,
    pkg: null,
    action: null,
    resolution: '',
  })
  const [markModal, setMarkModal] = useState<MarkModalState>({
    open: false,
    pkg: null,
    problemType: '破损',
    description: '',
  })
  const [timelineModal, setTimelineModal] = useState<TimelineModalState>({
    open: false,
    pkg: null,
  })

  const problemPackages = packages.filter((p) => p.status === 'problem')
  const markablePackages = packages.filter(
    (p) => p.status === 'arrived' || p.status === 'checked_in'
  )

  useEffect(() => {
    fetchPackages('problem')
    fetchPackages()
  }, [])

  const handleResolve = async () => {
    if (!resolveModal.pkg || !resolveModal.action || !resolveModal.resolution.trim()) return
    await resolveProblem(
      resolveModal.pkg.id,
      OPERATOR_NAMES[currentRole],
      currentRole,
      resolveModal.resolution.trim(),
      resolveModal.action
    )
    setResolveModal({ open: false, pkg: null, action: null, resolution: '' })
    fetchPackages('problem')
    fetchPackages()
  }

  const handleMark = async () => {
    if (!markModal.pkg || !markModal.description.trim()) return
    await markProblem(
      markModal.pkg.id,
      OPERATOR_NAMES[currentRole],
      currentRole,
      markModal.problemType,
      markModal.description.trim()
    )
    setMarkModal({ open: false, pkg: null, problemType: '破损', description: '' })
    fetchPackages('problem')
    fetchPackages()
  }

  const getStripeColor = (problemType?: string) =>
    PROBLEM_TYPE_COLORS[problemType ?? '其他'] ?? PROBLEM_TYPE_COLORS['其他']

  const getBadgeColor = (problemType?: string) =>
    PROBLEM_TYPE_BADGE_COLORS[problemType ?? '其他'] ?? PROBLEM_TYPE_BADGE_COLORS['其他']

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle size={22} className="text-warning-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">问题件管理</h1>
          <p className="text-sm text-zinc-500">
            当前角色：{ROLE_LABELS[currentRole]}
          </p>
        </div>
        <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          {problemPackages.length} 件问题件
        </span>
      </div>

      {problemPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Package size={48} className="mb-3 opacity-40" />
          <p>暂无问题件</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-zinc-700 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            问题件列表
          </h2>
          {problemPackages.map((pkg) => {
            const problemEvent = [...pkg.timeline]
              .reverse()
              .find((e) => e.status === 'problem')
            return (
              <div
                key={pkg.id}
                className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden"
              >
                <div className="flex">
                  <div
                    className={`w-1.5 shrink-0 ${getStripeColor(pkg.problemType)}`}
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="tracking-no text-sm font-semibold text-zinc-800">
                            {pkg.trackingNo}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(pkg.problemType)}`}
                          >
                            {pkg.problemType ?? '其他'}
                          </span>
                        </div>
                        {pkg.problemDescription && (
                          <p className="text-sm text-zinc-600">
                            {pkg.problemDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            当前处理：{pkg.currentHandler}
                          </span>
                          {problemEvent && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              标记时间：{formatTime(problemEvent.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setTimelineModal({ open: true, pkg })}
                          className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Eye size={14} />
                          责任追踪
                        </button>
                        {currentRole === 'customer_service' && (
                          <>
                            <button
                              onClick={() =>
                                setResolveModal({
                                  open: true,
                                  pkg,
                                  action: 'recheckin',
                                  resolution: '',
                                })
                              }
                              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1"
                            >
                              <RefreshCw size={14} />
                              重新入库
                            </button>
                            <button
                              onClick={() =>
                                setResolveModal({
                                  open: true,
                                  pkg,
                                  action: 'return',
                                  resolution: '',
                                })
                              }
                              className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-200 hover:bg-zinc-300 rounded-md transition-colors flex items-center gap-1"
                            >
                              <CornerDownLeft size={14} />
                              退回发件网点
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="border-t border-zinc-200 pt-6">
        <h2 className="text-base font-semibold text-zinc-700 flex items-center gap-2 mb-4">
          <ArrowLeftRight size={16} className="text-primary-700" />
          标记问题件
        </h2>
        {markablePackages.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-sm">
            暂无可标记的包裹
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {markablePackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-lg border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div>
                  <span className="tracking-no text-sm font-medium text-zinc-800">
                    {pkg.trackingNo}
                  </span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600">
                    {STATUS_LABELS[pkg.status]}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setMarkModal({
                      open: true,
                      pkg,
                      problemType: '破损',
                      description: '',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <AlertTriangle size={14} />
                  标记问题件
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolveModal.open && resolveModal.pkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              setResolveModal({ open: false, pkg: null, action: null, resolution: '' })
            }
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
              onClick={() =>
                setResolveModal({ open: false, pkg: null, action: null, resolution: '' })
              }
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              {resolveModal.action === 'recheckin' ? '重新入库' : '退回发件网点'}
            </h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">运单号</span>
                <span className="tracking-no font-medium">
                  {resolveModal.pkg.trackingNo}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">问题类型</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(resolveModal.pkg.problemType)}`}
                >
                  {resolveModal.pkg.problemType ?? '其他'}
                </span>
              </div>
              {resolveModal.pkg.problemDescription && (
                <div className="text-sm">
                  <span className="text-zinc-500">问题描述</span>
                  <p className="mt-1 text-zinc-700">
                    {resolveModal.pkg.problemDescription}
                  </p>
                </div>
              )}
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                处理方案
              </label>
              <textarea
                value={resolveModal.resolution}
                onChange={(e) =>
                  setResolveModal((prev) => ({ ...prev, resolution: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 resize-none"
                placeholder="请输入处理方案..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setResolveModal({ open: false, pkg: null, action: null, resolution: '' })
                }
                className="flex-1 px-4 py-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveModal.resolution.trim()}
                className="flex-1 px-4 py-2 text-sm text-white bg-primary-700 hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}

      {markModal.open && markModal.pkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              setMarkModal({ open: false, pkg: null, problemType: '破损', description: '' })
            }
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
              onClick={() =>
                setMarkModal({ open: false, pkg: null, problemType: '破损', description: '' })
              }
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">标记问题件</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">运单号</span>
                <span className="tracking-no font-medium">
                  {markModal.pkg.trackingNo}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">当前状态</span>
                <span className="px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600">
                  {STATUS_LABELS[markModal.pkg.status]}
                </span>
              </div>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  问题类型
                </label>
                <select
                  value={markModal.problemType}
                  onChange={(e) =>
                    setMarkModal((prev) => ({ ...prev, problemType: e.target.value }))
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700"
                >
                  {PROBLEM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  问题描述
                </label>
                <textarea
                  value={markModal.description}
                  onChange={(e) =>
                    setMarkModal((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700 resize-none"
                  placeholder="请描述问题详情..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setMarkModal({ open: false, pkg: null, problemType: '破损', description: '' })
                }
                className="flex-1 px-4 py-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMark}
                disabled={!markModal.description.trim()}
                className="flex-1 px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {timelineModal.open && timelineModal.pkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setTimelineModal({ open: false, pkg: null })}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
              onClick={() => setTimelineModal({ open: false, pkg: null })}
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">责任追踪</h3>
            <p className="text-sm text-zinc-500 mb-5">
              运单号：
              <span className="tracking-no font-medium">
                {timelineModal.pkg.trackingNo}
              </span>
            </p>
            <div className="space-y-0 max-h-80 overflow-y-auto">
              {timelineModal.pkg.timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        event.status === 'problem'
                          ? 'bg-amber-500'
                          : idx === timelineModal.pkg!.timeline.length - 1
                            ? 'bg-primary-700'
                            : 'bg-zinc-300'
                      }`}
                    />
                    {idx < timelineModal.pkg!.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-zinc-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium text-zinc-800">
                      {STATUS_LABELS[event.status] ?? event.status}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      <span className="font-medium">{event.operator}</span>
                      <span className="mx-1">·</span>
                      {ROLE_LABELS[event.role] ?? event.role}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatTime(event.timestamp)}
                    </p>
                    {event.note && (
                      <p className="text-xs text-zinc-500 mt-1 italic">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
