import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ClipboardCheck, Search, Upload, CheckCircle2, XCircle, Plus, FileSpreadsheet,
  X, ChevronDown, AlertCircle, Paperclip, Car, Clock, RefreshCcw,
  Filter, ChevronRight, FileText, GripVertical, Eye, UserCircle, AlertOctagon,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useStore } from '@/store'
import type { RectificationStatus, RectificationMaterial } from '@/types'
import { rectificationStatusLabel, formatDateTime, isOverdue, uid, formatDate } from '@/utils/format'

type FilterKey = 'all' | RectificationStatus

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'rejected', label: '被驳回需补录' },
  { key: 'submitted', label: '已提交待审' },
  { key: 'passed', label: '整改合格' },
]

const REJECT_PRESETS = [
  '凭证照片模糊，请重新上传清晰照片',
  '缺少维修厂盖章单据',
  '整改项不完整，仍有不合格项未处理',
  '非指定M站维修记录无效',
  '未上传日期戳，无法确认维修时间',
]

const QUICK_MATERIALS = [
  { name: '维修发票.jpg', type: 'receipt' as const },
  { name: '维修清单.pdf', type: 'receipt' as const },
  { name: '更换零件照片.jpg', type: 'photo' as const },
  { name: '微信沟通截图.png', type: 'screenshot' as const },
  { name: 'M站维修凭证.jpg', type: 'receipt' as const },
  { name: '车主确认截图.png', type: 'screenshot' as const },
]

export default function RectificationPage() {
  const {
    currentUser, vehicles, inspections, rectifications,
    submitRectification, auditRectification, addRectification,
  } = useStore()

  const [searchParams, setSearchParams] = useSearchParams()

  const roleDefault: Record<string, FilterKey> = {
    receiver: 'pending',
    inspector: 'pending',
    auditor: 'submitted',
  }

  const roleVisibleStatuses: Record<string, RectificationStatus[]> = {
    receiver: ['pending', 'rejected', 'submitted', 'passed'],
    auditor: ['submitted', 'rejected', 'passed'],
    inspector: ['pending', 'rejected', 'submitted'],
  }

  const initialFilter = (searchParams.get('status') as FilterKey) || roleDefault[currentUser.role] || 'all'
  const [filter, setFilter] = useState<FilterKey>(initialFilter)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBatchAdd, setShowBatchAdd] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [submitId, setSubmitId] = useState<string | null>(null)
  const [materialList, setMaterialList] = useState<{ name: string; type: RectificationMaterial['type'] }[]>([])
  const [submitDesc, setSubmitDesc] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [batchText, setBatchText] = useState('')

  useEffect(() => {
    const defaultKey = roleDefault[currentUser.role] || 'pending'
    searchParams.delete('status')
    setSearchParams(searchParams, { replace: true })
    setFilter(defaultKey)
  }, [currentUser.id])

  useEffect(() => {
    const urlStatus = searchParams.get('status') as FilterKey | null
    const target = urlStatus || roleDefault[currentUser.role] || 'all'
    setFilter(prev => (prev === target ? prev : target))
  }, [searchParams])

  useEffect(() => {
    const shouldDelete = filter === roleDefault[currentUser.role] || filter === 'all'
    const currentUrl = searchParams.get('status')
    if (shouldDelete) {
      if (currentUrl) {
        searchParams.delete('status')
        setSearchParams(searchParams, { replace: true })
      }
    } else {
      if (currentUrl !== filter) {
        searchParams.set('status', filter)
        setSearchParams(searchParams, { replace: true })
      }
    }
  }, [filter])

  const visibleStatuses = roleVisibleStatuses[currentUser.role] || []

  const roleQueueLabel = useMemo(() => {
    if (currentUser.role === 'receiver') return { title: '我的整改任务', sub: '只显示分配给你的待提交/被驳回整改' }
    if (currentUser.role === 'auditor') return { title: '审核工作台', sub: '待审核、已驳回、已通过的整改记录' }
    return { title: '需跟进整改', sub: '待处理/被驳回/已提交的整改，便于现场跟进进度' }
  }, [currentUser])

  const list = useMemo(() => {
    return rectifications
      .filter(r => {
        if (currentUser.role === 'receiver' && r.handlerId !== currentUser.id) return false
        if (!visibleStatuses.includes(r.status)) return false
        if (filter !== 'all' && r.status !== filter) return false
        if (keyword.trim()) {
          const v = vehicles.find(x => x.id === r.vehicleId)
          const kw = keyword.trim().toLowerCase()
          if (!v?.plateNumber.toLowerCase().includes(kw) &&
              !(r.description || '').toLowerCase().includes(kw)) return false
        }
        return true
      })
      .sort((a, b) => {
        const order: Record<string, number> = { rejected: 0, pending: 1, submitted: 2, passed: 3 }
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
  }, [rectifications, filter, keyword, vehicles, currentUser, visibleStatuses])

  const allCounts = useMemo(() => {
    const base = rectifications.filter(r => {
      if (currentUser.role === 'receiver' && r.handlerId !== currentUser.id) return false
      return visibleStatuses.includes(r.status)
    })
    return {
      all: base.length,
      pending: base.filter(r => r.status === 'pending').length,
      rejected: base.filter(r => r.status === 'rejected').length,
      submitted: base.filter(r => r.status === 'submitted').length,
      passed: base.filter(r => r.status === 'passed').length,
    }
  }, [rectifications, currentUser, visibleStatuses])

  const queueStats = useMemo(() => {
    if (currentUser.role === 'receiver') {
      const mine = rectifications.filter(r => r.handlerId === currentUser.id)
      return [
        { label: '我待提交', value: mine.filter(r => r.status === 'pending').length, tone: 'warn' as const },
        { label: '我被驳回', value: mine.filter(r => r.status === 'rejected').length, tone: mine.some(r => r.status === 'rejected') ? 'danger' as const : 'safe' as const },
        { label: '我已通过', value: mine.filter(r => r.status === 'passed').length, tone: 'safe' as const },
      ]
    }
    if (currentUser.role === 'auditor') {
      return [
        { label: '待审核', value: allCounts.submitted, tone: allCounts.submitted > 0 ? 'info' as const : 'safe' as const },
        { label: '已驳回待补录', value: allCounts.rejected, tone: allCounts.rejected > 0 ? 'danger' as const : 'safe' as const },
        { label: '今日已通过', value: rectifications.filter(r => r.status === 'passed' && r.auditedAt?.startsWith(new Date().toISOString().slice(0, 10))).length, tone: 'safe' as const },
      ]
    }
    return [
      { label: '待处理整改', value: allCounts.pending, tone: 'warn' as const },
      { label: '被驳回需重跟', value: allCounts.rejected, tone: allCounts.rejected > 0 ? 'danger' as const : 'safe' as const },
      { label: '已提交待审', value: allCounts.submitted, tone: allCounts.submitted > 0 ? 'info' as const : 'safe' as const },
    ]
  }, [rectifications, allCounts, currentUser])

  const visibleFilterOptions = useMemo(() => {
    return [
      { key: 'all' as const, label: '全部' },
      ...filterOptions
        .filter(o => o.key !== 'all' && visibleStatuses.includes(o.key as RectificationStatus)),
    ]
  }, [visibleStatuses])

  const emptyStateConfig = useMemo(() => {
    const map: Record<string, { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; action?: string; actionTo?: string }> = {
      receiver_pending: { icon: ClipboardCheck, title: '暂无待提交整改', desc: '你当前没有需要处理的整改任务，真棒！' },
      receiver_rejected: { icon: RefreshCcw, title: '没有被驳回的整改', desc: '所有整改都已一次性通过或无待办。' },
      receiver_submitted: { icon: CheckCircle2, title: '暂无可查看的已提交', desc: '先去"待处理"提交整改吧。' },
      receiver_passed: { icon: UserCircle, title: '暂无已通过记录', desc: '继续努力，完成更多整改！' },
      receiver_all: { icon: UserCircle, title: '你还没有整改任务', desc: '等待调度分配或联系审核员。' },
      auditor_submitted: { icon: ClipboardCheck, title: '暂无待审核整改', desc: '所有整改已审核完毕，状态良好！', action: '去安排复检', actionTo: '/reinspection?tab=pending' },
      auditor_rejected: { icon: AlertOctagon, title: '暂无需补录项', desc: '没有被驳回的整改，很棒。', action: '查看待审核', actionTo: '/rectification?status=submitted' },
      auditor_passed: { icon: CheckCircle2, title: '暂无已通过记录', desc: '开始今天的审核工作吧。', action: '待审核整改', actionTo: '/rectification?status=submitted' },
      auditor_all: { icon: UserCircle, title: '暂无审核相关整改', desc: '等待接车员提交整改材料进入审核流程。' },
      inspector_pending: { icon: Clock, title: '暂无待处理整改', desc: '现场车况良好，没有待跟进的不合格项。' },
      inspector_rejected: { icon: RefreshCcw, title: '没有被驳回的整改', desc: '接车员提交的材料质量不错。' },
      inspector_submitted: { icon: CheckCircle2, title: '暂无已提交整改', desc: '等待接车员补充材料后进入审核。' },
      inspector_all: { icon: UserCircle, title: '暂无需跟进整改', desc: '今日检测全部合格，没有需要跟进的不合格项。' },
    }
    return map[`${currentUser.role}_${filter}`] || map[`${currentUser.role}_all`]
  }, [currentUser, filter])

  const toggleSel = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  const toggleSelAll = () => {
    if (selected.size === list.length) setSelected(new Set())
    else setSelected(new Set(list.map(r => r.id)))
  }

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const canAudit = currentUser.role === 'auditor'
  const canSubmit = currentUser.role === 'receiver'
  const canCreate = currentUser.role === 'receiver' || currentUser.role === 'inspector'

  const submittedForAudit = useMemo(() =>
    list.filter(r => r.status === 'submitted').length,
  [list])
  const allAuditSelected = useMemo(() => {
    const arr = Array.from(selected)
    if (arr.length === 0) return false
    return arr.every(id => {
      const r = rectifications.find(x => x.id === id)
      return r?.status === 'submitted'
    })
  }, [selected, rectifications])

  const openSubmit = (id: string) => {
    setSubmitId(id); setMaterialList([]); setSubmitDesc('')
    const target = rectifications.find(r => r.id === id)
    if (target && target.status === 'rejected' && target.latestRejectReason) {
      setSubmitDesc(`针对驳回原因的补录说明`)
    }
  }

  const addQuickMaterial = (name: string, type: RectificationMaterial['type']) => {
    const count = materialList.filter(m => m.name.includes(name.replace(/\.[^.]+$/, ''))).length
    const finalName = count > 0
      ? name.replace(/(\.[^.]+)$/, `_${count + 1}$1`)
      : name
    setMaterialList(list => [...list, { name: finalName, type }])
  }

  const doSubmit = () => {
    if (!submitId || materialList.length === 0) return
    const user = useStore.getState().currentUser
    const now = new Date().toISOString()
    const materials: RectificationMaterial[] = materialList.map(m => ({
      ...m, uploadedAt: now, uploadedBy: user.name,
    }))
    submitRectification(submitId, materials, submitDesc || undefined)
    setSubmitId(null)
  }

  const doReject = () => {
    if (!rejectId || !rejectReason.trim()) return
    auditRectification(rejectId, false, rejectReason.trim())
    setRejectId(null); setRejectReason('')
  }

  const doPass = (id: string) => {
    auditRectification(id, true)
  }

  const doBatchPass = () => {
    const ids = Array.from(selected).filter(id => {
      const r = rectifications.find(x => x.id === id)
      return r?.status === 'submitted'
    })
    ids.forEach(id => auditRectification(id, true))
    setSelected(new Set())
  }

  const doBatchReject = () => {
    if (selected.size === 0) return
    const first = Array.from(selected)[0]
    setRejectId(first)
    setRejectReason('')
  }

  const doBatchAdd = () => {
    if (!batchText.trim()) return
    const lines = batchText.trim().split('\n').filter(l => l.trim())
    lines.forEach(line => {
      const cols = line.split(/\t|,|，/).map(s => s.trim())
      const plate = cols[0] || '未录入车牌'
      const desc = cols[1] || '批量录入整改任务'
      const deadlineDays = parseInt(cols[2] || '3')
      let v = vehicles.find(x => x.plateNumber === plate)
      const vehicleId = v?.id || uid('v_')
      if (!v) {
        v = {
          id: vehicleId, plateNumber: plate,
          vehicleType: 'sedan', vehicleTypeLabel: '未分类',
          ownerName: '未录入', ownerPhone: '-',
          firstRegisterDate: new Date().toISOString().slice(0, 10),
          vin: '-',
        }
        useStore.setState(s => ({ vehicles: [v!, ...s.vehicles] }))
      }
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + deadlineDays)
      addRectification({
        inspectionId: uid('bi_'),
        vehicleId,
        status: 'pending',
        deadline: deadline.toISOString(),
        handlerId: currentUser.role === 'receiver' ? currentUser.id : 'receiver_default',
        handlerName: currentUser.role === 'receiver' ? currentUser.name : '待分配',
        description: desc,
      })
    })
    setBatchText(''); setShowBatchAdd(false)
  }

  const statusChip = (s: RectificationStatus) => {
    const cls: Record<RectificationStatus, string> = {
      pending: 'chip-pending', rejected: 'chip-rejected',
      submitted: 'chip-submitted', passed: 'chip-passed',
    }
    return <span className={cls[s]}>{rectificationStatusLabel[s]}</span>
  }

  const EmptyIcon = emptyStateConfig.icon

  return (
    <div>
      <PageHeader
        title={`不合格整改 · ${roleQueueLabel.title}`}
        subtitle={roleQueueLabel.sub}
        stats={queueStats}
        actions={<>
          {canCreate && (
            <button className="btn-ghost" onClick={() => setShowBatchAdd(true)}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> 批量录入
            </button>
          )}
          {canAudit && allAuditSelected && selected.size > 1 && (
            <button className="btn-safe" onClick={doBatchPass}>
              <CheckCircle2 className="w-3.5 h-3.5" /> 批量通过 ({selected.size})
            </button>
          )}
        </>}
      />

      <div className="px-5 py-3 border-b border-ink-700/50 flex items-center gap-3 flex-wrap bg-ink-800/30">
        <div className="flex items-center rounded-sm border border-ink-600 overflow-hidden">
          {visibleFilterOptions.map(opt => (
            <button key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                filter === opt.key ? 'bg-info-500/15 text-info-400' : 'text-ink-300 hover:bg-ink-700'
              }`}>
              {opt.label}
              <span className="ml-1 text-[10px] text-ink-400">({allCounts[opt.key as keyof typeof allCounts]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="搜索车牌号 / 整改描述..."
            className="input w-full pl-8" />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-ink-400">
          <Filter className="w-3 h-3" /> 已选 {selected.size} 项
          {canAudit && submittedForAudit > 0 && (
            <span className="ml-2 text-info-400">（{submittedForAudit} 项待审核）</span>
          )}
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="th w-8">
                    <input type="checkbox" checked={selected.size === list.length && list.length > 0}
                      onChange={toggleSelAll}
                      className="accent-info-500" />
                  </th>
                  <th className="th w-8"></th>
                  <th className="th w-28">车牌号</th>
                  <th className="th w-20">车型</th>
                  <th className="th min-w-[200px]">整改 / 不合格项</th>
                  <th className="th w-24">状态</th>
                  <th className="th w-28">截止日期</th>
                  <th className="th w-16">驳回</th>
                  <th className="th w-16">补录</th>
                  <th className="th w-24">{currentUser.role === 'receiver' ? '本人' : '处理人'}</th>
                  <th className="th w-72 text-right pr-4">常用动作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <EmptyIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-ink-400" />
                      <div className="text-xs text-ink-200 font-medium">{emptyStateConfig.title}</div>
                      <div className="text-[11px] text-ink-500 mt-1">{emptyStateConfig.desc}</div>
                      {canCreate && currentUser.role === 'receiver' && (filter === 'pending' || filter === 'all') && (
                        <button onClick={() => setShowBatchAdd(true)}
                          className="mt-4 text-[11px] px-3 py-1.5 rounded-sm border border-info-500/40 text-info-400 hover:bg-info-500/10">
                          <Plus className="w-3 h-3 inline mr-0.5" /> 新增整改任务
                        </button>
                      )}
                      {emptyStateConfig.action && emptyStateConfig.actionTo && (
                        <Link to={emptyStateConfig.actionTo}
                          className="mt-4 inline-flex text-[11px] px-3 py-1.5 rounded-sm border border-info-500/40 text-info-400 hover:bg-info-500/10">
                          <ChevronRight className="w-3 h-3 inline mr-0.5" /> {emptyStateConfig.action}
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : list.map(r => {
                  const v = vehicles.find(x => x.id === r.vehicleId)
                  const ins = inspections.find(x => x.id === r.inspectionId)
                  const overdue = isOverdue(r.deadline) && (r.status === 'pending' || r.status === 'rejected')
                  const expanded = expandedRows.has(r.id)
                  const hasHistory = r.rejectHistory.length > 0 || r.supplementHistory.length > 1
                  return (
                    <>
                      <tr key={r.id} className={`hover:bg-ink-700/30 transition-colors ${
                        r.status === 'rejected' ? 'bg-danger-500/5' : ''
                      } ${overdue ? 'border-l-2 border-l-danger-500' : ''}`}>
                        <td className="td">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)}
                            className="accent-info-500" />
                        </td>
                        <td className="td px-1">
                          {hasHistory && (
                            <button onClick={() => toggleExpand(r.id)}
                              className="w-5 h-5 flex items-center justify-center text-ink-400 hover:text-info-400 hover:bg-ink-700 rounded-sm">
                              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <GripVertical className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                        <td className="td">
                          <Link to={`/vehicle/${r.vehicleId}`} className="inline-flex items-center gap-1 font-mono text-ink-100 hover:text-info-400 font-bold">
                            <Car className="w-3 h-3 text-ink-400" />
                            {v?.plateNumber || '—'}
                          </Link>
                        </td>
                        <td className="td text-ink-300">{v?.vehicleTypeLabel || '—'}</td>
                        <td className="td">
                          <div className="text-ink-100">{r.description || '—'}</div>
                          {ins && ins.defectItems.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {ins.defectItems.slice(0, 3).map(d => (
                                <span key={d.code} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-300">
                                  {d.name}
                                </span>
                              ))}
                              {ins.defectItems.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-400">
                                  +{ins.defectItems.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          {r.status === 'rejected' && r.latestRejectReason && (
                            <div className="mt-1.5 p-1.5 bg-danger-500/10 border border-danger-500/20 rounded-sm">
                              <div className="flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 text-danger-400 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-[10px] text-danger-400 font-bold">驳回原因：</div>
                                  <div className="text-[11px] text-danger-300 leading-snug">{r.latestRejectReason}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="td">
                          <div className="flex flex-wrap items-center gap-1">
                            {statusChip(r.status)}
                            {overdue && <span className="chip-abnormal">超期</span>}
                          </div>
                        </td>
                        <td className="td">
                          <div className={`flex items-center gap-1 ${overdue ? 'text-danger-400 font-bold' : 'text-ink-200'}`}>
                            <Clock className="w-3 h-3 text-ink-400" />
                            {formatDate(r.deadline)}
                          </div>
                        </td>
                        <td className="td">
                          <span className={r.rejectCount >= 2 ? 'text-danger-400 font-bold' : r.rejectCount > 0 ? 'text-warn-400 font-bold' : 'text-ink-400'}>
                            {r.rejectCount > 0 ? `${r.rejectCount} 次` : '—'}
                          </span>
                        </td>
                        <td className="td">
                          <span className={r.supplementHistory.length > 1 ? 'text-info-400 font-bold' : 'text-ink-400'}>
                            {r.supplementHistory.length > 0 ? `${r.supplementHistory.length} 次` : '—'}
                          </span>
                        </td>
                        <td className="td text-ink-300">
                          {r.handlerId === currentUser.id
                            ? <span className="text-info-300 font-medium">我</span>
                            : r.handlerName}
                        </td>
                        <td className="td text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {hasHistory && (
                              <button onClick={() => toggleExpand(r.id)}
                                className="btn-ghost py-1 px-2 text-[11px]">
                                <Eye className="w-3 h-3" /> {expanded ? '收起' : '历史'}
                              </button>
                            )}
                            <Link to={`/vehicle/${r.vehicleId}`} className="btn-ghost py-1 px-2 text-[11px]">
                              详情
                            </Link>
                            {canSubmit && (r.status === 'pending' || r.status === 'rejected') && (
                              <button onClick={() => openSubmit(r.id)} className={`py-1 px-2 text-[11px] ${
                                r.status === 'rejected' ? 'btn-warn' : 'btn-primary'
                              }`}>
                                <Upload className="w-3 h-3" /> {r.status === 'rejected' ? '补录' : '提交'}
                              </button>
                            )}
                            {canAudit && r.status === 'submitted' && (
                              <>
                                <button onClick={() => doPass(r.id)}
                                  className="btn-safe py-1 px-2 text-[11px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> 通过
                                </button>
                                <button onClick={() => { setRejectId(r.id); setRejectReason('') }}
                                  className="btn-danger py-1 px-2 text-[11px]">
                                  <XCircle className="w-3 h-3" /> 驳回
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && hasHistory && (
                        <tr key={`${r.id}_exp`} className="bg-ink-700/20">
                          <td colSpan={2}></td>
                          <td colSpan={9} className="td">
                            <div className="grid grid-cols-2 gap-4 p-2">
                              {r.rejectHistory.length > 0 && (
                                <div className="border border-danger-500/20 rounded-sm p-3 bg-danger-500/5">
                                  <div className="flex items-center gap-1 mb-2">
                                    <XCircle className="w-3.5 h-3.5 text-danger-400" />
                                    <h4 className="text-xs font-bold text-danger-400">驳回历史（{r.rejectHistory.length} 次）</h4>
                                  </div>
                                  <ul className="space-y-2">
                                    {r.rejectHistory.map((rej, idx) => (
                                      <li key={rej.id} className="border-l-2 border-danger-500/40 pl-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-danger-400">第 {idx + 1} 次</span>
                                          <span className="text-[10px] text-ink-400">{formatDateTime(rej.timestamp)}</span>
                                          <span className="text-[10px] text-ink-300">{rej.auditorName}</span>
                                        </div>
                                        <div className="text-[11px] text-ink-200 mt-0.5 leading-snug">{rej.reason}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {r.supplementHistory.length > 0 && (
                                <div className="border border-info-500/20 rounded-sm p-3 bg-info-500/5">
                                  <div className="flex items-center gap-1 mb-2">
                                    <RefreshCcw className="w-3.5 h-3.5 text-info-400" />
                                    <h4 className="text-xs font-bold text-info-400">提交/补录历史（{r.supplementHistory.length} 次）</h4>
                                  </div>
                                  <ul className="space-y-2">
                                    {r.supplementHistory.map((sup, idx) => (
                                      <li key={sup.id} className="border-l-2 border-info-500/40 pl-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-info-400">第 {idx + 1} 次</span>
                                          <span className="text-[10px] text-ink-400">{formatDateTime(sup.timestamp)}</span>
                                          <span className="text-[10px] text-ink-300">{sup.handlerName}</span>
                                        </div>
                                        {sup.description && (
                                          <div className="text-[11px] text-ink-200 mt-0.5">{sup.description}</div>
                                        )}
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {sup.materials.map((m, i) => (
                                            <span key={i} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-300">
                                              <Paperclip className="w-2.5 h-2.5" /> {m.name}
                                            </span>
                                          ))}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-[10px] text-ink-500 mt-2">
          {currentUser.role === 'receiver'
            ? '提示：被驳回的记录带醒目背景和原因，点击「补录」可直接上传新材料。'
            : currentUser.role === 'auditor'
              ? '提示：只展示进入审核流程的整改（待审核/已驳回/已通过）。点击「通过/驳回」直接处理，多选可批量通过。'
              : '提示：只展示需跟进的整改（待处理/被驳回/已提交），便于现场跟进不合格项整改进度。'}
        </p>
      </div>

      {submitId && (
        <Modal title={rectifications.find(r => r.id === submitId)?.status === 'rejected' ? '补录整改材料' : '提交整改材料'}
          onClose={() => setSubmitId(null)}>
          <div className="space-y-3">
            <div>
              <div className="text-[11px] text-ink-400 mb-1">当前车辆及整改任务</div>
              <div className="text-xs text-ink-100 font-medium">
                {vehicles.find(v => v.id === rectifications.find(r => r.id === submitId)?.vehicleId)?.plateNumber}
                {' · '}
                {rectifications.find(r => r.id === submitId)?.description}
              </div>
              {rectifications.find(r => r.id === submitId)?.latestRejectReason && (
                <div className="mt-2 p-2 bg-danger-500/10 border border-danger-500/30 rounded-sm">
                  <div className="text-[10px] text-danger-400 font-bold mb-0.5">上次驳回原因（请特别关注，针对性补录）</div>
                  <div className="text-xs text-danger-300">{rectifications.find(r => r.id === submitId)!.latestRejectReason}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] text-ink-300 mb-1">快捷添加常用凭证（一键添加，忙时超省时间）</div>
              <div className="flex flex-wrap gap-1">
                {QUICK_MATERIALS.map(m => (
                  <button key={m.name} onClick={() => addQuickMaterial(m.name, m.type)}
                    className="text-[10px] px-2 py-1 rounded-sm border border-ink-500 text-ink-200 hover:bg-ink-700 hover:border-info-500/50 hover:text-info-300 transition-colors">
                    <Plus className="w-2.5 h-2.5 inline mr-0.5" /> {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-ink-300 mb-1">已添加凭证（至少 1 份） <span className="text-warn-400">共 {materialList.length} 份</span></div>
              {materialList.length === 0 ? (
                <div className="text-[11px] text-ink-500 py-4 text-center border border-dashed border-ink-600 rounded-sm">
                  暂未添加凭证，可点击上方快捷按钮一键添加
                </div>
              ) : (
                <ul className="space-y-1">
                  {materialList.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 px-2 py-1.5 bg-ink-700/40 rounded-sm text-xs">
                      <Paperclip className="w-3 h-3 text-ink-400" />
                      <span className="text-ink-100">{m.name}</span>
                      <span className="text-[10px] text-ink-400 px-1.5 py-0.5 rounded-sm bg-ink-800">
                        {m.type === 'photo' ? '照片' : m.type === 'receipt' ? '单据' : m.type === 'screenshot' ? '截图' : '其他'}
                      </span>
                      <button className="ml-auto text-ink-400 hover:text-danger-400"
                        onClick={() => setMaterialList(list => list.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="text-[11px] text-ink-300 mb-1">补录说明（可选）</div>
              <input value={submitDesc} onChange={e => setSubmitDesc(e.target.value)}
                placeholder="针对驳回的补录说明，如：已前往指定M站维修，更换原厂刹车片"
                className="input w-full" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
              <button onClick={() => setSubmitId(null)} className="btn-ghost">取消</button>
              <button onClick={doSubmit} disabled={materialList.length === 0}
                className="btn-primary disabled:opacity-40 font-bold">
                <Upload className="w-3 h-3" /> 确认提交
              </button>
            </div>
          </div>
        </Modal>
      )}

      {rejectId && (
        <Modal title="驳回整改" onClose={() => { setRejectId(null); setSelected(new Set()) }}>
          <div className="space-y-3">
            <div className="p-2 bg-warn-500/10 border border-warn-500/30 rounded-sm text-[11px] text-warn-300">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              请填写具体驳回原因（不能只写"不合格"），接车员会直接看到并据此补录。
            </div>
            <div>
              <div className="text-[11px] text-ink-300 mb-1">快捷模板（一键填入，忙时首选）</div>
              <div className="flex flex-wrap gap-1">
                {REJECT_PRESETS.map(t => (
                  <button key={t} onClick={() => setRejectReason(t)}
                    className="text-[10px] px-2 py-1 rounded-sm bg-ink-700 text-ink-300 hover:bg-ink-600 hover:text-ink-100 border border-ink-500">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-ink-300 mb-1">驳回原因 <span className="text-danger-400">*</span></div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="示例：照片拍摄角度无法辨认刹车片厚度，请提供维修厂盖章的维修清单与近距离细节照片。"
                className="input w-full resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
              <button onClick={() => { setRejectId(null); setSelected(new Set()) }} className="btn-ghost">取消</button>
              <button onClick={doReject} disabled={!rejectReason.trim()}
                className="btn-danger disabled:opacity-40 font-bold">
                <XCircle className="w-3 h-3" /> 确认驳回
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showBatchAdd && (
        <Modal title="批量录入整改任务" onClose={() => setShowBatchAdd(false)} width={640}>
          <div className="space-y-3">
            <div className="p-2 bg-info-500/10 border border-info-500/30 rounded-sm text-[11px] text-info-300">
              <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1" />
              支持粘贴 Excel 行。每行格式：<code className="font-mono bg-ink-700 px-1.5 py-0.5 rounded-sm">车牌号, 整改描述, 截止天数(可选，默认3)</code>
            </div>
            <textarea
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              rows={10}
              placeholder={`京A·12345, 更换刹车片与左前轮胎, 2\n京B·88888, 尾气CO超标维修\n京C·66666, 前照灯亮度不足, 1`}
              className="input w-full font-mono text-xs2 resize-none"
            />
            <div className="flex justify-between items-center pt-2 border-t border-ink-700">
              <div className="text-[10px] text-ink-400">
                已录入 {batchText.split('\n').filter(l => l.trim()).length} 行
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBatchAdd(false)} className="btn-ghost">取消</button>
                <button onClick={doBatchAdd} disabled={!batchText.trim()}
                  className="btn-primary disabled:opacity-40 font-bold">
                  <Plus className="w-3 h-3" /> 批量生成
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12" onClick={onClose}>
      <div className="card w-full shrink-0 shadow-2xl" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 bg-ink-800/60">
          <ChevronDown className="w-4 h-4 text-info-400" />
          <h3 className="text-sm font-bold text-ink-100">{title}</h3>
          <button onClick={onClose} className="ml-auto text-ink-400 hover:text-ink-100 hover:bg-ink-700 w-6 h-6 flex items-center justify-center rounded-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
