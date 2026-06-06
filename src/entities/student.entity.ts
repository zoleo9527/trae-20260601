import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('student')
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  studentNo: string;

  @Column()
  gender: string;

  @Column()
  department: string;

  @Column()
  major: string;

  @Column()
  grade: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
