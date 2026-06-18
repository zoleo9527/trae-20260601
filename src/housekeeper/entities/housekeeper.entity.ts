import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HousekeeperStatus } from '../../common/enums';

@Entity('housekeepers')
export class Housekeeper extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  idCard?: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender?: string;

  @Index()
  @Column({
    type: 'simple-enum',
    enum: HousekeeperStatus,
    default: HousekeeperStatus.ACTIVE,
  })
  status: HousekeeperStatus;

  @Column({ type: 'text', comment: '逗号分隔技能: 保洁,育儿,老人,烹饪,月嫂' })
  skills: string;

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true, comment: '覆盖区域，逗号分隔' })
  coverageArea?: string;

  @Column({ type: 'int', default: 4000, comment: '期望最低月薪' })
  expectedMinSalary: number;

  @Column({ type: 'datetime', nullable: true })
  availableFrom?: Date;

  @Column({ type: 'text', nullable: true, comment: '例: "周一,周三,周五"' })
  weeklyAvailableDays?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'int', default: 0 })
  negativeReviews: number;

  @Column({ type: 'int', default: 0, comment: '爽约次数' })
  noShowCount: number;

  @Column({ type: 'boolean', default: false })
  hasCriminalRecordCheck: boolean;

  @Column({ type: 'boolean', default: false })
  hasHealthCertificate: boolean;

  @Column({ type: 'uuid', nullable: true })
  currentAssignedIntakeId?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;
}
