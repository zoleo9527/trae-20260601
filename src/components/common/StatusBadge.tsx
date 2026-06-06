import { REVIEW_STATUS_MAP, ORDER_STATUS_MAP } from "@/utils/status";
import type { ReviewStatus, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ReviewStatus | OrderStatus;
  type?: "review" | "order";
}

export function StatusBadge({ status, type = "review" }: StatusBadgeProps) {
  const map = type === "review" ? REVIEW_STATUS_MAP : ORDER_STATUS_MAP;
  const config = map[status as keyof typeof map];

  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
        config.bgColor,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
