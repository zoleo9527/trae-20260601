import { Router, Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { sendSuccess, sendFail } from '../common/response';
import { ErrorCode, BusinessError } from '../common/errorCode';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

router.use(authMiddleware);

router.get('/todo', async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const todos = await orderService.getTodoList(req.currentUser.id, req.currentUser.role);
    sendSuccess(res, todos);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    const orders = await orderService.getAllOrders({
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    sendSuccess(res, orders);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderDetail(req.params.id);
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.post('/', requireRole(Role.DORM_MANAGER), async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const { dormitory, roomNumber, issueType, description } = req.body;
    
    if (!dormitory || !roomNumber || !issueType || !description) {
      return sendFail(res, ErrorCode.PARAM_MISSING);
    }

    const order = await orderService.createOrder({
      dormitory,
      roomNumber,
      issueType,
      description,
      creatorId: req.currentUser.id,
    });
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.post('/:id/assign', requireRole(Role.LOGISTICS_SUPERVISOR), async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const { assigneeId, remark } = req.body;
    
    if (!assigneeId) {
      return sendFail(res, ErrorCode.PARAM_MISSING);
    }

    const order = await orderService.assignOrder({
      orderId: req.params.id,
      assigneeId,
      operatorId: req.currentUser.id,
      remark,
    });
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.post('/:id/materials', requireRole(Role.REPAIR_WORKER), async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const { materials } = req.body;
    
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return sendFail(res, ErrorCode.PARAM_MISSING, '材料列表不能为空');
    }

    const order = await orderService.registerMaterials({
      orderId: req.params.id,
      materials,
      operatorId: req.currentUser.id,
    });
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.post('/:id/fees', requireRole(Role.REPAIR_WORKER), async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const { fees } = req.body;
    
    if (!fees || !Array.isArray(fees) || fees.length === 0) {
      return sendFail(res, ErrorCode.PARAM_MISSING, '费用列表不能为空');
    }

    const order = await orderService.registerFees({
      orderId: req.params.id,
      fees,
      operatorId: req.currentUser.id,
    });
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.post('/:id/audit', requireRole(Role.LOGISTICS_SUPERVISOR), async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const { auditResult, auditOpinion, returnReason } = req.body;
    
    if (!auditResult || !['APPROVED', 'REJECTED'].includes(auditResult)) {
      return sendFail(res, ErrorCode.PARAM_INVALID, '审核结果无效');
    }

    if (auditResult === 'REJECTED' && !returnReason) {
      return sendFail(res, ErrorCode.PARAM_MISSING, '退回时必须填写退回原因');
    }

    const order = await orderService.auditOrder({
      orderId: req.params.id,
      auditorId: req.currentUser.id,
      auditResult,
      auditOpinion,
      returnReason,
    });
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

router.post('/:id/note', async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    const { note } = req.body;
    
    if (!note) {
      return sendFail(res, ErrorCode.PARAM_MISSING, '备注内容不能为空');
    }

    const order = await orderService.supplementNote({
      orderId: req.params.id,
      note,
      operatorId: req.currentUser.id,
    });
    sendSuccess(res, order);
  } catch (error) {
    if (error instanceof BusinessError) {
      sendFail(res, error.code, error.message);
    } else {
      sendFail(res, ErrorCode.INTERNAL_ERROR);
    }
  }
});

export default router;
