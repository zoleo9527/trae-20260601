import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import CompensationService from '../services/CompensationService';
import CompensationStatus, { CompensationStatusDescription } from '../models/CompensationStatus';
import { CompensationTypeDescription } from '../models/Compensation';

class CompensationController {
  async create(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.createCompensation(req.body);
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.getCompensationById(parseInt(req.params.id));
      if (!compensation) {
        return res.status(404).json({ success: false, error: '补偿记录不存在' });
      }
      
      const compData = compensation.toJSON();
      compData.statusDescription = CompensationStatusDescription[compensation.status];
      compData.typeDescription = CompensationTypeDescription[compensation.type];
      
      res.json({ success: true, data: compData });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByClaimId(req: AuthRequest, res: Response) {
    try {
      const compensations = await CompensationService.getCompensationsByClaimId(parseInt(req.params.claimId));
      const compsWithDesc = compensations.map(c => ({
        ...c.toJSON(),
        statusDescription: CompensationStatusDescription[c.status],
        typeDescription: CompensationTypeDescription[c.type],
      }));
      res.json({ success: true, data: compsWithDesc });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.updateCompensation(parseInt(req.params.id), req.body);
      if (!compensation) {
        return res.status(404).json({ success: false, error: '补偿记录不存在' });
      }
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async process(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.processCompensation({
        compensationId: parseInt(req.params.id),
        processedBy: req.user!.id,
      });
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async approve(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.approveCompensation({
        compensationId: parseInt(req.params.id),
        approvedBy: req.user!.id,
        ...req.body,
      });
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async pay(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.payCompensation({
        compensationId: parseInt(req.params.id),
        paidBy: req.user!.id,
      });
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async complete(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.completeCompensation(parseInt(req.params.id));
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async cancel(req: AuthRequest, res: Response) {
    try {
      const compensation = await CompensationService.cancelCompensation(parseInt(req.params.id));
      res.json({
        success: true,
        data: {
          ...compensation.toJSON(),
          statusDescription: CompensationStatusDescription[compensation.status],
          typeDescription: CompensationTypeDescription[compensation.type],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async listPending(req: AuthRequest, res: Response) {
    try {
      const compensations = await CompensationService.getCompensationByStatus(CompensationStatus.PENDING);
      const compsWithDesc = compensations.map(c => ({
        ...c.toJSON(),
        statusDescription: CompensationStatusDescription[c.status],
        typeDescription: CompensationTypeDescription[c.type],
      }));
      res.json({ success: true, data: compsWithDesc });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export default new CompensationController();