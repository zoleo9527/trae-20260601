import { cn } from "@/lib/utils";
import type { ReferralStatusChange, ReferralChangeSnapshot } from "@/types";
import type { ResultReturn } from "@/types";
import { STATUS_LABELS } from "@/types";
import {
  ArrowRight,
  FileEdit,
  FileCheck,
  CornerDownRight,
} from "lucide-react";

type TimelineNodeType =
  | { type: "status_change"; data: ReferralStatusChange }
  | { type: "field_change"; data: ReferralChangeSnapshot }
  | { type: "result_return"; data: ResultReturn };

interface TimelineProps {
  items: TimelineNodeType[];
}

const dotColors: Record<string, string> = {
  draft: "bg-zinc-400",
  pending_review: "bg-blue-500",
  approved: "bg-teal-500",
  rejected: "bg-red-500",
  sent: "bg-indigo-500",
  result_returned: "bg-emerald-500",
  change_alerted: "bg-amber-500",
  confirmed: "bg-cyan-500",
  closed: "bg-zinc-400",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusChangeNode({ data }: { data: ReferralStatusChange }) {
  return (
    <div className="flex items-start gap-2">
      <ArrowRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">
          {data.fromStatus
            ? `${STATUS_LABELS[data.fromStatus]} → ${STATUS_LABELS[data.toStatus]}`
            : `创建为 ${STATUS_LABELS[data.toStatus]}`}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {data.operatorName}（{data.operatorRole}）
        </p>
        {data.note && (
          <p className="text-xs text-zinc-500 mt-1 bg-zinc-50 px-2 py-1 rounded">
            {data.note}
          </p>
        )}
      </div>
    </div>
  );
}

function FieldChangeNode({ data }: { data: ReferralChangeSnapshot }) {
  return (
    <div className="flex items-start gap-2">
      <FileEdit className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">
          修改了 <span className="text-amber-700">{data.field}</span>
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          旧值: <span className="line-through">{data.oldValue}</span> → 新值:{" "}
          <span className="font-medium text-zinc-700">{data.newValue}</span>
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {data.operatorName}
        </p>
        {data.note && (
          <p className="text-xs text-zinc-500 mt-1 bg-amber-50 px-2 py-1 rounded">
            {data.note}
          </p>
        )}
      </div>
    </div>
  );
}

function ResultReturnNode({ data }: { data: ResultReturn }) {
  return (
    <div className="flex items-start gap-2">
      <FileCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">结果回传</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {data.resultDept} - {data.resultDoctor}
        </p>
        {data.confirmedByName && (
          <p className="text-xs text-emerald-600 mt-1">
            <CornerDownRight className="w-3 h-3 inline" /> 已由 {data.confirmedByName} 确认
          </p>
        )}
      </div>
    </div>
  );
}

export default function Timeline({ items }: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">暂无记录</p>
    );
  }

  return (
    <div className="relative">
      {items.map((item, idx) => {
        const time =
          item.type === "status_change"
            ? item.data.createdAt
            : item.type === "field_change"
            ? item.data.createdAt
            : item.data.createdAt;

        const statusKey =
          item.type === "status_change" ? item.data.toStatus : null;

        return (
          <div
            key={`${item.type}-${"id" in item.data ? item.data.id : idx}`}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            <div className="w-28 shrink-0 pt-0.5">
              <span className="text-xs text-zinc-400">{formatTime(time)}</span>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full ring-4 ring-white shrink-0",
                  statusKey ? dotColors[statusKey] : "bg-emerald-500"
                )}
              />
              {idx < items.length - 1 && (
                <div className="w-px flex-1 bg-zinc-200 mt-1" />
              )}
            </div>

            <div className="flex-1 min-w-0 bg-white border border-zinc-200 rounded-lg px-3 py-2.5 shadow-sm">
              {item.type === "status_change" && (
                <StatusChangeNode data={item.data} />
              )}
              {item.type === "field_change" && (
                <FieldChangeNode data={item.data} />
              )}
              {item.type === "result_return" && (
                <ResultReturnNode data={item.data} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
