"use client";

import type { OrderStatus } from "@/types";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/constants";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
