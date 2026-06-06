import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from './staff.entity';
import { OperationType } from '../common/enums';

@Entity('operation_log')
export class OperationLog {
  @PrimaryColumn()
  id: string;

  @Column()
  businessType: string;

  @Column()
  businessId: string;

  @Column({
    type: 'text',
    transformer: {
      to: (value: OperationType) => value,
      from: (value: string) => value as OperationType,
    },
  })
  operationType: OperationType;

  @Column({ nullable: true })
  operatorId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'operatorId' })
  operator: Staff;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  fromStatus: string;

  @Column({ type: 'text', nullable: true })
  toStatus: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
