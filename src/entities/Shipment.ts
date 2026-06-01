import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Certificate } from './Certificate';
import { Student } from './Student';

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  trackingNo: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned' | 'failed';

  @Column()
  courier: string;

  @Column({ type: 'text' })
  recipientName: string;

  @Column()
  recipientPhone: string;

  @Column({ type: 'text' })
  recipientAddress: string;

  @Column({ type: 'text', nullable: true })
  currentLocation: string;

  @Column({ type: 'text', nullable: true })
  returnReason: string;

  @Column({ type: 'datetime', nullable: true })
  shippedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'datetime', nullable: true })
  returnedAt: Date;

  @OneToOne(() => Certificate, certificate => certificate.shipment)
  @JoinColumn()
  certificate: Certificate;

  @Column()
  certificateId: number;

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
