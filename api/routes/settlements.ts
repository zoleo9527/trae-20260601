
import { Router, type Request, type Response } from 'express';
import { settlements, settlementAdjustments, disputes } from '../data/store.js';
import type { Settlement, SettlementAdjustment, Dispute, DisputeStatus } from '../../shared/types.js';

const router = Router();

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  const totalAmount = settlements.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPlatformShare = settlements.reduce((sum, s) => sum + s.platformShare, 0);
  const totalPartnerShare = settlements.reduce((sum, s) => sum + s.partnerShare, 0);
  const totalRefundDeduction = settlements.reduce((sum, s) => sum + s.refundDeduction, 0);

  const overview = {
    totalAmount,
    totalPlatformShare,
    totalPartnerShare,
    totalRefundDeduction,
    settlementCount: settlements.length,
    disputedCount: settlements.filter((s) => s.status === 'disputed').length,
  };

  res.json({
    success: true,
    data: overview,
  });
});

router.get('/details', async (req: Request, res: Response): Promise<void> => {
  const { stationId, status } = req.query;

  let filteredSettlements = [...settlements] as Settlement[];

  if (stationId) {
    filteredSettlements = filteredSettlements.filter((s) => s.stationId === stationId);
  }
  if (status) {
    filteredSettlements = filteredSettlements.filter((s) => s.status === status);
  }

  res.json({
    success: true,
    data: filteredSettlements,
  });
});

router.get('/adjustments', async (req: Request, res: Response): Promise<void> => {
  const { stationId, type } = req.query;

  let filteredAdjustments = [...settlementAdjustments] as SettlementAdjustment[];

  if (stationId) {
    filteredAdjustments = filteredAdjustments.filter((a) => a.stationId === stationId);
  }
  if (type) {
    filteredAdjustments = filteredAdjustments.filter((a) => a.type === type);
  }

  res.json({
    success: true,
    data: filteredAdjustments,
  });
});

router.get('/disputes', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;

  let filteredDisputes = [...disputes] as Dispute[];

  if (status) {
    filteredDisputes = filteredDisputes.filter((d) => d.status === status);
  }

  res.json({
    success: true,
    data: filteredDisputes,
  });
});

router.put('/disputes/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, handler, resolution } = req.body as {
    status?: DisputeStatus;
    handler?: string;
    resolution?: string;
  };

  const dispute = disputes.find((d) => d.id === id);

  if (!dispute) {
    res.status(404).json({
      success: false,
      message: '异议不存在',
    });
    return;
  }

  if (status) dispute.status = status;
  if (handler) dispute.handler = handler;
  if (resolution) dispute.resolution = resolution;
  if (status === 'resolved' || status === 'rejected') {
    dispute.resolvedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    data: dispute as Dispute,
    message: '异议处理成功',
  });
});

export default router;
