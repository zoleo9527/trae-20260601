import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import WarrantyClaimService from '../services/WarrantyClaimService';
import ClaimStatus, { ClaimStatusDescription } from '../models/ClaimStatus';
import { ClaimStatusTransitions } from '../models/ClaimStatus';
import { CompensationTypeDescription } from '../models/Compensation';

class WarrantyClaimController {
  async create(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.createClaim({
        ...req.body,
        createdBy: req.user!.id,
        storeId: req.user!.storeId,
      });
      res.json({ success: true, data: claim });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.getClaimById(parseInt(req.params.id));
      if (!claim) {
        return res.status(404).json({ success: false, error: '申诉不存在' });
      }
      
      const claimData = claim.toJSON();
      claimData.statusDescription = ClaimStatusDescription[claim.status];
      claimData.availableTransitions = ClaimStatusTransitions[claim.status];
      
      if (claimData.Compensation) {
        claimData.Compensation.typeDescription = CompensationTypeDescription[claimData.Compensation.type];
      }
      
      res.json({ success: true, data: claimData });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const { status, customerName, vehiclePlate, isRisk, startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const filter = {
        status: status ? (status as ClaimStatus) : undefined,
        storeId: req.user!.role === 'ADMIN' ? undefined : req.user!.storeId,
        customerName: customerName as string,
        vehiclePlate: vehiclePlate as string,
        isRisk: isRisk ? isRisk === 'true' : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      };

      const result = await WarrantyClaimService.getClaims(filter);
      const claims = result.rows.map(claim => {
        const claimData = claim.toJSON();
        claimData.statusDescription = ClaimStatusDescription[claim.status];
        return claimData;
      });

      res.json({
        success: true,
        data: claims,
        pagination: {
          page: filter.page,
          pageSize: filter.pageSize,
          total: result.count,
          totalPages: Math.ceil(result.count / filter.pageSize),
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.updateClaim(parseInt(req.params.id), req.body);
      if (!claim) {
        return res.status(404).json({ success: false, error: '申诉不存在' });
      }
      res.json({ success: true, data: claim });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async technicianReview(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.technicianReview({
        claimId: parseInt(req.params.id),
        technicianId: req.user!.id,
        ...req.body,
      });
      res.json({
        success: true,
        data: {
          ...claim.toJSON(),
          statusDescription: ClaimStatusDescription[claim.status],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async managerReview(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.managerReview({
        claimId: parseInt(req.params.id),
        managerId: req.user!.id,
        ...req.body,
      });
      res.json({
        success: true,
        data: {
          ...claim.toJSON(),
          statusDescription: ClaimStatusDescription[claim.status],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async startCompensation(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.startCompensation(parseInt(req.params.id));
      res.json({
        success: true,
        data: {
          ...claim.toJSON(),
          statusDescription: ClaimStatusDescription[claim.status],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async complete(req: AuthRequest, res: Response) {
    try {
      const claim = await WarrantyClaimService.completeClaim(parseInt(req.params.id));
      res.json({
        success: true,
        data: {
          ...claim.toJSON(),
          statusDescription: ClaimStatusDescription[claim.status],
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const success = await WarrantyClaimService.deleteClaim(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ success: false, error: '申诉不存在' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const [pendingClaims, riskClaims, recentChanges] = await Promise.all([
        WarrantyClaimService.getPendingClaims(req.user!.role === 'ADMIN' ? undefined : req.user!.storeId),
        WarrantyClaimService.getRiskClaims(req.user!.role === 'ADMIN' ? undefined : req.user!.storeId),
        WarrantyClaimService.getRecentChanges(10),
      ]);

      const pendingWithDesc = pendingClaims.map(c => ({
        ...c.toJSON(),
        statusDescription: ClaimStatusDescription[c.status],
      }));

      const riskWithDesc = riskClaims.map(c => ({
        ...c.toJSON(),
        statusDescription: ClaimStatusDescription[c.status],
      }));

      const recentWithDesc = recentChanges.map(c => ({
        ...c.toJSON(),
        statusDescription: ClaimStatusDescription[c.status],
      }));

      res.json({
        success: true,
        data: {
          pendingClaims: pendingWithDesc,
          riskClaims: riskWithDesc,
          recentChanges: recentWithDesc,
          summary: {
            pendingCount: pendingClaims.length,
            riskCount: riskClaims.length,
          },
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export default new WarrantyClaimController();