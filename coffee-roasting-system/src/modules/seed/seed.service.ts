import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Task, TaskType, TaskStatus } from '../../entities/task.entity';
import { Note } from '../../entities/note.entity';
import * as bcrypt from 'bcryptjs';

interface SeedOrderData {
  orderNo: string;
  customerName: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  returnReason: string | undefined;
  tasks: Array<{
    type: TaskType;
    status: TaskStatus;
    batchNo: string | null;
    labelContent: string | null;
    assignee: User | null;
  }>;
}

interface SeedNoteData {
  orderNo: string;
  taskType: TaskType;
  content: string;
  author: User | null;
  type: string;
}

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async seed() {
    await this.seedUsers();
    await this.seedOrdersAndTasks();
    return { message: '种子数据初始化完成' };
  }

  private async seedUsers() {
    const users = [
      { username: 'production', password: await bcrypt.hash('123456', 10), role: UserRole.PRODUCTION_SUPERVISOR, name: '生产主管 王经理' },
      { username: 'inspector', password: await bcrypt.hash('123456', 10), role: UserRole.QUALITY_INSPECTOR, name: '质检员 李工' },
      { username: 'warehouse', password: await bcrypt.hash('123456', 10), role: UserRole.WAREHOUSE_MANAGER, name: '仓管 张师傅' },
    ];

    for (const userData of users) {
      const existing = await this.userRepository.findOne({ where: { username: userData.username } });
      if (!existing) {
        const user = new User();
        user.username = userData.username;
        user.password = userData.password;
        user.role = userData.role;
        user.name = userData.name;
        await this.userRepository.save(user);
      }
    }
  }

  private async seedOrdersAndTasks() {
    const productionSupervisor = await this.userRepository.findOne({ where: { role: UserRole.PRODUCTION_SUPERVISOR } });
    const qualityInspector = await this.userRepository.findOne({ where: { role: UserRole.QUALITY_INSPECTOR } });
    const warehouseManager = await this.userRepository.findOne({ where: { role: UserRole.WAREHOUSE_MANAGER } });

    const ordersData: SeedOrderData[] = [
      {
        orderNo: 'PO-2026-001',
        customerName: '星巴克中国',
        productName: '埃塞俄比亚 耶加雪菲',
        quantity: 50.0,
        status: OrderStatus.COMPLETED,
        returnReason: undefined,
        tasks: [
          { type: TaskType.PACKING, status: TaskStatus.COMPLETED, batchNo: 'B20260601-001', labelContent: null, assignee: productionSupervisor },
          { type: TaskType.LABELING, status: TaskStatus.COMPLETED, batchNo: 'B20260601-001', labelContent: '耶加雪菲 | 浅度烘焙 | 250g', assignee: productionSupervisor },
          { type: TaskType.INSPECTION, status: TaskStatus.COMPLETED, batchNo: null, labelContent: null, assignee: qualityInspector },
          { type: TaskType.WAREHOUSE, status: TaskStatus.COMPLETED, batchNo: null, labelContent: null, assignee: warehouseManager },
        ],
      },
      {
        orderNo: 'PO-2026-002',
        customerName: '瑞幸咖啡',
        productName: '哥伦比亚 慧兰',
        quantity: 100.0,
        status: OrderStatus.INSPECTING,
        returnReason: undefined,
        tasks: [
          { type: TaskType.PACKING, status: TaskStatus.COMPLETED, batchNo: 'B20260602-001', labelContent: null, assignee: productionSupervisor },
          { type: TaskType.LABELING, status: TaskStatus.COMPLETED, batchNo: 'B20260602-001', labelContent: '哥伦比亚慧兰 | 中度烘焙 | 500g', assignee: productionSupervisor },
          { type: TaskType.INSPECTION, status: TaskStatus.IN_PROGRESS, batchNo: null, labelContent: null, assignee: qualityInspector },
          { type: TaskType.WAREHOUSE, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: warehouseManager },
        ],
      },
      {
        orderNo: 'PO-2026-003',
        customerName: '连咖啡',
        productName: '云南 普洱',
        quantity: 30.0,
        status: OrderStatus.LABELING,
        returnReason: undefined,
        tasks: [
          { type: TaskType.PACKING, status: TaskStatus.COMPLETED, batchNo: 'B20260603-001', labelContent: null, assignee: productionSupervisor },
          { type: TaskType.LABELING, status: TaskStatus.IN_PROGRESS, batchNo: 'B20260603-001', labelContent: null, assignee: productionSupervisor },
          { type: TaskType.INSPECTION, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: qualityInspector },
          { type: TaskType.WAREHOUSE, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: warehouseManager },
        ],
      },
      {
        orderNo: 'PO-2026-004',
        customerName: 'Manner Coffee',
        productName: '巴西 喜拉朵',
        quantity: 80.0,
        status: OrderStatus.RETURNED,
        returnReason: '客户取消订单',
        tasks: [
          { type: TaskType.PACKING, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: productionSupervisor },
        ],
      },
      {
        orderNo: 'PO-2026-005',
        customerName: 'Seesaw Coffee',
        productName: '危地马拉 安提瓜',
        quantity: 60.0,
        status: OrderStatus.PACKING,
        returnReason: undefined,
        tasks: [
          { type: TaskType.PACKING, status: TaskStatus.IN_PROGRESS, batchNo: null, labelContent: null, assignee: productionSupervisor },
          { type: TaskType.LABELING, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: productionSupervisor },
          { type: TaskType.INSPECTION, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: qualityInspector },
          { type: TaskType.WAREHOUSE, status: TaskStatus.PENDING, batchNo: null, labelContent: null, assignee: warehouseManager },
        ],
      },
    ];

    const notesData: SeedNoteData[] = [
      { orderNo: 'PO-2026-001', taskType: TaskType.PACKING, content: '订单已确认，客户要求分50袋，每袋1kg', author: productionSupervisor, type: 'system' },
      { orderNo: 'PO-2026-001', taskType: TaskType.PACKING, content: '分装完成，共50袋，每袋重量准确', author: productionSupervisor, type: 'progress' },
      { orderNo: 'PO-2026-001', taskType: TaskType.LABELING, content: '批次标签已打印并粘贴完毕', author: productionSupervisor, type: 'progress' },
      { orderNo: 'PO-2026-001', taskType: TaskType.INSPECTION, content: '质检通过，香气浓郁，酸度适中', author: qualityInspector, type: 'inspection' },
      { orderNo: 'PO-2026-001', taskType: TaskType.WAREHOUSE, content: '已入库，仓位A-12-05', author: warehouseManager, type: 'warehouse' },
      { orderNo: 'PO-2026-002', taskType: TaskType.PACKING, content: '大客户订单，加急处理', author: productionSupervisor, type: 'system' },
      { orderNo: 'PO-2026-002', taskType: TaskType.PACKING, content: '分装时发现部分咖啡豆颜色略深，已单独标记', author: productionSupervisor, type: 'warning' },
      { orderNo: 'PO-2026-002', taskType: TaskType.LABELING, content: '标签已贴好，注意检查深色豆批次', author: productionSupervisor, type: 'progress' },
      { orderNo: 'PO-2026-002', taskType: TaskType.INSPECTION, content: '正在质检中，发现2袋咖啡豆烘焙度不一致', author: qualityInspector, type: 'inspection' },
      { orderNo: 'PO-2026-003', taskType: TaskType.PACKING, content: '新客户首单，务必保证质量', author: productionSupervisor, type: 'system' },
      { orderNo: 'PO-2026-003', taskType: TaskType.PACKING, content: '分装完成，客户要求环保包装', author: productionSupervisor, type: 'progress' },
      { orderNo: 'PO-2026-004', taskType: TaskType.PACKING, content: '订单已创建，等待生产', author: productionSupervisor, type: 'system' },
      { orderNo: 'PO-2026-004', taskType: TaskType.PACKING, content: '客户来电取消订单，原因：库存调整', author: productionSupervisor, type: 'cancel' },
      { orderNo: 'PO-2026-005', taskType: TaskType.PACKING, content: '定制订单，客户要求特殊烘焙曲线', author: productionSupervisor, type: 'system' },
      { orderNo: 'PO-2026-005', taskType: TaskType.PACKING, content: '烘焙完成，正在冷却中', author: productionSupervisor, type: 'progress' },
    ];

    for (const orderData of ordersData) {
      const existing = await this.orderRepository.findOne({ where: { orderNo: orderData.orderNo } });
      if (!existing) {
        const order = new Order();
        order.orderNo = orderData.orderNo;
        order.customerName = orderData.customerName;
        order.productName = orderData.productName;
        order.quantity = orderData.quantity;
        order.status = orderData.status;
        order.returnReason = orderData.returnReason;
        const savedOrder = await this.orderRepository.save(order);

        const taskMap = new Map<TaskType, Task>();

        for (const taskData of orderData.tasks) {
          const task = new Task();
          task.type = taskData.type;
          task.status = taskData.status;
          task.batchNo = taskData.batchNo;
          task.labelContent = taskData.labelContent;
          task.order = savedOrder;
          task.orderId = savedOrder.id;
          task.assignee = taskData.assignee || null;
          task.assigneeId = taskData.assignee?.id || null;
          task.completedAt = taskData.status === TaskStatus.COMPLETED ? new Date() : null;
          const savedTask = await this.taskRepository.save(task);
          taskMap.set(taskData.type, savedTask);
        }

        for (const noteData of notesData) {
          if (noteData.orderNo === orderData.orderNo) {
            const task = taskMap.get(noteData.taskType);
            if (task && noteData.author) {
              const note = new Note();
              note.content = noteData.content;
              note.task = task;
              note.taskId = task.id;
              note.author = noteData.author;
              note.authorId = noteData.author.id;
              note.type = noteData.type;
              await this.noteRepository.save(note);
            }
          }
        }
      }
    }
  }
}
