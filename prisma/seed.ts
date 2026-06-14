import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const advisor = await prisma.user.upsert({
    where: { username: 'advisor1' },
    update: {},
    create: {
      username: 'advisor1',
      passwordHash,
      realName: '李招生',
      role: 'advisor',
      phone: '13800138001',
    },
  });

  const coach = await prisma.user.upsert({
    where: { username: 'coach1' },
    update: {},
    create: {
      username: 'coach1',
      passwordHash,
      realName: '张教练',
      role: 'coach',
      phone: '13800138002',
    },
  });

  const examiner = await prisma.user.upsert({
    where: { username: 'examiner1' },
    update: {},
    create: {
      username: 'examiner1',
      passwordHash,
      realName: '王考试',
      role: 'examiner',
      phone: '13800138003',
    },
  });

  console.log('Created users:', { advisor, coach, examiner });

  const student1 = await prisma.student.upsert({
    where: { phone: '13900139001' },
    update: {},
    create: {
      name: '王小明',
      phone: '13900139001',
      idCard: '110101199001011234',
      examType: 'C1',
      advisorId: advisor.id,
      coachId: coach.id,
      status: 'training',
    },
  });

  const student2 = await prisma.student.upsert({
    where: { phone: '13900139002' },
    update: {},
    create: {
      name: '李小红',
      phone: '13900139002',
      idCard: '110101199002021234',
      examType: 'C2',
      advisorId: advisor.id,
      coachId: coach.id,
      status: 'training',
    },
  });

  const student3 = await prisma.student.upsert({
    where: { phone: '13900139003' },
    update: {},
    create: {
      name: '张小刚',
      phone: '13900139003',
      idCard: '110101199003031234',
      examType: 'C1',
      advisorId: advisor.id,
      coachId: coach.id,
      status: 'training',
    },
  });

  const student4 = await prisma.student.upsert({
    where: { phone: '13900139004' },
    update: {},
    create: {
      name: '刘大伟',
      phone: '13900139004',
      idCard: '110101199004041234',
      examType: 'C1',
      advisorId: advisor.id,
      coachId: coach.id,
      status: 'training',
    },
  });

  const student5 = await prisma.student.upsert({
    where: { phone: '13900139005' },
    update: {},
    create: {
      name: '陈美玲',
      phone: '13900139005',
      idCard: '110101199005051234',
      examType: 'C2',
      advisorId: advisor.id,
      coachId: coach.id,
      status: 'examining',
    },
  });

  const student6 = await prisma.student.upsert({
    where: { phone: '13900139006' },
    update: {},
    create: {
      name: '赵小强',
      phone: '13900139006',
      idCard: '110101199006061234',
      examType: 'C1',
      advisorId: advisor.id,
      coachId: coach.id,
      status: 'training',
    },
  });

  console.log('Created students:', { student1, student2, student3, student4, student5, student6 });

  const training1 = await prisma.trainingHours.create({
    data: {
      studentId: student1.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-14 09:00:00'),
      hours: 2,
      location: '场地A',
      status: 'scheduled',
    },
  });

  const training2 = await prisma.trainingHours.create({
    data: {
      studentId: student2.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-14 14:00:00'),
      hours: 2,
      location: '场地B',
      status: 'coach_confirmed',
      actualAt: new Date('2026-06-14 14:05:00'),
      actualHours: 1.5,
    },
  });

  const training3 = await prisma.trainingHours.create({
    data: {
      studentId: student3.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-13 10:00:00'),
      hours: 2,
      location: '场地C',
      status: 'exception',
      exceptionReason: '场地临时封闭，无法安排练车',
    },
  });

  const training4 = await prisma.trainingHours.create({
    data: {
      studentId: student4.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-15 08:00:00'),
      hours: 2,
      location: '场地A',
      status: 'scheduled',
    },
  });

  const training5 = await prisma.trainingHours.create({
    data: {
      studentId: student4.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-15 10:00:00'),
      hours: 2,
      location: '场地A',
      status: 'scheduled',
    },
  });

  const training6 = await prisma.trainingHours.create({
    data: {
      studentId: student5.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-12 14:00:00'),
      hours: 2,
      location: '场地B',
      status: 'hours_recorded',
      actualAt: new Date('2026-06-12 14:00:00'),
      actualHours: 2,
    },
  });

  const training7 = await prisma.trainingHours.create({
    data: {
      studentId: student6.id,
      coachId: coach.id,
      scheduledAt: new Date('2026-06-14 16:00:00'),
      hours: 2,
      location: '场地C',
      status: 'exception',
      exceptionReason: '车辆故障，无法按计划练车',
    },
  });

  console.log('Created training hours:', { training1, training2, training3, training4, training5, training6, training7 });

  const payment1 = await prisma.payment.create({
    data: {
      studentId: student1.id,
      paymentType: 'registration',
      amount: 5000,
      status: 'settled',
      paidAt: new Date('2026-06-01'),
      settledAt: new Date('2026-06-02'),
      handlerId: advisor.id,
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      studentId: student1.id,
      paymentType: 'training',
      amount: 1200,
      status: 'confirmed',
      handlerId: advisor.id,
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      studentId: student2.id,
      paymentType: 'retest',
      amount: 150,
      status: 'pending',
      handlerId: examiner.id,
    },
  });

  const payment4 = await prisma.payment.create({
    data: {
      studentId: student3.id,
      paymentType: 'refund',
      amount: 500,
      status: 'refund_pending',
      refundReason: '学员退学，扣除已发生费用后退款',
      handlerId: advisor.id,
    },
  });

  const payment5 = await prisma.payment.create({
    data: {
      studentId: student4.id,
      paymentType: 'registration',
      amount: 5000,
      status: 'paid',
      paidAt: new Date('2026-06-10'),
      handlerId: advisor.id,
    },
  });

  const payment6 = await prisma.payment.create({
    data: {
      studentId: student5.id,
      paymentType: 'retest',
      amount: 200,
      status: 'pending',
      handlerId: examiner.id,
    },
  });

  const payment7 = await prisma.payment.create({
    data: {
      studentId: student6.id,
      paymentType: 'training',
      amount: 600,
      status: 'exception',
      refundReason: '学时未完成，费用争议中',
      handlerId: advisor.id,
    },
  });

  console.log('Created payments:', { payment1, payment2, payment3, payment4, payment5, payment6, payment7 });

  const exam1 = await prisma.examBooking.create({
    data: {
      studentId: student1.id,
      examType: '科目二',
      scheduledDate: new Date('2026-06-20'),
      location: '考场A',
      examinerId: examiner.id,
      status: 'booked',
    },
  });

  const exam2 = await prisma.examBooking.create({
    data: {
      studentId: student2.id,
      examType: '科目二',
      status: 'pending',
    },
  });

  const exam3 = await prisma.examBooking.create({
    data: {
      studentId: student3.id,
      examType: '科目三',
      scheduledDate: new Date('2026-06-15'),
      location: '考场B',
      examinerId: examiner.id,
      status: 'retest',
      retestFee: 200,
    },
  });

  const exam4 = await prisma.examBooking.create({
    data: {
      studentId: student4.id,
      examType: '科目一',
      status: 'pending',
    },
  });

  const exam5 = await prisma.examBooking.create({
    data: {
      studentId: student5.id,
      examType: '科目三',
      scheduledDate: new Date('2026-06-18'),
      location: '考场A',
      examinerId: examiner.id,
      status: 'booked',
    },
  });

  const exam6 = await prisma.examBooking.create({
    data: {
      studentId: student6.id,
      examType: '科目二',
      scheduledDate: new Date('2026-06-16'),
      location: '考场C',
      examinerId: examiner.id,
      status: 'completed',
      score: 85,
    },
  });

  console.log('Created exam bookings:', { exam1, exam2, exam3, exam4, exam5, exam6 });

  await prisma.statusLog.createMany({
    data: [
      {
        entityType: 'training_hours',
        entityId: training1.id,
        newStatus: 'scheduled',
        handlerId: advisor.id,
        handlerName: advisor.realName,
        handlerRole: advisor.role,
        reason: '学员预约练车',
      },
      {
        entityType: 'training_hours',
        entityId: training2.id,
        previousStatus: 'scheduled',
        newStatus: 'coach_confirmed',
        handlerId: coach.id,
        handlerName: coach.realName,
        handlerRole: coach.role,
        reason: '教练确认练车时间',
        remark: '已确认，可按时开始',
      },
      {
        entityType: 'training_hours',
        entityId: training3.id,
        previousStatus: 'scheduled',
        newStatus: 'exception',
        handlerId: coach.id,
        handlerName: coach.realName,
        handlerRole: coach.role,
        reason: '场地临时封闭，无法安排练车',
        remark: '需要重新协调场地或时间',
      },
      {
        entityType: 'payment',
        entityId: payment1.id,
        newStatus: 'settled',
        handlerId: advisor.id,
        handlerName: advisor.realName,
        handlerRole: advisor.role,
        reason: '报名费已结算',
      },
      {
        entityType: 'payment',
        entityId: payment4.id,
        previousStatus: 'paid',
        newStatus: 'refund_pending',
        handlerId: advisor.id,
        handlerName: advisor.realName,
        handlerRole: advisor.role,
        reason: '学员退学申请退款',
        remark: '扣除已发生费用后，退还500元',
      },
      {
        entityType: 'exam_booking',
        entityId: exam3.id,
        previousStatus: 'completed',
        newStatus: 'retest',
        handlerId: examiner.id,
        handlerName: examiner.realName,
        handlerRole: examiner.role,
        reason: '科目三考试未通过，需要补考',
        remark: '下次考试时间待定',
      },
      {
        entityType: 'training_hours',
        entityId: training6.id,
        previousStatus: 'coach_confirmed',
        newStatus: 'hours_recorded',
        handlerId: coach.id,
        handlerName: coach.realName,
        handlerRole: coach.role,
        reason: '录入学时完成',
        remark: '实际学时2小时',
      },
      {
        entityType: 'payment',
        entityId: payment7.id,
        previousStatus: 'confirmed',
        newStatus: 'exception',
        handlerId: advisor.id,
        handlerName: advisor.realName,
        handlerRole: advisor.role,
        reason: '费用争议',
        remark: '学员声称学时未完成，拒绝支付',
      },
      {
        entityType: 'exam_booking',
        entityId: exam4.id,
        newStatus: 'pending',
        handlerId: advisor.id,
        handlerName: advisor.realName,
        handlerRole: advisor.role,
        reason: '学员申请约考',
        remark: '等待考试名额开放',
      },
      {
        entityType: 'training_hours',
        entityId: training7.id,
        previousStatus: 'scheduled',
        newStatus: 'exception',
        handlerId: coach.id,
        handlerName: coach.realName,
        handlerRole: coach.role,
        reason: '车辆故障',
        remark: '车辆维修中，预计2天恢复',
      },
      {
        entityType: 'payment',
        entityId: payment5.id,
        previousStatus: 'confirmed',
        newStatus: 'paid',
        handlerId: advisor.id,
        handlerName: advisor.realName,
        handlerRole: advisor.role,
        reason: '学员完成支付',
        remark: '微信支付',
      },
    ],
  });

  console.log('Created status logs');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
