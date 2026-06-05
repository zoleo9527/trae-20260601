import { create } from "zustand"
import type { Complaint, ComplaintStatus, TimelineEntry, Compensation, ReviewConclusion, Role } from "@/types"
import { mockComplaints } from "@/data/mock"

interface CurrentRoleState {
  currentRole: Role
  setCurrentRole: (role: Role) => void
}

interface ComplaintStore {
  complaints: Complaint[]
  filteredStatus: ComplaintStatus | "all"
  setFilteredStatus: (status: ComplaintStatus | "all") => void
  getComplaintById: (id: string) => Complaint | undefined
  addTimelineEntry: (complaintId: string, entry: TimelineEntry) => void
  setCompensation: (complaintId: string, compensation: Compensation) => void
  confirmCompensation: (complaintId: string, confirmedBy: string) => void
  closeComplaint: (complaintId: string) => void
  setReviewConclusion: (complaintId: string, conclusion: ReviewConclusion) => void
  filteredComplaints: () => Complaint[]
}

export const useCurrentRole = create<CurrentRoleState>((set) => ({
  currentRole: "cs",
  setCurrentRole: (role) => set({ currentRole: role }),
}))

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

  confirmCompensation: (complaintId, confirmedBy) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId && c.compensation
          ? {
              ...c,
              compensation: {
                ...c.compensation,
                confirmedBy,
                confirmedAt: new Date().toLocaleString("zh-CN"),
              },
              status: "processing" as ComplaintStatus,
            }
          : c
      ),
    })),

  closeComplaint: (complaintId) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId ? { ...c, status: "closed" as ComplaintStatus } : c
      ),
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
