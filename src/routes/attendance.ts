import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { recalcStudentHours } from '../utils/hours';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const attendanceRepository = () => AppDataSource.getRepository(Attendance);

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

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { sessionId, attendances } = req.body;
    const affectedStudentIds = new Set<number>();

    for (const item of attendances) {
      const attendance = await attendanceRepository().findOneBy({
        sessionId,
        studentId: item.studentId,
      });

      if (attendance) {
        const oldStatus = attendance.status;
        attendanceRepository().merge(attendance, item);
        await attendanceRepository().save(attendance);

        if (item.status && item.status !== oldStatus) {
          affectedStudentIds.add(item.studentId);
        }
      }
    }

    for (const studentId of affectedStudentIds) {
      await recalcStudentHours(studentId);
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
    const attendance = await attendanceRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['session'],
    });
    if (!attendance) return errorResponse(res, '考勤记录不存在', 404);

    const oldStatus = attendance.status;
    attendanceRepository().merge(attendance, req.body);
    await attendanceRepository().save(attendance);

    if (req.body.status && req.body.status !== oldStatus) {
      await recalcStudentHours(attendance.studentId);
    }

    const refreshed = await attendanceRepository().findOne({
      where: { id: attendance.id },
      relations: ['student', 'session'],
    });

    successResponse(res, refreshed, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const attendance = await attendanceRepository().findOneBy({ id: Number(req.params.id) });
    if (!attendance) return errorResponse(res, '考勤记录不存在', 404);

    await attendanceRepository().remove(attendance);
    await recalcStudentHours(attendance.studentId);

    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const attendanceRoutes = router;
