import {
  FilePlus,
  Send,
  XCircle,
  CheckCircle,
  Edit3,
  ArrowRight,
  Wrench,
  Archive,
} from "lucide-react";
import { formatDateTime } from "@/utils/date";
import { OPERATION_TYPE_MAP, ROLE_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";
import type { OperationLog } from "@/types";

const ICON_MAP = {
  create: FilePlus,
  submit: Send,
  reject: XCircle,
  confirm: CheckCircle,
  supplement: Edit3,
  transfer: ArrowRight,
  process: Wrench,
  close: Archive,
};

const COLOR_MAP: Record<string, string> = {
  create: "bg-gray-400",
  submit: "bg-amber-500",
  reject: "bg-status-error",
  confirm: "bg-status-success",
  supplement: "bg-status-warning",
  transfer: "bg-status-info",
  process: "bg-navy-500",
  close: "bg-gray-600",
};

interface TimelineProps {
  logs: OperationLog[];
}

export function Timeline({ logs }: TimelineProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="relative">
      {sortedLogs.map((log, index) => {
        const Icon = ICON_MAP[log.operationType];
        const isLast = index === sortedLogs.length - 1;

        return (
          <div key={log.id} className="relative pl-8 pb-6">
            {!isLast && (
              <div className="absolute left-[11px] top-6 w-0.5 h-full bg-gray-200" />
            )}
            <div
              className={cn(
                "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center",
                COLOR_MAP[log.operationType]
              )}
            >
              <Icon size={12} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">
                  {OPERATION_TYPE_MAP[log.operationType].label}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{log.operationDesc}</p>
              <p className="text-xs text-gray-400">
                操作人：{log.operator}
                <span className={cn("ml-1", ROLE_MAP[log.operatorRole].color)}>
                  ({ROLE_MAP[log.operatorRole].label})
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
