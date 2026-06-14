import { STATUS_META } from "@/constants";
import type { CostumeStatus } from "@/types";
import { cn } from "@/utils";

interface Props {
  status: CostumeStatus;
  className?: string;
  showDot?: boolean;
}

const statusColorMap: Record<CostumeStatus, string> = {
  created: "text-ink-700 bg-ink-50 border-ink-300",
  roster_pending: "text-ochre-700 bg-ochre-50 border-ochre-300",
  roster_confirmed: "text-forest-700 bg-forest-50 border-forest-200",
  sizing_pending: "text-ochre-700 bg-ochre-50 border-ochre-300",
  sizing_entered: "text-forest-700 bg-forest-50 border-forest-200",
  size_confirm_pending: "text-ochre-700 bg-ochre-50 border-ochre-300",
  size_confirmed: "text-forest-700 bg-forest-50 border-forest-200",
  approval_pending: "text-gold-800 bg-gold-50 border-gold-400",
  approved: "text-forest-700 bg-forest-50 border-forest-200",
  ordering: "text-wine-700 bg-wine-50 border-wine-200",
  received: "text-forest-700 bg-forest-50 border-forest-200",
  distributed: "text-forest-700 bg-forest-50 border-forest-200",
  archived: "text-ink-500 bg-ink-50 border-ink-200",
};

export default function StatusBadge({ status, className, showDot = true }: Props) {
  const meta = STATUS_META[status];
  const colors = statusColorMap[status];
  const isPending = status.includes("pending");
  return (
    <span className={cn("chip", colors, className)}>
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            isPending ? "bg-ochre-500 animate-pulse-slow" : "bg-current opacity-70"
          )}
        />
      )}
      {meta.label}
    </span>
  );
}
