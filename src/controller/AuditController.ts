import { Request, Response } from "express";
import { AuditService } from "../service/AuditService";
import { AuditModule } from "../entity/AuditLog";

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async getLogsByTargetId(req: Request, res: Response) {
    const { targetId } = req.params;
    const result = await this.auditService.getLogsByTargetId(targetId);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getLogsByModule(req: Request, res: Response) {
    const { module } = req.params;
    const result = await this.auditService.getLogsByModule(module as AuditModule);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getLogsByOperator(req: Request, res: Response) {
    const { operatorName } = req.params;
    const result = await this.auditService.getLogsByOperator(operatorName);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getLogsByDateRange(req: Request, res: Response) {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const result = await this.auditService.getLogsByDateRange(startDate, endDate);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }
}
