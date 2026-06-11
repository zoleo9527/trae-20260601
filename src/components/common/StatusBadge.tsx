import { cn } from "@/lib/utils";
import { HOUSE_STATUS_MAP, STAGE_MAP, OPERATION_TYPE_MAP, getStatusColor, getStageColor } from "@/utils/status";
import type { HouseStatus, ControlStage, OperationType } from "@/types";

type BadgeType = "house" | "stage" | "customer" | "log";
type BadgeSize = "sm" | "md";

interface StatusBadgeProps {
  type: BadgeType;
  value: string;
  className?: string;
  size?: BadgeSize;
}

const customerLevelColors: Record<string, string> = {
  A: "bg-danger/10 text-danger border-danger/30",
  B: "bg-secondary/10 text-secondary border-secondary/30",
  C: "bg-primary/10 text-primary border-primary/30",
  D: "bg-slate-400/10 text-slate-500 border-slate-300",
};

const customerLevelLabels: Record<string, string> = {
  A: "A级客户",
  B: "B级客户",
  C: "C级客户",
  D: "D级客户",
};

const operationColors: Record<string, string> = {
  create_application: "bg-primary/10 text-primary border-primary/30",
  submit_for_review: "bg-secondary/10 text-secondary border-secondary/30",
  review_approve: "bg-success/10 text-success border-success/30",
  review_reject: "bg-danger/10 text-danger border-danger/30",
  lock_house: "bg-secondary/10 text-secondary border-secondary/30",
  unlock_house: "bg-slate-400/10 text-slate-500 border-slate-300",
  complete_sale: "bg-success/10 text-success border-success/30",
  update_remark: "bg-slate-100 text-slate-600 border-slate-200",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2 py-1 text-xs",
};

export default function StatusBadge({ type, value, className, size = "md" }: StatusBadgeProps) {
  let label = value;
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200";

  switch (type) {
    case "house":
      label = HOUSE_STATUS_MAP[value as HouseStatus] || value;
      colorClass = getStatusColor(value as HouseStatus);
      break;
    case "stage":
      label = STAGE_MAP[value as ControlStage] || value;
      colorClass = getStageColor(value as ControlStage);
      break;
    case "customer":
      label = customerLevelLabels[value] || value;
      colorClass = customerLevelColors[value] || colorClass;
      break;
    case "log":
      label = OPERATION_TYPE_MAP[value as OperationType] || value;
      colorClass = operationColors[value] || colorClass;
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded border",
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}
