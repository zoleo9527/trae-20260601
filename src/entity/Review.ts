import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Store } from "./Store";
import { Compensation } from "./Compensation";

export enum ReviewStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  RESOLVED = "resolved",
  CLOSED = "closed"
}

export enum ReviewSource {
  MEITUAN = "meituan",
  ELEME = "eleme",
  DINGDONG = "dingdong",
  OTHER = "other"
}

export enum ReviewLevel {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

export enum ReviewType {
  FOOD_QUALITY = "food_quality",
  DELIVERY_DELAY = "delivery_delay",
  PACKAGING = "packaging",
  SERVICE = "service",
  OTHER = "other"
}

export enum HandlerRole {
  STORE_MANAGER = "store_manager",
  REGION_SUPERVISOR = "region_supervisor",
  PURCHASING = "purchasing",
  CUSTOMER_SERVICE = "customer_service"
}

@Entity()
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string = "";

  @Column({ type: "enum", enum: ReviewSource })
  source: ReviewSource = ReviewSource.OTHER;

  @Column()
  orderId: string = "";

  @Column()
  customerName: string = "";

  @Column()
  customerPhone: string = "";

  @Column({ type: "text" })
  content: string = "";

  @Column({ type: "enum", enum: ReviewLevel })
  level: ReviewLevel = ReviewLevel.LOW;

  @Column({ type: "enum", enum: ReviewType })
  type: ReviewType = ReviewType.OTHER;

  @Column({ type: "enum", enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus = ReviewStatus.PENDING;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  orderAmount: number = 0;

  @Column({ type: "enum", enum: HandlerRole, nullable: true })
  currentHandler: HandlerRole | null = null;

  @Column({ nullable: true })
  handlerName: string | null = null;

  @Column({ type: "text", nullable: true })
  internalNotes: string | null = null;

  @Column({ nullable: true })
  blockedReason: string | null = null;

  @ManyToOne(() => Store, store => store.reviews)
  store: Store | null = null;

  @OneToMany(() => Compensation, compensation => compensation.review)
  compensations: Compensation[] = [];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Column({ nullable: true })
  resolvedAt: Date | null = null;
}
