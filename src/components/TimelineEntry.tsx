import type { Role } from "@/types"
import { ROLE_LABELS, ROLE_COLORS } from "@/types"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

const roleAvatars: Record<Role, string> = {
  cs: "👤",
  florist: "🌸",
  dispatcher: "🚚",
}

interface TimelineEntryProps {
  id: string
  role: Role
  author: string
  content: string
  timestamp: string
  isInternal: boolean
}

export default function TimelineEntry({ role, author, content, timestamp, isInternal }: TimelineEntryProps) {
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0",
            "bg-white shadow-sm border-2",
            ROLE_COLORS[role] ? `border-current` : "border-moss-200"
          )}
          style={{ color: roleAvatars[role] ? undefined : undefined }}
        >
          <span className="text-lg leading-none">{roleAvatars[role]}</span>
        </div>
        <div className="w-0.5 flex-1 bg-moss-100 mt-2 group-last:bg-transparent" />
      </div>

      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-moss-900">{author}</span>
          <span
            className={cn(
              "px-1.5 py-0 rounded text-xs font-medium",
              role === "cs" && "bg-brand-50 text-brand-600",
              role === "florist" && "bg-moss-50 text-moss-600",
              role === "dispatcher" && "bg-honey-50 text-honey-500"
            )}
          >
            {ROLE_LABELS[role]}
          </span>
          {isInternal && (
            <span className="px-1.5 py-0 rounded text-xs bg-moss-50 text-moss-500 border border-moss-100">
              内部
            </span>
          )}
          <span className="text-xs text-moss-400 ml-auto">{timestamp}</span>
        </div>
        <div
          className={cn(
            "rounded-lg p-3.5 text-sm leading-relaxed",
            isInternal
              ? "bg-moss-50/50 text-moss-700 border border-moss-100/50"
              : "bg-white text-moss-800 border border-moss-100 shadow-sm"
          )}
        >
          {content}
        </div>
      </div>
    </div>
  )
}
