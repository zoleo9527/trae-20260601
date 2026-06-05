import type { Complaint } from "@/types"
import { PROBLEM_TYPE_LABELS, PROBLEM_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS } from "@/types"
import { Clock, MapPin, User, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface ComplaintCardProps {
  complaint: Complaint
}

export default function ComplaintCard({ complaint }: ComplaintCardProps) {
  const navigate = useNavigate()

  const urgencyStyles: Record<string, string> = {
    urgent: "border-l-blush-400",
    normal: "border-l-brand-400",
    low: "border-l-moss-300",
  }

  return (
    <div
      onClick={() => navigate(`/complaint/${complaint.id}`)}
      className={cn(
        "bg-white rounded-xl border border-moss-100 card-hover cursor-pointer overflow-hidden",
        "border-l-4",
        urgencyStyles[complaint.urgency]
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="font-serif font-semibold text-moss-900">{complaint.id}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium border",
                PROBLEM_TYPE_COLORS[complaint.problemType]
              )}
            >
              {PROBLEM_TYPE_LABELS[complaint.problemType]}
            </span>
            {complaint.urgency === "urgent" && (
              <span className="flex items-center gap-1 text-blush-500 text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                {URGENCY_LABELS[complaint.urgency]}
              </span>
            )}
          </div>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-medium",
              STATUS_COLORS[complaint.status]
            )}
          >
            {STATUS_LABELS[complaint.status]}
          </span>
        </div>

        <p className="text-sm text-moss-800/80 mb-3 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-moss-700/60">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {complaint.customerName}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {complaint.deliveryAddress.substring(0, 12)}…
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {complaint.createdAt}
          </span>
          <span className="ml-auto text-moss-500">
            处理人: {complaint.assignee}
          </span>
        </div>
      </div>

      {complaint.compensation && (
        <div className="px-5 py-2.5 bg-cream/50 border-t border-moss-50 flex items-center justify-between">
          <span className="text-xs text-moss-600">
            补偿方案: {complaint.compensation.type === "reflower" ? "补花" : complaint.compensation.type === "refund" ? "退款" : "优惠券"}
            {complaint.compensation.amount > 0 && ` ¥${complaint.compensation.amount}`}
          </span>
          {complaint.compensation.confirmedAt ? (
            <span className="text-xs text-moss-400">已确认</span>
          ) : (
            <span className="text-xs text-honey-500">待确认</span>
          )}
        </div>
      )}
    </div>
  )
}
