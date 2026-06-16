import { Request, Response } from "express";
import { ReviewService, CreateReviewRequest, UpdateReviewRequest, ReviewQuery } from "../service/ReviewService";
import { ReviewStatus, ReviewSource, ReviewLevel, ReviewType, HandlerRole } from "../entity/Review";
import { AuditOperatorRole } from "../entity/AuditLog";

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  async createReview(req: Request, res: Response) {
    const request: CreateReviewRequest = req.body;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.reviewService.createReview(request, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getReviewById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.reviewService.getReviewById(id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async getReviews(req: Request, res: Response) {
    const query: ReviewQuery = {
      storeCode: req.query.storeCode as string,
      region: req.query.region as string,
      status: (req.query.status as ReviewStatus) || undefined,
      level: (req.query.level as ReviewLevel) || undefined,
      type: (req.query.type as ReviewType) || undefined,
      source: (req.query.source as ReviewSource) || undefined,
      currentHandler: (req.query.currentHandler as HandlerRole) || undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await this.reviewService.getReviews(query);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async updateReview(req: Request, res: Response) {
    const { id } = req.params;
    const request: UpdateReviewRequest = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.reviewService.updateReview(id, request, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async assignHandler(req: Request, res: Response) {
    const { id } = req.params;
    const { handlerRole, handlerName } = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.reviewService.assignHandler(id, handlerRole, handlerName, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async resolveReview(req: Request, res: Response) {
    const { id } = req.params;
    const { notes } = req.body;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.reviewService.resolveReview(id, notes, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async closeReview(req: Request, res: Response) {
    const { id } = req.params;
    const operatorRole = (req.headers["x-operator-role"] as AuditOperatorRole) || AuditOperatorRole.SYSTEM;
    const operatorName = req.headers["x-operator-name"] as string || "system";
    const ipAddress = req.ip || "127.0.0.1";

    const result = await this.reviewService.closeReview(id, operatorRole, operatorName, ipAddress);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getPendingReviews(req: Request, res: Response) {
    const result = await this.reviewService.getPendingReviews();
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getBlockedReviews(req: Request, res: Response) {
    const result = await this.reviewService.getBlockedReviews();
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getReviewWithDetails(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.reviewService.getReviewWithDetails(id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }
}
