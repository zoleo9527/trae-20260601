import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      id: 'user-001',
      name: '张培训',
      email: 'zhang@company.com',
      employeeId: 'EMP001',
      phone: '13800138000',
      department: '人力资源部',
      role: 'trainer_manager',
      passwordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'user-002',
      name: '李经理',
      email: 'li.manager@company.com',
      employeeId: 'EMP002',
      phone: '13800138001',
      department: '技术部',
      role: 'department_head',
      passwordHash,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'user-003',
      name: '王讲师',
      email: 'wang@company.com',
      employeeId: 'EMP003',
      phone: '13800138002',
      department: '技术部',
      role: 'instructor',
      passwordHash,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      id: 'user-004',
      name: '赵学员',
      email: 'zhao@company.com',
      employeeId: 'EMP004',
      phone: '13800138003',
      department: '技术部',
      role: 'trainee',
      passwordHash,
    },
  });

  const user5 = await prisma.user.create({
    data: {
      id: 'user-005',
      name: '钱学员',
      email: 'qian@company.com',
      employeeId: 'EMP005',
      phone: '13800138004',
      department: '技术部',
      role: 'trainee',
      passwordHash,
    },
  });

  const user6 = await prisma.user.create({
    data: {
      id: 'user-006',
      name: '孙市场',
      email: 'sun@company.com',
      employeeId: 'EMP006',
      phone: '13800138005',
      department: '市场部',
      role: 'trainee',
      passwordHash,
    },
  });

  console.log('用户数据创建完成');

  const course1 = await prisma.course.create({
    data: {
      id: 'course-001',
      title: 'React高级开发实战',
      description: '深入学习React生态系统，包括Hooks、Redux、TypeScript集成等',
      startTime: new Date('2024-01-15 09:00:00'),
      endTime: new Date('2024-01-15 17:00:00'),
      location: 'A栋3楼培训室',
      status: 'completed',
      instructorId: 'user-003',
      createdById: 'user-001',
    },
  });

  const course2 = await prisma.course.create({
    data: {
      id: 'course-002',
      title: '产品经理能力提升',
      description: '从需求分析到产品落地的完整方法论',
      startTime: new Date('2024-02-01 09:00:00'),
      endTime: new Date('2024-02-01 17:00:00'),
      location: 'B栋5楼会议室',
      status: 'ongoing',
      instructorId: 'user-003',
      createdById: 'user-001',
    },
  });

  const course3 = await prisma.course.create({
    data: {
      id: 'course-003',
      title: 'Vue3企业级应用开发',
      description: '掌握Vue3 Composition API和TypeScript实战',
      startTime: new Date('2024-03-10 09:00:00'),
      endTime: new Date('2024-03-10 17:00:00'),
      location: 'C栋2楼培训室',
      status: 'published',
      instructorId: 'user-003',
      createdById: 'user-001',
    },
  });

  console.log('课程数据创建完成');

  const enrollment1 = await prisma.enrollment.create({
    data: {
      id: uuidv4(),
      courseId: 'course-001',
      userId: 'user-004',
      attendanceStatus: 'signed',
      certificateStatus: 'issued',
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      id: uuidv4(),
      courseId: 'course-001',
      userId: 'user-005',
      attendanceStatus: 'late',
      certificateStatus: 'pending',
    },
  });

  const enrollment3 = await prisma.enrollment.create({
    data: {
      id: uuidv4(),
      courseId: 'course-001',
      userId: 'user-006',
      attendanceStatus: 'absent',
      certificateStatus: 'none',
    },
  });

  const enrollment4 = await prisma.enrollment.create({
    data: {
      id: uuidv4(),
      courseId: 'course-002',
      userId: 'user-004',
      attendanceStatus: 'pending',
      certificateStatus: 'none',
    },
  });

  const enrollment5 = await prisma.enrollment.create({
    data: {
      id: uuidv4(),
      courseId: 'course-002',
      userId: 'user-005',
      attendanceStatus: 'pending',
      certificateStatus: 'none',
    },
  });

  console.log('报名数据创建完成');

  const attendance1 = await prisma.attendance.create({
    data: {
      id: 'attendance-001',
      enrollmentId: enrollment1.id,
      courseId: 'course-001',
      userId: 'user-004',
      signInTime: new Date('2024-01-15 08:55:00'),
      status: 'signed',
      operatedById: 'user-003',
      operatedAt: new Date('2024-01-15 09:00:00'),
    },
  });

  const attendance2 = await prisma.attendance.create({
    data: {
      id: 'attendance-002',
      enrollmentId: enrollment2.id,
      courseId: 'course-001',
      userId: 'user-005',
      signInTime: new Date('2024-01-15 09:20:00'),
      status: 'late',
      notes: '地铁延误',
      operatedById: 'user-003',
      operatedAt: new Date('2024-01-15 09:20:00'),
    },
  });

  await prisma.attendance.create({
    data: {
      id: 'attendance-003',
      enrollmentId: enrollment3.id,
      courseId: 'course-001',
      userId: 'user-006',
      signInTime: null,
      status: 'absent',
      operatedById: 'user-003',
      operatedAt: new Date('2024-01-15 09:30:00'),
    },
  });

  console.log('签到数据创建完成');

  const exception1 = await prisma.exception.create({
    data: {
      id: 'exception-001',
      type: 'attendance',
      relatedType: 'course',
      relatedId: 'course-001',
      userId: 'user-005',
      description: '因地铁延误导致迟到20分钟，已提交地铁延误证明',
      adminNotes: '核实情况属实，地铁官方公告显示早高峰延误',
      status: 'processed',
      solution: '记录为迟到，不影响考勤',
      operatedById: 'user-001',
      createdAt: new Date('2024-01-15 09:30:00'),
      processedAt: new Date('2024-01-15 14:00:00'),
    },
  });

  await prisma.attendance.update({
    where: { id: 'attendance-002' },
    data: { exceptionId: exception1.id },
  });

  const exception2 = await prisma.exception.create({
    data: {
      id: 'exception-002',
      type: 'attendance',
      relatedType: 'course',
      relatedId: 'course-001',
      userId: 'user-006',
      description: '突发疾病，已就医',
      adminNotes: '',
      status: 'pending',
      operatedById: 'user-001',
      createdAt: new Date('2024-01-15 10:00:00'),
    },
  });

  await prisma.attendance.update({
    where: { id: 'attendance-003' },
    data: { exceptionId: exception2.id },
  });

  console.log('异常数据创建完成');

  const homework1 = await prisma.homework.create({
    data: {
      id: 'homework-001',
      courseId: 'course-001',
      title: 'React组件设计作业',
      description: '设计一个可复用的表格组件，要求支持排序、筛选、分页',
      deadline: new Date('2024-01-20 23:59:59'),
      totalScore: 100,
      status: 'closed',
      createdById: 'user-003',
      createdAt: new Date('2024-01-15 18:00:00'),
    },
  });

  const homework2 = await prisma.homework.create({
    data: {
      id: 'homework-002',
      courseId: 'course-002',
      title: '产品需求文档撰写',
      description: '为一款企业内部通讯工具撰写完整的需求文档',
      deadline: new Date('2024-02-10 23:59:59'),
      totalScore: 100,
      status: 'published',
      createdById: 'user-003',
      createdAt: new Date('2024-02-01 18:00:00'),
    },
  });

  console.log('作业数据创建完成');

  await prisma.homeworkSubmission.create({
    data: {
      id: 'submission-001',
      homeworkId: 'homework-001',
      userId: 'user-004',
      submittedAt: new Date('2024-01-19 15:30:00'),
      score: 95,
      status: 'graded',
      attachments: JSON.stringify([
        { fileName: 'TableComponent.tsx', fileUrl: '/uploads/table-component.tsx', fileSize: 2048, mimeType: 'text/plain' },
      ]),
      gradeNotes: '代码结构清晰，注释详细，功能完整',
      versionNumber: 1,
      isLatest: true,
      gradedById: 'user-003',
      gradedAt: new Date('2024-01-20 10:00:00'),
    },
  });

  await prisma.homeworkSubmission.create({
    data: {
      id: 'submission-002',
      homeworkId: 'homework-001',
      userId: 'user-005',
      submittedAt: new Date('2024-01-20 10:30:00'),
      score: 88,
      status: 'graded',
      attachments: JSON.stringify([
        { fileName: 'data-table.vue', fileUrl: '/uploads/data-table.vue', fileSize: 3072, mimeType: 'text/plain' },
      ]),
      gradeNotes: '使用了Vue实现，功能基本完整，但审题错误',
      versionNumber: 1,
      isLatest: true,
      gradedById: 'user-003',
      gradedAt: new Date('2024-01-20 14:00:00'),
    },
  });

  await prisma.homeworkSubmission.create({
    data: {
      id: 'submission-003',
      homeworkId: 'homework-001',
      userId: 'user-006',
      submittedAt: new Date('2024-01-21 09:00:00'),
      score: null,
      status: 'late',
      attachments: JSON.stringify([
        { fileName: '迟交的作业.pdf', fileUrl: '/uploads/late-homework.pdf', fileSize: 5120, mimeType: 'application/pdf' },
      ]),
      gradeNotes: null,
      versionNumber: 1,
      isLatest: true,
      gradedById: null,
      gradedAt: null,
    },
  });

  console.log('作业提交数据创建完成');

  const exam1 = await prisma.exam.create({
    data: {
      id: 'exam-001',
      courseId: 'course-001',
      title: 'React基础知识测验',
      duration: 60,
      passingScore: 60,
      totalScore: 100,
      startTime: new Date('2024-01-16 09:00:00'),
      endTime: new Date('2024-01-16 10:00:00'),
      status: 'published',
      createdById: 'user-003',
      createdAt: new Date('2024-01-15 20:00:00'),
    },
  });

  await prisma.examScore.create({
    data: {
      id: 'score-001',
      examId: exam1.id,
      userId: 'user-004',
      score: 92,
      status: 'published',
      gradedById: 'user-003',
      gradedAt: new Date('2024-01-16 11:00:00'),
      notes: '基础知识扎实',
    },
  });

  await prisma.examScore.create({
    data: {
      id: 'score-002',
      examId: exam1.id,
      userId: 'user-005',
      score: 78,
      status: 'published',
      gradedById: 'user-003',
      gradedAt: new Date('2024-01-16 11:00:00'),
      notes: '需要加强React Hooks的理解',
    },
  });

  await prisma.examScore.create({
    data: {
      id: 'score-003',
      examId: exam1.id,
      userId: 'user-006',
      score: null,
      status: 'pending',
      notes: '缺考',
    },
  });

  console.log('考试数据创建完成');

  await prisma.notification.create({
    data: {
      id: 'notification-001',
      userId: 'user-004',
      type: 'course_reminder',
      title: '课程提醒',
      content: '明天有"产品经理能力提升"课程，请准时参加',
      channel: 'in_app',
      status: 'sent',
      sentAt: new Date('2024-01-31 10:00:00'),
    },
  });

  await prisma.notification.create({
    data: {
      id: 'notification-002',
      userId: 'user-005',
      type: 'homework_due',
      title: '作业截止提醒',
      content: '您的"产品需求文档撰写"作业将于明天截止，请尽快提交',
      channel: 'in_app',
      status: 'sent',
      sentAt: new Date('2024-02-09 10:00:00'),
    },
  });

  await prisma.notification.create({
    data: {
      id: 'notification-003',
      userId: 'user-004',
      type: 'grade_published',
      title: '成绩发布',
      content: '您的"React基础知识测验"成绩已发布：92分',
      channel: 'in_app',
      status: 'read',
      sentAt: new Date('2024-01-16 11:00:00'),
      readAt: new Date('2024-01-16 12:00:00'),
    },
  });

  console.log('通知数据创建完成');

  await prisma.operationLog.createMany({
    data: [
      {
        id: uuidv4(),
        userId: 'user-001',
        module: 'course',
        action: 'create',
        relatedType: 'course',
        relatedId: 'course-001',
        details: '创建课程"React高级开发实战"',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2024-01-10 09:00:00'),
      },
      {
        id: uuidv4(),
        userId: 'user-003',
        module: 'attendance',
        action: 'sign_in',
        relatedType: 'course',
        relatedId: 'course-001',
        details: '为学员赵学员签到',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2024-01-15 09:00:00'),
      },
      {
        id: uuidv4(),
        userId: 'user-003',
        module: 'attendance',
        action: 'sign_in',
        relatedType: 'course',
        relatedId: 'course-001',
        details: '为学员钱学员签到（迟到）',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2024-01-15 09:20:00'),
      },
      {
        id: uuidv4(),
        userId: 'user-001',
        module: 'exception',
        action: 'process',
        relatedType: 'course',
        relatedId: 'course-001',
        details: '处理钱学员的迟到异常：记录为迟到，不影响考勤',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2024-01-15 14:00:00'),
      },
    ],
  });

  console.log('操作日志创建完成');
  console.log('所有种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
