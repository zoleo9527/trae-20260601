
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  async get(idempotencyKey: string): Promise<any | null> {
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

    return record.responseData;
  }

  async create(idempotencyKey: string, requestData: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.idempotencyKey.create({
      data: {
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

  async delete(idempotencyKey: string): Promise<void> {
    await this.prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
  }

  async cleanupExpired(): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
