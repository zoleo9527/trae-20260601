import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';
import { PropertyService } from '../property/property.service';

export interface DeductionItem {
  item: string;
  amount: number;
}

export interface DepositDispute {
  disputeReason: string;
  disputedAmount: number;
  deductionItems: DeductionItem[];
  raisedAt: Date;
  raisedBy: string;
  raisedByName: string;
}

export interface DepositResolution {
  finalAmount: number;
  resolutionNotes: string;
  resolvedAt: Date;
  resolvedBy: string;
  resolvedByName: string;
}

export interface Deposit {
  id: string;
  propertyId: string;
  handoverId?: string;
  tenantName: string;
  originalDeposit: number;
  deductions: DeductionItem[];
  totalDeductions: number;
  refundAmount: number;
  status: 'pending' | 'confirmed' | 'disputed' | 'settled';
  initiatedBy: string;
  initiatedByName: string;
  initiatedAt: Date;
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedAt?: Date;
  dispute?: DepositDispute;
  resolution?: DepositResolution;
  settledAt?: Date;
  settledBy?: string;
  settledByName?: string;
}

export interface CreateDepositData {
  propertyId: string;
  handoverId?: string;
  tenantName: string;
  originalDeposit: number;
  deductions: DeductionItem[];
}

export interface DepositFilters {
  propertyId?: string;
  status?: string;
}

@Injectable()
export class DepositService {
  private readonly deposits: Deposit[] = [];

  constructor(
    private readonly auditService: AuditService,
    private readonly propertyService: PropertyService,
  ) {}

  initiate(data: CreateDepositData, userId: string, userName: string, userRole: string): Deposit {
    this.propertyService.findOne(data.propertyId);

    const totalDeductions = data.deductions.reduce((sum, d) => sum + d.amount, 0);
    const refundAmount = data.originalDeposit - totalDeductions;

    const deposit: Deposit = {
      id: uuidv4(),
      propertyId: data.propertyId,
      handoverId: data.handoverId,
      tenantName: data.tenantName,
      originalDeposit: data.originalDeposit,
      deductions: data.deductions,
      totalDeductions,
      refundAmount,
      status: 'pending',
      initiatedBy: userId,
      initiatedByName: userName,
      initiatedAt: new Date(),
    };

    this.deposits.push(deposit);

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'initiate',
      entity: 'deposit',
      entityId: deposit.id,
      after: { ...deposit },
    });

    return deposit;
  }

  confirm(id: string, userId: string, userName: string, userRole: string): Deposit {
    const deposit = this.findOne(id);

    if (deposit.status !== 'pending') {
      throw new BadRequestException(`押金记录状态为 "${deposit.status}"，无法确认`);
    }

    const before = { ...deposit };
    deposit.status = 'confirmed';
    deposit.confirmedBy = userId;
    deposit.confirmedByName = userName;
    deposit.confirmedAt = new Date();

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'confirm',
      entity: 'deposit',
      entityId: deposit.id,
      before: { status: before.status },
      after: { status: deposit.status, confirmedBy: userId, confirmedByName: userName, confirmedAt: deposit.confirmedAt },
    });

    return deposit;
  }

  dispute(
    id: string,
    data: { disputeReason: string; disputedAmount: number; deductionItems: DeductionItem[] },
    userId: string,
    userName: string,
    userRole: string,
  ): Deposit {
    const deposit = this.findOne(id);

    if (deposit.status !== 'pending' && deposit.status !== 'confirmed') {
      throw new BadRequestException(`押金记录状态为 "${deposit.status}"，无法提出异议`);
    }

    const before = { ...deposit };
    deposit.status = 'disputed';
    deposit.dispute = {
      disputeReason: data.disputeReason,
      disputedAmount: data.disputedAmount,
      deductionItems: data.deductionItems,
      raisedAt: new Date(),
      raisedBy: userId,
      raisedByName: userName,
    };

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'dispute',
      entity: 'deposit',
      entityId: deposit.id,
      before: { status: before.status },
      after: {
        status: deposit.status,
        dispute: deposit.dispute,
      },
    });

    return deposit;
  }

  resolve(
    id: string,
    resolution: { finalAmount: number; resolutionNotes: string },
    userId: string,
    userName: string,
    userRole: string,
  ): Deposit {
    const deposit = this.findOne(id);

    if (deposit.status !== 'disputed') {
      throw new BadRequestException(`押金记录状态为 "${deposit.status}"，无法解决异议`);
    }

    const before = { ...deposit };
    deposit.status = 'settled';
    deposit.resolution = {
      finalAmount: resolution.finalAmount,
      resolutionNotes: resolution.resolutionNotes,
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolvedByName: userName,
    };
    deposit.refundAmount = resolution.finalAmount;
    deposit.settledAt = new Date();
    deposit.settledBy = userId;
    deposit.settledByName = userName;

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'resolve',
      entity: 'deposit',
      entityId: deposit.id,
      before: { status: before.status },
      after: {
        status: deposit.status,
        resolution: deposit.resolution,
        refundAmount: deposit.refundAmount,
        settledAt: deposit.settledAt,
        settledBy: deposit.settledBy,
        settledByName: deposit.settledByName,
      },
    });

    return deposit;
  }

  markSettled(id: string, userId: string, userName: string, userRole: string): Deposit {
    const deposit = this.findOne(id);

    if (deposit.status !== 'confirmed') {
      throw new BadRequestException(`押金记录状态为 "${deposit.status}"，无法标记为已结算`);
    }

    const before = { ...deposit };
    deposit.status = 'settled';
    deposit.settledAt = new Date();
    deposit.settledBy = userId;
    deposit.settledByName = userName;

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'markSettled',
      entity: 'deposit',
      entityId: deposit.id,
      before: { status: before.status },
      after: {
        status: deposit.status,
        settledAt: deposit.settledAt,
        settledBy: deposit.settledBy,
        settledByName: deposit.settledByName,
      },
    });

    return deposit;
  }

  findAll(filters?: DepositFilters): Deposit[] {
    let result = [...this.deposits];
    if (filters?.propertyId) {
      result = result.filter((d) => d.propertyId === filters.propertyId);
    }
    if (filters?.status) {
      result = result.filter((d) => d.status === filters.status);
    }
    return result;
  }

  findOne(id: string): Deposit {
    const deposit = this.deposits.find((d) => d.id === id);
    if (!deposit) {
      throw new NotFoundException(`押金记录 #${id} 未找到`);
    }
    return deposit;
  }

  getDisputes(): Deposit[] {
    return this.deposits.filter((d) => d.status === 'disputed');
  }
}
