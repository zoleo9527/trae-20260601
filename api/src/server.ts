import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
const JWT_SECRET = 'training-system-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 401, message: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ code: 403, message: '令牌无效' });
  }
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ code: 401, message: '密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    res.json({ code: 200, data: user });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: { id: true, name: true, department: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ code: 200, data: courses });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: {
          select: { id: true, name: true, department: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                department: true,
                avatar: true,
              },
            },
          },
        },
        homeworks: true,
        exams: true,
      },
    });

    if (!course) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    const logs = await prisma.operationLog.findMany({
      where: {
        relatedType: 'course',
        relatedId: req.params.id,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ code: 200, data: { ...course, timeline: logs } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/attendance/:courseId', authenticateToken, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.courseId },
      include: {
        instructor: {
          select: { id: true, name: true },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                department: true,
                avatar: true,
              },
            },
            attendances: {
              include: {
                exception: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    const attendees = course.enrollments.map((enrollment) => {
      const attendance = enrollment.attendances[0];
      return {
        enrollmentId: enrollment.id,
        userId: enrollment.user.id,
        name: enrollment.user.name,
        employeeId: enrollment.user.employeeId,
        department: enrollment.user.department,
        avatar: enrollment.user.avatar,
        status: attendance?.status || 'pending',
        signInTime: attendance?.signInTime || null,
        hasException: !!attendance?.exception,
        exceptionId: attendance?.exception?.id || null,
        exceptionStatus: attendance?.exception?.status || null,
      };
    });

    const stats = {
      total: attendees.length,
      signed: attendees.filter((a) => a.status === 'signed').length,
      late: attendees.filter((a) => a.status === 'late').length,
      leave: attendees.filter((a) => a.status === 'leave').length,
      absent: attendees.filter((a) => a.status === 'absent').length,
      pending: attendees.filter((a) => a.status === 'pending').length,
    };

    const logs = await prisma.operationLog.findMany({
      where: {
        module: 'attendance',
        relatedType: 'course',
        relatedId: req.params.courseId,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      code: 200,
      data: {
        courseId: course.id,
        courseName: course.title,
        scheduledTime: course.startTime,
        location: course.location,
        instructor: course.instructor,
        stats,
        attendees,
        timeline: logs,
      },
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/attendance/sign-in', authenticateToken, async (req, res) => {
  try {
    const { enrollmentId, courseId, status, signInTime, notes } = req.body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return res.status(404).json({ code: 404, message: '报名记录不存在' });
    }

    await prisma.attendance.upsert({
      where: { enrollmentId },
      update: {
        status,
        signInTime: signInTime ? new Date(signInTime) : new Date(),
        notes,
        operatedById: req.user.id,
        operatedAt: new Date(),
      },
      create: {
        enrollmentId,
        courseId,
        userId: enrollment.userId,
        status,
        signInTime: signInTime ? new Date(signInTime) : new Date(),
        notes,
        operatedById: req.user.id,
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { attendanceStatus: status },
    });

    const user = await prisma.user.findUnique({
      where: { id: enrollment.userId },
      select: { name: true },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'attendance',
        action: 'sign_in',
        relatedType: 'course',
        relatedId: courseId,
        details: `为学员${user?.name}签到（${status === 'signed' ? '正常签到' : status === 'late' ? '迟到' : status === 'leave' ? '请假' : '缺席'}）`,
        ipAddress: req.ip,
      },
    });

    res.json({
      code: 200,
      data: { success: true },
      message: '签到成功',
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/exceptions', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;

    const exceptions = await prisma.exception.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, department: true, avatar: true },
        },
        operatedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: exceptions.length,
      pending: exceptions.filter((e) => e.status === 'pending').length,
      processing: exceptions.filter((e) => e.status === 'processing').length,
      processed: exceptions.filter((e) => e.status === 'processed').length,
    };

    res.json({ code: 200, data: { exceptions, stats } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/exceptions', authenticateToken, async (req, res) => {
  try {
    const { type, relatedType, relatedId, userId, description, adminNotes } = req.body;

    const exception = await prisma.exception.create({
      data: {
        type,
        relatedType,
        relatedId,
        userId,
        description,
        adminNotes,
        operatedById: req.user.id,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'exception',
        action: 'create',
        relatedType,
        relatedId,
        details: `为学员${exception.user.name}创建${type}类型异常`,
        ipAddress: req.ip,
      },
    });

    res.json({ code: 200, data: exception, message: '异常创建成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.put('/api/exceptions/:id/process', authenticateToken, async (req, res) => {
  try {
    const { solution, adminNotes } = req.body;

    const exception = await prisma.exception.update({
      where: { id: req.params.id },
      data: {
        status: 'processed',
        solution,
        adminNotes,
        processedAt: new Date(),
        operatedById: req.user.id,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'exception',
        action: 'process',
        relatedType: exception.relatedType,
        relatedId: exception.relatedId,
        details: `处理${exception.user.name}的${exception.type}异常：${solution}`,
        ipAddress: req.ip,
      },
    });

    res.json({ code: 200, data: exception, message: '异常处理成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/homework/:id/submissions', authenticateToken, async (req, res) => {
  try {
    const homework = await prisma.homework.findUnique({
      where: { id: req.params.id },
      include: {
        course: {
          select: { id: true, title: true },
        },
        submissions: {
          where: { isLatest: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                department: true,
                avatar: true,
              },
            },
            gradedBy: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!homework) {
      return res.status(404).json({ code: 404, message: '作业不存在' });
    }

    const stats = {
      total: homework.submissions.length,
      submitted: homework.submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length,
      late: homework.submissions.filter((s) => s.status === 'late').length,
      pending: homework.submissions.filter((s) => s.status === 'pending').length,
      graded: homework.submissions.filter((s) => s.status === 'graded').length,
    };

    const submissions = homework.submissions.map((sub) => ({
      submissionId: sub.id,
      userId: sub.user.id,
      name: sub.user.name,
      employeeId: sub.user.employeeId,
      department: sub.user.department,
      avatar: sub.user.avatar,
      status: sub.status,
      submittedAt: sub.submittedAt,
      score: sub.score,
      isLatest: sub.isLatest,
      gradedAt: sub.gradedAt,
      gradedBy: sub.gradedBy?.name,
    }));

    res.json({
      code: 200,
      data: {
        homeworkId: homework.id,
        homeworkTitle: homework.title,
        courseId: homework.course.id,
        courseName: homework.course.title,
        deadline: homework.deadline,
        totalScore: homework.totalScore,
        stats,
        submissions,
      },
    });
  } catch (error) {
    console.error('Homework submissions error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/homework/:id/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: req.params.submissionId },
      include: {
        user: {
          select: { id: true, name: true, employeeId: true, department: true },
        },
        gradedBy: {
          select: { name: true },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ code: 404, message: '提交记录不存在' });
    }

    const allVersions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId: req.params.id,
        userId: submission.userId,
      },
      orderBy: { versionNumber: 'desc' },
    });

    const logs = await prisma.operationLog.findMany({
      where: {
        module: 'homework',
        relatedType: 'submission',
        relatedId: req.params.submissionId,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatAttachment = (attachment: any) => {
      if (!attachment) return null;
      if (attachment.fileName && attachment.fileUrl) {
        return {
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileSize: attachment.fileSize || 0,
          mimeType: attachment.mimeType || 'application/octet-stream',
        };
      }
      return {
        fileName: attachment.name || '未命名文件',
        fileUrl: attachment.url || '',
        fileSize: attachment.fileSize || attachment.size || 0,
        mimeType: attachment.mimeType || attachment.type || 'application/octet-stream',
      };
    };

    const parseAttachments = (attachmentsJson: string | null) => {
      if (!attachmentsJson) return [];
      try {
        const parsed = JSON.parse(attachmentsJson);
        return Array.isArray(parsed) ? parsed.map(formatAttachment) : [];
      } catch {
        return [];
      }
    };

    res.json({
      code: 200,
      data: {
        submissionId: submission.id,
        homeworkId: submission.homeworkId,
        user: submission.user,
        status: submission.status,
        submittedAt: submission.submittedAt,
        version: submission.versionNumber,
        attachments: parseAttachments(submission.attachments),
        notes: submission.notes,
        score: submission.score,
        gradeNotes: submission.gradeNotes,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy?.name,
        history: allVersions.map((v) => ({
          version: v.versionNumber,
          submittedAt: v.submittedAt,
          attachments: parseAttachments(v.attachments),
        })),
        timeline: logs,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/homework/:id/grade', authenticateToken, async (req, res) => {
  try {
    const { submissionId, score, gradeNotes } = req.body;

    const submission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        gradeNotes,
        status: 'graded',
        gradedById: req.user.id,
        gradedAt: new Date(),
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'homework',
        action: 'grade',
        relatedType: 'submission',
        relatedId: submissionId,
        details: `批改${submission.user.name}的作业：${score}分`,
        ipAddress: req.ip,
      },
    });

    res.json({ code: 200, data: submission, message: '批改成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => n.status === 'sent').length;

    res.json({ code: 200, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });

    res.json({ code: 200, message: '标记已读成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/export/attendance', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: true,
            attendances: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('签到表');

    worksheet.columns = [
      { header: '学号', key: 'employeeId', width: 15 },
      { header: '姓名', key: 'name', width: 15 },
      { header: '部门', key: 'department', width: 20 },
      { header: '签到状态', key: 'status', width: 15 },
      { header: '签到时间', key: 'signInTime', width: 20 },
      { header: '备注', key: 'notes', width: 30 },
    ];

    course.enrollments.forEach((enrollment) => {
      const attendance = enrollment.attendances[0];
      worksheet.addRow({
        employeeId: enrollment.user.employeeId,
        name: enrollment.user.name,
        department: enrollment.user.department,
        status: attendance?.status || 'pending',
        signInTime: attendance?.signInTime ? dayjs(attendance.signInTime).format('YYYY-MM-DD HH:mm:ss') : '',
        notes: attendance?.notes || '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `签到表_${course.title}_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ code: 500, message: '导出失败' });
  }
});

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '未上传文件' });
    }

    res.json({
      code: 200,
      data: {
        fileId: uuidv4(),
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '上传失败' });
  }
});

app.get('/api/exams', authenticateToken, async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        course: {
          select: { id: true, title: true },
        },
        _count: {
          select: { examScores: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ code: 200, data: exams });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/exams/:id', authenticateToken, async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        course: {
          select: { id: true, title: true, location: true },
        },
        examScores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                department: true,
                avatar: true,
              },
            },
            gradedBy: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ code: 404, message: '考试不存在' });
    }

    const stats = {
      total: exam.examScores.length,
      graded: exam.examScores.filter((s) => s.status === 'graded' || s.status === 'published').length,
      pending: exam.examScores.filter((s) => s.status === 'pending').length,
      absent: exam.examScores.filter((s) => s.status === 'absent').length,
      average: exam.examScores.filter((s) => s.score !== null).length > 0
        ? Math.round(
            exam.examScores
              .filter((s) => s.score !== null)
              .reduce((sum, s) => sum + (s.score || 0), 0) /
              exam.examScores.filter((s) => s.score !== null).length
          )
        : 0,
      passRate: exam.examScores.filter((s) => s.status !== 'absent').length > 0
        ? Math.round(
            (exam.examScores.filter((s) => (s.score || 0) >= exam.passingScore).length /
              exam.examScores.filter((s) => s.status !== 'absent').length) *
              100
          )
        : 0,
    };

    const scores = exam.examScores.map((score) => ({
      scoreId: score.id,
      userId: score.userId,
      name: score.user.name,
      employeeId: score.user.employeeId,
      department: score.user.department,
      avatar: score.user.avatar,
      score: score.score,
      status: score.status,
      notes: score.notes,
      gradedAt: score.gradedAt,
      gradedBy: score.gradedBy?.name,
    }));

    const logs = await prisma.operationLog.findMany({
      where: {
        module: 'exam',
        relatedType: 'exam',
        relatedId: req.params.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      code: 200,
      data: {
        examId: exam.id,
        title: exam.title,
        courseId: exam.course.id,
        courseName: exam.course.title,
        location: exam.course.location,
        duration: exam.duration,
        passingScore: exam.passingScore,
        totalScore: exam.totalScore,
        startTime: exam.startTime,
        endTime: exam.endTime,
        status: exam.status,
        stats,
        scores,
        timeline: logs,
      },
    });
  } catch (error) {
    console.error('Exam detail error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/exams/:id/grade', authenticateToken, async (req, res) => {
  try {
    const { scoreId, score, notes } = req.body;

    const examScore = await prisma.examScore.update({
      where: { id: scoreId },
      data: {
        score,
        notes,
        status: 'graded',
        gradedById: req.user.id,
        gradedAt: new Date(),
      },
      include: {
        user: {
          select: { name: true },
        },
        exam: {
          select: { id: true, title: true },
        },
      },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'exam',
        action: 'grade',
        relatedType: 'exam',
        relatedId: examScore.exam.id,
        details: `批改${examScore.user.name}的考试成绩：${score}分`,
        ipAddress: req.ip,
      },
    });

    res.json({ code: 200, data: examScore, message: '批改成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/exams/:id/absent', authenticateToken, async (req, res) => {
  try {
    const { scoreId, userId, reason } = req.body;

    const examScore = await prisma.examScore.update({
      where: { id: scoreId },
      data: {
        status: 'absent',
        notes: `缺考：${reason}`,
      },
      include: {
        user: {
          select: { name: true },
        },
        exam: {
          select: { id: true, title: true },
        },
      },
    });

    const exception = await prisma.exception.create({
      data: {
        type: 'exam',
        relatedType: 'exam',
        relatedId: examScore.exam.id,
        userId,
        description: `考试缺考：${reason}`,
        status: 'pending',
        operatedById: req.user.id,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'exam',
        action: 'absent',
        relatedType: 'exam',
        relatedId: examScore.exam.id,
        details: `登记${examScore.user.name}缺考：${reason}`,
        ipAddress: req.ip,
      },
    });

    res.json({
      code: 200,
      data: { examScore, exception },
      message: '缺考登记成功'
    });
  } catch (error) {
    console.error('Absent registration error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.post('/api/exams/:id/publish', authenticateToken, async (req, res) => {
  try {
    const examScores = await prisma.examScore.findMany({
      where: { examId: req.params.id },
    });

    const ungradedCount = examScores.filter(s => s.status === 'pending').length;
    if (ungradedCount > 0) {
      return res.status(400).json({
        code: 400,
        message: `还有 ${ungradedCount} 名考生未批改，请先完成批改后再发布成绩`
      });
    }

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        status: 'published',
      },
    });

    await prisma.examScore.updateMany({
      where: {
        examId: req.params.id,
        status: 'graded'
      },
      data: {
        status: 'published',
      },
    });

    await prisma.operationLog.create({
      data: {
        userId: req.user.id,
        module: 'exam',
        action: 'publish',
        relatedType: 'exam',
        relatedId: req.params.id,
        details: `发布考试成绩：${exam.title}`,
        ipAddress: req.ip,
      },
    });

    res.json({ code: 200, data: exam, message: '成绩发布成功' });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalCourses,
      activeExceptions,
      recentAttendances,
      pendingCertificates,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.exception.count({ where: { status: { in: ['pending', 'processing'] } } }),
      prisma.attendance.count({
        where: {
          operatedAt: {
            gte: dayjs().subtract(7, 'day').toDate(),
          },
        },
      }),
      prisma.enrollment.count({ where: { certificateStatus: 'pending' } }),
    ]);

    res.json({
      code: 200,
      data: {
        totalCourses,
        activeExceptions,
        recentAttendances,
        pendingCertificates,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
