import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck, CalendarClock, AlertTriangle, Clock, ArrowRight, FileWarning,
  Car, AlertOctagon, RefreshCcw, UserCircle, Wrench, ChevronRight, Flame,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Timeline from '@/components/Timeline'
import { useStore } from '@/store'
import { rectificationStatusLabel, reinspectionStatusLabel, formatDateTime, isOverdue, timeAgo } from '@/utils/format'

export default function Dashboard() {
  const { currentUser, vehicles, rectifications, reinspections, logs } = useStore()

  const myPendingRectifications = useMemo(() => {
    if (currentUser.role === 'auditor') return rectifications.filter(r => r.status === 'submitted')
    if (currentUser.role === 'inspector') return rectifications.filter(r => r.status === 'pending')
    return rectifications.filter(r =>
      (r.status === 'pending' || r.status === 'rejected') && r.handlerId === currentUser.id
    ).sort((a, b) => {
      const aRej = a.status === 'rejected' ? 0 : 1
      const bRej = b.status === 'rejected' ? 0 : 1
      if (aRej !== bRej) return aRej - bRej
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
  }, [rectifications, currentUser])

  const myPendingReinspections = useMemo(() => {
    if (currentUser.role === 'auditor') return reinspections.filter(re => re.status === 'pending')
    if (currentUser.role === 'inspector') return reinspections.filter(re => re.status === 'scheduled')
    return reinspections.filter(re => re.status === 'scheduled')
  }, [reinspections, currentUser])

  const riskItems = useMemo(() => {
    const risks: Array<{
      id: string; type: 'rect_overdue' | 'rect_rejected' | 're_abnormal' | 're_missed'
      title: string; desc: string; plate: string; vehicleId: string; level: 'high' | 'medium' | 'low'
    }> = []
    rectifications.forEach(r => {
      if (r.status === 'pending' && isOverdue(r.deadline)) {
        const v = vehicles.find(x => x.id === r.vehicleId)
        risks.push({
          id: 'rov_' + r.id, type: 'rect_overdue', level: 'high',
          title: '整改超期未提交',
          desc: `截止日 ${formatDateTime(r.deadline)} · ${r.description || ''}`,
          plate: v?.plateNumber || '—', vehicleId: r.vehicleId,
        })
      }
      if (r.status === 'rejected' && r.rejectCount >= 2) {
        const v = vehicles.find(x => x.id === r.vehicleId)
        risks.push({
          id: 'rej_' + r.id, type: 'rect_rejected', level: r.rejectCount >= 2 ? 'high' : 'medium',
          title: `整改被驳回 ${r.rejectCount} 次`,
          desc: r.latestRejectReason || '多次整改不符合要求',
          plate: v?.plateNumber || '—', vehicleId: r.vehicleId,
        })
      }
      if (r.status === 'rejected' && r.rejectCount === 1) {
        const v = vehicles.find(x => x.id === r.vehicleId)
        risks.push({
          id: 'rej1_' + r.id, type: 'rect_rejected', level: 'medium',
          title: `整改被驳回 ${r.rejectCount} 次（待补录）`,
          desc: r.latestRejectReason || '整改不符合要求',
          plate: v?.plateNumber || '—', vehicleId: r.vehicleId,
        })
      }
    })
    reinspections.forEach(re => {
      if (re.status === 'abnormal') {
        const v = vehicles.find(x => x.id === re.vehicleId)
        risks.push({
          id: 'abn_' + re.id, type: 're_abnormal', level: 'high',
          title: '复检异常',
          desc: re.abnormalReason || '需跟进处理',
          plate: v?.plateNumber || '—', vehicleId: re.vehicleId,
        })
      }
    })
    return risks.sort((a, b) => (a.level === 'high' ? 0 : 1) - (b.level === 'high' ? 0 : 1))
  }, [rectifications, reinspections, vehicles])

  const recentLogs = logs.slice(0, 12)

  const statsTone = useMemo(() => {
    const rectOverdue = rectifications.filter(r => r.status === 'pending' && isOverdue(r.deadline)).length
    const rectRejHigh = rectifications.filter(r => r.status === 'rejected' && r.rejectCount >= 2).length
    const reAbn = reinspections.filter(re => re.status === 'abnormal').length
    const dangerCount = rectOverdue + rectRejHigh + reAbn
    return {
      rect: myPendingRectifications.length > 0 ? (myPendingRectifications.some(r => r.status === 'rejected') ? 'danger' : 'warn') : 'safe',
      re: myPendingReinspections.length > 0 ? 'info' : 'safe',
      risk: dangerCount > 0 ? 'danger' : 'safe',
    }
  }, [myPendingRectifications, myPendingReinspections, rectifications, reinspections])

  const quickActions = useMemo(() => {
    if (currentUser.role === 'receiver') {
      const rejectedCount = myPendingRectifications.filter(r => r.status === 'rejected').length
      const pendingCount = myPendingRectifications.filter(r => r.status === 'pending').length
      return [
        { label: '我的整改待办', to: '/rectification?status=pending', desc: `${pendingCount} 项待提交整改` },
        { label: '被驳回需补录', to: '/rectification?status=rejected', desc: `${rejectedCount} 项待补录材料` },
        { label: '查看复检进度', to: '/reinspection?tab=pending', desc: '待安排复检列表' },
        { label: '今日复检安排', to: '/reinspection?tab=scheduled', desc: '已安排的复检' },
      ]
    }
    if (currentUser.role === 'auditor') {
      return [
        { label: '待审核整改', to: '/rectification?status=submitted', desc: `${myPendingRectifications.length} 项待审核` },
        { label: '待安排复检', to: '/reinspection?tab=pending', desc: `${myPendingReinspections.length} 项待排期` },
        { label: '复检异常处理', to: '/reinspection?tab=abnormal', desc: '异常复检跟进' },
        { label: '已通过整改', to: '/rectification?status=passed', desc: '最近合格记录' },
      ]
    }
    return [
      { label: '今日待复检', to: '/reinspection?tab=scheduled', desc: `${myPendingReinspections.length} 项待执行` },
      { label: '复检异常处理', to: '/reinspection?tab=abnormal', desc: '异常车辆跟进' },
      { label: '待处理整改', to: '/rectification?status=pending', desc: '整改任务列表' },
      { label: '历史记录回看', to: '/reinspection?tab=history', desc: '全部复检记录' },
    ]
  }, [currentUser, myPendingRectifications, myPendingReinspections])

  return (
    <div>
      <PageHeader
        title={`${currentUser.roleLabel}工作台`}
        subtitle={`${currentUser.name}，以下是当前需要优先处理的事项，按紧急度排序。`}
        stats={[
          { label: '待办整改', value: myPendingRectifications.length, tone: statsTone.rect as any },
          { label: '待办复检', value: myPendingReinspections.length, tone: statsTone.re as any },
          { label: '风险项', value: riskItems.length, tone: statsTone.risk as any },
        ]}
      />

      <div className="p-5 grid grid-cols-12 gap-4">

        {/* 待办整改 - 最大栏 */}
        <section className="col-span-5 card flex flex-col min-h-[420px]">
          <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 shrink-0">
            <ClipboardCheck className="w-4 h-4 text-warn-400" />
            <h3 className="text-xs font-bold text-ink-100">待办整改</h3>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-ink-400">
              <Clock className="w-3 h-3" /> 共 {myPendingRectifications.length} 项
            </span>
            <Link to="/rectification" className="text-[10px] text-info-400 hover:text-info-300 flex items-center gap-0.5">
              全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myPendingRectifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-ink-500 p-6">
              <CheckEmpty />
              <div className="mt-2">当前没有待办整改</div>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-ink-700/60 overflow-auto">
              {myPendingRectifications.slice(0, 10).map(r => {
                const v = vehicles.find(x => x.id === r.vehicleId)
                const overdue = isOverdue(r.deadline)
                const rejected = r.status === 'rejected'
                return (
                  <li key={r.id} className={`px-4 py-2.5 hover:bg-ink-700/30 transition-colors ${rejected ? 'bg-danger-500/5' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Car className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                        <Link to={`/vehicle/${r.vehicleId}`} className="text-xs font-mono text-ink-100 hover:text-info-400 font-bold">{v?.plateNumber}</Link>
                        <span className="text-[10px] text-ink-400">{v?.vehicleTypeLabel}</span>
                      </div>
                      <span className={`chip-${rejected ? 'rejected' : 'pending'}`}>
                        {rectificationStatusLabel[r.status]}
                      </span>
                      {overdue && <span className="chip-abnormal">超期</span>}
                      {rejected && r.rejectCount > 0 && <span className="text-[10px] text-danger-400 font-bold">驳回{r.rejectCount}次</span>}
                    </div>
                    <div className="text-[11px] text-ink-300 mt-1 line-clamp-1">{r.description}</div>
                    {rejected && r.latestRejectReason && (
                      <div className="mt-1 flex items-start gap-1">
                        <RefreshCcw className="w-3 h-3 text-danger-400 shrink-0 mt-0.5" />
                        <div className="text-[10px] text-danger-300 line-clamp-2">驳回原因：{r.latestRejectReason}</div>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-400">
                      <span>截止：{formatDateTime(r.deadline)}</span>
                      {r.supplementHistory.length > 0 && <span>已提交 {r.supplementHistory.length} 次</span>}
                      <Link to="/rectification" className="ml-auto text-info-400 hover:text-info-300 font-medium">
                        处理 <ChevronRight className="w-3 h-3 inline align-[-2px]" />
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* 复检待办 */}
        <section className="col-span-4 card flex flex-col min-h-[420px]">
          <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 shrink-0">
            <CalendarClock className="w-4 h-4 text-info-400" />
            <h3 className="text-xs font-bold text-ink-100">待办复检</h3>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-ink-400">共 {myPendingReinspections.length} 项</span>
            <Link to="/reinspection" className="text-[10px] text-info-400 hover:text-info-300 flex items-center gap-0.5">
              全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myPendingReinspections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-ink-500 p-6">
              <CheckEmpty />
              <div className="mt-2">当前没有待办复检</div>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-ink-700/60 overflow-auto">
              {myPendingReinspections.map(re => {
                const v = vehicles.find(x => x.id === re.vehicleId)
                const ins = useStore.getState().inspections.find(i => i.id === re.inspectionId)
                return (
                  <li key={re.id} className="px-4 py-2.5 hover:bg-ink-700/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Link to={`/vehicle/${re.vehicleId}`} className="text-xs font-mono text-ink-100 hover:text-info-400 font-bold">{v?.plateNumber}</Link>
                      <span className="text-[10px] text-ink-400">{v?.vehicleTypeLabel}</span>
                      <span className={`ml-auto chip-${re.status === 'pending' ? 'pending' : 'submitted'}`}>
                        {reinspectionStatusLabel[re.status]}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-300 mt-1">
                      {re.scheduledTime
                        ? <><span className="text-info-300 font-medium">{formatDateTime(re.scheduledTime)}</span> · {re.lane}</>
                        : '等待安排检测线与时间'}
                    </div>
                    {ins && ins.defectItems.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ins.defectItems.slice(0, 3).map(d => (
                          <span key={d.code} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-300">{d.name}</span>
                        ))}
                        {ins.defectItems.length > 3 && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ink-700 text-ink-400">+{ins.defectItems.length - 3}</span>}
                      </div>
                    )}
                    {re.remark && <div className="text-[10px] text-ink-400 mt-1 italic">备注：{re.remark}</div>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* 风险项 */}
        <section className="col-span-3 card border-danger-500/30 flex flex-col min-h-[420px]">
          <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 bg-gradient-to-r from-danger-500/10 to-transparent shrink-0">
            <AlertOctagon className="w-4 h-4 text-danger-400" />
            <h3 className="text-xs font-bold text-danger-400">风险项</h3>
            <span className="ml-auto text-[10px] text-danger-400">{riskItems.length} 项</span>
          </div>
          {riskItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-ink-500 p-6">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <div>暂无风险项，状态良好</div>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-ink-700/60 overflow-auto">
              {riskItems.map(r => (
                <li key={r.id} className={`px-3 py-2.5 hover:bg-danger-500/5 transition-colors ${r.level === 'high' ? 'bg-danger-500/5' : ''}`}>
                  <div className="flex items-center gap-2">
                    {r.level === 'high'
                      ? <Flame className="w-3.5 h-3.5 text-danger-400 shrink-0" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-warn-400 shrink-0" />}
                    <Link to={`/vehicle/${r.vehicleId}`} className="text-xs font-mono text-ink-100 hover:text-info-400 font-bold">{r.plate}</Link>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-sm ${r.level === 'high' ? 'bg-danger-500/20 text-danger-400' : 'bg-warn-500/20 text-warn-400'}`}>
                      {r.level === 'high' ? '高' : '中'}
                    </span>
                  </div>
                  <div className={`text-[11px] mt-1 font-medium ${r.level === 'high' ? 'text-danger-400' : 'text-warn-400'}`}>{r.title}</div>
                  <div className="text-[10px] text-ink-300 mt-0.5 line-clamp-2">{r.desc}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 快捷动作 */}
        <section className="col-span-12">
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((a, i) => (
              <Link key={i} to={a.to} className="card p-4 hover:border-info-500/50 transition-colors group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-sm bg-info-500/15 flex items-center justify-center text-info-400 group-hover:bg-info-500/25 transition-colors">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink-100">{a.label}</div>
                    <div className="text-[10px] text-ink-400 mt-0.5">{a.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-ink-500 group-hover:text-info-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 最近变更时间线 */}
        <section className="col-span-12 card">
          <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 shrink-0">
            <FileWarning className="w-4 h-4 text-ink-300" />
            <h3 className="text-xs font-bold text-ink-100">最近变更</h3>
            <span className="ml-auto text-[10px] text-ink-400">按时间倒序 · 最近 {recentLogs.length} 条</span>
          </div>
          <div className="p-4">
            {recentLogs.length === 0 ? (
              <div className="text-xs text-ink-500 py-4 text-center">暂无操作记录</div>
            ) : (
              <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                {recentLogs.map(log => {
                  const v = vehicles.find(x => x.id === log.vehicleId)
                  return (
                    <div key={log.id} className="flex items-start gap-2 py-1 border-b border-ink-700/40 last:border-0">
                      <span className="text-[10px] text-ink-500 font-mono shrink-0 pt-0.5 w-14">{timeAgo(log.timestamp)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v && <Link to={`/vehicle/${log.vehicleId}`} className="text-[11px] font-mono text-ink-100 hover:text-info-400 font-bold">{v.plateNumber}</Link>}
                          <span className="text-[10px] text-ink-300">{log.action}</span>
                        </div>
                        <div className="text-[10px] text-ink-400 truncate mt-0.5">{log.content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function CheckEmpty() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full bg-safe-500/10 animate-pulse" />
      <div className="absolute inset-2 rounded-full bg-safe-500/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <UserCircle className="w-8 h-8 text-safe-400/70" />
      </div>
    </div>
  )
}
