import { Calendar, Users, ChevronRight, AlertTriangle, Clock, AlertOctagon, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { STATUS_META, SIZE_CONFIRM_META, ROLE_META } from "@/constants";
import type { Costume } from "@/types";
import {
  cn,
  formatDate,
  formatCurrency,
  getDaysDiff,
  getDaysInCurrentNode,
  isNodeStuck,
  getStuckDays,
  formatDurationDays,
} from "@/utils";
import StatusBadge from "../common/StatusBadge";
import Avatar from "../common/Avatar";
import RoleBadge from "../common/RoleBadge";

interface Props {
  costume: Costume;
  compact?: boolean;
}

export default function CostumeCard({ costume, compact = false }: Props) {
  const navigate = useNavigate();
  const addRecent = useAppStore((s) => s.addRecentOpened);

  const daysToShow = getDaysDiff(costume.performanceDate);
  const isUrgent = costume.performanceDate && daysToShow > 0 && daysToShow <= 7;

  const exceptionCount = costume.studentSizes.filter((s) => s.confirmStatus === "exception").length;
  const pendingCount = costume.studentSizes.filter((s) => s.confirmStatus === "pending").length;

  const handleClick = () => {
    addRecent(costume.id);
    navigate(`/costumes/${costume.id}`);
  };

  const daysInNode = getDaysInCurrentNode(costume);
  const stuck = isNodeStuck(costume);
  const stuckDays = getStuckDays(costume);
  const roleMeta = ROLE_META[costume.currentAssigneeRole];

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "card card-hover p-3 relative overflow-hidden group",
          stuck && "ring-1 ring-wine-300"
        )}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 transition-opacity",
            stuck ? "bg-wine-500 opacity-100" : "bg-gold-400 opacity-0 group-hover:opacity-100"
          )}
        />
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink-800 truncate">{costume.name}</div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={costume.status} />
              {stuck && (
                <span className="chip text-[10px] bg-wine-50 text-wine-700 border-wine-200">
                  <AlertOctagon size={10} />
                  超时 {stuckDays} 天
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-ink-300 group-hover:text-wine-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-ink-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(costume.performanceDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {costume.totalSets}套
          </span>
          <span className={cn("flex items-center gap-1 chip border-dashed text-[10px]", roleMeta.color)}>
            <Timer size={10} />
            此节点 {formatDurationDays(daysInNode)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "card card-hover p-5 relative overflow-hidden cursor-pointer",
        isUrgent && "ring-1 ring-ochre-300",
        stuck && "ring-1 ring-wine-400 bg-wine-50/20"
      )}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
        {isUrgent && (
          <div className="flex items-center gap-1 text-ochre-600 bg-ochre-50 border border-ochre-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
            <Clock size={12} />
            距演出 {daysToShow} 天
          </div>
        )}
        {stuck && (
          <div className="flex items-center gap-1 text-wine-700 bg-wine-50 border border-wine-300 rounded-full px-2 py-0.5 text-[11px] font-medium">
            <AlertOctagon size={12} />
            此节点超时 {stuckDays} 天
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold text-ink-900 leading-snug truncate pr-32">
            {costume.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={costume.status} />
            <span className="text-xs text-ink-500 flex items-center gap-1">
              <Calendar size={12} />
              演出：{formatDate(costume.performanceDate)}
            </span>
            <span className="text-xs text-ink-500 flex items-center gap-1">
              <Users size={12} />
              {costume.totalSets}套
            </span>
            <span className="text-xs text-ink-500">{formatCurrency(costume.budget)}</span>
            <span className={cn("chip border-dashed text-[11px]", roleMeta.color)}>
              <Timer size={11} />
              已在此节点 {formatDurationDays(daysInNode)}
            </span>
          </div>
          {costume.classes && (
            <p className="text-xs text-ink-500 mt-2">班级：{costume.classes}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Avatar name={costume.currentAssignee} role={costume.currentAssigneeRole} size="md" showName />
          <RoleBadge role={costume.currentAssigneeRole} />
        </div>
      </div>

      {costume.remark && (
        <p className="text-sm text-ink-600 mt-3 pt-3 border-t border-cream-200 line-clamp-2">
          {costume.remark}
        </p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cream-200 text-xs flex-wrap">
        {pendingCount > 0 && (
          <span className={cn("chip", SIZE_CONFIRM_META.pending.color)}>
            待确认 {pendingCount} 人
          </span>
        )}
        {exceptionCount > 0 && (
          <span className={cn("chip", SIZE_CONFIRM_META.exception.color)}>
            <AlertTriangle size={12} />
            异常 {exceptionCount} 人
          </span>
        )}
        <span className="ml-auto text-ink-500 flex items-center gap-1">
          <span className="font-medium">{costume.currentAssignee}</span>
          <span className="text-ink-400">正在处理「{STATUS_META[costume.status].label}」</span>
        </span>
      </div>
    </div>
  );
}
