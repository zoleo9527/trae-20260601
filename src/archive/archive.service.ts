import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArchiveStatus, UserRole } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { ContractService } from '../contract/contract.service';
import { NotificationService } from '../notification/notification.service';
import { TalentService } from '../talent/talent.service';
import { ArchiveItem, BrandCooperation, ScriptVersion, TalentArchive } from './interfaces/archive.interface';

@Injectable()
export class ArchiveService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly contractService: ContractService,
    private readonly talentService: TalentService,
    private readonly notificationService: NotificationService,
  ) {}

  findAll(): TalentArchive[] {
    return this.store.getArchives();
  }

  findOne(id: string): TalentArchive {
    const archive = this.store.getArchive(id);
    if (!archive) {
      throw new NotFoundException('档案不存在');
    }
    return archive;
  }

  findByTalent(talentId: string): TalentArchive {
    const archive = this.store.getArchiveByTalent(talentId);
    if (!archive) {
      throw new NotFoundException('该达人档案不存在');
    }
    return archive;
  }

  create(talentId: string, contractId: string, operator: User): TalentArchive {
    const talent = this.talentService.findOne(talentId);
    const contract = this.contractService.findOne(contractId);

    const sharedRemarks = contract.remarks
      .filter(r => r.isSharedToArchive)
      .map(r => ({
        contractRemarkId: r.id,
        content: r.content,
        category: r.category,
        sharedAt: new Date(),
      }));

    const archive: TalentArchive = {
      id: this.store.generateId(),
      talentId,
      talentName: talent.name,
      status: ArchiveStatus.PENDING,
      contractId,
      items: [],
      brandCooperations: [],
      scriptVersions: [],
      sharedRemarks,
      lastModifiedBy: operator.id,
      lastModifiedAt: new Date(),
      operationLogs: [
        this.store.createOperationLog(operator, '创建档案', `为达人「${talent.name}」创建档案，同步${sharedRemarks.length}条签约备注`),
      ],
    };

    this.store.saveArchive(archive);
    return archive;
  }

  updateStatus(id: string, status: ArchiveStatus, operator: User, remark?: string): TalentArchive {
    const archive = this.findOne(id);
    const previousState = { status: archive.status };

    if (operator.role !== UserRole.TALENT_AGENT && operator.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有达人经纪可以更新档案状态');
    }

    archive.status = status;
    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, '更新档案状态', `状态变更为：${status}${remark ? `，备注：${remark}` : ''}`, previousState, { status })
    );

    this.store.saveArchive(archive);
    return archive;
  }

  addItem(id: string, item: Omit<ArchiveItem, 'id'>, operator: User): TalentArchive {
    const archive = this.findOne(id);

    const newItem: ArchiveItem = {
      ...item,
      id: this.store.generateId(),
    };

    archive.items.push(newItem);
    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, '添加档案材料', `添加${item.type}：${item.name}`)
    );

    this.store.saveArchive(archive);
    return archive;
  }

  verifyItem(id: string, itemId: string, verified: boolean, operator: User): TalentArchive {
    const archive = this.findOne(id);
    const item = archive.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new NotFoundException('档案材料不存在');
    }

    item.verified = verified;
    item.verifiedAt = verified ? new Date() : undefined;
    item.verifiedBy = verified ? operator.id : undefined;

    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, verified ? '审核通过' : '审核不通过', `材料「${item.name}」审核${verified ? '通过' : '不通过'}`)
    );

    this.store.saveArchive(archive);
    return archive;
  }

  syncContractRemarks(id: string, operator: User): TalentArchive {
    const archive = this.findOne(id);
    
    if (!archive.contractId) {
      throw new BadRequestException('该档案未关联签约合同');
    }

    const contract = this.contractService.findOne(archive.contractId);
    const existingRemarkIds = new Set(archive.sharedRemarks.map(r => r.contractRemarkId));

    const newRemarks = contract.remarks
      .filter(r => r.isSharedToArchive && !existingRemarkIds.has(r.id))
      .map(r => ({
        contractRemarkId: r.id,
        content: r.content,
        category: r.category,
        sharedAt: new Date(),
      }));

    archive.sharedRemarks.push(...newRemarks);
    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, '同步签约备注', `从签约合同同步${newRemarks.length}条新备注`)
    );

    this.store.saveArchive(archive);
    return archive;
  }

  addBrandCooperation(id: string, cooperation: Omit<BrandCooperation, 'id'>, operator: User): TalentArchive {
    const archive = this.findOne(id);

    const conflicts = this.checkScheduleConflict(archive, cooperation);
    if (conflicts.length > 0) {
      this.notificationService.notifyScheduleConflict(archive.talentName, cooperation.brandName, new Date());
      throw new BadRequestException(`排期冲突：与品牌「${conflicts.map(c => c.brandName).join('、')}」的合作时间重叠`);
    }

    const newCooperation: BrandCooperation = {
      ...cooperation,
      id: this.store.generateId(),
    };

    archive.brandCooperations.push(newCooperation);
    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, '添加品牌合作', `添加品牌「${cooperation.brandName}」合作`)
    );

    this.store.saveArchive(archive);
    return archive;
  }

  private checkScheduleConflict(archive: TalentArchive, newCooperation: Omit<BrandCooperation, 'id'>): BrandCooperation[] {
    return archive.brandCooperations.filter(existing => {
      if (existing.status === 'cancelled') return false;
      const existingStart = new Date(existing.startTime).getTime();
      const existingEnd = new Date(existing.endTime).getTime();
      const newStart = new Date(newCooperation.startTime).getTime();
      const newEnd = new Date(newCooperation.endTime).getTime();
      return (newStart <= existingEnd && newEnd >= existingStart);
    });
  }

  addScriptVersion(id: string, cooperationId: string, script: Omit<ScriptVersion, 'id' | 'brandCooperationId' | 'isLatest' | 'createdAt'>, operator: User): TalentArchive {
    const archive = this.findOne(id);
    const cooperation = archive.brandCooperations.find(c => c.id === cooperationId);
    
    if (!cooperation) {
      throw new NotFoundException('品牌合作不存在');
    }

    const oldVersions = archive.scriptVersions.filter(s => s.brandCooperationId === cooperationId);
    oldVersions.forEach(v => v.isLatest = false);

    const newScript: ScriptVersion = {
      ...script,
      id: this.store.generateId(),
      brandCooperationId: cooperationId,
      isLatest: true,
      createdAt: new Date(),
    };

    archive.scriptVersions.push(newScript);
    
    if (oldVersions.length > 0) {
      this.notificationService.notifyScriptOutOfSync(archive.talentName, script.title);
    }

    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, '添加脚本版本', `为品牌「${cooperation.brandName}」添加脚本版本 ${script.version}，修改原因：${script.changeReason}`)
    );

    this.store.saveArchive(archive);
    return archive;
  }

  updateSettlementStatus(id: string, cooperationId: string, status: BrandCooperation['settlementStatus'], operator: User): TalentArchive {
    const archive = this.findOne(id);
    const cooperation = archive.brandCooperations.find(c => c.id === cooperationId);
    
    if (!cooperation) {
      throw new NotFoundException('品牌合作不存在');
    }

    const previousState = { settlementStatus: cooperation.settlementStatus };
    cooperation.settlementStatus = status;
    cooperation.status = status === 'settled' ? 'completed' : cooperation.status;

    archive.lastModifiedBy = operator.id;
    archive.lastModifiedAt = new Date();
    archive.operationLogs.push(
      this.store.createOperationLog(operator, '更新结算状态', `品牌「${cooperation.brandName}」结算状态变更为：${status}`, previousState, { settlementStatus: status })
    );

    this.store.saveArchive(archive);
    return archive;
  }

  checkOverdueCooperations(id: string): BrandCooperation[] {
    const archive = this.findOne(id);
    const now = new Date().getTime();
    
    return archive.brandCooperations.filter(c => {
      if (c.status !== 'completed') return false;
      if (c.settlementStatus === 'settled') return false;
      const endTime = new Date(c.endTime).getTime();
      const daysDiff = (now - endTime) / (1000 * 60 * 60 * 24);
      return daysDiff > 7;
    });
  }

  getOperationLogs(id: string) {
    const archive = this.findOne(id);
    return archive.operationLogs;
  }

  getHistoryView(id: string) {
    const archive = this.findOne(id);
    return {
      basic: {
        id: archive.id,
        talentId: archive.talentId,
        talentName: archive.talentName,
        status: archive.status,
        contractId: archive.contractId,
      },
      timeline: archive.operationLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      sharedRemarks: archive.sharedRemarks,
      items: archive.items,
      brandCooperations: archive.brandCooperations,
      scriptVersions: archive.scriptVersions,
    };
  }
}
