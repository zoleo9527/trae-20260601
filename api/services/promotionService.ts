
import { db } from '../db/database.js';
import type {
  PromotionDisplay,
  CreatePromotionRequest,
  Remark,
} from '../../shared/types.js';

export function getAllPromotions(storeId?: string): PromotionDisplay[] {
  let promotions = db.promotions;
  if (storeId) {
    promotions = promotions.filter((p) => p.storeId === storeId);
  }
  return promotions;
}

export function getPromotionById(id: string): PromotionDisplay | null {
  return db.getPromotionById(id);
}

export function createPromotion(
  data: CreatePromotionRequest,
  specialistId: string,
  specialistName: string
): PromotionDisplay {
  return db.addPromotion({
    title: data.title,
    description: data.description,
    storeId: data.storeId,
    storeName: data.storeName,
    productSpecialistId: specialistId,
    productSpecialistName: specialistName,
    status: 'pending',
    deadline: data.deadline,
  });
}

export function updatePromotionStatus(id: string, status: string, userId?: string, userName?: string, userRole?: string): boolean {
  return db.updatePromotionStatus(id, status, userId, userName, userRole);
}

export function addPromotionRemark(
  promotionId: string,
  userId: string,
  userName: string,
  userRole: string,
  content: string
): Remark {
  return db.addPromotionRemark(promotionId, userId, userName, userRole, content);
}

export function getRelatedRemarksForInspection(promotionId: string | null | undefined): Remark[] {
  return db.getPromotionRemarksForInspection(promotionId);
}
