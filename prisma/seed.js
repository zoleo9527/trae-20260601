import { PrismaClient } from '@prisma/client';
import { addDays, addHours, subHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');
  
  // 清理现有数据
  await prisma.auditLog.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.materialIssue.deleteMany();
  await prisma.exhibitIssue.deleteMany();
  await prisma.user.deleteMany();
  
  // 创建用户
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: '张伟',
        role: 'EXHIBIT_EDUCATOR',
        phone: '13800138001',
        email: 'zhangwei@science-museum.cn'
      }
    }),
    prisma.user.create({
      data: {
        name: '李娜',
        role: 'EXHIBIT_EDUCATOR',
        phone: '13800138002',
        email: 'lina@science-museum.cn'
      }
    }),
    prisma.user.create({
      data: {
        name: '王强',
        role: 'EQUIPMENT_ENGINEER',
        phone: '13800138003',
        email: 'wangqiang@science-museum.cn'
      }
    }),
    prisma.user.create({
      data: {
        name: '陈静',
        role: 'ACTIVITY_TEACHER',
        phone: '13800138004',
        email: 'chenjing@science-museum.cn'
      }
    }),
    prisma.user.create({
      data: {
        name: '刘洋',
        role: 'ACTIVITY_TEACHER',
        phone: '13800138005',
        email: 'liuyang@science-museum.cn'
      }
    }),
    prisma.user.create({
      data: {
        name: '系统管理员',
        role: 'ADMIN',
        phone: '13800138000',
        email: 'admin@science-museum.cn'
      }
    })
  ]);
  
  console.log(`创建了 ${users.length} 个用户`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 创建展项问题（展项停机）
  const exhibitIssues = await Promise.all([
    prisma.exhibitIssue.create({
      data: {
        exhibitId: 'EXHIBIT_001',
        exhibitName: '电磁奥秘',
        status: 'SHUTDOWN_EMERGENCY',
        cause: '设备短路，需要紧急维修',
        reporterId: users[0].id,
        handlerId: users[2].id,
        deadline: addHours(today, 24)
      }
    }),
    prisma.exhibitIssue.create({
      data: {
        exhibitId: 'EXHIBIT_002',
        exhibitName: '声光实验室',
        status: 'MAINTENANCE',
        cause: '计划性设备维护',
        reporterId: users[2].id,
        handlerId: users[2].id,
        deadline: addDays(today, 3)
      }
    })
  ]);
  
  console.log(`创建了 ${exhibitIssues.length} 个展项问题`);
  
  // 创建预约
  const reservations = await Promise.all([
    // 今日待处理
    prisma.reservation.create({
      data: {
        visitorGroup: '北京市第三中学',
        visitorCount: 45,
        contactName: '王老师',
        contactPhone: '13912340001',
        exhibitName: '电磁奥秘',
        startTime: setMinutes(setHours(today, 10), 0),
        endTime: setMinutes(setHours(today, 11), 30),
        status: 'PENDING_CONFIRM',
        createdById: users[3].id
      }
    }),
    // 今日待处理
    prisma.reservation.create({
      data: {
        visitorGroup: '海淀区实验小学',
        visitorCount: 30,
        contactName: '李老师',
        contactPhone: '13912340002',
        exhibitName: '声光实验室',
        startTime: setMinutes(setHours(today, 14), 0),
        endTime: setMinutes(setHours(today, 15), 30),
        status: 'PENDING_CONFIRM',
        createdById: users[4].id
      }
    }),
    // 超时预约
    prisma.reservation.create({
      data: {
        visitorGroup: '朝阳区外国语学校',
        visitorCount: 35,
        contactName: '赵老师',
        contactPhone: '13912340003',
        exhibitName: '机器人互动区',
        startTime: subHours(today, 2),
        endTime: subHours(today, 0.5),
        status: 'CONFIRMED',
        createdById: users[3].id
      }
    }),
    // 刚退回的预约
    prisma.reservation.create({
      data: {
        visitorGroup: '丰台区第一小学',
        visitorCount: 50,
        contactName: '周老师',
        contactPhone: '13912340004',
        exhibitName: '电磁奥秘',
        startTime: setMinutes(setHours(today, 9), 0),
        endTime: setMinutes(setHours(today, 10), 30),
        status: 'REJECTED',
        rejectionReason: '该展项因设备故障暂时关闭，请选择其他展项',
        rejectedAt: subHours(new Date(), 1),
        rejectedById: users[0].id,
        needsReview: true,
        reviewReason: '退回原因: 展项停机',
        createdById: users[4].id
      }
    }),
    // 已确认的预约
    prisma.reservation.create({
      data: {
        visitorGroup: '西城区第二中学',
        visitorCount: 40,
        contactName: '孙老师',
        contactPhone: '13912340005',
        exhibitName: '天文观测台',
        startTime: setMinutes(setHours(addDays(today, 1), 10), 0),
        endTime: setMinutes(setHours(addDays(today, 1), 11), 30),
        status: 'CONFIRMED',
        createdById: users[3].id
      }
    })
  ]);
  
  console.log(`创建了 ${reservations.length} 个预约`);
  
  // 为已确认的预约创建排班
  const schedules = await Promise.all([
    prisma.schedule.create({
      data: {
        reservationId: reservations[2].id,
        educatorId: users[0].id,
        scheduledStart: subHours(today, 2),
        scheduledEnd: subHours(today, 0.5),
        status: 'IN_PROGRESS',
        createdById: users[3].id,
        assignedAt: subHours(today, 3),
        assignedById: users[0].id
      }
    }),
    prisma.schedule.create({
      data: {
        reservationId: reservations[4].id,
        educatorId: users[1].id,
        scheduledStart: setMinutes(setHours(addDays(today, 1), 10), 0),
        scheduledEnd: setMinutes(setHours(addDays(today, 1), 11), 30),
        status: 'ASSIGNED',
        createdById: users[3].id,
        assignedAt: today
      }
    })
  ]);
  
  console.log(`创建了 ${schedules.length} 个排班`);
  
  // 创建材料问题
  const materialIssues = await Promise.all([
    prisma.materialIssue.create({
      data: {
        materialName: '电路实验套件',
        quantity: 10,
        unit: '套',
        issueType: 'MATERIAL_OUT_OF_STOCK',
        status: 'OPEN',
        reporterId: users[3].id,
        deadline: addHours(today, 8)
      }
    }),
    prisma.materialIssue.create({
      data: {
        materialName: '化学试剂-硫酸铜',
        quantity: 500,
        unit: 'g',
        issueType: 'MATERIAL_OUT_OF_STOCK',
        status: 'IN_PROGRESS',
        reporterId: users[4].id,
        handlerId: users[3].id,
        deadline: addDays(today, 2)
      }
    })
  ]);
  
  console.log(`创建了 ${materialIssues.length} 个材料问题`);
  
  // 创建审计日志
  await prisma.auditLog.createMany({
    data: [
      {
        userId: users[0].id,
        action: 'CREATE',
        entityType: 'ExhibitIssue',
        entityId: exhibitIssues[0].id,
        description: '报告展项停机: 电磁奥秘 - 设备短路',
        newValue: JSON.stringify({ status: 'SHUTDOWN_EMERGENCY' })
      },
      {
        userId: users[3].id,
        action: 'CREATE',
        entityType: 'Reservation',
        entityId: reservations[0].id,
        description: '创建预约: 北京市第三中学',
        newValue: JSON.stringify({ visitorGroup: '北京市第三中学' })
      },
      {
        userId: users[0].id,
        action: 'STATUS_CHANGE',
        entityType: 'Reservation',
        entityId: reservations[3].id,
        description: '退回预约: 该展项因设备故障暂时关闭',
        oldValue: JSON.stringify({ status: 'PENDING_CONFIRM' }),
        newValue: JSON.stringify({ status: 'REJECTED' })
      }
    ]
  });
  
  console.log('种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
