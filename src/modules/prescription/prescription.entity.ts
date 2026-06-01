import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PrescriptionStatus } from './prescription.enum';

export interface Medicine {
  name: string;
  specification: string;
  dosage: string;
  frequency: string;
  quantity: number;
  unit: string;
  remark?: string;
}

export interface AuditLog {
  beforeState: PrescriptionStatus;
  afterState: PrescriptionStatus;
  operatorId: string;
  operatorName: string;
  action: string;
  remark?: string;
  timestamp: Date;
}

@Entity('prescriptions')
@Index('idx_prescription_status_created', ['currentStatus', 'createdAt'])
@Index('idx_prescription_store_created', ['storeId', 'createdAt'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '处方ID' })
  id: string;

  @Column({ unique: true, length: 50 })
  @Index('uk_prescription_no', { unique: true })
  @ApiProperty({ description: '处方编号' })
  prescriptionNo: string;

  @Column({ length: 50 })
  @ApiProperty({ description: '患者姓名' })
  patientName: string;

  @Column({ type: 'int' })
  @ApiProperty({ description: '患者年龄' })
  patientAge: number;

  @Column({ length: 10 })
  @ApiProperty({ description: '患者性别', enum: ['男', '女', '未知'] })
  patientGender: string;

  @Column({ length: 50 })
  @ApiProperty({ description: '开具医生姓名' })
  doctorName: string;

  @Column({ length: 50 })
  @ApiProperty({ description: '科室' })
  department: string;

  @Column({ length: 200 })
  @ApiProperty({ description: '诊断' })
  diagnosis: string;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  @ApiProperty({ description: '药品列表', type: [Object] })
  medicines: Medicine[];

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '备注' })
  remark?: string;

  @Column({ type: 'varchar', length: 32, default: PrescriptionStatus.DRAFT })
  @ApiProperty({ description: '当前状态', enum: PrescriptionStatus })
  currentStatus: PrescriptionStatus;

  @Column({ nullable: true, length: 50 })
  @ApiProperty({ description: '提交人ID' })
  submitterId?: string;

  @Column({ nullable: true, length: 50 })
  @ApiProperty({ description: '提交人姓名' })
  submitterName?: string;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '提交时间' })
  submitTime?: Date;

  @Column({ nullable: true, length: 50 })
  @ApiProperty({ description: '审核人ID' })
  reviewerId?: string;

  @Column({ nullable: true, length: 50 })
  @ApiProperty({ description: '审核人姓名' })
  reviewerName?: string;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '审核时间' })
  reviewTime?: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '审核备注' })
  reviewRemark?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '拒绝原因' })
  rejectReason?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '补充说明' })
  supplementRemark?: string;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '补充时间' })
  supplementTime?: Date;

  @Column({ length: 50 })
  @ApiProperty({ description: '门店ID' })
  storeId: string;

  @Column({ length: 100 })
  @ApiProperty({ description: '门店名称' })
  storeName: string;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  @ApiProperty({ description: '状态变更审计日志', type: [Object] })
  auditLogs: AuditLog[];

  @CreateDateColumn({ type: 'datetime' })
  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
