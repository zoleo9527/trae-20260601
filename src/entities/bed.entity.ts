import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';

@Entity('bed')
export class Bed {
  @PrimaryColumn()
  id: string;

  @Column()
  buildingNo: string;

  @Column()
  roomNo: string;

  @Column()
  bedNo: number;

  @Column()
  floor: number;

  @Column({ default: false })
  isOccupied: boolean;

  @Column({ nullable: true })
  studentId: string;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ default: false })
  underMaintenance: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
