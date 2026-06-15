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
import { AttachmentType } from '../../common/enums/attachment-type.enum';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IntakeOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  @Index()
  order: IntakeOrder;

  @Column()
  orderId: string;

  @Column({
    type: 'simple-enum',
    enum: AttachmentType,
  })
  @Index()
  type: AttachmentType;

  @Column()
  fileName: string;

  @Column({ nullable: true })
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  @Index()
  uploadedAt: Date;
}
