export const Role = {
  RECEPTIONIST: "RECEPTIONIST",
  TECHNICIAN: "TECHNICIAN",
  MANAGER: "MANAGER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const WorkOrderStatus = {
  PENDING_INSPECTION: "PENDING_INSPECTION",
  INSPECTION_IN_PROGRESS: "INSPECTION_IN_PROGRESS",
  QUOTE_READY: "QUOTE_READY",
  CUSTOMER_CONFIRMED: "CUSTOMER_CONFIRMED",
  CUSTOMER_REJECTED: "CUSTOMER_REJECTED",
  REVISE_REQUESTED: "REVISE_REQUESTED",
  REPAIR_IN_PROGRESS: "REPAIR_IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const ConfirmationDecision = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REVISE_NEEDED: "REVISE_NEEDED",
} as const;

export type ConfirmationDecision = (typeof ConfirmationDecision)[keyof typeof ConfirmationDecision];

export const AlertType = {
  NO_RESPONSIBLE: "NO_RESPONSIBLE",
  QUOTE_EXPIRED: "QUOTE_EXPIRED",
  CUSTOMER_REJECTED_ALERT: "CUSTOMER_REJECTED_ALERT",
  ABNORMAL_DETECTION: "ABNORMAL_DETECTION",
  REVISE_REQUESTED: "REVISE_REQUESTED",
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const AlertStatus = {
  ACTIVE: "ACTIVE",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
} as const;

export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];

export const WorkOrderStatusLabel: Record<string, string> = {
  [WorkOrderStatus.PENDING_INSPECTION]: "待分配检测",
  [WorkOrderStatus.INSPECTION_IN_PROGRESS]: "检测中",
  [WorkOrderStatus.QUOTE_READY]: "报价待确认",
  [WorkOrderStatus.CUSTOMER_CONFIRMED]: "客户已确认",
  [WorkOrderStatus.CUSTOMER_REJECTED]: "客户已拒绝",
  [WorkOrderStatus.REVISE_REQUESTED]: "需修改报价",
  [WorkOrderStatus.REPAIR_IN_PROGRESS]: "维修中",
  [WorkOrderStatus.COMPLETED]: "已完成",
  [WorkOrderStatus.CANCELLED]: "已取消",
};

export const WorkOrderStatusColor: Record<string, string> = {
  [WorkOrderStatus.PENDING_INSPECTION]: "bg-gray-100 text-gray-800",
  [WorkOrderStatus.INSPECTION_IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [WorkOrderStatus.QUOTE_READY]: "bg-amber-100 text-amber-800",
  [WorkOrderStatus.CUSTOMER_CONFIRMED]: "bg-green-100 text-green-800",
  [WorkOrderStatus.CUSTOMER_REJECTED]: "bg-red-100 text-red-800",
  [WorkOrderStatus.REVISE_REQUESTED]: "bg-orange-100 text-orange-800",
  [WorkOrderStatus.REPAIR_IN_PROGRESS]: "bg-indigo-100 text-indigo-800",
  [WorkOrderStatus.COMPLETED]: "bg-emerald-100 text-emerald-800",
  [WorkOrderStatus.CANCELLED]: "bg-slate-100 text-slate-800",
};

export const RoleLabel: Record<string, string> = {
  [Role.RECEPTIONIST]: "前台",
  [Role.TECHNICIAN]: "维修师",
  [Role.MANAGER]: "店长",
};

export const RoleColor: Record<string, string> = {
  [Role.RECEPTIONIST]: "bg-emerald-100 text-emerald-800",
  [Role.TECHNICIAN]: "bg-blue-100 text-blue-800",
  [Role.MANAGER]: "bg-purple-100 text-purple-800",
};

export const ConfirmationDecisionLabel: Record<string, string> = {
  [ConfirmationDecision.APPROVED]: "同意维修",
  [ConfirmationDecision.REJECTED]: "拒绝维修",
  [ConfirmationDecision.REVISE_NEEDED]: "需修改报价",
};

export const AlertTypeLabel: Record<string, string> = {
  [AlertType.NO_RESPONSIBLE]: "无责任人",
  [AlertType.QUOTE_EXPIRED]: "报价超时",
  [AlertType.CUSTOMER_REJECTED_ALERT]: "客户拒绝",
  [AlertType.ABNORMAL_DETECTION]: "检测异常",
  [AlertType.REVISE_REQUESTED]: "需修改报价",
};

export const SLA_HOURS: Record<string, number> = {
  [WorkOrderStatus.PENDING_INSPECTION]: 2,
  [WorkOrderStatus.INSPECTION_IN_PROGRESS]: 4,
  [WorkOrderStatus.REVISE_REQUESTED]: 2,
  [WorkOrderStatus.QUOTE_READY]: 4,
  [WorkOrderStatus.CUSTOMER_CONFIRMED]: 2,
  [WorkOrderStatus.CUSTOMER_REJECTED]: 4,
  [WorkOrderStatus.REPAIR_IN_PROGRESS]: 24,
  [WorkOrderStatus.COMPLETED]: 48,
};

export type ResponsibleCategory = "RECEPTION" | "TECHNICIAN" | "MANAGER" | "CUSTOMER" | "NONE";

export const StatusResponsible: Record<string, ResponsibleCategory> = {
  [WorkOrderStatus.PENDING_INSPECTION]: "RECEPTION",
  [WorkOrderStatus.INSPECTION_IN_PROGRESS]: "TECHNICIAN",
  [WorkOrderStatus.REVISE_REQUESTED]: "TECHNICIAN",
  [WorkOrderStatus.QUOTE_READY]: "RECEPTION",
  [WorkOrderStatus.CUSTOMER_CONFIRMED]: "TECHNICIAN",
  [WorkOrderStatus.CUSTOMER_REJECTED]: "MANAGER",
  [WorkOrderStatus.REPAIR_IN_PROGRESS]: "TECHNICIAN",
  [WorkOrderStatus.COMPLETED]: "RECEPTION",
  [WorkOrderStatus.CANCELLED]: "NONE",
};

export const ResponsibleCategoryLabel: Record<ResponsibleCategory, string> = {
  RECEPTION: "前台",
  TECHNICIAN: "维修师",
  MANAGER: "店长",
  CUSTOMER: "客户",
  NONE: "-",
};

export const ResponsibleCategoryColor: Record<ResponsibleCategory, string> = {
  RECEPTION: "bg-emerald-100 text-emerald-800",
  TECHNICIAN: "bg-blue-100 text-blue-800",
  MANAGER: "bg-purple-100 text-purple-800",
  CUSTOMER: "bg-sky-100 text-sky-800",
  NONE: "bg-slate-100 text-slate-500",
};

export interface NextAction {
  label: string;
  route?: string;
  intent?: string;
  roles: Role[];
  variant: "primary" | "secondary" | "danger" | "warning";
}

export const StatusNextActions: Record<string, NextAction[]> = {
  [WorkOrderStatus.PENDING_INSPECTION]: [
    {
      label: "分配维修师",
      route: "/orders/{id}",
      roles: [Role.RECEPTIONIST, Role.MANAGER],
      variant: "primary",
    },
  ],
  [WorkOrderStatus.INSPECTION_IN_PROGRESS]: [
    {
      label: "填写检测报价",
      route: "/orders/{id}/quote",
      roles: [Role.TECHNICIAN],
      variant: "primary",
    },
  ],
  [WorkOrderStatus.REVISE_REQUESTED]: [
    {
      label: "修改报价",
      route: "/orders/{id}/quote",
      roles: [Role.TECHNICIAN],
      variant: "warning",
    },
    {
      label: "查看修改意见",
      route: "/orders/{id}",
      roles: [Role.RECEPTIONIST, Role.MANAGER, Role.TECHNICIAN],
      variant: "secondary",
    },
  ],
  [WorkOrderStatus.QUOTE_READY]: [
    {
      label: "联系客户确认",
      route: "/orders/{id}/confirm",
      roles: [Role.RECEPTIONIST, Role.MANAGER],
      variant: "warning",
    },
    {
      label: "查看报价",
      route: "/orders/{id}",
      roles: [Role.TECHNICIAN],
      variant: "secondary",
    },
  ],
  [WorkOrderStatus.CUSTOMER_CONFIRMED]: [
    {
      label: "开始维修",
      route: "/orders/{id}",
      intent: "start-repair",
      roles: [Role.TECHNICIAN],
      variant: "primary",
    },
    {
      label: "查看确认记录",
      route: "/orders/{id}/review",
      roles: [Role.RECEPTIONIST, Role.MANAGER, Role.TECHNICIAN],
      variant: "secondary",
    },
  ],
  [WorkOrderStatus.CUSTOMER_REJECTED]: [
    {
      label: "处理拒绝",
      route: "/orders/{id}",
      roles: [Role.MANAGER],
      variant: "danger",
    },
    {
      label: "查看确认记录",
      route: "/orders/{id}/review",
      roles: [Role.RECEPTIONIST, Role.MANAGER],
      variant: "secondary",
    },
  ],
  [WorkOrderStatus.REPAIR_IN_PROGRESS]: [
    {
      label: "维修完成",
      route: "/orders/{id}",
      intent: "complete",
      roles: [Role.TECHNICIAN],
      variant: "primary",
    },
  ],
  [WorkOrderStatus.COMPLETED]: [
    {
      label: "查看工单",
      route: "/orders/{id}",
      roles: [Role.RECEPTIONIST, Role.MANAGER, Role.TECHNICIAN],
      variant: "secondary",
    },
  ],
  [WorkOrderStatus.CANCELLED]: [],
};
