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
import type { OperationLog } from "@/types";
import { formatDateTime } from "@/utils/date";
import { ROLE_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";

const iconMap = {
  create: FilePlus,
  submit: Send,
  reject: XCircle,
  confirm: CheckCircle,
  supplement: Edit3,
  transfer: ArrowRight,
  process: Wrench,
  close: Archive,
};

const colorMap = {
  create: "bg-gray-500",
  submit: "bg-navy-500",
  reject: "bg-status-error",
  confirm: "bg-status-success",
  supplement: "bg-status-warning",
  transfer: "bg-status-info",
  process: "bg-purple-500",
  close: "bg-gray-700",
};

interface TimelineProps {
  logs: OperationLog[];
}

export function Timeline({ logs }: TimelineProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedLogs.map((log, index) => {
        const Icon = iconMap[log.operationType];
        const roleConfig = ROLE_MAP[log.operatorRole];

        return (
          <div key={log.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white",
                  colorMap[log.operationType]
                )}
              >
                <Icon size={14} />
              </div>
              {index < sortedLogs.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{log.operator}</span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded bg-gray-100",
                    roleConfig.color
                  )}
                >
                  {roleConfig.label}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{log.operationDesc}</p>
              {log.remark && (
                <p className="text-xs text-gray-500 mt-1">备注：{log.remark}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
