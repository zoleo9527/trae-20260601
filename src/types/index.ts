export type VerificationStatus = "normal" | "abnormal" | "refunded";
export type ComplaintStatus = "pending" | "processing" | "to_visit" | "completed" | "escalated";
export type SeverityLevel = "normal" | "serious" | "urgent";
export type ResponsibleParty = "front" | "kitchen" | "both";
export type UserRole = "cashier" | "kitchen_lead" | "floor_manager";
export type VisitMethod = "phone" | "onsite" | "wechat";

export interface Verification {
  id: string;
  platform: "美团" | "抖音" | "大众点评";
  couponName: string;
  amount: number;
  tableNo: string;
  peopleCount: number;
  cashier: string;
  verifyTime: string;
  status: VerificationStatus;
  complaintId?: string;
  remark?: string;
}

export interface VisitLog {
  id: string;
  complaintId: string;
  visitor: string;
  visitTime: string;
  method: VisitMethod;
  result: string;
  feedback: string;
  satisfaction: number;
}

export interface TimelineStep {
  key: string;
  title: string;
  time?: string;
  operator?: string;
  description?: string;
  status: "done" | "current" | "pending";
}

export interface Complaint {
  id: string;
  verificationId: string;
  source: "现场" | "电话" | "平台";
  content: string;
  severity: SeverityLevel;
  responsibleParty: ResponsibleParty;
  handler: string;
  status: ComplaintStatus;
  createTime: string;
  deadline?: string;
  kitchenNote?: string;
  visitLogs: VisitLog[];
}

export interface ActivityItem {
  id: string;
  actor: string;
  role: UserRole;
  action: string;
  target: string;
  time: string;
}

export interface TodoItem {
  id: string;
  type: "verification" | "complaint" | "visit";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  time: string;
  relatedId: string;
  complaintStatus?: ComplaintStatus;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: "danger" | "warning";
  timeLeft?: string;
  relatedId: string;
  relatedType: "verification" | "complaint";
}
