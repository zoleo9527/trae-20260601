import type { ReviewStatus, OrderStatus, UserRole, OperationType } from "@/types";

export const REVIEW_STATUS_MAP: Record<ReviewStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "草稿", color: "text-gray-600", bgColor: "bg-gray-100" },
  pending: { label: "待审核", color: "text-amber-700", bgColor: "bg-amber-50" },
  rejected: { label: "已驳回", color: "text-status-error", bgColor: "bg-red-50" },
  confirmed: { label: "已确认", color: "text-navy-700", bgColor: "bg-navy-50" },
  processing: { label: "处理中", color: "text-status-info", bgColor: "bg-blue-50" },
  closed: { label: "已关闭", color: "text-status-success", bgColor: "bg-green-50" },
};

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "待核实", color: "text-amber-700", bgColor: "bg-amber-50" },
  rejected: { label: "已驳回", color: "text-status-error", bgColor: "bg-red-50" },
  supplement: { label: "待补录", color: "text-orange-700", bgColor: "bg-orange-50" },
  confirmed: { label: "已确认", color: "text-navy-700", bgColor: "bg-navy-50" },
  processing: { label: "处理中", color: "text-status-info", bgColor: "bg-blue-50" },
  resolved: { label: "已解决", color: "text-status-success", bgColor: "bg-green-50" },
};

export const ROLE_MAP: Record<UserRole, { label: string; color: string }> = {
  assistant: { label: "主播助理", color: "text-purple-700" },
  controller: { label: "场控", color: "text-navy-700" },
  aftersales: { label: "售后组长", color: "text-status-success" },
};

export const OPERATION_TYPE_MAP: Record<OperationType, { label: string; icon: string }> = {
  create: { label: "创建", icon: "FilePlus" },
  submit: { label: "提交", icon: "Send" },
  reject: { label: "驳回", icon: "XCircle" },
  confirm: { label: "确认", icon: "CheckCircle" },
  supplement: { label: "补录", icon: "Edit3" },
  transfer: { label: "流转", icon: "ArrowRight" },
  process: { label: "处理", icon: "Wrench" },
  close: { label: "关闭", icon: "Archive" },
};

export const ABNORMAL_TYPES = [
  "未按约定发货",
  "商品质量问题",
  "描述与实物不符",
  "价格错误",
  "库存不足",
  "优惠券使用异常",
  "退款纠纷",
  "其他",
];
