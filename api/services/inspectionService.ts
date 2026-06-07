
import { db } from '../db/database.js';
import type {
  InspectionRectification,
  CreateInspectionRequest,
  Remark,
} from '../../shared/types.js';

export function getAllInspections(storeId?: string): InspectionRectification[] {
  let inspections = db.inspections;
  if (storeId) {
    inspections = inspections.filter((i) => i.storeId === storeId);
  }
  return inspections.map((i) => {
    const inspectionRemarks = db.remarks.filter((r) => r.sourceId === i.id && r.source === 'inspection');
    return { ...i, remarks: inspectionRemarks };
  });
}

export function getInspectionById(id: string): InspectionRectification | null {
  return db.getInspectionById(id);
}

export function createInspection(
  data: CreateInspectionRequest,
  supervisorId: string,
  supervisorName: string
): InspectionRectification {
  let promotionTitle: string | undefined;
  if (data.promotionId) {
    const promo = db.getPromotionById(data.promotionId);
    promotionTitle = promo?.title;
  }

  return db.addInspection({
    promotionId: data.promotionId,
    promotionTitle,
    storeId: data.storeId,
    storeName: data.storeName,
    supervisorId,
    supervisorName,
    title: data.title,
    description: data.description,
    requirement: data.requirement,
    status: 'pending',
    deadline: data.deadline,
  });
}

export function updateInspectionStatus(
  id: string,
  status: string,
  rejectReason?: string,
  userId?: string,
  userName?: string,
  userRole?: string
): boolean {
  return db.updateInspectionStatus(id, status, rejectReason, userId, userName, userRole);
}

export function replyInspection(id: string, content: string, userId?: string, userName?: string, userRole?: string): boolean {
  return db.replyInspection(id, content, userId, userName, userRole);
}

export function addInspectionRemark(
  inspectionId: string,
  userId: string,
  userName: string,
  userRole: string,
  content: string
): Remark {
  return db.addInspectionRemark(inspectionId, userId, userName, userRole, content);
}
