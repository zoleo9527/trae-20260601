import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm'
import { BreedingRecord } from './BreedingRecord'
import { User } from './User'
import { CattleNote } from './CattleNote'

export type BreedingNoteStatus = 'pending' | 'processing' | 'resolved' | 'rejected'

@Entity()
export class BreedingNote {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => BreedingRecord, record => record.breedingNotes)
  breedingRecord!: BreedingRecord

  @Column()
  breedingRecordId!: number

  @ManyToOne(() => User)
  author!: User

  @Column()
  authorId!: number

  @Column({ type: 'text' })
  content!: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: BreedingNoteStatus

  @Column({ nullable: true })
  assigneeId?: number

  @Column({ type: 'text', nullable: true })
  followUp?: string

  @Column({ nullable: true })
  relatedCattleNoteId?: number

  @ManyToOne(() => CattleNote)
  relatedCattleNote?: CattleNote

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}