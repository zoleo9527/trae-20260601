export type ReferralStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "sent"
  | "result_returned"
  | "change_alerted"
  | "confirmed"
  | "closed";

export type Urgency = "routine" | "urgent" | "emergency";

export type UserRole = "gp" | "nurse" | "pho";

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
}

export interface Referral {
  id: number;
  patientName: string;
  patientAge: number;
  patientGender: "male" | "female";
  reason: string;
  targetDept: string;
  urgency: Urgency;
  expectedReturnDays: number;
  status: ReferralStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ReferralStatusChange {
  id: number;
  referralId: number;
  fromStatus: ReferralStatus | null;
  toStatus: ReferralStatus;
  operatorId: number;
  operatorRole: string;
  operatorName: string;
  note: string | null;
  createdAt: string;
}

export interface ReferralChangeSnapshot {
  id: number;
  referralId: number;
  field: string;
  oldValue: string;
  newValue: string;
  operatorId: number;
  operatorName: string;
  note: string;
  createdAt: string;
}

export interface ResultReturn {
  id: number;
  referralId: number;
  resultContent: string;
  resultDept: string;
  resultDoctor: string;
  referralModifiedAfterSent: boolean;
  changeAcknowledged: boolean;
  confirmedBy: number | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export const STATUS_LABELS: Record<ReferralStatus, string> = {
  draft: "草稿",
  pending_review: "待审核",
  approved: "已审核",
  rejected: "已驳回",
  sent: "已发送",
  result_returned: "结果回传",
  change_alerted: "变更提醒",
  confirmed: "已确认",
  closed: "已闭环",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  routine: "常规",
  urgent: "紧急",
  emergency: "危重",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  gp: "全科医生",
  nurse: "护士",
  pho: "公共卫生专员",
};
