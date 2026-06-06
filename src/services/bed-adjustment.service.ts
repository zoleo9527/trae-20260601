import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BedAdjustment } from '../entities/bed-adjustment.entity';
import { Student } from '../entities/student.entity';
import { Bed } from '../entities/bed.entity';
import { Staff } from '../entities/staff.entity';
import { ErrorCode } from '../common/error-code';
import { AdjustmentStatus, OperationType, AdjustmentStatusLabel, OperationType as OpType } from '../common/enums';
import { CreateAdjustmentDto, ProcessAdjustmentDto } from '../dto/bed-adjustment.dto';
import { OperationLogService } from './operation-log.service';

@Injectable()
export class BedAdjustmentService {
  constructor(
    @InjectRepository(BedAdjustment)
    private readonly adjustmentRepository: Repository<BedAdjustment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Bed)
    private readonly bedRepository: Repository<Bed>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async create(dto: CreateAdjustmentDto): Promise<BedAdjustment> {
    const student = await this.studentRepository.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new HttpException('学生不存在', ErrorCode.STUDENT_NOT_FOUND);
    }

    const sourceBed = await this.bedRepository.findOne({ where: { id: dto.sourceBedId } });
    if (!sourceBed) {
      throw new HttpException('原床位不存在', ErrorCode.BED_NOT_FOUND);
    }

    if (sourceBed.studentId !== dto.studentId) {
      throw new HttpException('原床位不属于该学生，无法调整', ErrorCode.ADJUSTMENT_SOURCE_BED_NOT_OWNED);
    }

    if (sourceBed.underMaintenance) {
      throw new HttpException('原床位正在维修中', ErrorCode.ADJUSTMENT_SOURCE_BED_UNDER_MAINTENANCE);
    }

    const targetBed = await this.bedRepository.findOne({ where: { id: dto.targetBedId } });
    if (!targetBed) {
      throw new HttpException('目标床位不存在', ErrorCode.BED_NOT_FOUND);
    }

    if (dto.sourceBedId === dto.targetBedId) {
      throw new HttpException('目标床位与原床位相同', ErrorCode.ADJUSTMENT_SAME_BED);
    }

    if (targetBed.underMaintenance) {
      throw new HttpException('目标床位正在维修中，无法迁入', ErrorCode.ADJUSTMENT_TARGET_BED_UNDER_MAINTENANCE);
    }

    if (targetBed.isOccupied && targetBed.studentId !== dto.studentId) {
      throw new HttpException('目标床位已被占用', ErrorCode.ADJUSTMENT_TARGET_BED_OCCUPIED);
    }

    const adjustment = this.adjustmentRepository.create({
      id: uuidv4(),
      studentId: dto.studentId,
      sourceBedId: dto.sourceBedId,
      targetBedId: dto.targetBedId,
      reason: dto.reason,
      reasonDetail: dto.reasonDetail,
      status: AdjustmentStatus.PENDING,
      assignedToId: dto.assignedToId || null,
      currentHandlerId: dto.assignedToId || null,
      expectedCompleteAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const saved = await this.adjustmentRepository.save(adjustment);

    if (dto.assignedToId) {
      const staff = await this.staffRepository.findOne({ where: { id: dto.assignedToId } });
      if (staff) {
        await this.operationLogService.createLog(
          'bed_adjustment',
          saved.id,
          OperationType.CREATE,
          staff.id,
          staff.name,
          staff.role,
          `创建床位调整申请，分配给${staff.name}处理`,
          null,
          AdjustmentStatus.PENDING,
        );
      }
    }

    return this.getDetail(saved.id);
  }

  async getDetail(id: string): Promise<BedAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id },
      relations: ['student', 'sourceBed', 'targetBed', 'currentHandler', 'assignedTo'],
    });
    if (!adjustment) {
      throw new HttpException('床位调整记录不存在', ErrorCode.ADJUSTMENT_NOT_FOUND);
    }
    return adjustment;
  }

  async list(params?: { status?: AdjustmentStatus; studentId?: string }): Promise<BedAdjustment[]> {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.studentId) where.studentId = params.studentId;

    return this.adjustmentRepository.find({
      where,
      relations: ['student', 'sourceBed', 'targetBed', 'currentHandler', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async process(id: string, dto: ProcessAdjustmentDto): Promise<BedAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({ where: { id } });
    if (!adjustment) {
      throw new HttpException('床位调整记录不存在', ErrorCode.ADJUSTMENT_NOT_FOUND);
    }

    if (adjustment.status === AdjustmentStatus.COMPLETED) {
      throw new HttpException('床位调整已完成，无法重复操作', ErrorCode.ADJUSTMENT_ALREADY_COMPLETED);
    }

    const handler = await this.staffRepository.findOne({ where: { id: dto.handlerId } });
    if (!handler) {
      throw new HttpException('处理人不存在', ErrorCode.STAFF_NOT_FOUND);
    }

    const fromStatus = adjustment.status;
    const oldStatusLabel = AdjustmentStatusLabel[fromStatus];
    const newStatusLabel = AdjustmentStatusLabel[dto.targetStatus];

    adjustment.status = dto.targetStatus;
    adjustment.currentHandlerId = dto.handlerId;
    adjustment.updatedAt = new Date();

    if (dto.remark) adjustment.remark = dto.remark;
    if (dto.rejectionReason) adjustment.rejectionReason = dto.rejectionReason;
    if (dto.returnReason) adjustment.returnReason = dto.returnReason;

    if (dto.assignedToId) {
      const newHandler = await this.staffRepository.findOne({ where: { id: dto.assignedToId } });
      if (newHandler) {
        adjustment.assignedToId = dto.assignedToId;
        adjustment.currentHandlerId = dto.assignedToId;
      }
    }

    if (dto.targetStatus === AdjustmentStatus.COMPLETED) {
      const sourceBed = await this.bedRepository.findOne({ where: { id: adjustment.sourceBedId } });
      const targetBed = await this.bedRepository.findOne({ where: { id: adjustment.targetBedId } });

      if (sourceBed && sourceBed.studentId !== adjustment.studentId) {
        throw new HttpException('原床位不属于该学生，无法完成调整', ErrorCode.ADJUSTMENT_SOURCE_BED_NOT_OWNED);
      }

      if (targetBed) {
        if (targetBed.underMaintenance) {
          throw new HttpException('目标床位正在维修中，无法迁入', ErrorCode.ADJUSTMENT_TARGET_BED_UNDER_MAINTENANCE);
        }
        if (targetBed.isOccupied && targetBed.studentId !== adjustment.studentId) {
          throw new HttpException('目标床位已被占用', ErrorCode.ADJUSTMENT_TARGET_BED_OCCUPIED);
        }
      }

      adjustment.completedAt = new Date();
      if (sourceBed) {
        sourceBed.isOccupied = false;
        sourceBed.studentId = null;
        await this.bedRepository.save(sourceBed);
      }
      if (targetBed) {
        targetBed.isOccupied = true;
        targetBed.studentId = adjustment.studentId;
        await this.bedRepository.save(targetBed);
      }
    }

    const saved = await this.adjustmentRepository.save(adjustment);

    let logContent = `状态从「${oldStatusLabel}」变更为「${newStatusLabel}」`;
    if (dto.remark) logContent += `，备注：${dto.remark}`;
    if (dto.returnReason) logContent += `，退回原因：${dto.returnReason}`;
    if (dto.rejectionReason) logContent += `，拒绝原因：${dto.rejectionReason}`;
    if (dto.assignedToId) {
      const newHandler = await this.staffRepository.findOne({ where: { id: dto.assignedToId } });
      if (newHandler) {
        logContent += `，转派给${newHandler.name}处理`;
      }
    }

    await this.operationLogService.createLog(
      'bed_adjustment',
      id,
      this.getOperationType(dto.targetStatus),
      handler.id,
      handler.name,
      handler.role,
      logContent,
      fromStatus,
      dto.targetStatus,
    );

    return this.getDetail(id);
  }

  private getOperationType(status: AdjustmentStatus): OperationType {
    switch (status) {
      case AdjustmentStatus.APPROVED:
        return OpType.APPROVE;
      case AdjustmentStatus.REJECTED:
        return OpType.REJECT;
      case AdjustmentStatus.RETURNED:
        return OpType.RETURN;
      case AdjustmentStatus.COMPLETED:
        return OpType.COMPLETE;
      case AdjustmentStatus.IN_PROGRESS:
      case AdjustmentStatus.MAINTENANCE_REQUIRED:
        return OpType.UPDATE;
      default:
        return OpType.UPDATE;
    }
  }

  async getOperationLogs(id: string): Promise<any[]> {
    const logs = await this.operationLogService.getLogsByBusiness('bed_adjustment', id);
    return logs.map(log => ({
      id: log.id,
      operationType: log.operationType,
      operator: log.operator ? {
        id: log.operator.id,
        name: log.operator.name,
        role: log.operator.role,
      } : null,
      content: log.content,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      createdAt: log.createdAt,
    }));
  }
}
