import type { Complaint, Role } from "@/types"
import { ROLE_LABELS, ROLE_COLORS } from "@/types"
import { User } from "lucide-react"

interface CollaboratorSummaryProps {
  complaint: Complaint
}

const ROLE_ORDER: Role[] = ["cs", "florist", "dispatcher"]
const ROLE_AVATARS: Record<Role, string> = {
  cs: "👤",
  florist: "🌸",
  dispatcher: "🚚",
}

export default function CollaboratorSummary({ complaint }: CollaboratorSummaryProps) {
  const collaboratorMap = new Map<Role, Set<string>>()
  for (const entry of complaint.timeline) {
    if (!collaboratorMap.has(entry.role)) {
      collaboratorMap.set(entry.role, new Set())
    }
    collaboratorMap.get(entry.role)!.add(entry.author)
  }

  if (collaboratorMap.size === 0) return null

  return (
    <div className="bg-white rounded-xl border border-moss-100 p-5">
      <h3 className="font-serif text-base font-semibold text-moss-900 mb-3">协作人总览</h3>
      <div className="space-y-3">
        {ROLE_ORDER.map((role) => {
          const names = collaboratorMap.get(role)
          if (!names || names.size === 0) return null
          return (
            <div key={role} className="flex items-center gap-2.5">
              <span className="text-lg leading-none">{ROLE_AVATARS[role]}</span>
              <span
                className={`px-1.5 py-0 rounded text-xs font-medium ${
                  role === "cs"
                    ? "bg-brand-50 text-brand-600"
                    : role === "florist"
                    ? "bg-moss-50 text-moss-600"
                    : "bg-honey-50 text-honey-500"
                }`}
              >
                {ROLE_LABELS[role]}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from(names).map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-moss-50 text-xs text-moss-700 border border-moss-100"
                  >
                    <User className="w-3 h-3 text-moss-400" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
