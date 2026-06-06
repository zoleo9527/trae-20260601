import { REVIEW_STATUS_MAP, ORDER_STATUS_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";
import type { ReviewStatus, OrderStatus } from "@/types";

interface StatusBadgeProps {
  status: ReviewStatus | OrderStatus;
  type: "review" | "order";
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const map = type === "review" ? REVIEW_STATUS_MAP : ORDER_STATUS_MAP;
  const config = map[status as keyof typeof map];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
