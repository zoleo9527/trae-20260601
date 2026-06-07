import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MilkChange } from './milk-change.entity';
import { OperationType, MilkChangeStatus } from '../common/enums';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  milkChangeId: string;

  @Column({ type: 'varchar', length: 50 })
  operationType: OperationType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  operatorId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  operatorName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fromStatus: MilkChangeStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  toStatus: MilkChangeStatus;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @ManyToOne(() => MilkChange, milkChange => milkChange.operationLogs)
  @JoinColumn({ name: 'milkChangeId' })
  milkChange: MilkChange;

  @CreateDateColumn()
  createdAt: Date;
}
