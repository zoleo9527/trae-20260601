import type { Promotion, ProcessStep, Remark, SalesData, Role, PromotionStatus } from '@/types';
import { generateId } from '@/utils/id';
import { StorageService } from './storage';

interface CreatePromotionParams {
  title: string;
  counter: string;
  brand: string;
  type: string;
  startDate: string;
  endDate: string;
  budget: number;
  description: string;
  operator: string;
}

interface ProcessParams {
  promotionId: string;
  role: Role;
  action: 'submit' | 'approve' | 'reject' | 'complete';
  operator: string;
  comment: string;
  remarkContent?: string;
}

interface AddRemarkParams {
  promotionId: string;
  stepId?: string;
  role: Role;
  content: string;
  operator: string;
}

interface AddSalesDataParams {
  promotionId: string;
  actualSales: number;
  targetSales: number;
  customerCount: number;
  operator: string;
  comment: string;
}

const STATUS_TRANSITIONS: Record<PromotionStatus, Partial<Record<Role, { nextStatus: PromotionStatus; nextRole: Role }>>> = {
  draft: {
    counterManager: { nextStatus: 'pendingSupervisor', nextRole: 'floorSupervisor' },
  },
  pendingSupervisor: {
    floorSupervisor: { nextStatus: 'pendingBrand', nextRole: 'brandSupervisor' },
  },
  pendingBrand: {
    brandSupervisor: { nextStatus: 'active', nextRole: 'brandSupervisor' },
  },
  active: {
    brandSupervisor: { nextStatus: 'salesPending', nextRole: 'brandSupervisor' },
  },
  salesPending: {
    brandSupervisor: { nextStatus: 'completed', nextRole: 'brandSupervisor' },
  },
  completed: {},
  rejected: {
    counterManager: { nextStatus: 'draft', nextRole: 'counterManager' },
    floorSupervisor: { nextStatus: 'pendingSupervisor', nextRole: 'floorSupervisor' },
  },
};

export class PromotionService {
  static createPromotion(params: CreatePromotionParams): Promotion {
    const now = new Date().toISOString();
    const promotion: Promotion = {
      id: generateId(),
      ...params,
      status: 'draft',
      currentRole: 'counterManager',
      createdAt: now,
      updatedAt: now,
      steps: [
        {
          id: generateId(),
          promotionId: '',
          role: 'counterManager',
          action: 'create',
          operator: params.operator,
          comment: '创建促销单',
          createdAt: now,
        },
      ],
      remarks: [],
    };
    promotion.steps[0].promotionId = promotion.id;
    StorageService.savePromotion(promotion);
    return promotion;
  }

  static processPromotion(params: ProcessParams): Promotion | null {
    const promotion = StorageService.getPromotion(params.promotionId);
    if (!promotion) return null;

    const transition = STATUS_TRANSITIONS[promotion.status]?.[params.role];
    if (!transition && params.action !== 'reject') return null;

    const now = new Date().toISOString();
    const step: ProcessStep = {
      id: generateId(),
      promotionId: params.promotionId,
      role: params.role,
      action: params.action,
      operator: params.operator,
      comment: params.comment,
      createdAt: now,
    };

    let newStatus: PromotionStatus;
    let newRole: Role;

    if (params.action === 'reject') {
      newStatus = 'rejected';
      newRole = promotion.steps.length > 1 
        ? promotion.steps[promotion.steps.length - 2].role 
        : 'counterManager';
    } else if (transition) {
      newStatus = transition.nextStatus;
      newRole = transition.nextRole;
    } else {
      return null;
    }

    promotion.steps.push(step);
    promotion.status = newStatus;
    promotion.currentRole = newRole;
    promotion.updatedAt = now;

    if (params.remarkContent) {
      const remark: Remark = {
        id: generateId(),
        promotionId: params.promotionId,
        stepId: step.id,
        role: params.role,
        operator: params.operator,
        content: params.remarkContent,
        attachments: [],
        createdAt: now,
      };
      promotion.remarks.push(remark);
    }

    StorageService.savePromotion(promotion);
    return promotion;
  }

  static addRemark(params: AddRemarkParams): Promotion | null {
    const promotion = StorageService.getPromotion(params.promotionId);
    if (!promotion) return null;

    const now = new Date().toISOString();
    const remark: Remark = {
      id: generateId(),
      promotionId: params.promotionId,
      stepId: params.stepId,
      role: params.role,
      operator: params.operator,
      content: params.content,
      attachments: [],
      createdAt: now,
    };

    promotion.remarks.push(remark);
    promotion.updatedAt = now;
    StorageService.savePromotion(promotion);
    return promotion;
  }

  static addSalesData(params: AddSalesDataParams): Promotion | null {
    const promotion = StorageService.getPromotion(params.promotionId);
    if (!promotion) return null;

    const now = new Date().toISOString();
    const salesData: SalesData = {
      id: generateId(),
      promotionId: params.promotionId,
      actualSales: params.actualSales,
      targetSales: params.targetSales,
      customerCount: params.customerCount,
      operator: params.operator,
      comment: params.comment,
      createdAt: now,
    };

    promotion.salesData = salesData;
    promotion.updatedAt = now;
    StorageService.savePromotion(promotion);
    return promotion;
  }

  static getPendingForRole(role: Role): Promotion[] {
    const promotions = StorageService.getPromotions();
    return promotions.filter(p => 
      p.currentRole === role && p.status !== 'completed'
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getAllPromotions(): Promotion[] {
    return StorageService.getPromotions().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  static getCompletedForSalesReview(): Promotion[] {
    return StorageService.getPromotions()
      .filter(p => p.salesData || p.status === 'completed' || p.status === 'salesPending')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static canProcess(promotion: Promotion, role: Role): boolean {
    if (promotion.status === 'completed') return false;
    if (promotion.currentRole !== role) return false;
    return true;
  }

  static getAvailableActions(promotion: Promotion, role: Role): string[] {
    if (!this.canProcess(promotion, role)) return [];
    
    const actions: string[] = [];
    
    if (promotion.status === 'draft' && role === 'counterManager') {
      actions.push('submit');
    } else if (promotion.status === 'pendingSupervisor' && role === 'floorSupervisor') {
      actions.push('approve', 'reject');
    } else if (promotion.status === 'pendingBrand' && role === 'brandSupervisor') {
      actions.push('approve', 'reject');
    } else if (promotion.status === 'active' && role === 'brandSupervisor') {
      actions.push('complete');
    } else if (promotion.status === 'salesPending' && role === 'brandSupervisor') {
      actions.push('complete');
    }
    
    return actions;
  }
}
