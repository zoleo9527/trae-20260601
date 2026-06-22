import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { OutboundOrder } from "./OutboundOrder";
import { Receivable } from "./Receivable";

export type PaymentTermType = "CASH" | "MONTHLY_15" | "MONTHLY_30" | "MONTHLY_45" | "MONTHLY_60";

export type CustomerCreditStatus = "NORMAL" | "WARNING" | "OVERDUE" | "FROZEN";

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerCode: string;

  @Column()
  customerName: string;

  @Column({ type: "text", default: "CASH" })
  paymentTermType: PaymentTermType;

  @Column({ default: 0 })
  paymentTermDays: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: "text", default: "NORMAL" })
  creditStatus: CustomerCreditStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalReceivableAmount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalReceivedAmount: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  overdueAmount: number;

  @Column({ type: "boolean", default: false })
  hasOverdue: boolean;

  @Column({ type: "int", default: 0 })
  overdueDays: number;

  @Column({ type: "text", nullable: true })
  contactPerson: string;

  @Column({ type: "text", nullable: true })
  contactPhone: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "text", nullable: true })
  remark: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OutboundOrder, (order) => order.customer)
  outboundOrders: OutboundOrder[];

  @OneToMany(() => Receivable, (receivable) => receivable.customer)
  receivables: Receivable[];
}
