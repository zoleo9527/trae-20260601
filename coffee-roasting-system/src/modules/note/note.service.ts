import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../../entities/note.entity';
import { Task } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async create(task: Task, content: string, author: User, type?: string): Promise<Note> {
    const note = this.noteRepository.create({
      content,
      task,
      taskId: task.id,
      author,
      authorId: author.id,
      type,
    });
    return this.noteRepository.save(note);
  }

  async findAll(): Promise<Note[]> {
    return this.noteRepository.find({
      relations: { task: true, author: true },
    });
  }

  async findByTaskId(taskId: string): Promise<Note[]> {
    return this.noteRepository.find({
      where: { taskId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findByAuthorId(authorId: string): Promise<Note[]> {
    return this.noteRepository.find({
      where: { authorId },
      relations: { task: true },
    });
  }

  async findOne(id: string): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id },
      relations: { task: true, author: true },
    });
  }

  async update(id: string, content: string): Promise<Note | null> {
    await this.noteRepository.update(id, { content });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.noteRepository.delete(id);
  }
}
