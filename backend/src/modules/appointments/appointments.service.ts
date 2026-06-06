import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like } from 'typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { StatusLog } from '../../entities/status-log.entity';
import { Dock } from '../../entities/dock.entity';
import { User } from '../../entities/user.entity';
import { AppointmentStatus, LogAction, DockStatus } from '../../common/enums';
import {
  CreateAppointmentDto,
  ApproveAppointmentDto,
  RejectAppointmentDto,
  SupplementAppointmentDto,
  AssignDockDto,
  CheckInDto,
  QueryAppointmentsDto,
} from './dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(StatusLog)
    private statusLogsRepository: Repository<StatusLog>,
    @InjectRepository(Dock)
    private docksRepository: Repository<Dock>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {
    this.seedDocks();
  }

  private async seedDocks() {
    const count = await this.docksRepository.count();
    if (count === 0) {
      const docks = [
        { code: 'D-01', name: '1号月台', zone: 'A区', type: '卸货' },
        { code: 'D-02', name: '2号月台', zone: 'A区', type: '卸货' },
        { code: 'D-03', name: '3号月台', zone: 'A区', type: '装货' },
        { code: 'D-04', name: '4号月台', zone: 'B区', type: '装货' },
        { code: 'D-05', name: '5号月台', zone: 'B区', type: '综合' },
        { code: 'D-06', name: '6号月台', zone: 'B区', type: '综合' },
      ];
      await this.docksRepository.save(docks);
    }
  }

  private generateOrderNo(): string {
    const date = new Date();
    const prefix = `YY${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${random}`;
  }

  private async createStatusLog(
    appointmentId: string,
    action: LogAction,
    operatorId: string,
    fromStatus?: AppointmentStatus,
    toStatus?: AppointmentStatus,
    remark?: string,
    meta?: Record<string, any>,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: operatorId } });
    const log = this.statusLogsRepository.create({
      appointmentId,
      action,
      fromStatus,
      toStatus,
      operatorId,
      operatorName: user?.name || '未知用户',
      remark,
      meta,
    });
    await this.statusLogsRepository.save(log);
  }

  async create(dto: CreateAppointmentDto) {
    const user = await this.usersRepository.findOne({ where: { id: dto.creatorId } });
    if (!user) throw new NotFoundException('用户不存在');

    const appointment = this.appointmentsRepository.create({
      ...dto,
      orderNo: this.generateOrderNo(),
      status: AppointmentStatus.PENDING,
      creatorId: dto.creatorId,
    });

    const saved = await this.appointmentsRepository.save(appointment);

    await this.createStatusLog(
      saved.id,
      LogAction.CREATE,
      dto.creatorId,
      null,
      AppointmentStatus.PENDING,
      '创建到车预约',
      { orderNo: saved.orderNo },
    );

    return this.findOne(saved.id);
  }

  async findAll(query: QueryAppointmentsDto) {
    const { status, startDate, endDate, keyword, dockId, page = 1, pageSize = 20 } = query;
    const where: any = {};

    if (status) where.status = status;
    if (dockId) where.dockId = dockId;
    if (startDate && endDate) {
      where.scheduledArrivalTime = Between(new Date(startDate), new Date(endDate));
    }

    const [items, total] = await this.appointmentsRepository.findAndCount({
      where: keyword
        ? [
            { ...where, orderNo: Like(`%${keyword}%`) },
            { ...where, plateNumber: Like(`%${keyword}%`) },
            { ...where, driverName: Like(`%${keyword}%`) },
            { ...where, carrierName: Like(`%${keyword}%`) },
          ]
        : where,
      relations: ['creator', 'approver', 'dock', 'dockAssigner'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['creator', 'approver', 'dock', 'dockAssigner', 'statusLogs'],
    });
    if (!appointment) throw new NotFoundException('预约不存在');
    return appointment;
  }

  async getStatusLogs(appointmentId: string) {
    return this.statusLogsRepository.find({
      where: { appointmentId },
      order: { createdAt: 'ASC' },
    });
  }

  async approve(id: string, dto: ApproveAppointmentDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.SUPPLEMENTED) {
        throw new BadRequestException('当前状态不允许审核通过');
      }

      const fromStatus = appointment.status;
      appointment.status = AppointmentStatus.APPROVED;
      appointment.approverId = dto.approverId;
      await manager.save(appointment);

      const user = await manager.findOne(User, { where: { id: dto.approverId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.APPROVE,
        fromStatus,
        toStatus: AppointmentStatus.APPROVED,
        operatorId: dto.approverId,
        operatorName: user?.name || '未知用户',
        remark: dto.remark || '审核通过，进入待分配队列',
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async reject(id: string, dto: RejectAppointmentDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.SUPPLEMENTED) {
        throw new BadRequestException('当前状态不允许驳回');
      }

      const fromStatus = appointment.status;
      appointment.status = AppointmentStatus.REJECTED;
      appointment.approverId = dto.approverId;
      appointment.rejectionReason = dto.rejectionReason;
      await manager.save(appointment);

      const user = await manager.findOne(User, { where: { id: dto.approverId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.REJECT,
        fromStatus,
        toStatus: AppointmentStatus.REJECTED,
        operatorId: dto.approverId,
        operatorName: user?.name || '未知用户',
        remark: `驳回原因：${dto.rejectionReason}`,
        meta: { rejectionReason: dto.rejectionReason },
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async supplement(id: string, dto: SupplementAppointmentDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (appointment.status !== AppointmentStatus.REJECTED) {
        throw new BadRequestException('只有被驳回的预约才能补录');
      }

      const fromStatus = appointment.status;
      const changes: any = {};
      if (dto.carrierName !== undefined) { changes.carrierName = dto.carrierName; appointment.carrierName = dto.carrierName; }
      if (dto.driverName !== undefined) { changes.driverName = dto.driverName; appointment.driverName = dto.driverName; }
      if (dto.driverPhone !== undefined) { changes.driverPhone = dto.driverPhone; appointment.driverPhone = dto.driverPhone; }
      if (dto.plateNumber !== undefined) { changes.plateNumber = dto.plateNumber; appointment.plateNumber = dto.plateNumber; }
      if (dto.cargoType !== undefined) { changes.cargoType = dto.cargoType; appointment.cargoType = dto.cargoType; }
      if (dto.cargoWeight !== undefined) { changes.cargoWeight = dto.cargoWeight; appointment.cargoWeight = dto.cargoWeight; }
      if (dto.supplementNote !== undefined) { appointment.supplementNote = dto.supplementNote; }

      appointment.status = AppointmentStatus.SUPPLEMENTED;
      await manager.save(appointment);

      const user = await manager.findOne(User, { where: { id: dto.operatorId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.SUPPLEMENT,
        fromStatus,
        toStatus: AppointmentStatus.SUPPLEMENTED,
        operatorId: dto.operatorId,
        operatorName: user?.name || '未知用户',
        remark: dto.remark || dto.supplementNote || '补录信息后重新提交审核',
        meta: { changes, supplementNote: dto.supplementNote },
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async assignDock(id: string, dto: AssignDockDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (appointment.status !== AppointmentStatus.APPROVED) {
        throw new BadRequestException('只有审核通过的预约才能分配月台');
      }

      const dock = await manager.findOne(Dock, { where: { id: dto.dockId } });
      if (!dock) throw new NotFoundException('月台不存在');
      if (dock.status !== DockStatus.AVAILABLE) {
        throw new BadRequestException('该月台当前不可用');
      }

      const fromStatus = appointment.status;
      appointment.dockId = dto.dockId;
      appointment.dockAssignerId = dto.assignerId;
      appointment.dockAssignedAt = new Date();
      appointment.status = AppointmentStatus.ASSIGNED;
      await manager.save(appointment);

      dock.status = DockStatus.OCCUPIED;
      await manager.save(dock);

      const user = await manager.findOne(User, { where: { id: dto.assignerId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.ASSIGN_DOCK,
        fromStatus,
        toStatus: AppointmentStatus.ASSIGNED,
        operatorId: dto.assignerId,
        operatorName: user?.name || '未知用户',
        remark: dto.remark || `分配月台：${dock.code} ${dock.name}`,
        meta: { dockId: dto.dockId, dockCode: dock.code, dockName: dock.name },
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async reassignDock(id: string, dto: AssignDockDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (![AppointmentStatus.ASSIGNED, AppointmentStatus.CHECKED_IN].includes(appointment.status)) {
        throw new BadRequestException('当前状态不允许调整月台');
      }

      const oldDock = appointment.dockId ? await manager.findOne(Dock, { where: { id: appointment.dockId } }) : null;
      const newDock = await manager.findOne(Dock, { where: { id: dto.dockId } });
      if (!newDock) throw new NotFoundException('新月台不存在');
      if (newDock.status !== DockStatus.AVAILABLE) {
        throw new BadRequestException('新月台当前不可用');
      }

      if (oldDock) {
        oldDock.status = DockStatus.AVAILABLE;
        await manager.save(oldDock);
      }

      appointment.dockId = dto.dockId;
      appointment.dockAssignerId = dto.assignerId;
      appointment.dockAssignedAt = new Date();
      await manager.save(appointment);

      newDock.status = DockStatus.OCCUPIED;
      await manager.save(newDock);

      const user = await manager.findOne(User, { where: { id: dto.assignerId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.REASSIGN_DOCK,
        fromStatus: appointment.status,
        toStatus: appointment.status,
        operatorId: dto.assignerId,
        operatorName: user?.name || '未知用户',
        remark: dto.remark || `调整月台：${oldDock?.code || '无'} → ${newDock.code}`,
        meta: { oldDockId: appointment.dockId, newDockId: dto.dockId, newDockCode: newDock.code },
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async checkIn(id: string, dto: CheckInDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (appointment.status !== AppointmentStatus.ASSIGNED) {
        throw new BadRequestException('只有已分配月台的预约才能签到');
      }

      const fromStatus = appointment.status;
      appointment.status = AppointmentStatus.CHECKED_IN;
      appointment.actualArrivalTime = new Date();
      await manager.save(appointment);

      const user = await manager.findOne(User, { where: { id: dto.operatorId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.CHECK_IN,
        fromStatus,
        toStatus: AppointmentStatus.CHECKED_IN,
        operatorId: dto.operatorId,
        operatorName: user?.name || '未知用户',
        remark: dto.remark || '车辆到场签到',
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async startLoading(id: string, operatorId: string, remark?: string) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (appointment.status !== AppointmentStatus.CHECKED_IN) {
        throw new BadRequestException('只有已签到的预约才能开始作业');
      }

      const fromStatus = appointment.status;
      appointment.status = AppointmentStatus.LOADING;
      await manager.save(appointment);

      const user = await manager.findOne(User, { where: { id: operatorId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.START_LOADING,
        fromStatus,
        toStatus: AppointmentStatus.LOADING,
        operatorId,
        operatorName: user?.name || '未知用户',
        remark: remark || '开始装卸作业',
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async complete(id: string, operatorId: string, remark?: string) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, { where: { id } });
      if (!appointment) throw new NotFoundException('预约不存在');
      if (![AppointmentStatus.LOADING, AppointmentStatus.CHECKED_IN].includes(appointment.status)) {
        throw new BadRequestException('当前状态不允许完成');
      }

      const fromStatus = appointment.status;
      appointment.status = AppointmentStatus.COMPLETED;
      await manager.save(appointment);

      if (appointment.dockId) {
        const dock = await manager.findOne(Dock, { where: { id: appointment.dockId } });
        if (dock) {
          dock.status = DockStatus.AVAILABLE;
          await manager.save(dock);
        }
      }

      const user = await manager.findOne(User, { where: { id: operatorId } });
      const log = manager.create(StatusLog, {
        appointmentId: id,
        action: LogAction.COMPLETE,
        fromStatus,
        toStatus: AppointmentStatus.COMPLETED,
        operatorId,
        operatorName: user?.name || '未知用户',
        remark: remark || '作业完成，车辆离场',
      });
      await manager.save(log);

      return this.findOne(id);
    });
  }

  async getStats() {
    const [total, pending, approved, assigned, completed, rejected] = await Promise.all([
      this.appointmentsRepository.count(),
      this.appointmentsRepository.count({ where: { status: AppointmentStatus.PENDING } }),
      this.appointmentsRepository.count({ where: { status: AppointmentStatus.APPROVED } }),
      this.appointmentsRepository.count({ where: { status: AppointmentStatus.ASSIGNED } }),
      this.appointmentsRepository.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.appointmentsRepository.count({ where: { status: AppointmentStatus.REJECTED } }),
    ]);

    return { total, pending, approved, assigned, completed, rejected };
  }
}
