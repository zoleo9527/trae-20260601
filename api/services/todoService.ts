import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

export interface TodoItem {
  id: string;
  type: 'training' | 'payment' | 'exam';
  studentId: string;
  studentName: string;
  status: string;
  statusText: string;
  createdAt: Date;
  priority: 'normal' | 'urgent';
  extra?: any;
}

export async function getTodosByRole(role: Role, userId: string) {
  switch (role) {
    case 'advisor':
      return getAdvisorTodos();
    case 'coach':
      return getCoachTodos(userId);
    case 'examiner':
      return getExaminerTodos();
    case 'admin':
      return getAllTodos();
    default:
      return [];
  }
}

async function getAdvisorTodos(): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];

  const scheduledTraining = await prisma.trainingHours.findMany({
    where: { status: 'scheduled' },
    include: { student: true },
    orderBy: { scheduledAt: 'asc' },
  });

  for (const training of scheduledTraining) {
    const isUrgentFlag = isUrgent(training.scheduledAt);
    todos.push({
      id: training.id,
      type: 'training',
      studentId: training.studentId,
      studentName: training.student.name,
      status: training.status,
      statusText: isUrgentFlag ? '【紧急】练车即将开始' : '待确认练车',
      createdAt: training.createdAt,
      priority: isUrgentFlag ? 'urgent' : 'normal',
      extra: {
        scheduledAt: training.scheduledAt,
        hours: training.hours,
        location: training.location,
      },
    });
  }

  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: { in: ['pending', 'confirmed'] },
    },
    include: { student: true },
    orderBy: { createdAt: 'asc' },
  });

  for (const payment of pendingPayments) {
    const isUrgentFlag = payment.status === 'confirmed';
    todos.push({
      id: payment.id,
      type: 'payment',
      studentId: payment.studentId,
      studentName: payment.student.name,
      status: payment.status,
      statusText: isUrgentFlag ? '【紧急】待支付确认' : getPaymentStatusText(payment.status),
      createdAt: payment.createdAt,
      priority: isUrgentFlag ? 'urgent' : 'normal',
      extra: {
        paymentType: payment.paymentType,
        amount: payment.amount,
      },
    });
  }

  const exceptionTraining = await prisma.trainingHours.findMany({
    where: { status: 'exception' },
    include: { student: true },
    orderBy: { updatedAt: 'desc' },
  });

  for (const training of exceptionTraining) {
    todos.push({
      id: training.id,
      type: 'training',
      studentId: training.studentId,
      studentName: training.student.name,
      status: training.status,
      statusText: '【紧急】练车异常',
      createdAt: training.updatedAt,
      priority: 'urgent',
      extra: {
        exceptionReason: training.exceptionReason,
        scheduledAt: training.scheduledAt,
      },
    });
  }

  const refundPayments = await prisma.payment.findMany({
    where: { status: 'refund_pending' },
    include: { student: true },
    orderBy: { updatedAt: 'desc' },
  });

  for (const payment of refundPayments) {
    todos.push({
      id: payment.id,
      type: 'payment',
      studentId: payment.studentId,
      studentName: payment.student.name,
      status: payment.status,
      statusText: '【紧急】退款待处理',
      createdAt: payment.updatedAt,
      priority: 'urgent',
      extra: {
        paymentType: payment.paymentType,
        amount: payment.amount,
        refundReason: payment.refundReason,
      },
    });
  }

  const exceptionPayments = await prisma.payment.findMany({
    where: { status: 'exception' },
    include: { student: true },
    orderBy: { updatedAt: 'desc' },
  });

  for (const payment of exceptionPayments) {
    todos.push({
      id: payment.id,
      type: 'payment',
      studentId: payment.studentId,
      studentName: payment.student.name,
      status: payment.status,
      statusText: '【紧急】费用争议',
      createdAt: payment.updatedAt,
      priority: 'urgent',
      extra: {
        paymentType: payment.paymentType,
        amount: payment.amount,
        refundReason: payment.refundReason,
      },
    });
  }

  return todos;
}

async function getCoachTodos(userId: string): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];

  const scheduledTraining = await prisma.trainingHours.findMany({
    where: {
      coachId: userId,
      status: 'scheduled',
    },
    include: { student: true },
    orderBy: { scheduledAt: 'asc' },
  });

  for (const training of scheduledTraining) {
    const isUrgentFlag = isUrgent(training.scheduledAt);
    todos.push({
      id: training.id,
      type: 'training',
      studentId: training.studentId,
      studentName: training.student.name,
      status: training.status,
      statusText: isUrgentFlag ? '【紧急】练车即将开始' : '待确认练车',
      createdAt: training.createdAt,
      priority: isUrgentFlag ? 'urgent' : 'normal',
      extra: {
        scheduledAt: training.scheduledAt,
        hours: training.hours,
        location: training.location,
      },
    });
  }

  const hoursRecordedTraining = await prisma.trainingHours.findMany({
    where: {
      coachId: userId,
      status: 'hours_recorded',
    },
    include: { student: true },
    orderBy: { scheduledAt: 'asc' },
  });

  for (const training of hoursRecordedTraining) {
    todos.push({
      id: training.id,
      type: 'training',
      studentId: training.studentId,
      studentName: training.student.name,
      status: training.status,
      statusText: '待学员确认学时',
      createdAt: training.updatedAt,
      priority: 'normal',
      extra: {
        scheduledAt: training.scheduledAt,
        actualHours: training.actualHours,
      },
    });
  }

  const exceptionTraining = await prisma.trainingHours.findMany({
    where: {
      coachId: userId,
      status: 'exception',
    },
    include: { student: true },
    orderBy: { updatedAt: 'desc' },
  });

  for (const training of exceptionTraining) {
    todos.push({
      id: training.id,
      type: 'training',
      studentId: training.studentId,
      studentName: training.student.name,
      status: training.status,
      statusText: '【紧急】练车异常',
      createdAt: training.updatedAt,
      priority: 'urgent',
      extra: {
        exceptionReason: training.exceptionReason,
        scheduledAt: training.scheduledAt,
      },
    });
  }

  return todos;
}

async function getExaminerTodos(): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];

  const pendingExams = await prisma.examBooking.findMany({
    where: { status: 'pending' },
    include: { student: true },
    orderBy: { createdAt: 'asc' },
  });

  for (const exam of pendingExams) {
    const daysPending = Math.floor((Date.now() - new Date(exam.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const isUrgentFlag = daysPending >= 3;
    todos.push({
      id: exam.id,
      type: 'exam',
      studentId: exam.studentId,
      studentName: exam.student.name,
      status: exam.status,
      statusText: isUrgentFlag ? '【紧急】约考等待过久' : '待预约考试',
      createdAt: exam.createdAt,
      priority: isUrgentFlag ? 'urgent' : 'normal',
      extra: {
        examType: exam.examType,
        daysPending,
      },
    });
  }

  const completedExams = await prisma.examBooking.findMany({
    where: { status: 'completed' },
    include: { student: true },
    orderBy: { scheduledDate: 'desc' },
  });

  for (const exam of completedExams) {
    todos.push({
      id: exam.id,
      type: 'exam',
      studentId: exam.studentId,
      studentName: exam.student.name,
      status: exam.status,
      statusText: '待录入学分',
      createdAt: exam.updatedAt,
      priority: 'normal',
      extra: {
        examType: exam.examType,
        scheduledDate: exam.scheduledDate,
      },
    });
  }

  const retestExams = await prisma.examBooking.findMany({
    where: { status: 'retest' },
    include: { student: true },
    orderBy: { updatedAt: 'desc' },
  });

  for (const exam of retestExams) {
    todos.push({
      id: exam.id,
      type: 'exam',
      studentId: exam.studentId,
      studentName: exam.student.name,
      status: exam.status,
      statusText: '【紧急】补考待处理',
      createdAt: exam.updatedAt,
      priority: 'urgent',
      extra: {
        examType: exam.examType,
        retestFee: exam.retestFee,
      },
    });
  }

  const pendingRetestPayments = await prisma.payment.findMany({
    where: {
      paymentType: 'retest',
      status: 'pending',
    },
    include: { student: true },
    orderBy: { createdAt: 'asc' },
  });

  for (const payment of pendingRetestPayments) {
    todos.push({
      id: payment.id,
      type: 'payment',
      studentId: payment.studentId,
      studentName: payment.student.name,
      status: payment.status,
      statusText: '【紧急】补考费待确认',
      createdAt: payment.createdAt,
      priority: 'urgent',
      extra: {
        paymentType: payment.paymentType,
        amount: payment.amount,
      },
    });
  }

  return todos;
}

async function getAllTodos(): Promise<TodoItem[]> {
  const advisorTodos = await getAdvisorTodos();
  const coachTodos = await getCoachTodos('');
  const examinerTodos = await getExaminerTodos();

  return [...advisorTodos, ...coachTodos, ...examinerTodos].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function isUrgent(date: Date): boolean {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours <= 24 && hours > 0;
}

function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待确认费用',
    confirmed: '待支付',
    paid: '待结算',
    settled: '已结算',
    refund_pending: '待处理退款',
    refunded: '已退款',
    exception: '费用异常',
  };
  return statusMap[status] || status;
}
