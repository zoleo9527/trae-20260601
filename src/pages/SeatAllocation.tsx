import { useState, useMemo } from "react"
import { useExamStore } from "@/store"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  Zap,
  CheckCircle2,
  RotateCcw,
  UserPlus,
  X,
  History,
  ListChecks,
  Shield,
  UserCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Diff,
} from "lucide-react"
import type { OperatorRole, SeatSnapshot, Seat } from "@/data/types"

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

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function HandoverInfo({ roomId }: { roomId: string }) {
  const { examRooms, auditLogs } = useExamStore()
  const room = examRooms.find((r) => r.id === roomId)
  if (!room) return null

  const roomLogs = auditLogs.filter((l) => l.targetId === roomId).slice(0, 5)

  return (
    <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-xl p-4 border border-slate-200 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-4 h-4 text-teal-700" />
        <span className="text-sm font-semibold text-slate-800">交接信息</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-medium text-slate-600">编排人</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{room.arrangedBy ?? "-"}</p>
          {room.arrangedAt && (
            <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(room.arrangedAt)}</p>
          )}
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-slate-600">提交人</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{room.submittedBy ?? "-"}</p>
          {room.submittedAt && (
            <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(room.submittedAt)}</p>
          )}
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-medium text-slate-600">确认人</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{room.confirmedBy ?? "待确认"}</p>
          {room.confirmedAt && (
            <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(room.confirmedAt)}</p>
          )}
          {!room.confirmedAt && room.status === "submitted" && (
            <p className="text-[10px] text-amber-600 mt-0.5">等待监考老师确认</p>
          )}
        </div>
      </div>
      {room.returnedBy && (
        <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-1.5 mb-1">
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs font-medium text-red-700">退回记录</span>
          </div>
          <p className="text-sm text-red-800">
            <span className="font-semibold">{room.returnedBy}</span>
            <span className="text-red-500 mx-1">于</span>
            <span className="font-medium">{formatTime(room.returnedAt!)}</span>
            <span className="text-red-500 mx-1">退回</span>
          </p>
          <p className="text-xs text-red-600 mt-1">原因：{room.returnReason}</p>
        </div>
      )}
      {roomLogs.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-slate-600 mb-2">最近操作</div>
          <div className="space-y-1.5">
            {roomLogs.map((log) => {
              const RoleIcon = roleIconMap[log.operatorRole]
              return (
                <div key={log.id} className="flex items-center gap-2 text-xs">
                  <RoleIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">{log.operatorName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">{log.action}</span>
                  <span className="text-slate-400 ml-auto">{formatTime(log.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SnapshotViewer({
  snapshots,
  viewingSnapshotId,
  onSelect,
  onClose,
}: {
  snapshots: SeatSnapshot[]
  viewingSnapshotId: string | null
  onSelect: (id: string | null) => void
  onClose: () => void
}) {
  const [compareId, setCompareId] = useState<string | null>(null)

  if (snapshots.length === 0) return null

  const viewingSnapshot = snapshots.find((s) => s.id === viewingSnapshotId)
  const compareSnapshot = compareId ? snapshots.find((s) => s.id === compareId) : null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-teal-700" />
          <span className="text-sm font-semibold text-slate-800">座位分配回看</span>
          <span className="text-xs text-slate-500">· 共 {snapshots.length} 个历史快照</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          关闭
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {snapshots.map((snap) => {
          const isViewing = viewingSnapshotId === snap.id
          const isComparing = compareId === snap.id
          return (
            <button
              key={snap.id}
              onClick={() => {
                if (isViewing) {
                  onSelect(null)
                  setCompareId(null)
                } else if (viewingSnapshotId && !compareId) {
                  setCompareId(snap.id)
                } else {
                  onSelect(snap.id)
                  setCompareId(null)
                }
              }}
              className={cn(
                "shrink-0 px-3 py-2 rounded-lg border text-left transition-all",
                isViewing && !isComparing && "bg-teal-50 border-teal-400 ring-2 ring-teal-200",
                isComparing && "bg-blue-50 border-blue-400 ring-2 ring-blue-200",
                !isViewing && !isComparing && "bg-slate-50 border-slate-200 hover:border-teal-300"
              )}
            >
              <div className="flex items-center gap-1.5">
                {isViewing && <Eye className="w-3 h-3 text-teal-600" />}
                {isComparing && <Diff className="w-3 h-3 text-blue-600" />}
                <span className={cn(
                  "text-xs font-medium",
                  isViewing ? "text-teal-800" : isComparing ? "text-blue-800" : "text-slate-700"
                )}>
                  {snap.action}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {snap.operatorName} · {formatTime(snap.timestamp)}
              </div>
            </button>
          )
        })}
      </div>

      {viewingSnapshot && (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-medium text-slate-700">
                {viewingSnapshot.action}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {viewingSnapshot.operatorName} · {formatTime(viewingSnapshot.timestamp)}
            </span>
          </div>
          {compareSnapshot && (
            <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
              <Diff className="w-3 h-3 text-blue-600" />
              正在对比：{compareSnapshot.action}（{compareSnapshot.operatorName}）
            </div>
          )}
          <div className="grid grid-cols-8 gap-1">
            {viewingSnapshot.seats.slice(0, 32).map((seat) => {
              const compareSeat = compareSnapshot?.seats.find(
                (s) => s.row === seat.row && s.col === seat.col
              )
              const hasDiff = compareSeat && compareSeat.status !== seat.status
              return (
                <div
                  key={seat.id}
                  className={cn(
                    "h-8 rounded text-[9px] flex items-center justify-center font-medium",
                    hasDiff && "ring-2 ring-amber-400",
                    seat.status === "empty" && "bg-slate-200 text-slate-500",
                    seat.status === "assigned" && "bg-teal-200 text-teal-800",
                    seat.status === "conflict" && "bg-red-200 text-red-800"
                  )}
                  title={`${seat.row + 1}排${seat.col + 1}列${seat.candidateName ? " · " + seat.candidateName : ""}`}
                >
                  {seat.candidateName?.slice(0, 1) || "·"}
                </div>
              )
            })}
          </div>
          {viewingSnapshotId && (
            <button
              onClick={() => onSelect(null)}
              className="mt-2 text-xs text-teal-600 hover:underline"
            >
              ← 返回当前分配
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function SeatAllocation() {
  const {
    examRooms,
    candidates,
    currentRole,
    currentOperatorName,
    assignSeat,
    unassignSeat,
    autoAssignSeats,
    confirmRoom,
    returnRoom,
    addSnapshot,
    getUnresolvedRisks,
  } = useExamStore()

  const [selectedRoomId, setSelectedRoomId] = useState(examRooms[0]?.id ?? "")
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [returnReason, setReturnReason] = useState("")
  const [showReturnInput, setShowReturnInput] = useState(false)
  const [viewingSnapshotId, setViewingSnapshotId] = useState<string | null>(null)
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false)
  const [hoveredSeat, setHoveredSeat] = useState<{ id: string; x: number; y: number } | null>(null)

  const room = examRooms.find((r) => r.id === selectedRoomId)
  const snapshots = useExamStore((s) => s.snapshots.filter((sn) => sn.roomId === selectedRoomId))
  const risks = getUnresolvedRisks()
  const roomRisks = risks.filter((r) => r.roomId === selectedRoomId)

  const viewingSnapshot = snapshots.find((s) => s.id === viewingSnapshotId)
  const displaySeats = viewingSnapshot ? viewingSnapshot.seats : room?.seats ?? []

  const unassignedCandidates = useMemo(() => {
    if (!room) return []
    return candidates.filter((c) => c.subject === room.subject && !c.examRoomId)
  }, [candidates, room])

  const assignedCount = displaySeats.filter((s) => s.status === "assigned").length
  const conflictCount = displaySeats.filter((s) => s.status === "conflict").length
  const emptyCount = displaySeats.filter((s) => s.status === "empty").length

  const seatGrid = useMemo(() => {
    if (!room) return []
    const grid: (Seat)[][] = []
    for (let r = 0; r < room.rows; r++) {
      const row: Seat[] = []
      for (let c = 0; c < room.cols; c++) {
        const seat = displaySeats.find((s) => s.row === r && s.col === c)
        row.push(seat ?? { id: `empty-${r}-${c}`, row: r, col: c, status: "empty" as const })
      }
      grid.push(row)
    }
    return grid
  }, [room, displaySeats])

  const handleSeatClick = (seatId: string, status: string, candidateId?: string, candidateName?: string) => {
    if (viewingSnapshot) return
    if (currentRole !== "exam_staff") return

    if (status === "assigned" && candidateId) {
      if (confirm(`确定取消 ${candidateName ?? "该考生"} 的座位分配？`)) {
        unassignSeat(selectedRoomId, seatId)
      }
    } else if (status === "empty" && selectedCandidateId) {
      const candidate = candidates.find((c) => c.id === selectedCandidateId)
      if (candidate) {
        assignSeat(selectedRoomId, seatId, candidate.id, candidate.name)
        addSnapshot(selectedRoomId, room!.seats, `手动分配 ${candidate.name}`)
        setSelectedCandidateId(null)
      }
    }
  }

  const handleAutoAssign = () => {
    if (!room) return
    autoAssignSeats(selectedRoomId)
  }

  const handleConfirm = () => {
    if (conflictCount > 0) {
      if (!confirm(`存在 ${conflictCount} 个冲突座位，确定要确认吗？`)) return
    }
    confirmRoom(selectedRoomId)
  }

  const handleReturn = () => {
    if (!returnReason.trim()) return
    returnRoom(selectedRoomId, returnReason)
    setReturnReason("")
    setShowReturnInput(false)
  }

  const isStaff = currentRole === "exam_staff"
  const isInvigilator = currentRole === "invigilator"
  const canEdit = isStaff && room && room.status !== "submitted" && room.status !== "confirmed"
  const canConfirm = isInvigilator && room?.status === "submitted"
  const canReturn = isInvigilator && room?.status === "submitted"

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="relative">
          <select
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value)
              setViewingSnapshotId(null)
              setSelectedCandidateId(null)
              setShowSnapshotPanel(false)
            }}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {examRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} - {r.subject} ({r.status === "pending" ? "待编排" : r.status === "arranged" ? "已编排" : r.status === "submitted" ? "待确认" : r.status === "returned" ? "已退回" : "已确认"})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {roomRisks.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">{roomRisks.length} 个风险项</span>
          </div>
        )}

        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-slate-600">已分配 <span className="font-semibold text-slate-800">{assignedCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-slate-600">空 <span className="font-semibold text-slate-800">{emptyCount}</span></span>
          </div>
          {conflictCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-600">冲突 <span className="font-semibold text-red-600">{conflictCount}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {canEdit && (
            <button
              onClick={handleAutoAssign}
              disabled={!!viewingSnapshot}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" /> 自动分配
            </button>
          )}
          <button
            onClick={() => setShowSnapshotPanel(!showSnapshotPanel)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              showSnapshotPanel
                ? "bg-teal-100 text-teal-700 border border-teal-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            )}
          >
            <History className="w-4 h-4" /> 回看快照
            {snapshots.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-teal-600 text-white text-[10px] rounded-full">
                {snapshots.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 overflow-auto flex-1">
          {room && (
            <>
              <HandoverInfo roomId={selectedRoomId} />

              {showSnapshotPanel && (
                <SnapshotViewer
                  snapshots={snapshots}
                  viewingSnapshotId={viewingSnapshotId}
                  onSelect={setViewingSnapshotId}
                  onClose={() => { setShowSnapshotPanel(false); setViewingSnapshotId(null) }}
                />
              )}

              {viewingSnapshot && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <Eye className="w-4 h-4 text-teal-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-teal-800">
                      正在查看历史快照：{viewingSnapshot.action}
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      操作人：{viewingSnapshot.operatorName} · {formatTime(viewingSnapshot.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingSnapshotId(null)}
                    className="text-xs bg-white px-3 py-1.5 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    返回当前
                  </button>
                </div>
              )}

              {room.status === "returned" && room.returnReason && (
                <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700">监考老师已退回，请调整后重新提交</p>
                    <p className="text-sm text-red-600 mt-1">退回原因：{room.returnReason}</p>
                    <p className="text-xs text-red-500 mt-1.5">
                      退回人：{room.returnedBy} · {formatTime(room.returnedAt!)}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-1 bg-slate-800 text-white text-sm rounded-full mb-2">
                    讲 台
                  </div>
                  <div className="text-sm text-slate-500">
                    {room.name} · {room.building} {room.floor}F · {room.subject}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {seatGrid.map((row, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <span className="w-6 text-xs text-slate-400 text-right">{ri + 1}排</span>
                      <div className="flex gap-2">
                        {row.map((seat) => (
                          <div
                            key={seat.id}
                            onMouseEnter={(e) => setHoveredSeat({ id: seat.id, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoveredSeat(null)}
                            onClick={() => handleSeatClick(seat.id, seat.status, seat.candidateId, seat.candidateName)}
                            className={cn(
                              "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs cursor-pointer transition-all relative group",
                              !canEdit && "cursor-default",
                              seat.status === "empty" && "bg-slate-50 border-slate-200 hover:border-teal-400 hover:bg-teal-50",
                              seat.status === "assigned" && "bg-teal-50 border-teal-300 hover:border-teal-500 hover:bg-teal-100",
                              seat.status === "conflict" && "bg-red-50 border-red-300 hover:border-red-500 hover:bg-red-100",
                              selectedCandidateId && seat.status === "empty" && canEdit && "border-teal-400 bg-teal-100 animate-pulse",
                              viewingSnapshot && "opacity-80"
                            )}
                          >
                            <span className={cn(
                              "font-semibold truncate px-0.5",
                              seat.status === "empty" && "text-slate-400",
                              seat.status === "assigned" && "text-teal-700",
                              seat.status === "conflict" && "text-red-700"
                            )}>
                              {seat.status === "empty"
                                ? `${seat.col + 1}`
                                : (seat.candidateName?.slice(0, 2) ?? "✓")}
                            </span>
                            {hoveredSeat?.id === seat.id && (
                              <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none shadow-xl">
                                <div className="font-medium">第{seat.row + 1}排{seat.col + 1}列</div>
                                {seat.candidateName && (
                                  <div className="text-teal-300 mt-0.5">{seat.candidateName}</div>
                                )}
                                {seat.candidateId && (
                                  <div className="text-slate-400 text-[10px]">{seat.candidateId}</div>
                                )}
                                {seat.status === "conflict" && (
                                  <div className="text-red-400 mt-0.5">⚠ 座位冲突</div>
                                )}
                                {canEdit && seat.status === "empty" && !selectedCandidateId && (
                                  <div className="text-slate-400 text-[10px] mt-0.5">从右侧选择考生后点击分配</div>
                                )}
                                {canEdit && seat.status === "assigned" && (
                                  <div className="text-amber-400 text-[10px] mt-0.5">点击取消分配</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-4 h-4 rounded bg-slate-50 border border-slate-200" /> 空座位
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-4 h-4 rounded bg-teal-50 border border-teal-300" /> 已分配
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-4 h-4 rounded bg-red-50 border border-red-300" /> 冲突
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={cn(
          "border-l border-slate-200 bg-white transition-all duration-300 flex flex-col absolute right-0 top-14 bottom-14 z-20 shadow-xl",
          drawerOpen ? "w-72" : "w-12"
        )}>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex items-center justify-center py-3 border-b border-slate-100 text-slate-400 hover:text-teal-600 transition-colors"
          >
            {drawerOpen ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          </button>
          {drawerOpen && (
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  未分配考生
                </div>
                <span className="text-[10px] text-slate-400">{unassignedCandidates.length} 人</span>
              </div>
              {!canEdit && (
                <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 mb-3">
                  当前角色或状态不可编辑座位
                </div>
              )}
              {unassignedCandidates.length === 0 && (
                <div className="text-xs text-slate-400 py-8 text-center">
                  暂无待分配考生
                </div>
              )}
              {unassignedCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => canEdit && setSelectedCandidateId(selectedCandidateId === c.id ? null : c.id)}
                  disabled={!canEdit}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1.5 transition-all",
                    !canEdit && "opacity-50 cursor-not-allowed",
                    selectedCandidateId === c.id
                      ? "bg-teal-100 text-teal-800 font-semibold ring-2 ring-teal-400"
                      : "bg-slate-50 text-slate-700 hover:bg-teal-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{c.name}</span>
                    {selectedCandidateId === c.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.id}</div>
                </button>
              ))}
              {selectedCandidateId && canEdit && (
                <div className="mt-3 text-xs text-teal-700 bg-teal-50 rounded-lg p-3 border border-teal-200">
                  ✓ 已选择考生，请点击空座位完成分配
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {canConfirm && (
        <div className="flex items-center gap-3 px-5 py-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-sm font-medium text-slate-800">监考老师确认</p>
              <p className="text-xs text-slate-500">当前操作人：{currentOperatorName}</p>
            </div>
          </div>
          <div className="flex-1" />
          {canConfirm && !showReturnInput && (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> 确认分配无误
            </button>
          )}
          {canReturn && !showReturnInput && (
            <button
              onClick={() => setShowReturnInput(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> 退回修改
            </button>
          )}
          {showReturnInput && (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="请输入退回原因（必填）..."
                className="flex-1 px-4 py-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <button
                onClick={handleReturn}
                disabled={!returnReason.trim()}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                确认退回
              </button>
              <button
                onClick={() => { setShowReturnInput(false); setReturnReason("") }}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
