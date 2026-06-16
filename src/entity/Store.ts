import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Review } from "./Review";
import { Compensation } from "./Compensation";

@Entity()
export class Store {
  @PrimaryGeneratedColumn("uuid")
  id: string = "";

  @Column({ unique: true })
  storeCode: string = "";

  @Column()
  storeName: string = "";

  @Column()
  region: string = "";

  @Column()
  address: string = "";

  @Column()
  managerName: string = "";

  @Column()
  managerPhone: string = "";

  @Column({ nullable: true })
  supervisorName: string | null = null;

  @Column({ nullable: true })
  supervisorPhone: string | null = null;

  @Column({ default: true })
  isActive: boolean = true;

  @OneToMany(() => Review, review => review.store)
  reviews: Review[] = [];

  @OneToMany(() => Compensation, compensation => compensation.store)
  compensations: Compensation[] = [];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
