import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Customer } from "./Customer";
import { Receivable } from "./Receivable";

export type OutboundOrderStatus = "DRAFT" | "SALES_CONFIRMED" | "WAREHOUSE_OUTBOUND" | "COMPLETED" | "CANCELLED";

export type InvoiceStatus = "NOT_INVOICED" | "PARTIAL_INVOICED" | "FULLY_INVOICED";

@Entity()
export class OutboundOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderNo: string;

  @Column()
  outboundDate: Date;

  @Column({ type: "int" })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.outboundOrders)
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  @Column({ type: "text" })
  materialName: string;

  @Column({ type: "text", nullable: true })
  materialSpec: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  weight: number;

  @Column({ type: "text", default: "吨" })
  weightUnit: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: "text", default: "DRAFT" })
  status: OutboundOrderStatus;

  @Column({ type: "text", default: "NOT_INVOICED" })
  invoiceStatus: InvoiceStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  invoicedAmount: number;

  @Column({ type: "text", nullable: true })
  salesConfirmedBy: string;

  @Column({ type: "datetime", nullable: true })
  salesConfirmedAt: Date;

  @Column({ type: "text", nullable: true })
  warehouseOperator: string;

  @Column({ type: "datetime", nullable: true })
  warehouseOutboundAt: Date;

  @Column({ type: "text", nullable: true })
  vehicleNo: string;

  @Column({ type: "text", nullable: true })
  driverName: string;

  @Column({ type: "text", nullable: true })
  remark: string;

  @Column({ type: "boolean", default: false })
  hasPartialPayment: boolean;

  @Column({ type: "boolean", default: false })
  hasOverdueReceivable: boolean;

  @Column({ type: "boolean", default: false })
  needsWarning: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Receivable, (receivable) => receivable.outboundOrder)
  receivables: Receivable[];
}
