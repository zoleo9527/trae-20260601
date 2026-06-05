import type { ComplaintStatus } from "@/types"
import { STATUS_LABELS, STATUS_COLORS } from "@/types"
import { cn } from "@/lib/utils"

const statuses: (ComplaintStatus | "all")[] = ["all", "pending", "processing", "closed", "reviewed"]
const statusLabels: Record<ComplaintStatus | "all", string> = {
  all: "全部",
  ...STATUS_LABELS,
}

interface StatusFilterProps {
  active: ComplaintStatus | "all"
  onChange: (status: ComplaintStatus | "all") => void
  counts: Record<ComplaintStatus | "all", number>
}

export default function StatusFilter({ active, onChange, counts }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border",
            active === status
              ? "bg-brand-500 text-white border-brand-500 shadow-sm"
              : "bg-white text-moss-800/70 border-moss-100 hover:border-brand-200 hover:text-brand-600"
          )}
        >
          {statusLabels[status]}
          <span
            className={cn(
              "text-xs px-1.5 py-0 rounded-full leading-none",
              active === status
                ? "bg-white/25 text-white"
                : status !== "all" && STATUS_COLORS[status]
            )}
          >
            {counts[status]}
          </span>
        </button>
      ))}
    </div>
  )
}
