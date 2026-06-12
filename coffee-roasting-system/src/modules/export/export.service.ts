import { Injectable } from '@nestjs/common';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { OrderService } from '../order/order.service';
import { TaskService } from '../task/task.service';

@Injectable()
export class ExportService {
  constructor(
    private orderService: OrderService,
    private taskService: TaskService,
  ) {}

  async exportOrders(): Promise<string> {
    const orders = await this.orderService.findAll();
    const csvPath = path.join(process.cwd(), 'exports', `orders_${Date.now()}.csv`);
    
    if (!fs.existsSync(path.dirname(csvPath))) {
      fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    }

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'orderNo', title: '订单编号' },
        { id: 'customerName', title: '客户名称' },
        { id: 'productName', title: '产品名称' },
        { id: 'quantity', title: '数量' },
        { id: 'status', title: '状态' },
        { id: 'returnReason', title: '退回原因' },
        { id: 'createdAt', title: '创建时间' },
      ],
    });

    const records = orders.map(order => ({
      orderNo: order.orderNo,
      customerName: order.customerName,
      productName: order.productName,
      quantity: order.quantity,
      status: this.getStatusLabel(order.status),
      returnReason: order.returnReason || '',
      createdAt: order.createdAt.toISOString(),
    }));

    await csvWriter.writeRecords(records);
    return csvPath;
  }

  async exportTasks(): Promise<string> {
    const tasks = await this.taskService.findAll();
    const csvPath = path.join(process.cwd(), 'exports', `tasks_${Date.now()}.csv`);
    
    if (!fs.existsSync(path.dirname(csvPath))) {
      fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    }

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'type', title: '任务类型' },
        { id: 'status', title: '状态' },
        { id: 'batchNo', title: '批次号' },
        { id: 'labelContent', title: '标签内容' },
        { id: 'orderNo', title: '关联订单' },
        { id: 'assignee', title: '负责人' },
        { id: 'completedAt', title: '完成时间' },
        { id: 'createdAt', title: '创建时间' },
      ],
    });

    const records = tasks.map(task => ({
      type: this.getTaskTypeLabel(task.type),
      status: this.getTaskStatusLabel(task.status),
      batchNo: task.batchNo || '',
      labelContent: task.labelContent || '',
      orderNo: task.order?.orderNo || '',
      assignee: task.assignee?.name || '',
      completedAt: task.completedAt?.toISOString() || '',
      createdAt: task.createdAt.toISOString(),
    }));

    await csvWriter.writeRecords(records);
    return csvPath;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待处理',
      packing: '分装中',
      labeling: '贴标中',
      inspecting: '质检中',
      completed: '已完成',
      returned: '已退回',
    };
    return labels[status] || status;
  }

  private getTaskTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      packing: '订单分装',
      labeling: '批次贴标',
      inspection: '质量检查',
      warehouse: '仓储处理',
    };
    return labels[type] || type;
  }

  private getTaskStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
    };
    return labels[status] || status;
  }
}
