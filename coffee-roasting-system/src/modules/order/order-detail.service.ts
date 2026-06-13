import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Note } from '../../entities/note.entity';
import { User } from '../../entities/user.entity';

interface TimelineItem {
  id: string;
  type: 'task' | 'note';
  taskType?: TaskType;
  taskStatus?: TaskStatus;
  noteType?: string;
  content?: string;
  authorName?: string;
  createdAt: Date;
}

interface PackingInfo {
  taskId: string;
  status: TaskStatus;
  batchNo: string | null;
  completedAt: Date | null;
  notes: Array<{ id: string; content: string; authorName: string; createdAt: Date }>;
}

interface LabelingInfo {
  taskId: string;
  status: TaskStatus;
  batchNo: string | null;
  labelContent: string | null;
  completedAt: Date | null;
  notes: Array<{ id: string; content: string; authorName: string; createdAt: Date }>;
}

export interface OrderDetail {
  id: string;
  orderNo: string;
  customerName: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  returnReason: string | undefined;
  packing: PackingInfo | null;
  labeling: LabelingInfo | null;
  inspection: {
    taskId: string;
    status: TaskStatus;
    completedAt: Date | null;
    notes: Array<{ id: string; content: string; authorName: string; createdAt: Date }>;
  } | null;
  warehouse: {
    taskId: string;
    status: TaskStatus;
    completedAt: Date | null;
    notes: Array<{ id: string; content: string; authorName: string; createdAt: Date }>;
  } | null;
  timeline: TimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateNoteInput {
  taskType: TaskType;
  content: string;
  authorId: string;
  type?: string;
}

@Injectable()
export class OrderDetailService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOrderDetail(orderId: string): Promise<OrderDetail | null> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) return null;

    const tasks = await this.taskRepository.find({
      where: { orderId },
      relations: { notes: { author: true } },
      order: { createdAt: 'ASC' },
    });

    const allNotes = await this.noteRepository.find({
      where: { taskId: In(tasks.map(t => t.id)) },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });

    const timeline: TimelineItem[] = [];

    const packingTask = tasks.find(t => t.type === TaskType.PACKING);
    const labelingTask = tasks.find(t => t.type === TaskType.LABELING);
    const inspectionTask = tasks.find(t => t.type === TaskType.INSPECTION);
    const warehouseTask = tasks.find(t => t.type === TaskType.WAREHOUSE);

    const createTaskInfo = (task: Task | undefined) => {
      if (!task) return null;
      const taskNotes = allNotes.filter(n => n.taskId === task.id);
      return {
        taskId: task.id,
        status: task.status,
        batchNo: task.batchNo,
        labelContent: task.labelContent,
        completedAt: task.completedAt,
        notes: taskNotes.map(n => ({
          id: n.id,
          content: n.content,
          authorName: n.author?.name || '未知',
          createdAt: n.createdAt,
        })),
      };
    };

    if (packingTask) {
      timeline.push({
        id: packingTask.id,
        type: 'task',
        taskType: TaskType.PACKING,
        taskStatus: packingTask.status,
        createdAt: packingTask.createdAt,
      });
      const packingNotes = allNotes.filter(n => n.taskId === packingTask.id);
      packingNotes.forEach(note => {
        timeline.push({
          id: note.id,
          type: 'note',
          noteType: note.type,
          content: note.content,
          authorName: note.author?.name || '未知',
          createdAt: note.createdAt,
        });
      });
      if (packingTask.completedAt) {
        timeline.push({
          id: `${packingTask.id}-completed`,
          type: 'task',
          taskType: TaskType.PACKING,
          taskStatus: TaskStatus.COMPLETED,
          createdAt: packingTask.completedAt,
        });
      }
    }

    if (labelingTask) {
      timeline.push({
        id: labelingTask.id,
        type: 'task',
        taskType: TaskType.LABELING,
        taskStatus: labelingTask.status,
        createdAt: labelingTask.createdAt,
      });
      const labelingNotes = allNotes.filter(n => n.taskId === labelingTask.id);
      labelingNotes.forEach(note => {
        timeline.push({
          id: note.id,
          type: 'note',
          noteType: note.type,
          content: note.content,
          authorName: note.author?.name || '未知',
          createdAt: note.createdAt,
        });
      });
      if (labelingTask.completedAt) {
        timeline.push({
          id: `${labelingTask.id}-completed`,
          type: 'task',
          taskType: TaskType.LABELING,
          taskStatus: TaskStatus.COMPLETED,
          createdAt: labelingTask.completedAt,
        });
      }
    }

    if (inspectionTask) {
      timeline.push({
        id: inspectionTask.id,
        type: 'task',
        taskType: TaskType.INSPECTION,
        taskStatus: inspectionTask.status,
        createdAt: inspectionTask.createdAt,
      });
      const inspectionNotes = allNotes.filter(n => n.taskId === inspectionTask.id);
      inspectionNotes.forEach(note => {
        timeline.push({
          id: note.id,
          type: 'note',
          noteType: note.type,
          content: note.content,
          authorName: note.author?.name || '未知',
          createdAt: note.createdAt,
        });
      });
      if (inspectionTask.completedAt) {
        timeline.push({
          id: `${inspectionTask.id}-completed`,
          type: 'task',
          taskType: TaskType.INSPECTION,
          taskStatus: TaskStatus.COMPLETED,
          createdAt: inspectionTask.completedAt,
        });
      }
    }

    if (warehouseTask) {
      timeline.push({
        id: warehouseTask.id,
        type: 'task',
        taskType: TaskType.WAREHOUSE,
        taskStatus: warehouseTask.status,
        createdAt: warehouseTask.createdAt,
      });
      const warehouseNotes = allNotes.filter(n => n.taskId === warehouseTask.id);
      warehouseNotes.forEach(note => {
        timeline.push({
          id: note.id,
          type: 'note',
          noteType: note.type,
          content: note.content,
          authorName: note.author?.name || '未知',
          createdAt: note.createdAt,
        });
      });
      if (warehouseTask.completedAt) {
        timeline.push({
          id: `${warehouseTask.id}-completed`,
          type: 'task',
          taskType: TaskType.WAREHOUSE,
          taskStatus: TaskStatus.COMPLETED,
          createdAt: warehouseTask.completedAt,
        });
      }
    }

    timeline.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const packingInfo = createTaskInfo(packingTask);
    const labelingInfo = createTaskInfo(labelingTask);
    const inspectionInfo = createTaskInfo(inspectionTask);
    const warehouseInfo = createTaskInfo(warehouseTask);

    return {
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      productName: order.productName,
      quantity: order.quantity,
      status: order.status,
      returnReason: order.returnReason,
      packing: packingInfo ? ({
        taskId: packingInfo.taskId,
        status: packingInfo.status,
        batchNo: packingInfo.batchNo,
        completedAt: packingInfo.completedAt,
        notes: packingInfo.notes,
      }) : null,
      labeling: labelingInfo ? ({
        taskId: labelingInfo.taskId,
        status: labelingInfo.status,
        batchNo: labelingInfo.batchNo,
        labelContent: labelingInfo.labelContent || null,
        completedAt: labelingInfo.completedAt,
        notes: labelingInfo.notes,
      }) : null,
      inspection: inspectionInfo ? ({
        taskId: inspectionInfo.taskId,
        status: inspectionInfo.status,
        completedAt: inspectionInfo.completedAt,
        notes: inspectionInfo.notes,
      }) : null,
      warehouse: warehouseInfo ? ({
        taskId: warehouseInfo.taskId,
        status: warehouseInfo.status,
        completedAt: warehouseInfo.completedAt,
        notes: warehouseInfo.notes,
      }) : null,
      timeline,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async updateOrderDetail(orderId: string, updates: Partial<{
    returnReason?: string;
    packingBatchNo?: string;
    labelingBatchNo?: string;
    labelingContent?: string;
    notes?: UpdateNoteInput[];
  }>): Promise<OrderDetail | null> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) return null;

    if (updates.returnReason !== undefined) {
      order.returnReason = updates.returnReason;
      await this.orderRepository.save(order);
    }

    if (updates.packingBatchNo !== undefined) {
      const packingTask = await this.taskRepository.findOne({ where: { orderId, type: TaskType.PACKING } });
      if (packingTask) {
        packingTask.batchNo = updates.packingBatchNo;
        await this.taskRepository.save(packingTask);
      }
    }

    if (updates.labelingBatchNo !== undefined || updates.labelingContent !== undefined) {
      const labelingTask = await this.taskRepository.findOne({ where: { orderId, type: TaskType.LABELING } });
      if (labelingTask) {
        if (updates.labelingBatchNo !== undefined) {
          labelingTask.batchNo = updates.labelingBatchNo;
        }
        if (updates.labelingContent !== undefined) {
          labelingTask.labelContent = updates.labelingContent;
        }
        await this.taskRepository.save(labelingTask);
      }
    }

    if (updates.notes && updates.notes.length > 0) {
      for (const noteInput of updates.notes) {
        const task = await this.taskRepository.findOne({ where: { orderId, type: noteInput.taskType } });
        const author = await this.userRepository.findOne({ where: { id: noteInput.authorId } });
        if (task && author) {
          const note = this.noteRepository.create({
            content: noteInput.content,
            task,
            taskId: task.id,
            author,
            authorId: author.id,
            type: noteInput.type || 'general',
          });
          await this.noteRepository.save(note);
        }
      }
    }

    return this.getOrderDetail(orderId);
  }
}