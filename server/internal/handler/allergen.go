package handler

import (
	"central-kitchen/internal/database"
	"central-kitchen/internal/errcode"
	"central-kitchen/internal/middleware"
	"central-kitchen/internal/models"
	"central-kitchen/internal/service"
	"central-kitchen/internal/utils/response"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SubmitAllergenReviewRequest struct {
	Status            models.AllergenReviewStatus `json:"status"`
	OverallResult     string                      `json:"overall_result"`
	Findings          string                      `json:"findings"`
	CorrectiveActions string                      `json:"corrective_actions"`
	CheckItems        []AllergenCheckItemUpdate   `json:"check_items"`
}

type AllergenCheckItemUpdate struct {
	ID                     uuid.UUID `json:"id"`
	IsContained            bool      `json:"is_contained"`
	LabelVerified          bool      `json:"label_verified"`
	BatchVerified          bool      `json:"batch_verified"`
	CrossContaminationRisk string    `json:"cross_contamination_risk"`
	Remarks                string    `json:"remarks"`
}

type VerifyAllergenReviewRequest struct {
	Status   models.AllergenReviewStatus `json:"status"`
	Findings string                      `json:"findings"`
	Remarks  string                      `json:"remarks"`
}

func GetAllergenReviews(c *fiber.Ctx) error {
	status := c.Query("status")

	var reviews []models.AllergenReview
	query := database.DB.Preload("CheckedByUser").
		Preload("VerifiedByUser").
		Preload("Requisition").
		Preload("Requisition.PurchaseOrder").
		Preload("CheckItems")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at desc").Find(&reviews).Error; err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, reviews)
}

func GetAllergenReview(c *fiber.Ctx) error {
	id := c.Params("id")
	reviewID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid allergen review id")
	}

	var review models.AllergenReview
	if err := database.DB.Preload("CheckedByUser").
		Preload("VerifiedByUser").
		Preload("Requisition").
		Preload("Requisition.PurchaseOrder").
		Preload("Requisition.PurchaseOrder.CreatedByUser").
		Preload("Requisition.PickedByUser").
		Preload("Requisition.Items.PurchaseItem").
		Preload("CheckItems").
		Where("id = ?", reviewID).First(&review).Error; err != nil {
		return response.Error(c, errcode.ErrAllergenReviewNotFound)
	}

	return response.Success(c, review)
}

func GetAllergenReviewByRequisition(c *fiber.Ctx) error {
	id := c.Params("requisitionId")
	reqID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid requisition id")
	}

	var review models.AllergenReview
	if err := database.DB.Preload("CheckedByUser").
		Preload("VerifiedByUser").
		Preload("Requisition").
		Preload("Requisition.PurchaseOrder").
		Preload("Requisition.PickedByUser").
		Preload("Requisition.Items.PurchaseItem").
		Preload("CheckItems").
		Where("requisition_id = ?", reqID).First(&review).Error; err != nil {
		return response.Error(c, errcode.ErrAllergenReviewNotFound)
	}

	return response.Success(c, review)
}

func SubmitAllergenReview(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)
	id := c.Params("id")
	reviewID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid allergen review id")
	}

	var req SubmitAllergenReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var review models.AllergenReview
	if err := database.DB.Preload("Requisition").Where("id = ?", reviewID).First(&review).Error; err != nil {
		return response.Error(c, errcode.ErrAllergenReviewNotFound)
	}

	if review.CheckedBy != userID {
		return response.Error(c, errcode.ErrForbidden, "only the creator can submit the review")
	}

	if review.Status != models.AllergenStatusPending && review.Status != models.AllergenStatusReviewing {
		return response.Error(c, errcode.ErrAllergenReviewStatus,
			fmt.Sprintf("cannot submit review when status is %s", review.Status))
	}

	if req.Status != models.AllergenStatusPassed && req.Status != models.AllergenStatusFailed {
		return response.Error(c, errcode.ErrInvalidParams, "status must be 'passed' or 'failed'")
	}

	tx := database.DB.Begin()

	for _, itemUpdate := range req.CheckItems {
		var item models.AllergenCheckItem
		if err := tx.Where("id = ? AND allergen_review_id = ?", itemUpdate.ID, reviewID).First(&item).Error; err != nil {
			tx.Rollback()
			return response.Error(c, errcode.ErrInvalidParams,
				fmt.Sprintf("check item %s not found", itemUpdate.ID))
		}

		item.IsContained = itemUpdate.IsContained
		item.LabelVerified = itemUpdate.LabelVerified
		item.BatchVerified = itemUpdate.BatchVerified
		item.CrossContaminationRisk = itemUpdate.CrossContaminationRisk
		item.Remarks = itemUpdate.Remarks

		if err := tx.Save(&item).Error; err != nil {
			tx.Rollback()
			return response.Error(c, errcode.ErrInternalError)
		}
	}

	oldStatus := review.Status
	review.Status = req.Status
	review.OverallResult = req.OverallResult
	review.Findings = req.Findings
	review.CorrectiveActions = req.CorrectiveActions

	if err := tx.Save(&review).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	var requisition models.Requisition
	if err := tx.Where("id = ?", review.RequisitionID).First(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	oldReqStatus := requisition.Status
	if req.Status == models.AllergenStatusPassed {
		requisition.Status = models.RequisitionStatusAllergenPassed
	} else {
		requisition.Status = models.RequisitionStatusAllergenFailed
	}

	if err := tx.Save(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	statusText := map[models.AllergenReviewStatus]string{
		models.AllergenStatusPassed: "通过",
		models.AllergenStatusFailed: "不通过",
	}[req.Status]

	if err := service.LogAction(
		tx,
		review.ID, "allergen_review",
		models.ActionTypeSubmit, fmt.Sprintf("提交过敏原复核（%s）", statusText),
		fmt.Sprintf("复核结果：%s，发现问题：%s", req.OverallResult, req.Findings),
		string(oldStatus), string(req.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeStatusChange, "过敏原复核完成",
		fmt.Sprintf("复核结果：%s，等待门店督导确认", statusText),
		string(oldReqStatus), string(requisition.Status),
		userID, nil,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, fiber.Map{
		"review":      review,
		"requisition": requisition,
	})
}

func VerifyAllergenReview(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)
	id := c.Params("id")
	reviewID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid allergen review id")
	}

	var req VerifyAllergenReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var review models.AllergenReview
	if err := database.DB.Preload("Requisition").Where("id = ?", reviewID).First(&review).Error; err != nil {
		return response.Error(c, errcode.ErrAllergenReviewNotFound)
	}

	if review.Status != models.AllergenStatusPassed && review.Status != models.AllergenStatusFailed {
		return response.Error(c, errcode.ErrAllergenReviewStatus,
			fmt.Sprintf("cannot verify review when status is %s", review.Status))
	}

	if req.Status != models.AllergenStatusPassed && req.Status != models.AllergenStatusFailed {
		return response.Error(c, errcode.ErrInvalidParams, "verification status must be 'passed' or 'failed'")
	}

	tx := database.DB.Begin()

	oldStatus := review.Status
	now := time.Now()
	review.VerifiedBy = &userID
	review.VerifiedAt = &now
	if req.Findings != "" {
		review.Findings = review.Findings + "\n门店督导复核意见：" + req.Findings
	}

	if err := tx.Save(&review).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	var requisition models.Requisition
	if err := tx.Where("id = ?", review.RequisitionID).First(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	oldReqStatus := requisition.Status
	requisition.Status = models.RequisitionStatusCompleted
	requisition.StoreVerifiedBy = &userID
	requisition.StoreVerifiedAt = &now

	if err := tx.Save(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	verifyAction := "确认通过"
	if req.Status == models.AllergenStatusFailed {
		verifyAction = "确认不通过"
	}

	if err := service.LogAction(
		tx,
		review.ID, "allergen_review",
		models.ActionTypeVerify, fmt.Sprintf("门店督导%s", verifyAction),
		fmt.Sprintf("复核意见：%s，备注：%s", verifyAction, req.Remarks),
		string(oldStatus), string(req.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeVerify, "门店督导确认",
		fmt.Sprintf("过敏原复核%s，流程闭环", verifyAction),
		string(oldReqStatus), string(requisition.Status),
		userID, nil,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, fiber.Map{
		"review":      review,
		"requisition": requisition,
	})
}

func GetAllergenReviewHistory(c *fiber.Ctx) error {
	requisitionID := c.Query("requisition_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var reviews []models.AllergenReview
	query := database.DB.Preload("CheckedByUser").
		Preload("VerifiedByUser").
		Preload("Requisition").
		Preload("Requisition.PurchaseOrder").
		Preload("Requisition.PickedByUser").
		Preload("CheckItems").
		Order("created_at desc")

	if requisitionID != "" {
		query = query.Where("requisition_id = ?", requisitionID)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	if err := query.Find(&reviews).Error; err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, reviews)
}

func GetAllergenReviewLogs(c *fiber.Ctx) error {
	id := c.Params("id")
	reviewID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid allergen review id")
	}

	logs, err := service.GetActionLogs(reviewID, "allergen_review")
	if err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, logs)
}
