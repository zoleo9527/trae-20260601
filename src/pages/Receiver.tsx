import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PackagePlus, Search, Check, X, ClipboardCheck, AlertTriangle, Package, CheckCircle, ChevronRight, Send, Edit3, RotateCcw } from 'lucide-react'
import { useDeviceStore } from '@/store/deviceStore'
import StatusBadge from '@/components/StatusBadge'
import GradeBadge from '@/components/GradeBadge'
import StatCard from '@/components/StatCard'
import { RiskTypeBadge, RiskSeverityDot } from '@/components/RiskBadge'
import { cn } from '@/lib/utils'
import type { DeviceStatus } from '@/types'

interface RegisterForm {
  brand: string
  model: string
  imei: string
  storage: string
  color: string
  appearanceScore: number
  estimatedPrice: string
  customerName: string
  customerPhone: string
  paymentAccount: string
  paymentBank: string
}

const emptyForm: RegisterForm = {
  brand: '',
  model: '',
  imei: '',
  storage: '',
  color: '',
  appearanceScore: 7,
  estimatedPrice: '',
  customerName: '',
  customerPhone: '',
  paymentAccount: '',
  paymentBank: '',
}

const TABS: { key: DeviceStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部设备' },
  { key: 'received', label: '待处理收货' },
  { key: 'inspecting', label: '检测中' },
  { key: 'graded', label: '等待客户确认' },
  { key: 'confirmed', label: '已确认待打款' },
  { key: 'completed', label: '已完成' },
  { key: 'returned', label: '已退回' },
]

export default function Receiver() {
  const {
    devices,
    riskFlags,
    selectedDeviceIds,
    toggleDeviceSelection,
    clearSelection,
    addDevice,
    confirmPrice,
    markPriceRegret,
    startInspection,
    batchAdjustPrice,
    returnDevice,
  } = useDeviceStore()
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<RegisterForm>(emptyForm)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<DeviceStatus | 'all'>('all')
  const [priceAdjustOpen, setPriceAdjustOpen] = useState(false)
  const [priceAdjustDelta, setPriceAdjustDelta] = useState('')
  const [priceAdjustNote, setPriceAdjustNote] = useState('')

  const stats = useMemo(() => {
    const received = devices.filter((d) => d.status === 'received').length
    const graded = devices.filter((d) => d.status === 'graded').length
    const completed = devices.filter((d) => d.status === 'completed').length
    const flagged = riskFlags.filter((r) => r.status !== 'resolved').length
    const returned = devices.filter((d) => d.status === 'returned').length
    return { today: devices.length, pending: received, graded, completed, flagged, returned }
  }, [devices, riskFlags])

  const filtered = useMemo(() => {
    let list = devices
    if (activeTab !== 'all') list = list.filter((d) => d.status === activeTab)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.imei.includes(q)
    )
  }, [devices, activeTab, search])

  const isAllSelected = filtered.length > 0 && filtered.every((d) => selectedDeviceIds.includes(d.id))

  const risksByDevice = useMemo(() => {
    const map = new Map<string, typeof riskFlags>()
    for (const r of riskFlags) {
      if (!map.has(r.deviceId)) map.set(r.deviceId, [])
      map.get(r.deviceId)!.push(r)
    }
    return map
  }, [riskFlags])

  const handleToggleAll = () => {
    if (isAllSelected) {
      clearSelection()
    } else {
      filtered.forEach((d) => {
        if (!selectedDeviceIds.includes(d.id)) {
          toggleDeviceSelection(d.id)
        }
      })
    }
  }

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.brand || !form.model || !form.customerName || !form.estimatedPrice) return
    addDevice({
      brand: form.brand,
      model: form.model,
      imei: form.imei,
      storage: form.storage,
      color: form.color,
      appearanceScore: form.appearanceScore,
      estimatedPrice: Number(form.estimatedPrice),
      customerId: `CUST-${Date.now().toString().slice(-6)}`,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      paymentAccount: form.paymentAccount,
      paymentBank: form.paymentBank,
      receivedBy: '小李',
    })
    setForm(emptyForm)
    setShowModal(false)
  }

  const handleBatchConfirm = () => {
    let count = 0
    selectedDeviceIds.forEach((id) => {
      const device = devices.find((d) => d.id === id)
      if (device && device.status === 'graded') {
        confirmPrice(id)
        count++
      }
    })
    clearSelection()
    if (count > 0) alert(`已批量确认 ${count} 台设备的报价`)
  }

  const handleBatchStartInspect = () => {
    let count = 0
    selectedDeviceIds.forEach((id) => {
      const device = devices.find((d) => d.id === id)
      if (device && device.status === 'received') {
        startInspection(id)
        count++
      }
    })
    clearSelection()
    if (count > 0) {
      alert(`已将 ${count} 台设备派发至检测工作台`)
      navigate('/inspector')
    }
  }

  const handleBatchReturn = () => {
    if (!confirm(`确认批量退回 ${selectedDeviceIds.length} 台设备？`)) return
    selectedDeviceIds.forEach((id) => returnDevice(id))
    clearSelection()
  }

  const handleBatchAdjust = () => {
    const delta = Number(priceAdjustDelta)
    if (!delta) {
      alert('请先输入调价金额')
      return
    }
    batchAdjustPrice(selectedDeviceIds, delta)
    setPriceAdjustOpen(false)
    setPriceAdjustDelta('')
    setPriceAdjustNote('')
    clearSelection()
  }

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: devices.length }
    for (const d of devices) c[d.status] = (c[d.status] || 0) + 1
    return c
  }, [devices])

  const batchGradedCount = selectedDeviceIds.filter((id) => {
    const d = devices.find((x) => x.id === id)
    return d && d.status === 'graded'
  }).length
  const batchReceivedCount = selectedDeviceIds.filter((id) => {
    const d = devices.find((x) => x.id === id)
    return d && d.status === 'received'
  }).length

  return (
    <div className="min-h-screen p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-100">收货员工作台</h1>
          <p className="text-xs text-gray-500 mt-0.5">收货登记 · 报价沟通 · 批量派发至检测</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-accent/20"
        >
          <PackagePlus className="w-4 h-4" />
          快速登记收货
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard label="总设备" value={stats.today} icon={<Package className="w-4 h-4 text-blue-400" />} color="bg-blue-500/20" compact />
        <StatCard label="待处理收货" value={stats.pending} icon={<PackagePlus className="w-4 h-4 text-yellow-400" />} color="bg-yellow-500/20" compact />
        <StatCard label="检测中" value={devices.filter(d => d.status === 'inspecting').length} icon={<ClipboardCheck className="w-4 h-4 text-cyan-400" />} color="bg-cyan-500/20" compact />
        <StatCard label="待客户确认" value={stats.graded} icon={<AlertTriangle className="w-4 h-4 text-brand-accent" />} color="bg-brand-accent/20" compact />
        <StatCard label="已完成" value={stats.completed} icon={<CheckCircle className="w-4 h-4 text-green-400" />} color="bg-green-500/20" compact />
        <StatCard label="异常预警" value={stats.flagged} icon={<AlertTriangle className="w-4 h-4 text-red-400" />} color="bg-red-500/20" compact />
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((tab) => {
            const active = activeTab === tab.key
            const count = tabCounts[tab.key] ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); clearSelection() }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  active
                    ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-brand-surface border border-transparent'
                )}
              >
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px]',
                  active ? 'bg-brand-accent/30 text-white' : 'bg-brand-border text-gray-400'
                )}>{count}</span>
              </button>
            )
          })}
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索编号/型号/客户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-56 bg-brand-surface border border-brand-border rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50 transition-colors"
            />
          </div>
        </div>
      </div>

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
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">设备编号</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">型号</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">客户</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">预估/最终价</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">状态</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">等级</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs">风险标记</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium text-xs text-right pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((device) => {
                const dRisks = risksByDevice.get(device.id)?.filter(r => r.status !== 'resolved') ?? []
                return (
                  <tr
                    key={device.id}
                    className={cn(
                      'border-b border-brand-border/50 transition-colors hover:bg-brand-surface/60',
                      selectedDeviceIds.includes(device.id) && 'bg-brand-accent/5'
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedDeviceIds.includes(device.id)}
                        onChange={() => toggleDeviceSelection(device.id)}
                        className="rounded border-gray-600 bg-brand-card text-brand-accent focus:ring-brand-accent/50"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link to={`/device/${device.id}`} className="text-brand-accent hover:text-brand-accent/80 font-mono text-xs transition-colors">
                        {device.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-200">
                      <Link to={`/device/${device.id}`} className="hover:text-brand-accent transition-colors text-xs">
                        {device.brand} {device.model} <span className="text-gray-500 text-[10px]">({device.storage})</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-300 text-xs">
                      <div>{device.customerName}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{device.customerPhone}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <div className={cn(device.finalPrice !== null && device.finalPrice !== device.estimatedPrice ? 'text-gray-500 line-through' : 'text-gray-300')}>
                        ¥{device.estimatedPrice.toLocaleString()}
                      </div>
                      {device.finalPrice !== null && (
                        <div className="text-green-300 font-bold mt-0.5">¥{device.finalPrice.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={device.status} size="sm" />
                    </td>
                    <td className="px-3 py-2.5">
                      {device.grade ? <GradeBadge grade={device.grade} size="sm" /> : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px]">
                      {dRisks.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {dRisks.slice(0, 2).map((r) => (
                            <div key={r.id} className="inline-flex items-center gap-1">
                              <RiskTypeBadge type={r.type} size="sm" />
                              <RiskSeverityDot severity={r.severity} />
                            </div>
                          ))}
                          {dRisks.length > 2 && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">+{dRisks.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/device/${device.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-gray-200 hover:bg-brand-border/50 rounded transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" />详情
                        </Link>
                        {device.status === 'received' && (
                          <button
                            onClick={() => { startInspection(device.id); navigate('/inspector') }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded font-medium hover:bg-cyan-500/30 transition-colors"
                          >
                            <ClipboardCheck className="w-3 h-3" />派检测
                          </button>
                        )}
                        {device.status === 'graded' && (
                          <>
                            <button
                              onClick={() => confirmPrice(device.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 rounded font-medium hover:bg-green-500/30 transition-colors"
                            >
                              <Check className="w-3 h-3" />确认
                            </button>
                            <button
                              onClick={() => markPriceRegret(device.id, '客户拒绝报价要求退回')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 rounded font-medium hover:bg-red-500/30 transition-colors"
                            >
                              <X className="w-3 h-3" />反悔
                            </button>
                          </>
                        )}
                        {(device.status === 'returned' || dRisks.length > 0) && dRisks.length > 0 && (
                          <Link
                            to={`/device/${device.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded font-medium hover:bg-orange-500/30 transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3" />处理风险
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-500 text-sm">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    当前筛选下暂无设备
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDeviceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="absolute inset-0 bg-brand-card/98 backdrop-blur-md border-t-2 border-brand-accent/40" />
          <div className="relative px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm text-gray-300">
                已选 <span className="text-brand-accent font-bold text-base">{selectedDeviceIds.length}</span> 台
              </div>
              {batchReceivedCount > 0 && (
                <div className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  {batchReceivedCount} 台可派发检测
                </div>
              )}
              {batchGradedCount > 0 && (
                <div className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                  {batchGradedCount} 台可批量确认
                </div>
              )}
              {(selectedDeviceIds.length - batchReceivedCount - batchGradedCount) > 0 && (
                <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                  {selectedDeviceIds.length - batchReceivedCount - batchGradedCount} 台状态不匹配（将被跳过）
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-brand-border rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setPriceAdjustOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg font-medium hover:bg-orange-500/30 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                批量调价
              </button>
              <button
                onClick={handleBatchReturn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg font-medium hover:bg-gray-500/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                批量退回
              </button>
              {batchGradedCount > 0 && (
                <button
                  onClick={handleBatchConfirm}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-green-500/90 text-white rounded-lg font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  批量确认报价 ({batchGradedCount})
                </button>
              )}
              {batchReceivedCount > 0 && (
                <button
                  onClick={handleBatchStartInspect}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-brand-accent/90 text-white rounded-lg font-bold hover:bg-brand-accent transition-colors shadow-lg shadow-brand-accent/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  派送至检测 ({batchReceivedCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {priceAdjustOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPriceAdjustOpen(false)} />
          <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div>
                <h2 className="text-base font-bold text-gray-100">批量调价</h2>
                <p className="text-xs text-gray-500 mt-0.5">对 {selectedDeviceIds.length} 台设备的预估价进行统一调整</p>
              </div>
              <button onClick={() => setPriceAdjustOpen(false)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">调价金额（元，正数加价，负数减价）*</label>
                <input
                  type="number"
                  value={priceAdjustDelta}
                  onChange={(e) => setPriceAdjustDelta(e.target.value)}
                  placeholder="如 200 或 -150"
                  className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 font-mono"
                />
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {['+100', '+200', '-100'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPriceAdjustDelta(v)}
                      className="text-xs py-1.5 rounded bg-brand-card border border-brand-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">调价原因 / 说明</label>
                <textarea
                  value={priceAdjustNote}
                  onChange={(e) => setPriceAdjustNote(e.target.value)}
                  placeholder="例如：统一上调（市场回暖） / 客户议价后调整..."
                  rows={2}
                  className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 resize-none"
                />
              </div>
              <div className="pt-1 flex items-center gap-3">
                <button
                  onClick={() => setPriceAdjustOpen(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 border border-brand-border hover:text-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchAdjust}
                  disabled={!priceAdjustDelta}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors',
                    priceAdjustDelta
                      ? 'bg-brand-accent/90 text-white hover:bg-brand-accent'
                      : 'bg-brand-card text-gray-500 cursor-not-allowed border border-brand-border'
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  执行调价
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-brand-surface border border-brand-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-border sticky top-0 bg-brand-surface z-10">
              <h2 className="text-lg font-bold text-gray-100">快速登记收货</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitRegister} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">品牌 *</label>
                  <input type="text" required value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
                    placeholder="Apple / 华为..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">型号 *</label>
                  <input type="text" required value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
                    placeholder="iPhone 15 Pro..." />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">IMEI</label>
                  <input type="text" value={form.imei} onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50 font-mono"
                    placeholder="15位" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">存储</label>
                  <input type="text" value={form.storage} onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
                    placeholder="256GB" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">颜色</label>
                  <input type="text" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
                    placeholder="午夜色" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">外观评分：<span className="text-brand-accent font-bold">{form.appearanceScore}</span>/10</label>
                <input type="range" min={1} max={10} value={form.appearanceScore}
                  onChange={(e) => setForm((f) => ({ ...f, appearanceScore: Number(e.target.value) }))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-brand-border accent-brand-accent" />
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>1 磨损严重</span><span>5 一般</span><span>10 全新</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">预估价 (元) *</label>
                <input type="number" required min={0} value={form.estimatedPrice}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedPrice: e.target.value }))}
                  className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50 font-mono"
                  placeholder="3000" />
              </div>
              <div className="pt-2 border-t border-brand-border/50">
                <p className="text-[11px] text-gray-400 mb-2.5">客户信息</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">客户姓名 *</label>
                    <input type="text" required value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">联系电话</label>
                    <input type="tel" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-2.5">打款信息</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">收款账号</label>
                    <input type="text" value={form.paymentAccount} onChange={(e) => setForm((f) => ({ ...f, paymentAccount: e.target.value }))}
                      className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">开户银行</label>
                    <input type="text" value={form.paymentBank} onChange={(e) => setForm((f) => ({ ...f, paymentBank: e.target.value }))}
                      className="w-full px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-accent/50" />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-accent/20">
                  <PackagePlus className="w-4 h-4" />提交登记
                </button>
                <button type="button" onClick={() => { setForm(emptyForm); setShowModal(false) }}
                  className="px-4 py-2.5 text-gray-400 hover:text-gray-200 border border-brand-border rounded-lg transition-colors text-sm">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
