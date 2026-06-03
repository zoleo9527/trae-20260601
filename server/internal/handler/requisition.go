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
	"gorm.io/gorm"
)

type CreateRequisitionRequest struct {
	PurchaseOrderID uuid.UUID                `json:"purchase_order_id"`
	ProductionLine  string                   `json:"production_line"`
	Items           []RequisitionItemRequest `json:"items"`
	Remarks         string                   `json:"remarks"`
}

type RequisitionItemRequest struct {
	PurchaseItemID uuid.UUID `json:"purchase_item_id"`
	MaterialName   string    `json:"material_name"`
	RequestedQty   float64   `json:"requested_qty"`
	Unit           string    `json:"unit"`
	AllergenInfo   string    `json:"allergen_info"`
}

type PickItemsRequest struct {
	Items []PickItemRequest `json:"items"`
}

type PickItemRequest struct {
	RequisitionItemID uuid.UUID `json:"requisition_item_id"`
	PickedQty         float64   `json:"picked_qty"`
	BatchNo           string    `json:"batch_no"`
}

type UpdateRequisitionStatusRequest struct {
	Status            models.RequisitionStatus  `json:"status"`
	Remarks           string                    `json:"remarks"`
	PickItems         []PickItemRequest         `json:"pick_items,omitempty"`
	OverallResult     string                    `json:"overall_result,omitempty"`
	Findings          string                    `json:"findings,omitempty"`
	CorrectiveActions string                    `json:"corrective_actions,omitempty"`
	ReviewCheckItems  []AllergenCheckItemUpdate `json:"review_check_items,omitempty"`
}

func generateRequisitionNo() string {
	now := time.Now()
	var count int64
	database.DB.Model(&models.Requisition{}).Where("created_at >= ?", time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())).Count(&count)
	return fmt.Sprintf("REQ-%d%02d%02d-%04d", now.Year(), now.Month(), now.Day(), count+1)
}

func CreateRequisition(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)

	var req CreateRequisitionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var po models.PurchaseOrder
	if err := database.DB.Where("id = ?", req.PurchaseOrderID).First(&po).Error; err != nil {
		return response.Error(c, errcode.ErrPurchaseOrderNotFound)
	}

	if po.Status != models.PurchaseStatusReceived {
		return response.Error(c, errcode.ErrPurchaseNotReceived)
	}

	requisitionNo := generateRequisitionNo()

	requisition := models.Requisition{
		RequisitionNo:   requisitionNo,
		PurchaseOrderID: req.PurchaseOrderID,
		ProductionLine:  req.ProductionLine,
		Status:          models.RequisitionStatusPending,
		Remarks:         req.Remarks,
	}

	items := make([]models.RequisitionItem, len(req.Items))
	for i, item := range req.Items {
		var pi models.PurchaseItem
		if err := database.DB.Where("id = ?", item.PurchaseItemID).First(&pi).Error; err == nil {
			items[i] = models.RequisitionItem{
				PurchaseItemID: item.PurchaseItemID,
				MaterialName:   pi.MaterialName,
				RequestedQty:   item.RequestedQty,
				Unit:           pi.Unit,
				AllergenInfo:   pi.AllergenInfo,
			}
		} else {
			items[i] = models.RequisitionItem{
				PurchaseItemID: item.PurchaseItemID,
				MaterialName:   item.MaterialName,
				RequestedQty:   item.RequestedQty,
				Unit:           item.Unit,
				AllergenInfo:   item.AllergenInfo,
			}
		}
	}
	requisition.Items = items

	tx := database.DB.Begin()
	if err := tx.Create(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError, "failed to create requisition")
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeCreate, "创建领用单",
		fmt.Sprintf("创建领用单 %s，生产线：%s", requisitionNo, req.ProductionLine),
		"", string(requisition.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, requisition)
}

func GetRequisitions(c *fiber.Ctx) error {
	status := c.Query("status")

	var requisitions []models.Requisition
	query := database.DB.Preload("PickedByUser").
		Preload("AllergenChecker").
		Preload("StoreVerifier").
		Preload("PurchaseOrder").
		Preload("Items.PurchaseItem").
		Preload("AllergenReview")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at desc").Find(&requisitions).Error; err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, requisitions)
}

func GetRequisition(c *fiber.Ctx) error {
	id := c.Params("id")
	reqID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid requisition id")
	}

	var requisition models.Requisition
	if err := database.DB.Preload("PickedByUser").
		Preload("AllergenChecker").
		Preload("StoreVerifier").
		Preload("PurchaseOrder").
		Preload("PurchaseOrder.CreatedByUser").
		Preload("PurchaseOrder.Items").
		Preload("Items.PurchaseItem").
		Preload("AllergenReview").
		Preload("AllergenReview.CheckedByUser").
		Preload("AllergenReview.VerifiedByUser").
		Preload("AllergenReview.CheckItems").
		Where("id = ?", reqID).First(&requisition).Error; err != nil {
		return response.Error(c, errcode.ErrRequisitionNotFound)
	}

	return response.Success(c, requisition)
}

func PickRequisitionItems(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)
	id := c.Params("id")
	reqID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid requisition id")
	}

	var req PickItemsRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var requisition models.Requisition
	if err := database.DB.Where("id = ?", reqID).First(&requisition).Error; err != nil {
		return response.Error(c, errcode.ErrRequisitionNotFound)
	}

	if requisition.Status != models.RequisitionStatusPending {
		return response.Error(c, errcode.ErrRequisitionStatus,
			fmt.Sprintf("cannot pick items when status is %s", requisition.Status))
	}

	tx := database.DB.Begin()

	for _, pickItem := range req.Items {
		var item models.RequisitionItem
		if err := tx.Where("id = ? AND requisition_id = ?", pickItem.RequisitionItemID, reqID).First(&item).Error; err != nil {
			tx.Rollback()
			return response.Error(c, errcode.ErrInvalidParams,
				fmt.Sprintf("requisition item %s not found", pickItem.RequisitionItemID))
		}

		if pickItem.PickedQty > item.RequestedQty {
			tx.Rollback()
			return response.Error(c, errcode.ErrInsufficientStock,
				fmt.Sprintf("picked quantity %.2f exceeds requested %.2f for %s",
					pickItem.PickedQty, item.RequestedQty, item.MaterialName))
		}

		item.PickedQty = pickItem.PickedQty
		item.BatchNo = pickItem.BatchNo
		if err := tx.Save(&item).Error; err != nil {
			tx.Rollback()
			return response.Error(c, errcode.ErrInternalError)
		}
	}

	now := time.Now()
	oldStatus := requisition.Status
	requisition.Status = models.RequisitionStatusPicked
	requisition.PickedBy = &userID
	requisition.PickedAt = &now

	if err := tx.Save(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypePick, "原料领用",
		fmt.Sprintf("完成原料领用，共 %d 项物料", len(req.Items)),
		string(oldStatus), string(requisition.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, requisition)
}

func InitiateAllergenReview(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)
	id := c.Params("id")
	reqID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid requisition id")
	}

	var requisition models.Requisition
	if err := database.DB.Preload("Items").Where("id = ?", reqID).First(&requisition).Error; err != nil {
		return response.Error(c, errcode.ErrRequisitionNotFound)
	}

	if requisition.Status != models.RequisitionStatusPicked {
		return response.Error(c, errcode.ErrRequisitionStatus,
			fmt.Sprintf("cannot initiate allergen review when status is %s", requisition.Status))
	}

	if requisition.PickedBy == nil || *requisition.PickedBy != userID {
		return response.Error(c, errcode.ErrNotRequisitionOwner)
	}

	var existingReview models.AllergenReview
	if err := database.DB.Where("requisition_id = ?", reqID).First(&existingReview).Error; err == nil {
		return response.Error(c, errcode.ErrAllergenReviewExists)
	}

	tx := database.DB.Begin()

	review := models.AllergenReview{
		RequisitionID: reqID,
		Status:        models.AllergenStatusPending,
		CheckedBy:     userID,
	}

	checkItems := make([]models.AllergenCheckItem, 0)
	for _, item := range requisition.Items {
		if item.PickedQty > 0 {
			checkItems = append(checkItems, models.AllergenCheckItem{
				RequisitionItemID: item.ID,
				MaterialName:      item.MaterialName,
				AllergenType:      item.AllergenInfo,
				IsContained:       item.AllergenInfo != "" && item.AllergenInfo != "无常见过敏原",
				LabelVerified:     false,
				BatchVerified:     false,
			})
		}
	}
	review.CheckItems = checkItems

	if err := tx.Create(&review).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError, "failed to create allergen review")
	}

	oldStatus := requisition.Status
	requisition.Status = models.RequisitionStatusAllergenPending
	requisition.AllergenCheckedBy = &userID
	requisition.AllergenCheckedAt = &time.Time{}
	*requisition.AllergenCheckedAt = time.Now()

	if err := tx.Save(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeSubmit, "发起过敏原复核",
		"生产班长发起过敏原复核，等待门店督导确认",
		string(oldStatus), string(requisition.Status),
		userID, nil,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	if err := service.LogAction(
		tx,
		review.ID, "allergen_review",
		models.ActionTypeCreate, "创建过敏原复核",
		fmt.Sprintf("关联领用单：%s", requisition.RequisitionNo),
		"", string(review.Status),
		userID, nil,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, fiber.Map{
		"requisition": requisition,
		"review":      review,
	})
}

func UpdateRequisitionStatus(c *fiber.Ctx) error {
	userID, userRole := middleware.GetCurrentUser(c)
	id := c.Params("id")
	reqID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid requisition id")
	}

	var req UpdateRequisitionStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var requisition models.Requisition
	if err := database.DB.Preload("Items").Where("id = ?", reqID).First(&requisition).Error; err != nil {
		return response.Error(c, errcode.ErrRequisitionNotFound)
	}

	oldStatus := requisition.Status
	newStatus := req.Status

	if oldStatus == newStatus {
		return response.Success(c, requisition)
	}

	if !IsValidRequisitionStatusTransition(oldStatus, newStatus) {
		return response.Error(c, errcode.ErrRequisitionStatus,
			fmt.Sprintf("invalid status transition: %s → %s", oldStatus, newStatus))
	}

	if !CanChangeRequisitionStatus(userRole, oldStatus, newStatus) {
		return response.Error(c, errcode.ErrRolePermission,
			fmt.Sprintf("role %s cannot perform status transition: %s → %s", userRole, oldStatus, newStatus))
	}

	tx := database.DB.Begin()

	switch newStatus {
	case models.RequisitionStatusPicked:
		if err := handleStatusToPicked(tx, &requisition, userID, req.PickItems, req.Remarks); err != nil {
			tx.Rollback()
			return handleStatusError(c, err)
		}
	case models.RequisitionStatusAllergenPending:
		if err := handleStatusToAllergenPending(tx, &requisition, userID, req.Remarks); err != nil {
			tx.Rollback()
			return handleStatusError(c, err)
		}
	case models.RequisitionStatusAllergenPassed, models.RequisitionStatusAllergenFailed:
		if err := handleStatusToAllergenResult(tx, &requisition, userID, newStatus, req.ReviewCheckItems, req.OverallResult, req.Findings, req.CorrectiveActions, req.Remarks); err != nil {
			tx.Rollback()
			return handleStatusError(c, err)
		}
	case models.RequisitionStatusCompleted:
		if err := handleStatusToCompleted(tx, &requisition, userID, newStatus, req.Remarks); err != nil {
			tx.Rollback()
			return handleStatusError(c, err)
		}
	case models.RequisitionStatusCancelled:
		if err := handleStatusToCancelled(tx, &requisition, userID, oldStatus, newStatus, req.Remarks); err != nil {
			tx.Rollback()
			return handleStatusError(c, err)
		}
	}

	tx.Commit()

	var updatedRequisition models.Requisition
	if err := database.DB.Preload("PickedByUser").
		Preload("AllergenChecker").
		Preload("StoreVerifier").
		Preload("AllergenReview").
		Preload("AllergenReview.CheckItems").
		Where("id = ?", reqID).First(&updatedRequisition).Error; err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, updatedRequisition)
}

type statusHandlerError struct {
	code    errcode.ErrorCode
	message string
}

func (e *statusHandlerError) Error() string {
	return e.message
}

func newStatusError(code errcode.ErrorCode, message string) error {
	return &statusHandlerError{code: code, message: message}
}

func handleStatusError(c *fiber.Ctx, err error) error {
	if se, ok := err.(*statusHandlerError); ok {
		return response.Error(c, se.code, se.message)
	}
	return response.Error(c, errcode.ErrInternalError, err.Error())
}

func handleStatusToPicked(tx *gorm.DB, requisition *models.Requisition, userID uuid.UUID, pickItems []PickItemRequest, remarks string) error {
	if len(pickItems) == 0 {
		return newStatusError(errcode.ErrInvalidParams, "pick_items is required when changing status to 'picked'")
	}

	now := time.Now()
	oldStatus := requisition.Status

	itemMap := make(map[uuid.UUID]PickItemRequest)
	for _, item := range pickItems {
		itemMap[item.RequisitionItemID] = item
	}

	for i := range requisition.Items {
		pickItem, ok := itemMap[requisition.Items[i].ID]
		if !ok {
			return newStatusError(errcode.ErrInvalidParams,
				fmt.Sprintf("missing pick data for requisition item: %s", requisition.Items[i].ID))
		}

		if pickItem.PickedQty > requisition.Items[i].RequestedQty {
			return newStatusError(errcode.ErrInsufficientStock,
				fmt.Sprintf("picked quantity %.2f exceeds requested %.2f for %s",
					pickItem.PickedQty, requisition.Items[i].RequestedQty, requisition.Items[i].MaterialName))
		}

		requisition.Items[i].PickedQty = pickItem.PickedQty
		requisition.Items[i].BatchNo = pickItem.BatchNo

		if err := tx.Save(&requisition.Items[i]).Error; err != nil {
			return newStatusError(errcode.ErrInternalError, err.Error())
		}
	}

	requisition.Status = models.RequisitionStatusPicked
	requisition.PickedBy = &userID
	requisition.PickedAt = &now

	if err := tx.Save(requisition).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	actionDesc := fmt.Sprintf("完成原料领用，共 %d 项物料", len(pickItems))
	if remarks != "" {
		actionDesc += fmt.Sprintf("，备注：%s", remarks)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypePick, "原料领用",
		actionDesc,
		string(oldStatus), string(requisition.Status),
		userID, pickItems,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	return nil
}

func handleStatusToAllergenPending(tx *gorm.DB, requisition *models.Requisition, userID uuid.UUID, remarks string) error {
	if requisition.PickedBy == nil || *requisition.PickedBy != userID {
		return newStatusError(errcode.ErrNotRequisitionOwner, "only the picker can initiate allergen review")
	}

	var existingReview models.AllergenReview
	if err := tx.Where("requisition_id = ?", requisition.ID).First(&existingReview).Error; err == nil {
		return newStatusError(errcode.ErrAllergenReviewExists, "allergen review already exists for this requisition")
	}

	oldStatus := requisition.Status
	now := time.Now()

	review := models.AllergenReview{
		RequisitionID: requisition.ID,
		Status:        models.AllergenStatusPending,
		CheckedBy:     userID,
	}

	checkItems := make([]models.AllergenCheckItem, 0)
	for _, item := range requisition.Items {
		if item.PickedQty > 0 {
			checkItems = append(checkItems, models.AllergenCheckItem{
				RequisitionItemID: item.ID,
				MaterialName:      item.MaterialName,
				AllergenType:      item.AllergenInfo,
				IsContained:       item.AllergenInfo != "" && item.AllergenInfo != "无常见过敏原",
				LabelVerified:     false,
				BatchVerified:     false,
			})
		}
	}
	review.CheckItems = checkItems

	if err := tx.Create(&review).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, "failed to create allergen review: "+err.Error())
	}

	requisition.Status = models.RequisitionStatusAllergenPending
	requisition.AllergenCheckedBy = &userID
	checkedAt := now
	requisition.AllergenCheckedAt = &checkedAt

	if err := tx.Save(requisition).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	actionDesc := "生产班长发起过敏原复核，等待门店督导确认"
	if remarks != "" {
		actionDesc += fmt.Sprintf("，备注：%s", remarks)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeSubmit, "发起过敏原复核",
		actionDesc,
		string(oldStatus), string(requisition.Status),
		userID, nil,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	if err := service.LogAction(
		tx,
		review.ID, "allergen_review",
		models.ActionTypeCreate, "创建过敏原复核",
		fmt.Sprintf("关联领用单：%s", requisition.RequisitionNo),
		"", string(review.Status),
		userID, nil,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	return nil
}

func handleStatusToAllergenResult(tx *gorm.DB, requisition *models.Requisition, userID uuid.UUID, newStatus models.RequisitionStatus, checkItems []AllergenCheckItemUpdate, overallResult, findings, correctiveActions, remarks string) error {
	if len(checkItems) == 0 {
		return newStatusError(errcode.ErrInvalidParams, "review_check_items is required when changing status to 'allergen_passed' or 'allergen_failed'")
	}
	if overallResult == "" {
		return newStatusError(errcode.ErrInvalidParams, "overall_result is required when changing status to 'allergen_passed' or 'allergen_failed'")
	}

	var review models.AllergenReview
	if err := tx.Preload("CheckItems").Where("requisition_id = ?", requisition.ID).First(&review).Error; err != nil {
		return newStatusError(errcode.ErrAllergenReviewNotFound,
			"allergen review not found, please initiate review first")
	}

	if review.Status != models.AllergenStatusPending && review.Status != models.AllergenStatusReviewing {
		return newStatusError(errcode.ErrAllergenReviewStatus,
			fmt.Sprintf("cannot submit review when status is %s", review.Status))
	}

	if review.CheckedBy != userID {
		return newStatusError(errcode.ErrForbidden, "only the creator can submit the review")
	}

	oldReqStatus := requisition.Status
	oldReviewStatus := review.Status

	var allergenStatus models.AllergenReviewStatus
	var statusText string
	if newStatus == models.RequisitionStatusAllergenPassed {
		allergenStatus = models.AllergenStatusPassed
		statusText = "通过"
	} else {
		allergenStatus = models.AllergenStatusFailed
		statusText = "不通过"
	}

	itemMap := make(map[uuid.UUID]AllergenCheckItemUpdate)
	for _, item := range checkItems {
		itemMap[item.ID] = item
	}

	for i := range review.CheckItems {
		itemUpdate, ok := itemMap[review.CheckItems[i].ID]
		if !ok {
			return newStatusError(errcode.ErrInvalidParams,
				fmt.Sprintf("missing check item data for: %s", review.CheckItems[i].ID))
		}

		review.CheckItems[i].IsContained = itemUpdate.IsContained
		review.CheckItems[i].LabelVerified = itemUpdate.LabelVerified
		review.CheckItems[i].BatchVerified = itemUpdate.BatchVerified
		review.CheckItems[i].CrossContaminationRisk = itemUpdate.CrossContaminationRisk
		review.CheckItems[i].Remarks = itemUpdate.Remarks

		if err := tx.Save(&review.CheckItems[i]).Error; err != nil {
			return newStatusError(errcode.ErrInternalError, err.Error())
		}
	}

	review.Status = allergenStatus
	review.OverallResult = overallResult
	review.Findings = findings
	review.CorrectiveActions = correctiveActions

	if err := tx.Save(&review).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	requisition.Status = newStatus

	if err := tx.Save(requisition).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	actionDesc := fmt.Sprintf("复核结果：%s", statusText)
	if findings != "" {
		actionDesc += fmt.Sprintf("，发现问题：%s", findings)
	}
	actionDesc += "，等待门店督导确认"

	reviewData := map[string]interface{}{
		"check_items":        checkItems,
		"overall_result":     overallResult,
		"findings":           findings,
		"corrective_actions": correctiveActions,
	}

	if err := service.LogAction(
		tx,
		review.ID, "allergen_review",
		models.ActionTypeSubmit, fmt.Sprintf("提交过敏原复核（%s）", statusText),
		actionDesc,
		string(oldReviewStatus), string(allergenStatus),
		userID, reviewData,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeStatusChange, "过敏原复核完成",
		actionDesc,
		string(oldReqStatus), string(newStatus),
		userID, nil,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	return nil
}

func handleStatusToCompleted(tx *gorm.DB, requisition *models.Requisition, userID uuid.UUID, newStatus models.RequisitionStatus, remarks string) error {
	var review models.AllergenReview
	if err := tx.Where("requisition_id = ?", requisition.ID).First(&review).Error; err != nil {
		return newStatusError(errcode.ErrAllergenReviewNotFound,
			"allergen review not found")
	}

	if review.Status != models.AllergenStatusPassed && review.Status != models.AllergenStatusFailed {
		return newStatusError(errcode.ErrAllergenReviewStatus,
			fmt.Sprintf("cannot verify review when status is %s", review.Status))
	}

	if review.VerifiedBy != nil {
		return newStatusError(errcode.ErrAllergenReviewStatus,
			"allergen review already verified")
	}

	oldReqStatus := requisition.Status
	oldReviewStatus := review.Status
	now := time.Now()

	verifyAction := "确认通过"
	if review.Status == models.AllergenStatusFailed {
		verifyAction = "确认不通过"
	}

	review.VerifiedBy = &userID
	review.VerifiedAt = &now
	if remarks != "" {
		review.Findings = review.Findings + "\n门店督导复核意见：" + remarks
	}

	if err := tx.Save(&review).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	requisition.Status = models.RequisitionStatusCompleted
	requisition.StoreVerifiedBy = &userID
	requisition.StoreVerifiedAt = &now

	if err := tx.Save(requisition).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	actionDesc := fmt.Sprintf("过敏原复核%s，流程闭环", verifyAction)
	if remarks != "" {
		actionDesc += fmt.Sprintf("，备注：%s", remarks)
	}

	if err := service.LogAction(
		tx,
		review.ID, "allergen_review",
		models.ActionTypeVerify, fmt.Sprintf("门店督导%s", verifyAction),
		actionDesc,
		string(oldReviewStatus), string(review.Status),
		userID, nil,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeVerify, "门店督导确认",
		actionDesc,
		string(oldReqStatus), string(requisition.Status),
		userID, nil,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	return nil
}

func handleStatusToCancelled(tx *gorm.DB, requisition *models.Requisition, userID uuid.UUID, oldStatus, newStatus models.RequisitionStatus, remarks string) error {
	requisition.Status = models.RequisitionStatusCancelled

	if err := tx.Save(requisition).Error; err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	actionDesc := "领用单已取消"
	if remarks != "" {
		actionDesc += fmt.Sprintf("，备注：%s", remarks)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeStatusChange, "取消领用单",
		actionDesc,
		string(oldStatus), string(newStatus),
		userID, nil,
	); err != nil {
		return newStatusError(errcode.ErrInternalError, err.Error())
	}

	return nil
}

func IsValidRequisitionStatusTransition(oldStatus, newStatus models.RequisitionStatus) bool {
	validTransitions := map[models.RequisitionStatus][]models.RequisitionStatus{
		models.RequisitionStatusPending:         {models.RequisitionStatusPicked, models.RequisitionStatusCancelled},
		models.RequisitionStatusPicked:          {models.RequisitionStatusAllergenPending, models.RequisitionStatusCancelled},
		models.RequisitionStatusAllergenPending: {models.RequisitionStatusAllergenPassed, models.RequisitionStatusAllergenFailed, models.RequisitionStatusCancelled},
		models.RequisitionStatusAllergenPassed:  {models.RequisitionStatusCompleted},
		models.RequisitionStatusAllergenFailed:  {models.RequisitionStatusCompleted},
		models.RequisitionStatusCompleted:       {},
		models.RequisitionStatusCancelled:       {},
	}

	validNextStatuses, ok := validTransitions[oldStatus]
	if !ok {
		return false
	}

	for _, valid := range validNextStatuses {
		if valid == newStatus {
			return true
		}
	}
	return false
}

func CanChangeRequisitionStatus(role models.Role, oldStatus, newStatus models.RequisitionStatus) bool {
	if role == models.RoleProcurementManager {
		return false
	}

	if role == models.RoleProductionForeman {
		productionAllowed := map[models.RequisitionStatus][]models.RequisitionStatus{
			models.RequisitionStatusPending:         {models.RequisitionStatusPicked, models.RequisitionStatusCancelled},
			models.RequisitionStatusPicked:          {models.RequisitionStatusAllergenPending, models.RequisitionStatusCancelled},
			models.RequisitionStatusAllergenPending: {models.RequisitionStatusAllergenPassed, models.RequisitionStatusAllergenFailed, models.RequisitionStatusCancelled},
		}

		if allowed, ok := productionAllowed[oldStatus]; ok {
			for _, valid := range allowed {
				if valid == newStatus {
					return true
				}
			}
		}
		return false
	}

	if role == models.RoleStoreSupervisor {
		storeAllowed := map[models.RequisitionStatus][]models.RequisitionStatus{
			models.RequisitionStatusAllergenPassed: {models.RequisitionStatusCompleted},
			models.RequisitionStatusAllergenFailed: {models.RequisitionStatusCompleted},
		}

		if allowed, ok := storeAllowed[oldStatus]; ok {
			for _, valid := range allowed {
				if valid == newStatus {
					return true
				}
			}
		}
		return false
	}

	return false
}

func GetRequisitionLogs(c *fiber.Ctx) error {
	id := c.Params("id")
	reqID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid requisition id")
	}

	logs, err := service.GetActionLogs(reqID, "requisition")
	if err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, logs)
}
