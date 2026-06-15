import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('installation_assignments')
export class InstallationAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  orderId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'installLeaderId' })
  installLeader: User;

  @Column({ type: 'datetime', nullable: true })
  installTime: Date;

  @Column({ nullable: true })
  installAddress: string;

  @Column({ type: 'text', nullable: true })
  assignmentNotes: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;

  @Column({ type: 'simple-json', nullable: true })
  teamMembers: string[];

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
