import { PrismaClient } from '@prisma/client';
import { format, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: '系统管理员',
      password: 'admin123',
      role: 'ADMIN',
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { username: 'receptionist' },
    update: {},
    create: {
      username: 'receptionist',
      name: '前台小李',
      password: '123456',
      role: 'RECEPTIONIST',
    },
  });

  const today = new Date();
  
  const booking1 = await prisma.groupBooking.upsert({
    where: { bookingNo: 'TJ20260601001' },
    update: {},
    create: {
      bookingNo: 'TJ20260601001',
      companyName: '华为技术有限公司',
      contactPerson: '张经理',
      contactPhone: '13800138001',
      scheduledDate: addDays(today, 7),
      expectedCount: 150,
      actualCount: 150,
      status: 'CONFIRMED',
      packageType: '豪华套餐',
      pricePerPerson: 580,
      totalAmount: 87000,
      remark: '年度体检，要求空腹',
      createdById: receptionist.id,
      handledById: admin.id,
    },
  });

  const booking2 = await prisma.groupBooking.upsert({
    where: { bookingNo: 'TJ20260601002' },
    update: {},
    create: {
      bookingNo: 'TJ20260601002',
      companyName: '阿里巴巴集团',
      contactPerson: '李主管',
      contactPhone: '13800138002',
      scheduledDate: addDays(today, 14),
      expectedCount: 200,
      actualCount: 0,
      status: 'PENDING',
      packageType: '标准套餐',
      pricePerPerson: 380,
      totalAmount: 76000,
      remark: '新员工入职体检',
      createdById: receptionist.id,
    },
  });

  const booking3 = await prisma.groupBooking.upsert({
    where: { bookingNo: 'TJ20260601003' },
    update: {},
    create: {
      bookingNo: 'TJ20260601003',
      companyName: '腾讯科技',
      contactPerson: '王总监',
      contactPhone: '13800138003',
      scheduledDate: addDays(today, 3),
      expectedCount: 100,
      actualCount: 85,
      status: 'RESCHEDULED',
      packageType: '高级套餐',
      pricePerPerson: 880,
      totalAmount: 74800,
      remark: '原计划今天，因公司会议改期',
      createdById: receptionist.id,
      handledById: admin.id,
    },
  });

  const import1 = await prisma.personnelImport.upsert({
    where: { importNo: 'IM20260601001' },
    update: {},
    create: {
      importNo: 'IM20260601001',
      bookingId: booking1.id,
      status: 'COMPLETED',
      fileName: '华为体检名单.xlsx',
      totalCount: 150,
      successCount: 150,
      failCount: 0,
      createdById: receptionist.id,
    },
  });

  const personnelData = [
    { name: '张三', gender: '男', age: 35, idCard: '110101199001010001', phone: '13800138001', department: '研发部', position: '工程师' },
    { name: '李四', gender: '女', age: 28, idCard: '110101199702020002', phone: '13800138002', department: '市场部', position: '经理' },
    { name: '王五', gender: '男', age: 42, idCard: '110101198303030003', phone: '13800138003', department: '财务部', position: '总监' },
  ];

  for (let i = 0; i < personnelData.length; i++) {
    await prisma.personnel.upsert({
      where: { id: `personnel_${booking1.id}_${i}` },
      update: {},
      create: {
        id: `personnel_${booking1.id}_${i}`,
        bookingId: booking1.id,
        importId: import1.id,
        ...personnelData[i],
      },
    });
  }

  const timelines = [
    {
      id: 'timeline_1',
      bookingId: booking1.id,
      action: 'BOOKING_CREATED',
      description: '创建团检预约',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_2',
      bookingId: booking1.id,
      action: 'BOOKING_SUBMITTED',
      description: '提交审核',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_3',
      bookingId: booking1.id,
      action: 'BOOKING_CONFIRMED',
      description: '管理员确认预约',
      createdById: admin.id,
    },
    {
      id: 'timeline_4',
      bookingId: booking1.id,
      importId: import1.id,
      action: 'PERSONNEL_IMPORTED',
      description: '导入150名体检人员',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_5',
      bookingId: booking3.id,
      action: 'BOOKING_RESCHEDULED',
      description: '改期预约',
      oldValue: format(today, 'yyyy-MM-dd'),
      newValue: format(addDays(today, 3), 'yyyy-MM-dd'),
      createdById: admin.id,
    },
  ];

  for (const timeline of timelines) {
    try {
      await prisma.timeline.create({
        data: timeline,
      });
    } catch (e) {
      // Skip if already exists
    }
  }

  console.log('Seed data created successfully!');
  console.log('Admin user: admin / admin123');
  console.log('Receptionist user: receptionist / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
