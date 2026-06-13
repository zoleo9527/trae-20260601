import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';
import { User } from '../../entities/user.entity';
import { TaskWorkflowService } from './task-workflow.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private workflowService: TaskWorkflowService,
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
    try {
      const task = await this.workflowService.updateTaskStatus(id, status, batchNo, labelContent);
      return this.findOne(task.id);
    } catch {
      return null;
    }
  }

  async update(id: string, updateData: Partial<Task>): Promise<Task | null> {
    const needsWorkflowSync = 
      updateData.status !== undefined || 
      updateData.batchNo !== undefined || 
      updateData.labelContent !== undefined;

    if (needsWorkflowSync) {
      try {
        await this.workflowService.updateTask(id, {
          status: updateData.status,
          batchNo: updateData.batchNo,
          labelContent: updateData.labelContent,
        });
      } catch {
        return null;
      }
    }

    const otherFields: Partial<Task> = {};
    if (updateData.assignee !== undefined) otherFields.assignee = updateData.assignee;
    if (updateData.assigneeId !== undefined) otherFields.assigneeId = updateData.assigneeId;
    if (updateData.completedAt !== undefined) otherFields.completedAt = updateData.completedAt;

    if (Object.keys(otherFields).length > 0) {
      await this.taskRepository.update(id, otherFields);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}