import express, { type Request, type Response } from 'express';
import { mockApplications } from '../../src/data/mockData';
import type {
  SurrenderApplication,
  Inspection,
  CostBreakdown,
  Dispute,
  DisputeResponse,
} from '../../src/types';

const router = express.Router();

const applications = [...mockApplications];

const generateId = (prefix = 'id') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

router.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let result = applications;
  if (status && typeof status === 'string') {
    result = applications.filter((a) => a.status === status);
  }
  res.json({
    success: true,
    data: result,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const app = applications.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }
  res.json({
    success: true,
    data: app,
  });
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body as Omit<
    SurrenderApplication,
    'id' | 'createdAt' | 'updatedAt' | 'status' | 'confirmation'
  >;

  const newApp: SurrenderApplication = {
    ...body,
    id: generateId('app'),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmation: {
      id: generateId('conf'),
      disputes: [],
    },
  };

  applications.unshift(newApp);

  res.json({
    success: true,
    data: newApp,
  });
});

router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  applications[idx] = {
    ...applications[idx],
    status,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: applications[idx],
  });
});

router.put('/:id/inspection', (req: Request, res: Response) => {
  const { id } = req.params;
  const inspection = req.body as Inspection;

  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  applications[idx] = {
    ...applications[idx],
    inspection,
    status: 'costing',
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: applications[idx],
  });
});

router.put('/:id/cost', (req: Request, res: Response) => {
  const { id } = req.params;
  const costBreakdown = req.body as CostBreakdown;

  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  applications[idx] = {
    ...applications[idx],
    costBreakdown,
    status: 'confirming',
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: applications[idx],
  });
});

router.post('/:id/dispute', (req: Request, res: Response) => {
  const { id } = req.params;
  const disputeData = req.body as Omit<Dispute, 'id' | 'createdAt'>;

  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  const newDispute: Dispute = {
    ...disputeData,
    id: generateId('disp'),
    createdAt: new Date().toISOString(),
  };

  const existingConfirmation = applications[idx].confirmation || {
    id: generateId('conf'),
    disputes: [],
  };

  applications[idx] = {
    ...applications[idx],
    status: 'disputing',
    confirmation: {
      ...existingConfirmation,
      disputes: [...existingConfirmation.disputes, newDispute],
    },
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: applications[idx],
  });
});

router.put('/:id/dispute/:disputeId/respond', (req: Request, res: Response) => {
  const { id, disputeId } = req.params;
  const response = req.body as DisputeResponse;

  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  if (!applications[idx].confirmation) {
    return res.status(400).json({
      success: false,
      error: 'Confirmation not found',
    });
  }

  const updatedDisputes = applications[idx].confirmation!.disputes.map((d) =>
    d.id === disputeId ? { ...d, response } : d
  );

  let updatedCostBreakdown = applications[idx].costBreakdown;

  if (updatedCostBreakdown && response.adjustedAmount !== undefined && response.adjustedAmount !== 0) {
    const dispute = applications[idx].confirmation!.disputes.find((d) => d.id === disputeId);
    if (dispute) {
      const updatedDeductions = updatedCostBreakdown.deductions.map((d) => {
        if (d.id === dispute.deductionItemId) {
          const newAmount = Math.max(0, d.amount + response.adjustedAmount!);
          return {
            ...d,
            amount: newAmount,
            basis: d.basis + `（异议调整 ${response.adjustedAmount! >= 0 ? '+' : ''}${response.adjustedAmount}元）`,
          };
        }
        return d;
      });

      const totalDeduction = updatedDeductions.reduce((sum, d) => sum + d.amount, 0);
      const refundAmount = updatedCostBreakdown.totalDeposit - totalDeduction;

      updatedCostBreakdown = {
        ...updatedCostBreakdown,
        deductions: updatedDeductions,
        totalDeduction,
        refundAmount,
      };
    }
  }

  applications[idx] = {
    ...applications[idx],
    costBreakdown: updatedCostBreakdown,
    confirmation: {
      ...applications[idx].confirmation!,
      disputes: updatedDisputes,
    },
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: applications[idx],
  });
});

router.put('/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const { confirmerName } = req.body;

  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  if (!applications[idx].costBreakdown) {
    return res.status(400).json({
      success: false,
      error: '费用明细尚未完成，无法确认签署',
    });
  }

  const disputes = applications[idx].confirmation?.disputes || [];
  const hasUnresolvedDispute = disputes.some((d) => !d.response);
  if (hasUnresolvedDispute) {
    return res.status(400).json({
      success: false,
      error: '存在未回复的异议，请先处理所有异议后再签署确认',
    });
  }

  const hasUnsyncedAdjustment = disputes.some((d) => {
    if (d.response?.adjustedAmount === undefined || d.response.adjustedAmount === 0) {
      return false;
    }
    const deduction = applications[idx].costBreakdown?.deductions.find(
      (ded) => ded.id === d.deductionItemId
    );
    if (!deduction) return true;
    return !deduction.basis.includes('异议调整');
  });

  if (hasUnsyncedAdjustment) {
    return res.status(400).json({
      success: false,
      error: '异议金额调整尚未同步到扣减明细，请先完成费用明细重算后再签署确认',
    });
  }

  const existingConfirmation = applications[idx].confirmation || {
    id: generateId('conf'),
    disputes: [],
  };

  applications[idx] = {
    ...applications[idx],
    status: 'completed',
    confirmation: {
      ...existingConfirmation,
      finalConfirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmerName,
    },
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: applications[idx],
  });
});

router.get('/:id/calculate', (req: Request, res: Response) => {
  const { id } = req.params;
  const app = applications.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'Application not found',
    });
  }

  const totalDeposit = app.contract.depositAmount;
  let totalDeduction = 0;

  if (app.costBreakdown) {
    totalDeduction = app.costBreakdown.deductions.reduce(
      (sum, d) => sum + d.amount,
      0
    );
  }

  const refundAmount = totalDeposit - totalDeduction;

  res.json({
    success: true,
    data: {
      totalDeposit,
      totalDeduction,
      refundAmount,
      breakdown: app.costBreakdown,
    },
  });
});

router.get('/stats/summary', (req: Request, res: Response) => {
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    inspecting: applications.filter((a) => a.status === 'inspecting').length,
    costing: applications.filter((a) => a.status === 'costing').length,
    confirming: applications.filter((a) => a.status === 'confirming').length,
    disputing: applications.filter((a) => a.status === 'disputing').length,
    completed: applications.filter((a) => a.status === 'completed').length,
    totalDepositAmount: applications.reduce(
      (sum, a) => sum + a.contract.depositAmount,
      0
    ),
    totalRefundPending: applications
      .filter((a) => ['confirming', 'disputing'].includes(a.status))
      .reduce((sum, a) => sum + (a.costBreakdown?.refundAmount || 0), 0),
  };

  res.json({
    success: true,
    data: stats,
  });
});

export default router;
