import { XCircle } from "lucide-react";

interface RejectBadgeProps {
  reason?: string;
  showReason?: boolean;
}

export function RejectBadge({ reason, showReason = false }: RejectBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded text-status-error">
      <XCircle size={14} />
      <span className="text-xs font-medium">已驳回</span>
      {showReason && reason && (
        <span className="text-xs text-red-600 ml-1">：{reason}</span>
      )}
    </div>
  );
}
