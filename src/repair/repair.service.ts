import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import {
  SubmitDiagnosisDto,
  SubmitQualityCheckDto,
} from './dto/repair.dto';
import { User } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { IntakeStatus } from '../common/enums/intake-status.enum';
import { OperationLogService } from '../common/services/operation-log.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class RepairService {
  constructor(
    @InjectRepository(IntakeOrder)
    private readonly intakeRepo: Repository<IntakeOrder>,
    private readonly logService: OperationLogService,
  ) {}

  async claimOrder(orderId: string, technician: User) {
    const order = await this.intakeRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (order.technician) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '该工单已分配给其他维修师',
      );
    }
    if (
      order.status !== IntakeStatus.CONSENT_SIGNED &&
      order.status !== IntakeStatus.DIAGNOSING
    ) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可领取',
      );
    }

    const oldValue = { ...order };
    order.technician = technician;
    order.status = IntakeStatus.DIAGNOSING;
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      technician,
      oldValue,
      saved,
      { action: 'claim_order', technicianId: technician.id },
    );

    return saved;
  }

  async submitDiagnosis(orderId: string, dto: SubmitDiagnosisDto, technician: User) {
    const order = await this.intakeRepo.findOne({
      where: { id: orderId },
      relations: ['technician'],
    });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (technician.role === UserRole.TECHNICIAN && order.technician?.id !== technician.id) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN, '只能处理自己的工单');
    }
    if (order.status !== IntakeStatus.DIAGNOSING) {
      throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID, '只有诊断中状态可提交诊断结果');
    }

    const oldValue = { ...order };
    order.diagnosisResult = dto.diagnosisResult;
    if (dto.repairNotes) {
      order.repairNotes = dto.repairNotes;
    }
    order.status = IntakeStatus.REPAIRING;
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      technician,
      oldValue,
      saved,
      { action: 'submit_diagnosis' },
    );

    return saved;
  }

  async requestParts(orderId: string, notes: string, technician: User) {
    const order = await this.intakeRepo.findOne({
      where: { id: orderId },
      relations: ['technician'],
    });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (technician.role === UserRole.TECHNICIAN && order.technician?.id !== technician.id) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN, '只能处理自己的工单');
    }
    if (
      order.status !== IntakeStatus.DIAGNOSING &&
      order.status !== IntakeStatus.REPAIRING
    ) {
      throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID);
    }

    const oldValue = { ...order };
    order.status = IntakeStatus.WAITING_PARTS;
    order.repairNotes = (order.repairNotes || '') + `\n[申请备件] ${notes}`;
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      technician,
      oldValue,
      saved,
      { action: 'request_parts', notes },
    );

    return saved;
  }

  async partsArrived(orderId: string, operator: User) {
    const order = await this.intakeRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (order.status !== IntakeStatus.WAITING_PARTS) {
      throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID, '当前不是待备件状态');
    }

    const oldValue = { ...order };
    order.status = IntakeStatus.REPAIRING;
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'parts_arrived' },
    );

    return saved;
  }

  async submitForQuality(orderId: string, repairNotes: string, technician: User) {
    const order = await this.intakeRepo.findOne({
      where: { id: orderId },
      relations: ['technician'],
    });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (technician.role === UserRole.TECHNICIAN && order.technician?.id !== technician.id) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN, '只能处理自己的工单');
    }
    if (order.status !== IntakeStatus.REPAIRING) {
      throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID, '只有维修中状态可提交质检');
    }

    const oldValue = { ...order };
    if (repairNotes) {
      order.repairNotes = (order.repairNotes || '') + `\n[维修完成] ${repairNotes}`;
    }
    order.status = IntakeStatus.QUALITY_CHECK;
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      technician,
      oldValue,
      saved,
      { action: 'submit_quality' },
    );

    return saved;
  }

  async submitQualityCheck(
    orderId: string,
    dto: SubmitQualityCheckDto,
    inspector: User,
  ) {
    const order = await this.intakeRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (order.status !== IntakeStatus.QUALITY_CHECK) {
      throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID, '当前不是质检中状态');
    }

    const oldValue = { ...order };
    order.qualityCheck = {
      passed: dto.qualityCheck.passed,
      inspector: inspector.name,
      notes: dto.qualityCheck.notes,
      checkedAt: new Date().toISOString(),
    };
    order.status = dto.qualityCheck.passed
      ? IntakeStatus.READY
      : IntakeStatus.REPAIRING;
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      inspector,
      oldValue,
      saved,
      { action: 'quality_check', passed: dto.qualityCheck.passed },
    );

    return saved;
  }

  async completeOrder(orderId: string, operator: User) {
    const order = await this.intakeRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    if (order.status !== IntakeStatus.READY) {
      throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID, '只有待取机状态可完成');
    }

    const oldValue = { ...order };
    order.status = IntakeStatus.COMPLETED;
    order.completedAt = new Date();
    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      orderId,
      'update',
      operator,
      oldValue,
      saved,
      { action: 'complete_pickup' },
    );

    return saved;
  }
}
