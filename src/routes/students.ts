import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Note } from '../entities/Note';
import { Student } from '../entities/Student';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const studentRepository = () => AppDataSource.getRepository(Student);
const noteRepository = () => AppDataSource.getRepository(Note);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [students, total] = await studentRepository().findAndCount({
      ...options,
      relations: ['class'],
    });
    paginatedResponse(res, students, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const student = await studentRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['class', 'attendances', 'attendances.session', 'makeupRequests', 'certificates', 'certificates.shipment', 'notes'],
    });
    if (!student) return errorResponse(res, '学员不存在', 404);
    successResponse(res, student);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const student = studentRepository().create(req.body);
    await studentRepository().save(student);
    successResponse(res, student, '创建成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const student = await studentRepository().findOneBy({ id: Number(req.params.id) });
    if (!student) return errorResponse(res, '学员不存在', 404);
    studentRepository().merge(student, req.body);
    await studentRepository().save(student);
    successResponse(res, student, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await studentRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/batch/status', async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    await studentRepository().update(ids, { status });
    successResponse(res, { count: ids.length }, `批量更新状态成功`);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/batch/class', async (req: Request, res: Response) => {
  try {
    const { ids, classId } = req.body;
    await studentRepository().update(ids, { classId });
    successResponse(res, { count: ids.length }, `批量分班成功`);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id/notes', async (req: Request, res: Response) => {
  try {
    const notes = await noteRepository().find({
      where: { studentId: Number(req.params.id) },
      order: { createdAt: 'DESC' },
    });
    successResponse(res, notes);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const note = noteRepository().create({
      ...req.body,
      studentId: Number(req.params.id),
    });
    await noteRepository().save(note);
    successResponse(res, note, '添加备注成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const studentRoutes = router;
