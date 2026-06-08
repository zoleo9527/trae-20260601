import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ClipboardList,
  CheckCircle2,
  Undo2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Plus,
  RefreshCw,
  Package,
  Inbox,
  Eye,
} from 'lucide-react'
import useStore from '@/store'

const CATEGORY_MAP: Record<string, string> = {
  bedsheet: '床单',
  pillowcase: '枕套',
  bath_towel: '浴巾',
  face_towel: '面巾',
}

const LOSS_TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  wear: { label: '磨损', color: '#eab308', bg: '#fefce8' },
  stain: { label: '污渍', color: '#f97316', bg: '#fff7ed' },
  missing: { label: '丢失', color: '#ef4444', bg: '#fef2f2' },
}

const LOSS_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  registered: { label: '待确认', color: '#f97316', bg: '#fff7ed' },
  confirmed: { label: '已确认', color: '#3b82f6', bg: '#eff6ff' },
  replaced: { label: '已替换', color: '#22c55e', bg: '#f0fdf4' },
}

const REQ_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#f59e0b', bg: '#fffbeb' },
  fulfilled: { label: '使用中', color: '#3b82f6', bg: '#eff6ff' },
  returned: { label: '已归还', color: '#22c55e', bg: '#f0fdf4' },
}

type TabKey = 'pending' | 'fulfilled' | 'returned' | 'loss'

const TABS: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: 'pending', label: '待确认', icon: ClipboardList },
  { key: 'fulfilled', label: '使用中', icon: RefreshCw },
  { key: 'returned', label: '已归还', icon: Undo2 },
  { key: 'loss', label: '损耗追踪', icon: AlertTriangle },
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RelayChain({ req }: { req: any }) {
  const steps = [
    {
      label: '领用提交',
      person: req.operator_name,
      time: req.requisition_time,
      done: true,
      icon: ClipboardList,
    },
    {
      label: '布草确认',
      person: req.status !== 'pending' ? req.operator_name : '-',
      time: req.statusLogs?.find((l: any) => l.new_status === 'fulfilled')?.created_at,
      done: req.status !== 'pending',
      icon: CheckCircle2,
    },
    {
      label: '归还登记',
      person: req.returns?.[0]?.operator_name || '-',
      time: req.returns?.[0]?.return_time,
      done: req.status === 'returned',
      icon: Undo2,
    },
  ]

  if (req.losses?.length > 0) {
    steps.push({
      label: '损耗处理',
      person: req.losses[0].confirmer_name || '待确认',
      time: req.losses[0].confirmed_at || req.losses[0].loss_date,
      done: req.losses.every((l: any) => l.status !== 'registered'),
      icon: AlertTriangle,
    })
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: step.done ? '#f0fdf4' : '#f3f4f6',
                border: `1.5px solid ${step.done ? '#22c55e' : '#d1d5db'}`,
              }}
            >
              <step.icon size={10} style={{ color: step.done ? '#22c55e' : '#9ca3af' }} />
            </div>
            <span className="text-xs" style={{ color: step.done ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
              {step.label}
            </span>
            <span className="text-xs font-medium" style={{ color: step.done ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              {step.person}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-4 h-px mx-1" style={{ backgroundColor: step.done ? '#22c55e' : '#d1d5db' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function StatusLogTimeline({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) return null
  return (
    <div className="relative pl-5 mt-3">
      <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ backgroundColor: 'var(--color-border)' }} />
      {logs.map((log, i) => (
        <div key={log.id || i} className="relative mb-3 last:mb-0">
          <div
            className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full border-2 bg-white"
            style={{ borderColor: 'var(--color-accent)' }}
          />
          <div className="ml-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                {log.new_status}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {log.operator_name}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {formatTime(log.created_at)}
              </span>
            </div>
            {log.note && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{log.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Linen() {
  const navigate = useNavigate()
  const {
    workstationData,
    fetchLinenWorkstation,
    confirmLinenRequisition,
    confirmLinenLoss,
    replaceLinenLoss,
    verifyLinenReturn,
    currentUser,
    users,
    fetchUsers,
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [keyword, setKeyword] = useState('')
  const [floorFilter, setFloorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const loadWorkstation = useCallback(() => {
    const filters: Record<string, string> = {}
    if (floorFilter) filters.floor = floorFilter
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (keyword.trim()) filters.keyword = keyword.trim()
    fetchLinenWorkstation(filters)
  }, [fetchLinenWorkstation, floorFilter, dateFrom, dateTo, keyword])

  useEffect(() => {
    loadWorkstation()
  }, [loadWorkstation])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleConfirmRequisition = async (id: string) => {
    if (!currentUser) return
    setActionLoading(id)
    try {
      await confirmLinenRequisition(id, String(currentUser.id))
      showToast('success', '领用已确认')
    } catch {
      showToast('error', '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmLoss = async (id: string) => {
    if (!currentUser) return
    setActionLoading(id)
    try {
      await confirmLinenLoss(id, String(currentUser.id))
      showToast('success', '损耗已确认')
    } catch {
      showToast('error', '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReplaceLoss = async (id: string) => {
    if (!currentUser) return
    setActionLoading(id)
    try {
      await replaceLinenLoss(id, String(currentUser.id))
      showToast('success', '已标记为替换补发')
    } catch {
      showToast('error', '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerifyReturn = async (id: string) => {
    if (!currentUser) return
    setActionLoading(id)
    try {
      await verifyLinenReturn(id, String(currentUser.id))
      showToast('success', '归还已复核')
    } catch {
      showToast('error', '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const summary = workstationData?.summary ?? { pending: 0, fulfilled: 0, returned: 0, unconfirmedLoss: 0 }
  const requisitions = workstationData?.requisitions ?? []
  const standaloneLosses = workstationData?.standaloneLosses ?? []

  const filteredRequisitions = useMemo(() => {
    let list = requisitions
    if (activeTab === 'pending') list = list.filter((r) => r.status === 'pending')
    else if (activeTab === 'fulfilled') list = list.filter((r) => r.status === 'fulfilled')
    else if (activeTab === 'returned') list = list.filter((r) => r.status === 'returned')
    else if (activeTab === 'loss') {
      return list.filter((r) => r.losses?.length > 0)
    }
    return list
  }, [requisitions, activeTab])

  const filteredStandaloneLosses = useMemo(() => {
    if (activeTab !== 'loss') return []
    return standaloneLosses
  }, [standaloneLosses, activeTab])

  const hasLossTabData = filteredRequisitions.length > 0 || filteredStandaloneLosses.length > 0

  const summaryCards = [
    { key: 'pending' as TabKey, label: '待确认', count: summary.pending, icon: ClipboardList, color: '#f59e0b', bg: '#fffbeb' },
    { key: 'fulfilled' as TabKey, label: '使用中', count: summary.fulfilled, icon: RefreshCw, color: '#3b82f6', bg: '#eff6ff' },
    { key: 'returned' as TabKey, label: '已归还', count: summary.returned, icon: Undo2, color: '#22c55e', bg: '#f0fdf4' },
    { key: 'loss' as TabKey, label: '损耗待处理', count: summary.unconfirmedLoss, icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}>
          布草工作台
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadWorkstation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:shadow-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
          <button
            onClick={() => navigate('/linen/requisition')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} />
            新建领用
          </button>
        </div>
      </div>

      {toast && (
        <div
          className="px-4 py-3 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: toast.type === 'success' ? 'var(--color-vacant)' : 'var(--color-maintenance)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setActiveTab(card.key)}
            className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all text-left"
            style={{
              borderLeft: activeTab === card.key ? `3px solid ${card.color}` : '3px solid transparent',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: card.bg }}
            >
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: card.color }}>{card.count}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{card.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="搜索房间号..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm w-40 focus:outline-none focus:ring-1"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">全部楼层</option>
          <option value="3">3楼</option>
          <option value="4">4楼</option>
          <option value="5">5楼</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>至</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {(keyword || floorFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setKeyword(''); setFloorFilter(''); setDateFrom(''); setDateTo('') }}
            className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'loss' && filteredRequisitions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 flex flex-col items-center justify-center">
          <Inbox size={48} style={{ color: 'var(--color-border)' }} />
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {activeTab === 'pending' ? '暂无待确认的领用单' : activeTab === 'fulfilled' ? '暂无使用中的布草' : '暂无归还记录'}
          </p>
          {activeTab === 'pending' && (
            <button
              onClick={() => navigate('/linen/requisition')}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus size={14} />
              新建领用
            </button>
          )}
        </div>
      )}

      {activeTab === 'loss' && !hasLossTabData && (
        <div className="bg-white rounded-xl shadow-sm p-12 flex flex-col items-center justify-center">
          <Package size={48} style={{ color: 'var(--color-border)' }} />
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            暂无损耗记录
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredRequisitions.map((req) => {
          const isExpanded = expandedId === req.id
          const st = REQ_STATUS_MAP[req.status] ?? REQ_STATUS_MAP.pending
          const hasUnverifiedReturn = req.returns?.some((ret: any) => !ret.verified_by)
          const hasUnconfirmedLoss = req.losses?.some((l: any) => l.status === 'registered')

          return (
            <div key={req.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: st.bg, color: st.color }}
                    >
                      {req.room_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {req.room_number}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                        {req.losses?.length > 0 && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                          >
                            损耗 {req.losses.length}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {req.items.map((item: any, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--color-bg)' }}
                          >
                            {CATEGORY_MAP[item.category] || item.category} × {item.quantity}
                          </span>
                        ))}
                      </div>
                      <RelayChain req={req} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <User size={12} />
                      {req.operator_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock size={12} />
                      {formatTime(req.requisition_time)}
                    </div>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmRequisition(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      >
                        确认发放
                      </button>
                    )}
                    {req.status === 'fulfilled' && (
                      <button
                        onClick={() => navigate(`/linen/return?requisitionId=${req.id}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ backgroundColor: 'var(--color-occupied)' }}
                      >
                        归还登记
                      </button>
                    )}
                    {req.status === 'returned' && hasUnverifiedReturn && (
                      <button
                        onClick={() => {
                          const ret = req.returns.find((r: any) => !r.verified_by)
                          if (ret) handleVerifyReturn(ret.id)
                        }}
                        disabled={!!actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                        style={{ borderColor: 'var(--color-vacant)', color: 'var(--color-vacant)' }}
                      >
                        复核确认
                      </button>
                    )}
                    {hasUnconfirmedLoss && req.status === 'returned' && req.losses
                      .filter((l: any) => l.status === 'registered')
                      .map((loss: any) => (
                        <button
                          key={loss.id}
                          onClick={() => handleConfirmLoss(loss.id)}
                          disabled={actionLoading === loss.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: '#ef4444' }}
                        >
                          确认损耗
                        </button>
                      ))}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {req.notes && (
                  <div className="mt-2 text-xs px-1" style={{ color: 'var(--color-text-muted)' }}>
                    备注: {req.notes}
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="border-t px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: '#fafbfc' }}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                        状态变更记录
                      </h4>
                      <StatusLogTimeline logs={req.statusLogs || []} />
                      {(!req.statusLogs || req.statusLogs.length === 0) && (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>暂无状态记录</p>
                      )}
                    </div>

                    <div>
                      {req.returns?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                            归还记录
                          </h4>
                          {req.returns.map((ret: any) => (
                            <div key={ret.id} className="mb-3 p-3 rounded-lg bg-white border" style={{ borderColor: 'var(--color-border)' }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{ret.operator_name}</span>
                                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    {formatFullTime(ret.return_time)}
                                  </span>
                                </div>
                                {ret.verified_by ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
                                    已复核
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
                                    待复核
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {ret.items.map((ri: any, i: number) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                                    {CATEGORY_MAP[ri.category] || ri.category} × {ri.quantity}
                                  </span>
                                ))}
                              </div>
                              {ret.notes && (
                                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>备注: {ret.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {req.losses?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-maintenance)' }}>
                            损耗记录
                          </h4>
                          {req.losses.map((loss: any) => {
                            const lt = LOSS_TYPE_MAP[loss.loss_type] ?? LOSS_TYPE_MAP.wear
                            const ls = LOSS_STATUS_MAP[loss.status] ?? LOSS_STATUS_MAP.registered
                            return (
                              <div key={loss.id} className="mb-2 p-3 rounded-lg bg-white border" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{CATEGORY_MAP[loss.category] || loss.category} × {loss.quantity}</span>
                                    <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: lt.bg, color: lt.color }}>
                                      {lt.label}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ls.bg, color: ls.color }}>
                                      {ls.label}
                                    </span>
                                  </div>
                                  {loss.status === 'registered' && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleConfirmLoss(loss.id)}
                                        disabled={actionLoading === loss.id}
                                        className="text-xs px-2 py-1 rounded font-medium text-white disabled:opacity-50"
                                        style={{ backgroundColor: '#3b82f6' }}
                                      >
                                        确认
                                      </button>
                                    </div>
                                  )}
                                  {loss.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleReplaceLoss(loss.id)}
                                      disabled={actionLoading === loss.id}
                                      className="text-xs px-2 py-1 rounded font-medium text-white disabled:opacity-50"
                                      style={{ backgroundColor: '#22c55e' }}
                                    >
                                      补发替换
                                    </button>
                                  )}
                                </div>
                                {loss.description && (
                                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{loss.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  <span>登记: {loss.operator_name} {formatTime(loss.loss_date)}</span>
                                  {loss.confirmer_name && (
                                    <span>确认: {loss.confirmer_name} {loss.confirmed_at ? formatTime(loss.confirmed_at) : ''}</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {activeTab === 'loss' && filteredStandaloneLosses.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
              独立损耗记录
            </h3>
            {filteredStandaloneLosses.map((loss) => {
              const lt = LOSS_TYPE_MAP[loss.loss_type] ?? LOSS_TYPE_MAP.wear
              const ls = LOSS_STATUS_MAP[loss.status] ?? LOSS_STATUS_MAP.registered
              return (
                <div key={loss.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                        {loss.room_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{loss.room_number}</span>
                          <span className="text-sm">{CATEGORY_MAP[loss.category] || loss.category} × {loss.quantity}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: lt.bg, color: lt.color }}>
                            {lt.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ls.bg, color: ls.color }}>
                            {ls.label}
                          </span>
                        </div>
                        {loss.description && (
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{loss.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>登记: {loss.operator_name} {formatTime(loss.loss_date)}</span>
                          {loss.confirmer_name && (
                            <span>确认: {loss.confirmer_name} {loss.confirmed_at ? formatTime(loss.confirmed_at) : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {loss.status === 'registered' && (
                        <button
                          onClick={() => handleConfirmLoss(loss.id)}
                          disabled={actionLoading === loss.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: '#3b82f6' }}
                        >
                          确认
                        </button>
                      )}
                      {loss.status === 'confirmed' && (
                        <button
                          onClick={() => handleReplaceLoss(loss.id)}
                          disabled={actionLoading === loss.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: '#22c55e' }}
                        >
                          补发替换
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>
          共 {filteredRequisitions.length + filteredStandaloneLosses.length} 条记录
        </span>
        <button
          onClick={() => navigate('/linen/inventory')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          <Eye size={14} />
          查看盘点对账
        </button>
      </div>
    </div>
  )
}
