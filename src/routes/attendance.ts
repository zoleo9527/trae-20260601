import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Session } from '../entities/Session';
import { Student } from '../entities/Student';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const attendanceRepository = () => AppDataSource.getRepository(Attendance);
const studentRepository = () => AppDataSource.getRepository(Student);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [attendances, total] = await attendanceRepository().findAndCount({
      ...options,
      relations: ['student', 'session', 'session.class'],
    });
    paginatedResponse(res, attendances, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const attendance = await attendanceRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['student', 'session'],
    });
    if (!attendance) return errorResponse(res, '考勤记录不存在', 404);
    successResponse(res, attendance);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const attendance = await attendanceRepository().findOneBy({ id: Number(req.params.id) });
    if (!attendance) return errorResponse(res, '考勤记录不存在', 404);
    attendanceRepository().merge(attendance, req.body);
    await attendanceRepository().save(attendance);
    
    if (req.body.status === 'present' || req.body.status === 'makeup') {
      const session = await AppDataSource.getRepository(Session).findOneBy({ id: attendance.sessionId });
      if (session) {
        const student = await studentRepository().findOneBy({ id: attendance.studentId });
        if (student) {
          student.attendedHours += session.hours;
          await studentRepository().save(student);
        }
      }
    }
    
    successResponse(res, attendance, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { sessionId, attendances } = req.body;
    
    for (const item of attendances) {
      const attendance = await attendanceRepository().findOneBy({
        sessionId,
        studentId: item.studentId,
      });
      
      if (attendance) {
        const oldStatus = attendance.status;
        attendanceRepository().merge(attendance, item);
        await attendanceRepository().save(attendance);
        
        if ((oldStatus !== 'present' && oldStatus !== 'makeup') && 
            (item.status === 'present' || item.status === 'makeup')) {
          const session = await AppDataSource.getRepository(Session).findOneBy({ id: sessionId });
          if (session) {
            const student = await studentRepository().findOneBy({ id: item.studentId });
            if (student) {
              student.attendedHours += session.hours;
              await studentRepository().save(student);
            }
          }
        }
      }
    }
    
    const updatedAttendances = await attendanceRepository().find({
      where: { sessionId },
      relations: ['student'],
    });
    
    successResponse(res, updatedAttendances, '批量点名成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/student/:studentId/statistics', async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const attendances = await attendanceRepository().find({
      where: { studentId },
      relations: ['session'],
    });
    
    const stats = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'present').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      late: attendances.filter(a => a.status === 'late').length,
      leave: attendances.filter(a => a.status === 'leave').length,
      makeup: attendances.filter(a => a.status === 'makeup').length,
      attendanceRate: 0,
      totalHours: 0,
    };
    
    attendances.forEach(a => {
      if (a.session && (a.status === 'present' || a.status === 'makeup')) {
        stats.totalHours += a.session.hours;
      }
    });
    
    if (stats.total > 0) {
      stats.attendanceRate = Math.round(((stats.present + stats.makeup) / stats.total) * 100);
    }
    
    successResponse(res, stats);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await attendanceRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const attendanceRoutes = router;
