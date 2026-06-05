const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UserRole = {
  FRONT_DESK: 'FRONT_DESK',
  COACH: 'COACH',
  STORE_MANAGER: 'STORE_MANAGER',
};

const BookingStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  FEE_PENDING: 'FEE_PENDING',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const AuditAction = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  UPDATED: 'UPDATED',
  CANCELLED: 'CANCELLED',
};

async function main() {
  console.log('开始种子数据...');

  const existingUsers = await prisma.user.findMany();
  if (existingUsers.length === 0) {
    await prisma.user.createMany({
      data: [
        { name: '张前台', role: UserRole.FRONT_DESK },
        { name: '李教练', role: UserRole.COACH },
        { name: '王店长', role: UserRole.STORE_MANAGER },
      ],
    });
    console.log('创建用户: 3 条');
  } else {
    console.log('用户已存在，跳过创建');
  }

  const existingVenues = await prisma.venue.findMany();
  if (existingVenues.length === 0) {
    await prisma.venue.createMany({
      data: [
        { name: '1号篮球场', type: '篮球', hourlyRate: 200 },
        { name: '2号篮球场', type: '篮球', hourlyRate: 200 },
        { name: '羽毛球馆A', type: '羽毛球', hourlyRate: 80 },
        { name: '羽毛球馆B', type: '羽毛球', hourlyRate: 80 },
        { name: '乒乓球厅', type: '乒乓球', hourlyRate: 50 },
      ],
    });
    console.log('创建场馆: 5 条');
  } else {
    console.log('场馆已存在，跳过创建');
  }

  const createdUsers = await prisma.user.findMany();
  const createdVenues = await prisma.venue.findMany();

  const frontDesk = createdUsers.find(u => u.role === UserRole.FRONT_DESK);
  const coach = createdUsers.find(u => u.role === UserRole.COACH);
  const manager = createdUsers.find(u => u.role === UserRole.STORE_MANAGER);

  const booking1 = await prisma.bookingRequest.create({
    data: {
      venueId: createdVenues[0].id,
      customerName: '刘先生',
      customerPhone: '13800138001',
      bookingDate: new Date(Date.now() + 86400000),
      startTime: '18:00',
      endTime: '20:00',
      hours: 2,
      totalAmount: 400,
      status: BookingStatus.PENDING_REVIEW,
      submittedById: frontDesk.id,
      priority: 1,
      notes: {
        create: {
          createdById: frontDesk.id,
          content: '客户是老会员，要求预留好场地，提前准备好饮用水',
          stage: 'APPLICATION',
        },
      },
      auditLogs: {
        create: {
          userId: frontDesk.id,
          action: AuditAction.CREATED,
          newStatus: BookingStatus.DRAFT,
          details: '前台创建包场申请',
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      bookingId: booking1.id,
      userId: frontDesk.id,
      action: AuditAction.STATUS_CHANGED,
      oldStatus: BookingStatus.DRAFT,
      newStatus: BookingStatus.PENDING_REVIEW,
      details: '提交审核',
    },
  });

  const booking2 = await prisma.bookingRequest.create({
    data: {
      venueId: createdVenues[2].id,
      customerName: '陈女士',
      customerPhone: '13900139002',
      bookingDate: new Date(Date.now() + 172800000),
      startTime: '19:00',
      endTime: '21:00',
      hours: 2,
      totalAmount: 160,
      status: BookingStatus.FEE_PENDING,
      submittedById: coach.id,
      priority: 2,
      notes: {
        create: [
          {
            createdById: coach.id,
            content: '教练推荐的学员包场，需要配合教练教学使用',
            stage: 'APPLICATION',
          },
        ],
      },
      feeReview: {
        create: {
          actualAmount: 160,
          paymentMethod: '微信',
        },
      },
      auditLogs: {
        create: [
          {
            userId: coach.id,
            action: AuditAction.CREATED,
            newStatus: BookingStatus.DRAFT,
            details: '教练创建包场申请',
          },
          {
            userId: coach.id,
            action: AuditAction.STATUS_CHANGED,
            oldStatus: BookingStatus.DRAFT,
            newStatus: BookingStatus.PENDING_REVIEW,
            details: '提交审核',
          },
          {
            userId: manager.id,
            action: AuditAction.STATUS_CHANGED,
            oldStatus: BookingStatus.PENDING_REVIEW,
            newStatus: BookingStatus.FEE_PENDING,
            details: '店长审核通过，待费用确认',
          },
        ],
      },
    },
  });

  const booking3 = await prisma.bookingRequest.create({
    data: {
      venueId: createdVenues[1].id,
      customerName: '赵先生',
      customerPhone: '13700137003',
      bookingDate: new Date(Date.now() + 3600000),
      startTime: '15:00',
      endTime: '17:00',
      hours: 2,
      totalAmount: 400,
      status: BookingStatus.DRAFT,
      submittedById: frontDesk.id,
      priority: 3,
      auditLogs: {
        create: {
          userId: frontDesk.id,
          action: AuditAction.CREATED,
          newStatus: BookingStatus.DRAFT,
          details: '前台创建草稿',
        },
      },
    },
  });

  console.log(`创建包场申请: 3 条`);
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
