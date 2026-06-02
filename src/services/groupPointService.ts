import prisma from '../lib/prisma.js';
import type { GroupPoint, Leader } from '@prisma/client';

export type LeaderStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface CreateGroupPointDto {
  name: string;
  address: string;
  leaderName: string;
  leaderPhone: string;
  leaderIdCard?: string;
  commissionRate?: number;
}

export interface UpdateLeaderDto {
  name?: string;
  phone?: string;
  idCard?: string;
  commissionRate?: number;
  status?: LeaderStatus;
}

export class GroupPointService {
  async createGroupPoint(dto: CreateGroupPointDto): Promise<GroupPoint & { leader: Leader }> {
    const commissionRate = dto.commissionRate ?? 1000; // 默认10%

    const leader = await prisma.leader.create({
      data: {
        name: dto.leaderName,
        phone: dto.leaderPhone,
        idCard: dto.leaderIdCard,
        commissionRate,
      },
    });

    const groupPoint = await prisma.groupPoint.create({
      data: {
        name: dto.name,
        address: dto.address,
        leaderId: leader.id,
      },
      include: {
        leader: true,
      },
    });

    return groupPoint;
  }

  async getGroupPoint(id: string): Promise<GroupPoint & { leader: Leader } | null> {
    return prisma.groupPoint.findUnique({
      where: { id },
      include: { leader: true },
    });
  }

  async listGroupPoints(): Promise<Array<GroupPoint & { leader: Leader }>> {
    return prisma.groupPoint.findMany({
      include: { leader: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeader(leaderId: string, dto: UpdateLeaderDto): Promise<Leader> {
    return prisma.leader.update({
      where: { id: leaderId },
      data: {
        name: dto.name,
        phone: dto.phone,
        idCard: dto.idCard,
        commissionRate: dto.commissionRate,
        status: dto.status,
      },
    });
  }

  async getLeader(leaderId: string): Promise<Leader | null> {
    return prisma.leader.findUnique({
      where: { id: leaderId },
      include: { groupPoint: true },
    });
  }

  async listLeaders(): Promise<Array<Leader & { groupPoint: GroupPoint | null }>> {
    return prisma.leader.findMany({
      include: { groupPoint: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const groupPointService = new GroupPointService();
