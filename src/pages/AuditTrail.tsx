import { useState, useMemo } from "react"
import { Search, ChevronDown, ChevronUp, Clock, Shield, UserCheck, AlertTriangle, Building2, ListChecks, ArrowRight, Filter, X, Eye } from "lucide-react"
import { useExamStore } from "@/store"
import { cn } from "@/lib/utils"
import type { OperatorRole, AuditLog, RoomStatus, ExamRoom } from "@/data/types"

const roleTabs: { label: string; value: OperatorRole | "all" }[] = [
  { label: "全部角色", value: "all" },
  { label: "考务专员", value: "exam_staff" },
  { label: "监考老师", value: "invigilator" },
  { label: "技术支持", value: "tech_support" },
]

const actionColorMap: Record<string, string> = {
  "编排考场": "bg-blue-100 text-blue-700 border-blue-200",
  "创建考场编排": "bg-blue-100 text-blue-700 border-blue-200",
  "提交考场编排": "bg-teal-100 text-teal-700 border-teal-200",
  "退回座位分配": "bg-red-100 text-red-700 border-red-200",
  "确认座位分配": "bg-green-100 text-green-700 border-green-200",
  "分配座位": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "取消座位分配": "bg-orange-100 text-orange-700 border-orange-200",
  "自动分配座位": "bg-purple-100 text-purple-700 border-purple-200",
  "处理异常": "bg-amber-100 text-amber-700 border-amber-200",
  "解决风险": "bg-emerald-100 text-emerald-700 border-emerald-200",
}

const roleColorMap: Record<OperatorRole, string> = {
  exam_staff: "bg-teal-100 text-teal-700 border-teal-200",
  invigilator: "bg-blue-100 text-blue-700 border-blue-200",
  tech_support: "bg-amber-100 text-amber-700 border-amber-200",
}

const roleIconMap: Record<OperatorRole, typeof Shield> = {
  exam_staff: Shield,
  invigilator: UserCheck,
  tech_support: AlertTriangle,
}

const roleLabelMap: Record<OperatorRole, string> = {
  exam_staff: "考务专员",
  invigilator: "监考老师",
  tech_support: "技术支持",
}

const statusFlow: { key: RoomStatus; label: string; role: OperatorRole }[] = [
  { key: "pending", label: "待编排", role: "exam_staff" },
  { key: "arranged", label: "已编排", role: "exam_staff" },
  { key: "submitted", label: "已提交", role: "exam_staff" },
  { key: "confirmed", label: "已确认", role: "invigilator" },
]

const statusTimestampField: Record<string, string> = {
  arranged: "arrangedAt",
  submitted: "submittedAt",
  confirmed: "confirmedAt",
  returned: "returnedAt",
}

const statusOperatorField: Record<string, string> = {
  arranged: "arrangedBy",
  submitted: "submittedBy",
  confirmed: "confirmedBy",
  returned: "returnedBy",
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function formatFullTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function RoomTimeline({ room }: { room: ExamRoom | undefined }) {
  if (!room) return null
  const isReturned = room.status === "returned"
  const currentIndex = statusFlow.findIndex((s) => s.key === (isReturned ? "submitted" : room.status))

  return (
    <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-teal-700" />
          <span className="text-sm font-semibold text-slate-800">完整处理链路</span>
        </div>
        <span className="text-xs text-slate-500">{room.name} · {room.subject}</span>
      </div>
      <div className="flex items-start justify-between relative">
        {statusFlow.map((step, i) => {
          const reached = i <= currentIndex
          const isCurrent = step.key === room.status && !isReturned
          const ts = (room as unknown as Record<string, string | undefined>)[statusTimestampField[step.key] ?? ""]
          const operator = (room as unknown as Record<string, string | undefined>)[statusOperatorField[step.key] ?? ""]
          const RoleIcon = roleIconMap[step.role]

          return (
            <div key={step.key} className="flex items-center flex-1 relative z-10">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                  reached
                    ? isCurrent
                      ? "border-teal-600 bg-teal-600 text-white ring-4 ring-teal-200"
                      : "border-teal-400 bg-teal-100 text-teal-700"
                    : "border-slate-300 bg-white text-slate-400"
                )}>
                  <RoleIcon className="w-4.5 h-4.5" />
                </div>
                <span className={cn("text-xs mt-2 whitespace-nowrap font-medium", reached ? "text-teal-700" : "text-slate-400")}>{step.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{roleLabelMap[step.role]}</span>
                {operator && <span className="text-[10px] text-teal-600 font-semibold mt-0.5">{operator}</span>}
                {ts && <span className="text-[10px] text-slate-400 mt-0.5">{formatTime(ts)}</span>}
              </div>
              {i < statusFlow.length - 1 && (
                <div className="flex-1 flex items-center mx-1">
                  <div className="flex-1 h-0.5 bg-slate-200 relative overflow-hidden rounded-full">
                    <div
                      className={cn("absolute inset-y-0 left-0 transition-all duration-500", i < currentIndex ? "bg-teal-500 w-full" : "bg-teal-500 w-0")}
                    />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-0.5 shrink-0" />
                </div>
              )}
            </div>
          )
        })}
        {isReturned && (
          <div className="absolute top-0 right-0 flex items-center">
            <div className="flex-1 h-0.5 bg-red-300 mx-1" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-red-500 bg-red-100 text-red-600 flex items-center justify-center ring-4 ring-red-100 shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs mt-2 text-red-600 font-medium whitespace-nowrap">已退回</span>
              <span className="text-[10px] text-red-500 mt-0.5">{room.returnedBy}</span>
              {room.returnedAt && <span className="text-[10px] text-slate-400 mt-0.5">{formatTime(room.returnedAt)}</span>}
              {room.returnReason && (
                <span className="text-[10px] text-red-500 mt-0.5 max-w-[160px] text-center" title={room.returnReason}>
                  {room.returnReason}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomChainView({ roomId, logs }: { roomId: string; logs: AuditLog[] }) {
  const { examRooms } = useExamStore()
  const room = examRooms.find((r) => r.id === roomId)
  const roomLogs = logs.filter((l) => l.targetId === roomId).sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  if (roomLogs.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-teal-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-700" />
          <span className="text-sm font-semibold text-slate-800">{room?.name ?? roomId}</span>
          <span className="text-xs text-slate-500">· {room?.subject}</span>
        </div>
        <span className="text-[10px] text-slate-400">{roomLogs.length} 条操作记录</span>
      </div>
      <div className="p-4">
        <div className="relative ml-2 border-l-2 border-slate-200 pl-6 space-y-4">
          {roomLogs.map((log, idx) => {
            const RoleIcon = roleIconMap[log.operatorRole]
            const isLast = idx === roomLogs.length - 1
            return (
              <div key={log.id} className="relative">
                <div className={cn(
                  "absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  isLast
                    ? "bg-teal-600 border-teal-600 text-white ring-4 ring-teal-100"
                    : "bg-white border-slate-300 text-slate-400"
                )}>
                  <RoleIcon className="w-2 h-2" />
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-700">{log.operatorName}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", roleColorMap[log.operatorRole])}>
                        {roleLabelMap[log.operatorRole]}
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", actionColorMap[log.action] ?? "bg-slate-100 text-slate-700 border-slate-200")}>
                        {log.action}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatFullTime(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-600">{log.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AuditTrail() {
  const { auditLogs, examRooms } = useExamStore()
  const [roleFilter, setRoleFilter] = useState<OperatorRole | "all">("all")
  const [roomFilter, setRoomFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "chain">("list")

  const roomIds = useMemo(() => {
    const ids = new Set(auditLogs.map((l) => l.targetId))
    return Array.from(ids)
  }, [auditLogs])

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (roleFilter !== "all" && log.operatorRole !== roleFilter) return false
      if (roomFilter !== "all" && log.targetId !== roomFilter) return false
      if (search) {
        const room = examRooms.find((r) => r.id === log.targetId)
        const roomName = room?.name ?? ""
        if (
          !roomName.toLowerCase().includes(search.toLowerCase()) &&
          !log.detail.toLowerCase().includes(search.toLowerCase()) &&
          !log.operatorName.toLowerCase().includes(search.toLowerCase()) &&
          !log.action.toLowerCase().includes(search.toLowerCase())
        ) return false
      }
      return true
    })
  }, [auditLogs, roleFilter, roomFilter, search, examRooms])

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  const stats = useMemo(() => {
    const byRole: Record<OperatorRole, number> = { exam_staff: 0, invigilator: 0, tech_support: 0 }
    auditLogs.forEach((l) => { byRole[l.operatorRole]++ })
    return byRole
  }, [auditLogs])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">流转记录</h1>
          <p className="text-sm text-slate-500 mt-0.5">全链路操作留痕，按角色和时间追溯处理过程</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors",
                viewMode === "list" ? "bg-white text-teal-700 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"
              )}
            >
              列表视图
            </button>
            <button
              onClick={() => setViewMode("chain")}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors",
                viewMode === "chain" ? "bg-white text-teal-700 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"
              )}
            >
              按考场分组
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(roleLabelMap) as [OperatorRole, string][]).map(([role, label]) => {
          const RoleIcon = roleIconMap[role]
          const count = stats[role]
          return (
            <div
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
              className={cn(
                "bg-white rounded-xl p-4 border cursor-pointer transition-all",
                roleFilter === role
                  ? "border-teal-400 bg-teal-50/50 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", roleColorMap[role])}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">操作记录</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 tabular-nums">{count}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 font-medium">筛选：</span>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors",
                roleFilter === tab.value ? "bg-white text-teal-700 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="appearance-none bg-slate-100 border-0 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">全部考场</option>
            {roomIds.map((id) => {
              const room = examRooms.find((r) => r.id === id)
              return <option key={id} value={id}>{room?.name ?? id}</option>
            })}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索考场、操作人、操作内容..."
            className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 条记录</span>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium">时间</th>
                <th className="px-4 py-3 text-left font-medium">操作人</th>
                <th className="px-4 py-3 text-left font-medium">角色</th>
                <th className="px-4 py-3 text-left font-medium">操作类型</th>
                <th className="px-4 py-3 text-left font-medium">关联考场</th>
                <th className="px-4 py-3 text-left font-medium">操作详情</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => {
                const room = examRooms.find((r) => r.id === log.targetId)
                const isExpanded = expandedId === log.id
                const RoleIcon = roleIconMap[log.operatorRole]
                return (
                  <>
                    <tr
                      key={log.id}
                      className={cn(
                        "cursor-pointer hover:bg-teal-50/50 transition-colors border-b border-slate-50",
                        idx % 2 === 1 && "bg-slate-50/50",
                        isExpanded && "bg-teal-50/30"
                      )}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        <Clock className="inline w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center", roleColorMap[log.operatorRole])}>
                            <RoleIcon className="w-3 h-3" />
                          </div>
                          <span className="font-medium">{log.operatorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", roleColorMap[log.operatorRole])}>
                          {roleLabelMap[log.operatorRole]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", actionColorMap[log.action] ?? "bg-slate-100 text-slate-700 border-slate-200")}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                        {room?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[280px] truncate" title={log.detail}>
                        {log.detail}
                      </td>
                      <td className="px-4 py-3">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={cn(idx % 2 === 1 && "bg-slate-50/50", "bg-teal-50/20")}>
                        <td colSpan={7} className="px-6 py-4 border-t border-slate-100">
                          <RoomTimeline room={room} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium text-slate-500">暂无符合条件的操作记录</p>
                    <p className="text-xs text-slate-400 mt-1">请尝试调整筛选条件</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {roomIds
            .filter((id) => roomFilter === "all" || id === roomFilter)
            .map((roomId) => (
              <RoomChainView key={roomId} roomId={roomId} logs={filtered} />
            ))}
          {roomIds.filter((id) => roomFilter === "all" || id === roomFilter).length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500">暂无符合条件的操作记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
