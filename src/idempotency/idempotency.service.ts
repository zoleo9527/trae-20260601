import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type IdempotencyStatus = 'pending' | 'completed' | 'failed';

@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  async get(idempotencyKey: string): Promise<{ responseData: any; status: IdempotencyStatus } | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (!record) {
      return null;
    }

    if (new Date(record.expiresAt) < new Date()) {
      await this.prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
      return null;
    }

    return {
      responseData: record.responseData,
      status: record.status as IdempotencyStatus,
    };
  }

  async create(idempotencyKey: string, requestData: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.idempotencyKey.upsert({
      where: { key: idempotencyKey },
      update: {
        requestData,
        status: 'pending',
        expiresAt,
      },
      create: {
        key: idempotencyKey,
        requestData,
        status: 'pending',
        expiresAt,
      },
    });
  }

  async update(idempotencyKey: string, responseData: any): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: {
        responseData,
        status: 'completed',
      },
    });
  }

  async fail(idempotencyKey: string, errorData: any): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: {
        responseData: errorData,
        status: 'failed',
      },
    });
  }

  async delete(idempotencyKey: string): Promise<void> {
    await this.prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
  }

  async cleanupExpired(): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}