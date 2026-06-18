
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditVolunteerDto } from './dto/audit-volunteer.dto';
import { VolunteerStatus, AuditType, TargetType, AuditRecord } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async auditVolunteer(volunteerId: string, auditDto: AuditVolunteerDto, userId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({ where: { id: volunteerId } });

    if (!volunteer) {
      throw new NotFoundException('志愿者不存在');
    }

    if (volunteer.status === VolunteerStatus.APPROVED || volunteer.status === VolunteerStatus.REJECTED) {
      throw new BadRequestException('该志愿者已完成审核');
    }

    const newStatus = auditDto.decision === 'APPROVE' ? VolunteerStatus.APPROVED : VolunteerStatus.REJECTED;
    const auditType = auditDto.decision === 'APPROVE' ? AuditType.AUDIT_PASSED : AuditType.AUDIT_FAILED;

    await this.prisma.$transaction([
      this.prisma.volunteer.update({
        where: { id: volunteerId },
        data: { status: newStatus },
      }),
      this.prisma.auditRecord.create({
        data: {
          auditType,
          targetType: TargetType.VOLUNTEER,
          targetId: volunteerId,
          previousStatus: volunteer.status,
          newStatus,
          auditorId: userId,
          volunteerId,
          comment: auditDto.comment,
        },
      }),
    ]);

    return this.prisma.volunteer.findUnique({
      where: { id: volunteerId },
      include: { auditRecords: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async getAuditHistory(volunteerId: string): Promise<AuditRecord[]> {
    const volunteer = await this.prisma.volunteer.findUnique({ where: { id: volunteerId } });
    
    if (!volunteer) {
      throw new NotFoundException('志愿者不存在');
    }

    return this.prisma.auditRecord.findMany({
      where: { volunteerId },
      include: { auditor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingAudits(): Promise<any[]> {
    return this.prisma.volunteer.findMany({
      where: { status: VolunteerStatus.PENDING },
      include: {
        auditRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
        exceptionLogs: { where: { status: 'PENDING' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAuditStats(): Promise<any> {
    const total = await this.prisma.volunteer.count();
    const pending = await this.prisma.volunteer.count({ where: { status: VolunteerStatus.PENDING } });
    const approved = await this.prisma.volunteer.count({ where: { status: VolunteerStatus.APPROVED } });
    const rejected = await this.prisma.volunteer.count({ where: { status: VolunteerStatus.REJECTED } });

    const recentAudits = await this.prisma.auditRecord.findMany({
      where: { auditType: { in: [AuditType.AUDIT_PASSED, AuditType.AUDIT_FAILED] } },
      include: { auditor: true, volunteer: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      total,
      pending,
      approved,
      rejected,
      recentAudits,
    };
  }

  async getAuditRecordById(recordId: string): Promise<AuditRecord | null> {
    return this.prisma.auditRecord.findUnique({
      where: { id: recordId },
      include: { auditor: true, volunteer: true, recruitment: true, exception: true },
    });
  }
}
