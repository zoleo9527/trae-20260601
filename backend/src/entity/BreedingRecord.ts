import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn, OneToMany } from 'typeorm'
import { Cattle } from './Cattle'
import { User } from './User'
import { BreedingNote } from './BreedingNote'

export type BreedingType = 'natural' | 'artificial'
export type BreedingStatus = 'planned' | 'completed' | 'successful' | 'failed' | 'aborted'

@Entity()
export class BreedingRecord {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Cattle)
  cow!: Cattle

  @Column()
  cowId!: number

  @ManyToOne(() => Cattle)
  bull!: Cattle

  @Column()
  bullId!: number

  @Column({
    type: 'varchar',
    length: 20
  })
  type!: BreedingType

  @Column({ type: 'date' })
  breedingDate!: Date

  @Column({
    type: 'varchar',
    length: 20,
    default: 'planned'
  })
  status!: BreedingStatus

  @Column({ type: 'date', nullable: true })
  expectedCalvingDate?: Date

  @Column({ type: 'date', nullable: true })
  actualCalvingDate?: Date

  @Column({ nullable: true })
  calfTagNumber?: string

  @Column({ type: 'text', nullable: true })
  notes?: string

  @ManyToOne(() => User)
  operator!: User

  @Column()
  operatorId!: number

  @OneToMany(() => BreedingNote, note => note.breedingRecord)
  breedingNotes!: BreedingNote[]

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}