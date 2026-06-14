import type { Costume, CostumeStatus, TimelineEntry, StudentSize } from "@/types";
import { STATUS_TIMEOUT_DAYS, STATUS_FLOW } from "@/constants";

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
};

export const genId = (prefix = ""): string => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

export const nowISO = (): string => new Date().toISOString();

export const getDaysDiff = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (num: number): string => {
  return `¥${num.toLocaleString("zh-CN")}`;
};

export const cn = (...classes: (string | false | null | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const getDaysAgo = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const getNodeEnteredAt = (costume: Costume): string => {
  const entry = costume.timeline.find((t) => t.status === costume.status);
  return entry?.timestamp || costume.createdAt;
};

export const getDaysInCurrentNode = (costume: Costume): number => {
  const enteredAt = getNodeEnteredAt(costume);
  return getDaysAgo(enteredAt);
};

export const isNodeStuck = (costume: Costume): boolean => {
  const days = getDaysInCurrentNode(costume);
  const timeout = STATUS_TIMEOUT_DAYS[costume.status] ?? 7;
  return days > timeout;
};

export const getStuckDays = (costume: Costume): number => {
  if (!isNodeStuck(costume)) return 0;
  const days = getDaysInCurrentNode(costume);
  const timeout = STATUS_TIMEOUT_DAYS[costume.status] ?? 7;
  return days - timeout;
};

export const formatDurationDays = (days: number): string => {
  if (days <= 0) return "今天";
  if (days === 1) return "1 天";
  if (days < 30) return `${days} 天`;
  const m = Math.floor(days / 30);
  const rest = days % 30;
  return rest > 0 ? `${m} 个月 ${rest} 天` : `${m} 个月`;
};

export const getNodeDuration = (
  entries: TimelineEntry[],
  status: CostumeStatus
): number | null => {
  const idx = STATUS_FLOW.indexOf(status);
  const entry = entries.find((e) => e.status === status);
  if (!entry) return null;
  const nextStatus = STATUS_FLOW[idx + 1];
  const nextEntry = entries.find((e) => e.status === nextStatus);
  const endTime = nextEntry ? new Date(nextEntry.timestamp) : new Date();
  const ms = endTime.getTime() - new Date(entry.timestamp).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

export interface SizeConfirmSummary {
  pendingCount: number;
  exceptionCount: number;
  confirmedCount: number;
  totalCount: number;
  pendingStudents: StudentSize[];
  exceptionStudents: StudentSize[];
  blockingRemark: string | null;
  blockingDisplayRemark: string;
  blockingStudentName: string | null;
  blockingStudentId: string | null;
  blockingStatus: "exception" | "pending" | null;
  blockingUpdatedAt: string | null;
}

const getStudentLatestActivity = (student: StudentSize) => {
  let latestTime = new Date(student.updatedAt).getTime();
  let latestRemark: string | null = student.remark || null;

  for (const log of student.changeLogs) {
    const t = new Date(log.timestamp).getTime();
    if (t > latestTime) {
      latestTime = t;
      if (log.remark) latestRemark = log.remark;
    }
  }

  return { latestTime, latestRemark };
};

export const getSizeConfirmSummary = (costume: Costume): SizeConfirmSummary => {
  const pending: StudentSize[] = [];
  const exception: StudentSize[] = [];
  const confirmed: StudentSize[] = [];
  costume.studentSizes.forEach((s) => {
    if (s.confirmStatus === "exception") exception.push(s);
    else if (s.confirmStatus === "pending") pending.push(s);
    else confirmed.push(s);
  });

  const byUpdatedAt = (a: StudentSize, b: StudentSize) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  const sortedPending = [...pending].sort(byUpdatedAt);
  const sortedException = [...exception].sort(byUpdatedAt);

  const allUnfinished = [...pending, ...exception];

  let blocking: StudentSize | null = null;
  let blockingStatus: "exception" | "pending" | null = null;
  let blockingRemark: string | null = null;
  let blockingUpdatedAt: string | null = null;

  if (allUnfinished.length > 0) {
    let maxTime = -1;
    allUnfinished.forEach((s) => {
      const { latestTime, latestRemark } = getStudentLatestActivity(s);
      if (latestTime > maxTime) {
        maxTime = latestTime;
        blocking = s;
        blockingStatus = s.confirmStatus as "exception" | "pending";
        blockingRemark = latestRemark;
        blockingUpdatedAt = new Date(latestTime).toISOString();
      }
    });
  }

  let blockingDisplayRemark = "等待老师确认尺码";
  if (blockingRemark) {
    blockingDisplayRemark = blockingRemark;
  } else if (blockingStatus === "exception") {
    blockingDisplayRemark = "存在异常，等待老师处理";
  }

  return {
    pendingCount: pending.length,
    exceptionCount: exception.length,
    confirmedCount: confirmed.length,
    totalCount: costume.studentSizes.length,
    pendingStudents: sortedPending,
    exceptionStudents: sortedException,
    blockingRemark,
    blockingDisplayRemark,
    blockingStudentName: blocking?.studentName || null,
    blockingStudentId: blocking?.id || null,
    blockingStatus,
    blockingUpdatedAt,
  };
};
