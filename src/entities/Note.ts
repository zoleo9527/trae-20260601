import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Student } from './Student';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  createdBy: string;

  @Column({ default: 'general' })
  category: 'general' | 'attendance' | 'certificate' | 'shipment' | 'other';

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: number;

  @CreateDateColumn()
  createdAt: Date;
}
