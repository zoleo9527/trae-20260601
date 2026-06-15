import { WarrantyClaim, Tire, User, Compensation } from '../models';
import ClaimStatus, { ClaimStatusTransitions } from '../models/ClaimStatus';
import CompensationStatus from '../models/CompensationStatus';
import { Op } from 'sequelize';

export interface CreateClaimRequest {
  tireId: number;
  customerName: string;
  customerPhone: string;
  issueDescription: string;
  storeId: number;
  createdBy: number;
}

export interface UpdateClaimRequest {
  customerName?: string;
  customerPhone?: string;
  issueDescription?: string;
}

export interface TechnicianReviewRequest {
  claimId: number;
  technicianId: number;
  comment: string;
  approve: boolean;
  isRisk?: boolean;
  riskReason?: string;
}

export interface ManagerReviewRequest {
  claimId: number;
  managerId: number;
  comment: string;
  approve: boolean;
}

export interface AssignTechnicianRequest {
  claimId: number;
  technicianId: number;
}

export interface AssignManagerRequest {
  claimId: number;
  managerId: number;
}

export interface ClaimFilter {
  status?: ClaimStatus;
  storeId?: number;
  customerName?: string;
  vehiclePlate?: string;
  isRisk?: boolean;
  startDate?: Date;
  endDate?: Date;
  page: number;
  pageSize: number;
}

class WarrantyClaimService {
  async createClaim(data: CreateClaimRequest): Promise<WarrantyClaim> {
    const tire = await Tire.findByPk(data.tireId);
    if (!tire) {
      throw new Error('轮胎信息不存在');
    }

    const now = new Date();
    if (now > tire.warrantyEndDate) {
      throw new Error('轮胎已过质保期');
    }

    return await WarrantyClaim.create({
      ...data,
      status: ClaimStatus.PENDING,
    });
  }

  async getClaimById(id: number): Promise<WarrantyClaim | null> {
    return await WarrantyClaim.findByPk(id, {
      include: [
        { model: Tire },
        { model: User, as: 'creator' },
        { model: User, as: 'technician' },
        { model: User, as: 'manager' },
        { model: Compensation },
      ],
    });
  }

  async getClaims(filter: ClaimFilter): Promise<{ rows: WarrantyClaim[]; count: number }> {
    const where: Record<string, any> = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.storeId) {
      where.storeId = filter.storeId;
    }
    if (filter.customerName) {
      where.customerName = { [Op.like]: `%${filter.customerName}%` };
    }
    if (filter.isRisk !== undefined) {
      where.isRisk = filter.isRisk;
    }
    if (filter.startDate && filter.endDate) {
      where.createdAt = {
        [Op.between]: [filter.startDate, filter.endDate],
      };
    }

    const include: any[] = [{ model: Tire }];
    if (filter.vehiclePlate) {
      include[0] = {
        model: Tire,
        where: { vehiclePlate: { [Op.like]: `%${filter.vehiclePlate}%` } },
      };
    }

    return await WarrantyClaim.findAndCountAll({
      where,
      include,
      order: [['updatedAt', 'DESC']],
      limit: filter.pageSize,
      offset: (filter.page - 1) * filter.pageSize,
    });
  }

  async updateClaim(id: number, data: UpdateClaimRequest): Promise<WarrantyClaim | null> {
    const claim = await WarrantyClaim.findByPk(id);
    if (!claim) return null;

    if (claim.status !== ClaimStatus.PENDING) {
      throw new Error('只能修改待处理状态的申诉');
    }

    await claim.update(data);
    return claim;
  }

  async assignTechnician(data: AssignTechnicianRequest): Promise<WarrantyClaim> {
    const claim = await WarrantyClaim.findByPk(data.claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (!ClaimStatusTransitions[claim.status].includes(ClaimStatus.TECHNICIAN_REVIEW)) {
      throw new Error('当前状态不允许领取技师审核任务');
    }

    await claim.update({
      status: ClaimStatus.TECHNICIAN_REVIEW,
      technicianId: data.technicianId,
    });

    return claim;
  }

  async technicianReview(data: TechnicianReviewRequest): Promise<WarrantyClaim> {
    const claim = await WarrantyClaim.findByPk(data.claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (claim.status !== ClaimStatus.TECHNICIAN_REVIEW) {
      throw new Error('请先领取技师审核任务');
    }

    const updateData: Record<string, any> = {
      technicianId: data.technicianId,
      technicianComment: data.comment,
    };

    if (data.approve) {
      updateData.status = ClaimStatus.TECHNICIAN_APPROVED;
    } else {
      updateData.status = ClaimStatus.REJECTED;
    }

    if (data.isRisk) {
      updateData.isRisk = true;
      updateData.riskReason = data.riskReason;
    }

    await claim.update(updateData);
    return claim;
  }

  async assignManager(data: AssignManagerRequest): Promise<WarrantyClaim> {
    const claim = await WarrantyClaim.findByPk(data.claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (!ClaimStatusTransitions[claim.status].includes(ClaimStatus.MANAGER_REVIEW)) {
      throw new Error('当前状态不允许领取店长审核任务');
    }

    await claim.update({
      status: ClaimStatus.MANAGER_REVIEW,
      managerId: data.managerId,
    });

    return claim;
  }

  async managerReview(data: ManagerReviewRequest): Promise<WarrantyClaim> {
    const claim = await WarrantyClaim.findByPk(data.claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (claim.status !== ClaimStatus.MANAGER_REVIEW) {
      throw new Error('请先领取店长审核任务');
    }

    const updateData: Record<string, any> = {
      managerId: data.managerId,
      managerComment: data.comment,
    };

    if (data.approve) {
      updateData.status = ClaimStatus.APPROVED;
    } else {
      updateData.status = ClaimStatus.REJECTED;
    }

    await claim.update(updateData);
    return claim;
  }

  async startCompensation(claimId: number): Promise<WarrantyClaim> {
    const claim = await WarrantyClaim.findByPk(claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (!ClaimStatusTransitions[claim.status].includes(ClaimStatus.COMPENSATION_PROCESSING)) {
      throw new Error('当前状态不允许进入补偿处理');
    }

    await claim.update({ status: ClaimStatus.COMPENSATION_PROCESSING });

    const existingCompensation = await Compensation.findOne({ where: { claimId } });
    if (!existingCompensation) {
      await Compensation.create({
        claimId,
        type: 'REFUND',
        amount: 0,
        description: '待处理补偿',
        status: CompensationStatus.PENDING,
      });
    }

    return claim;
  }

  async completeClaim(claimId: number): Promise<WarrantyClaim> {
    const claim = await WarrantyClaim.findByPk(claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (!ClaimStatusTransitions[claim.status].includes(ClaimStatus.COMPLETED)) {
      throw new Error('当前状态不允许完成');
    }

    await claim.update({
      status: ClaimStatus.COMPLETED,
      resolvedAt: new Date(),
    });

    return claim;
  }

  async deleteClaim(id: number): Promise<boolean> {
    const claim = await WarrantyClaim.findByPk(id);
    if (!claim) return false;

    if (claim.status !== ClaimStatus.PENDING) {
      throw new Error('只能删除待处理状态的申诉');
    }

    await claim.destroy();
    return true;
  }

  async getRecentChanges(limit: number = 10): Promise<WarrantyClaim[]> {
    return await WarrantyClaim.findAll({
      order: [['updatedAt', 'DESC']],
      limit,
      include: [{ model: Tire }],
    });
  }

  async getPendingClaims(storeId?: number): Promise<WarrantyClaim[]> {
    const where: Record<string, any> = {
      status: {
        [Op.in]: [ClaimStatus.PENDING, ClaimStatus.TECHNICIAN_REVIEW, ClaimStatus.MANAGER_REVIEW],
      },
    };

    if (storeId) {
      where.storeId = storeId;
    }

    return await WarrantyClaim.findAll({
      where,
      order: [['createdAt', 'ASC']],
      include: [{ model: Tire }],
    });
  }

  async getRiskClaims(storeId?: number): Promise<WarrantyClaim[]> {
    const where: Record<string, any> = { isRisk: true };
    if (storeId) {
      where.storeId = storeId;
    }

    return await WarrantyClaim.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      include: [{ model: Tire }],
    });
  }
}

export default new WarrantyClaimService();