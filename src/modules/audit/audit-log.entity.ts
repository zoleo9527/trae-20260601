import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('audit_logs')
@Index('idx_audit_log_module_created_at', ['module', 'createdAt'])
@Index('idx_audit_log_operator_created_at', ['operatorId', 'createdAt'])
@Index('idx_audit_log_store_created_at', ['storeId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '日志ID' })
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  @ApiProperty({ description: '模块名称' })
  module: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  @ApiProperty({ description: '操作类型' })
  action: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @ApiProperty({ description: '关联实体ID' })
  entityId: string;

  @Column({ type: 'simple-json', nullable: true })
  @ApiProperty({ description: '操作前状态' })
  beforeState: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  @ApiProperty({ description: '操作后状态' })
  afterState: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: '备注' })
  remark: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @ApiProperty({ description: '操作人ID' })
  operatorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({ description: '操作人姓名' })
  operatorName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @ApiProperty({ description: '操作人角色' })
  operatorRole: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @ApiProperty({ description: '门店ID' })
  storeId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({ description: '门店名称' })
  storeName: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @ApiProperty({ description: '请求ID' })
  requestId: string;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: '操作是否成功' })
  success: boolean;

  @Column({ type: 'simple-json', nullable: true })
  @ApiProperty({ description: '请求数据' })
  requestData: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  @ApiProperty({ description: '响应数据' })
  responseData: Record<string, any>;

  @CreateDateColumn({ type: 'datetime' })
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
