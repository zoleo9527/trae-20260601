import { Check, AlertCircle, Hourglass, Timer, AlertOctagon } from "lucide-react";
import { STATUS_META, STATUS_FLOW, ROLE_META, STATUS_TIMEOUT_DAYS } from "@/constants";
import type { CostumeStatus, TimelineEntry as TimelineEntryType } from "@/types";
import { cn, formatDateTime, getNodeDuration, formatDurationDays } from "@/utils";
import Avatar from "./Avatar";
import StatusBadge from "./StatusBadge";

interface Props {
  currentStatus: CostumeStatus;
  entries: TimelineEntryType[];
  className?: string;
}

export default function Timeline({ currentStatus, entries, className }: Props) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className={cn("space-y-0", className)}>
      {STATUS_FLOW.map((status, idx) => {
        const meta = STATUS_META[status];
        const relatedEntry = entries.find((e) => e.status === status);
        const isCompleted = !!relatedEntry || idx < currentIdx;
        const isCurrent = status === currentStatus;
        const isFuture = idx > currentIdx && !relatedEntry;
        const roleMeta = ROLE_META[meta.assigneeRole];
        const duration = getNodeDuration(entries, status);
        const timeout = STATUS_TIMEOUT_DAYS[status] ?? 7;
        const isStuckNode = isCurrent && duration !== null && duration > timeout;

        return (
          <div key={status} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                  isCompleted && "bg-forest-600 border-forest-600 text-white",
                  isCurrent && !isStuckNode && "bg-wine-700 border-wine-700 text-white animate-pulse-slow shadow-lg shadow-wine-200",
                  isStuckNode && "bg-ochre-600 border-ochre-600 text-white animate-pulse-slow shadow-lg shadow-ochre-200",
                  isFuture && "bg-white border-ink-200 text-ink-300"
                )}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : isStuckNode ? (
                  <AlertOctagon size={14} strokeWidth={2.5} />
                ) : isCurrent ? (
                  <Hourglass size={14} strokeWidth={2.5} />
                ) : (
                  <span className="text-xs font-medium">{meta.order}</span>
                )}
              </div>
              {idx < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 mt-1",
                    isCompleted ? "bg-forest-300" : "bg-ink-100"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={status} showDot={false} />
                <span className={cn("text-xs", roleMeta.color, "chip border-dashed")}>
                  责任：{roleMeta.label}
                </span>
                {duration !== null && (
                  <span
                    className={cn(
                      "text-xs chip border-dashed flex items-center gap-1",
                      isStuckNode
                        ? "text-ochre-700 bg-ochre-50 border-ochre-300"
                        : "text-ink-500 bg-ink-50 border-ink-200"
                    )}
                  >
                    <Timer size={10} />
                    {formatDurationDays(duration)}
                    {isStuckNode && <span className="font-medium">（超时 {duration - timeout} 天）</span>}
                  </span>
                )}
              </div>
              <p className={cn("text-sm mt-1.5", isFuture ? "text-ink-400" : "text-ink-700")}>
                {meta.description}
              </p>
              {relatedEntry && (
                <div className="mt-3 p-3 rounded-md bg-cream-100 border border-cream-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar name={relatedEntry.operatorName} role={relatedEntry.operatorRole} size="sm" showName />
                      <span className="text-xs text-ink-400">→</span>
                      <Avatar name={relatedEntry.assigneeName} role={relatedEntry.assigneeRole} size="sm" showName />
                      <span className="text-[10px] text-ink-400">接手</span>
                    </div>
                    <span className="text-xs text-ink-400">{formatDateTime(relatedEntry.timestamp)}</span>
                  </div>
                  {relatedEntry.remark && (
                    <p className="text-sm text-ink-600 mt-2 leading-relaxed border-l-2 border-gold-400 pl-3">
                      {relatedEntry.remark}
                    </p>
                  )}
                </div>
              )}
              {isCurrent && !relatedEntry && (
                <div
                  className={cn(
                    "mt-3 p-3 rounded-md border border-dashed",
                    isStuckNode
                      ? "bg-ochre-50 border-ochre-300"
                      : "bg-wine-50 border-wine-200"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isStuckNode ? "text-ochre-700" : "text-wine-700"
                    )}
                  >
                    {isStuckNode ? <AlertOctagon size={14} /> : <AlertCircle size={14} />}
                    <span className="text-sm font-medium">
                      {isStuckNode ? "此节点已超时，需尽快处理" : "当前正在此节点处理中"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
