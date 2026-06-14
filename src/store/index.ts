import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ExamRoom, AuditLog, RiskItem, SeatSnapshot, Candidate, OperatorRole, Seat } from "@/data/types"
import { initialExamRooms, initialAuditLogs, initialRiskItems, initialSnapshots, initialCandidates } from "@/data/mock"

interface ExamStore {
  examRooms: ExamRoom[]
  auditLogs: AuditLog[]
  riskItems: RiskItem[]
  snapshots: SeatSnapshot[]
  candidates: Candidate[]
  currentRole: OperatorRole
  currentOperatorId: string
  currentOperatorName: string
  sidebarCollapsed: boolean

  setRole: (role: OperatorRole) => void
  toggleSidebar: () => void

  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void

  arrangeRoom: (roomId: string, data: Partial<Pick<ExamRoom, "capacity" | "subject" | "examDate" | "timeSlot" | "building" | "floor" | "rows" | "cols">>) => void
  submitRoom: (roomId: string) => void
  returnRoom: (roomId: string, reason: string) => void
  confirmRoom: (roomId: string) => void

  assignSeat: (roomId: string, seatId: string, candidateId: string, candidateName: string) => void
  unassignSeat: (roomId: string, seatId: string) => void
  autoAssignSeats: (roomId: string) => void

  resolveRisk: (riskId: string) => void

  addSnapshot: (roomId: string, seats: Seat[], action: string) => void

  getPendingRooms: () => ExamRoom[]
  getArrangedRooms: () => ExamRoom[]
  getSubmittedRooms: () => ExamRoom[]
  getReturnedRooms: () => ExamRoom[]
  getUnresolvedRisks: () => RiskItem[]
  getRecentLogs: (count: number) => AuditLog[]
  getRoomSnapshots: (roomId: string) => SeatSnapshot[]
}

const operatorMap: Record<OperatorRole, { id: string; name: string }> = {
  exam_staff: { id: "staff-1", name: "张考务" },
  invigilator: { id: "inv-1", name: "李监考" },
  tech_support: { id: "tech-1", name: "王技术" },
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      examRooms: initialExamRooms,
      auditLogs: initialAuditLogs,
      riskItems: initialRiskItems,
      snapshots: initialSnapshots,
      candidates: initialCandidates,
      currentRole: "exam_staff",
      currentOperatorId: "staff-1",
      currentOperatorName: "张考务",
      sidebarCollapsed: false,

      setRole: (role) => {
        const op = operatorMap[role]
        set({ currentRole: role, currentOperatorId: op.id, currentOperatorName: op.name })
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      addAuditLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({ auditLogs: [newLog, ...s.auditLogs] }))
      },

      arrangeRoom: (roomId, data) => {
        const { currentOperatorId, currentOperatorName } = get()
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  ...data,
                  status: "arranged" as const,
                  arrangedBy: currentOperatorName,
                  arrangedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
        const room = get().examRooms.find((r) => r.id === roomId)
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "编排考场",
          targetId: roomId,
          targetType: "exam_room",
          detail: `编排考场 ${room?.name ?? roomId}，科目：${room?.subject ?? data.subject}`,
        })
      },

      submitRoom: (roomId) => {
        const { currentOperatorId, currentOperatorName } = get()
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  status: "submitted" as const,
                  submittedBy: currentOperatorName,
                  submittedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
        const room = get().examRooms.find((r) => r.id === roomId)
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "提交考场编排",
          targetId: roomId,
          targetType: "exam_room",
          detail: `提交考场 ${room?.name ?? roomId} 编排审核`,
        })
      },

      returnRoom: (roomId, reason) => {
        const { currentOperatorId, currentOperatorName, examRooms } = get()
        const room = examRooms.find((r) => r.id === roomId)
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  status: "returned" as const,
                  returnedBy: currentOperatorName,
                  returnedAt: new Date().toISOString(),
                  returnReason: reason,
                }
              : r
          ),
        }))
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "退回座位分配",
          targetId: roomId,
          targetType: "seat",
          detail: `退回考场 ${room?.name ?? roomId} 座位分配，原因：${reason}`,
        })
      },

      confirmRoom: (roomId) => {
        const { currentOperatorId, currentOperatorName } = get()
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  status: "confirmed" as const,
                  confirmedBy: currentOperatorName,
                  confirmedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
        const room = get().examRooms.find((r) => r.id === roomId)
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "确认座位分配",
          targetId: roomId,
          targetType: "seat",
          detail: `确认考场 ${room?.name ?? roomId} 座位分配无误`,
        })
      },

      assignSeat: (roomId, seatId, candidateId, candidateName) => {
        const { currentOperatorId, currentOperatorName, examRooms } = get()
        const room = examRooms.find((r) => r.id === roomId)
        const newSeats = room
          ? room.seats.map((seat) =>
              seat.id === seatId
                ? { ...seat, candidateId, candidateName, status: "assigned" as const }
                : seat
            )
          : []
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId
              ? { ...r, seats: newSeats.length ? newSeats : r.seats.map((seat) => seat.id === seatId ? { ...seat, candidateId, candidateName, status: "assigned" as const } : seat) }
              : r
          ),
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, examRoomId: roomId } : c
          ),
        }))
        get().addSnapshot(roomId, newSeats, `手动分配 ${candidateName}`)
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "分配座位",
          targetId: roomId,
          targetType: "seat",
          detail: `将考生 ${candidateName} 分配至考场 ${room?.name ?? roomId} 座位 ${seatId}`,
        })
      },

      unassignSeat: (roomId, seatId) => {
        const { currentOperatorId, currentOperatorName, examRooms } = get()
        const room = examRooms.find((r) => r.id === roomId)
        const seat = room?.seats.find((s) => s.id === seatId)
        const prevCandidateId = seat?.candidateId
        const prevName = seat?.candidateName ?? "未知"
        const newSeats = room
          ? room.seats.map((st) =>
              st.id === seatId
                ? { ...st, candidateId: undefined, candidateName: undefined, status: "empty" as const }
                : st
            )
          : []
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId
              ? { ...r, seats: newSeats.length ? newSeats : r.seats.map((st) => st.id === seatId ? { ...st, candidateId: undefined, candidateName: undefined, status: "empty" as const } : st) }
              : r
          ),
          candidates: s.candidates.map((c) =>
            c.id === prevCandidateId ? { ...c, examRoomId: undefined } : c
          ),
        }))
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "取消座位分配",
          targetId: roomId,
          targetType: "seat",
          detail: `取消考生 ${prevName} 在考场 ${room?.name ?? roomId} 的座位分配`,
        })
      },

      autoAssignSeats: (roomId) => {
        const { currentOperatorId, currentOperatorName, candidates, examRooms } = get()
        const room = examRooms.find((r) => r.id === roomId)
        if (!room) return
        const unassignedCandidates = candidates.filter(
          (c) => c.subject === room.subject && !c.examRoomId
        )
        const emptySeats = room.seats.filter((s) => s.status === "empty")
        const toAssign = unassignedCandidates.slice(0, emptySeats.length)
        const newSeats = room.seats.map((seat) => {
          if (seat.status !== "empty") return seat
          const idx = emptySeats.indexOf(seat)
          if (idx < toAssign.length) {
            return {
              ...seat,
              candidateId: toAssign[idx].id,
              candidateName: toAssign[idx].name,
              status: "assigned" as const,
            }
          }
          return seat
        })
        set((s) => ({
          examRooms: s.examRooms.map((r) =>
            r.id === roomId ? { ...r, seats: newSeats } : r
          ),
          candidates: s.candidates.map((c) => {
            const assigned = toAssign.find((a) => a.id === c.id)
            return assigned ? { ...c, examRoomId: roomId } : c
          }),
        }))
        get().addSnapshot(roomId, newSeats, "自动分配座位")
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "自动分配座位",
          targetId: roomId,
          targetType: "seat",
          detail: `为考场 ${room.name} 自动分配 ${toAssign.length} 个座位`,
        })
      },

      resolveRisk: (riskId) => {
        set((s) => ({
          riskItems: s.riskItems.map((r) =>
            r.id === riskId ? { ...r, resolved: true } : r
          ),
        }))
        const risk = get().riskItems.find((r) => r.id === riskId)
        const { currentOperatorId, currentOperatorName } = get()
        get().addAuditLog({
          operatorId: currentOperatorId,
          operatorName: currentOperatorName,
          operatorRole: get().currentRole,
          action: "解决风险",
          targetId: risk?.roomId ?? "",
          targetType: "exam_room",
          detail: `解决风险项：${risk?.description ?? riskId}`,
        })
      },

      addSnapshot: (roomId, seats, action) => {
        const { currentOperatorName } = get()
        const snap: SeatSnapshot = {
          id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          roomId,
          seats: JSON.parse(JSON.stringify(seats)),
          timestamp: new Date().toISOString(),
          operatorName: currentOperatorName,
          action,
        }
        set((s) => ({ snapshots: [snap, ...s.snapshots] }))
      },

      getPendingRooms: () => get().examRooms.filter((r) => r.status === "pending"),
      getArrangedRooms: () => get().examRooms.filter((r) => r.status === "arranged"),
      getSubmittedRooms: () => get().examRooms.filter((r) => r.status === "submitted"),
      getReturnedRooms: () => get().examRooms.filter((r) => r.status === "returned"),
      getUnresolvedRisks: () => get().riskItems.filter((r) => !r.resolved),
      getRecentLogs: (count) => get().auditLogs.slice(0, count),
      getRoomSnapshots: (roomId) => get().snapshots.filter((s) => s.roomId === roomId),
    }),
    {
      name: "exam-center-store",
    }
  )
)
