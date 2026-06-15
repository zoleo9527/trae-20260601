import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IntakeOrder } from '../../intake/entities/intake-order.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('quality_checks')
export class QualityCheckRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IntakeOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  @Index()
  order: IntakeOrder;

  @Column()
  orderId: string;

  @Column({ type: 'int', default: 1 })
  checkRound: number;

  @Column({ type: 'simple-json' })
  checkItems: {
    screenWorks: boolean;
    touchWorks: boolean;
    cameraWorks: boolean;
    speakerWorks: boolean;
    micWorks: boolean;
    chargeWorks: boolean;
    buttonWorks: boolean;
    wifiWorks: boolean;
    fingerprintWorks: boolean;
    faceIdWorks: boolean;
  };

  @Column()
  passed: boolean;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'text', nullable: true })
  failedItems: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'inspectorId' })
  inspector: User;

  @CreateDateColumn()
  @Index()
  checkedAt: Date;
}
