import { Router, Request, Response } from 'express';
import { arrivalNoticeService } from '../services/arrival-notice';
import { handoverService } from '../services/handover';
import { stuckOrderService } from '../services/stuck-order';

const router = Router();

/**
 * POST /api/arrival-notices
 *
 * 录入到达通知（到货后通知收货人提货）
 *
 * Body:
 *   loadingPlanId     string  装车计划ID
 *   wagonAllocationId string  车皮分配ID
 *   arrivalDate       string  到达日期
 *   consigneeName     string  收货人姓名
 *   consigneePhone    string  收货人电话
 *
 * Response: ArrivalNotice
 */
router.post('/', (req: Request, res: Response) => {
  const { loadingPlanId, wagonAllocationId, arrivalDate, consigneeName, consigneePhone } = req.body;

  if (!loadingPlanId || !wagonAllocationId || !arrivalDate || !consigneeName || !consigneePhone) {
    res.status(400).json({ error: '缺少必填字段：loadingPlanId, wagonAllocationId, arrivalDate, consigneeName, consigneePhone' });
    return;
  }

  try {
    const notice = arrivalNoticeService.recordArrival({
      loadingPlanId,
      wagonAllocationId,
      arrivalDate,
      consigneeName,
      consigneePhone,
    });
    res.status(201).json(notice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/arrival-notices/:noticeId/pickup
 *
 * 标记已提货（解决"到货无人提"卡单）
 *
 * Body:
 *   operatorId string 操作人ID
 *
 * Response: ArrivalNotice
 */
router.put('/:noticeId/pickup', (req: Request, res: Response) => {
  const { noticeId } = req.params;
  const { operatorId } = req.body;

  if (!operatorId) {
    res.status(400).json({ error: '缺少必填字段：operatorId' });
    return;
  }

  try {
    const notice = arrivalNoticeService.markPickedUp(noticeId, operatorId);
    res.json(notice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/arrival-notices
 *
 * 列出所有到达通知
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(arrivalNoticeService.list());
});

/**
 * GET /api/arrival-notices/:noticeId
 *
 * 获取到达通知详情（含交接和卡单）
 */
router.get('/:noticeId', (req: Request, res: Response) => {
  const notice = arrivalNoticeService.getById(req.params.noticeId);
  if (!notice) {
    res.status(404).json({ error: '到达通知不存在' });
    return;
  }

  const handovers = handoverService.getRecordsForEntity('arrival_notice', notice.id);
  const stuckOrders = stuckOrderService.getByEntity('arrival_notice', notice.id);
  res.json({ notice, handovers, stuckOrders });
});

export default router;
