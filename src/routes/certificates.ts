import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Certificate } from '../entities/Certificate';
import { Student } from '../entities/Student';
import { calcHoursFromAttendances } from '../utils/hours';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const certificateRepository = () => AppDataSource.getRepository(Certificate);
const studentRepository = () => AppDataSource.getRepository(Student);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [certificates, total] = await certificateRepository().findAndCount({
      ...options,
      relations: ['student', 'shipment'],
    });
    paginatedResponse(res, certificates, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/student/:studentId/check-eligibility', async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const student = await studentRepository().findOne({
      where: { id: studentId },
      relations: ['class', 'attendances', 'attendances.session'],
    });

    if (!student) return errorResponse(res, '学员不存在', 404);

    const totalSessions = student.attendances.length;
    const attendedSessions = student.attendances.filter(
      a => a.status === 'present' || a.status === 'makeup'
    ).length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions * 100) : 0;
    const requiredHours = student.class ? student.class.totalHours : 0;
    const attendedHours = calcHoursFromAttendances(student.attendances);

    const eligibility = {
      studentId,
      studentName: student.name,
      attendedHours,
      requiredHours,
      attendanceRate: Math.round(attendanceRate),
      totalSessions,
      attendedSessions,
      isEligible: attendedHours >= requiredHours && attendanceRate >= 80,
      reasons: [] as string[],
    };

    if (attendedHours < requiredHours) {
      eligibility.reasons.push(`课时不足: 当前${attendedHours}小时，需要${requiredHours}小时`);
    }

    if (attendanceRate < 80) {
      eligibility.reasons.push(`出勤率不足: 当前${Math.round(attendanceRate)}%，需要80%`);
    }

    successResponse(res, eligibility);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const certificate = await certificateRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['student', 'shipment'],
    });
    if (!certificate) return errorResponse(res, '证书不存在', 404);
    successResponse(res, certificate);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const certificate = certificateRepository().create(req.body);
    await certificateRepository().save(certificate);
    successResponse(res, certificate, '创建成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const certificate = await certificateRepository().findOneBy({ id: Number(req.params.id) });
    if (!certificate) return errorResponse(res, '证书不存在', 404);
    certificateRepository().merge(certificate, req.body);
    await certificateRepository().save(certificate);
    successResponse(res, certificate, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/submit-review', async (req: Request, res: Response) => {
  try {
    const certificate = await certificateRepository().findOneBy({ id: Number(req.params.id) });
    if (!certificate) return errorResponse(res, '证书不存在', 404);
    
    certificate.status = 'reviewing';
    await certificateRepository().save(certificate);
    
    successResponse(res, certificate, '已提交审核');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const certificate = await certificateRepository().findOneBy({ id: Number(req.params.id) });
    if (!certificate) return errorResponse(res, '证书不存在', 404);
    
    certificate.status = 'approved';
    certificate.reviewedBy = req.body.reviewedBy || 'admin';
    certificate.reviewedAt = new Date();
    await certificateRepository().save(certificate);
    
    successResponse(res, certificate, '审核通过');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const certificate = await certificateRepository().findOneBy({ id: Number(req.params.id) });
    if (!certificate) return errorResponse(res, '证书不存在', 404);
    
    certificate.status = 'rejected';
    certificate.reviewedBy = req.body.reviewedBy || 'admin';
    certificate.reviewedAt = new Date();
    certificate.rejectReason = req.body.rejectReason;
    await certificateRepository().save(certificate);
    
    successResponse(res, certificate, '已拒绝');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/print', async (req: Request, res: Response) => {
  try {
    const certificate = await certificateRepository().findOneBy({ id: Number(req.params.id) });
    if (!certificate) return errorResponse(res, '证书不存在', 404);
    
    certificate.status = 'printed';
    certificate.printedAt = new Date();
    certificate.certificateNo = req.body.certificateNo || `CERT${Date.now()}`;
    await certificateRepository().save(certificate);
    
    successResponse(res, certificate, '证书已打印');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await certificateRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const certificateRoutes = router;
