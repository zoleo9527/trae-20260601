import StatusFilter from "@/components/StatusFilter"
import ComplaintCard from "@/components/ComplaintCard"
import { useComplaintStore } from "@/store/complaintStore"
import type { ComplaintStatus } from "@/types"
import { Flower2 } from "lucide-react"

export default function ComplaintList() {
  const { filteredStatus, setFilteredStatus, complaints, filteredComplaints } = useComplaintStore()

  const counts: Record<ComplaintStatus | "all", number> = {
    all: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    processing: complaints.filter((c) => c.status === "processing").length,
    closed: complaints.filter((c) => c.status === "closed").length,
    reviewed: complaints.filter((c) => c.status === "reviewed").length,
  }

  const list = filteredComplaints()

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Flower2 className="w-5 h-5 text-brand-500" />
          <h2 className="font-serif text-2xl font-semibold text-moss-900">客诉工单</h2>
        </div>
        <p className="text-sm text-moss-600/60 ml-8">围绕花材、配送、备注三大环节协同处理客诉</p>
      </div>

      <div className="mb-6">
        <StatusFilter active={filteredStatus} onChange={setFilteredStatus} counts={counts} />
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20">
          <Flower2 className="w-12 h-12 text-moss-200 mx-auto mb-4" />
          <p className="text-moss-400 text-sm">暂无该状态的客诉工单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  )
}
