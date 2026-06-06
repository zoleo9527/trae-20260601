import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplementBadgeProps {
  notes?: string;
  showNotes?: boolean;
}

export function SupplementBadge({ notes, showNotes }: SupplementBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-status-warning border border-orange-200",
      showNotes && notes && "pr-3"
    )}>
      <Edit3 size={12} />
      <span>需补录</span>
      {showNotes && notes && (
        <span className="text-gray-500 font-normal ml-1 border-l border-orange-200 pl-2 truncate max-w-[200px]">
          {notes}
        </span>
      )}
    </div>
  );
}
