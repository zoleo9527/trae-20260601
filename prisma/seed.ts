import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        name: '张考务',
        role: 'EXAM_OFFICER',
        department: '教务处',
        phone: '13800138001',
        password: passwordHash
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        name: '李监考',
        role: 'INVIGILATOR',
        department: '计算机学院',
        phone: '13800138002',
        password: passwordHash
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-3' },
      update: {},
      create: {
        id: 'user-3',
        name: '王监考',
        role: 'INVIGILATOR',
        department: '外国语学院',
        phone: '13800138003',
        password: passwordHash
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-4' },
      update: {},
      create: {
        id: 'user-4',
        name: '赵技术',
        role: 'TECH_SUPPORT',
        department: '信息技术中心',
        phone: '13800138004',
        password: passwordHash
      }
    })
  ]);

  console.log('创建用户:', users.length);

  const exams = await Promise.all([
    prisma.exam.upsert({
      where: { id: 'exam-1' },
      update: {},
      create: {
        id: 'exam-1',
        name: '2024年秋季期末考试-计算机基础',
        date: new Date('2024-12-20'),
        startTime: '09:00',
        endTime: '11:00',
        status: 'PUBLISHED'
      }
    }),
    prisma.exam.upsert({
      where: { id: 'exam-2' },
      update: {},
      create: {
        id: 'exam-2',
        name: '2024年秋季期末考试-大学英语',
        date: new Date('2024-12-21'),
        startTime: '14:00',
        endTime: '16:00',
        status: 'PUBLISHED'
      }
    })
  ]);

  console.log('创建考试:', exams.length);

  const examRooms = await Promise.all([
    prisma.examRoom.upsert({
      where: { id: 'room-1' },
      update: {},
      create: {
        id: 'room-1',
        building: '教学楼A',
        roomNumber: '101',
        seatCount: 30,
        facilities: '投影仪,空调',
        status: 'AVAILABLE'
      }
    }),
    prisma.examRoom.upsert({
      where: { id: 'room-2' },
      update: {},
      create: {
        id: 'room-2',
        building: '教学楼A',
        roomNumber: '102',
        seatCount: 40,
        facilities: '投影仪,空调,监控',
        status: 'AVAILABLE'
      }
    }),
    prisma.examRoom.upsert({
      where: { id: 'room-3' },
      update: {},
      create: {
        id: 'room-3',
        building: '教学楼B',
        roomNumber: '201',
        seatCount: 35,
        facilities: '空调',
        status: 'AVAILABLE'
      }
    })
  ]);

  console.log('创建考场:', examRooms.length);

  const students = await Promise.all([
    prisma.student.upsert({
      where: { id: 'student-1' },
      update: {},
      create: {
        id: 'student-1',
        name: '陈小明',
        studentId: '2024001',
        admissionTicket: 'AD2024001',
        department: '计算机学院',
        major: '软件工程'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-2' },
      update: {},
      create: {
        id: 'student-2',
        name: '刘小红',
        studentId: '2024002',
        admissionTicket: 'AD2024002',
        department: '计算机学院',
        major: '软件工程'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-3' },
      update: {},
      create: {
        id: 'student-3',
        name: '周小华',
        studentId: '2024003',
        admissionTicket: 'AD2024003',
        department: '外国语学院',
        major: '英语'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-4' },
      update: {},
      create: {
        id: 'student-4',
        name: '吴小丽',
        studentId: '2024004',
        admissionTicket: 'AD2024004',
        department: '外国语学院',
        major: '英语'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-5' },
      update: {},
      create: {
        id: 'student-5',
        name: '郑小龙',
        studentId: '2024005',
        admissionTicket: 'AD2024005',
        department: '计算机学院',
        major: '计算机科学'
      }
    })
  ]);

  console.log('创建学生:', students.length);

  const arrangements = await Promise.all([
    prisma.arrangement.upsert({
      where: { id: 'arr-1' },
      update: {},
      create: {
        id: 'arr-1',
        examId: 'exam-1',
        examRoomId: 'room-1',
        invigilatorId: 'user-2',
        date: new Date('2024-12-20'),
        startTime: '09:00',
        endTime: '11:00',
        status: 'PENDING',
        createdBy: 'user-1'
      }
    }),
    prisma.arrangement.upsert({
      where: { id: 'arr-2' },
      update: {},
      create: {
        id: 'arr-2',
        examId: 'exam-1',
        examRoomId: 'room-2',
        invigilatorId: 'user-3',
        date: new Date('2024-12-20'),
        startTime: '09:00',
        endTime: '11:00',
        status: 'CONFIRMED',
        confirmedAt: new Date('2024-12-15T10:30:00'),
        confirmedBy: 'user-3',
        createdBy: 'user-1'
      }
    }),
    prisma.arrangement.upsert({
      where: { id: 'arr-3' },
      update: {},
      create: {
        id: 'arr-3',
        examId: 'exam-2',
        examRoomId: 'room-3',
        invigilatorId: 'user-2',
        date: new Date('2024-12-21'),
        startTime: '14:00',
        endTime: '16:00',
        status: 'PENDING',
        createdBy: 'user-1'
      }
    })
  ]);

  console.log('创建监考安排:', arrangements.length);

  const examSeats = await Promise.all([
    prisma.examSeat.upsert({
      where: { id: 'seat-1' },
      update: {},
      create: {
        id: 'seat-1',
        examId: 'exam-1',
        examRoomId: 'room-1',
        studentId: 'student-1',
        seatNumber: '01'
      }
    }),
    prisma.examSeat.upsert({
      where: { id: 'seat-2' },
      update: {},
      create: {
        id: 'seat-2',
        examId: 'exam-1',
        examRoomId: 'room-1',
        studentId: 'student-2',
        seatNumber: '02'
      }
    }),
    prisma.examSeat.upsert({
      where: { id: 'seat-3' },
      update: {},
      create: {
        id: 'seat-3',
        examId: 'exam-1',
        examRoomId: 'room-1',
        studentId: 'student-5',
        seatNumber: '03'
      }
    }),
    prisma.examSeat.upsert({
      where: { id: 'seat-4' },
      update: {},
      create: {
        id: 'seat-4',
        examId: 'exam-2',
        examRoomId: 'room-3',
        studentId: 'student-3',
        seatNumber: '01'
      }
    }),
    prisma.examSeat.upsert({
      where: { id: 'seat-5' },
      update: {},
      create: {
        id: 'seat-5',
        examId: 'exam-2',
        examRoomId: 'room-3',
        studentId: 'student-4',
        seatNumber: '02'
      }
    }),
    prisma.examSeat.upsert({
      where: { id: 'seat-6' },
      update: {},
      create: {
        id: 'seat-6',
        examId: 'exam-1',
        examRoomId: 'room-2',
        studentId: 'student-1',
        seatNumber: '01'
      }
    }),
    prisma.examSeat.upsert({
      where: { id: 'seat-7' },
      update: {},
      create: {
        id: 'seat-7',
        examId: 'exam-1',
        examRoomId: 'room-2',
        studentId: 'student-3',
        seatNumber: '02'
      }
    })
  ]);

  console.log('创建考试座位:', examSeats.length);

  const todoItems = await Promise.all([
    prisma.todoItem.upsert({
      where: { id: 'todo-1' },
      update: {},
      create: {
        id: 'todo-1',
        type: 'ARRANGEMENT_CONFIRM',
        title: '确认监考安排',
        description: '请确认2024年秋季期末考试-计算机基础的监考任务',
        priority: 'HIGH',
        dueDate: new Date('2024-12-18'),
        status: 'PENDING',
        assigneeId: 'user-2',
        relatedId: 'arr-1'
      }
    }),
    prisma.todoItem.upsert({
      where: { id: 'todo-2' },
      update: {},
      create: {
        id: 'todo-2',
        type: 'ARRANGEMENT_CONFIRM',
        title: '确认监考安排',
        description: '请确认2024年秋季期末考试-大学英语的监考任务',
        priority: 'MEDIUM',
        dueDate: new Date('2024-12-19'),
        status: 'PENDING',
        assigneeId: 'user-2',
        relatedId: 'arr-3'
      }
    })
  ]);

  console.log('创建待办事项:', todoItems.length);

  const operationLogs = await Promise.all([
    prisma.operationLog.create({
      data: {
        userId: 'user-1',
        action: 'CREATE_ARRANGEMENT',
        entityType: 'Arrangement',
        entityId: 'arr-1',
        newValue: JSON.stringify({
          examId: 'exam-1',
          examRoomId: 'room-1',
          invigilatorId: 'user-2'
        })
      }
    }),
    prisma.operationLog.create({
      data: {
        userId: 'user-3',
        action: 'CONFIRM_ARRANGEMENT',
        entityType: 'Arrangement',
        entityId: 'arr-2',
        newValue: JSON.stringify({
          status: 'CONFIRMED'
        })
      }
    })
  ]);

  console.log('创建操作日志:', operationLogs.length);

  console.log('数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });