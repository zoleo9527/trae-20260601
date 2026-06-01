import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Student } from './Student';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  courseName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  totalHours: number;

  @Column({ default: 'recruiting' })
  status: 'recruiting' | 'ongoing' | 'completed';

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ nullable: true })
  teacherName: string;

  @OneToMany(() => Student, student => student.class)
  students: Student[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
