import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(order: Order, type: TaskType, assignee?: User): Promise<Task> {
    const task = this.taskRepository.create({
      type,
      order,
      orderId: order.id,
      assignee,
      assigneeId: assignee?.id,
    });
    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: { order: true, assignee: true, notes: true },
    });
  }

  async findOne(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({
      where: { id },
      relations: { order: true, assignee: true, notes: { author: true } },
    });
  }

  async findByOrderId(orderId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { orderId },
      relations: { assignee: true, notes: true },
    });
  }

  async findByAssigneeId(assigneeId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assigneeId },
      relations: { order: true, notes: true },
    });
  }

  async findPendingByType(type: TaskType): Promise<Task[]> {
    return this.taskRepository.find({
      where: { type, status: TaskStatus.PENDING },
      relations: { order: true, assignee: true },
    });
  }

  async updateStatus(id: string, status: TaskStatus, batchNo?: string, labelContent?: string): Promise<Task | null> {
    const updateData: Partial<Task> = { status };
    if (status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    if (batchNo) updateData.batchNo = batchNo;
    if (labelContent) updateData.labelContent = labelContent;
    
    await this.taskRepository.update(id, updateData);
    return this.findOne(id);
  }

  async update(id: string, updateData: Partial<Task>): Promise<Task | null> {
    await this.taskRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
