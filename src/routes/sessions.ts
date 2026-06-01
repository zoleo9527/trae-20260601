import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Session } from '../entities/Session';
import { Student } from '../entities/Student';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const sessionRepository = () => AppDataSource.getRepository(Session);
const attendanceRepository = () => AppDataSource.getRepository(Attendance);
const studentRepository = () => AppDataSource.getRepository(Student);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [sessions, total] = await sessionRepository().findAndCount({
      ...options,
      relations: ['class'],
    });
    paginatedResponse(res, sessions, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await sessionRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['class', 'attendances', 'attendances.student'],
    });
    if (!session) return errorResponse(res, '场次不存在', 404);
    successResponse(res, session);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const session = sessionRepository().create(req.body);
    await sessionRepository().save(session);
    successResponse(res, session, '创建成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const session = await sessionRepository().findOneBy({ id: Number(req.params.id) });
    if (!session) return errorResponse(res, '场次不存在', 404);
    sessionRepository().merge(session, req.body);
    await sessionRepository().save(session);
    successResponse(res, session, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await sessionRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/:id/generate-attendance', async (req: Request, res: Response) => {
  try {
    const session = await sessionRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['class', 'class.students'],
    });
    if (!session) return errorResponse(res, '场次不存在', 404);

    const existingAttendances = await attendanceRepository().find({
      where: { sessionId: session.id },
    });
    const existingStudentIds = existingAttendances.map(a => a.studentId);

    const newAttendances: Attendance[] = [];
    session.class.students.forEach(student => {
      if (!existingStudentIds.includes(student.id)) {
        newAttendances.push(
          attendanceRepository().create({
            studentId: student.id,
            sessionId: session.id,
            status: 'absent',
          })
        );
      }
    });

    if (newAttendances.length > 0) {
      await attendanceRepository().save(newAttendances);
    }

    const allAttendances = await attendanceRepository().find({
      where: { sessionId: session.id },
      relations: ['student'],
    });

    successResponse(res, allAttendances, '考勤生成成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const sessionRoutes = router;
