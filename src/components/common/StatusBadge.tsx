import type { VerificationStatus, ComplaintStatus, SeverityLevel } from "@/types";

interface Props {
  type: "verification" | "complaint" | "severity";
  value: VerificationStatus | ComplaintStatus | SeverityLevel;
}

const config: Record<Props["type"], Record<string, { label: string; className: string; dotColor: string }>> = {
  verification: {
    normal: { label: "正常核销", className: "bg-green-50 text-green-700 border-green-200", dotColor: "bg-green-500" },
    abnormal: { label: "异常核销", className: "bg-flame-50 text-flame-700 border-flame-200", dotColor: "bg-flame-500 animate-pulse-dot" },
    refunded: { label: "已退款", className: "bg-ink-100 text-ink-600 border-ink-200", dotColor: "bg-ink-400" },
  },
  complaint: {
    pending: { label: "待受理", className: "bg-flame-50 text-flame-700 border-flame-200", dotColor: "bg-flame-500 animate-pulse-dot" },
    processing: { label: "处理中", className: "bg-brand-50 text-brand-700 border-brand-200", dotColor: "bg-brand-500 animate-pulse-dot" },
    to_visit: { label: "待回访", className: "bg-blue-50 text-blue-700 border-blue-200", dotColor: "bg-blue-500 animate-pulse-dot" },
    completed: { label: "已完成", className: "bg-green-50 text-green-700 border-green-200", dotColor: "bg-green-500" },
    escalated: { label: "已升级", className: "bg-red-50 text-red-700 border-red-200", dotColor: "bg-red-500 animate-pulse-dot" },
  },
  severity: {
    normal: { label: "一般", className: "bg-ink-100 text-ink-700 border-ink-200", dotColor: "bg-ink-500" },
    serious: { label: "严重", className: "bg-flame-50 text-flame-700 border-flame-200", dotColor: "bg-flame-500" },
    urgent: { label: "紧急", className: "bg-red-50 text-red-700 border-red-200", dotColor: "bg-red-500 animate-pulse-dot" },
  },
};

export default function StatusBadge({ type, value }: Props) {
  const c = config[type][value];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.dotColor}`}></span>
      {c.label}
    </span>
  );
}
