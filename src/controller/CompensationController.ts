import { Request, Response } from "express";
import { CompensationService, CreateCompensationRequest, UpdateCompensationRequest, CompensationQuery } from "../service/CompensationService";
import { CompensationStatus, CompensationType, CompensationApprover } from "../entity/Compensation";
import { AuditOperatorRole } from "../entity/AuditLog";

export class CompensationController {
  private compensationService: CompensationService;

  constructor() {
    this.compensationService = new CompensationService();
  }

  async createCompensation(req: Request, res: Response) {
    const request: CreateCompensationRequest = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.compensationService.createCompensation(request, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getCompensationById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.compensationService.getCompensationById(id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async updateCompensation(req: Request, res: Response) {
    const { id } = req.params;
    const request: UpdateCompensationRequest = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.compensationService.updateCompensation(id, request, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getCompensations(req: Request, res: Response) {
    const query: CompensationQuery = {
      reviewId: req.query.reviewId as string,
      storeCode: req.query.storeCode as string,
      status: (req.query.status as CompensationStatus) || undefined,
      type: (req.query.type as CompensationType) || undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await this.compensationService.getCompensations(query);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async approveCompensation(req: Request, res: Response) {
    const { id } = req.params;
    const { approver, approverName } = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.compensationService.approveCompensation(id, approver, approverName, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async rejectCompensation(req: Request, res: Response) {
    const { id } = req.params;
    const { rejectReason } = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.compensationService.rejectCompensation(id, rejectReason, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async processCompensation(req: Request, res: Response) {
    const { id } = req.params;
    const { paymentTransactionId, processor, processorName } = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.compensationService.processCompensation(id, paymentTransactionId, processor, processorName, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async completeCompensation(req: Request, res: Response) {
    const { id } = req.params;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.compensationService.completeCompensation(id, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getPendingCompensations(req: Request, res: Response) {
    const result = await this.compensationService.getPendingCompensations();
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getUncompletedCompensations(req: Request, res: Response) {
    const result = await this.compensationService.getUncompletedCompensations();
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getCompensationWithDetails(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.compensationService.getCompensationWithDetails(id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }
}
