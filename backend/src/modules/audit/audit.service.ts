import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  before: any;
  after: any;
  timestamp: Date;
  ip?: string;
}

export interface AuditQueryFilters {
  userId?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export interface CreateAuditEntry {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  ip?: string;
}

@Injectable()
export class AuditService {
  private readonly entries: AuditLogEntry[] = [];

  log(entry: CreateAuditEntry): AuditLogEntry {
    const record: AuditLogEntry = {
      id: uuidv4(),
      userId: entry.userId,
      userName: entry.userName,
      userRole: entry.userRole,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      before: entry.before ?? null,
      after: entry.after ?? null,
      timestamp: new Date(),
      ip: entry.ip,
    };
    this.entries.push(record);
    return record;
  }

  query(filters?: AuditQueryFilters): AuditLogEntry[] {
    let result = [...this.entries];

    if (filters?.userId) {
      result = result.filter((e) => e.userId === filters.userId);
    }
    if (filters?.entity) {
      result = result.filter((e) => e.entity === filters.entity);
    }
    if (filters?.entityId) {
      result = result.filter((e) => e.entityId === filters.entityId);
    }
    if (filters?.action) {
      result = result.filter((e) => e.action === filters.action);
    }
    if (filters?.from) {
      const fromDate = new Date(filters.from);
      result = result.filter((e) => e.timestamp >= fromDate);
    }
    if (filters?.to) {
      const toDate = new Date(filters.to);
      result = result.filter((e) => e.timestamp <= toDate);
    }

    result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return result;
  }

  getByEntity(entity: string, entityId: string): AuditLogEntry[] {
    return this.entries
      .filter((e) => e.entity === entity && e.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecent(limit: number = 50): AuditLogEntry[] {
    return [...this.entries]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getDisputesOverview(handoverDisputes: any[], depositDisputes: any[], pendingKeyTransfers: any[]): any {
    return {
      summary: {
        totalDisputes: handoverDisputes.length + depositDisputes.length,
        handoverDisputes: handoverDisputes.length,
        depositDisputes: depositDisputes.length,
        pendingKeyTransfers: pendingKeyTransfers.length,
      },
      handoverDisputes: handoverDisputes.map((h) => ({
        id: h.id,
        propertyId: h.propertyId,
        status: h.status,
        submittedBy: h.submittedByName,
        submittedAt: h.submittedAt,
        disputeReason: h.dispute?.reason,
        disputedItems: h.dispute?.disputedItems,
        raisedBy: h.dispute?.raisedByName,
        raisedAt: h.dispute?.raisedAt,
      })),
      depositDisputes: depositDisputes.map((d) => ({
        id: d.id,
        propertyId: d.propertyId,
        tenantName: d.tenantName,
        originalDeposit: d.originalDeposit,
        refundAmount: d.refundAmount,
        disputedAmount: d.dispute?.disputedAmount,
        disputeReason: d.dispute?.disputeReason,
        disputedItems: d.dispute?.deductionItems,
        raisedBy: d.dispute?.raisedByName,
        raisedAt: d.dispute?.raisedAt,
      })),
      pendingKeyTransfers: pendingKeyTransfers.map((k) => ({
        id: k.id,
        propertyId: k.propertyId,
        handoverId: k.handoverId,
        keyCount: k.keyCount,
        keyTypes: k.keyTypes,
        initiatedBy: k.transferredByName,
        initiatedAt: k.transferredAt,
        status: k.status,
      })),
    };
  }
}
