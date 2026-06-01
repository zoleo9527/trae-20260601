import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Shipment } from './Shipment';
import { Student } from './Student';

@Entity()
export class Certificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  certificateNo: string;

  @Column()
  certificateType: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'printed' | 'shipped' | 'delivered';

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @Column({ default: false })
  addressConfirmed: boolean;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  shippingName: string;

  @Column({ nullable: true })
  shippingPhone: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  printedAt: Date;

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: number;

  @OneToOne(() => Shipment, shipment => shipment.certificate)
  shipment: Shipment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
