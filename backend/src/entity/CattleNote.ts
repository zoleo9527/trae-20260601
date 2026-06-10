import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm'
import { Cattle } from './Cattle'
import { User } from './User'

export type NoteType = 'health' | 'breeding' | 'feeding' | 'treatment' | 'other'
export type NoteStatus = 'pending' | 'processing' | 'resolved' | 'rejected'

@Entity()
export class CattleNote {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Cattle, cattle => cattle.notes)
  cattle: Cattle

  @Column()
  cattleId: number

  @ManyToOne(() => User)
  author: User

  @Column()
  authorId: number

  @Column({
    type: 'varchar',
    length: 20
  })
  type: NoteType

  @Column({ type: 'text' })
  content: string

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status: NoteStatus

  @Column({ nullable: true })
  assigneeId: number

  @Column({ type: 'text', nullable: true })
  followUp: string

  @Column({ type: 'date', nullable: true })
  dueDate: Date

  @Column({ nullable: true })
  breedingRecordId: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}