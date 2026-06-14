import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock, Search, AlertTriangle, CheckCircle2, CalendarDays, History,
  X, ChevronDown, AlertOctagon, Clock, Car, UserCheck,
  CalendarX, RotateCcw, GripVertical, Eye, Plus, Calendar, FileSpreadsheet,
  Zap, HandCoins, FileText, FileImage,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useStore } from '@/store'
import type { ReinspectionStatus, DefectItem, ScheduleRecord } from '@/types'
import { reinspectionStatusLabel, formatDateTime, uid } from '@/utils/format'

type TabKey = 'pending' | 'scheduled' | 'completed' | 'abnormal' | 'history'

const LANES = ['1号线', '2号线', '3号线']
const TIME_SLOTS = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
const TODAY = new Date().toISOString().slice(0, 10)
const TOMORROW = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()
const DAY_AFTER = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().slice(0, 10) })()

const CANCEL_PRESETS = [
  '车主临时有事改约',
  '检测线设备维护',
  '车主电话无人接听',
  '车辆未到场，需改期',
]

export default function ReinspectionPage() {
  const {
    currentUser, vehicles, inspections, reinspections,
    scheduleReinspection, cancelReinspectionSchedule, completeReinspection, resolveAbnormal,
  } = useStore()

  const [tab, setTab] = useState<TabKey>('pending')
  const [keyword, setKeyword] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [scheduleIds, setScheduleIds] = useState<string[]>([])
  const [showSchedule, setShowSchedule] = useState(false)
  const [schedDate, setSchedDate] = useState(TODAY)
  const [schedTime, setSchedTime] = useState('09:00')
  const [schedLane, setSchedLane] = useState('1号线')
  const [historyKw, setHistoryKw] = useState('')
  const [abnormalResolveId, setAbnormalResolveId] = useState<string | null>(null)
  const [abnormalResolveText, setAbnormalResolveText] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [completeFailed, setCompleteFailed] = useState<string[]>([])
  const [batchScheduleText, setBatchScheduleText] = useState('')
  const [showBatchSchedule, setShowBatchSchedule] = useState(false)

  const canSchedule = currentUser.role === 'auditor'
  const canComplete = currentUser.role === 'inspector'

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const displayList = useMemo(() => {
    const base = tab === 'history' ? reinspections : reinspections.filter(re => re.status === tab)
    const kw = (tab === 'history' ? historyKw : keyword).trim().toLowerCase()
    if (!kw) return base
    return base.filter(re => {
      const v = vehicles.find(x => x.id === re.vehicleId)
      return v?.plateNumber.toLowerCase().includes(kw)
    })
  }, [reinspections, tab, keyword, historyKw, vehicles])

  const stats = useMemo(() => ({
    pending: reinspections.filter(re => re.status === 'pending').length,
    scheduled: reinspections.filter(re => re.status === 'scheduled').length,
    completed: reinspections.filter(re => re.status === 'completed').length,
    abnormal: reinspections.filter(re => re.status === 'abnormal').length,
  }), [reinspections])

  const statusChip = (s: ReinspectionStatus) => {
    const map: Record<ReinspectionStatus, string> = {
      pending: 'chip-pending', scheduled: 'chip-submitted',
      completed: 'chip-passed', abnormal: 'chip-abnormal', cancelled: 'chip-rejected',
    }
    return <span className={map[s]}>{reinspectionStatusLabel[s]}</span>
  }

  const openBatchSchedule = (ids: string[]) => {
    if (ids.length === 0) return
    setScheduleIds(ids)
    setSchedDate(TODAY)
    setSchedTime('09:00')
    setSchedLane('1号线')
    setShowSchedule(true)
  }

  const openReschedule = (id: string) => {
    setRescheduleId(id)
    const cur = reinspections.find(r => r.id === id)
    if (cur?.scheduledTime) {
      setSchedDate(cur.scheduledTime.slice(0, 10))
      setSchedTime(cur.scheduledTime.slice(11, 16))
    } else {
      setSchedDate(TODAY); setSchedTime('09:00')
    }
    setSchedLane(cur?.lane || '1号线')
    setShowSchedule(true)
  }

  const doSchedule = () => {
    const ids = rescheduleId ? [rescheduleId] : scheduleIds
    if (ids.length === 0) return
    const scheduledTime = new Date(`${schedDate}T${schedTime}:00`).toISOString()
    scheduleReinspection(ids, { scheduledTime, lane: schedLane }, !!rescheduleId)
    setShowSchedule(false)
    setRescheduleId(null)
  }

  const doCancel = () => {
    if (!cancelId || !cancelReason.trim()) return
    cancelReinspectionSchedule(cancelId, cancelReason.trim())
    setCancelId(null); setCancelReason('')
  }

  const doComplete = (pass: boolean) => {
    if (!completeId) return
    const inspection = inspections.find(i => i.id === reinspections.find(r => r.id === completeId)?.inspectionId)
    const failedItems = pass ? [] : inspection?.defectItems.filter(d => completeFailed.includes(d.code)) || []
    completeReinspection(completeId, pass, failedItems)
    setCompleteId(null); setCompleteFailed([])
  }

  const doResolveAbnormal = () => {
    if (!abnormalResolveId || !abnormalResolveText.trim()) return
    resolveAbnormal(abnormalResolveId, abnormalResolveText.trim())
    setAbnormalResolveId(null); setAbnormalResolveText('')
  }

  const doBatchScheduleText = () => {
    if (!batchScheduleText.trim()) return
    const lines = batchScheduleText.trim().split('\n').filter(l => l.trim())
    const today = new Date().toISOString().slice(0, 10)
    const ids: string[] = []
    lines.forEach(line => {
      const cols = line.split(/\t|,|，/).map(s => s.trim())
      const plate = cols[0]
      const date = cols[1] || today
      const time = cols[2] || '09:00'
      const lane = cols[3] || '1号线'
      const v = vehicles.find(x => x.plateNumber === plate)
      const re = reinspections.find(x => {
        const vv = vehicles.find(vvv => vvv.id === x.vehicleId)
        return vv?.plateNumber === plate && (x.status === 'pending' || x.status === 'abnormal')
      })
      if (re) ids.push(re.id)
      else if (v) {
        const newReId = uid('re_')
        useStore.setState(s => ({
          reinspections: [{
            id: newReId, inspectionId: uid('bi_'), vehicleId: v.id,
            status: 'pending', scheduleHistory: [],
          }, ...s.reinspections],
        }))
        ids.push(newReId)
      }
    })
    if (ids.length > 0) {
      const sched = new Date(`${today}T09:00:00`).toISOString()
      scheduleReinspection(ids, { scheduledTime: sched, lane: '1号线' })
    }
    setBatchScheduleText(''); setShowBatchSchedule(false)
  }

  const toggleFailedItem = (code: string) => {
    setCompleteFailed(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const quickSlots = [
    { date: TODAY, label: '今天', time: '10:00', lane: '1号线' },
    { date: TODAY, label: '今天下午', time: '14:00', lane: '2号线' },
    { date: TOMORROW, label: '明天上午', time: '09:30', lane: '1号线' },
    { date: DAY_AFTER, label: '后天', time: '10:00', lane: '3号线' },
  ]

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: 'pending', label: '待安排', icon: Clock, count: stats.pending },
    { key: 'scheduled', label: '已安排', icon: CalendarDays, count: stats.scheduled },
    { key: 'completed', label: '已完成', icon: CheckCircle2, count: stats.completed },
    { key: 'abnormal', label: '异常', icon: AlertOctagon, count: stats.abnormal },
    { key: 'history', label: '历史回看', icon: History },
  ]

  const todayScheduled = reinspections.filter(re => re.status === 'scheduled' && re.scheduledTime?.startsWith(TODAY)).length
  const emptyColSpan = tab === 'abnormal' || tab === 'completed' ? 12 : 11

  return (
    <div>
      <PageHeader
        title="复检安排"
        subtitle="复检调度全流程：安排/改排/取消/完成，所有变更自动生成历史记录可追溯。"
        stats={[
          { label: '待安排', value: stats.pending, tone: 'warn' },
          { label: '今日已安排', value: todayScheduled, tone: 'info' },
          { label: '异常项', value: stats.abnormal, tone: 'danger' },
        ]}
        actions={
          <>
            {canSchedule && (
              <button className="btn-ghost" onClick={() => setShowBatchSchedule(true)}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> 批量录入安排
              </button>
            )}
            {canSchedule && tab === 'pending' && displayList.length > 0 && (
              <button className="btn-primary font-bold" onClick={() => openBatchSchedule(displayList.map(r => r.id))}>
                <Zap className="w-3.5 h-3.5" /> 一键安排全部
              </button>
            )}
          </>
        }
      />

      <div className="px-5 pt-3 flex items-end gap-1 border-b border-ink-700/50">
        {tabs.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          const tabBtnCls = active
            ? 'border-info-500 text-info-400 bg-ink-800/40'
            : 'border-transparent text-ink-400 hover:text-ink-200 hover:bg-ink-800/20'
          const tabChipCls = active
            ? 'bg-info-500/20 text-info-400'
            : 'bg-ink-700 text-ink-300'
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={'flex items-center gap-1.5 px-4 py-2.5 text-xs border-b-2 transition-colors ' + tabBtnCls}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {typeof t.count === 'number' && (
                <span className={'text-[10px] px-1.5 py-0.5 rounded-sm ' + tabChipCls}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
        <div className="ml-auto mb-2">
          {tab === 'history' ? (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={historyKw} onChange={e => setHistoryKw(e.target.value)}
                placeholder="车牌号或流水号..."
                className="input w-full pl-8" />
            </div>
          ) : (
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="搜索车牌号..."
                className="input w-full pl-8" />
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="th w-8"></th>
                  <th className="th w-28">车牌号</th>
                  <th className="th w-20">车型</th>
                  <th className="th min-w-[180px]">不合格项摘要</th>
                  <th className="th w-24">状态</th>
                  <th className="th w-36">安排时间</th>
                  <th className="th w-20">检测线</th>
                  <th className="th w-20">次数</th>
                  <th className="th w-24">安排人</th>
                  {tab === 'abnormal' && <th className="th">异常说明</th>}
                  {tab === 'completed' && <th className="th w-20">结果</th>}
                  <th className="th w-80 text-right pr-4">常用动作</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={emptyColSpan} className="py-16 text-center text-ink-500 text-xs">
                      <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      暂无记录
                    </td>
                  </tr>
                ) : displayList.map(re => {
                  const v = vehicles.find(x => x.id === re.vehicleId)
                  const ins = inspections.find(x => x.id === re.inspectionId)
                  const expanded = expandedRows.has(re.id)
                  const hasHistory = re.scheduleHistory && re.scheduleHistory.length > 0
                  const rowCls = (re.status === 'abnormal' ? 'bg-danger-500/5' : '')
                  return (
                    <>
                      <tr key={re.id} className={'hover:bg-ink-700/30 transition-colors ' + rowCls}>
                        <td className="td px-1">
                          {hasHistory && (
                            <button onClick={() => toggleExpand(re.id)}
                              className="w-5 h-5 flex items-center justify-center text-ink-400 hover:text-info-400 hover:bg-ink-700 rounded-sm">
                              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <GripVertical className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                        <td className="td">
                          <Link to={'/vehicle/' + re.vehicleId} className="inline-flex items-center gap-1 font-mono text-ink-100 hover:text-info-400 font-bold">
                            <Car className="w-3 h-3 text-ink-400" />
                            {v?.plateNumber || '—'}
                          </Link>
                        </td>
                        <td className="td text-ink-300">{v?.vehicleTypeLabel || '—'}</td>
                        <td className="td">
                          {ins && ins.defectItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ins.defectItems.slice(0, 3).map(d => (
                                <span key={d.code} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-300">{d.name}</span>
                              ))}
                              {ins.defectItems.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-400">+{ins.defectItems.length - 3}</span>
                              )}
                            </div>
                          ) : <span className="text-ink-400">—</span>}
                        </td>
                        <td className="td">{statusChip(re.status)}</td>
                        <td className="td text-ink-200 font-mono">
                          {re.scheduledTime ? formatDateTime(re.scheduledTime) : '—'}
                        </td>
                        <td className="td text-ink-300">{re.lane || '—'}</td>
                        <td className="td">
                          {re.scheduleHistory && re.scheduleHistory.length > 0
                            ? <span className="text-info-400 font-bold">{re.scheduleHistory.length}</span>
                            : <span className="text-ink-400">—</span>}
                        </td>
                        <td className="td text-ink-400">{re.arrangedByName || '—'}</td>
                        {tab === 'abnormal' && (
                          <td className="td">
                            <div className="flex items-start gap-1 text-danger-400">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="text-[11px]">{re.abnormalReason || '—'}</span>
                            </div>
                          </td>
                        )}
                        {tab === 'completed' && (
                          <td className="td">
                            {re.result === 'passed' ? <span className="text-safe-400 font-bold">合格</span> :
                              re.result === 'failed' ? <span className="text-danger-400 font-bold">仍不合格</span> :
                                <span className="text-ink-400">—</span>}
                          </td>
                        )}
                        <td className="td text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {hasHistory && (
                              <button onClick={() => toggleExpand(re.id)}
                                className="btn-ghost py-1 px-2 text-[11px]">
                                <Eye className="w-3 h-3" /> {expanded ? '收起' : '回看'}
                              </button>
                            )}
                            <Link to={'/vehicle/' + re.vehicleId} className="btn-ghost py-1 px-2 text-[11px]">详情</Link>
                            {canSchedule && (re.status === 'pending' || re.status === 'abnormal') && (
                              <button onClick={() => openBatchSchedule([re.id])} className="btn-primary py-1 px-2 text-[11px] font-bold">
                                <CalendarDays className="w-3 h-3" /> 安排
                              </button>
                            )}
                            {re.status === 'scheduled' && canSchedule && (
                              <>
                                <button onClick={() => openReschedule(re.id)} className="btn-warn py-1 px-2 text-[11px]">
                                  <RotateCcw className="w-3 h-3" /> 改排
                                </button>
                                <button onClick={() => { setCancelId(re.id); setCancelReason('') }}
                                  className="btn-ghost-warn py-1 px-2 text-[11px]">
                                  <CalendarX className="w-3 h-3" /> 取消
                                </button>
                              </>
                            )}
                            {re.status === 'scheduled' && canComplete && (
                              <button onClick={() => { setCompleteId(re.id); setCompleteFailed([]) }}
                                className="btn-safe py-1 px-2 text-[11px] font-bold">
                                <UserCheck className="w-3 h-3" /> 完成复检
                              </button>
                            )}
                            {re.status === 'abnormal' && canSchedule && (
                              <button onClick={() => { setAbnormalResolveId(re.id); setAbnormalResolveText('') }}
                                className="btn-primary py-1 px-2 text-[11px]">
                                <HandCoins className="w-3 h-3" /> 处理异常
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && hasHistory && (
                        <ExpandedRow key={re.id + '_exp'} re={re} />
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {tab === 'scheduled' && (
          <div className="mt-3 flex items-center gap-4 text-[10px] text-ink-400 flex-wrap">
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> 检测线占用示意：</span>
            {LANES.map(lane => {
              const count = displayList.filter(r => r.lane === lane).length
              const laneCls = count >= 5 ? 'text-warn-400' : 'text-ink-200'
              return (
                <span key={lane} className={'px-2 py-0.5 bg-ink-800 border border-ink-600 rounded-sm ' + laneCls}>
                  {lane} <span className="font-bold">{count}</span>
                </span>
              )
            })}
            <span className="ml-4 text-ink-500">提示：点击「回看」可查看该条目的完整改排/取消历史记录</span>
          </div>
        )}
      </div>

      {showSchedule && (
        <ScheduleModal
          title={rescheduleId ? '改排复检' : '批量安排复检（' + scheduleIds.length + ' 项）'}
          onClose={() => { setShowSchedule(false); setRescheduleId(null) }}
          schedDate={schedDate} schedTime={schedTime} schedLane={schedLane}
          setSchedDate={setSchedDate} setSchedTime={setSchedTime} setSchedLane={setSchedLane}
          quickSlots={quickSlots}
          rescheduleId={rescheduleId} scheduleIds={scheduleIds}
          reinspections={reinspections} vehicles={vehicles}
          onConfirm={doSchedule}
        />
      )}

      {cancelId && (
        <Modal title="取消复检安排" onClose={() => setCancelId(null)}>
          <div className="space-y-3">
            <div className="p-2 bg-warn-500/10 border border-warn-500/30 rounded-sm text-[11px] text-warn-300">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              取消后该记录将转回"待安排"状态，需重新安排。请填写取消原因，车主爽约等信息将被记录在历史中。
            </div>
            <div className="flex flex-wrap gap-1">
              {CANCEL_PRESETS.map(t => (
                <button key={t} onClick={() => setCancelReason(t)}
                  className="text-[10px] px-2 py-1 rounded-sm bg-ink-700 text-ink-300 hover:bg-ink-600 hover:text-ink-100 border border-ink-500">
                  {t}
                </button>
              ))}
            </div>
            <div>
              <div className="text-[11px] text-ink-300 mb-1">取消原因 <span className="text-danger-400">*</span></div>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="如：车主临时有事，要求改到下周"
                className="input w-full resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
              <button onClick={() => setCancelId(null)} className="btn-ghost">取消</button>
              <button onClick={doCancel} disabled={!cancelReason.trim()}
                className="btn-danger disabled:opacity-40 font-bold">
                <CalendarX className="w-3 h-3" /> 确认取消
              </button>
            </div>
          </div>
        </Modal>
      )}

      {completeId && (
        <CompleteModal
          completeId={completeId}
          onClose={() => setCompleteId(null)}
          reinspections={reinspections}
          inspections={inspections}
          vehicles={vehicles}
          completeFailed={completeFailed}
          toggleFailedItem={toggleFailedItem}
          onConfirm={doComplete}
        />
      )}

      {abnormalResolveId && (
        <Modal title="处理复检异常" onClose={() => setAbnormalResolveId(null)}>
          <div className="space-y-3">
            <div className="p-2 bg-danger-500/10 border border-danger-500/30 rounded-sm text-[11px] text-danger-300">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              填写处理说明后，该条记录将转回"待安排"状态。
            </div>
            <textarea
              value={abnormalResolveText}
              onChange={e => setAbnormalResolveText(e.target.value)}
              rows={3}
              placeholder="处理说明，如：已电话联系车主，确认明日上午10点到厂复检"
              className="input w-full resize-none"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
              <button onClick={() => setAbnormalResolveId(null)} className="btn-ghost">取消</button>
              <button onClick={doResolveAbnormal} disabled={!abnormalResolveText.trim()}
                className="btn-primary disabled:opacity-40 font-bold">
                确认处理并转待安排
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showBatchSchedule && (
        <Modal title="批量录入复检安排" onClose={() => setShowBatchSchedule(false)} width={640}>
          <div className="space-y-3">
            <div className="p-2 bg-info-500/10 border border-info-500/30 rounded-sm text-[11px] text-info-300">
              <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1" />
              支持粘贴 Excel 行。每行格式：<code className="font-mono bg-ink-700 px-1.5 py-0.5 rounded-sm">车牌号, 日期(可选), 时间(可选), 检测线(可选)</code>。未指定时默认今天09:00 1号线
            </div>
            <textarea
              value={batchScheduleText}
              onChange={e => setBatchScheduleText(e.target.value)}
              rows={10}
              placeholder={'京A·12345, ' + TODAY + ', 10:00, 1号线\n京B·88888, ' + TOMORROW + ', 14:30, 2号线\n京C·66666'}
              className="input w-full font-mono text-xs2 resize-none"
            />
            <div className="flex justify-between items-center pt-2 border-t border-ink-700">
              <div className="text-[10px] text-ink-400">
                已录入 {batchScheduleText.split('\n').filter(l => l.trim()).length} 行
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBatchSchedule(false)} className="btn-ghost">取消</button>
                <button onClick={doBatchScheduleText} disabled={!batchScheduleText.trim()}
                  className="btn-primary disabled:opacity-40 font-bold">
                  <Plus className="w-3 h-3" /> 批量生成安排
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ExpandedRow({ re }: { re: any }) {
  return (
    <tr className="bg-ink-700/20">
      <td></td>
      <td colSpan={10} className="td">
        <div className="p-3 border border-info-500/20 rounded-sm bg-info-500/5">
          <div className="flex items-center gap-1 mb-2">
            <History className="w-3.5 h-3.5 text-info-400" />
            <h4 className="text-xs font-bold text-info-400">
              安排历史（共 {re.scheduleHistory.length} 次调度）
            </h4>
          </div>
          <div className="relative pl-6">
            <div className="absolute left-[10px] top-1 bottom-1 w-px bg-info-500/30" />
            {re.scheduleHistory.map((sch: ScheduleRecord, idx: number) => {
              const isCancelled = !!sch.cancelReason
              const isLatest = idx === re.scheduleHistory.length - 1 && !sch.cancelReason
              return <ScheduleHistoryNode key={sch.id} sch={sch} idx={idx} isCancelled={isCancelled} isLatest={isLatest} />
            })}
          </div>
        </div>
        {re.resultDetail && <ResultDetailBlock detail={re.resultDetail} />}
      </td>
    </tr>
  )
}

function ScheduleHistoryNode({ sch, idx, isCancelled, isLatest }: {
  sch: ScheduleRecord; idx: number; isCancelled: boolean; isLatest: boolean
}) {
  let nodeIconCls = ''
  let nodeLabelCls = ''
  let label = ''
  if (isCancelled) {
    nodeIconCls = 'bg-danger-500/10 border-danger-500/40 text-danger-400'
    nodeLabelCls = 'text-danger-400'
    label = '已取消'
  } else if (isLatest) {
    nodeIconCls = 'bg-safe-500/10 border-safe-500/40 text-safe-400'
    nodeLabelCls = 'text-safe-400'
    label = '当前'
  } else {
    nodeIconCls = 'bg-info-500/10 border-info-500/40 text-info-400'
    nodeLabelCls = 'text-info-400'
    label = '第 ' + (idx + 1) + ' 次'
  }
  return (
    <div className="relative pb-3 last:pb-0">
      <span className={'absolute -left-[14px] top-1 w-5 h-5 rounded-sm flex items-center justify-center border ' + nodeIconCls}>
        {isCancelled ? <CalendarX className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={'text-[10px] font-bold ' + nodeLabelCls}>{label}</span>
        <span className="text-[11px] font-mono text-ink-200 font-bold">
          {formatDateTime(sch.scheduledTime)} · {sch.lane}
        </span>
        <span className="text-[10px] text-ink-400">
          {sch.arrangedByName} · {formatDateTime(sch.timestamp)}
        </span>
      </div>
      {sch.cancelReason && (
        <div className="mt-0.5 text-[11px] text-danger-300 pl-2 border-l-2 border-danger-500/40 mt-1">
          取消原因：{sch.cancelReason}
          {sch.cancelledAt && <span className="text-ink-400 ml-2">({formatDateTime(sch.cancelledAt)})</span>}
        </div>
      )}
    </div>
  )
}

function ResultDetailBlock({ detail }: { detail: any }) {
  return (
    <div className="mt-3 p-3 border border-safe-500/20 rounded-sm bg-safe-500/5">
      <div className="flex items-center gap-1 mb-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-safe-400" />
        <h4 className="text-xs font-bold text-safe-400">复检结果明细</h4>
        <span className="text-[10px] text-ink-400 ml-auto">
          {detail.completedBy} · {formatDateTime(detail.completedAt)}
        </span>
      </div>
      {detail.passedItems.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] text-safe-400 mb-1">已整改合格（{detail.passedItems.length} 项）</div>
          <div className="flex flex-wrap gap-1">
            {detail.passedItems.map((name: string, i: number) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-safe-500/10 text-safe-400 border border-safe-500/30">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
      {detail.failedItems.length > 0 && (
        <div>
          <div className="text-[10px] text-danger-400 mb-1">仍不合格（{detail.failedItems.length} 项）</div>
          <div className="flex flex-wrap gap-1">
            {detail.failedItems.map((d: DefectItem) => (
              <span key={d.code} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-danger-500/10 text-danger-400 border border-danger-500/30">
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleModal({ title, onClose, schedDate, schedTime, schedLane, setSchedDate, setSchedTime, setSchedLane, quickSlots, rescheduleId, scheduleIds, reinspections, vehicles, onConfirm }: {
  title: string; onClose: () => void;
  schedDate: string; schedTime: string; schedLane: string;
  setSchedDate: (v: string) => void; setSchedTime: (v: string) => void; setSchedLane: (v: string) => void;
  quickSlots: any[]; rescheduleId: string | null; scheduleIds: string[];
  reinspections: any[]; vehicles: any[]; onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-[11px] text-ink-300 mb-1">快速时段（一键填入，忙时首选）</div>
          <div className="flex flex-wrap gap-1">
            {quickSlots.map(s => {
              const isActive = schedDate === s.date && schedTime === s.time && schedLane === s.lane
              const slotCls = isActive
                ? 'bg-info-500/20 border-info-500/50 text-info-400'
                : 'bg-ink-700 border-ink-500 text-ink-200 hover:bg-ink-600'
              return (
                <button key={s.label} onClick={() => { setSchedDate(s.date); setSchedTime(s.time); setSchedLane(s.lane) }}
                  className={'text-[10px] px-2 py-1 rounded-sm border transition-colors ' + slotCls}>
                  <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                  {s.label} {s.time} {s.lane}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] text-ink-300 mb-1">日期</div>
            <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
              className="input w-full" />
          </div>
          <div>
            <div className="text-[11px] text-ink-300 mb-1">时间</div>
            <select value={schedTime} onChange={e => setSchedTime(e.target.value)} className="select w-full">
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[11px] text-ink-300 mb-1">检测线</div>
            <select value={schedLane} onChange={e => setSchedLane(e.target.value)} className="select w-full">
              {LANES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="p-2 bg-ink-700/40 rounded-sm max-h-32 overflow-auto">
          <div className="text-[10px] text-ink-400 mb-1">
            {rescheduleId ? '即将改排以下车辆：' : '即将安排以下车辆：'}
          </div>
          <div className="space-y-0.5">
            {(rescheduleId ? [rescheduleId] : scheduleIds).map(id => {
              const re = reinspections.find(r => r.id === id)
              const v = vehicles.find(x => x.id === re?.vehicleId)
              return <div key={id} className="text-xs text-ink-200 font-mono">{v?.plateNumber || id}</div>
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={onConfirm} className="btn-primary font-bold">
            <CalendarDays className="w-3 h-3" /> 确认{rescheduleId ? '改排' : '安排'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function CompleteModal({ completeId, onClose, reinspections, inspections, vehicles, completeFailed, toggleFailedItem, onConfirm }: {
  completeId: string; onClose: () => void;
  reinspections: any[]; inspections: any[]; vehicles: any[];
  completeFailed: string[]; toggleFailedItem: (c: string) => void;
  onConfirm: (p: boolean) => void;
}) {
  const re = reinspections.find(r => r.id === completeId)
  const inspection = inspections.find(i => i.id === re?.inspectionId)
  const v = vehicles.find(x => x.id === re?.vehicleId)
  const btnCls = completeFailed.length === 0 ? 'btn-safe font-bold' : 'btn-warn font-bold'
  return (
    <Modal title={'完成复检 - ' + (v?.plateNumber || '')} onClose={onClose}>
      <div className="space-y-3">
        {inspection && inspection.defectItems.length > 0 && (
          <div className="p-2 bg-ink-700/40 rounded-sm">
            <div className="text-[11px] text-ink-300 mb-2">勾选仍然不合格的项目（留空表示全部合格）</div>
            <div className="space-y-1">
              {inspection.defectItems.map((d: DefectItem) => (
                <label key={d.code} className="flex items-start gap-2 px-2 py-1.5 rounded-sm hover:bg-ink-700 cursor-pointer">
                  <input type="checkbox" checked={completeFailed.includes(d.code)}
                    onChange={() => toggleFailedItem(d.code)}
                    className="accent-danger-500" />
                  <div>
                    <div className="text-[11px] text-ink-100 font-medium">{d.name}</div>
                    <div className="text-[10px] text-ink-400">{d.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-ink-700">
          <div className="text-[10px] text-ink-400">
            已勾选 {completeFailed.length} 项不合格
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">取消</button>
            <button onClick={() => onConfirm(completeFailed.length === 0)}
              className={btnCls}>
              {completeFailed.length === 0
                ? <><CheckCircle2 className="w-3 h-3" /> 全部合格</>
                : <><AlertTriangle className="w-3 h-3" /> 确认仍有 {completeFailed.length} 项不合格</>
              }
            </button>
          </div>
        </div>
      </div>
    </Modal>
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
