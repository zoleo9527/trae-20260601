import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { IntakeStatus } from '../../common/enums/intake-status.enum';
import { PriorityLevel } from '../../common/enums/priority-level.enum';
import { User } from '../../auth/entities/user.entity';
import { PrivacyConsent } from '../../privacy/entities/privacy-consent.entity';

@Entity('intake_orders')
export class IntakeOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  orderNo: string;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerWechat: string;

  @Column()
  phoneBrand: string;

  @Column()
  phoneModel: string;

  @Column()
  phoneColor: string;

  @Column({ nullable: true })
  phoneImei: string;

  @Column({ nullable: true })
  phonePassword: string;

  @Column({ type: 'text' })
  faultDescription: string;

  @Column({ type: 'simple-json', nullable: true })
  appearanceCheck: {
    hasScreenDamage: boolean;
    hasBackDamage: boolean;
    hasFrameDamage: boolean;
    hasWaterDamage: boolean;
    notes: string;
  };

  @Column({ type: 'simple-json', nullable: true })
  accessories: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deposit: number;

  @Column({
    type: 'simple-enum',
    enum: PriorityLevel,
    default: PriorityLevel.NORMAL,
  })
  priority: PriorityLevel;

  @Column({
    type: 'simple-enum',
    enum: IntakeStatus,
    default: IntakeStatus.WAITING_CONSENT,
  })
  @Index()
  status: IntakeStatus;

  @Column({ type: 'text', nullable: true })
  diagnosisResult: string;

  @Column({ type: 'text', nullable: true })
  repairNotes: string;

  @Column({ type: 'simple-json', nullable: true })
  qualityCheck: {
    passed: boolean;
    inspector: string;
    notes: string;
    checkedAt: string;
  };

  @Column({ nullable: true })
  expectedDelivery: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'receptionistId' })
  receptionist: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'technicianId' })
  technician: User;

  @OneToOne(() => PrivacyConsent, (consent) => consent.order, {
    cascade: true,
    nullable: true,
  })
  privacyConsent: PrivacyConsent;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
