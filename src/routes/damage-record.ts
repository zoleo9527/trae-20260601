import { Router, Request, Response } from 'express';
import { damageRecordService } from '../services/damage-record';
import { handoverService } from '../services/handover';
import { stuckOrderService } from '../services/stuck-order';

const router = Router();

/**
 * POST /api/damage-records
 *
 * 录入货损记录
 * 若无照片将立即触发 critical 卡单，并阻断车皮分配确认流程
 *
 * Body:
 *   loadingPlanId     string   装车计划ID
 *   wagonAllocationId string   车皮分配ID
 *   reportedBy        string   报告人
 *   damageType        string   损类型
 *   damageDescription string   损描述
 *   photoUrls?        string[] 现场照片URL列表
 *
 * Response: { record: DamageRecord, stuckOrders: StuckOrder[] }
 */
router.post('/', (req: Request, res: Response) => {
  const { loadingPlanId, wagonAllocationId, reportedBy, damageType, damageDescription, photoUrls } = req.body;

  if (!loadingPlanId || !wagonAllocationId || !reportedBy || !damageType || !damageDescription) {
    res.status(400).json({ error: '缺少必填字段：loadingPlanId, wagonAllocationId, reportedBy, damageType, damageDescription' });
    return;
  }

  try {
    const record = damageRecordService.record({
      loadingPlanId,
      wagonAllocationId,
      reportedBy,
      damageType,
      damageDescription,
      photoUrls,
    });
    const stuckOrders = stuckOrderService.getByEntity('damage_record', record.id);
    res.status(201).json({ record, stuckOrders });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/damage-records/:recordId/photos
 *
 * 补充货损照片（解除"缺照片"卡单）
 *
 * Body:
 *   photoUrls string[] 照片URL列表
 *
 * Response: { record: DamageRecord, resolved: boolean }
 */
router.put('/:recordId/photos', (req: Request, res: Response) => {
  const { recordId } = req.params;
  const { photoUrls } = req.body;

  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    res.status(400).json({ error: '缺少必填字段：photoUrls (非空数组)' });
    return;
  }

  try {
    const record = damageRecordService.addPhotos(recordId, photoUrls);
    res.json({ record, resolved: record.hasPhoto });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/damage-records
 *
 * 列出所有货损记录
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(damageRecordService.list());
});

/**
 * GET /api/damage-records/:recordId
 *
 * 获取货损记录详情（含交接和卡单）
 */
router.get('/:recordId', (req: Request, res: Response) => {
  const record = damageRecordService.getById(req.params.recordId);
  if (!record) {
    res.status(404).json({ error: '货损记录不存在' });
    return;
  }

  const handovers = handoverService.getRecordsForEntity('damage_record', record.id);
  const stuckOrders = stuckOrderService.getByEntity('damage_record', record.id);
  res.json({ record, handovers, stuckOrders });
});

export default router;
