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
      actualCount: 5,
      status: 'SUPPLEMENTED',
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
      actualCount: 3,
      status: 'RESCHEDULED',
      packageType: '高级套餐',
      pricePerPerson: 880,
      totalAmount: 74800,
      remark: '原计划今天，因公司会议改期',
      createdById: receptionist.id,
      handledById: admin.id,
    },
  });

  const booking4 = await prisma.groupBooking.upsert({
    where: { bookingNo: 'TJ20260601004' },
    update: {},
    create: {
      bookingNo: 'TJ20260601004',
      companyName: '字节跳动',
      contactPerson: '赵主任',
      contactPhone: '13800138004',
      scheduledDate: addDays(today, 5),
      expectedCount: 80,
      actualCount: 0,
      status: 'REJECTED',
      packageType: '标准套餐',
      pricePerPerson: 380,
      totalAmount: 30400,
      remark: '驳回原因：预约日期与中心排班冲突，请重新选择日期',
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
      totalCount: 3,
      successCount: 3,
      failCount: 0,
      createdById: receptionist.id,
    },
  });

  const import2 = await prisma.personnelImport.upsert({
    where: { importNo: 'IM20260601002' },
    update: {},
    create: {
      importNo: 'IM20260601002',
      bookingId: booking1.id,
      status: 'COMPLETED',
      fileName: '华为补录名单.xlsx',
      totalCount: 2,
      successCount: 2,
      failCount: 0,
      createdById: receptionist.id,
    },
  });

  const import3 = await prisma.personnelImport.upsert({
    where: { importNo: 'IM20260601003' },
    update: {},
    create: {
      importNo: 'IM20260601003',
      bookingId: booking3.id,
      status: 'COMPLETED',
      fileName: '腾讯体检名单.xlsx',
      totalCount: 3,
      successCount: 3,
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

  const supplementData = [
    { name: '赵六', gender: '男', age: 31, idCard: '110101199404040004', phone: '13800138004', department: '研发部', position: '高级工程师' },
    { name: '钱七', gender: '女', age: 26, idCard: '110101199805050005', phone: '13800138005', department: '人事部', position: '专员' },
  ];

  for (let i = 0; i < supplementData.length; i++) {
    await prisma.personnel.upsert({
      where: { id: `personnel_supp_${booking1.id}_${i}` },
      update: {},
      create: {
        id: `personnel_supp_${booking1.id}_${i}`,
        bookingId: booking1.id,
        importId: import2.id,
        ...supplementData[i],
      },
    });
  }

  for (let i = 0; i < personnelData.length; i++) {
    await prisma.personnel.upsert({
      where: { id: `personnel_${booking3.id}_${i}` },
      update: {},
      create: {
        id: `personnel_${booking3.id}_${i}`,
        bookingId: booking3.id,
        importId: import3.id,
        ...personnelData[i],
      },
    });
  }

  const exception1 = await prisma.exceptionRecord.upsert({
    where: { id: 'exception_1' },
    update: {},
    create: {
      id: 'exception_1',
      bookingId: booking3.id,
      type: 'DATE_CONFLICT',
      description: '公司临时有重要会议，原定体检日期无法安排，需改期至下周',
      isHandled: true,
      handledById: admin.id,
      handledAt: addDays(today, -1),
    },
  });

  const exception2 = await prisma.exceptionRecord.upsert({
    where: { id: 'exception_2' },
    update: {},
    create: {
      id: 'exception_2',
      bookingId: booking1.id,
      type: 'PERSONNEL_CHANGE',
      description: '研发部有2名新员工入职，需补录体检名单',
      isHandled: true,
      handledById: admin.id,
      handledAt: addDays(today, -1),
    },
  });

  const exception3 = await prisma.exceptionRecord.upsert({
    where: { id: 'exception_3' },
    update: {},
    create: {
      id: 'exception_3',
      bookingId: booking1.id,
      type: 'PACKAGE_ADJUST',
      description: '3名高管套餐需从标准套餐升级为豪华套餐',
      isHandled: false,
    },
  });

  const exception4 = await prisma.exceptionRecord.upsert({
    where: { id: 'exception_4' },
    update: {},
    create: {
      id: 'exception_4',
      bookingId: booking4.id,
      type: 'DATE_CONFLICT',
      description: '预约日期与中心排班冲突',
      isHandled: true,
      handledById: admin.id,
      handledAt: addDays(today, -2),
    },
  });

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
      description: '导入3名体检人员',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_4a',
      bookingId: booking1.id,
      action: 'EXCEPTION_ADDED',
      description: '添加异常说明：人员变更 - 研发部有2名新员工入职，需补录体检名单',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_4b',
      bookingId: booking1.id,
      action: 'EXCEPTION_HANDLED',
      description: '处理异常：人员变更 - 研发部有2名新员工入职，需补录体检名单',
      createdById: admin.id,
    },
    {
      id: 'timeline_4c',
      bookingId: booking1.id,
      importId: import2.id,
      action: 'BOOKING_SUPPLEMENTED',
      description: '补录2名体检人员（失败0人），累计5人',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_4d',
      bookingId: booking1.id,
      action: 'EXCEPTION_ADDED',
      description: '添加异常说明：套餐调整 - 3名高管套餐需从标准套餐升级为豪华套餐',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_5',
      bookingId: booking3.id,
      action: 'BOOKING_CREATED',
      description: '创建团检预约',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_5a',
      bookingId: booking3.id,
      action: 'BOOKING_CONFIRMED',
      description: '管理员确认预约',
      createdById: admin.id,
    },
    {
      id: 'timeline_5b',
      bookingId: booking3.id,
      action: 'EXCEPTION_ADDED',
      description: '添加异常说明：日期冲突 - 公司临时有重要会议，原定体检日期无法安排，需改期至下周',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_5c',
      bookingId: booking3.id,
      action: 'EXCEPTION_HANDLED',
      description: '处理异常：日期冲突 - 公司临时有重要会议，原定体检日期无法安排，需改期至下周',
      createdById: admin.id,
    },
    {
      id: 'timeline_5d',
      bookingId: booking3.id,
      action: 'BOOKING_RESCHEDULED',
      description: '改期预约',
      oldValue: format(today, 'yyyy-MM-dd'),
      newValue: format(addDays(today, 3), 'yyyy-MM-dd'),
      createdById: admin.id,
    },
    {
      id: 'timeline_5e',
      bookingId: booking3.id,
      importId: import3.id,
      action: 'PERSONNEL_IMPORTED',
      description: '导入3名体检人员',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_6',
      bookingId: booking4.id,
      action: 'BOOKING_CREATED',
      description: '创建团检预约',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_7',
      bookingId: booking4.id,
      action: 'BOOKING_SUBMITTED',
      description: '提交审核',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_8',
      bookingId: booking4.id,
      action: 'EXCEPTION_ADDED',
      description: '添加异常说明：日期冲突 - 预约日期与中心排班冲突',
      createdById: receptionist.id,
    },
    {
      id: 'timeline_9',
      bookingId: booking4.id,
      action: 'EXCEPTION_HANDLED',
      description: '处理异常：日期冲突 - 预约日期与中心排班冲突',
      createdById: admin.id,
    },
    {
      id: 'timeline_10',
      bookingId: booking4.id,
      action: 'BOOKING_REJECTED',
      description: '驳回预约：预约日期与中心排班冲突，请重新选择日期',
      createdById: admin.id,
    },
  ];

  for (const timeline of timelines) {
    try {
      await prisma.timeline.create({
        data: timeline,
      });
    } catch (e) {
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
