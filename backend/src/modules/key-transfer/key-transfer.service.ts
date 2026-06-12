import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';
import { HandoverService } from '../handover/handover.service';
import { PropertyService } from '../property/property.service';

export interface KeyTransfer {
  id: string;
  propertyId: string;
  handoverId: string;
  keyCount: number;
  keyTypes: string[];
  transferredBy: string;
  transferredByName: string;
  transferredAt: Date;
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: Date;
  returnedAt?: Date;
  returnedBy?: string;
  returnedByName?: string;
  returnNotes?: string;
  status: 'pending_transfer' | 'transferred' | 'returned';
}

export interface KeyTransferFilters {
  propertyId?: string;
  handoverId?: string;
  status?: string;
}

@Injectable()
export class KeyTransferService {
  private readonly transfers: KeyTransfer[] = [];

  constructor(
    private readonly auditService: AuditService,
    private readonly handoverService: HandoverService,
    private readonly propertyService: PropertyService,
  ) {}

  initiateTransfer(
    data: { propertyId: string; handoverId: string; keyCount: number; keyTypes: string[] },
    userId: string,
    userName: string,
    userRole: string,
  ): KeyTransfer {
    let handover: any;
    try {
      handover = this.handoverService.findOne(data.handoverId);
    } catch {
      throw new BadRequestException('交房验收记录不存在');
    }

    if (handover.status !== 'confirmed') {
      throw new BadRequestException('只能对已确认的交房验收发起钥匙移交，当前状态: ' + handover.status);
    }

    if (handover.propertyId !== data.propertyId) {
      throw new BadRequestException('交房验收与房源不匹配');
    }

    const existingTransfer = this.transfers.find(
      (t) => t.handoverId === data.handoverId && t.status !== 'returned',
    );
    if (existingTransfer) {
      throw new BadRequestException('该交房验收已有进行中的钥匙移交');
    }

    const transfer: KeyTransfer = {
      id: uuidv4(),
      propertyId: data.propertyId,
      handoverId: data.handoverId,
      keyCount: data.keyCount,
      keyTypes: data.keyTypes,
      transferredBy: userId,
      transferredByName: userName,
      transferredAt: new Date(),
      status: 'pending_transfer',
    };

    this.transfers.push(transfer);

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'initiate_transfer',
      entity: 'key_transfer',
      entityId: transfer.id,
      after: transfer,
    });

    return transfer;
  }

  confirmReception(id: string, userId: string, userName: string, userRole: string): KeyTransfer {
    const transfer = this.transfers.find((t) => t.id === id);
    if (!transfer) {
      throw new NotFoundException('钥匙移交记录不存在');
    }
    if (transfer.status !== 'pending_transfer') {
      throw new BadRequestException('只能确认待接收状态的钥匙移交');
    }

    const before = { ...transfer };
    transfer.status = 'transferred';
    transfer.receivedBy = userId;
    transfer.receivedByName = userName;
    transfer.receivedAt = new Date();

    try {
      this.propertyService.updateStatus(transfer.propertyId, 'occupied', userId, userName, userRole);
    } catch (e) {
      // 状态不匹配时不阻断流程，记录日志即可
    }

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'confirm_reception',
      entity: 'key_transfer',
      entityId: transfer.id,
      before,
      after: transfer,
    });

    return transfer;
  }

  returnKeys(
    id: string,
    data: { returnNotes?: string },
    userId: string,
    userName: string,
    userRole: string,
  ): KeyTransfer {
    const transfer = this.transfers.find((t) => t.id === id);
    if (!transfer) {
      throw new NotFoundException('钥匙移交记录不存在');
    }
    if (transfer.status !== 'transferred') {
      throw new BadRequestException('只能归还已移交状态的钥匙');
    }

    const before = { ...transfer };
    transfer.status = 'returned';
    transfer.returnedBy = userId;
    transfer.returnedByName = userName;
    transfer.returnedAt = new Date();
    transfer.returnNotes = data.returnNotes;

    try {
      this.propertyService.updateStatus(transfer.propertyId, 'returning', userId, userName, userRole);
    } catch (e) {
      // 状态不匹配时不阻断流程
    }

    this.auditService.log({
      userId,
      userName,
      userRole,
      action: 'return_keys',
      entity: 'key_transfer',
      entityId: transfer.id,
      before,
      after: transfer,
    });

    return transfer;
  }

  findAll(filters?: KeyTransferFilters): KeyTransfer[] {
    let result = [...this.transfers];
    if (filters?.propertyId) {
      result = result.filter((t) => t.propertyId === filters.propertyId);
    }
    if (filters?.handoverId) {
      result = result.filter((t) => t.handoverId === filters.handoverId);
    }
    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    result.sort((a, b) => b.transferredAt.getTime() - a.transferredAt.getTime());
    return result;
  }

  findOne(id: string): KeyTransfer {
    const transfer = this.transfers.find((t) => t.id === id);
    if (!transfer) {
      throw new NotFoundException('钥匙移交记录不存在');
    }
    return transfer;
  }

  getTransferHistory(id: string) {
    const transfer = this.findOne(id);
    return this.auditService.getByEntity('key_transfer', transfer.id);
  }

  getByHandover(handoverId: string): KeyTransfer {
    const transfer = this.transfers.find((t) => t.handoverId === handoverId);
    if (!transfer) {
      throw new NotFoundException('该交房验收暂无钥匙移交记录');
    }
    return transfer;
  }
}
