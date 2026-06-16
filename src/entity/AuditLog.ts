import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  ASSIGN = "assign",
  APPROVE = "approve",
  REJECT = "reject",
  RESOLVE = "resolve",
  CLOSE = "close"
}

export enum AuditModule {
  REVIEW = "review",
  COMPENSATION = "compensation",
  STORE = "store",
  SYSTEM = "system"
}

export enum AuditOperatorRole {
  STORE_MANAGER = "store_manager",
  REGION_SUPERVISOR = "region_supervisor",
  PURCHASING = "purchasing",
  FINANCE = "finance",
  ADMIN = "admin",
  SYSTEM = "system"
}

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: AuditModule })
  module: AuditModule;

  @Column({ type: "enum", enum: AuditAction })
  action: AuditAction;

  @Column()
  targetId: string;

  @Column({ type: "enum", enum: AuditOperatorRole })
  operatorRole: AuditOperatorRole;

  @Column()
  operatorName: string;

  @Column({ type: "json", nullable: true })
  beforeData: Record<string, any> | null;

  @Column({ type: "json", nullable: true })
  afterData: Record<string, any> | null;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column()
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
