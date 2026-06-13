import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingNeed, TrainingNeedStatus, Urgency } from '../../entities/training-need.entity';
import { TrainingNeedRemark, RemarkAction } from '../../entities/training-need-remark.entity';
import { User, UserRole } from '../../entities/user.entity';
import { NotificationService } from '../notifications/notifications.service';
import { StatusChangeHistoryService } from '../status-history/status-history.service';
import { EntityType } from '../../entities/status-change-history.entity';
import { NotificationType } from '../../entities/notification.entity';
import { CreateTrainingNeedDto } from './dto/create-training-need.dto';
import { UpdateTrainingNeedDto } from './dto/update-training-need.dto';
import { ApproveTrainingNeedDto } from './dto/approve-training-need.dto';
import { RejectTrainingNeedDto } from './dto/reject-training-need.dto';
import { TransferTrainingNeedDto } from './dto/transfer-training-need.dto';
import { AddRemarkDto } from './dto/add-remark.dto';
import { TrainingNeedQueryDto } from './dto/training-need-query.dto';

@Injectable()
export class TrainingNeedsService {
  constructor(
    @InjectRepository(TrainingNeed)
    private trainingNeedRepository: Repository<TrainingNeed>,
    @InjectRepository(TrainingNeedRemark)
    private remarkRepository: Repository<TrainingNeedRemark>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private statusHistoryService: StatusChangeHistoryService,
  ) {}

  async create(createDto: CreateTrainingNeedDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const trainingNeed = this.trainingNeedRepository.create({
      ...createDto,
      submitterId: userId,
      attachments: createDto.attachments ? JSON.stringify(createDto.attachments) : null,
    });

    await this.trainingNeedRepository.save(trainingNeed);

    return this.findOne(trainingNeed.id);
  }

  async findAll(queryDto: TrainingNeedQueryDto, user: User) {
    const { page = 1, pageSize = 10, status, department, urgency, startDate, endDate, keyword } = queryDto;

    const query = this.trainingNeedRepository
      .createQueryBuilder('tn')
      .leftJoinAndSelect('tn.submitter', 'submitter')
      .leftJoinAndSelect('tn.currentHandler', 'currentHandler')
      .leftJoinAndSelect('tn.remarks', 'remarks')
      .leftJoinAndSelect('remarks.handler', 'handler');

    if (status) {
      query.andWhere('tn.status = :status', { status });
    }

    if (department) {
      query.andWhere('tn.department = :department', { department });
    }

    if (urgency) {
      query.andWhere('tn.urgency = :urgency', { urgency });
    }

    if (startDate) {
      query.andWhere('tn.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('tn.createdAt <= :endDate', { endDate });
    }

    if (keyword) {
      query.andWhere('(tn.title LIKE :keyword OR tn.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (user.role === UserRole.DEPARTMENT_HEAD) {
      query.andWhere('tn.department = :userDepartment', { userDepartment: user.department });
    }

    query.orderBy('tn.createdAt', 'DESC');

    const [items, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => this.transformNeed(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const trainingNeed = await this.trainingNeedRepository.findOne({
      where: { id },
      relations: ['submitter', 'currentHandler', 'remarks', 'remarks.handler'],
    });

    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    return this.transformNeed(trainingNeed);
  }

  async update(id: string, updateDto: UpdateTrainingNeedDto, user: User) {
    const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id } });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    if (trainingNeed.submitterId !== user.id && user.role !== UserRole.TRAINING_MANAGER) {
      throw new ForbiddenException('无权修改此培训需求');
    }

    if (trainingNeed.status === TrainingNeedStatus.APPROVED) {
      throw new ForbiddenException('已审批通过的需求不能修改');
    }

    if (updateDto.attachments) {
      updateDto = { ...updateDto, attachments: JSON.stringify(updateDto.attachments) };
    }

    await this.trainingNeedRepository.update(id, updateDto);

    return this.findOne(id);
  }

  async remove(id: string, user: User) {
    const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id } });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    if (trainingNeed.submitterId !== user.id && user.role !== UserRole.TRAINING_MANAGER) {
      throw new ForbiddenException('无权删除此培训需求');
    }

    if (trainingNeed.status === TrainingNeedStatus.APPROVED) {
      throw new ForbiddenException('已审批通过的需求不能删除');
    }

    await this.trainingNeedRepository.delete(id);

    return { message: '删除成功' };
  }

  async approve(id: string, approveDto: ApproveTrainingNeedDto, handlerId: string) {
    const trainingNeed = await this.trainingNeedRepository.findOne({
      where: { id },
      relations: ['submitter', 'currentHandler'],
    });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    if (trainingNeed.status !== TrainingNeedStatus.PENDING && 
        trainingNeed.status !== TrainingNeedStatus.TRANSFERRED) {
      throw new ForbiddenException('只能审批待审批或已转派状态的需求');
    }

    if (trainingNeed.currentHandlerId && trainingNeed.currentHandlerId !== handlerId) {
      throw new ForbiddenException('只有当前处理人才能审批此需求');
    }

    const fromStatus = trainingNeed.status;
    await this.trainingNeedRepository.update(id, {
      status: TrainingNeedStatus.APPROVED,
      currentHandlerId: null,
    });

    await this.statusHistoryService.recordStatusChange(
      EntityType.TRAINING_NEED,
      id,
      fromStatus,
      TrainingNeedStatus.APPROVED,
      handlerId,
      undefined,
      approveDto.remarks,
    );

    if (approveDto.remarks) {
      await this.createRemark(id, handlerId, approveDto.remarks, RemarkAction.APPROVE);
    }

    await this.notificationService.sendNotification(
      NotificationType.TRAINING_NEED_APPROVED,
      trainingNeed.submitterId,
      '培训需求已审批通过',
      `您提交的培训需求「${trainingNeed.title}」已审批通过，将进入课程立项阶段。`,
      'training_need',
      id,
    );

    return this.findOne(id);
  }

  async reject(id: string, rejectDto: RejectTrainingNeedDto, handlerId: string) {
    const trainingNeed = await this.trainingNeedRepository.findOne({
      where: { id },
      relations: ['submitter', 'currentHandler'],
    });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    if (trainingNeed.status !== TrainingNeedStatus.PENDING && 
        trainingNeed.status !== TrainingNeedStatus.TRANSFERRED) {
      throw new ForbiddenException('只能驳回待审批或已转派状态的需求');
    }

    if (trainingNeed.currentHandlerId && trainingNeed.currentHandlerId !== handlerId) {
      throw new ForbiddenException('只有当前处理人才能驳回此需求');
    }

    const remarks = rejectDto.reason + (rejectDto.remarks ? `\n${rejectDto.remarks}` : '');

    const fromStatus = trainingNeed.status;
    await this.trainingNeedRepository.update(id, {
      status: TrainingNeedStatus.REJECTED,
      currentHandlerId: null,
    });

    await this.statusHistoryService.recordStatusChange(
      EntityType.TRAINING_NEED,
      id,
      fromStatus,
      TrainingNeedStatus.REJECTED,
      handlerId,
      rejectDto.reason,
      rejectDto.remarks,
    );

    await this.createRemark(id, handlerId, remarks, RemarkAction.REJECT);

    await this.notificationService.sendNotification(
      NotificationType.TRAINING_NEED_REJECTED,
      trainingNeed.submitterId,
      '培训需求已被驳回',
      `您提交的培训需求「${trainingNeed.title}」已被驳回，原因：${rejectDto.reason}`,
      'training_need',
      id,
    );

    return this.findOne(id);
  }

  async transfer(id: string, transferDto: TransferTrainingNeedDto, handlerId: string) {
    const trainingNeed = await this.trainingNeedRepository.findOne({
      where: { id },
      relations: ['submitter', 'currentHandler'],
    });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    const targetManager = await this.userRepository.findOne({
      where: { id: transferDto.targetManagerId, role: UserRole.TRAINING_MANAGER },
    });
    if (!targetManager) {
      throw new NotFoundException('目标培训经理不存在');
    }

    if (trainingNeed.status !== TrainingNeedStatus.PENDING && 
        trainingNeed.status !== TrainingNeedStatus.TRANSFERRED) {
      throw new ForbiddenException('只能转派待审批或已转派状态的需求');
    }

    const fromStatus = trainingNeed.status;
    const previousHandlerId = trainingNeed.currentHandlerId || handlerId;
    
    await this.trainingNeedRepository.update(id, {
      status: TrainingNeedStatus.TRANSFERRED,
      currentHandlerId: targetManager.id,
    });
    
    await this.statusHistoryService.recordStatusChange(
      EntityType.TRAINING_NEED,
      id,
      fromStatus,
      TrainingNeedStatus.TRANSFERRED,
      handlerId,
      `从${previousHandlerId === handlerId ? '当前处理人' : '原处理人'}转派给${targetManager.name}`,
      transferDto.remarks,
    );

    if (transferDto.remarks) {
      await this.createRemark(id, handlerId, transferDto.remarks, RemarkAction.TRANSFER);
    }

    await this.notificationService.sendNotification(
      NotificationType.TRAINING_NEED_TRANSFERRED,
      targetManager.id,
      '培训需求已转派给您',
      `培训需求「${trainingNeed.title}」已转派给您，请及时处理。`,
      'training_need',
      id,
    );

    return this.findOne(id);
  }

  async addRemark(id: string, addRemarkDto: AddRemarkDto, handlerId: string) {
    const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id } });
    if (!trainingNeed) {
      throw new NotFoundException('培训需求不存在');
    }

    await this.createRemark(id, handlerId, addRemarkDto.content, RemarkAction.COMMENT);

    return this.findOne(id);
  }

  async getHistory(id: string) {
    const remarks = await this.remarkRepository.find({
      where: { trainingNeedId: id },
      relations: ['handler'],
      order: { createdAt: 'ASC' },
    });

    return remarks.map((remark) => ({
      id: remark.id,
      handler: {
        id: remark.handler.id,
        name: remark.handler.name,
        role: remark.handler.role,
      },
      content: remark.content,
      action: remark.action,
      createdAt: remark.createdAt,
    }));
  }

  async getMyPendingNeeds(userId: string) {
    const query = this.trainingNeedRepository
      .createQueryBuilder('tn')
      .leftJoinAndSelect('tn.submitter', 'submitter')
      .leftJoinAndSelect('tn.currentHandler', 'currentHandler')
      .where('(tn.status = :pending OR tn.status = :transferred)', {
        pending: TrainingNeedStatus.PENDING,
        transferred: TrainingNeedStatus.TRANSFERRED,
      })
      .andWhere('(tn.currentHandlerId = :userId OR tn.currentHandlerId IS NULL)')
      .setParameter('userId', userId)
      .orderBy('tn.createdAt', 'DESC');

    const items = await query.getMany();

    return items.map((item) => this.transformNeed(item));
  }

  private async createRemark(trainingNeedId: string, handlerId: string, content: string, action: RemarkAction) {
    const remark = this.remarkRepository.create({
      trainingNeedId,
      handlerId,
      content,
      action,
    });
    await this.remarkRepository.save(remark);
  }

  private transformNeed(trainingNeed: TrainingNeed) {
    return {
      id: trainingNeed.id,
      title: trainingNeed.title,
      description: trainingNeed.description,
      department: trainingNeed.department,
      submitter: {
        id: trainingNeed.submitter.id,
        name: trainingNeed.submitter.name,
        department: trainingNeed.submitter.department,
      },
      currentHandler: trainingNeed.currentHandler ? {
        id: trainingNeed.currentHandler.id,
        name: trainingNeed.currentHandler.name,
        department: trainingNeed.currentHandler.department,
      } : null,
      expectedDate: trainingNeed.expectedDate,
      participantCount: trainingNeed.participantCount,
      budget: trainingNeed.budget,
      urgency: trainingNeed.urgency,
      status: trainingNeed.status,
      attachments: trainingNeed.attachments ? JSON.parse(trainingNeed.attachments) : [],
      remarks: trainingNeed.remarks?.map((remark) => ({
        id: remark.id,
        handler: {
          id: remark.handler?.id,
          name: remark.handler?.name,
        },
        content: remark.content,
        action: remark.action,
        createdAt: remark.createdAt,
      })) || [],
      createdAt: trainingNeed.createdAt,
      updatedAt: trainingNeed.updatedAt,
    };
  }
}