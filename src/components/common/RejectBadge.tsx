import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RejectBadgeProps {
  reason?: string;
  showReason?: boolean;
}

export function RejectBadge({ reason, showReason }: RejectBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-status-error border border-red-200",
      showReason && reason && "pr-3"
    )}>
      <XCircle size={12} />
      <span>已驳回</span>
      {showReason && reason && (
        <span className="text-gray-500 font-normal ml-1 border-l border-red-200 pl-2 truncate max-w-[200px]">
          {reason}
        </span>
      )}
    </div>
  );
}
