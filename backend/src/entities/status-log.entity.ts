import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LogAction, AppointmentStatus } from '../common/enums';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';

@Entity('status_logs')
export class StatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.statusLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @Column({
    type: 'enum',
    enum: LogAction,
  })
  action: LogAction;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    nullable: true,
  })
  fromStatus: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    nullable: true,
  })
  toStatus: AppointmentStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operatorId' })
  operator: User;

  @Column()
  operatorId: string;

  @Column()
  operatorName: string;

  @Column({ nullable: true })
  remark: string;

  @Column({ type: 'json', nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
