import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';
import { PropertyService } from '../property/property.service';

const DEFAULT_CHECKLIST_ITEMS = [
  '门窗完好',
  '水电正常',
  '空调设备正常',
  '墙面地面无破损',
  '消防设施完好',
  '网络线路正常',
  '卫生清洁完成',
];

export interface ChecklistItem {
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
}

export interface HandoverDispute {
  reason: string;
  disputedItems: string[];
  raisedAt: Date;
  raisedBy: string;
  raisedByName: string;
}

export interface Handover {
  id: string;
  propertyId: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: Date;
  checklist: ChecklistItem[];
  issues: string[];
  status: 'pending' | 'confirmed' | 'disputed' | 'resolved';
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedAt?: Date;
  dispute?: HandoverDispute;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolvedByName?: string;
}

export interface HandoverFilters {
  propertyId?: string;
  status?: string;
  submittedBy?: string;
}

@Injectable()
export class HandoverService {
  private handovers: Handover[] = [];

  constructor(
    private readonly auditService: AuditService,
    private readonly propertyService: PropertyService,
  ) {}

  submit(
    data: { propertyId: string; checklist?: ChecklistItem[]; issues?: string[] },
    userId: string,
    userName: string,
    userRole: string,
  ): Handover {
    const property = this.propertyService.findOne(data.propertyId);
    if (property.status !== 'leased' && property.status !== 'handover_pending') {
      throw new BadRequestException('房源状态不允许提交交房验收，当前状态: ' + property.status);
    }

    const checklist: ChecklistItem[] = data.checklist
      ? data.checklist
      : DEFAULT_CHECKLIST_ITEMS.map((item) => ({ item, status: 'na' as const }));

    const handover: Handover = {
      id: uuidv4(),
      propertyId: data.propertyId,
      submittedBy: userId,
      submittedByName: userName,
      submittedAt: new Date(),
      checklist,
      issues: data.issues ?? [],
      status: 'pending',
    };

    this.propertyService.updateStatus(data.propertyId, 'handover_pending', userId, userName, userRole);
    this.handovers.push(handover);

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'submit',
      entity: 'handover',
      entityId: handover.id,
      after: handover,
    });

    return handover;
  }

  confirm(id: string, userId: string, userName: string, userRole: string): Handover {
    const handover = this.handovers.find((h) => h.id === id);
    if (!handover) {
      throw new NotFoundException('交房验收记录不存在');
    }
    if (handover.status !== 'pending') {
      throw new BadRequestException('只能确认待处理状态的交房验收');
    }

    const before = { ...handover };
    handover.status = 'confirmed';
    handover.confirmedBy = userId;
    handover.confirmedByName = userName;
    handover.confirmedAt = new Date();

    this.propertyService.updateStatus(handover.propertyId, 'handover_accepted', userId, userName, userRole);

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'confirm',
      entity: 'handover',
      entityId: handover.id,
      before,
      after: handover,
    });

    return handover;
  }

  dispute(
    id: string,
    data: { reason: string; disputedItems: string[] },
    userId: string,
    userName: string,
    userRole: string,
  ): Handover {
    const handover = this.handovers.find((h) => h.id === id);
    if (!handover) {
      throw new NotFoundException('交房验收记录不存在');
    }
    if (handover.status !== 'pending') {
      throw new BadRequestException('只能对待处理状态的交房验收提出异议');
    }

    const before = { ...handover };
    handover.status = 'disputed';
    handover.dispute = {
      reason: data.reason,
      disputedItems: data.disputedItems,
      raisedAt: new Date(),
      raisedBy: userId,
      raisedByName: userName,
    };

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'dispute',
      entity: 'handover',
      entityId: handover.id,
      before,
      after: handover,
    });

    return handover;
  }

  resolve(
    id: string,
    resolution: string,
    userId: string,
    userName: string,
    userRole: string,
  ): Handover {
    const handover = this.handovers.find((h) => h.id === id);
    if (!handover) {
      throw new NotFoundException('交房验收记录不存在');
    }
    if (handover.status !== 'disputed') {
      throw new BadRequestException('只能解决异议状态的交房验收');
    }

    const before = { ...handover };
    handover.status = 'pending';
    handover.resolution = resolution;
    handover.resolvedAt = new Date();
    handover.resolvedBy = userId;
    handover.resolvedByName = userName;

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'resolve',
      entity: 'handover',
      entityId: handover.id,
      before,
      after: handover,
    });

    return handover;
  }

  findAll(filters?: HandoverFilters): Handover[] {
    let result = [...this.handovers];
    if (filters?.propertyId) {
      result = result.filter((h) => h.propertyId === filters.propertyId);
    }
    if (filters?.status) {
      result = result.filter((h) => h.status === filters.status);
    }
    if (filters?.submittedBy) {
      result = result.filter((h) => h.submittedBy === filters.submittedBy);
    }
    result.sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
    );
    return result;
  }

  findOne(id: string): Handover {
    const handover = this.handovers.find((h) => h.id === id);
    if (!handover) {
      throw new NotFoundException('交房验收记录不存在');
    }
    return handover;
  }

  getDisputes(): Handover[] {
    return this.handovers
      .filter((h) => h.status === 'disputed')
      .sort(
        (a, b) =>
          b.dispute!.raisedAt.getTime() - a.dispute!.raisedAt.getTime(),
      );
  }

  getAuditTrail(id: string) {
    this.findOne(id);
    return this.auditService.getByEntity('handover', id);
  }
}
