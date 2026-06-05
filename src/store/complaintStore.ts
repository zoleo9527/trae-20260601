import { create } from "zustand"
import type { Complaint, ComplaintStatus, TimelineEntry, Compensation, ReviewConclusion, Role } from "@/types"
import { COMPENSATION_LABELS, ROLE_DEFAULT_NAMES } from "@/types"
import { mockComplaints } from "@/data/mock"

interface CurrentRoleState {
  currentRole: Role
  currentPersonName: string
  setCurrentRole: (role: Role) => void
}

interface ComplaintStore {
  complaints: Complaint[]
  filteredStatus: ComplaintStatus | "all"
  setFilteredStatus: (status: ComplaintStatus | "all") => void
  getComplaintById: (id: string) => Complaint | undefined
  addTimelineEntry: (complaintId: string, entry: TimelineEntry) => void
  setCompensation: (complaintId: string, compensation: Compensation) => void
  confirmCompensation: (complaintId: string, confirmedBy: string, role: Role) => void
  closeComplaint: (complaintId: string, reason: string, closedBy: string, role: Role) => void
  setReviewConclusion: (complaintId: string, conclusion: ReviewConclusion) => void
  filteredComplaints: () => Complaint[]
}

export const useCurrentRole = create<CurrentRoleState>((set) => ({
  currentRole: "cs",
  currentPersonName: ROLE_DEFAULT_NAMES.cs,
  setCurrentRole: (role) =>
    set({ currentRole: role, currentPersonName: ROLE_DEFAULT_NAMES[role] }),
}))

function makeTimelineEntry(role: Role, author: string, content: string): TimelineEntry {
  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    author,
    content,
    timestamp: new Date().toLocaleString("zh-CN"),
    isInternal: true,
  }
}

export const useComplaintStore = create<ComplaintStore>((set, get) => ({
  complaints: mockComplaints,
  filteredStatus: "all",

  setFilteredStatus: (status) => set({ filteredStatus: status }),

  getComplaintById: (id) => get().complaints.find((c) => c.id === id),

  filteredComplaints: () => {
    const { complaints, filteredStatus } = get()
    if (filteredStatus === "all") return complaints
    return complaints.filter((c) => c.status === filteredStatus)
  },

  addTimelineEntry: (complaintId, entry) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              timeline: [...c.timeline, entry],
              status: c.status === "pending" ? "processing" : c.status,
            }
          : c
      ),
    })),

  setCompensation: (complaintId, compensation) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId ? { ...c, compensation } : c
      ),
    })),

  confirmCompensation: (complaintId, confirmedBy, role) =>
    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== complaintId || !c.compensation) return c
        const now = new Date().toLocaleString("zh-CN")
        const compLabel = COMPENSATION_LABELS[c.compensation.type]
        const amountStr = c.compensation.amount > 0 ? ` ¥${c.compensation.amount}` : ""
        const entry = makeTimelineEntry(
          role,
          confirmedBy,
          `已确认补偿方案：${compLabel}${amountStr}。原因：${c.compensation.reason}`
        )
        return {
          ...c,
          compensation: {
            ...c.compensation,
            confirmedBy,
            confirmedAt: now,
          },
          timeline: [...c.timeline, entry],
          status: "processing" as ComplaintStatus,
        }
      }),
    })),

  closeComplaint: (complaintId, reason, closedBy, role) =>
    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== complaintId) return c
        const now = new Date().toLocaleString("zh-CN")
        const entry = makeTimelineEntry(
          role,
          closedBy,
          `售后已关闭。关闭原因：${reason}`
        )
        return {
          ...c,
          status: "closed" as ComplaintStatus,
          closeReason: reason,
          closedAt: now,
          closedBy,
          timeline: [...c.timeline, entry],
        }
      }),
    })),

  setReviewConclusion: (complaintId, conclusion) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId
          ? { ...c, reviewConclusion: conclusion, status: "reviewed" as ComplaintStatus }
          : c
      ),
    })),
}))
