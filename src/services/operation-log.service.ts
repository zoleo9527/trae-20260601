import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  OperationLog,
  OperationType,
  OperationResult,
  AnomalyRecord,
} from '../models/operation-log.model';

export interface CreateOperationLogDto {
  type: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  targetId: string;
  targetType: 'member' | 'baby' | 'reminder';
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  errorMessage?: string;
  errorCode?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class OperationLogService {
  private logs: Map<string, OperationLog> = new Map();
  private anomalies: Map<string, AnomalyRecord> = new Map();
  private targetIndex: Map<string, Set<string>> = new Map();
  private operatorIndex: Map<string, Set<string>> = new Map();

  async log(dto: CreateOperationLogDto): Promise<OperationLog> {
    const logId = uuidv4();
    const log: OperationLog = {
      id: logId,
      type: dto.type,
      result: dto.errorMessage ? OperationResult.FAILED : OperationResult.SUCCESS,
      operatorId: dto.operatorId,
      operatorName: dto.operatorName,
      operatorRole: dto.operatorRole,
      targetId: dto.targetId,
      targetType: dto.targetType,
      beforeData: dto.beforeData,
      afterData: dto.afterData,
      errorMessage: dto.errorMessage,
      errorCode: dto.errorCode,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      createdAt: new Date(),
    };

    this.logs.set(logId, log);

    if (!this.targetIndex.has(dto.targetId)) {
      this.targetIndex.set(dto.targetId, new Set());
    }
    this.targetIndex.get(dto.targetId)!.add(logId);

    if (!this.operatorIndex.has(dto.operatorId)) {
      this.operatorIndex.set(dto.operatorId, new Set());
    }
    this.operatorIndex.get(dto.operatorId)!.add(logId);

    return log;
  }

  async getLogsByTarget(targetId: string): Promise<OperationLog[]> {
    const logIds = this.targetIndex.get(targetId) || new Set();
    const logs: OperationLog[] = [];

    for (const logId of logIds) {
      const log = this.logs.get(logId);
      if (log) {
        logs.push(log);
      }
    }

    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLogsByOperator(operatorId: string): Promise<OperationLog[]> {
    const logIds = this.operatorIndex.get(operatorId) || new Set();
    const logs: OperationLog[] = [];

    for (const logId of logIds) {
      const log = this.logs.get(logId);
      if (log) {
        logs.push(log);
      }
    }

    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async reportAnomaly(
    type: AnomalyRecord['type'],
    severity: AnomalyRecord['severity'],
    description: string,
    relatedIds: {
      memberId?: string;
      babyId?: string;
      reminderId?: string;
    },
    autoTriggerReminder: boolean = true
  ): Promise<AnomalyRecord> {
    const anomalyId = uuidv4();
    const anomaly: AnomalyRecord = {
      id: anomalyId,
      type,
      severity,
      relatedMemberId: relatedIds.memberId,
      relatedBabyId: relatedIds.babyId,
      relatedReminderId: relatedIds.reminderId,
      description,
      detectedAt: new Date(),
      status: 'open',
      autoTriggeredReminder: autoTriggerReminder,
    };

    this.anomalies.set(anomalyId, anomaly);

    return anomaly;
  }

  async resolveAnomaly(
    anomalyId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<AnomalyRecord> {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) {
      throw new Error('异常记录不存在');
    }

    anomaly.status = 'resolved';
    anomaly.resolvedBy = resolvedBy;
    anomaly.resolvedAt = new Date();
    anomaly.resolution = resolution;

    return anomaly;
  }

  async getOpenAnomalies(): Promise<AnomalyRecord[]> {
    return Array.from(this.anomalies.values())
      .filter((a) => a.status === 'open')
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }

  async getAnomaliesByMember(memberId: string): Promise<AnomalyRecord[]> {
    return Array.from(this.anomalies.values())
      .filter((a) => a.relatedMemberId === memberId)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }
}