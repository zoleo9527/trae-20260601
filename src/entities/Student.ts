import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Attendance } from './Attendance';
import { Certificate } from './Certificate';
import { Class } from './Class';
import { MakeupRequest } from './MakeupRequest';
import { Note } from './Note';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  studentNo: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  idCard: string;

  @Column({ default: 'enrolled' })
  status: 'enrolled' | 'studying' | 'suspended' | 'graduated' | 'dropped';

  @Column({ type: 'int', default: 0 })
  attendedHours: number;

  @ManyToOne(() => Class, { nullable: true })
  class: Class;

  @Column({ nullable: true })
  classId: number;

  @OneToMany(() => Attendance, attendance => attendance.student)
  attendances: Attendance[];

  @OneToMany(() => MakeupRequest, makeup => makeup.student)
  makeupRequests: MakeupRequest[];

  @OneToMany(() => Certificate, certificate => certificate.student)
  certificates: Certificate[];

  @OneToMany(() => Note, note => note.student)
  notes: Note[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
