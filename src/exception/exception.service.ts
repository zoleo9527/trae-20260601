
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { ResolveExceptionDto } from './dto/resolve-exception.dto';
import { ExceptionLog, ExceptionStatus, AuditType, TargetType } from '@prisma/client';

@Injectable()
export class ExceptionService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateExceptionDto, userId: string): Promise<ExceptionLog> {
    const exception = await this.prisma.exceptionLog.create({
      data: {
        ...createDto,
      },
    });

    await this.prisma.auditRecord.create({
      data: {
        auditType: AuditType.EXCEPTION_RECORDED,
        targetType: TargetType.EXCEPTION,
        targetId: exception.id,
        newStatus: ExceptionStatus.PENDING,
        auditorId: userId,
        exceptionId: exception.id,
        comment: createDto.description,
      },
    });

    return exception;
  }

  async findAll(status?: ExceptionStatus, severity?: string): Promise<ExceptionLog[]> {
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    return this.prisma.exceptionLog.findMany({
      where,
      include: {
        volunteer: true,
        recruitment: true,
        resolver: true,
        auditRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<ExceptionLog> {
    const exception = await this.prisma.exceptionLog.findUnique({
      where: { id },
      include: {
        volunteer: true,
        recruitment: true,
        resolver: true,
        auditRecords: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }

    return exception;
  }

  async resolve(id: string, resolveDto: ResolveExceptionDto, userId: string): Promise<ExceptionLog> {
    const exception = await this.findOne(id);

    const updated = await this.prisma.exceptionLog.update({
      where: { id },
      data: {
        status: ExceptionStatus.RESOLVED,
        resolverId: userId,
        resolveComment: resolveDto.resolveComment,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.auditRecord.create({
      data: {
        auditType: AuditType.EXCEPTION_RESOLVED,
        targetType: TargetType.EXCEPTION,
        targetId: id,
        previousStatus: exception.status,
        newStatus: ExceptionStatus.RESOLVED,
        auditorId: userId,
        exceptionId: id,
        comment: resolveDto.resolveComment,
      },
    });

    return updated;
  }

  async getPendingExceptions(): Promise<ExceptionLog[]> {
    return this.prisma.exceptionLog.findMany({
      where: { status: ExceptionStatus.PENDING },
      include: { volunteer: true, recruitment: true },
      orderBy: { severity: 'desc', createdAt: 'asc' },
    });
  }

  async getRiskItems(): Promise<ExceptionLog[]> {
    return this.prisma.exceptionLog.findMany({
      where: { severity: { in: ['HIGH', 'CRITICAL'] }, status: { not: ExceptionStatus.RESOLVED } },
      include: { volunteer: true, recruitment: true },
      orderBy: { severity: 'desc', createdAt: 'desc' },
    });
  }
}
