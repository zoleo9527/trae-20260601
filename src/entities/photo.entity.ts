import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Installation } from './installation.entity';
import { User } from './user.entity';

export enum PhotoType {
  BEFORE = 'before',
  DURING = 'during',
  AFTER = 'after',
  PROOF = 'proof',
  OTHER = 'other',
}

export enum PhotoStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity()
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Installation)
  installation: Installation;

  @Column()
  installationId: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  uploadedById: string;

  @Column({ enum: PhotoType })
  type: PhotoType;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  fileType: string;

  @Column({ enum: PhotoStatus, default: PhotoStatus.PENDING })
  status: PhotoStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  uploadedAt: Date;
}