import { Entity, Column, PrimaryColumn } from 'typeorm';
import { StaffRole } from '../common/enums';

@Entity('staff')
export class Staff {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'text',
    transformer: {
      to: (value: StaffRole) => value,
      from: (value: string) => value as StaffRole,
    },
  })
  role: StaffRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
