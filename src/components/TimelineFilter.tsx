import type { Role, TimelineEntry } from "@/types"
import { ROLE_LABELS } from "@/types"
import { cn } from "@/lib/utils"
import { Filter, Eye, EyeOff } from "lucide-react"

export type RoleFilter = Role | "all"
export type VisibilityFilter = "all" | "customer_visible" | "internal_only"

interface TimelineFilterProps {
  entries: TimelineEntry[]
  roleFilter: RoleFilter
  setRoleFilter: (f: RoleFilter) => void
  visibilityFilter: VisibilityFilter
  setVisibilityFilter: (f: VisibilityFilter) => void
}

export function filterTimeline(
  entries: TimelineEntry[],
  roleFilter: RoleFilter,
  visibilityFilter: VisibilityFilter
): TimelineEntry[] {
  return entries.filter((e) => {
    if (roleFilter !== "all" && e.role !== roleFilter) return false
    if (visibilityFilter === "customer_visible" && e.isInternal) return false
    if (visibilityFilter === "internal_only" && !e.isInternal) return false
    return true
  })
}

const roleOptions: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "全部角色" },
  { value: "cs", label: ROLE_LABELS.cs },
  { value: "florist", label: ROLE_LABELS.florist },
  { value: "dispatcher", label: ROLE_LABELS.dispatcher },
]

const visibilityOptions: { value: VisibilityFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "全部", icon: <Filter className="w-3 h-3" /> },
  { value: "customer_visible", label: "客户可见", icon: <Eye className="w-3 h-3" /> },
  { value: "internal_only", label: "仅内部", icon: <EyeOff className="w-3 h-3" /> },
]

export default function TimelineFilter({
  roleFilter,
  setRoleFilter,
  visibilityFilter,
  setVisibilityFilter,
}: TimelineFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center gap-1">
        {roleOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              roleFilter === opt.value
                ? "bg-moss-700 text-white"
                : "bg-moss-50 text-moss-600 hover:bg-moss-100"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="w-px h-4 bg-moss-200" />
      <div className="flex items-center gap-1">
        {visibilityOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setVisibilityFilter(opt.value)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              visibilityFilter === opt.value
                ? "bg-moss-700 text-white"
                : "bg-moss-50 text-moss-600 hover:bg-moss-100"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
