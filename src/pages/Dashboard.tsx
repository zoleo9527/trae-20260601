import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Users, DoorOpen, GraduationCap, Check, AlertCircle, ArrowRight, Clock,
  ChevronDown, ChevronUp, FileText, ClipboardCheck, Eye, AlertTriangle, CheckCircle2,
  UserCheck, ListChecks, PlayCircle
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { StageProgress, AVStats, SPStats } from '../../shared/types'

const stageIcons = [Calendar, Users, DoorOpen, AlertCircle, GraduationCap]
const stageKeys = ['registration', 'room-arrangement', 'invigilator-assignment', 'absence-violation', 'score-publish'] as const
const ROLE_LABEL: Record<string, string> = { invigilator: '监考老师', admin: '考务专员', tech: '技术支持' }

const roleActions: Record<string, { label: string; path?: string; action?: string; primary?: boolean; stage?: string }[]> = {
  invigilator: [
    { label: '提交缺考记录', path: '/absence-violation', primary: true, stage: 'absence-violation' },
    { label: '提交违纪记录', path: '/absence-violation', primary: false, stage: 'absence-violation' },
  ],
  admin: [
    { label: '审核缺考违纪', path: '/absence-violation', primary: true, stage: 'absence-violation' },
    { label: '发起成绩发布', path: '/score-publish', primary: false, stage: 'score-publish' },
    { label: '数据重置', action: 'reset', primary: false },
  ],
  tech: [
    { label: '确认成绩发布', path: '/score-publish', primary: true, stage: 'score-publish' },
    { label: '导出数据', path: '/export', primary: false },
  ],
}

const roleDotColor: Record<string, string> = {
  invigilator: 'bg-blue-500',
  admin: 'bg-amber-500',
  tech: 'bg-green-500',
  stage: 'bg-purple-500',
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="h-24 rounded-xl bg-gray-200" />
      <div className="h-20 rounded-xl bg-gray-200" />
      <div className="h-64 rounded-xl bg-gray-200" />
    </div>
  )
}

function StageCard({
  stage, progress, onClick, onComplete, role, avStats, spStats
}: {
  stage: any
  progress: StageProgress | undefined
  onClick: () => void
  onComplete: () => void
  role: string | null
  avStats: AVStats | undefined
  spStats: SPStats | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const idx = stageKeys.indexOf(stage.key)
  const Icon = stageIcons[idx]

  const isAV = stage.key === 'absence-violation'
  const isSP = stage.key === 'score-publish'
  const canComplete = progress?.canProceed && (isAV || isSP) && role === 'admin' && stage.status !== 'completed'

  return (
    <div className={`rounded-xl border transition-all ${
      stage.status === 'completed' ? 'border-green-200 bg-green-50/50'
        : stage.status === 'active' ? 'border-amber-200 bg-amber-50/50 shadow-sm'
        : 'border-gray-200 bg-gray-50/50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/60 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              stage.status === 'completed'
                ? 'bg-green-500 text-white'
                : stage.status === 'active'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-gray-300 text-gray-500'
            }`}
          >
            {stage.status === 'completed' ? <Check size={20} /> : <Icon size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">{stage.name}</span>
              {stage.pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {stage.pendingCount} 待办
                </span>
              )}
              {stage.status === 'active' && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  进行中
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              {stage.operatorName && <span>操作人：{stage.operatorName}</span>}
              {stage.completedAt && (
                <span>
                  <Clock size={10} className="inline mr-0.5" />
                  {new Date(stage.completedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {progress?.nextAction && (
            <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              progress.nextRole === role
                ? 'bg-[#d97706] text-white animate-pulse'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {progress.nextRole && <span className="opacity-80 mr-1">【{ROLE_LABEL[progress.nextRole] || progress.nextRole}】</span>}
              {progress.nextAction}
            </div>
          )}
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100/80 pt-3 space-y-3">
          {progress?.blockers && progress.blockers.length > 0 && (
            <div className="flex items-start gap-2 text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">前置条件未满足：</span>
                <ul className="list-disc list-inside mt-0.5">
                  {progress.blockers.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            </div>
          )}

          {progress?.canProceed && stage.status === 'active' && (
            <div className="flex items-start gap-2 text-xs bg-green-50 text-green-700 rounded-lg px-3 py-2">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">本环节已满足推进条件</span>
                <div className="mt-0.5 opacity-80">所有待办事项已处理，可进行下一步操作</div>
              </div>
            </div>
          )}

          <StageDetail stage={stage} avStats={avStats} spStats={spStats} />

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onClick}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e3a5f] text-white hover:bg-[#2d5a8e] transition-colors inline-flex items-center gap-1"
            >
              <Eye size={12} />
              查看详情 / 进入操作
            </button>
            {canComplete && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete() }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors inline-flex items-center gap-1"
              >
                <Check size={12} />
                标记本环节完成
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StageDetail({ stage, avStats, spStats }: { stage: any; avStats: AVStats | undefined; spStats: SPStats | undefined }) {
  const { registration, roomArrangement, invigilatorAssignment } = useAppStore()

  if (stage.key === 'registration') {
    if (!registration) return null
    return (
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">报名总数</div>
          <div className="text-xl font-bold text-gray-900">{registration.totalRegistered} 人</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">已缴费 / 未缴费</div>
          <div className="text-xl font-bold text-gray-900">
            <span className="text-green-600">{registration.totalPaid}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-red-500">{registration.totalUnpaid}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">覆盖科目</div>
          <div className="text-xl font-bold text-gray-900">{registration.subjects.length} 科</div>
        </div>
        <div className="col-span-3 bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <FileText size={12} /> 各科目报名分布
          </div>
          <div className="flex flex-wrap gap-2">
            {registration.subjects.map((s: any) => (
              <div key={s.subjectId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-700 font-medium">{s.subjectName}</span>
                <span className="text-xs bg-[#1e3a5f] text-white px-1.5 rounded">{s.count} 人</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (stage.key === 'room-arrangement') {
    if (!roomArrangement) return null
    return (
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">考场总数</div>
          <div className="text-xl font-bold text-gray-900">{roomArrangement.totalRooms} 间</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">已使用</div>
          <div className="text-xl font-bold text-green-600">{roomArrangement.utilizedRooms} 间</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">总容量</div>
          <div className="text-xl font-bold text-gray-900">{roomArrangement.totalCapacity} 座</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">平均利用率</div>
          <div className="text-xl font-bold text-amber-600">
            {Math.round(roomArrangement.arrangements.reduce((s, a) => s + a.utilization, 0) / roomArrangement.arrangements.length)}%
          </div>
        </div>
        <div className="col-span-4 space-y-2">
          {roomArrangement.arrangements.map((a: any) => (
            <div key={a.roomId} className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DoorOpen size={14} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">{a.roomName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    a.utilization >= 80 ? 'bg-green-100 text-green-700'
                      : a.utilization >= 50 ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    利用率 {a.utilization}%
                  </span>
                  <span className="text-gray-500">{a.assigned}/{a.capacity} 人</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    a.utilization >= 80 ? 'bg-green-500' : a.utilization >= 50 ? 'bg-amber-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(a.utilization, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stage.key === 'invigilator-assignment') {
    if (!invigilatorAssignment) return null
    return (
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">监考老师</div>
          <div className="text-xl font-bold text-gray-900">{invigilatorAssignment.totalInvigilators} 人</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">已分配考场</div>
          <div className="text-xl font-bold text-green-600">{invigilatorAssignment.assignedRooms} 间</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">未分配</div>
          <div className={`text-xl font-bold ${invigilatorAssignment.unassignedRooms > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {invigilatorAssignment.unassignedRooms} 间
          </div>
        </div>
        <div className="col-span-3">
          <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <UserCheck size={12} /> 监考分配明细
          </div>
          <div className="grid grid-cols-3 gap-2">
            {invigilatorAssignment.assignments.map((a: any) => (
              <div key={a.invigilatorId} className="bg-white rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{a.invigilatorName}</div>
                  <div className="text-xs text-gray-400">{a.phone}</div>
                </div>
                <div className="bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium px-2 py-0.5 rounded">
                  {a.roomName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (stage.key === 'absence-violation') {
    const s = avStats || { pending: 0, resubmitted: 0, approved: 0, rejected: 0, supplemented: 0, total: 0 }
    const pending = s.pending + s.resubmitted
    return (
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-amber-200 bg-amber-50/30">
          <div className="text-xs text-amber-600 mb-1 flex items-center gap-1"><Clock size={11} /> 待审核</div>
          <div className="text-xl font-bold text-amber-700">{pending} 条</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-green-200 bg-green-50/30">
          <div className="text-xs text-green-600 mb-1 flex items-center gap-1"><Check size={11} /> 已通过</div>
          <div className="text-xl font-bold text-green-700">{s.approved} 条</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-red-200 bg-red-50/30">
          <div className="text-xs text-red-600 mb-1 flex items-center gap-1"><AlertCircle size={11} /> 已驳回</div>
          <div className="text-xl font-bold text-red-700">{s.rejected} 条</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-200 bg-blue-50/30">
          <div className="text-xs text-blue-600 mb-1 flex items-center gap-1"><FileText size={11} /> 已补录</div>
          <div className="text-xl font-bold text-blue-700">{s.supplemented} 条</div>
        </div>
        <div className="col-span-4 bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <ListChecks size={12} /> 缺考违纪流程
          </div>
          <div className="flex items-center text-xs">
            {[
              { label: '监考老师提交', status: 'done' },
              { label: '考务专员审核', status: pending > 0 ? 'current' : 'done' },
              { label: '通过/驳回/补录', status: s.rejected > 0 || s.supplemented > 0 ? 'done' : 'pending' },
              { label: '数据归档', status: pending === 0 ? 'done' : 'pending' },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  step.status === 'done' ? 'bg-green-500 text-white' : step.status === 'current' ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.status === 'done' ? <Check size={10} /> : i + 1}
                </div>
                <span className={`ml-1.5 ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>{step.label}</span>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step.status === 'done' ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (stage.key === 'score-publish') {
    const s = spStats || { initiated: 0, approved: 0, confirmed: 0, rejected: 0, total: 0 }
    return (
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FileText size={11} /> 总申请</div>
          <div className="text-xl font-bold text-gray-900">{s.total} 次</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-amber-200 bg-amber-50/30">
          <div className="text-xs text-amber-600 mb-1 flex items-center gap-1"><Clock size={11} /> 待审批</div>
          <div className="text-xl font-bold text-amber-700">{s.initiated} 科</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-200 bg-blue-50/30">
          <div className="text-xs text-blue-600 mb-1 flex items-center gap-1"><ClipboardCheck size={11} /> 已审批</div>
          <div className="text-xl font-bold text-blue-700">{s.approved} 科</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-green-200 bg-green-50/30">
          <div className="text-xs text-green-600 mb-1 flex items-center gap-1"><CheckCircle2 size={11} /> 已发布</div>
          <div className="text-xl font-bold text-green-700">{s.confirmed} 科</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-red-200 bg-red-50/30">
          <div className="text-xs text-red-600 mb-1 flex items-center gap-1"><AlertCircle size={11} /> 已驳回</div>
          <div className="text-xl font-bold text-red-700">{s.rejected} 科</div>
        </div>
        <div className="col-span-5 bg-white rounded-lg p-3 border border-gray-100">
          <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <PlayCircle size={12} /> 成绩发布流程
          </div>
          <div className="flex items-center text-xs">
            {[
              { label: '考务专员发起', role: '考务专员' },
              { label: '考务专员审批', role: '考务专员' },
              { label: '技术支持确认', role: '技术支持' },
              { label: '成绩同步发布', role: '系统自动' },
            ].map((step, i, arr) => {
              let status: 'done' | 'current' | 'pending' = 'pending'
              if (i === 0) status = s.total > 0 ? 'done' : 'pending'
              if (i === 1) status = s.approved + s.confirmed > 0 ? 'done' : s.initiated > 0 ? 'current' : 'pending'
              if (i === 2) status = s.confirmed > 0 ? 'done' : s.approved > 0 ? 'current' : 'pending'
              if (i === 3) status = s.confirmed > 0 ? 'current' : 'pending'
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    status === 'done' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {status === 'done' ? <Check size={10} /> : i + 1}
                  </div>
                  <div className="ml-1.5">
                    <div className={status === 'pending' ? 'text-gray-400' : 'text-gray-700'}>{step.label}</div>
                    <div className="text-[10px] text-gray-400">{step.role}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${status === 'done' ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    dashboard, role, loading, fetchDashboard, resetData, completeStage,
    stageProgress, fetchRooms, error, clearError
  } = useAppStore()

  useEffect(() => {
    fetchDashboard()
    fetchRooms()
  }, [fetchDashboard, fetchRooms])

  if (loading || !dashboard) return <Skeleton />

  const cards = [
    { label: '考试名称', value: dashboard.examName, icon: GraduationCap },
    { label: '考试日期', value: dashboard.examDate, icon: Calendar },
    { label: '考生总数', value: `${dashboard.totalCandidates} 人`, icon: Users },
    { label: '考场总数', value: `${dashboard.totalRooms} 间`, icon: DoorOpen },
  ]

  const handleAction = async (item: { path?: string; action?: string }) => {
    if (item.path) navigate(item.path)
    if (item.action === 'reset') {
      if (confirm('确认重置所有数据？此操作不可撤销，将恢复到初始种子数据。')) await resetData()
    }
  }

  const handleStageClick = (stageKey: string) => {
    const map: Record<string, string> = {
      'absence-violation': '/absence-violation',
      'score-publish': '/score-publish',
    }
    if (map[stageKey]) navigate(map[stageKey])
    else {
      alert(`${dashboard.stages.find((s: any) => s.key === stageKey)?.name} 环节已完成，数据请在「详情查询」中查看`)
      navigate('/query')
    }
  }

  const handleCompleteStage = async (stageKey: string) => {
    try {
      if (confirm(`确认将「${dashboard.stages.find((s: any) => s.key === stageKey)?.name}」标记为完成？此操作会留痕。`)) {
        await completeStage(stageKey)
      }
    } catch (e: any) {
      alert(e.message || '操作失败')
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 text-xs">关闭</button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="rounded-xl px-5 py-6 text-white flex items-center gap-4 shadow-md"
            style={{ background: i === 3 ? 'linear-gradient(135deg, #2d5a8e, #3d7ab0)' : 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
          >
            <card.icon size={36} className="opacity-80 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white/70 text-sm">{card.label}</p>
              <p className="text-2xl font-bold truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <PlayCircle size={18} className="text-[#d97706]" />
            环节推进状态
          </h2>
          <span className="text-xs text-gray-400">
            点击环节卡片可展开查看详情与推进动作
          </span>
        </div>
        <div className="space-y-3">
          {dashboard.stages.map((stage: any, i: number) => {
            const progress = stageProgress.find(p => p.stage === stage.key)
            return (
              <StageCard
                key={stage.key}
                stage={stage}
                progress={progress}
                onClick={() => handleStageClick(stage.key)}
                onComplete={() => handleCompleteStage(stage.key)}
                role={role}
                avStats={dashboard.avStats}
                spStats={dashboard.spStats}
              />
            )
          })}
        </div>
      </div>

      {role && roleActions[role] && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <PlayCircle size={18} className="text-[#d97706]" />
            快捷操作
            <span className="text-xs font-normal text-gray-400 ml-2">
              当前角色：<span className={`px-1.5 py-0.5 rounded ${
                role === 'admin' ? 'bg-amber-100 text-amber-700'
                  : role === 'invigilator' ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>{ROLE_LABEL[role] || role}</span>
            </span>
          </h2>
          <div className="flex gap-3 flex-wrap">
            {roleActions[role].map((item, i) => (
              <button
                key={i}
                onClick={() => handleAction(item)}
                className={
                  item.primary
                    ? 'px-5 py-2.5 rounded-lg bg-[#d97706] text-white font-medium hover:bg-[#b45309] transition-colors shadow-sm inline-flex items-center gap-1.5'
                    : 'px-5 py-2.5 rounded-lg border border-[#d97706] text-[#d97706] font-medium hover:bg-amber-50 transition-colors inline-flex items-center gap-1.5'
                }
              >
                {item.primary && <PlayCircle size={14} />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-5 text-gray-900 flex items-center gap-2">
          <Clock size={18} className="text-[#1e3a5f]" />
          最近操作留痕
          <span className="text-xs font-normal text-gray-400 ml-2">
            所有操作均自动记录，含操作人、角色、前后状态
          </span>
        </h2>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100" />
          <div className="space-y-3">
            {dashboard.recentLogs.slice(0, 10).map((log: any) => {
              const isStage = log.targetType === 'stage'
              const colorKey = isStage ? 'stage' : log.operatorRole
              const dotColor = roleDotColor[colorKey] || 'bg-gray-400'
              return (
                <div key={log.id} className="relative flex items-start gap-4">
                  <div
                    className={`absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${dotColor} ${
                      log.action === 'submit' || log.action === 'initiate' ? 'animate-pulse' : ''
                    }`}
                  />
                  <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{log.operatorName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          log.operatorRole === 'admin' ? 'bg-amber-100 text-amber-700'
                            : log.operatorRole === 'invigilator' ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {ROLE_LABEL[log.operatorRole] || log.operatorRole}
                        </span>
                        {log.fromStatus && log.toStatus && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                            <span>{log.fromStatus}</span>
                            <ArrowRight size={10} />
                            <span className={`font-medium ${
                              log.toStatus === 'approved' || log.toStatus === 'confirmed' ? 'text-green-600'
                                : log.toStatus === 'rejected' ? 'text-red-600'
                                : log.toStatus === 'initiated' || log.toStatus === 'pending' ? 'text-amber-600'
                                : 'text-blue-600'
                            }`}>{log.toStatus}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(log.createdAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{log.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
