import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Order } from '../../entities/order.entity';
import { UserRole } from '../../entities/user.entity';

interface TodoItem {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  productName: string;
  quantity: number;
  taskType: TaskType;
  taskStatus: TaskStatus;
  batchNo: string | null;
  labelContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TodoAggregation {
  pending: TodoItem[];
  inProgress: TodoItem[];
  completed: TodoItem[];
}

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getTodosByRole(role: UserRole): Promise<TodoAggregation> {
    const taskTypes = this.getTaskTypesByRole(role);
    
    const tasks = await this.taskRepository.find({
      where: { type: taskTypes, status: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED] },
      relations: { order: true },
      order: { createdAt: 'DESC' },
    });

    const result: TodoAggregation = {
      pending: [],
      inProgress: [],
      completed: [],
    };

    for (const task of tasks) {
      const todoItem: TodoItem = {
        id: task.id,
        orderId: task.orderId,
        orderNo: task.order.orderNo,
        customerName: task.order.customerName,
        productName: task.order.productName,
        quantity: task.order.quantity,
        taskType: task.type,
        taskStatus: task.status,
        batchNo: task.batchNo,
        labelContent: task.labelContent,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };

      switch (task.status) {
        case TaskStatus.PENDING:
          result.pending.push(todoItem);
          break;
        case TaskStatus.IN_PROGRESS:
          result.inProgress.push(todoItem);
          break;
        case TaskStatus.COMPLETED:
          result.completed.push(todoItem);
          break;
      }
    }

    return result;
  }

  async getPendingTodosByRole(role: UserRole): Promise<TodoItem[]> {
    const taskTypes = this.getTaskTypesByRole(role);
    
    const tasks = await this.taskRepository.find({
      where: { type: taskTypes, status: TaskStatus.PENDING },
      relations: { order: true },
      order: { createdAt: 'ASC' },
    });

    return tasks.map(task => ({
      id: task.id,
      orderId: task.orderId,
      orderNo: task.order.orderNo,
      customerName: task.order.customerName,
      productName: task.order.productName,
      quantity: task.order.quantity,
      taskType: task.type,
      taskStatus: task.status,
      batchNo: task.batchNo,
      labelContent: task.labelContent,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }

  private getTaskTypesByRole(role: UserRole): TaskType[] {
    switch (role) {
      case UserRole.PRODUCTION_SUPERVISOR:
        return [TaskType.PACKING, TaskType.LABELING];
      case UserRole.QUALITY_INSPECTOR:
        return [TaskType.INSPECTION];
      case UserRole.WAREHOUSE_MANAGER:
        return [TaskType.WAREHOUSE];
      default:
        return [];
    }
  }
}
