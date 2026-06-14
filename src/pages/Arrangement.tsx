import { useState } from "react"
import { useExamStore } from "@/store"
import { cn } from "@/lib/utils"
import { Building2, Calendar, Clock, Users, Save, Send, CheckSquare, Square, SendHorizonal, AlertTriangle, ListChecks, ChevronRight, UserCheck, Shield, CheckCircle2 } from "lucide-react"
import type { RoomStatus, ExamRoom, OperatorRole } from "@/data/types"

const statusConfig: Record<RoomStatus, { label: string; color: string; step: number }> = {
  pending: { label: "待编排", color: "bg-slate-100 text-slate-700", step: 0 },
  arranged: { label: "已编排", color: "bg-blue-100 text-blue-700", step: 1 },
  submitted: { label: "已提交", color: "bg-teal-100 text-teal-700", step: 2 },
  returned: { label: "已退回", color: "bg-red-100 text-red-700", step: -1 },
  confirmed: { label: "已确认", color: "bg-green-100 text-green-700", step: 3 },
}

const workflowSteps = [
  { key: "pending", label: "待编排", role: "考务专员" as OperatorRole, icon: ListChecks },
  { key: "arranged", label: "已编排", role: "考务专员" as OperatorRole, icon: Save },
  { key: "submitted", label: "已提交", role: "考务专员" as OperatorRole, icon: Send },
  { key: "confirmed", label: "已确认", role: "监考老师" as OperatorRole, icon: CheckCircle2 },
]

const roleIconMap: Record<OperatorRole, typeof Shield> = {
  exam_staff: Shield,
  invigilator: UserCheck,
  tech_support: AlertTriangle,
}

type FormData = Pick<ExamRoom, "capacity" | "subject" | "examDate" | "timeSlot" | "building" | "floor" | "rows" | "cols">

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function StatusTimeline({ room }: { room: ExamRoom }) {
  const currentStep = statusConfig[room.status].step
  const isReturned = room.status === "returned"

  return (
    <div className="bg-gradient-to-r from-teal-50 to-slate-50 rounded-xl p-4 mb-6 border border-teal-100">
      <div className="text-xs font-semibold text-teal-800 mb-3 flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" />
        状态流转
      </div>
      <div className="flex items-center justify-between relative">
        {workflowSteps.map((step, i) => {
          const reached = i <= currentStep
          const isCurrent = step.key === room.status
          const StepIcon = step.icon
          const RoleIcon = roleIconMap[step.role]
          const timestamp = (room as unknown as Record<string, string | undefined>)[`${step.key}At`]
          const operator = (room as unknown as Record<string, string | undefined>)[`${step.key}By`]

          return (
            <div key={step.key} className="flex items-center flex-1 relative z-10">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  reached
                    ? isCurrent
                      ? "bg-teal-600 border-teal-600 text-white ring-4 ring-teal-200"
                      : "bg-teal-100 border-teal-300 text-teal-700"
                    : "bg-white border-slate-200 text-slate-400"
                )}>
                  <StepIcon className="w-4.5 h-4.5" />
                </div>
                <div className="text-center mt-2">
                  <div className={cn("text-xs font-medium", reached ? "text-teal-700" : "text-slate-400")}>{step.label}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <RoleIcon className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500">{step.role}</span>
                  </div>
                  {timestamp && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatTime(timestamp)}</div>
                  )}
                  {operator && (
                    <div className="text-[10px] text-teal-600 font-medium mt-0.5">{operator}</div>
                  )}
                </div>
              </div>
              {i < workflowSteps.length - 1 && (
                <div className="flex-1 flex items-center mx-1">
                  <div className="flex-1 h-0.5 bg-slate-200 relative overflow-hidden rounded-full">
                    <div
                      className={cn("absolute inset-y-0 left-0 transition-all duration-500", i < currentStep ? "bg-teal-500 w-full" : "bg-teal-500 w-0")}
                    />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5 shrink-0" />
                </div>
              )}
            </div>
          )
        })}
        {isReturned && (
          <div className="absolute top-0 right-0 flex items-center">
            <div className="flex-1 h-0.5 bg-red-300 mx-1" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-400 text-red-600 flex items-center justify-center ring-4 ring-red-100">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div className="text-center mt-2">
                <div className="text-xs font-medium text-red-600">已退回</div>
                <div className="text-[10px] text-red-500 mt-0.5">{room.returnedBy}</div>
                {room.returnedAt && (
                  <div className="text-[10px] text-slate-400 mt-0.5">{formatTime(room.returnedAt)}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OperationTrail({ roomId }: { roomId: string }) {
  const { auditLogs } = useExamStore()
  const roomLogs = auditLogs.filter((l) => l.targetId === roomId).slice(0, 6)

  if (roomLogs.length === 0) return null

  return (
    <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
        <ListChecks className="w-3.5 h-3.5" />
        操作留痕
      </div>
      <div className="relative ml-2 border-l-2 border-slate-200 pl-4 space-y-3">
        {roomLogs.map((log) => {
          const RoleIcon = roleIconMap[log.operatorRole]
          return (
            <div key={log.id} className="relative">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-white border-2 border-teal-500" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <RoleIcon className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">{log.operatorName}</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-500">{log.action}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{log.detail}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{formatTime(log.timestamp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Arrangement() {
  const { examRooms, arrangeRoom, submitRoom, currentRole, getUnresolvedRisks } = useExamStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<FormData | null>(null)

  const selectedRoom = examRooms.find((r) => r.id === selectedId) ?? null
  const isStaff = currentRole === "exam_staff"
  const canEdit = isStaff && selectedRoom && selectedRoom.status !== "submitted" && selectedRoom.status !== "confirmed"
  const risks = getUnresolvedRisks()

  const selectRoom = (room: ExamRoom) => {
    setSelectedId(room.id)
    setForm({
      capacity: room.capacity,
      subject: room.subject,
      examDate: room.examDate,
      timeSlot: room.timeSlot,
      building: room.building,
      floor: room.floor,
      rows: room.rows,
      cols: room.cols,
    })
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = () => {
    if (!selectedId || !form || !canEdit) return
    arrangeRoom(selectedId, form)
  }

  const handleSubmit = () => {
    if (!selectedId || !canEdit) return
    if (selectedRoom?.status === "pending") {
      arrangeRoom(selectedId, form!)
    }
    submitRoom(selectedId)
  }

  const handleBatchSubmit = () => {
    selectedIds.forEach((id) => {
      const room = examRooms.find((r) => r.id === id)
      if (room && (room.status === "arranged" || room.status === "returned")) {
        submitRoom(id)
      }
    })
    setSelectedIds(new Set())
  }

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const roomsByStatus = {
    returned: examRooms.filter((r) => r.status === "returned"),
    pending: examRooms.filter((r) => r.status === "pending"),
    arranged: examRooms.filter((r) => r.status === "arranged"),
    submitted: examRooms.filter((r) => r.status === "submitted"),
    confirmed: examRooms.filter((r) => r.status === "confirmed"),
  }

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-semibold text-teal-800 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            考场列表
          </h2>
          <p className="text-xs text-slate-500 mt-1">共 {examRooms.length} 个考场 · 按状态分组</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(Object.entries(roomsByStatus) as [keyof typeof roomsByStatus, ExamRoom[]][]).map(([status, rooms]) => {
            if (rooms.length === 0) return null
            const cfg = statusConfig[status as RoomStatus]
            return (
              <div key={status} className="border-b border-slate-100">
                <div className="px-4 py-2 bg-slate-100/50 flex items-center justify-between">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.color)}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{rooms.length} 个</span>
                </div>
                {rooms.map((room) => {
                  const isChecked = selectedIds.has(room.id)
                  const roomRisks = risks.filter((r) => r.roomId === room.id)
                  return (
                    <div
                      key={room.id}
                      onClick={() => selectRoom(room)}
                      className={cn(
                        "px-4 py-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-teal-50/70 transition-colors",
                        selectedId === room.id && "bg-teal-50 border-l-2 border-l-teal-600"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {isStaff && (room.status === "arranged" || room.status === "returned") && (
                          <span onClick={(e) => toggleSelect(room.id, e)} className="mt-0.5 cursor-pointer text-slate-400 hover:text-teal-600">
                            {isChecked ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-slate-800 truncate">{room.name}</span>
                            {roomRisks.length > 0 && (
                              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{room.subject} · {room.examDate}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{room.building} {room.floor}F · {room.capacity}人</p>
                          {room.returnReason && (
                            <p className="text-[10px] text-red-500 mt-1 truncate">⚠ {room.returnReason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        {selectedIds.size > 0 && isStaff && (
          <div className="p-3 border-t border-slate-200 bg-white">
            <button
              onClick={handleBatchSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors shadow-sm"
            >
              <SendHorizonal size={15} />
              批量提交审核（{selectedIds.size}）
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Building2 size={56} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-slate-500">请从左侧选择考场</p>
              <p className="text-xs text-slate-400 mt-1">选择后可查看编排信息和操作留痕</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedRoom.status === "returned" && selectedRoom.returnReason && (
                <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700">监考老师已退回，请修改后重新提交</p>
                    <p className="text-sm text-red-600 mt-1">退回原因：{selectedRoom.returnReason}</p>
                    <p className="text-xs text-red-500 mt-1.5">
                      退回人：{selectedRoom.returnedBy} · {formatTime(selectedRoom.returnedAt!)}
                    </p>
                  </div>
                </div>
              )}

              <StatusTimeline room={selectedRoom} />

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Building2, label: "考场名称", value: selectedRoom.name },
                  { icon: Users, label: "容量", value: `${selectedRoom.capacity} 人` },
                  { icon: Calendar, label: "考试日期", value: selectedRoom.examDate },
                  { icon: Clock, label: "时间段", value: selectedRoom.timeSlot },
                  { icon: Building2, label: "教学楼", value: selectedRoom.building },
                  { icon: Building2, label: "楼层", value: `${selectedRoom.floor}F` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm bg-white px-4 py-3 rounded-lg border border-slate-200">
                    <item.icon size={14} className="text-teal-600 shrink-0" />
                    <span className="text-slate-500 text-xs">{item.label}</span>
                    <span className="font-semibold text-slate-800 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>

              {form && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-teal-800 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4" />
                      编排信息
                    </h3>
                    {!canEdit && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {currentRole === "invigilator" ? "仅查看" : "已提交，不可编辑"}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        { key: "capacity" as const, label: "容量", type: "number", hint: "考场可容纳人数" },
                        { key: "subject" as const, label: "科目", type: "text", hint: "考试科目名称" },
                        { key: "examDate" as const, label: "考试日期", type: "date", hint: "YYYY-MM-DD" },
                        { key: "timeSlot" as const, label: "时间段", type: "text", hint: "如：08:30-10:30" },
                        { key: "building" as const, label: "教学楼", type: "text", hint: "如：教学楼A" },
                        { key: "floor" as const, label: "楼层", type: "number", hint: "所在楼层" },
                        { key: "rows" as const, label: "行数", type: "number", hint: "座位排数" },
                        { key: "cols" as const, label: "列数", type: "number", hint: "座位列数" },
                      ] as const).map(({ key, label, type, hint }) => (
                        <div key={key}>
                          <label className="block text-xs text-slate-600 mb-1 font-medium">{label}</label>
                          <input
                            type={type}
                            value={form[key]}
                            onChange={(e) => updateField(key, type === "number" ? Number(e.target.value) : e.target.value)}
                            disabled={!canEdit}
                            className={cn(
                              "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all",
                              canEdit
                                ? "border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                : "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                            )}
                          />
                          <p className="text-[10px] text-slate-400 mt-1">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <OperationTrail roomId={selectedRoom.id} />
            </div>

            {canEdit && (
              <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-3 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors font-medium"
                >
                  <Save size={15} />
                  保存草稿
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium shadow-sm"
                >
                  <Send size={15} />
                  提交审核
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
