import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  type: string;

  @ManyToOne(() => Task, task => task.notes)
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User)
  author: User;

  @Column()
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;
}