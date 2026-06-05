import { useState } from "react"
import type { Complaint, RootCause } from "@/types"
import { ROOT_CAUSE_LABELS } from "@/types"
import { useComplaintStore, useCurrentRole } from "@/store/complaintStore"
import { ROLE_LABELS } from "@/types"
import { Flower2, Truck, FileText, HelpCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const rootCauseOptions: { value: RootCause; icon: React.ReactNode; color: string }[] = [
  { value: "production", icon: <Flower2 className="w-4 h-4" />, color: "text-moss-600 bg-moss-50 border-moss-200" },
  { value: "delivery", icon: <Truck className="w-4 h-4" />, color: "text-honey-500 bg-honey-50 border-honey-200" },
  { value: "note_understanding", icon: <FileText className="w-4 h-4" />, color: "text-brand-600 bg-brand-50 border-brand-200" },
  { value: "other", icon: <HelpCircle className="w-4 h-4" />, color: "text-moss-500 bg-moss-50 border-moss-200" },
]

interface ReviewFormProps {
  complaint: Complaint
}

export default function ReviewForm({ complaint }: ReviewFormProps) {
  const setReviewConclusion = useComplaintStore((s) => s.setReviewConclusion)
  const currentRole = useCurrentRole((s) => s.currentRole)
  const [rootCause, setRootCause] = useState<RootCause>(complaint.reviewConclusion?.rootCause || "production")
  const [improvement, setImprovement] = useState(complaint.reviewConclusion?.improvement || "")

  const handleSubmit = () => {
    if (!improvement.trim()) return
    setReviewConclusion(complaint.id, {
      rootCause,
      improvement: improvement.trim(),
      reviewedBy: ROLE_LABELS[currentRole],
      reviewedAt: new Date().toLocaleString("zh-CN"),
    })
  }

  if (complaint.reviewConclusion) {
    return (
      <div className="bg-white rounded-xl border border-moss-100 p-5">
        <h3 className="font-serif text-lg font-semibold text-moss-900 mb-4">复盘结论</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-moss-500" />
            <span className="text-sm font-medium text-moss-700">
              问题归因: {ROOT_CAUSE_LABELS[complaint.reviewConclusion.rootCause]}
            </span>
          </div>
          <p className="text-sm text-moss-600 pl-6">
            {complaint.reviewConclusion.improvement}
          </p>
          <p className="text-xs text-moss-400 pl-6">
            复盘人: {complaint.reviewConclusion.reviewedBy} · {complaint.reviewConclusion.reviewedAt}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-moss-100 p-5">
      <h3 className="font-serif text-lg font-semibold text-moss-900 mb-4">记录复盘结论</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-moss-700 mb-2.5">问题归因</label>
        <div className="grid grid-cols-2 gap-2">
          {rootCauseOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRootCause(opt.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                rootCause === opt.value
                  ? opt.color
                  : "bg-white border-moss-100 text-moss-500 hover:border-moss-200"
              )}
            >
              {opt.icon}
              {ROOT_CAUSE_LABELS[opt.value]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-moss-700 mb-2">改进措施</label>
        <textarea
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-moss-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 resize-none"
          placeholder="描述改进措施，防止同类问题再次发生…"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!improvement.trim()}
        className="w-full px-4 py-2.5 rounded-lg bg-moss-700 text-white text-sm font-medium hover:bg-moss-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        提交复盘结论
      </button>
    </div>
  )
}
