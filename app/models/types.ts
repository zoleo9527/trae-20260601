export type Role = "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
export type EntityType = "TEST_RECORD" | "REWORK_ORDER";
export type TestRecordStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "ARCHIVED";
export type ReworkOrderStatus = "GENERATED" | "ASSIGNED" | "RECTIFYING" | "RESUBMITTED" | "VERIFIED" | "CLOSED";
export type HandoverType = "SUBMIT" | "APPROVE" | "REJECT" | "RECTIFY" | "RESUBMIT" | "VERIFY" | "ARCHIVE" | "SUPPLEMENT";
export type AttachmentCategory = "WIRING_DIAGRAM" | "MATERIAL_REQUISITION" | "SITE_PHOTO" | "COMPLETION_DOCUMENT" | "OTHER";
export type MaterialRequisitionStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";

export interface TransitionRule {
  from: string;
  to: string;
  allowedRoles: Array<"PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK">;
  action: string;
  nextHolderRole?: "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
  requiresRework?: boolean;
  requiresSupplement?: boolean;
}

export interface StateMachineConfig {
  entity: string;
  transitions: TransitionRule[];
}

export interface TransitionInput {
  entityId: string;
  fromStatus: string;
  toStatus: string;
  operatorRole: Role;
  operatorId: string;
  operatorName: string;
  remark?: string;
  idempotencyKey: string;
}

export interface HandoverInput {
  entityType: "TEST_RECORD" | "REWORK_ORDER";
  entityId: string;
  fromRole: "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
  fromUserId: string;
  fromUserName: string;
  toRole: "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
  toUserId: string;
  toUserName: string;
  handoverType: "SUBMIT" | "APPROVE" | "REJECT" | "RECTIFY" | "RESUBMIT" | "VERIFY" | "ARCHIVE" | "SUPPLEMENT";
  remark?: string;
  testRecordId?: string;
  reworkOrderId?: string;
}

export interface UrgencyInput {
  entityType: "TEST_RECORD" | "REWORK_ORDER";
  entityId: string;
  urgentByRole: "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
  urgentById: string;
  urgentByName: string;
  urgentToRole: "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
  urgentToId: string;
  urgentToName: string;
  reason: string;
}

export interface SupplementInput {
  entityType: "TEST_RECORD" | "REWORK_ORDER";
  entityId: string;
  supplementByRole: "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK";
  supplementById: string;
  supplementByName: string;
  category: "WIRING_DIAGRAM" | "MATERIAL_REQUISITION" | "SITE_PHOTO" | "COMPLETION_DOCUMENT" | "OTHER";
  files: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }>;
  remark?: string;
  testRecordId?: string;
  reworkOrderId?: string;
}

export const ROLE_LABELS: Record<string, string> = {
  PROJECT_MANAGER: "项目负责人",
  CONSTRUCTION_TEAM: "施工班组",
  DOCUMENT_CLERK: "资料员",
};

export const TEST_RECORD_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  UNDER_REVIEW: "审核中",
  ACCEPTED: "已通过",
  REJECTED: "已退回",
  ARCHIVED: "已归档",
};

export const REWORK_ORDER_STATUS_LABELS: Record<string, string> = {
  GENERATED: "已生成",
  ASSIGNED: "已分配",
  RECTIFYING: "整改中",
  RESUBMITTED: "已重新提交",
  VERIFIED: "已验证",
  CLOSED: "已关闭",
};

export const HANDOVER_TYPE_LABELS: Record<string, string> = {
  SUBMIT: "提交",
  APPROVE: "审批通过",
  REJECT: "退回",
  RECTIFY: "整改",
  RESUBMIT: "重新提交",
  VERIFY: "验证",
  ARCHIVE: "归档",
  SUPPLEMENT: "补充材料",
};

export const ATTACHMENT_CATEGORY_LABELS: Record<string, string> = {
  WIRING_DIAGRAM: "布线图",
  MATERIAL_REQUISITION: "材料领用单",
  SITE_PHOTO: "现场照片",
  COMPLETION_DOCUMENT: "竣工资料",
  OTHER: "其他",
};
