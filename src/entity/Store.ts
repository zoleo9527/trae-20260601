import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Review } from "./Review";
import { Compensation } from "./Compensation";

@Entity()
export class Store {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  storeCode: string;

  @Column()
  storeName: string;

  @Column()
  region: string;

  @Column()
  address: string;

  @Column()
  managerName: string;

  @Column()
  managerPhone: string;

  @Column({ nullable: true })
  supervisorName: string;

  @Column({ nullable: true })
  supervisorPhone: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Review, review => review.store)
  reviews: Review[];

  @OneToMany(() => Compensation, compensation => compensation.store)
  compensations: Compensation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
