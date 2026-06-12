import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';
import { Note } from '../../entities/note.entity';

interface LabelingHistoryItem {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  productName: string;
  batchNo: string | null;
  labelContent: string | null;
  status: TaskStatus;
  assigneeName: string | null;
  completedAt: Date | null;
  createdAt: Date;
  notes: Array<{
    id: string;
    content: string;
    authorName: string;
    type: string;
    createdAt: Date;
  }>;
}

@Injectable()
export class LabelingHistoryService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async getLabelingHistory(
    batchNo?: string,
    productName?: string,
    customerName?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: LabelingHistoryItem[]; total: number }> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.order', 'order')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.type = :type', { type: TaskType.LABELING });

    if (batchNo) {
      queryBuilder.andWhere('task.batchNo LIKE :batchNo', { batchNo: `%${batchNo}%` });
    }

    if (productName) {
      queryBuilder.andWhere('order.productName LIKE :productName', { productName: `%${productName}%` });
    }

    if (customerName) {
      queryBuilder.andWhere('order.customerName LIKE :customerName', { customerName: `%${customerName}%` });
    }

    queryBuilder.orderBy('task.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    const taskIds = tasks.map(t => t.id);
    const notes = await this.noteRepository.find({
      where: { taskId: taskIds },
      relations: { author: true },
    });

    const result: LabelingHistoryItem[] = tasks.map(task => {
      const taskNotes = notes.filter(n => n.taskId === task.id);
      return {
        id: task.id,
        orderId: task.orderId,
        orderNo: task.order?.orderNo || '',
        customerName: task.order?.customerName || '',
        productName: task.order?.productName || '',
        batchNo: task.batchNo,
        labelContent: task.labelContent,
        status: task.status,
        assigneeName: task.assignee?.name || null,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        notes: taskNotes.map(n => ({
          id: n.id,
          content: n.content,
          authorName: n.author?.name || '未知',
          type: n.type || 'general',
          createdAt: n.createdAt,
        })),
      };
    });

    return { data: result, total };
  }

  async getLabelingByBatchNo(batchNo: string): Promise<LabelingHistoryItem[] | null> {
    const tasks = await this.taskRepository.find({
      where: { type: TaskType.LABELING, batchNo },
      relations: { order: true, assignee: true },
    });

    if (tasks.length === 0) return null;

    const taskIds = tasks.map(t => t.id);
    const notes = await this.noteRepository.find({
      where: { taskId: taskIds },
      relations: { author: true },
    });

    return tasks.map(task => {
      const taskNotes = notes.filter(n => n.taskId === task.id);
      return {
        id: task.id,
        orderId: task.orderId,
        orderNo: task.order?.orderNo || '',
        customerName: task.order?.customerName || '',
        productName: task.order?.productName || '',
        batchNo: task.batchNo,
        labelContent: task.labelContent,
        status: task.status,
        assigneeName: task.assignee?.name || null,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        notes: taskNotes.map(n => ({
          id: n.id,
          content: n.content,
          authorName: n.author?.name || '未知',
          type: n.type || 'general',
          createdAt: n.createdAt,
        })),
      };
    });
  }

  async getCompletedLabelingTasks(): Promise<LabelingHistoryItem[]> {
    const tasks = await this.taskRepository.find({
      where: { type: TaskType.LABELING, status: TaskStatus.COMPLETED },
      relations: { order: true, assignee: true },
      order: { completedAt: 'DESC' },
    });

    const taskIds = tasks.map(t => t.id);
    const notes = await this.noteRepository.find({
      where: { taskId: taskIds },
      relations: { author: true },
    });

    return tasks.map(task => {
      const taskNotes = notes.filter(n => n.taskId === task.id);
      return {
        id: task.id,
        orderId: task.orderId,
        orderNo: task.order?.orderNo || '',
        customerName: task.order?.customerName || '',
        productName: task.order?.productName || '',
        batchNo: task.batchNo,
        labelContent: task.labelContent,
        status: task.status,
        assigneeName: task.assignee?.name || null,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        notes: taskNotes.map(n => ({
          id: n.id,
          content: n.content,
          authorName: n.author?.name || '未知',
          type: n.type || 'general',
          createdAt: n.createdAt,
        })),
      };
    });
  }
}
