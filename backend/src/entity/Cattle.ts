import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { CattleNote } from './CattleNote'

export type CattleStatus = 'healthy' | 'sick' | 'pregnant' | 'calving' | 'sold' | 'dead'

@Entity()
export class Cattle {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  tagNumber: string

  @Column()
  breed: string

  @Column({ type: 'date' })
  birthDate: Date

  @Column()
  gender: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'healthy'
  })
  status: CattleStatus

  @Column({ nullable: true })
  motherId: number

  @Column({ nullable: true })
  fatherId: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number

  @Column({ nullable: true })
  location: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ nullable: true })
  photoUrl: string

  @OneToMany(() => CattleNote, note => note.cattle)
  notes: CattleNote[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}