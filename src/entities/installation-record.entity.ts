import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Installation } from './installation.entity';
import { User } from './user.entity';

export enum RecordType {
  DISPATCH = 'dispatch',
  ON_SITE = 'on_site',
  COMPLETE = 'complete',
  ACCEPT = 'accept',
  REJECT = 'reject',
  COMMENT = 'comment',
}

@Entity()
export class InstallationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Installation)
  installation: Installation;

  @Column()
  installationId: string;

  @ManyToOne(() => User)
  operator: User;

  @Column()
  operatorId: string;

  @Column({ enum: RecordType })
  type: RecordType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;
}