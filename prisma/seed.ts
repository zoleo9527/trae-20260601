import { PrismaClient } from '@prisma/client';
import { statusTransitionConfigs } from '../app/db/config';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  await prisma.statusTransitionConfig.deleteMany();
  await prisma.operationRecord.deleteMany();
  await prisma.documentReminder.deleteMany();
  await prisma.costBudget.deleteMany();
  await prisma.financeRecord.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.taskCostHistory.deleteMany();
  await prisma.preparationTask.deleteMany();
  await prisma.accidentAnnotation.deleteMany();
  await prisma.inspectionItem.deleteMany();
  await prisma.inspectionReport.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  console.log('创建用户...');
  const users = await Promise.all([
    prisma.user.create({
      data: { id: 'u1', name: '张伟', role: 'manager', phone: '13800138001', createdAt: new Date('2024-01-01') }
    }),
    prisma.user.create({
      data: { id: 'u2', name: '李明', role: 'assessor', phone: '13800138002', createdAt: new Date('2024-01-01') }
    }),
    prisma.user.create({
      data: { id: 'u3', name: '王芳', role: 'finance', phone: '13800138003', createdAt: new Date('2024-01-01') }
    }),
    prisma.user.create({
      data: { id: 'u4', name: '刘洋', role: 'manager', phone: '13800138004', createdAt: new Date('2024-01-01') }
    }),
    prisma.user.create({
      data: { id: 'u5', name: '陈静', role: 'assessor', phone: '13800138005', createdAt: new Date('2024-01-01') }
    }),
  ]);

  console.log('创建车辆...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        id: 'v1',
        licensePlate: '京A12345',
        brand: '奔驰',
        model: 'C200L',
        year: 2020,
        mileage: 45000,
        color: '黑色',
        purchasePrice: 280000,
        estimatedValue: 320000,
        status: 'preparing',
        managerId: 'u1',
        assessorId: 'u2',
        financeId: 'u3',
        currentAssigneeId: 'u2',
        currentAssigneeRole: 'assessor',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        statusHistory: {
          create: [
            {
              status: 'pending',
              changedBy: 'u1',
              changedByName: '张伟',
              changedAt: new Date('2024-01-15T09:30:00'),
              note: '车辆入库'
            },
            {
              status: 'inspected',
              changedBy: 'u2',
              changedByName: '李明',
              changedAt: new Date('2024-01-19T14:20:00'),
              note: '检测完成'
            },
            {
              status: 'preparing',
              changedBy: 'u1',
              changedByName: '张伟',
              changedAt: new Date('2024-01-20T10:00:00'),
              note: '确认整备预算'
            }
          ]
        }
      }
    }),
    prisma.vehicle.create({
      data: {
        id: 'v2',
        licensePlate: '京B67890',
        brand: '宝马',
        model: '320Li',
        year: 2019,
        mileage: 68000,
        color: '白色',
        purchasePrice: 220000,
        estimatedValue: 260000,
        status: 'inspected',
        managerId: 'u4',
        assessorId: 'u5',
        financeId: null,
        currentAssigneeId: 'u4',
        currentAssigneeRole: 'manager',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-21'),
        statusHistory: {
          create: [
            {
              status: 'pending',
              changedBy: 'u4',
              changedByName: '刘洋',
              changedAt: new Date('2024-01-18T11:00:00'),
              note: '车辆入库'
            },
            {
              status: 'inspected',
              changedBy: 'u5',
              changedByName: '陈静',
              changedAt: new Date('2024-01-21T15:45:00'),
              note: '检测完成，发现右后翼子板有修复痕迹'
            }
          ]
        }
      }
    }),
    prisma.vehicle.create({
      data: {
        id: 'v3',
        licensePlate: '京C11111',
        brand: '奥迪',
        model: 'A4L',
        year: 2021,
        mileage: 32000,
        color: '银色',
        purchasePrice: 350000,
        estimatedValue: 380000,
        status: 'completed',
        managerId: 'u1',
        assessorId: 'u2',
        financeId: 'u3',
        currentAssigneeId: 'u1',
        currentAssigneeRole: 'manager',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        statusHistory: {
          create: [
            {
              status: 'pending',
              changedBy: 'u1',
              changedByName: '张伟',
              changedAt: new Date('2024-01-10T08:30:00'),
              note: '车辆入库'
            },
            {
              status: 'inspected',
              changedBy: 'u2',
              changedByName: '李明',
              changedAt: new Date('2024-01-12T10:20:00'),
              note: '检测完成'
            },
            {
              status: 'completed',
              changedBy: 'u1',
              changedByName: '张伟',
              changedAt: new Date('2024-01-25T17:00:00'),
              note: '所有整备任务完成'
            }
          ]
        }
      }
    }),
    prisma.vehicle.create({
      data: {
        id: 'v4',
        licensePlate: '京D22222',
        brand: '特斯拉',
        model: 'Model 3',
        year: 2022,
        mileage: 18000,
        color: '蓝色',
        purchasePrice: 260000,
        estimatedValue: 290000,
        status: 'pending',
        managerId: 'u4',
        assessorId: null,
        financeId: null,
        currentAssigneeId: 'u4',
        currentAssigneeRole: 'manager',
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-22'),
        statusHistory: {
          create: [
            {
              status: 'pending',
              changedBy: 'u4',
              changedByName: '刘洋',
              changedAt: new Date('2024-01-22T10:00:00'),
              note: '车辆入库，等待检测'
            }
          ]
        }
      }
    }),
    prisma.vehicle.create({
      data: {
        id: 'v5',
        licensePlate: '京E33333',
        brand: '丰田',
        model: '凯美瑞',
        year: 2020,
        mileage: 52000,
        color: '黑色',
        purchasePrice: 160000,
        estimatedValue: 190000,
        status: 'preparing',
        managerId: 'u1',
        assessorId: 'u2',
        financeId: null,
        currentAssigneeId: 'u2',
        currentAssigneeRole: 'assessor',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-19'),
        statusHistory: {
          create: [
            {
              status: 'pending',
              changedBy: 'u1',
              changedByName: '张伟',
              changedAt: new Date('2024-01-16T09:00:00'),
              note: '车辆入库'
            },
            {
              status: 'inspected',
              changedBy: 'u2',
              changedByName: '李明',
              changedAt: new Date('2024-01-18T11:30:00'),
              note: '检测完成'
            },
            {
              status: 'preparing',
              changedBy: 'u1',
              changedByName: '张伟',
              changedAt: new Date('2024-01-19T14:00:00'),
              note: '确认整备预算'
            }
          ]
        }
      }
    }),
  ]);

  console.log('创建检测报告...');
  await prisma.inspectionReport.create({
    data: {
      id: 'ir1',
      vehicleId: 'v1',
      inspectorId: 'u2',
      overallScore: 90.4,
      conclusion: '车辆整体状况良好，发动机存在轻微渗油问题需处理',
      recommendations: '1. 更换发动机气门室盖密封垫\n2. 对左侧车门划痕进行抛光处理\n3. 建议更换机油和机滤',
      hasAccidentRecords: false,
      accidentCount: 0,
      criticalIssues: ['发动机气门室盖渗油'],
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
      items: {
        create: [
          { id: 'ii1', category: '外观', name: '车身划痕', description: '检查车身漆面状况', status: 'pass', score: 95, note: '左侧车门轻微划痕，已抛光处理', inspectorId: 'u2', inspectedAt: new Date('2024-01-19'), isAccident: false },
          { id: 'ii2', category: '内饰', name: '座椅磨损', description: '检查座椅使用状况', status: 'pass', score: 90, note: '主驾座椅轻微磨损', inspectorId: 'u2', inspectedAt: new Date('2024-01-19'), isAccident: false },
          { id: 'ii3', category: '机械', name: '发动机状态', description: '检查发动机运行状况', status: 'fail', score: 75, note: '气门室盖轻微渗油，建议更换密封垫', inspectorId: 'u2', inspectedAt: new Date('2024-01-19'), isAccident: false },
          { id: 'ii4', category: '电气', name: '电子设备', description: '检查车载电子设备', status: 'pass', score: 100, note: '所有电子设备功能正常', inspectorId: 'u2', inspectedAt: new Date('2024-01-19'), isAccident: false },
          { id: 'ii5', category: '底盘', name: '悬挂系统', description: '检查悬挂和底盘状况', status: 'pass', score: 92, note: '减震器状态良好', inspectorId: 'u2', inspectedAt: new Date('2024-01-19'), isAccident: false },
        ]
      }
    }
  });

  await prisma.inspectionReport.create({
    data: {
      id: 'ir2',
      vehicleId: 'v2',
      inspectorId: 'u5',
      overallScore: 87.2,
      conclusion: '车辆整体状况较好，但右后翼子板有事故修复记录',
      recommendations: '1. 如实向客户说明翼子板修复情况\n2. 建议做一次全面清洗',
      hasAccidentRecords: true,
      accidentCount: 1,
      criticalIssues: ['右后翼子板事故修复'],
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
      items: {
        create: [
          { id: 'ii6', category: '外观', name: '车身划痕', description: '检查车身漆面状况', status: 'fail', score: 70, note: '右后翼子板有钣金修复痕迹', inspectorId: 'u5', inspectedAt: new Date('2024-01-21'), isAccident: true },
          { id: 'ii7', category: '内饰', name: '座椅磨损', description: '检查座椅使用状况', status: 'pass', score: 85, note: '内饰保养良好', inspectorId: 'u5', inspectedAt: new Date('2024-01-21'), isAccident: false },
          { id: 'ii8', category: '机械', name: '发动机状态', description: '检查发动机运行状况', status: 'pass', score: 95, note: '发动机运行平稳', inspectorId: 'u5', inspectedAt: new Date('2024-01-21'), isAccident: false },
          { id: 'ii9', category: '电气', name: '电子设备', description: '检查车载电子设备', status: 'pass', score: 98, note: '电子设备功能正常', inspectorId: 'u5', inspectedAt: new Date('2024-01-21'), isAccident: false },
          { id: 'ii10', category: '底盘', name: '悬挂系统', description: '检查悬挂和底盘状况', status: 'pass', score: 88, note: '悬挂系统正常', inspectorId: 'u5', inspectedAt: new Date('2024-01-21'), isAccident: false },
        ]
      }
    }
  });

  await prisma.accidentAnnotation.create({
    data: {
      id: 'aa1',
      reportId: 'ir2',
      itemId: 'ii6',
      severity: 'moderate',
      description: '右后翼子板有钣金修复痕迹',
      location: '右后翼子板',
      annotatedBy: 'u5',
      annotatedAt: new Date('2024-01-21'),
      verifiedBy: 'u1',
      verifiedAt: new Date('2024-01-21'),
      note: '已确认是轻微事故修复，不影响安全'
    }
  });

  await prisma.inspectionReport.create({
    data: {
      id: 'ir3',
      vehicleId: 'v3',
      inspectorId: 'u2',
      overallScore: 97.8,
      conclusion: '车辆状况优秀，近乎准新车状态',
      recommendations: '1. 保持现有状态，无需特别整备\n2. 建议尽快上架销售',
      hasAccidentRecords: false,
      accidentCount: 0,
      criticalIssues: [],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
      items: {
        create: [
          { id: 'ii11', category: '外观', name: '车身划痕', description: '检查车身漆面状况', status: 'pass', score: 98, note: '车身漆面完好', inspectorId: 'u2', inspectedAt: new Date('2024-01-12'), isAccident: false },
          { id: 'ii12', category: '内饰', name: '座椅磨损', description: '检查座椅使用状况', status: 'pass', score: 95, note: '内饰近乎全新', inspectorId: 'u2', inspectedAt: new Date('2024-01-12'), isAccident: false },
          { id: 'ii13', category: '机械', name: '发动机状态', description: '检查发动机运行状况', status: 'pass', score: 99, note: '发动机状态极佳', inspectorId: 'u2', inspectedAt: new Date('2024-01-12'), isAccident: false },
          { id: 'ii14', category: '电气', name: '电子设备', description: '检查车载电子设备', status: 'pass', score: 100, note: '所有电子设备功能正常', inspectorId: 'u2', inspectedAt: new Date('2024-01-12'), isAccident: false },
          { id: 'ii15', category: '底盘', name: '悬挂系统', description: '检查悬挂和底盘状况', status: 'pass', score: 97, note: '底盘状况良好', inspectorId: 'u2', inspectedAt: new Date('2024-01-12'), isAccident: false },
        ]
      }
    }
  });

  console.log('创建整备任务...');
  await Promise.all([
    prisma.preparationTask.create({
      data: {
        id: 'pt1',
        vehicleId: 'v1',
        title: '更换发动机气门室盖密封垫',
        description: '发动机气门室盖轻微渗油，需要更换密封垫',
        cost: 580,
        estimatedCost: 600,
        estimatedHours: 2,
        actualHours: 0,
        status: 'in_progress',
        assigneeId: 'u2',
        assigneeName: '李明',
        dueDate: new Date('2024-01-23'),
        completedAt: null,
        note: '配件已到货，计划明天上午施工',
        createdBy: 'u2',
        createdByName: '李明',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22'),
        costHistory: {
          create: [
            { cost: 580, changedBy: 'u2', changedByName: '李明', changedAt: new Date('2024-01-20'), reason: '预估成本' }
          ]
        }
      }
    }),
    prisma.preparationTask.create({
      data: {
        id: 'pt2',
        vehicleId: 'v1',
        title: '车身抛光处理',
        description: '左侧车门轻微划痕抛光',
        cost: 200,
        estimatedCost: 200,
        estimatedHours: 1,
        actualHours: 1.2,
        status: 'completed',
        assigneeId: 'u2',
        assigneeName: '李明',
        dueDate: new Date('2024-01-21'),
        completedAt: new Date('2024-01-21'),
        note: '已完成抛光，效果良好',
        createdBy: 'u2',
        createdByName: '李明',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-21'),
        costHistory: {
          create: [
            { cost: 200, changedBy: 'u2', changedByName: '李明', changedAt: new Date('2024-01-20'), reason: '预估成本' },
            { cost: 200, changedBy: 'u2', changedByName: '李明', changedAt: new Date('2024-01-21'), reason: '实际成本' }
          ]
        }
      }
    }),
    prisma.preparationTask.create({
      data: {
        id: 'pt3',
        vehicleId: 'v1',
        title: '更换机油机滤',
        description: '常规保养，更换机油和机滤',
        cost: 680,
        estimatedCost: 700,
        estimatedHours: 1.5,
        actualHours: 0,
        status: 'pending',
        assigneeId: 'u2',
        assigneeName: '李明',
        dueDate: new Date('2024-01-25'),
        completedAt: null,
        note: '',
        createdBy: 'u2',
        createdByName: '李明',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        costHistory: {
          create: [
            { cost: 680, changedBy: 'u2', changedByName: '李明', changedAt: new Date('2024-01-20'), reason: '预估成本' }
          ]
        }
      }
    }),
    prisma.preparationTask.create({
      data: {
        id: 'pt4',
        vehicleId: 'v2',
        title: '全面清洗',
        description: '车身内外全面清洗打蜡',
        cost: 350,
        estimatedCost: 350,
        estimatedHours: 2,
        actualHours: 0,
        status: 'pending',
        assigneeId: 'u5',
        assigneeName: '陈静',
        dueDate: new Date('2024-01-24'),
        completedAt: null,
        note: '',
        createdBy: 'u5',
        createdByName: '陈静',
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-22'),
        costHistory: {
          create: [
            { cost: 350, changedBy: 'u5', changedByName: '陈静', changedAt: new Date('2024-01-22'), reason: '预估成本' }
          ]
        }
      }
    }),
    prisma.preparationTask.create({
      data: {
        id: 'pt5',
        vehicleId: 'v5',
        title: '更换刹车片',
        description: '前后刹车片磨损严重，需要更换',
        cost: 1200,
        estimatedCost: 1200,
        estimatedHours: 3,
        actualHours: 0,
        status: 'in_progress',
        assigneeId: 'u2',
        assigneeName: '李明',
        dueDate: new Date('2024-01-24'),
        completedAt: null,
        note: '正在施工中',
        createdBy: 'u2',
        createdByName: '李明',
        createdAt: new Date('2024-01-21'),
        updatedAt: new Date('2024-01-22'),
        costHistory: {
          create: [
            { cost: 1200, changedBy: 'u2', changedByName: '李明', changedAt: new Date('2024-01-21'), reason: '预估成本' }
          ]
        }
      }
    }),
  ]);

  console.log('创建成本预算...');
  await Promise.all([
    prisma.costBudget.create({
      data: {
        vehicleId: 'v1',
        estimatedBudget: 2000,
        actualCost: 1460,
        warningThreshold: 0.8,
        overrunThreshold: 1.0,
        lastUpdatedBy: 'u2',
        lastUpdatedAt: new Date('2024-01-22')
      }
    }),
    prisma.costBudget.create({
      data: {
        vehicleId: 'v5',
        estimatedBudget: 1500,
        actualCost: 0,
        warningThreshold: 0.8,
        overrunThreshold: 1.0,
        lastUpdatedBy: 'u1',
        lastUpdatedAt: new Date('2024-01-21')
      }
    }),
  ]);

  console.log('创建时间线事件...');
  await Promise.all([
    prisma.timelineEvent.create({
      data: {
        id: 'te1',
        vehicleId: 'v1',
        type: 'status_change',
        title: '车辆入库',
        description: '收车经理张伟完成车辆收购',
        actorId: 'u1',
        actorName: '张伟',
        createdAt: new Date('2024-01-15T09:30:00'),
        metadata: { status: 'pending' }
      }
    }),
    prisma.timelineEvent.create({
      data: {
        id: 'te2',
        vehicleId: 'v1',
        type: 'inspection',
        title: '检测报告生成',
        description: '评估师李明完成车辆检测',
        actorId: 'u2',
        actorName: '李明',
        createdAt: new Date('2024-01-19T14:20:00'),
        metadata: { reportId: 'ir1', score: 90.4 }
      }
    }),
    prisma.timelineEvent.create({
      data: {
        id: 'te3',
        vehicleId: 'v1',
        type: 'status_change',
        title: '状态变更',
        description: '车辆状态变更为整备中',
        actorId: 'u2',
        actorName: '李明',
        createdAt: new Date('2024-01-20T10:00:00'),
        metadata: { status: 'preparing' }
      }
    }),
    prisma.timelineEvent.create({
      data: {
        id: 'te4',
        vehicleId: 'v1',
        type: 'task',
        title: '任务创建',
        description: '创建整备任务：更换发动机气门室盖密封垫',
        actorId: 'u2',
        actorName: '李明',
        createdAt: new Date('2024-01-20T10:05:00'),
        metadata: { taskId: 'pt1', taskTitle: '更换发动机气门室盖密封垫' }
      }
    }),
    prisma.timelineEvent.create({
      data: {
        id: 'te5',
        vehicleId: 'v1',
        type: 'task',
        title: '任务完成',
        description: '车身抛光处理已完成',
        actorId: 'u2',
        actorName: '李明',
        createdAt: new Date('2024-01-21T16:30:00'),
        metadata: { taskId: 'pt2', taskTitle: '车身抛光处理' }
      }
    }),
    prisma.timelineEvent.create({
      data: {
        id: 'te6',
        vehicleId: 'v2',
        type: 'status_change',
        title: '车辆入库',
        description: '收车经理刘洋完成车辆收购',
        actorId: 'u4',
        actorName: '刘洋',
        createdAt: new Date('2024-01-18T11:00:00'),
        metadata: { status: 'pending' }
      }
    }),
    prisma.timelineEvent.create({
      data: {
        id: 'te7',
        vehicleId: 'v2',
        type: 'inspection',
        title: '检测报告生成',
        description: '评估师陈静完成车辆检测',
        actorId: 'u5',
        actorName: '陈静',
        createdAt: new Date('2024-01-21T15:45:00'),
        metadata: { reportId: 'ir2', score: 87.2 }
      }
    }),
  ]);

  console.log('创建金融记录...');
  await Promise.all([
    prisma.financeRecord.create({
      data: {
        id: 'fr1',
        vehicleId: 'v1',
        type: 'loan_application',
        documentName: '贷款申请',
        status: 'completed',
        assigneeId: 'u3',
        assigneeName: '王芳',
        dueDate: new Date('2024-01-17'),
        remindedCount: 0,
        lastRemindedAt: null,
        note: '贷款申请已提交银行',
        createdBy: 'u1',
        createdByName: '张伟',
        updatedAt: new Date('2024-01-17')
      }
    }),
    prisma.financeRecord.create({
      data: {
        id: 'fr2',
        vehicleId: 'v1',
        type: 'document',
        documentName: '车辆登记证',
        status: 'completed',
        assigneeId: 'u3',
        assigneeName: '王芳',
        dueDate: new Date('2024-01-15'),
        remindedCount: 0,
        lastRemindedAt: null,
        note: '已收到原件',
        createdBy: 'u1',
        createdByName: '张伟',
        updatedAt: new Date('2024-01-15')
      }
    }),
    prisma.financeRecord.create({
      data: {
        id: 'fr3',
        vehicleId: 'v1',
        type: 'document',
        documentName: '行驶证',
        status: 'completed',
        assigneeId: 'u3',
        assigneeName: '王芳',
        dueDate: new Date('2024-01-15'),
        remindedCount: 0,
        lastRemindedAt: null,
        note: '已收到原件',
        createdBy: 'u1',
        createdByName: '张伟',
        updatedAt: new Date('2024-01-15')
      }
    }),
    prisma.financeRecord.create({
      data: {
        id: 'fr4',
        vehicleId: 'v2',
        type: 'loan_application',
        documentName: '贷款申请',
        status: 'pending',
        assigneeId: 'u3',
        assigneeName: '王芳',
        dueDate: new Date('2024-01-26'),
        remindedCount: 1,
        lastRemindedAt: new Date('2024-01-22'),
        note: '等待客户提供收入证明',
        createdBy: 'u4',
        createdByName: '刘洋',
        updatedAt: new Date('2024-01-22')
      }
    }),
    prisma.financeRecord.create({
      data: {
        id: 'fr5',
        vehicleId: 'v2',
        type: 'document',
        documentName: '车辆登记证',
        status: 'completed',
        assigneeId: 'u3',
        assigneeName: '王芳',
        dueDate: new Date('2024-01-18'),
        remindedCount: 0,
        lastRemindedAt: null,
        note: '已收到原件',
        createdBy: 'u4',
        createdByName: '刘洋',
        updatedAt: new Date('2024-01-18')
      }
    }),
  ]);

  console.log('创建文档提醒...');
  await prisma.documentReminder.create({
    data: {
      id: 'dr1',
      vehicleId: 'v2',
      recordId: 'fr4',
      documentName: '收入证明',
      status: 'pending',
      assigneeId: 'u3',
      dueDate: new Date('2024-01-26'),
      remindedAt: null,
      completedAt: null,
      note: '等待客户提供收入证明'
    }
  });

  console.log('创建操作记录...');
  await Promise.all([
    prisma.operationRecord.create({
      data: {
        id: 'or1',
        vehicleId: 'v1',
        type: 'status_change',
        action: 'status_changed',
        previousValue: 'pending',
        newValue: 'inspected',
        actorId: 'u2',
        actorName: '李明',
        actorRole: 'assessor',
        createdAt: new Date('2024-01-19T14:20:00'),
        note: '完成车辆检测',
        metadata: { reportId: 'ir1' }
      }
    }),
    prisma.operationRecord.create({
      data: {
        id: 'or2',
        vehicleId: 'v1',
        type: 'task',
        action: 'task_created',
        previousValue: null,
        newValue: 'pt1',
        actorId: 'u2',
        actorName: '李明',
        actorRole: 'assessor',
        createdAt: new Date('2024-01-20T10:05:00'),
        note: '创建整备任务',
        metadata: { taskTitle: '更换发动机气门室盖密封垫' }
      }
    }),
  ]);

  console.log('创建状态转换配置...');
  await Promise.all(
    statusTransitionConfigs.map(config => 
      prisma.statusTransitionConfig.create({ data: config })
    )
  );

  console.log('种子数据完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });