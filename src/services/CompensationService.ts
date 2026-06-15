import { Compensation, WarrantyClaim, User, Tire } from '../models';
import CompensationStatus, { CompensationStatusTransitions } from '../models/CompensationStatus';
import ClaimStatus from '../models/ClaimStatus';
import { CompensationType } from '../models/Compensation';

export interface CreateCompensationRequest {
  claimId: number;
  type: CompensationType;
  amount: number;
  description: string;
}

export interface UpdateCompensationRequest {
  type?: CompensationType;
  amount?: number;
  description?: string;
}

export interface ApproveCompensationRequest {
  compensationId: number;
  approvedBy: number;
  comment?: string;
}

export interface PayCompensationRequest {
  compensationId: number;
  paidBy: number;
}

export interface ProcessCompensationRequest {
  compensationId: number;
  processedBy: number;
}

class CompensationService {
  async createCompensation(data: CreateCompensationRequest): Promise<Compensation> {
    const claim = await WarrantyClaim.findByPk(data.claimId);
    if (!claim) {
      throw new Error('申诉不存在');
    }

    if (claim.status !== ClaimStatus.APPROVED && claim.status !== ClaimStatus.COMPENSATION_PROCESSING) {
      throw new Error('申诉未批准，无法创建补偿');
    }

    const existingCompensation = await Compensation.findOne({ where: { claimId: data.claimId } });
    if (existingCompensation) {
      throw new Error('该申诉已存在补偿记录');
    }

    return await Compensation.create({
      ...data,
      status: CompensationStatus.PENDING,
    });
  }

  async getCompensationById(id: number): Promise<Compensation | null> {
    return await Compensation.findByPk(id, {
      include: [
        { 
          model: WarrantyClaim, 
          include: [
            { model: Tire },
            { model: User, as: 'creator' },
            { model: User, as: 'technician' },
            { model: User, as: 'manager' },
          ]
        },
        { model: User, as: 'approver' },
        { model: User, as: 'payer' },
      ],
    });
  }

  async getCompensationsByClaimId(claimId: number): Promise<Compensation[]> {
    return await Compensation.findAll({
      where: { claimId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'approver' },
        { model: User, as: 'payer' },
      ],
    });
  }

  async updateCompensation(id: number, data: UpdateCompensationRequest): Promise<Compensation | null> {
    const compensation = await Compensation.findByPk(id);
    if (!compensation) return null;

    if (compensation.status !== CompensationStatus.PENDING) {
      throw new Error('只能修改待审核状态的补偿');
    }

    await compensation.update(data);
    return compensation;
  }

  async processCompensation(data: ProcessCompensationRequest): Promise<Compensation> {
    const compensation = await Compensation.findByPk(data.compensationId);
    if (!compensation) {
      throw new Error('补偿记录不存在');
    }

    if (!CompensationStatusTransitions[compensation.status].includes(CompensationStatus.PROCESSING)) {
      throw new Error('当前状态不允许进入处理中');
    }

    await compensation.update({ status: CompensationStatus.PROCESSING });
    return compensation;
  }

  async approveCompensation(data: ApproveCompensationRequest): Promise<Compensation> {
    const compensation = await Compensation.findByPk(data.compensationId);
    if (!compensation) {
      throw new Error('补偿记录不存在');
    }

    if (!CompensationStatusTransitions[compensation.status].includes(CompensationStatus.APPROVED)) {
      throw new Error('当前状态不允许批准');
    }

    await compensation.update({
      status: CompensationStatus.APPROVED,
      approvedBy: data.approvedBy,
      approvalComment: data.comment,
    });

    const claim = await WarrantyClaim.findByPk(compensation.claimId);
    if (claim && claim.status === ClaimStatus.APPROVED) {
      await claim.update({ status: ClaimStatus.COMPENSATION_PROCESSING });
    }

    return compensation;
  }

  async payCompensation(data: PayCompensationRequest): Promise<Compensation> {
    const compensation = await Compensation.findByPk(data.compensationId);
    if (!compensation) {
      throw new Error('补偿记录不存在');
    }

    if (!CompensationStatusTransitions[compensation.status].includes(CompensationStatus.PAID)) {
      throw new Error('当前状态不允许支付');
    }

    await compensation.update({
      status: CompensationStatus.PAID,
      paidBy: data.paidBy,
      paymentDate: new Date(),
    });

    return compensation;
  }

  async completeCompensation(compensationId: number): Promise<Compensation> {
    const compensation = await Compensation.findByPk(compensationId);
    if (!compensation) {
      throw new Error('补偿记录不存在');
    }

    if (!CompensationStatusTransitions[compensation.status].includes(CompensationStatus.COMPLETED)) {
      throw new Error('当前状态不允许完成');
    }

    await compensation.update({ status: CompensationStatus.COMPLETED });

    const claim = await WarrantyClaim.findByPk(compensation.claimId);
    if (claim && claim.status === ClaimStatus.COMPENSATION_PROCESSING) {
      await claim.update({ 
        status: ClaimStatus.COMPLETED,
        resolvedAt: new Date(),
      });
    }

    return compensation;
  }

  async cancelCompensation(compensationId: number): Promise<Compensation> {
    const compensation = await Compensation.findByPk(compensationId);
    if (!compensation) {
      throw new Error('补偿记录不存在');
    }

    if (!CompensationStatusTransitions[compensation.status].includes(CompensationStatus.CANCELLED)) {
      throw new Error('当前状态不允许取消');
    }

    await compensation.update({ status: CompensationStatus.CANCELLED });
    return compensation;
  }

  async getCompensationByStatus(status: CompensationStatus): Promise<Compensation[]> {
    return await Compensation.findAll({
      where: { status },
      order: [['createdAt', 'ASC']],
      include: [
        { 
          model: WarrantyClaim, 
          include: [{ model: Tire }]
        },
      ],
    });
  }
}

export default new CompensationService();