import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeviceStore } from '@/store/deviceStore'
import StatusBadge from '@/components/StatusBadge'
import GradeBadge from '@/components/GradeBadge'
import RiskBadge, { RiskSeverityDot } from '@/components/RiskBadge'
import { cn } from '@/lib/utils'
import type { Grade, InspectionItem, InspectionReport, InspectionResult, RiskType } from '@/types'
import { INSPECTION_CATEGORIES } from '@/data/mockData'
import { ClipboardCheck, ChevronDown, ChevronRight, Check, X, SkipForward, AlertTriangle, History, Filter, ExternalLink, Calculator } from 'lucide-react'

const GRADE_RATIO: Record<Grade, number> = {
  A: 1.05, B: 0.9, C: 0.72, D: 0.55, scrap: 0.25,
}

const GRADES: { value: Grade; label: string; desc: string; color: string; bg: string; border: string }[] = [
  { value: 'A', label: 'A级', desc: '9成新以上，无功能问题', color: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500/40' },
  { value: 'B', label: 'B级', desc: '8成新，轻微使用痕迹', color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  { value: 'C', label: 'C级', desc: '6-7成新，有明显磨损', color: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  { value: 'D', label: 'D级', desc: '5成新以下，部分功能异常', color: 'text-orange-300', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  { value: 'scrap', label: '废机', desc: '严重损坏，无维修价值', color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40' },
]

function buildInitialItems(): InspectionItem[] {
  return INSPECTION_CATEGORIES.flatMap((cat) =>
    cat.items.map((name) => ({ category: cat.category, name, result: null as InspectionResult | null, note: '' }))
  )
}

function calcSuggestPrice(estimated: number, grade: Grade, items: InspectionItem[], appearance: number): number {
  const ratio = GRADE_RATIO[grade]
  const base = Math.round(estimated * ratio)
  const fail = items.filter((i) => i.result === 'fail').length
  const pass = items.filter((i) => i.result === 'pass').length
  const total = fail + pass || 1
  const adj1 = Math.max(-0.2, -fail * 0.03)
  const adj2 = (appearance - 7) * 0.01
  const adj3 = total > 0 ? (pass / total - 0.8) * 0.05 : 0
  return Math.max(50, Math.round(base * (1 + adj1 + adj2 + adj3)))
}

type TabKey = 'queue' | 'history'

export default function Inspector() {
  const navigate = useNavigate()
  const { devices, inspectionReports, riskFlags, startInspection, submitInspection, currentDeviceId, setCurrentDevice } = useDeviceStore()
  const [tab, setTab] = useState<TabKey>('queue')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [items, setItems] = useState<InspectionItem[]>(buildInitialItems)
  const [hiddenDefects, setHiddenDefects] = useState<string[]>([])
  const [defectInput, setDefectInput] = useState('')
  const [grade, setGrade] = useState<Grade | null>(null)
  const [gradeReason, setGradeReason] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => new Set(INSPECTION_CATEGORIES.map((c) => c.category)))
  const [submitted, setSubmitted] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<Grade | 'all'>('all')

  useEffect(() => {
    if (currentDeviceId && !selectedId) {
      const d = devices.find(x => x.id === currentDeviceId)
      if (d && (d.status === 'received' || d.status === 'inspecting')) {
        handleSelectDevice(currentDeviceId)
      } else if (d && d.grade) {
        handleSelectDevice(currentDeviceId)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDeviceId, devices])

  const queue = useMemo(
    () => devices.filter((d) => d.status === 'received' || d.status === 'inspecting'),
    [devices]
  )

  const historyList = useMemo(() => {
    const list = devices.filter((d) => d.grade !== null && inspectionReports[d.id])
    if (historyFilter === 'all') return list
    return list.filter((d) => d.grade === historyFilter)
  }, [devices, inspectionReports, historyFilter])

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedId) ?? null,
    [devices, selectedId]
  )

  const selectedRisks = useMemo(() => {
    if (!selectedId) return []
    return riskFlags.filter((r) => r.deviceId === selectedId && r.status !== 'resolved')
  }, [riskFlags, selectedId])

  const checkedCount = useMemo(() => items.filter((i) => i.result !== null).length, [items])
  const failCount = useMemo(() => items.filter((i) => i.result === 'fail').length, [items])

  const suggestedPrice = useMemo(() => {
    if (!grade || !selectedDevice) return null
    return calcSuggestPrice(selectedDevice.estimatedPrice, grade, items, selectedDevice.appearanceScore)
  }, [grade, selectedDevice, items])

  const canSubmit = grade !== null && checkedCount >= 3 && gradeReason.trim().length > 0

  const handleSelectDevice = useCallback((id: string) => {
    const device = devices.find((d) => d.id === id)
    if (!device) return
    setSelectedId(id)
    setCurrentDevice(id)
    const existing = inspectionReports[id]
    if (existing) {
      setItems(existing.items.map((i) => ({ ...i })))
      setHiddenDefects([...existing.hiddenDefects])
      setGrade(device.grade)
      setGradeReason(existing.gradeReason)
    } else {
      setItems(buildInitialItems())
      setHiddenDefects([])
      setGrade(null)
      setGradeReason('')
    }
    setDefectInput('')
    setExpandedCats(new Set(INSPECTION_CATEGORIES.map((c) => c.category)))
    setSubmitted(false)
    if (device.status === 'received') startInspection(id)
  }, [devices, inspectionReports, startInspection, setCurrentDevice])

  const handleResult = useCallback((idx: number, result: InspectionResult) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, result } : item)))
  }, [])

  const handleNote = useCallback((idx: number, note: string) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, note } : item)))
  }, [])

  const toggleCat = useCallback((cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const addDefect = useCallback(() => {
    const trimmed = defectInput.trim()
    if (trimmed) {
      setHiddenDefects((prev) => [...prev, trimmed])
      setDefectInput('')
    }
  }, [defectInput])

  const removeDefect = useCallback((idx: number) => {
    setHiddenDefects((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!selectedId || !grade) return
    const report: InspectionReport = {
      deviceId: selectedId,
      items,
      hiddenDefects,
      gradeReason,
      submittedAt: '',
    }
    submitInspection(selectedId, report, grade)
    setSubmitted(true)
    setTimeout(() => {
      navigate(`/device/${selectedId}?from=inspector&action=inspect_submit`)
    }, 1200)
  }, [selectedId, grade, items, hiddenDefects, gradeReason, submitInspection, navigate])

  useEffect(() => {
    if (selectedDevice && !selectedRisks.some((r) => r.type === 'payment_error' as RiskType)) {
      // no-op placeholder
    }
  }, [selectedDevice, selectedRisks])

  return (
    <div className="flex h-screen gap-4 p-6">
      <div className="w-80 flex-shrink-0 flex flex-col bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <div className="flex border-b border-brand-border">
          <button
            onClick={() => { setTab('queue'); setSelectedId(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors',
              tab === 'queue' ? 'text-brand-accent bg-brand-accent/5 border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            待检测
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-mono', tab === 'queue' ? 'bg-brand-accent/30 text-brand-accent' : 'bg-brand-card text-gray-400')}>
              {queue.length}
            </span>
          </button>
          <button
            onClick={() => { setTab('history'); setSelectedId(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors',
              tab === 'history' ? 'text-brand-accent bg-brand-accent/5 border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <History className="w-3.5 h-3.5" />
            已完成
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-mono', tab === 'history' ? 'bg-brand-accent/30 text-brand-accent' : 'bg-brand-card text-gray-400')}>
              {historyList.length}
            </span>
          </button>
        </div>

        {tab === 'history' && (
          <div className="px-3 py-2 border-b border-brand-border flex items-center gap-2">
            <Filter className="w-3 h-3 text-gray-500" />
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value as Grade | 'all')}
              className="flex-1 bg-brand-card border border-brand-border rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-brand-accent/50"
            >
              <option value="all">全部等级</option>
              <option value="A">A级</option>
              <option value="B">B级</option>
              <option value="C">C级</option>
              <option value="D">D级</option>
              <option value="scrap">废机</option>
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {(tab === 'queue' ? queue : historyList).length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              {tab === 'queue' ? '暂无待检测设备' : '暂无检测历史'}
            </div>
          )}
          {(tab === 'queue' ? queue : historyList).map((d) => {
            const risks = riskFlags.filter((r) => r.deviceId === d.id && r.status !== 'resolved')
            return (
              <button
                key={d.id}
                onClick={() => handleSelectDevice(d.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-brand-border/50 transition-colors relative',
                  selectedId === d.id
                    ? 'bg-brand-accent/10 border-l-2 border-l-brand-accent'
                    : 'hover:bg-brand-card/60'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-200">{d.model}</span>
                  {d.grade ? <GradeBadge grade={d.grade} /> : <StatusBadge status={d.status} />}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 font-mono">{d.id}</span>
                  <span className="text-xs text-gray-500">外观 {d.appearanceScore}/10</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-500">¥{d.estimatedPrice.toLocaleString()}</span>
                  {d.finalPrice !== null && <span className="text-xs text-green-400 font-mono">→¥{d.finalPrice}</span>}
                </div>
                {risks.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    {risks.map((r) => (
                      <div key={r.id} className="flex items-center gap-1">
                        <RiskBadge type={r.type as any} />
                        <RiskSeverityDot severity={r.severity} />
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'history' && (
                  <Link
                    to={`/device/${d.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-3 text-gray-500 hover:text-brand-accent transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedDevice ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {tab === 'queue' ? '请从左侧选择待检测设备' : '请从左侧选择检测记录回看，或切换到待检测开始新检测'}
            </p>
          </div>
        ) : submitted ? (
          <div className="h-full flex flex-col items-center justify-center text-green-400">
            <Check className="w-16 h-16 mb-4" />
            <p className="text-base font-medium">检测报告已提交</p>
            <p className="text-sm text-gray-500 mt-2">即将返回设备详情页...</p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            <div className="bg-gradient-to-r from-brand-accent/15 via-brand-accent/8 to-transparent border-2 border-brand-accent/30 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-accent/20 text-brand-accent rounded text-[10px] font-bold tracking-wide">
                      · 当前检测设备 ·
                    </span>
                    <StatusBadge status={selectedDevice.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-100 truncate">{selectedDevice.brand} {selectedDevice.model}</h2>
                    {selectedDevice.grade && <GradeBadge grade={selectedDevice.grade} size="lg" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">IMEI: {selectedDevice.imei} · {selectedDevice.id}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-gray-400">
                    <span>存储: <span className="text-gray-200">{selectedDevice.storage || '—'}</span></span>
                    <span>颜色: <span className="text-gray-200">{selectedDevice.color || '—'}</span></span>
                    <span>外观: <span className="text-gray-200 font-medium">{selectedDevice.appearanceScore}/10</span></span>
                    <span>预估价: <span className="text-brand-accent font-mono font-semibold">¥{selectedDevice.estimatedPrice.toLocaleString()}</span></span>
                    <span>客户: <span className="text-gray-200">{selectedDevice.customerName}</span></span>
                  </div>
                </div>
                <Link
                  to={`/device/${selectedDevice.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs text-gray-200 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  返回详情
                </Link>
              </div>

              {selectedRisks.length > 0 && (
                <div className="relative mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-red-300 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    风险预警（处理时需重点关注）
                  </div>
                  <div className="space-y-1.5">
                    {selectedRisks.map((r) => (
                      <div key={r.id} className="flex items-start gap-2 text-xs">
                        <RiskBadge type={r.type as any} />
                        <RiskSeverityDot severity={r.severity} />
                        <span className="text-gray-300 flex-1">{r.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-brand-border flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-brand-accent" />
                <h3 className="text-sm font-semibold text-gray-200">功能检测项目</h3>
                <span className="text-xs text-gray-500 ml-auto font-mono">
                  <span className="text-green-400">{items.filter(i => i.result === 'pass').length}✓</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-red-400">{failCount}✗</span>
                  <span className="text-gray-600 mx-1">/</span>
                  {checkedCount}/{items.length}
                </span>
              </div>
              <div className="divide-y divide-brand-border/50">
                {INSPECTION_CATEGORIES.map((cat) => {
                  const catItems = items.filter((i) => i.category === cat.category)
                  const expanded = expandedCats.has(cat.category)
                  const catChecked = catItems.filter((i) => i.result !== null).length
                  const catFail = catItems.filter((i) => i.result === 'fail').length
                  return (
                    <div key={cat.category}>
                      <button
                        onClick={() => toggleCat(cat.category)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-brand-card/40 transition-colors"
                      >
                        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                        <span className="text-sm font-medium text-gray-300">{cat.category}</span>
                        <span className="text-xs text-gray-500 ml-auto font-mono">
                          {catFail > 0 && <span className="text-red-400 mr-2">{catFail}✗</span>}
                          {catChecked}/{catItems.length}
                        </span>
                      </button>
                      {expanded && (
                        <div className="px-4 pb-3 space-y-2">
                          {catItems.map((item) => {
                            const globalIdx = items.indexOf(item)
                            return (
                              <div key={item.name} className="flex items-center gap-3 bg-brand-card/30 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-300 w-28 flex-shrink-0">{item.name}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleResult(globalIdx, 'pass')}
                                    className={cn(
                                      'w-7 h-7 rounded flex items-center justify-center transition-colors',
                                      item.result === 'pass'
                                        ? 'bg-green-500/30 text-green-300 ring-1 ring-green-500/40'
                                        : 'bg-brand-card hover:bg-green-500/20 text-gray-500'
                                    )}
                                    title="通过"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleResult(globalIdx, 'fail')}
                                    className={cn(
                                      'w-7 h-7 rounded flex items-center justify-center transition-colors',
                                      item.result === 'fail'
                                        ? 'bg-red-500/30 text-red-300 ring-1 ring-red-500/40'
                                        : 'bg-brand-card hover:bg-red-500/20 text-gray-500'
                                    )}
                                    title="不通过"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleResult(globalIdx, 'skip')}
                                    className={cn(
                                      'w-7 h-7 rounded flex items-center justify-center transition-colors',
                                      item.result === 'skip'
                                        ? 'bg-gray-500/30 text-gray-300 ring-1 ring-gray-500/40'
                                        : 'bg-brand-card hover:bg-gray-500/20 text-gray-500'
                                    )}
                                    title="跳过"
                                  >
                                    <SkipForward className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={item.note}
                                  onChange={(e) => handleNote(globalIdx, e.target.value)}
                                  placeholder="备注..."
                                  className="flex-1 bg-transparent border border-brand-border/50 rounded px-2 py-1 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50"
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-gray-200">暗病 / 异常记录</h3>
                <span className="text-xs text-gray-500">（有暗病将自动标记争议风险）</span>
              </div>
              <div className="flex gap-2 mb-3">
                <textarea
                  value={defectInput}
                  onChange={(e) => setDefectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      addDefect()
                    }
                  }}
                  placeholder="输入暗病描述后回车添加（如：主板有维修痕迹）"
                  rows={2}
                  className="flex-1 bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 resize-none"
                />
                <button
                  onClick={addDefect}
                  disabled={!defectInput.trim()}
                  className="self-end px-3 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg text-xs font-medium hover:bg-yellow-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  添加
                </button>
              </div>
              {hiddenDefects.length > 0 ? (
                <div className="space-y-1.5">
                  {hiddenDefects.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
                      <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      <span className="text-xs text-yellow-200 flex-1">{d}</span>
                      <button onClick={() => removeDefect(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">未发现暗病</p>
              )}
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-200">等级判定</h3>
                {suggestedPrice !== null && (
                  <div className="ml-auto flex items-center gap-2 text-xs">
                    <span className="text-gray-500">建议价</span>
                    <span className="text-cyan-300 font-mono font-bold text-base">¥{suggestedPrice.toLocaleString()}</span>
                    <span className="text-gray-600">（预估¥{selectedDevice.estimatedPrice} × {GRADE_RATIO[grade!]} + 调整）</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {GRADES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGrade(g.value)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-all',
                      grade === g.value
                        ? cn(g.bg, g.border, 'ring-1 ring-current/30 scale-[1.02]')
                        : 'bg-brand-card border-brand-border text-gray-400 hover:border-brand-border/80'
                    )}
                  >
                    <div className={cn('text-2xl font-bold', grade === g.value ? g.color : 'text-gray-500')}>
                      {g.value === 'scrap' ? '废' : g.value}
                    </div>
                    <div className={cn('text-xs mt-0.5 font-medium', grade === g.value ? g.color : 'text-gray-500')}>
                      {g.label}
                    </div>
                    <div className={cn('text-[10px] mt-1 leading-tight', grade === g.value ? 'text-gray-400' : 'text-gray-600')}>
                      {g.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">判定依据（必填）</h3>
              <textarea
                value={gradeReason}
                onChange={(e) => setGradeReason(e.target.value)}
                placeholder="请详细说明判定该等级的原因，例如：外观9成新，所有功能正常，电池健康度96%，无维修记录..."
                rows={3}
                className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-brand-accent/50 resize-none"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{gradeReason.length} 字</span>
                <span className="flex items-center gap-3">
                  {checkedCount < 3 && <span className="text-yellow-400">· 至少完成 3 项检测（{checkedCount}/3）</span>}
                  {gradeReason.trim().length === 0 && <span className="text-yellow-400">· 请填写判定依据</span>}
                  {grade === null && <span className="text-yellow-400">· 请选择等级</span>}
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-gradient-to-t from-brand-bg via-brand-bg/95 to-transparent">
              <div className="flex items-center justify-between bg-brand-surface border border-brand-border rounded-xl p-3">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">检测进度: <span className="text-gray-200 font-medium">{Math.round(checkedCount / items.length * 100)}%</span></span>
                  {suggestedPrice !== null && (
                    <span className="text-gray-400">建议定价: <span className="text-cyan-300 font-mono font-bold">¥{suggestedPrice.toLocaleString()}</span></span>
                  )}
                  {failCount > 0 && (
                    <span className="text-red-400">{failCount} 项不通过</span>
                  )}
                  {hiddenDefects.length > 0 && (
                    <span className="text-yellow-400">{hiddenDefects.length} 条暗病记录</span>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    'px-8 py-2.5 rounded-xl text-sm font-bold transition-all',
                    canSubmit
                      ? 'bg-brand-accent text-white hover:bg-brand-accent/90 active:scale-[0.99] shadow-lg shadow-brand-accent/20'
                      : 'bg-brand-card text-gray-500 cursor-not-allowed border border-brand-border'
                  )}
                >
                  提交检测报告
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
