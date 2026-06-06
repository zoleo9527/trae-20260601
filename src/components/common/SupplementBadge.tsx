import { AlertTriangle } from "lucide-react";

interface SupplementBadgeProps {
  notes?: string;
  showNotes?: boolean;
}

export function SupplementBadge({ notes, showNotes = false }: SupplementBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-orange-700">
      <AlertTriangle size={14} />
      <span className="text-xs font-medium">待补录</span>
      {showNotes && notes && (
        <span className="text-xs text-orange-600 ml-1">：{notes}</span>
      )}
    </div>
  );
}
