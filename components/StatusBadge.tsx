"use client";

import { ApplicationStatus, RepaymentStatus, ExceptionStatus } from "@/types";

interface StatusBadgeProps {
  status: ApplicationStatus | RepaymentStatus | ExceptionStatus | string;
  type?: "application" | "repayment" | "exception";
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "待处理", className: "bg-gray-100 text-gray-700" },
  RISK_REVIEW: { label: "风控审核", className: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "已通过", className: "bg-green-100 text-green-700" },
  CONFIRMED: { label: "已确认", className: "bg-purple-100 text-purple-700" },
  DISBURSED: { label: "已放款", className: "bg-success text-white" },
  REJECTED: { label: "已驳回", className: "bg-error text-white" },
  PAID: { label: "已还款", className: "bg-success text-white" },
  OVERDUE: { label: "逾期", className: "bg-error text-white" },
  PARTIAL_PAID: { label: "部分还款", className: "bg-warning text-white" },
  OPEN: { label: "待处理", className: "bg-error text-white" },
  PROCESSING: { label: "处理中", className: "bg-warning text-white" },
  RESOLVED: { label: "已解决", className: "bg-success text-white" },
};

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}