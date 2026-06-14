import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Car, User, Phone, Calendar, Hash, FileText, FileImage, Paperclip,
  ArrowLeft, AlertCircle, Clock, CheckCircle2, XCircle, XSquare,
  AlertTriangle, CalendarDays, CalendarX, RotateCcw, RefreshCcw, UserCheck,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Timeline from '@/components/Timeline'
import { useStore, useVehicleLogs } from '@/store'
import { formatDateTime, rectificationStatusLabel, reinspectionStatusLabel } from '@/utils/format'
import type { Rectification, Reinspection } from '@/types'

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const vehicle = useStore(s => s.vehicles.find(v => v.id === id))
  const inspections = useStore(s => s.inspections.filter(i => i.vehicleId === id))
  const rectifications = useStore(s => s.rectifications.filter(r => r.vehicleId === id))
  const reinspections = useStore(s => s.reinspections.filter(re => re.vehicleId === id))
  const logs = useVehicleLogs(id || '')

  const latestInspection = useMemo(() =>
    [...inspections].sort((a, b) => b.inspectTime.localeCompare(a.inspectTime))[0],
    [inspections])
  const latestRect = useMemo(() =>
    [...rectifications].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0],
    [rectifications])
  const latestRe = useMemo(() =>
    [...reinspections].sort((a, b) => (b.arrangedAt || '').localeCompare(a.arrangedAt || ''))[0],
    [reinspections])

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="未找到该车辆" subtitle="" actions={<Link to="/" className="btn-ghost"><ArrowLeft className="w-3.5 h-3.5" /> 返回</Link>} />
        <div className="p-10 text-center text-ink-500 text-sm">车辆 ID 不存在</div>
      </div>
    )
  }

  const rectChipCls = (s: string) => ({
    pending: 'chip-pending', rejected: 'chip-rejected',
    submitted: 'chip-submitted', passed: 'chip-passed',
  }[s] || 'chip-pending')
  const reChipCls = (s: string) => ({
    pending: 'chip-pending', scheduled: 'chip-submitted',
    completed: 'chip-passed', abnormal: 'chip-abnormal', cancelled: 'chip-rejected',
  }[s] || 'chip-pending')

  return (
    <div>
      <PageHeader
        title={`${vehicle.plateNumber} · 车辆详情`}
        subtitle={`${vehicle.vehicleTypeLabel} · ${vehicle.ownerName}`}
        actions={<Link to="/" className="btn-ghost"><ArrowLeft className="w-3.5 h-3.5" /> 返回首页</Link>}
      />

      <div className="p-5 grid grid-cols-12 gap-4">
        {/* 左侧档案 */}
        <section className="col-span-4 space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-bold text-ink-100 flex items-center gap-1.5 mb-3">
              <Car className="w-4 h-4 text-info-400" /> 车辆档案
            </h3>
            <dl className="space-y-2 text-xs">
              <Row icon={Car} label="车牌号" value={<span className="font-mono text-ink-100">{vehicle.plateNumber}</span>} />
              <Row icon={FileText} label="车辆类型" value={vehicle.vehicleTypeLabel} />
              <Row icon={Hash} label="车架号" value={<span className="font-mono text-[11px] text-ink-300">{vehicle.vin}</span>} />
              <Row icon={Calendar} label="初登日期" value={vehicle.firstRegisterDate} />
              <Row icon={User} label="车主" value={vehicle.ownerName} />
              <Row icon={Phone} label="联系电话" value={<span className="font-mono">{vehicle.ownerPhone}</span>} />
            </dl>
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-bold text-ink-100 flex items-center gap-1.5 mb-3">
              <AlertCircle className="w-4 h-4 text-warn-400" /> 最新检测摘要
            </h3>
            {!latestInspection ? (
              <div className="text-xs text-ink-500">暂无检测记录</div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`chip-${latestInspection.result === 'passed' ? 'passed' : 'rejected'}`}>
                    {latestInspection.result === 'passed' ? '检测合格' : '检测不合格'}
                  </span>
                  <span className="text-ink-400 text-[11px]">{latestInspection.lane} · {latestInspection.inspectorName}</span>
                </div>
                <div className="text-[11px] text-ink-400">检测时间：{formatDateTime(latestInspection.inspectTime)}</div>
                <div className="text-[11px] text-ink-400">里程数：<span className="font-mono text-ink-200">{latestInspection.odometer.toLocaleString()} km</span></div>
                {latestInspection.defectItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] text-ink-400">不合格项：</div>
                    {latestInspection.defectItems.map(d => (
                      <div key={d.code} className="flex items-start gap-1.5 p-1.5 bg-warn-500/5 border border-warn-500/20 rounded-sm">
                        <span className="text-[10px] px-1 rounded-sm bg-warn-500/20 text-warn-400 shrink-0">{d.category}</span>
                        <div className="min-w-0">
                          <div className="text-[11px] text-ink-100">{d.name}</div>
                          <div className="text-[10px] text-ink-400">{d.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {latestInspection.remark && (
                  <div className="text-[11px] text-ink-300 mt-1 italic">备注：{latestInspection.remark}</div>
                )}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-bold text-ink-100 flex items-center gap-1.5 mb-3">
              <Paperclip className="w-4 h-4 text-ink-300" /> 整改凭证汇总
            </h3>
            {!latestRect || latestRect.materials.length === 0 ? (
              <div className="text-xs text-ink-500">暂未上传整改凭证</div>
            ) : (
              <ul className="space-y-1.5">
                {latestRect.materials.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 p-1.5 bg-ink-700/30 rounded-sm text-xs">
                    {m.type === 'photo' ? <FileImage className="w-3.5 h-3.5 text-info-400" /> :
                      m.type === 'screenshot' ? <FileImage className="w-3.5 h-3.5 text-warn-400" /> :
                        <FileText className="w-3.5 h-3.5 text-ink-300" />}
                    <span className="text-ink-100 truncate">{m.name}</span>
                    <span className="ml-auto text-[10px] text-ink-400">{m.uploadedBy}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 中间流程 */}
        <section className="col-span-4 space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-bold text-ink-100 flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="w-4 h-4 text-safe-400" /> 不合格整改
            </h3>
            {rectifications.length === 0 ? (
              <div className="text-xs text-ink-500">暂无整改记录</div>
            ) : (
              <div className="space-y-3">
                {rectifications.map(r => (
                  <RectificationBlock key={r.id} r={r} chipCls={rectChipCls} />
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-bold text-ink-100 flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-info-400" /> 复检安排
            </h3>
            {reinspections.length === 0 ? (
              <div className="text-xs text-ink-500">暂未进入复检流程</div>
            ) : (
              <div className="space-y-3">
                {reinspections.map(re => (
                  <ReinspectionBlock key={re.id} re={re} chipCls={reChipCls} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 右侧时间线 */}
        <section className="col-span-4 card">
          <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-ink-300" />
            <h3 className="text-xs font-bold text-ink-100">完整操作时间线</h3>
            <span className="ml-auto text-[10px] text-ink-400">共 {logs.length} 条</span>
          </div>
          <div className="p-4 max-h-[calc(100vh-200px)] overflow-auto">
            <Timeline logs={logs} />
          </div>
        </section>
      </div>
    </div>
  )
}

function RectificationBlock({ r, chipCls }: { r: Rectification; chipCls: (s: string) => string }) {
  const hasHistory = (r.rejectHistory && r.rejectHistory.length > 0) || (r.supplementHistory && r.supplementHistory.length > 0)
  return (
    <div className={`rounded-sm border ${r.status === 'rejected' ? 'border-danger-500/30 bg-danger-500/5' : 'border-ink-600 bg-ink-700/20'}`}>
      <div className="p-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={chipCls(r.status)}>{rectificationStatusLabel[r.status as keyof typeof rectificationStatusLabel]}</span>
          <span className="text-[10px] text-ink-400 ml-auto">{formatDateTime(r.deadline)} 截止</span>
        </div>
        <div className="text-xs text-ink-100 mt-1">{r.description || '—'}</div>
        <div className="text-[10px] text-ink-400 mt-1">处理人：{r.handlerName} · 驳回 <span className={`font-bold ${r.rejectCount >= 2 ? 'text-danger-400' : 'text-warn-400'}`}>{r.rejectCount}</span> 次</div>
        {r.auditedAt && (
          <div className="text-[10px] text-ink-400 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> 审核于 {formatDateTime(r.auditedAt)} · {r.auditorName}
          </div>
        )}
      </div>

      {hasHistory && (
        <div className="border-t border-ink-600/60 p-3 bg-ink-800/30">
          {(r.rejectHistory && r.rejectHistory.length > 0) && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-2">
                <XCircle className="w-3 h-3 text-danger-400" />
                <span className="text-[11px] font-bold text-danger-400">驳回记录（{r.rejectHistory.length} 次）</span>
              </div>
              <div className="relative pl-5 space-y-2">
                <div className="absolute left-[9px] top-1 bottom-1 w-px bg-danger-500/30" />
                {r.rejectHistory.map((rej, idx) => (
                  <div key={rej.id} className="relative">
                    <span className="absolute -left-[13px] top-0.5 w-4 h-4 rounded-sm flex items-center justify-center bg-danger-500/10 border border-danger-500/40 text-danger-400">
                      <XSquare className="w-2.5 h-2.5" />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-danger-400">第 {idx + 1} 次驳回</span>
                      <span className="text-[10px] text-ink-400">{rej.auditorName} · {formatDateTime(rej.timestamp)}</span>
                    </div>
                    <div className="mt-0.5 p-2 bg-danger-500/5 border border-danger-500/20 rounded-sm">
                      <div className="text-[11px] text-danger-300">{rej.reason}</div>
                      {rej.rejectedItems && rej.rejectedItems.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rej.rejectedItems.map(item => (
                            <span key={item} className="text-[9px] px-1 py-0.5 rounded-sm bg-danger-500/15 text-danger-300">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(r.supplementHistory && r.supplementHistory.length > 0) && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <RefreshCcw className="w-3 h-3 text-warn-400" />
                <span className="text-[11px] font-bold text-warn-400">补录记录（{r.supplementHistory.length} 次）</span>
              </div>
              <div className="relative pl-5 space-y-2">
                <div className="absolute left-[9px] top-1 bottom-1 w-px bg-warn-500/30" />
                {r.supplementHistory.map(sup => (
                  <div key={sup.id} className="relative">
                    <span className="absolute -left-[13px] top-0.5 w-4 h-4 rounded-sm flex items-center justify-center bg-warn-500/10 border border-warn-500/40 text-warn-400">
                      <RefreshCcw className="w-2.5 h-2.5" />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-warn-400">补录材料</span>
                      <span className="text-[10px] text-ink-400">{sup.handlerName} · {formatDateTime(sup.timestamp)}</span>
                    </div>
                    {sup.description && (
                      <div className="mt-0.5 text-[11px] text-ink-200">{sup.description}</div>
                    )}
                    {sup.materials && sup.materials.length > 0 && (
                      <div className="mt-1 p-2 bg-warn-500/5 border border-warn-500/20 rounded-sm">
                        <div className="text-[10px] text-ink-400 mb-1">本次补录凭证（{sup.materials.length} 项）：</div>
                        <div className="flex flex-wrap gap-1">
                          {sup.materials.map((m, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-300 flex items-center gap-0.5">
                              {m.type === 'photo' ? <FileImage className="w-2 h-2 text-info-400" /> : <FileText className="w-2 h-2 text-ink-400" />}
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReinspectionBlock({ re, chipCls }: { re: Reinspection; chipCls: (s: string) => string }) {
  const hasHistory = re.scheduleHistory && re.scheduleHistory.length > 0
  return (
    <div className={`rounded-sm border ${re.status === 'abnormal' ? 'border-danger-500/30 bg-danger-500/5' : 'border-ink-600 bg-ink-700/20'}`}>
      <div className="p-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={chipCls(re.status)}>{reinspectionStatusLabel[re.status as keyof typeof reinspectionStatusLabel]}</span>
          {re.result && <span className={`text-[10px] ${re.result === 'passed' ? 'text-safe-400' : 'text-danger-400'}`}>
            {re.result === 'passed' ? '结果合格' : '结果仍不合格'}
          </span>}
        </div>
        {re.scheduledTime && (
          <div className="text-[11px] text-ink-200 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-ink-400" />
            {formatDateTime(re.scheduledTime)} · {re.lane}
          </div>
        )}
        {re.inspectorName && (
          <div className="text-[10px] text-ink-400 mt-0.5">复检员：{re.inspectorName}</div>
        )}
        {re.arrangedByName && (
          <div className="text-[10px] text-ink-400 mt-0.5">安排：{re.arrangedByName} · {formatDateTime(re.arrangedAt)}</div>
        )}
        {re.status === 'abnormal' && re.abnormalReason && (
          <div className="mt-1.5 p-1.5 bg-danger-500/10 border border-danger-500/20 rounded-sm text-[10px] text-danger-300 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>异常：{re.abnormalReason}</span>
          </div>
        )}
        {re.remark && <div className="text-[10px] text-ink-400 mt-0.5 italic">备注：{re.remark}</div>}
      </div>

      {hasHistory && (
        <div className="border-t border-ink-600/60 p-3 bg-ink-800/30">
          <div className="flex items-center gap-1 mb-2">
            <RotateCcw className="w-3 h-3 text-info-400" />
            <span className="text-[11px] font-bold text-info-400">安排历史（{re.scheduleHistory.length} 次调度）</span>
          </div>
          <div className="relative pl-5 space-y-2">
            <div className="absolute left-[9px] top-1 bottom-1 w-px bg-info-500/30" />
            {re.scheduleHistory.map((sch, idx) => {
              const isCancelled = !!sch.cancelReason
              const isLatest = idx === re.scheduleHistory.length - 1 && !sch.cancelReason
              return (
                <div key={sch.id} className="relative">
                  <span className={`absolute -left-[13px] top-0.5 w-4 h-4 rounded-sm flex items-center justify-center border ${
                    isCancelled
                      ? 'bg-danger-500/10 border-danger-500/40 text-danger-400'
                      : isLatest
                        ? 'bg-safe-500/10 border-safe-500/40 text-safe-400'
                        : 'bg-info-500/10 border-info-500/40 text-info-400'
                  }`}>
                    {isCancelled ? <CalendarX className="w-2.5 h-2.5" /> :
                      isLatest ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                        <CalendarDays className="w-2.5 h-2.5" />}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold ${
                      isCancelled ? 'text-danger-400' : isLatest ? 'text-safe-400' : 'text-info-400'
                    }`}>
                      {isCancelled ? '已取消' : isLatest ? '当前' : `第 ${idx + 1} 次`}
                    </span>
                    <span className="text-[11px] font-mono text-ink-200 font-bold">
                      {formatDateTime(sch.scheduledTime)} · {sch.lane}
                    </span>
                    <span className="text-[10px] text-ink-400">
                      {sch.arrangedByName} · {formatDateTime(sch.timestamp)}
                    </span>
                  </div>
                  {sch.cancelReason && (
                    <div className="mt-0.5 text-[11px] text-danger-300 pl-2 border-l-2 border-danger-500/40">
                      取消原因：{sch.cancelReason}
                      {sch.cancelledAt && <span className="text-ink-400 ml-2">({formatDateTime(sch.cancelledAt)})</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {re.resultDetail && (
        <div className="border-t border-ink-600/60 p-3 bg-safe-500/5">
          <div className="flex items-center gap-1 mb-2">
            <UserCheck className="w-3 h-3 text-safe-400" />
            <span className="text-[11px] font-bold text-safe-400">复检结果明细</span>
            <span className="text-[10px] text-ink-400 ml-auto">
              {re.resultDetail.completedBy} · {formatDateTime(re.resultDetail.completedAt)}
            </span>
          </div>
          {re.resultDetail.passedItems.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-safe-400 mb-1">已整改合格（{re.resultDetail.passedItems.length} 项）</div>
              <div className="flex flex-wrap gap-1">
                {re.resultDetail.passedItems.map((name, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-safe-500/10 text-safe-400 border border-safe-500/30">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {re.resultDetail.failedItems.length > 0 && (
            <div>
              <div className="text-[10px] text-danger-400 mb-1">仍不合格（{re.resultDetail.failedItems.length} 项）</div>
              <div className="flex flex-wrap gap-1">
                {re.resultDetail.failedItems.map(d => (
                  <span key={d.code} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-danger-500/10 text-danger-400 border border-danger-500/30">
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-ink-500 shrink-0" />
      <span className="text-ink-400 w-16 shrink-0">{label}</span>
      <span className="text-ink-200 min-w-0">{value}</span>
    </div>
  )
}
