import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Order, OrderStatus } from '../../entities/order.entity';

@Injectable()
export class TaskWorkflowService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async updateTaskStatus(taskId: string, status: TaskStatus, batchNo?: string, labelContent?: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: { order: true } });
    if (!task) {
      throw new Error('任务不存在');
    }

    task.status = status;
    if (status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }
    if (batchNo) {
      task.batchNo = batchNo;
    }
    if (labelContent) {
      task.labelContent = labelContent;
    }

    const updatedTask = await this.taskRepository.save(task);
    await this.syncOrderStatus(task.orderId);

    return updatedTask;
  }

  async syncOrderStatus(orderId: string): Promise<void> {
    const tasks = await this.taskRepository.find({ where: { orderId } });
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) return;

    const packingCompleted = tasks.some(t => t.type === TaskType.PACKING && t.status === TaskStatus.COMPLETED);
    const labelingCompleted = tasks.some(t => t.type === TaskType.LABELING && t.status === TaskStatus.COMPLETED);
    const inspectionCompleted = tasks.some(t => t.type === TaskType.INSPECTION && t.status === TaskStatus.COMPLETED);
    const warehouseCompleted = tasks.some(t => t.type === TaskType.WAREHOUSE && t.status === TaskStatus.COMPLETED);

    const packingInProgress = tasks.some(t => t.type === TaskType.PACKING && t.status === TaskStatus.IN_PROGRESS);
    const labelingInProgress = tasks.some(t => t.type === TaskType.LABELING && t.status === TaskStatus.IN_PROGRESS);
    const inspectionInProgress = tasks.some(t => t.type === TaskType.INSPECTION && t.status === TaskStatus.IN_PROGRESS);
    const warehouseInProgress = tasks.some(t => t.type === TaskType.WAREHOUSE && t.status === TaskStatus.IN_PROGRESS);

    let newStatus = order.status;

    if (warehouseCompleted) {
      newStatus = OrderStatus.COMPLETED;
    } else if (inspectionCompleted) {
      if (warehouseInProgress) {
        newStatus = OrderStatus.COMPLETED;
      } else {
        newStatus = OrderStatus.INSPECTING;
      }
    } else if (labelingCompleted) {
      if (inspectionInProgress) {
        newStatus = OrderStatus.INSPECTING;
      } else {
        newStatus = OrderStatus.LABELING;
      }
    } else if (packingCompleted) {
      if (labelingInProgress) {
        newStatus = OrderStatus.LABELING;
      } else {
        newStatus = OrderStatus.PACKING;
      }
    } else if (packingInProgress) {
      newStatus = OrderStatus.PACKING;
    } else if (labelingInProgress) {
      newStatus = OrderStatus.LABELING;
    } else if (inspectionInProgress) {
      newStatus = OrderStatus.INSPECTING;
    }

    if (newStatus !== order.status) {
      order.status = newStatus;
      await this.orderRepository.save(order);
    }
  }

  async completePacking(taskId: string, batchNo: string): Promise<Task> {
    return this.updateTaskStatus(taskId, TaskStatus.COMPLETED, batchNo);
  }

  async completeLabeling(taskId: string, batchNo: string, labelContent: string): Promise<Task> {
    return this.updateTaskStatus(taskId, TaskStatus.COMPLETED, batchNo, labelContent);
  }

  async completeInspection(taskId: string): Promise<Task> {
    return this.updateTaskStatus(taskId, TaskStatus.COMPLETED);
  }

  async completeWarehouse(taskId: string): Promise<Task> {
    return this.updateTaskStatus(taskId, TaskStatus.COMPLETED);
  }

  async startTask(taskId: string): Promise<Task> {
    return this.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
  }
}
