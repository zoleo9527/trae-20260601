import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { IntakeOrder } from '../../intake/entities/intake-order.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('privacy_consents')
export class PrivacyConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => IntakeOrder, (order) => order.privacyConsent)
  @JoinColumn({ name: 'orderId' })
  @Index()
  order: IntakeOrder;

  @Column()
  orderId: string;

  @Column({ type: 'text' })
  consentContent: string;

  @Column({ type: 'simple-json' })
  consentItems: {
    allowDataAccess: boolean;
    allowPhotoBackup: boolean;
    allowContactRepair: boolean;
    allowDisclosure: boolean;
  };

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerSignature: string;

  @Column({ default: false })
  isSigned: boolean;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'witnessId' })
  witness: User;

  @Column({ nullable: true })
  signedAt: Date;

  @Column({ type: 'text', nullable: true })
  revokeReason: string;

  @Column({ nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
