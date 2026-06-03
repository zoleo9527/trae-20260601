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
	Status  models.RequisitionStatus `json:"status"`
	Remarks string                   `json:"remarks"`
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
	userID, _ := middleware.GetCurrentUser(c)
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
	if err := database.DB.Where("id = ?", reqID).First(&requisition).Error; err != nil {
		return response.Error(c, errcode.ErrRequisitionNotFound)
	}

	oldStatus := requisition.Status
	requisition.Status = req.Status
	now := time.Now()

	if req.Status == models.RequisitionStatusCompleted {
		requisition.StoreVerifiedBy = &userID
		requisition.StoreVerifiedAt = &now
	}

	tx := database.DB.Begin()
	if err := tx.Save(&requisition).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	if err := service.LogAction(
		tx,
		requisition.ID, "requisition",
		models.ActionTypeStatusChange, "状态变更",
		fmt.Sprintf("状态变更：%s → %s，备注：%s", oldStatus, req.Status, req.Remarks),
		string(oldStatus), string(req.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, requisition)
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
