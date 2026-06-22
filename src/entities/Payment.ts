import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Customer } from "./Customer";
import { Receivable } from "./Receivable";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "ELECTRONIC" | "OTHER";

export type PaymentStatus = "PENDING" | "CONFIRMED" | "RECONCILED" | "CANCELLED";

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  paymentNo: string;

  @Column()
  paymentDate: Date;

  @Column({ type: "int" })
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  @Column({ type: "int" })
  receivableId: number;

  @ManyToOne(() => Receivable, (receivable) => receivable.payments)
  @JoinColumn({ name: "receivableId" })
  receivable: Receivable;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ type: "text", default: "BANK_TRANSFER" })
  paymentMethod: PaymentMethod;

  @Column({ type: "text", nullable: true })
  bankName: string;

  @Column({ type: "text", nullable: true })
  bankAccountNo: string;

  @Column({ type: "text", nullable: true })
  chequeNo: string;

  @Column({ type: "text", default: "CONFIRMED" })
  status: PaymentStatus;

  @Column({ type: "boolean", default: false })
  isReconciled: boolean;

  @Column({ type: "datetime", nullable: true })
  reconciledAt: Date;

  @Column({ type: "text", nullable: true })
  reconciledBy: string;

  @Column({ type: "text", nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
