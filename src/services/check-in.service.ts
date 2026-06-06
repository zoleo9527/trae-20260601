import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CheckInAssignment } from '../entities/check-in-assignment.entity';
import { Student } from '../entities/student.entity';
import { Bed } from '../entities/bed.entity';
import { Staff } from '../entities/staff.entity';
import { ErrorCode } from '../common/error-code';
import { CheckInStatus, OperationType, CheckInStatusLabel, StaffRole } from '../common/enums';
import { CreateCheckInDto, ProcessCheckInDto } from '../dto/check-in.dto';
import { OperationLogService } from './operation-log.service';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckInAssignment)
    private readonly checkInRepository: Repository<CheckInAssignment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Bed)
    private readonly bedRepository: Repository<Bed>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async create(dto: CreateCheckInDto): Promise<CheckInAssignment> {
    const student = await this.studentRepository.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new HttpException('学生不存在', ErrorCode.STUDENT_NOT_FOUND);
    }

    const bed = await this.bedRepository.findOne({ where: { id: dto.bedId } });
    if (!bed) {
      throw new HttpException('床位不存在', ErrorCode.BED_NOT_FOUND);
    }

    const assignment = this.checkInRepository.create({
      id: uuidv4(),
      studentId: dto.studentId,
      bedId: dto.bedId,
      status: CheckInStatus.PENDING,
      assignedToId: dto.assignedToId || null,
      currentHandlerId: dto.assignedToId || null,
      expectedCompleteAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    const saved = await this.checkInRepository.save(assignment);

    if (dto.assignedToId) {
      const staff = await this.staffRepository.findOne({ where: { id: dto.assignedToId } });
      if (staff) {
        await this.operationLogService.createLog(
          'check_in',
          saved.id,
          OperationType.CREATE,
          staff.id,
          staff.name,
          staff.role,
          `创建入住分配，分配给${staff.name}处理`,
          null,
          CheckInStatus.PENDING,
        );
      }
    }

    return this.getDetail(saved.id);
  }

  async getDetail(id: string): Promise<CheckInAssignment> {
    const assignment = await this.checkInRepository.findOne({
      where: { id },
      relations: ['student', 'bed', 'currentHandler', 'assignedTo'],
    });
    if (!assignment) {
      throw new HttpException('入住分配记录不存在', ErrorCode.CHECKIN_NOT_FOUND);
    }
    return assignment;
  }

  async list(params?: { status?: CheckInStatus; studentId?: string }): Promise<CheckInAssignment[]> {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.studentId) where.studentId = params.studentId;

    return this.checkInRepository.find({
      where,
      relations: ['student', 'bed', 'currentHandler', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async process(id: string, dto: ProcessCheckInDto): Promise<CheckInAssignment> {
    const assignment = await this.checkInRepository.findOne({ where: { id } });
    if (!assignment) {
      throw new HttpException('入住分配记录不存在', ErrorCode.CHECKIN_NOT_FOUND);
    }

    if (assignment.status === CheckInStatus.COMPLETED) {
      throw new HttpException('入住分配已完成，无法重复操作', ErrorCode.CHECKIN_ALREADY_PROCESSED);
    }

    const handler = await this.staffRepository.findOne({ where: { id: dto.handlerId } });
    if (!handler) {
      throw new HttpException('处理人不存在', ErrorCode.STAFF_NOT_FOUND);
    }

    const fromStatus = assignment.status;
    const oldStatusLabel = CheckInStatusLabel[fromStatus];
    const newStatusLabel = CheckInStatusLabel[dto.targetStatus];

    assignment.status = dto.targetStatus;
    assignment.currentHandlerId = dto.handlerId;
    assignment.updatedAt = new Date();

    if (dto.remark) assignment.remark = dto.remark;
    if (dto.rejectionReason) assignment.rejectionReason = dto.rejectionReason;
    if (dto.returnReason) assignment.returnReason = dto.returnReason;

    if (dto.assignedToId) {
      const newHandler = await this.staffRepository.findOne({ where: { id: dto.assignedToId } });
      if (newHandler) {
        assignment.assignedToId = dto.assignedToId;
        assignment.currentHandlerId = dto.assignedToId;
      }
    }

    if (dto.targetStatus === CheckInStatus.COMPLETED) {
      assignment.completedAt = new Date();
      const bed = await this.bedRepository.findOne({ where: { id: assignment.bedId } });
      if (bed) {
        bed.isOccupied = true;
        bed.studentId = assignment.studentId;
        await this.bedRepository.save(bed);
      }
    }

    const saved = await this.checkInRepository.save(assignment);

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
      'check_in',
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

  private getOperationType(status: CheckInStatus): OperationType {
    switch (status) {
      case CheckInStatus.APPROVED:
        return OperationType.APPROVE;
      case CheckInStatus.REJECTED:
        return OperationType.REJECT;
      case CheckInStatus.RETURNED:
        return OperationType.RETURN;
      case CheckInStatus.COMPLETED:
        return OperationType.COMPLETE;
      case CheckInStatus.IN_PROGRESS:
        return OperationType.UPDATE;
      default:
        return OperationType.UPDATE;
    }
  }

  async getOperationLogs(id: string): Promise<any[]> {
    const logs = await this.operationLogService.getLogsByBusiness('check_in', id);
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
