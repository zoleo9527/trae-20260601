import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Attendance } from './Attendance';
import { Class } from './Class';

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ type: 'int' })
  hours: number;

  @Column({ default: 'scheduled' })
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  teacherName: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => Class)
  class: Class;

  @Column()
  classId: number;

  @OneToMany(() => Attendance, attendance => attendance.session)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
