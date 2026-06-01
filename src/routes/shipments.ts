import { Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import { Certificate } from '../entities/Certificate';
import { Shipment } from '../entities/Shipment';
import { errorResponse, paginatedResponse, parseListQuery, successResponse } from '../utils/response';

const router = Router();
const shipmentRepository = () => AppDataSource.getRepository(Shipment);
const certificateRepository = () => AppDataSource.getRepository(Certificate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = parseListQuery(req);
    const [shipments, total] = await shipmentRepository().findAndCount({
      ...options,
      relations: ['student', 'certificate'],
    });
    paginatedResponse(res, shipments, total, Number(req.query.page || 1), Number(req.query.pageSize || 20));
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOne({
      where: { id: Number(req.params.id) },
      relations: ['student', 'certificate'],
    });
    if (!shipment) return errorResponse(res, '寄送单不存在', 404);
    successResponse(res, shipment);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const shipment = shipmentRepository().create(req.body);
    await shipmentRepository().save(shipment);
    
    const certificate = await certificateRepository().findOneBy({ id: req.body.certificateId });
    if (certificate) {
      certificate.status = 'shipped';
      await certificateRepository().save(certificate);
    }
    
    successResponse(res, shipment, '创建成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOneBy({ id: Number(req.params.id) });
    if (!shipment) return errorResponse(res, '寄送单不存在', 404);
    shipmentRepository().merge(shipment, req.body);
    await shipmentRepository().save(shipment);
    successResponse(res, shipment, '更新成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/ship', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOneBy({ id: Number(req.params.id) });
    if (!shipment) return errorResponse(res, '寄送单不存在', 404);
    
    shipment.status = 'shipped';
    shipment.trackingNo = req.body.trackingNo;
    shipment.shippedAt = new Date();
    await shipmentRepository().save(shipment);
    
    successResponse(res, shipment, '已发货');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/in-transit', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOneBy({ id: Number(req.params.id) });
    if (!shipment) return errorResponse(res, '寄送单不存在', 404);
    
    shipment.status = 'in_transit';
    shipment.currentLocation = req.body.currentLocation;
    await shipmentRepository().save(shipment);
    
    successResponse(res, shipment, '运输中');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/deliver', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOneBy({ id: Number(req.params.id) });
    if (!shipment) return errorResponse(res, '寄送单不存在', 404);
    
    shipment.status = 'delivered';
    shipment.deliveredAt = new Date();
    await shipmentRepository().save(shipment);
    
    const certificate = await certificateRepository().findOneBy({ id: shipment.certificateId });
    if (certificate) {
      certificate.status = 'delivered';
      await certificateRepository().save(certificate);
    }
    
    successResponse(res, shipment, '已签收');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.put('/:id/return', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOneBy({ id: Number(req.params.id) });
    if (!shipment) return errorResponse(res, '寄送单不存在', 404);
    
    shipment.status = 'returned';
    shipment.returnedAt = new Date();
    shipment.returnReason = req.body.returnReason;
    await shipmentRepository().save(shipment);
    
    successResponse(res, shipment, '已退回');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.get('/tracking/:trackingNo', async (req: Request, res: Response) => {
  try {
    const shipment = await shipmentRepository().findOne({
      where: { trackingNo: req.params.trackingNo },
      relations: ['student', 'certificate'],
    });
    if (!shipment) return errorResponse(res, '快递单号不存在', 404);
    successResponse(res, shipment);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await shipmentRepository().delete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
});

export const shipmentRoutes = router;
