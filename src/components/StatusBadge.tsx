import { cn } from "@/lib/utils"
import type { ProcurementStatus, Urgency, GradingLevel } from "@/types"
import { STATUS_LABELS, URGENCY_LABELS, GRADING_LABELS, normalizeGradingLevel } from "@/types"

export function StatusBadge({ status, className }: { status: ProcurementStatus; className?: string }) {
  const base = "px-2 py-0.5 rounded text-xs font-medium font-mono"
  const variants: Record<ProcurementStatus, string> = {
    PENDING: "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse",
    IN_PROGRESS: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse",
    CLOSED: "bg-zinc-700 text-zinc-400 border border-zinc-600",
    NEEDS_REVIEW: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  }
  return (
    <span className={cn(base, variants[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const base = "px-2 py-0.5 rounded text-xs font-medium font-mono"
  const variants: Record<Urgency, string> = {
    NORMAL: "bg-zinc-700 text-zinc-300",
    URGENT: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    CRITICAL: "bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse font-bold",
  }
  return (
    <span className={cn(base, variants[urgency], className)}>
      {URGENCY_LABELS[urgency]}
    </span>
  )
}

export function GradingBadge({ level, className }: { level: GradingLevel | string | null | undefined; className?: string }) {
  const safeLevel = normalizeGradingLevel(level);
  const base = "px-3 py-1 rounded text-sm font-bold font-mono"
  const variants: Record<GradingLevel, string> = {
    A: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    B: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    C: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    SCRAP: "bg-red-500/20 text-red-400 border border-red-500/30",
  }
  return (
    <span className={cn(base, variants[safeLevel], className)}>
      {GRADING_LABELS[safeLevel]}
    </span>
  )
}
