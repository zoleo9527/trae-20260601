export type ParcelStatus =
  | "arrived_pending"
  | "dispatched_pending"
  | "delivering"
  | "signed"
  | "problem_pending"
  | "closed";

export type ResponsibleType = "customer_service" | "courier" | "station_manager";

export interface Parcel {
  id: number;
  trackingNo: string;
  status: ParcelStatus;
  responsibleId: number;
  responsibleType: ResponsibleType;
  responsibleName: string;
  assigneeId: number | null;
  assigneeType: "courier" | "station" | null;
  assigneeName: string | null;
  scannedBy: number;
  scannedByName: string;
  arrivedAt: string;
  dispatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelAuditLog {
  id: number;
  parcelId: number;
  fromStatus: ParcelStatus | null;
  toStatus: ParcelStatus;
  operatorId: number;
  operatorName: string;
  operatorRole: string;
  responsibleId: number;
  responsibleType: ResponsibleType;
  responsibleName: string;
  note: string | null;
  createdAt: string;
}

export interface Staff {
  id: number;
  name: string;
  role: "customer_service" | "courier" | "station_manager";
  stationId: number | null;
  stationName: string | null;
}

export interface Station {
  id: number;
  name: string;
  managerId: number;
  managerName: string | null;
}

export interface ProblemParcel {
  id: number;
  parcelId: number;
  trackingNo: string;
  problemType: string;
  resolution: string | null;
  reportedBy: number;
  reportedByName: string;
  resolvedBy: number | null;
  resolvedByName: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  parcelStatus: ParcelStatus;
}

export const STATUS_LABELS: Record<ParcelStatus, string> = {
  arrived_pending: "已到件-待分配",
  dispatched_pending: "已分配-待派件",
  delivering: "派件中",
  signed: "已签收",
  problem_pending: "问题件-待处理",
  closed: "已关闭",
};

export const ROLE_LABELS: Record<string, string> = {
  customer_service: "客服",
  courier: "派件员",
  station_manager: "驿站负责人",
};

export const PROBLEM_TYPES = [
  "外包装破损",
  "地址错误",
  "收件人拒收",
  "超时未取件",
  "其他",
] as const;

export const VALID_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  arrived_pending: ["dispatched_pending", "problem_pending"],
  dispatched_pending: ["delivering", "problem_pending"],
  delivering: ["signed", "problem_pending"],
  signed: [],
  problem_pending: ["arrived_pending", "closed"],
  closed: [],
};

export const RESPONSIBLE_RULES: Record<ParcelStatus, (assigneeType: "courier" | "station" | null) => ResponsibleType> = {
  arrived_pending: () => "customer_service",
  dispatched_pending: (assigneeType) => assigneeType === "station" ? "station_manager" : "courier",
  delivering: () => "courier",
  signed: () => "courier",
  problem_pending: () => "courier",
  closed: () => "customer_service",
};
