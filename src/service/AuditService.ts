import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { AuditLog, AuditAction, AuditModule, AuditOperatorRole } from "../entity/AuditLog";
import { ErrorCode, ErrorMessage } from "../error/ErrorCode";

export class AuditService {
  private auditLogRepository: Repository<AuditLog>;

  constructor() {
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
  }

  async createLog(
    module: AuditModule,
    action: AuditAction,
    targetId: string,
    operatorRole: AuditOperatorRole,
    operatorName: string,
    beforeData: Record<string, any> | null,
    afterData: Record<string, any> | null,
    description: string,
    ipAddress: string
  ): Promise<{ code: ErrorCode; message: string; data?: AuditLog }> {
    try {
      const log = this.auditLogRepository.create({
        module,
        action,
        targetId,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        description,
        ipAddress,
      });

      const savedLog = await this.auditLogRepository.save(log);
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: savedLog };
    } catch (error) {
      console.error("Failed to create audit log:", error);
      return { code: ErrorCode.AUDIT_LOG_ERROR, message: ErrorMessage[ErrorCode.AUDIT_LOG_ERROR] };
    }
  }

  async getLogsByTargetId(targetId: string): Promise<{ code: ErrorCode; message: string; data?: AuditLog[] }> {
    try {
      const logs = await this.auditLogRepository.find({
        where: { targetId },
        order: { createdAt: "DESC" },
      });
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: logs };
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getLogsByModule(module: AuditModule): Promise<{ code: ErrorCode; message: string; data?: AuditLog[] }> {
    try {
      const logs = await this.auditLogRepository.find({
        where: { module },
        order: { createdAt: "DESC" },
      });
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: logs };
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getLogsByOperator(operatorName: string): Promise<{ code: ErrorCode; message: string; data?: AuditLog[] }> {
    try {
      const logs = await this.auditLogRepository.find({
        where: { operatorName },
        order: { createdAt: "DESC" },
      });
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: logs };
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<{ code: ErrorCode; message: string; data?: AuditLog[] }> {
    try {
      const logs = await this.auditLogRepository
        .createQueryBuilder("audit")
        .where("audit.createdAt >= :startDate", { startDate })
        .andWhere("audit.createdAt <= :endDate", { endDate })
        .orderBy("audit.createdAt", "DESC")
        .getMany();

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: logs };
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }
}
