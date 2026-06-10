import { HotspotStatus, ActionType } from "./types";

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return formatTime(d);
}

export function statusLabel(status: HotspotStatus): string {
  switch (status) {
    case HotspotStatus.PENDING:
      return "待派单";
    case HotspotStatus.DISPATCHED:
      return "已派单";
    case HotspotStatus.IN_PROGRESS:
      return "处理中";
    case HotspotStatus.COMPLETED:
      return "已完成";
    case HotspotStatus.CANCELLED:
      return "已取消";
  }
}

export function statusColor(status: HotspotStatus): string {
  switch (status) {
    case HotspotStatus.PENDING:
      return "bg-amber-100 text-amber-800 border-amber-200";
    case HotspotStatus.DISPATCHED:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case HotspotStatus.IN_PROGRESS:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case HotspotStatus.COMPLETED:
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case HotspotStatus.CANCELLED:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function actionLabel(action: ActionType): string {
  switch (action) {
    case ActionType.SUBMIT:
      return "提交热点";
    case ActionType.DISPATCH:
      return "调度派单";
    case ActionType.ACCEPT:
      return "接单";
    case ActionType.UPDATE:
      return "进度更新";
    case ActionType.COMPLETE:
      return "处理完成";
    case ActionType.CANCEL:
      return "取消";
    case ActionType.COMMENT:
      return "备注";
    case ActionType.ATTACH:
      return "上传附件";
  }
}

export function actionIcon(action: ActionType): string {
  switch (action) {
    case ActionType.SUBMIT:
      return "📝";
    case ActionType.DISPATCH:
      return "📋";
    case ActionType.ACCEPT:
      return "✅";
    case ActionType.UPDATE:
      return "📊";
    case ActionType.COMPLETE:
      return "🎉";
    case ActionType.CANCEL:
      return "❌";
    case ActionType.COMMENT:
      return "💬";
    case ActionType.ATTACH:
      return "📎";
  }
}

export function urgencyLabel(urgency: number): string {
  if (urgency >= 3) return "紧急";
  if (urgency === 2) return "一般";
  return "较低";
}

export function urgencyColor(urgency: number): string {
  if (urgency >= 3) return "text-red-600 bg-red-50";
  if (urgency === 2) return "text-amber-600 bg-amber-50";
  return "text-green-600 bg-green-50";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
