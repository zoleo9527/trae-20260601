import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MilkChange } from './milk-change.entity';

@Entity('route_adjust_histories')
export class RouteAdjustHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  milkChangeId: string;

  @Column({ type: 'uuid', nullable: true })
  oldRouteId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  oldRouteName: string;

  @Column({ type: 'uuid', nullable: true })
  newRouteId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  newRouteName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  adjustReason: string;

  @Column({ type: 'uuid', nullable: true })
  operatorId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  operatorName: string;

  @ManyToOne(() => MilkChange, milkChange => milkChange.routeAdjustHistories)
  @JoinColumn({ name: 'milkChangeId' })
  milkChange: MilkChange;

  @CreateDateColumn()
  createdAt: Date;
}
