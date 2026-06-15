import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeviceStore } from '@/store/deviceStore'
import { RiskTypeBadge, RiskSeverityDot, RiskStatusLabel } from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import GradeBadge from '@/components/GradeBadge'
import StatCard from '@/components/StatCard'
import { AlertTriangle, DollarSign, Bug, RefreshCw, CheckCircle, ChevronRight, Check, RotateCcw, Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RiskType, RiskStatus } from '@/types'

const typeTabs: { type: RiskType | 'all'; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { type: 'all', label: '全部类型', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-gray-300', bg: 'bg-gray-500/20' },
  { type: 'price_regret', label: '估价反悔', icon: <DollarSign className="w-4 h-4" />, color: 'text-red-300', bg: 'bg-red-500/20' },
  { type: 'hidden_defect', label: '暗病争议', icon: <Bug className="w-4 h-4" />, color: 'text-orange-300', bg: 'bg-orange-500/20' },
  { type: 'payment_error', label: '打款异常', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-300', bg: 'bg-red-500/20' },
  { type: 'review', label: '复盘提醒', icon: <RefreshCw className="w-4 h-4" />, color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
]

const STATUS_FILTER: { key: RiskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部状态' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
]

export default function Risks() {
  const navigate = useNavigate()
  const [activeType, setActiveType] = useState<RiskType | 'all'>('all')
  const [activeStatus, setActiveStatus] = useState<RiskStatus | 'all'>('all')
  const [selectedRiskIds, setSelectedRiskIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const { riskFlags, devices, resolveRisk, updateRiskStatus, verifyPayment, startInspection, returnDevice, confirmPrice } = useDeviceStore()

  const stats = useMemo(() => {
    const pending = riskFlags.filter(r => r.status === 'pending').length
    const processing = riskFlags.filter(r => r.status === 'processing').length
    const resolved = riskFlags.filter(r => r.status === 'resolved').length
    const high = riskFlags.filter(r => r.status !== 'resolved' && r.severity === 'high').length
    return { total: riskFlags.length, pending, processing, resolved, high }
  }, [riskFlags])

  const filtered = useMemo(() => {
    let list = riskFlags
    if (activeType !== 'all') list = list.filter(r => r.type === activeType)
    if (activeStatus !== 'all') list = list.filter(r => r.status === activeStatus)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => {
        const d = devices.find(x => x.id === r.deviceId)
        return (
          r.description.toLowerCase().includes(q) ||
          (d?.model.toLowerCase().includes(q)) ||
          (d?.customerName.toLowerCase().includes(q)) ||
          (d?.id.toLowerCase().includes(q)) ||
          r.id.toLowerCase().includes(q)
        )
      })
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [riskFlags, activeType, activeStatus, search, devices])

  const isAllSelected = filtered.length > 0 && filtered.every(r => selectedRiskIds.includes(r.id))

  const handleToggleAll = () => {
    if (isAllSelected) setSelectedRiskIds([])
    else setSelectedRiskIds(filtered.filter(r => r.status !== 'resolved').map(r => r.id))
  }

  const handleToggleSelect = (id: string) => {
    setSelectedRiskIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBatchResolve = () => {
    selectedRiskIds.forEach(id => resolveRisk(id))
    setSelectedRiskIds([])
  }

  const handleBatchProcessing = () => {
    selectedRiskIds.forEach(id => {
      const r = riskFlags.find(x => x.id === id)
      if (r && r.status === 'pending') updateRiskStatus(id, 'processing')
    })
    setSelectedRiskIds([])
  }

  const batchPendingCount = selectedRiskIds.filter(id => {
    const r = riskFlags.find(x => x.id === id)
    return r && r.status !== 'resolved'
  }).length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-100">风险控制面板</h1>
          <p className="text-xs text-gray-500 mt-0.5">统一管理估价反悔、暗病争议、打款异常、复盘提醒 · 处理后自动解除流转阻塞</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="总风险" value={stats.total} icon={<AlertTriangle className="w-4 h-4 text-gray-400" />} color="bg-gray-500/20" compact />
        <StatCard label="待处理" value={stats.pending} icon={<RefreshCw className="w-4 h-4 text-yellow-400" />} color="bg-yellow-500/20" compact />
        <StatCard label="处理中" value={stats.processing} icon={<Bug className="w-4 h-4 text-blue-400" />} color="bg-blue-500/20" compact />
        <StatCard label="高紧急" value={stats.high} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} color="bg-red-500/20" compact />
        <StatCard label="已解决" value={stats.resolved} icon={<CheckCircle className="w-4 h-4 text-green-400" />} color="bg-green-500/20" compact />
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {typeTabs.map(tab => {
            const count = tab.type === 'all'
              ? riskFlags.length
              : riskFlags.filter(r => r.type === tab.type).length
            const active = activeType === tab.type
            return (
              <button
                key={tab.type}
                onClick={() => { setActiveType(tab.type); setSelectedRiskIds([]) }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  active
                    ? `${tab.bg} ${tab.color} border-white/10 shadow-inner`
                    : 'text-gray-400 hover:text-gray-200 hover:bg-brand-surface border-transparent'
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px]',
                  active ? 'bg-black/20 text-white' : 'bg-brand-border text-gray-400'
                )}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {STATUS_FILTER.map(f => {
            const count = f.key === 'all' ? filtered.length : filtered.filter(r => r.status === f.key).length
            const active = activeStatus === f.key
            return (
              <button
                key={f.key}
                onClick={() => { setActiveStatus(f.key); setSelectedRiskIds([]) }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                  active ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30' : 'text-gray-500 hover:text-gray-300 hover:bg-brand-surface border border-transparent'
                )}
              >
                {f.label}
                <span className={active ? 'text-brand-accent' : 'text-gray-600'}>·{count}</span>
              </button>
            )
          })}
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索设备/客户/风险描述..."
              className="pl-8 pr-3 py-1 w-64 bg-brand-surface border border-brand-border rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-accent/50"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-xl py-20 text-center">
          <CheckCircle className="w-14 h-14 mx-auto mb-4 opacity-20 text-green-400" />
          <p className="text-sm text-gray-500 mb-2">当前筛选下暂无风险记录</p>
          <Link to="/receiver" className="text-xs text-brand-accent hover:underline">返回收货工作台 →</Link>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface/40">
                  <th className="px-3 py-2.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleAll}
                      className="rounded border-gray-600 bg-brand-card text-brand-accent focus:ring-brand-accent/50"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">风险类型</th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">描述</th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">关联设备</th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">紧急度</th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">状态</th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">时间</th>
                  <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs text-right pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(risk => {
                  const d = devices.find(x => x.id === risk.deviceId)
                  const isResolved = risk.status === 'resolved'
                  return (
                    <tr
                      key={risk.id}
                      className={cn(
                        'border-b border-brand-border/50 transition-colors hover:bg-brand-surface/60',
                        isResolved && 'opacity-60',
                        selectedRiskIds.includes(risk.id) && 'bg-brand-accent/5',
                        risk.severity === 'high' && !isResolved && 'bg-red-500/[0.02]'
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          disabled={isResolved}
                          checked={selectedRiskIds.includes(risk.id)}
                          onChange={() => handleToggleSelect(risk.id)}
                          className="rounded border-gray-600 bg-brand-card text-brand-accent focus:ring-brand-accent/50 disabled:opacity-30"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <RiskTypeBadge type={risk.type} size="sm" />
                          <RiskSeverityDot severity={risk.severity} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-300 leading-snug max-w-[280px] line-clamp-2" title={risk.description}>
                          {risk.description}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {d ? (
                          <div className="space-y-0.5">
                            <Link
                              to={`/device/${d.id}`}
                              className="text-xs text-brand-accent hover:text-brand-accent/80 font-mono flex items-center gap-1"
                            >
                              {d.id} <ChevronRight className="w-3 h-3" />
                            </Link>
                            <div className="text-xs text-gray-300">{d.brand} {d.model}</div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-gray-500">{d.customerName}</span>
                              <StatusBadge status={d.status} size="xs" />
                              {d.grade && <GradeBadge grade={d.grade} size="xs" />}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">设备已删除</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium',
                          risk.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                          risk.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        )}>
                          {risk.severity === 'high' ? '高紧急' : risk.severity === 'medium' ? '中' : '低'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <RiskStatusLabel status={risk.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[10px] text-gray-500 font-mono space-y-0.5">
                          <div>创建 {risk.createdAt}</div>
                          {risk.resolvedAt && <div className="text-green-400/70">解决 {risk.resolvedAt}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right pr-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {!isResolved && d && risk.type === 'payment_error' && (
                            <button
                              onClick={() => navigate('/finance')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded font-medium hover:bg-orange-500/30 transition-colors"
                            >
                              <AlertTriangle className="w-3 h-3" />去修账号
                            </button>
                          )}
                          {!isResolved && d && risk.type === 'hidden_defect' && (
                            <button
                              onClick={() => navigate('/inspector')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded font-medium hover:bg-orange-500/30 transition-colors"
                            >
                              <Bug className="w-3 h-3" />复核检测
                            </button>
                          )}
                          {!isResolved && d && risk.type === 'price_regret' && (
                            <button
                              onClick={() => { if (confirm('确认退回设备？')) returnDevice(d.id) }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded font-medium hover:bg-gray-500/30 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />退回设备
                            </button>
                          )}
                          {!isResolved && d && risk.type === 'review' && d.status === 'graded' && (
                            <button
                              onClick={() => confirmPrice(d.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 rounded font-medium hover:bg-green-500/30 transition-colors"
                            >
                              <Check className="w-3 h-3" />确认通过
                            </button>
                          )}
                          {risk.status === 'pending' && (
                            <button
                              onClick={() => updateRiskStatus(risk.id, 'processing')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-medium hover:bg-blue-500/30 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />开始处理
                            </button>
                          )}
                          {!isResolved && (
                            <button
                              onClick={() => resolveRisk(risk.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 rounded font-medium hover:bg-green-500/30 transition-colors"
                            >
                              <Check className="w-3 h-3" />解决
                            </button>
                          )}
                          {d && (
                            <Link
                              to={`/device/${d.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-gray-200 hover:bg-brand-border/50 rounded transition-colors"
                            >
                              详情
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRiskIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-brand-card/98 backdrop-blur-md border-t-2 border-yellow-500/40" />
          <div className="relative px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm text-gray-300">
                已选风险 <span className="text-yellow-400 font-bold text-base">{selectedRiskIds.length}</span> 条
                <span className="text-xs text-gray-500 ml-2">（其中 {batchPendingCount} 条可处理）</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedRiskIds([])}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-brand-border rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> 取消
              </button>
              {batchPendingCount > 0 && (
                <>
                  <button
                    onClick={handleBatchProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-500/90 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    批量标记处理中
                  </button>
                  <button
                    onClick={handleBatchResolve}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-green-500/90 text-white rounded-lg font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    批量解决 ({batchPendingCount})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
