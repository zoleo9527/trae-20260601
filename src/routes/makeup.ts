import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { MakeupRequest } from '../entities/MakeupRequest';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const makeupRepository = () => AppDataSource.getRepository(MakeupRequest);
const attendanceRepository = () => AppDataSource.getRepository(Attendance);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [requests, total] = await makeupRepository().findAndCount({
      ...options,
      relations: ['student', 'originalAttendance', 'originalAttendance.session'],
    });
    paginatedResponse(res, requests, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const request = await makeupRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['student', 'originalAttendance', 'originalAttendance.session'],
    });
    if (!request) return errorResponse(res, '补课申请不存在', 404);
    successResponse(res, request);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const request = makeupRepository().create(req.body);
    await makeupRepository().save(request);
    
    const attendance = await attendanceRepository().findOneBy({ id: req.body.originalAttendanceId });
    if (attendance) {
      attendance.makeupApplied = true;
      await attendanceRepository().save(attendance);
    }
    
    successResponse(res, request, '申请成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const request = await makeupRepository().findOneBy({ id: Number(req.params.id) });
    if (!request) return errorResponse(res, '补课申请不存在', 404);
    
    request.status = 'approved';
    request.approvedBy = req.body.approvedBy || 'admin';
    request.approvedAt = new Date();
    request.adminRemark = req.body.adminRemark;
    await makeupRepository().save(request);
    
    successResponse(res, request, '审核通过');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const request = await makeupRepository().findOneBy({ id: Number(req.params.id) });
    if (!request) return errorResponse(res, '补课申请不存在', 404);
    
    request.status = 'rejected';
    request.approvedBy = req.body.approvedBy || 'admin';
    request.approvedAt = new Date();
    request.adminRemark = req.body.adminRemark;
    await makeupRepository().save(request);
    
    const attendance = await attendanceRepository().findOneBy({ id: request.originalAttendanceId });
    if (attendance) {
      attendance.makeupApplied = false;
      await attendanceRepository().save(attendance);
    }
    
    successResponse(res, request, '已拒绝');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const request = await makeupRepository().findOneBy({ id: Number(req.params.id) });
    if (!request) return errorResponse(res, '补课申请不存在', 404);
    
    request.status = 'completed';
    request.completedAt = new Date();
    await makeupRepository().save(request);
    
    const attendance = await attendanceRepository().findOneBy({ id: request.originalAttendanceId });
    if (attendance) {
      attendance.status = 'makeup';
      attendance.makeupCompleted = true;
      await attendanceRepository().save(attendance);
    }
    
    successResponse(res, request, '补课完成');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await makeupRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const makeupRoutes = router;
