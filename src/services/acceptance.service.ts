import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation, InstallationStatus } from '../entities/installation.entity';
import { InstallationRecord, RecordType } from '../entities/installation-record.entity';
import { Photo, PhotoStatus } from '../entities/photo.entity';
import { User } from '../entities/user.entity';
import { SubmitAcceptanceDto, VerifyAcceptanceDto } from '../dto/acceptance.dto';

@Injectable()
export class AcceptanceService {
  private idempotencyStore = new Map<string, { result: any; timestamp: number }>();

  constructor(
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
    @InjectRepository(InstallationRecord)
    private recordRepository: Repository<InstallationRecord>,
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {}

  async submitAcceptance(submitDto: SubmitAcceptanceDto, installer: User): Promise<Installation> {
    if (submitDto.idempotencyKey) {
      const cached = this.idempotencyStore.get(submitDto.idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 86400000) {
        return cached.result;
      }
    }

    const installation = await this.installationRepository.findOne({
      where: { id: submitDto.installationId },
      relations: ['installer', 'photos'],
    });
    
    if (!installation) {
      throw new NotFoundException('安装工单不存在');
    }
    
    if (installation.installerId !== installer.id) {
      throw new BadRequestException('只能提交自己负责工单的验收');
    }
    
    if (installation.status !== InstallationStatus.COMPLETED) {
      throw new BadRequestException('只能对已完成的工单提交验收');
    }
    
    const pendingPhotos = installation.photos.filter(p => p.status === PhotoStatus.PENDING);
    if (pendingPhotos.length > 0) {
      throw new BadRequestException('存在未审核的照片，请等待照片审核完成');
    }
    
    if (submitDto.isAccepted) {
      installation.status = InstallationStatus.ACCEPTED;
      await this.recordRepository.save({
        installationId: submitDto.installationId,
        operatorId: installer.id,
        type: RecordType.ACCEPT,
        content: submitDto.comment || '安装验收通过',
      });
    } else {
      installation.status = InstallationStatus.REJECTED;
      await this.recordRepository.save({
        installationId: submitDto.installationId,
        operatorId: installer.id,
        type: RecordType.REJECT,
        content: submitDto.comment || '安装验收未通过',
      });
    }
    
    const result = await this.installationRepository.save(installation);
    
    if (submitDto.idempotencyKey) {
      this.idempotencyStore.set(submitDto.idempotencyKey, { result, timestamp: Date.now() });
    }
    
    return result;
  }

  async verifyAcceptance(verifyDto: VerifyAcceptanceDto, verifier: User): Promise<Installation> {
    if (verifyDto.idempotencyKey) {
      const cached = this.idempotencyStore.get(verifyDto.idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 86400000) {
        return cached.result;
      }
    }

    const installation = await this.installationRepository.findOne({
      where: { id: verifyDto.installationId },
      relations: ['photos'],
    });
    
    if (!installation) {
      throw new NotFoundException('安装工单不存在');
    }
    
    if (installation.status !== InstallationStatus.COMPLETED && 
        installation.status !== InstallationStatus.ACCEPTED &&
        installation.status !== InstallationStatus.REJECTED) {
      throw new BadRequestException('只能对已完成或已验收的工单进行审核');
    }
    
    const rejectedPhotos = installation.photos.filter(p => p.status === PhotoStatus.REJECTED);
    if (verifyDto.isVerified && rejectedPhotos.length > 0) {
      throw new BadRequestException('存在被驳回的照片，无法通过审核');
    }
    
    if (verifyDto.isVerified) {
      installation.status = InstallationStatus.ACCEPTED;
      await this.recordRepository.save({
        installationId: verifyDto.installationId,
        operatorId: verifier.id,
        type: RecordType.ACCEPT,
        content: verifyDto.comment || '验收审核通过',
      });
    } else {
      installation.status = InstallationStatus.REJECTED;
      await this.recordRepository.save({
        installationId: verifyDto.installationId,
        operatorId: verifier.id,
        type: RecordType.REJECT,
        content: verifyDto.comment || '验收审核未通过',
      });
    }
    
    const result = await this.installationRepository.save(installation);
    
    if (verifyDto.idempotencyKey) {
      this.idempotencyStore.set(verifyDto.idempotencyKey, { result, timestamp: Date.now() });
    }
    
    return result;
  }

  async getAcceptanceHistory(installationId: string): Promise<InstallationRecord[]> {
    return this.recordRepository.find({
      where: { 
        installationId,
        type: [RecordType.ACCEPT, RecordType.REJECT],
      },
      relations: ['operator'],
      order: { createdAt: 'ASC' },
    });
  }
}