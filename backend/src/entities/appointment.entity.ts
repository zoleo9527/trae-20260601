import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AppointmentStatus } from '../common/enums';
import { User } from './user.entity';
import { Dock } from './dock.entity';
import { StatusLog } from './status-log.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  carrierName: string;

  @Column()
  driverName: string;

  @Column()
  driverPhone: string;

  @Column()
  plateNumber: string;

  @Column({ type: 'timestamp' })
  scheduledArrivalTime: Date;

  @Column({ nullable: true })
  actualArrivalTime: Date;

  @Column()
  cargoType: string;

  @Column('decimal', { default: 0 })
  cargoWeight: number;

  @Column({ nullable: true })
  warehouseZone: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  supplementNote: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approverId' })
  approver: User;

  @Column({ nullable: true })
  approverId: string;

  @ManyToOne(() => Dock, { nullable: true })
  @JoinColumn({ name: 'dockId' })
  dock: Dock;

  @Column({ nullable: true })
  dockId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'dockAssignerId' })
  dockAssigner: User;

  @Column({ nullable: true })
  dockAssignerId: string;

  @Column({ type: 'timestamp', nullable: true })
  dockAssignedAt: Date;

  @OneToMany(() => StatusLog, (log) => log.appointment)
  statusLogs: StatusLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
