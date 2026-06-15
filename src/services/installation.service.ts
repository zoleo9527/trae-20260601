import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Installation, InstallationStatus } from '../entities/installation.entity';
import { InstallationRecord, RecordType } from '../entities/installation-record.entity';
import { CreateInstallationDto, UpdateInstallationDto, InstallationQueryDto } from '../dto/installation.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class InstallationService {
  constructor(
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
    @InjectRepository(InstallationRecord)
    private recordRepository: Repository<InstallationRecord>,
  ) {}

  async create(createDto: CreateInstallationDto, dispatcher: User): Promise<Installation> {
    const installation = this.installationRepository.create({
      ...createDto,
      dispatcherId: dispatcher.id,
      dispatcher,
    });
    const saved = await this.installationRepository.save(installation);
    
    await this.createRecord(saved.id, dispatcher.id, RecordType.COMMENT, '工单已创建');
    
    return saved;
  }

  async findAll(query: InstallationQueryDto): Promise<{ data: Installation[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', ...filters } = query;
    
    const queryBuilder = this.installationRepository
      .createQueryBuilder('installation')
      .leftJoinAndSelect('installation.dispatcher', 'dispatcher')
      .leftJoinAndSelect('installation.installer', 'installer');

    if (filters.customerName) {
      queryBuilder.andWhere('installation.customerName LIKE :customerName', {
        customerName: `%${filters.customerName}%`,
      });
    }
    if (filters.customerPhone) {
      queryBuilder.andWhere('installation.customerPhone LIKE :customerPhone', {
        customerPhone: `%${filters.customerPhone}%`,
      });
    }
    if (filters.status) {
      queryBuilder.andWhere('installation.status = :status', { status: filters.status });
    }
    if (filters.paymentStatus) {
      queryBuilder.andWhere('installation.paymentStatus = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }
    if (filters.productType) {
      queryBuilder.andWhere('installation.productType LIKE :productType', {
        productType: `%${filters.productType}%`,
      });
    }
    if (filters.installerId) {
      queryBuilder.andWhere('installation.installerId = :installerId', { installerId: filters.installerId });
    }
    if (filters.dispatcherId) {
      queryBuilder.andWhere('installation.dispatcherId = :dispatcherId', { dispatcherId: filters.dispatcherId });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('installation.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('installation.createdAt <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder.orderBy(`installation.${sortBy}`, sortOrder);
    
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Installation> {
    const installation = await this.installationRepository.findOne({
      where: { id },
      relations: {
        dispatcher: true,
        installer: true,
        records: {
          operator: true,
        },
        photos: true,
      },
    });
    if (!installation) {
      throw new NotFoundException('安装工单不存在');
    }
    return installation;
  }

  async update(id: string, updateDto: UpdateInstallationDto, operator: User): Promise<Installation> {
    const installation = await this.findOne(id);
    
    const previousStatus = installation.status;
    Object.assign(installation, updateDto);
    
    const saved = await this.installationRepository.save(installation);
    
    if (updateDto.status && updateDto.status !== previousStatus) {
      const statusMap: Record<string, string> = {
        [InstallationStatus.DISPATCHED]: '工单已派工',
        [InstallationStatus.IN_PROGRESS]: '安装进行中',
        [InstallationStatus.COMPLETED]: '安装完成',
        [InstallationStatus.ACCEPTED]: '验收通过',
        [InstallationStatus.REJECTED]: '验收驳回',
        [InstallationStatus.CLOSED]: '工单已关闭',
      };
      await this.createRecord(id, operator.id, RecordType.COMMENT, statusMap[updateDto.status] || `状态变更为 ${updateDto.status}`);
    }
    
    return saved;
  }

  async dispatch(id: string, installerId: string, dispatcher: User): Promise<Installation> {
    const installation = await this.findOne(id);
    if (installation.status !== InstallationStatus.PENDING) {
      throw new BadRequestException('只能调度待处理状态的工单');
    }
    
    installation.status = InstallationStatus.DISPATCHED;
    installation.installerId = installerId;
    
    const saved = await this.installationRepository.save(installation);
    await this.createRecord(id, dispatcher.id, RecordType.DISPATCH, `已派工给安装师傅 ID: ${installerId}`);
    
    return saved;
  }

  async complete(id: string, installer: User): Promise<Installation> {
    const installation = await this.findOne(id);
    if (installation.installerId !== installer.id) {
      throw new BadRequestException('只能完成自己负责的工单');
    }
    if (installation.status !== InstallationStatus.DISPATCHED && installation.status !== InstallationStatus.IN_PROGRESS) {
      throw new BadRequestException('只能完成已派工或进行中的工单');
    }
    
    installation.status = InstallationStatus.COMPLETED;
    installation.actualDate = new Date();
    
    const saved = await this.installationRepository.save(installation);
    await this.createRecord(id, installer.id, RecordType.COMPLETE, '安装完成，等待验收');
    
    return saved;
  }

  async createRecord(installationId: string, operatorId: string, type: RecordType, content: string): Promise<InstallationRecord> {
    const record = this.recordRepository.create({
      installationId,
      operatorId,
      type,
      content,
    });
    return this.recordRepository.save(record);
  }

  async getRecords(installationId: string): Promise<InstallationRecord[]> {
    return this.recordRepository.find({
      where: { installationId },
      relations: {
        operator: true,
      },
      order: { createdAt: 'ASC' },
    });
  }
}