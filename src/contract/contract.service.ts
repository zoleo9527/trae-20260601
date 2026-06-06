import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArchiveStatus, ContractStatus, UserRole } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { NotificationService } from '../notification/notification.service';
import { TalentService } from '../talent/talent.service';
import { Contract, ContractRemark, ContractTerms } from './interfaces/contract.interface';

@Injectable()
export class ContractService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly notificationService: NotificationService,
    private readonly talentService: TalentService,
  ) {}

  private readonly statusTransitions: Record<ContractStatus, ContractStatus[]> = {
    [ContractStatus.DRAFT]: [ContractStatus.PENDING_BUSINESS_REVIEW, ContractStatus.CANCELLED],
    [ContractStatus.PENDING_BUSINESS_REVIEW]: [ContractStatus.PENDING_TALENT_SIGN, ContractStatus.REJECTED],
    [ContractStatus.PENDING_TALENT_SIGN]: [ContractStatus.PENDING_ARCHIVE, ContractStatus.REJECTED],
    [ContractStatus.PENDING_ARCHIVE]: [ContractStatus.ARCHIVE_IN_PROGRESS, ContractStatus.REJECTED],
    [ContractStatus.ARCHIVE_IN_PROGRESS]: [ContractStatus.ARCHIVED, ContractStatus.PENDING_ARCHIVE],
    [ContractStatus.ARCHIVED]: [],
    [ContractStatus.REJECTED]: [ContractStatus.DRAFT, ContractStatus.CANCELLED],
    [ContractStatus.CANCELLED]: [],
  };

  private canTransition(current: ContractStatus, next: ContractStatus): boolean {
    return this.statusTransitions[current]?.includes(next) || false;
  }

  findAll(): Contract[] {
    return this.store.getContracts();
  }

  findOne(id: string): Contract {
    const contract = this.store.getContract(id);
    if (!contract) {
      throw new NotFoundException('签约合同不存在');
    }
    return contract;
  }

  findByTalent(talentId: string): Contract[] {
    return this.store.getContractsByTalent(talentId);
  }

  create(data: {
    talentId: string;
    terms: ContractTerms;
  }, operator: User): Contract {
    const talent = this.talentService.findOne(data.talentId);

    const contract: Contract = {
      id: this.store.generateId(),
      talentId: data.talentId,
      talentName: talent.name,
      status: ContractStatus.DRAFT,
      terms: data.terms,
      remarks: [],
      currentHandler: operator.id,
      currentHandlerRole: operator.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      operationLogs: [
        this.store.createOperationLog(operator, '创建签约合同', `为达人「${talent.name}」创建签约合同`),
      ],
    };

    this.store.saveContract(contract);
    return contract;
  }

  submitForReview(id: string, operator: User): Contract {
    const contract = this.findOne(id);
    const previousState = { status: contract.status };

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态可以提交审核');
    }

    if (operator.role !== UserRole.TALENT_AGENT) {
      throw new ForbiddenException('只有达人经纪可以提交审核');
    }

    contract.status = ContractStatus.PENDING_BUSINESS_REVIEW;
    contract.currentHandler = '';
    contract.currentHandlerRole = UserRole.BUSINESS;
    contract.submittedAt = new Date();
    contract.updatedAt = new Date();
    contract.operationLogs.push(
      this.store.createOperationLog(operator, '提交审核', '提交商务审核', previousState, { status: contract.status })
    );

    this.store.saveContract(contract);
    this.notificationService.notifyContractSubmitted(contract.id, contract.talentName);

    return contract;
  }

  businessReview(id: string, approved: boolean, operator: User, reason?: string): Contract {
    const contract = this.findOne(id);
    const previousState = { status: contract.status };

    if (contract.status !== ContractStatus.PENDING_BUSINESS_REVIEW) {
      throw new BadRequestException('当前状态不允许商务审核');
    }

    if (operator.role !== UserRole.BUSINESS) {
      throw new ForbiddenException('只有商务可以执行此操作');
    }

    if (approved) {
      contract.status = ContractStatus.PENDING_TALENT_SIGN;
      contract.currentHandler = '';
      contract.currentHandlerRole = UserRole.TALENT_AGENT;
      contract.operationLogs.push(
        this.store.createOperationLog(operator, '商务审核通过', '商务审核通过，等待达人签约', previousState, { status: contract.status })
      );
    } else {
      if (!reason) {
        throw new BadRequestException('退回必须填写原因');
      }
      contract.status = ContractStatus.REJECTED;
      contract.rejectedReason = reason;
      contract.currentHandler = '';
      contract.currentHandlerRole = UserRole.TALENT_AGENT;
      contract.operationLogs.push(
        this.store.createOperationLog(operator, '商务审核退回', `退回原因：${reason}`, previousState, { status: contract.status })
      );
      this.notificationService.notifyContractRejected(contract.id, contract.talentName, reason);
    }

    contract.updatedAt = new Date();
    this.store.saveContract(contract);

    return contract;
  }

  talentSign(id: string, operator: User): Contract {
    const contract = this.findOne(id);
    const previousState = { status: contract.status };

    if (contract.status !== ContractStatus.PENDING_TALENT_SIGN) {
      throw new BadRequestException('当前状态不允许达人签约');
    }

    if (operator.role !== UserRole.TALENT_AGENT) {
      throw new ForbiddenException('只有达人经纪可以确认达人签约');
    }

    contract.status = ContractStatus.PENDING_ARCHIVE;
    contract.currentHandler = '';
    contract.currentHandlerRole = UserRole.TALENT_AGENT;
    contract.signedAt = new Date();
    contract.updatedAt = new Date();
    contract.operationLogs.push(
      this.store.createOperationLog(operator, '达人已签约', '达人确认签约，等待档案建档', previousState, { status: contract.status })
    );

    this.store.saveContract(contract);
    this.notificationService.notifyContractApproved(contract.id, contract.talentName);

    return contract;
  }

  private executeArchive(contract: Contract, operator: User, archiveId: string, triggerSource: 'manual' | 'archive_complete'): Contract {
    const previousState = { 
      status: contract.status, 
      archivedAt: contract.archivedAt,
      currentHandler: contract.currentHandler,
      currentHandlerRole: contract.currentHandlerRole,
    };

    const now = new Date();
    const actionText = triggerSource === 'manual' 
      ? `手工归档：档案「${archiveId}」已完成维护，合同正式归档`
      : `档案完成自动归档：档案「${archiveId}」已完成维护`;

    contract.status = ContractStatus.ARCHIVED;
    contract.archivedAt = now;
    contract.currentHandler = '';
    contract.currentHandlerRole = UserRole.ADMIN;
    contract.updatedAt = now;
    contract.operationLogs.push(
      this.store.createOperationLog(
        operator, 
        '合同归档', 
        actionText, 
        previousState, 
        { 
          status: ContractStatus.ARCHIVED, 
          archivedAt: now, 
          currentHandler: '', 
          currentHandlerRole: UserRole.ADMIN,
          triggerSource,
        }
      )
    );

    this.store.saveContract(contract);
    this.notificationService.notifyArchiveCompleted(contract.id, contract.talentName);

    return contract;
  }

  archive(id: string, operator: User): Contract {
    const contract = this.findOne(id);

    if (contract.status === ContractStatus.ARCHIVED) {
      throw new BadRequestException('合同已归档，请勿重复操作');
    }

    if (operator.role !== UserRole.TALENT_AGENT && operator.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有达人经纪或管理员可以执行归档');
    }

    if (!contract.archiveId) {
      throw new BadRequestException('该合同未关联档案，请先创建档案并完成维护后再归档');
    }

    const archive = this.store.getArchive(contract.archiveId);
    if (!archive) {
      throw new BadRequestException('关联的档案不存在，请检查档案是否已被删除');
    }

    if (archive.status !== 'completed') {
      throw new BadRequestException(`档案状态为「${archive.status}」，未完成维护，不允许归档。请先将档案状态更新为「已完成」`);
    }

    if (contract.status !== ContractStatus.ARCHIVE_IN_PROGRESS) {
      throw new BadRequestException(`合同状态异常「${contract.status}」，应处于「建档维护中」状态。请检查签约流程是否正常完成`);
    }

    return this.executeArchive(contract, operator, contract.archiveId, 'manual');
  }

  addRemark(id: string, content: string, category: ContractRemark['category'], isSharedToArchive: boolean, operator: User): Contract {
    const contract = this.findOne(id);

    const remark: ContractRemark = {
      id: this.store.generateId(),
      content,
      category,
      createdBy: operator.id,
      createdAt: new Date(),
      isSharedToArchive,
    };

    contract.remarks.push(remark);
    contract.updatedAt = new Date();
    contract.operationLogs.push(
      this.store.createOperationLog(operator, '添加备注', `添加${category}备注，${isSharedToArchive ? '已' : '未'}同步到档案`)
    );

    this.store.saveContract(contract);
    return contract;
  }

  getSharedRemarks(id: string): ContractRemark[] {
    const contract = this.findOne(id);
    return contract.remarks.filter(r => r.isSharedToArchive);
  }

  getOperationLogs(id: string) {
    const contract = this.findOne(id);
    return contract.operationLogs;
  }

  getStatusFlow(): Record<string, string[]> {
    return this.statusTransitions;
  }

  onArchiveCreated(contractId: string, archiveId: string, operator: User): Contract {
    const contract = this.findOne(contractId);
    const previousState = { 
      status: contract.status, 
      archiveId: contract.archiveId, 
      currentHandler: contract.currentHandler, 
      currentHandlerRole: contract.currentHandlerRole 
    };

    if (contract.status !== ContractStatus.PENDING_ARCHIVE) {
      throw new BadRequestException(`合同状态为「${contract.status}」，无法创建档案。请确保合同处于待建档状态`);
    }

    contract.status = ContractStatus.ARCHIVE_IN_PROGRESS;
    contract.archiveId = archiveId;
    contract.currentHandler = '';
    contract.currentHandlerRole = UserRole.TALENT_AGENT;
    contract.updatedAt = new Date();
    contract.operationLogs.push(
      this.store.createOperationLog(
        operator, 
        '档案已创建', 
        `档案 ID: ${archiveId} 已创建，合同状态变更为「建档维护中」`, 
        previousState, 
        { status: ContractStatus.ARCHIVE_IN_PROGRESS, archiveId, currentHandler: '', currentHandlerRole: UserRole.TALENT_AGENT }
      )
    );

    this.store.saveContract(contract);
    return contract;
  }

  onArchiveStatusChanged(contractId: string, archiveStatus: ArchiveStatus, operator: User): Contract {
    const contract = this.findOne(contractId);
    const previousState = { 
      status: contract.status, 
      currentHandler: contract.currentHandler, 
      currentHandlerRole: contract.currentHandlerRole,
      archivedAt: contract.archivedAt,
    };

    if (archiveStatus === ArchiveStatus.NEEDS_REVISION) {
      contract.status = ContractStatus.PENDING_ARCHIVE;
      contract.currentHandler = '';
      contract.currentHandlerRole = UserRole.TALENT_AGENT;
      contract.operationLogs.push(
        this.store.createOperationLog(
          operator, 
          '档案退回', 
          '档案需要修改，合同状态恢复为「待建档」，已通知达人经纪', 
          previousState, 
          { status: ContractStatus.PENDING_ARCHIVE, currentHandler: '', currentHandlerRole: UserRole.TALENT_AGENT }
        )
      );
      this.notificationService.notifyArchiveNeeded(contract.archiveId, contract.talentName);
    } else if (archiveStatus === ArchiveStatus.COMPLETED) {
      if (contract.archiveId && contract.status === ContractStatus.ARCHIVE_IN_PROGRESS) {
        return this.executeArchive(contract, operator, contract.archiveId, 'archive_complete');
      } else {
        contract.currentHandler = '';
        contract.currentHandlerRole = UserRole.ADMIN;
        contract.updatedAt = new Date();
        contract.operationLogs.push(
          this.store.createOperationLog(
            operator, 
            '档案完成', 
            '档案维护已完成，等待合同归档', 
            previousState, 
            { currentHandler: '', currentHandlerRole: UserRole.ADMIN }
          )
        );
      }
    }

    contract.updatedAt = new Date();
    this.store.saveContract(contract);
    return contract;
  }

  triggerException(id: string, exceptionType: 'reject' | 'conflict' | 'overdue', operator: User): Contract {
    const contract = this.findOne(id);

    if (exceptionType === 'reject') {
      if (contract.status === ContractStatus.PENDING_BUSINESS_REVIEW || contract.status === ContractStatus.PENDING_TALENT_SIGN) {
        return this.businessReview(id, false, operator, '异常测试：自动退回');
      }
    } else if (exceptionType === 'conflict') {
      this.notificationService.notifyScheduleConflict(contract.talentName, '测试品牌', new Date());
    } else if (exceptionType === 'overdue') {
      this.notificationService.notifyDataOverdue(contract.talentName, '测试品牌');
    }

    return contract;
  }
}
