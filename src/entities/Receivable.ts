import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Customer } from "./Customer";
import { OutboundOrder } from "./OutboundOrder";
import { Payment } from "./Payment";

export type ReceivableStatus = "PENDING" | "PARTIAL_PAID" | "FULLY_PAID" | "OVERDUE" | "BAD_DEBT";

export type ReconciliationStatus = "UNRECONCILED" | "PARTIAL_RECONCILED" | "FULLY_RECONCILED";

@Entity()
export class Receivable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  receivableNo: string;

  @Column({ type: "int" })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.receivables)
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  @Column({ type: "int" })
  outboundOrderId: number;

  @ManyToOne(() => OutboundOrder, (order) => order.receivables)
  @JoinColumn({ name: "outboundOrderId" })
  outboundOrder: OutboundOrder;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  receivedAmount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  remainingAmount: number;

  @Column()
  dueDate: Date;

  @Column({ type: "int", default: 0 })
  ageDays: number;

  @Column({ type: "int", default: 0 })
  overdueDays: number;

  @Column({ type: "text", default: "PENDING" })
  status: ReceivableStatus;

  @Column({ type: "text", default: "UNRECONCILED" })
  reconciliationStatus: ReconciliationStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  reconciledAmount: number;

  @Column({ type: "text", nullable: true })
  agingBucket: string;

  @Column({ type: "boolean", default: false })
  isOverdue: boolean;

  @Column({ type: "text", nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Payment, (payment) => payment.receivable)
  payments: Payment[];
}
