import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Member,
  MemberStatus,
  CreateMemberDto,
  UpdateMemberDto,
  MemberQueryDto,
  MemberDetailDto,
} from '../models/member.model';
import { Baby, CreateBabyDto, calculateMonthAge, getNextMilestoneMonth } from '../models/baby.model';
import { ReminderService } from './reminder.service';
import { OperationLogService } from './operation-log.service';
import { ErrorCode, ApiException } from '../common/error-code';
import { UserRole } from '../common/role';

@Injectable()
export class MemberService {
  private members: Map<string, Member> = new Map();
  private phoneIndex: Map<string, string> = new Map();

  constructor(
    private reminderService: ReminderService,
    private operationLogService: OperationLogService
  ) {}

  async createMember(
    dto: CreateMemberDto,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole,
    storeId: string
  ): Promise<Member> {
    if (this.phoneIndex.has(dto.phone)) {
      throw new ApiException(ErrorCode.MEMBER_001);
    }

    if (!dto.phone || !dto.name) {
      throw new ApiException(ErrorCode.MEMBER_002);
    }

    const memberId = uuidv4();
    const now = new Date();

    const babies: Baby[] = [];
    if (dto.babies && dto.babies.length > 0) {
      for (const babyDto of dto.babies) {
        const baby = await this.createBabyEntity(babyDto, memberId);
        babies.push(baby);
      }
    }

    const member: Member = {
      id: memberId,
      phone: dto.phone,
      name: dto.name,
      status: operatorRole === UserRole.CLERK 
        ? MemberStatus.PENDING_APPROVAL 
        : MemberStatus.APPROVED,
      wechatOpenId: dto.wechatOpenId,
      idCardNumber: dto.idCardNumber,
      address: dto.address,
      registeredStoreId: storeId,
      registeredBy: operatorId,
      registeredByRole: operatorRole,
      createdAt: now,
      updatedAt: now,
      babies,
      reminders: [],
    };

    this.members.set(memberId, member);
    this.phoneIndex.set(dto.phone, memberId);

    await this.operationLogService.log({
      type: 'member_create' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: memberId,
      targetType: 'member',
      afterData: member as any,
    });

    if (member.status === MemberStatus.APPROVED && babies.length > 0) {
      for (const baby of babies) {
        await this.reminderService.triggerInitialReminders(member, baby);
      }
    }

    return member;
  }

  async updateMember(
    memberId: string,
    dto: UpdateMemberDto,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Member> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }

    if (member.status === MemberStatus.SUSPENDED) {
      throw new ApiException(ErrorCode.MEMBER_004);
    }

    const beforeData = { ...member };

    Object.assign(member, dto);
    member.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'member_update' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: memberId,
      targetType: 'member',
      beforeData: beforeData as any,
      afterData: member as any,
    });

    return member;
  }

  async approveMember(
    memberId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Member> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }

    if (member.status !== MemberStatus.PENDING_APPROVAL) {
      throw new ApiException(ErrorCode.MEMBER_004, undefined, {
        currentStatus: member.status,
      });
    }

    member.status = MemberStatus.APPROVED;
    member.approvedBy = operatorId;
    member.approvedAt = new Date();
    member.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'member_approve' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: memberId,
      targetType: 'member',
      afterData: member as any,
    });

    if (member.babies.length > 0) {
      for (const baby of member.babies) {
        await this.reminderService.triggerInitialReminders(member, baby);
      }
    }

    return member;
  }

  async rejectMember(
    memberId: string,
    reason: string,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Member> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }

    if (member.status !== MemberStatus.PENDING_APPROVAL) {
      throw new ApiException(ErrorCode.MEMBER_004, undefined, {
        currentStatus: member.status,
      });
    }

    member.status = MemberStatus.REJECTED;
    member.rejectedReason = reason;
    member.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'member_reject' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: memberId,
      targetType: 'member',
      afterData: { memberId, reason } as any,
    });

    return member;
  }

  async resubmitMember(
    memberId: string,
    dto: UpdateMemberDto,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Member> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }

    if (member.status !== MemberStatus.REJECTED) {
      throw new ApiException(ErrorCode.MEMBER_004, '只有被退回的档案才能重新提交', {
        currentStatus: member.status,
      });
    }

    const beforeData = { ...member };

    Object.assign(member, dto);
    member.status = MemberStatus.PENDING_APPROVAL;
    member.rejectedReason = undefined;
    member.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'member_update' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: memberId,
      targetType: 'member',
      beforeData: beforeData as any,
      afterData: { status: member.status, resubmitted: true } as any,
    });

    return member;
  }

  async reapproveMember(
    memberId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Member> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }

    if (member.status !== MemberStatus.PENDING_APPROVAL) {
      const canReapprove = member.status === MemberStatus.REJECTED && 
        member.registeredBy === operatorId;
      
      if (!canReapprove) {
        throw new ApiException(ErrorCode.MEMBER_004, undefined, {
          currentStatus: member.status,
          message: '只有待审核状态的档案才能审批，或退回档案需原建档店员重新提交',
        });
      }
    }

    const wasRejected = member.status === MemberStatus.REJECTED;
    member.status = MemberStatus.APPROVED;
    member.approvedBy = operatorId;
    member.approvedAt = new Date();
    member.updatedAt = new Date();

    if (wasRejected) {
      member.rejectedReason = undefined;
    }

    await this.operationLogService.log({
      type: 'member_approve' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: memberId,
      targetType: 'member',
      afterData: { status: member.status, wasResubmitted: wasRejected } as any,
    });

    if (member.babies.length > 0) {
      for (const baby of member.babies) {
        await this.reminderService.triggerInitialReminders(member, baby);
      }
    }

    return member;
  }

  async getMember(memberId: string): Promise<Member> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }
    return member;
  }

  async getMemberDetail(memberId: string): Promise<MemberDetailDto> {
    const member = await this.getMember(memberId);
    
    const anomalyRemindersResult = await this.reminderService.queryReminders({
      memberId,
      isAnomaly: true,
    });
    
    const anomalies = await this.operationLogService.getAnomaliesByMember(memberId);
    
    const allReminders = await this.reminderService.getReminderHistoryWithAnomalies(
      memberId,
      this
    );
    
    const recentReminders = allReminders.slice(0, 10);

    return {
      member,
      anomalyReminders: anomalyRemindersResult.list,
      anomalies,
      recentReminders,
    };
  }

  async queryMembers(query: MemberQueryDto): Promise<{ list: Member[]; total: number }> {
    let results = Array.from(this.members.values());

    if (query.id) {
      results = results.filter((m) => m.id === query.id);
    }
    if (query.phone) {
      results = results.filter((m) => m.phone.includes(query.phone!));
    }
    if (query.name) {
      results = results.filter((m) => m.name.includes(query.name!));
    }
    if (query.status) {
      results = results.filter((m) => m.status === query.status);
    }
    if (query.storeId) {
      results = results.filter((m) => m.registeredStoreId === query.storeId);
    }
    if (query.registeredBy) {
      results = results.filter((m) => m.registeredBy === query.registeredBy);
    }

    const total = results.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const list = results.slice(start, start + pageSize);

    return { list, total };
  }

  async addBabyToMember(
    memberId: string,
    babyDto: CreateBabyDto,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Baby> {
    const member = this.members.get(memberId);
    if (!member) {
      throw new ApiException(ErrorCode.MEMBER_003);
    }

    if (member.status !== MemberStatus.APPROVED) {
      throw new ApiException(ErrorCode.MEMBER_004, '会员未审核通过，无法添加宝宝信息', {
        status: member.status,
      });
    }

    const baby = await this.createBabyEntity(babyDto, memberId);
    member.babies.push(baby);
    member.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'baby_create' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: baby.id,
      targetType: 'baby',
      afterData: baby as any,
    });

    await this.reminderService.triggerInitialReminders(member, baby);

    return baby;
  }

  private async createBabyEntity(dto: CreateBabyDto, memberId: string): Promise<Baby> {
    if (!dto.name || !dto.gender || !dto.birthDate || !dto.feedingType) {
      throw new ApiException(ErrorCode.BABY_001);
    }

    const birthDate = new Date(dto.birthDate);
    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      throw new ApiException(ErrorCode.BABY_002);
    }

    const currentMonthAge = calculateMonthAge(birthDate);
    const nextMilestoneMonth = getNextMilestoneMonth(currentMonthAge);

    return {
      id: uuidv4(),
      memberId,
      name: dto.name,
      gender: dto.gender,
      birthDate,
      feedingType: dto.feedingType,
      preferredFormulaBrand: dto.preferredFormulaBrand,
      allergies: dto.allergies || [],
      specialNotes: dto.specialNotes,
      currentMonthAge,
      nextMilestoneMonth,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}