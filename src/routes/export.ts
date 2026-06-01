import { createObjectCsvWriter } from 'csv-writer';
import { Request, Response, Router } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppDataSource } from '../data-source';
import { Attendance } from '../entities/Attendance';
import { Certificate } from '../entities/Certificate';
import { Shipment } from '../entities/Shipment';
import { Student } from '../entities/Student';
import { errorResponse, successResponse } from '../utils/response';

const router = Router();
const exportDir = join(__dirname, '../../exports');

if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

router.post('/students', async (req: Request, res: Response) => {
  try {
    const { filters = {}, columns = [] } = req.body;
    
    const where: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) where[key] = value;
    });
    
    const students = await AppDataSource.getRepository(Student).find({
      where,
      relations: ['class'],
    });
    
    const filename = `students_${Date.now()}.csv`;
    const filepath = join(exportDir, filename);
    
    const defaultColumns = [
      { id: 'id', title: 'ID' },
      { id: 'name', title: '姓名' },
      { id: 'studentNo', title: '学号' },
      { id: 'phone', title: '电话' },
      { id: 'className', title: '班级' },
      { id: 'status', title: '状态' },
      { id: 'attendedHours', title: '已上课时' },
      { id: 'createdAt', title: '创建时间' },
    ];
    
    const records = students.map(s => ({
      id: s.id,
      name: s.name,
      studentNo: s.studentNo,
      phone: s.phone,
      className: s.class?.name || '',
      status: s.status,
      attendedHours: s.attendedHours,
      createdAt: s.createdAt.toISOString(),
    }));
    
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: columns.length > 0 
        ? defaultColumns.filter(c => columns.includes(c.id))
        : defaultColumns,
    });
    
    await csvWriter.writeRecords(records);
    
    successResponse(res, { 
      filename, 
      filepath,
      count: students.length,
      downloadUrl: `/api/export/download/${filename}`,
    }, '导出成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/attendance', async (req: Request, res: Response) => {
  try {
    const { filters = {}, columns = [] } = req.body;
    
    const where: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) where[key] = value;
    });
    
    const attendances = await AppDataSource.getRepository(Attendance).find({
      where,
      relations: ['student', 'session', 'session.class'],
    });
    
    const filename = `attendance_${Date.now()}.csv`;
    const filepath = join(exportDir, filename);
    
    const defaultColumns = [
      { id: 'id', title: 'ID' },
      { id: 'studentName', title: '学员姓名' },
      { id: 'sessionName', title: '场次名称' },
      { id: 'className', title: '班级' },
      { id: 'status', title: '考勤状态' },
      { id: 'sessionDate', title: '考勤日期' },
      { id: 'createdAt', title: '创建时间' },
    ];
    
    const records = attendances.map(a => ({
      id: a.id,
      studentName: a.student?.name || '',
      sessionName: a.session?.name || '',
      className: a.session?.class?.name || '',
      status: a.status,
      sessionDate: a.session?.startTime.toISOString() || '',
      createdAt: a.createdAt.toISOString(),
    }));
    
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: columns.length > 0 
        ? defaultColumns.filter(c => columns.includes(c.id))
        : defaultColumns,
    });
    
    await csvWriter.writeRecords(records);
    
    successResponse(res, { 
      filename, 
      filepath,
      count: attendances.length,
      downloadUrl: `/api/export/download/${filename}`,
    }, '导出成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/certificates', async (req: Request, res: Response) => {
  try {
    const { filters = {}, columns = [] } = req.body;
    
    const where: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) where[key] = value;
    });
    
    const certificates = await AppDataSource.getRepository(Certificate).find({
      where,
      relations: ['student', 'shipment'],
    });
    
    const filename = `certificates_${Date.now()}.csv`;
    const filepath = join(exportDir, filename);
    
    const defaultColumns = [
      { id: 'id', title: 'ID' },
      { id: 'certificateNo', title: '证书编号' },
      { id: 'studentName', title: '学员姓名' },
      { id: 'certificateType', title: '证书类型' },
      { id: 'status', title: '状态' },
      { id: 'addressConfirmed', title: '地址确认' },
      { id: 'trackingNo', title: '快递单号' },
      { id: 'createdAt', title: '创建时间' },
    ];
    
    const records = certificates.map(c => ({
      id: c.id,
      certificateNo: c.certificateNo || '',
      studentName: c.student?.name || '',
      certificateType: c.certificateType,
      status: c.status,
      addressConfirmed: c.addressConfirmed ? '是' : '否',
      trackingNo: c.shipment?.trackingNo || '',
      createdAt: c.createdAt.toISOString(),
    }));
    
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: columns.length > 0 
        ? defaultColumns.filter(c => columns.includes(c.id))
        : defaultColumns,
    });
    
    await csvWriter.writeRecords(records);
    
    successResponse(res, { 
      filename, 
      filepath,
      count: certificates.length,
      downloadUrl: `/api/export/download/${filename}`,
    }, '导出成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/shipments', async (req: Request, res: Response) => {
  try {
    const { filters = {}, columns = [] } = req.body;
    
    const where: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) where[key] = value;
    });
    
    const shipments = await AppDataSource.getRepository(Shipment).find({
      where,
      relations: ['student', 'certificate'],
    });
    
    const filename = `shipments_${Date.now()}.csv`;
    const filepath = join(exportDir, filename);
    
    const defaultColumns = [
      { id: 'id', title: 'ID' },
      { id: 'trackingNo', title: '快递单号' },
      { id: 'courier', title: '快递公司' },
      { id: 'recipientName', title: '收件人' },
      { id: 'recipientPhone', title: '收件电话' },
      { id: 'recipientAddress', title: '收件地址' },
      { id: 'status', title: '状态' },
      { id: 'shippedAt', title: '发货时间' },
      { id: 'deliveredAt', title: '签收时间' },
    ];
    
    const records = shipments.map(s => ({
      id: s.id,
      trackingNo: s.trackingNo || '',
      courier: s.courier,
      recipientName: s.recipientName,
      recipientPhone: s.recipientPhone,
      recipientAddress: s.recipientAddress,
      status: s.status,
      shippedAt: s.shippedAt?.toISOString() || '',
      deliveredAt: s.deliveredAt?.toISOString() || '',
    }));
    
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: columns.length > 0 
        ? defaultColumns.filter(c => columns.includes(c.id))
        : defaultColumns,
    });
    
    await csvWriter.writeRecords(records);
    
    successResponse(res, { 
      filename, 
      filepath,
      count: shipments.length,
      downloadUrl: `/api/export/download/${filename}`,
    }, '导出成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/download/:filename', (req: Response, res: any) => {
  const filepath = join(exportDir, req.params.filename);
  if (!existsSync(filepath)) {
    return errorResponse(res, '文件不存在', 404);
  }
  res.download(filepath);
});

export const exportRoutes = router;
