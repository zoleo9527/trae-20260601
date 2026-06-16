import { Express } from "express";
import { ReviewController } from "../controller/ReviewController";
import { CompensationController } from "../controller/CompensationController";
import { AuditController } from "../controller/AuditController";
import { StoreController } from "../controller/StoreController";

export const registerRoutes = (app: Express) => {
  const reviewController = new ReviewController();
  const compensationController = new CompensationController();
  const auditController = new AuditController();
  const storeController = new StoreController();

  app.post("/api/reviews", reviewController.createReview.bind(reviewController));
  app.get("/api/reviews", reviewController.getReviews.bind(reviewController));
  app.get("/api/reviews/:id", reviewController.getReviewById.bind(reviewController));
  app.get("/api/reviews/:id/details", reviewController.getReviewWithDetails.bind(reviewController));
  app.put("/api/reviews/:id", reviewController.updateReview.bind(reviewController));
  app.post("/api/reviews/:id/assign", reviewController.assignHandler.bind(reviewController));
  app.post("/api/reviews/:id/resolve", reviewController.resolveReview.bind(reviewController));
  app.post("/api/reviews/:id/close", reviewController.closeReview.bind(reviewController));
  app.get("/api/reviews/pending", reviewController.getPendingReviews.bind(reviewController));
  app.get("/api/reviews/blocked", reviewController.getBlockedReviews.bind(reviewController));

  app.post("/api/compensations", compensationController.createCompensation.bind(compensationController));
  app.get("/api/compensations", compensationController.getCompensations.bind(compensationController));
  app.get("/api/compensations/:id", compensationController.getCompensationById.bind(compensationController));
  app.get("/api/compensations/:id/details", compensationController.getCompensationWithDetails.bind(compensationController));
  app.post("/api/compensations/:id/approve", compensationController.approveCompensation.bind(compensationController));
  app.post("/api/compensations/:id/reject", compensationController.rejectCompensation.bind(compensationController));
  app.post("/api/compensations/:id/process", compensationController.processCompensation.bind(compensationController));
  app.post("/api/compensations/:id/complete", compensationController.completeCompensation.bind(compensationController));
  app.get("/api/compensations/pending", compensationController.getPendingCompensations.bind(compensationController));
  app.get("/api/compensations/uncompleted", compensationController.getUncompletedCompensations.bind(compensationController));

  app.get("/api/audit/target/:targetId", auditController.getLogsByTargetId.bind(auditController));
  app.get("/api/audit/module/:module", auditController.getLogsByModule.bind(auditController));
  app.get("/api/audit/operator/:operatorName", auditController.getLogsByOperator.bind(auditController));
  app.get("/api/audit/date-range", auditController.getLogsByDateRange.bind(auditController));

  app.post("/api/stores", storeController.createStore.bind(storeController));
  app.get("/api/stores", storeController.getStores.bind(storeController));
  app.get("/api/stores/:id", storeController.getStoreById.bind(storeController));
  app.get("/api/stores/code/:storeCode", storeController.getStoreByCode.bind(storeController));
  app.put("/api/stores/:id", storeController.updateStore.bind(storeController));
  app.delete("/api/stores/:id", storeController.deleteStore.bind(storeController));
};
