import { useNavigate } from "react-router-dom"
import { AlertTriangle, Clock, CheckCircle, Building2, ArrowRight, Shield, UserCheck, FileText, ChevronRight, User, Wrench, CircleDashed, ListChecks } from "lucide-react"
import { useExamStore } from "@/store"
import { cn } from "@/lib/utils"
import type { RoomStatus, RiskLevel, OperatorRole, AuditLog } from "@/data/types"

const statusConfig: Record<string, { label: string; color: string; border: string; step: number; role: OperatorRole }> = {
  returned: { label: "已退回", color: "text-red-700 bg-red-50", border: "border-l-red-500", step: 0, role: "exam_staff" },
  pending: { label: "待编排", color: "text-amber-700 bg-amber-50", border: "border-l-amber-500", step: 1, role: "exam_staff" },
  arranged: { label: "已编排", color: "text-sky-700 bg-sky-50", border: "border-l-sky-500", step: 2, role: "exam_staff" },
  submitted: { label: "待确认", color: "text-blue-700 bg-blue-50", border: "border-l-blue-500", step: 3, role: "invigilator" },
  confirmed: { label: "已确认", color: "text-green-700 bg-green-50", border: "border-l-green-500", step: 4, role: "invigilator" },
}

const workflowSteps = [
  { role: "exam_staff" as OperatorRole, title: "考务专员", action: "编排考场", desc: "设定容量、科目、时间" },
  { role: "exam_staff" as OperatorRole, title: "考务专员", action: "提交审核", desc: "确认编排信息无误" },
  { role: "invigilator" as OperatorRole, title: "监考老师", action: "确认座位", desc: "核对座位分配" },
  { role: "tech_support" as OperatorRole, title: "技术支持", action: "异常处理", desc: "介入解决风险项" },
]

const roleIconMap: Record<OperatorRole, typeof User> = {
  exam_staff: Shield,
  invigilator: UserCheck,
  tech_support: Wrench,
}

const roleColorMap: Record<OperatorRole, string> = {
  exam_staff: "text-teal-700 bg-teal-100",
  invigilator: "text-blue-700 bg-blue-100",
  tech_support: "text-amber-700 bg-amber-100",
}

const riskStyle: Record<RiskLevel, string> = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-amber-500 bg-amber-50",
  low: "border-l-sky-400 bg-sky-50",
}

const riskBadge: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-sky-100 text-sky-700",
}

const logActionIcon: Record<string, typeof FileText> = {
  "编排考场": ListChecks,
  "创建考场编排": Building2,
  "提交考场编排": ArrowRight,
  "分配座位": UserCheck,
  "自动分配座位": ListChecks,
  "确认座位分配": CheckCircle,
  "退回座位分配": AlertTriangle,
  "处理异常": Wrench,
  "解决风险": Shield,
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "刚刚"
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function LogItem({ log }: { log: AuditLog }) {
  const Icon = logActionIcon[log.action] ?? FileText
  const RoleIcon = roleIconMap[log.operatorRole]
  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", roleColorMap[log.operatorRole])}>
        <RoleIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{log.operatorName}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{statusConfig[log.operatorRole]?.label ?? log.operatorRole}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-sm text-slate-700">{log.action}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{log.detail}</p>
      </div>
      <span className="shrink-0 text-xs text-slate-400">{timeAgo(log.timestamp)}</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { examRooms, getPendingRooms, getSubmittedRooms, getReturnedRooms, getArrangedRooms, getUnresolvedRisks, getRecentLogs, resolveRisk, currentRole } = useExamStore()

  const pending = getPendingRooms()
  const submitted = getSubmittedRooms()
  const returned = getReturnedRooms()
  const arranged = getArrangedRooms()
  const risks = getUnresolvedRisks()
  const recentLogs = getRecentLogs(8)
  const confirmed = examRooms.filter((r) => r.status === "confirmed")

  const queueItems = [
    ...returned.map((r) => ({ ...r, status: "returned" as RoomStatus, priority: 0 })),
    ...pending.map((r) => ({ ...r, status: "pending" as RoomStatus, priority: 1 })),
    ...arranged.map((r) => ({ ...r, status: "arranged" as RoomStatus, priority: 2 })),
    ...submitted.map((r) => ({ ...r, status: "submitted" as RoomStatus, priority: 3 })),
  ].sort((a, b) => a.priority - b.priority)

  const stats = [
    { label: "考场总数", value: examRooms.length, total: examRooms.length, icon: Building2, color: "text-teal-700 bg-teal-50", bar: "bg-teal-500" },
    { label: "待编排", value: pending.length, total: examRooms.length, icon: Clock, color: "text-amber-600 bg-amber-50", bar: "bg-amber-500" },
    { label: "待确认", value: submitted.length, total: examRooms.length, icon: UserCheck, color: "text-blue-600 bg-blue-50", bar: "bg-blue-500" },
    { label: "已完成", value: confirmed.length, total: examRooms.length, icon: CheckCircle, color: "text-green-600 bg-green-50", bar: "bg-green-500" },
  ]

  const myTasks = queueItems.filter((item) => {
    if (currentRole === "exam_staff") return item.status === "pending" || item.status === "arranged" || item.status === "returned"
    if (currentRole === "invigilator") return item.status === "submitted"
    if (currentRole === "tech_support") return risks.some((r) => r.roomId === item.id)
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">考务工作台</h1>
          <p className="text-sm text-slate-500 mt-0.5">考场编排 → 座位分配 → 监考确认，按顺序处理</p>
        </div>
        <div className="text-sm text-slate-400">
          今天是 {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-4 h-4 text-teal-700" />
          <span className="text-sm font-semibold text-slate-800">处理流程</span>
        </div>
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, i) => {
            const StepIcon = roleIconMap[step.role]
            const isCurrentRole = step.role === currentRole
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isCurrentRole ? "bg-teal-600 text-white ring-4 ring-teal-100" : roleColorMap[step.role]
                  )}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <div className="text-center mt-2">
                    <div className={cn("text-xs font-medium", isCurrentRole ? "text-teal-700" : "text-slate-600")}>{step.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.action}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
                  </div>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className="flex-1 flex items-center mx-2">
                    <div className="flex-1 h-0.5 bg-slate-200 relative">
                      <div className="absolute inset-y-0 left-0 bg-teal-500" style={{ width: i < 2 ? "100%" : "50%" }} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-800 tabular-nums">{s.value}</p>
              </div>
              <div className={cn("rounded-lg p-3", s.color)}>
                <s.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", s.bar)} style={{ width: `${(s.value / s.total) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">占比 {Math.round((s.value / s.total) * 100)}%</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Clock className="h-5 w-5 text-teal-700" /> 我的待处理
            </h2>
            <span className="text-xs text-slate-400">共 {myTasks.length} 项待处理</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">太棒了！暂无待处理事项</p>
              <p className="text-xs text-slate-400 mt-1">所有任务都已处理完毕</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map((room) => {
                const cfg = statusConfig[room.status]
                const StepIcon = roleIconMap[cfg.role]
                const roomRisks = risks.filter((r) => r.roomId === room.id)
                return (
                  <div key={room.id} className={cn("rounded-xl border-l-4 bg-white p-4 shadow-sm hover:shadow-md transition-all", cfg.border)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", roleColorMap[cfg.role])}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800">{room.name} · {room.subject}</p>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cfg.color)}>{cfg.label}</span>
                            {roomRisks.length > 0 && (
                              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 inline mr-0.5" />{roomRisks.length}个风险
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{room.building} {room.floor}F · {room.examDate} {room.timeSlot} · 容量 {room.capacity}人</p>
                          {room.returnReason && (
                            <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-0.5 inline-block">退回原因：{room.returnReason}</p>
                          )}
                          {room.arrangedBy && (
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              上一步：{room.arrangedBy} 于 {formatTime(room.arrangedAt!)} 完成编排
                            </p>
                          )}
                          {room.submittedBy && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              提交：{room.submittedBy} 于 {formatTime(room.submittedAt!)} 提交审核
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(room.status === "submitted" ? `/seat-allocation?roomId=${room.id}` : `/arrangement?roomId=${room.id}`)}
                          className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
                        >
                          开始处理 <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
              <CircleDashed className="w-4 h-4" /> 其他待处理
            </h3>
            <div className="space-y-2">
              {queueItems.filter((item) => !myTasks.find((t) => t.id === item.id)).map((room) => {
                const cfg = statusConfig[room.status]
                return (
                  <div key={room.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-600">{room.name} · {room.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
                      <button
                        onClick={() => navigate(room.status === "submitted" ? `/seat-allocation?roomId=${room.id}` : `/arrangement?roomId=${room.id}`)}
                        className="text-xs text-teal-600 hover:underline"
                      >
                        查看
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Shield className="h-5 w-5 text-amber-600" /> 风险项预警
            </h2>
            <div className="space-y-2">
              {risks.length === 0 && (
                <div className="flex flex-col items-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                  <CheckCircle className="mb-2 h-8 w-8 text-teal-500" />
                  <p>暂无风险项</p>
                </div>
              )}
              {risks.map((risk) => (
                <div key={risk.id} className={cn("rounded-xl border-l-4 p-4 shadow-sm bg-white", riskStyle[risk.level])}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-semibold text-slate-800 text-sm">{risk.roomName}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", riskBadge[risk.level])}>
                          {risk.level === "high" ? "高风险" : risk.level === "medium" ? "中风险" : "低风险"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{risk.description}</p>
                    </div>
                    <button
                      onClick={() => resolveRisk(risk.id)}
                      className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-50 transition-colors border border-amber-200"
                    >
                      标记解决
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <FileText className="h-5 w-5 text-teal-700" /> 最近变更
            </h2>
            <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-1 max-h-[360px] overflow-y-auto">
              {recentLogs.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
