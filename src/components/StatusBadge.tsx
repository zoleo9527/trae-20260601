import { cn } from "@/lib/utils";
import type { ReferralStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

const statusColors: Record<ReferralStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  pending_review: "bg-blue-50 text-blue-700",
  approved: "bg-teal-50 text-teal-700",
  rejected: "bg-red-50 text-red-700",
  sent: "bg-indigo-50 text-indigo-700",
  result_returned: "bg-emerald-50 text-emerald-700",
  change_alerted: "bg-amber-50 text-amber-700",
  confirmed: "bg-cyan-50 text-cyan-700",
  closed: "bg-zinc-100 text-zinc-500",
};

interface StatusBadgeProps {
  status: ReferralStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusColors[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
