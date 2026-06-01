import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Class } from '../entities/Class';
import { Student } from '../entities/Student';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const classRepository = () => AppDataSource.getRepository(Class);
const studentRepository = () => AppDataSource.getRepository(Student);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [classes, total] = await classRepository().findAndCount({
      ...options,
      relations: ['students'],
    });
    paginatedResponse(res, classes, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cls = await classRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['students', 'students.attendances'],
    });
    if (!cls) return errorResponse(res, '班级不存在', 404);
    successResponse(res, cls);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const cls = classRepository().create(req.body);
    await classRepository().save(cls);
    successResponse(res, cls, '创建成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const cls = await classRepository().findOneBy({ id: Number(req.params.id) });
    if (!cls) return errorResponse(res, '班级不存在', 404);
    classRepository().merge(cls, req.body);
    await classRepository().save(cls);
    successResponse(res, cls, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await classRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/batch/status', async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    await classRepository().update(ids, { status });
    successResponse(res, { count: ids.length }, `批量更新状态成功`);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const classRoutes = router;
