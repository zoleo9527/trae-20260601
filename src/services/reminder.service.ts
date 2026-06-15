import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Reminder,
  ReminderType,
  ReminderStatus,
  ReminderPriority,
  CreateReminderDto,
  HandleReminderDto,
  ReminderQueryDto,
  ReminderHistoryDto,
} from '../models/reminder.model';
import { Member, MemberStatus } from '../models/member.model';
import { Baby, calculateMonthAge } from '../models/baby.model';
import { OperationLogService } from './operation-log.service';
import { ErrorCode, ApiException } from '../common/error-code';
import { UserRole } from '../common/role';

interface MilestoneRule {
  monthAge: number;
  types: ReminderType[];
  priority: ReminderPriority;
  titleTemplate: string;
  contentTemplate: string;
  suggestedAction: string;
}

const MILESTONE_RULES: MilestoneRule[] = [
  {
    monthAge: 0,
    types: [ReminderType.VACCINATION, ReminderType.GROWTH_CHECK],
    priority: ReminderPriority.HIGH,
    titleTemplate: '新生儿关怀提醒',
    contentTemplate: '宝宝刚出生，请注意疫苗接种和生长发育监测',
    suggestedAction: '联系会员确认疫苗接种计划，推荐新生儿护理用品',
  },
  {
    monthAge: 1,
    types: [ReminderType.FORMULA_SWITCH, ReminderType.VACCINATION],
    priority: ReminderPriority.HIGH,
    titleTemplate: '1月龄宝宝关怀',
    contentTemplate: '宝宝满1个月，关注奶粉段位切换和疫苗接种',
    suggestedAction: '确认当前奶粉使用情况，提醒2月龄疫苗接种',
  },
  {
    monthAge: 3,
    types: [ReminderType.FORMULA_SWITCH, ReminderType.SUPPLEMENT],
    priority: ReminderPriority.HIGH,
    titleTemplate: '3月龄宝宝关怀',
    contentTemplate: '宝宝满3个月，可考虑添加辅食预备和奶粉段位调整',
    suggestedAction: '推荐适合的辅食工具，提醒奶粉段位切换',
  },
  {
    monthAge: 6,
    types: [ReminderType.FORMULA_SWITCH, ReminderType.SUPPLEMENT, ReminderType.VACCINATION],
    priority: ReminderPriority.URGENT,
    titleTemplate: '6月龄宝宝重要节点',
    contentTemplate: '宝宝满6个月，需要添加辅食、更换2段奶粉',
    suggestedAction: '推荐辅食产品，提醒更换2段奶粉，确认疫苗接种',
  },
  {
    monthAge: 9,
    types: [ReminderType.SUPPLEMENT, ReminderType.GROWTH_CHECK],
    priority: ReminderPriority.MEDIUM,
    titleTemplate: '9月龄宝宝关怀',
    contentTemplate: '宝宝满9个月，辅食种类可丰富，关注生长发育',
    suggestedAction: '推荐多样化辅食，安排生长发育评估',
  },
  {
    monthAge: 12,
    types: [ReminderType.FORMULA_SWITCH, ReminderType.VACCINATION],
    priority: ReminderPriority.HIGH,
    titleTemplate: '1岁宝宝重要节点',
    contentTemplate: '宝宝满1周岁，需要更换3段奶粉，完成疫苗接种',
    suggestedAction: '推荐3段奶粉，确认疫苗接种完成情况',
  },
  {
    monthAge: 18,
    types: [ReminderType.GROWTH_CHECK, ReminderType.SUPPLEMENT],
    priority: ReminderPriority.MEDIUM,
    titleTemplate: '18月龄宝宝关怀',
    contentTemplate: '宝宝1岁半，关注语言发育和营养均衡',
    suggestedAction: '推荐益智玩具，关注营养补充',
  },
  {
    monthAge: 24,
    types: [ReminderType.GROWTH_CHECK],
    priority: ReminderPriority.MEDIUM,
    titleTemplate: '2岁宝宝关怀',
    contentTemplate: '宝宝满2周岁，关注全面发育',
    suggestedAction: '安排生长发育评估，推荐适龄产品',
  },
  {
    monthAge: 36,
    types: [ReminderType.GROWTH_CHECK],
    priority: ReminderPriority.LOW,
    titleTemplate: '3岁宝宝关怀',
    contentTemplate: '宝宝满3周岁，进入幼儿期',
    suggestedAction: '推荐幼儿教育产品，关注营养均衡',
  },
];

@Injectable()
export class ReminderService {
  private reminders: Map<string, Reminder> = new Map();
  private memberReminderIndex: Map<string, Set<string>> = new Map();
  private babyReminderIndex: Map<string, Set<string>> = new Map();

  constructor(private operationLogService: OperationLogService) {}

  async triggerInitialReminders(member: Member, baby: Baby): Promise<Reminder[]> {
    if (member.status !== MemberStatus.APPROVED) {
      return [];
    }

    const triggeredReminders: Reminder[] = [];
    const currentMonthAge = calculateMonthAge(baby.birthDate);

    for (const rule of MILESTONE_RULES) {
      if (rule.monthAge >= currentMonthAge) {
        for (const type of rule.types) {
          const existingReminder = await this.findReminderByBabyAndType(
            baby.id,
            type,
            rule.monthAge
          );

          if (!existingReminder) {
            const reminder = await this.createReminder({
              memberId: member.id,
              babyId: baby.id,
              type,
              priority: rule.priority,
              title: `${baby.name} - ${rule.titleTemplate}`,
              content: rule.contentTemplate.replace('{name}', baby.name),
              suggestedAction: rule.suggestedAction,
              triggerMonthAge: rule.monthAge,
            });

            triggeredReminders.push(reminder);
          }
        }
      }
    }

    return triggeredReminders;
  }

  async createReminder(dto: CreateReminderDto): Promise<Reminder> {
    const reminderId = uuidv4();
    const now = new Date();

    const reminder: Reminder = {
      id: reminderId,
      memberId: dto.memberId,
      babyId: dto.babyId,
      type: dto.type,
      status: ReminderStatus.PENDING,
      priority: dto.priority || ReminderPriority.MEDIUM,
      title: dto.title,
      content: dto.content,
      suggestedAction: dto.suggestedAction,
      triggerMonthAge: dto.triggerMonthAge,
      createdAt: now,
      updatedAt: now,
      isAnomaly: dto.isAnomaly || false,
      anomalyReason: dto.anomalyReason,
    };

    this.reminders.set(reminderId, reminder);

    if (!this.memberReminderIndex.has(dto.memberId)) {
      this.memberReminderIndex.set(dto.memberId, new Set());
    }
    this.memberReminderIndex.get(dto.memberId)!.add(reminderId);

    if (!this.babyReminderIndex.has(dto.babyId)) {
      this.babyReminderIndex.set(dto.babyId, new Set());
    }
    this.babyReminderIndex.get(dto.babyId)!.add(reminderId);

    return reminder;
  }

  async handleReminder(
    reminderId: string,
    dto: HandleReminderDto,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Reminder> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) {
      throw new ApiException(ErrorCode.REMINDER_004);
    }

    if (reminder.status === ReminderStatus.HANDLED) {
      throw new ApiException(ErrorCode.REMINDER_002);
    }

    const beforeStatus = reminder.status;

    reminder.status = dto.result === 'completed' 
      ? ReminderStatus.HANDLED 
      : dto.result === 'deferred' 
        ? ReminderStatus.PENDING 
        : ReminderStatus.IGNORED;
    reminder.handledBy = operatorId;
    reminder.handledAt = new Date();
    reminder.handleResult = dto.result;
    reminder.handleNotes = dto.notes;
    reminder.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'reminder_handle' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: reminderId,
      targetType: 'reminder',
      beforeData: { status: beforeStatus } as any,
      afterData: {
        status: reminder.status,
        result: dto.result,
        notes: dto.notes,
      } as any,
    });

    return reminder;
  }

  async triggerReminder(
    reminderId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: UserRole
  ): Promise<Reminder> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) {
      throw new ApiException(ErrorCode.REMINDER_004);
    }

    if (reminder.status !== ReminderStatus.PENDING) {
      throw new ApiException(ErrorCode.REMINDER_002);
    }

    reminder.status = ReminderStatus.TRIGGERED;
    reminder.triggeredAt = new Date();
    reminder.updatedAt = new Date();

    await this.operationLogService.log({
      type: 'reminder_trigger' as any,
      operatorId,
      operatorName,
      operatorRole,
      targetId: reminderId,
      targetType: 'reminder',
      afterData: { status: ReminderStatus.TRIGGERED } as any,
    });

    return reminder;
  }

  async getReminder(reminderId: string): Promise<Reminder> {
    const reminder = this.reminders.get(reminderId);
    if (!reminder) {
      throw new ApiException(ErrorCode.REMINDER_004);
    }
    return reminder;
  }

  async queryReminders(
    query: ReminderQueryDto
  ): Promise<{ list: Reminder[]; total: number }> {
    let results = Array.from(this.reminders.values());

    if (query.memberId) {
      results = results.filter((r) => r.memberId === query.memberId);
    }
    if (query.babyId) {
      results = results.filter((r) => r.babyId === query.babyId);
    }
    if (query.type) {
      results = results.filter((r) => r.type === query.type);
    }
    if (query.status) {
      results = results.filter((r) => r.status === query.status);
    }
    if (query.priority) {
      results = results.filter((r) => r.priority === query.priority);
    }
    if (query.isAnomaly !== undefined) {
      results = results.filter((r) => r.isAnomaly === query.isAnomaly);
    }
    if (query.handledBy) {
      results = results.filter((r) => r.handledBy === query.handledBy);
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const list = results.slice(start, start + pageSize);

    return { list, total };
  }

  async getReminderHistory(
    memberId: string,
    memberService: any
  ): Promise<ReminderHistoryDto[]> {
    const reminderIds = this.memberReminderIndex.get(memberId) || new Set();
    const member = await memberService.getMember(memberId);

    const history: ReminderHistoryDto[] = [];

    for (const reminderId of reminderIds) {
      const reminder = this.reminders.get(reminderId);
      if (reminder) {
        const baby = member.babies.find((b: Baby) => b.id === reminder.babyId);

        history.push({
          reminderId: reminder.id,
          memberId: reminder.memberId,
          babyName: baby?.name || '未知',
          babyMonthAge: baby?.currentMonthAge || 0,
          type: reminder.type,
          title: reminder.title,
          content: reminder.content,
          status: reminder.status,
          handledBy: reminder.handledBy,
          handledAt: reminder.handledAt,
          handleResult: reminder.handleResult,
          createdAt: reminder.createdAt,
        });
      }
    }

    return history.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createAnomalyReminder(
    memberId: string,
    babyId: string,
    anomalyType: string,
    description: string
  ): Promise<Reminder> {
    return this.createReminder({
      memberId,
      babyId,
      type: ReminderType.MILESTONE,
      priority: ReminderPriority.URGENT,
      title: `异常提醒: ${anomalyType}`,
      content: description,
      suggestedAction: '请及时核实并处理异常情况',
      triggerMonthAge: 0,
      isAnomaly: true,
      anomalyReason: description,
    });
  }

  private async findReminderByBabyAndType(
    babyId: string,
    type: ReminderType,
    triggerMonthAge: number
  ): Promise<Reminder | undefined> {
    const reminderIds = this.babyReminderIndex.get(babyId) || new Set();

    for (const reminderId of reminderIds) {
      const reminder = this.reminders.get(reminderId);
      if (
        reminder &&
        reminder.type === type &&
        reminder.triggerMonthAge === triggerMonthAge
      ) {
        return reminder;
      }
    }

    return undefined;
  }
}