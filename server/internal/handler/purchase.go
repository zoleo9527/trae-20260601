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

type CreatePurchaseOrderRequest struct {
	SupplierName string                `json:"supplier_name"`
	TotalAmount  float64               `json:"total_amount"`
	ExpectedDate time.Time             `json:"expected_date"`
	Items        []PurchaseItemRequest `json:"items"`
}

type PurchaseItemRequest struct {
	MaterialName string  `json:"material_name"`
	SKU          string  `json:"sku"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	UnitPrice    float64 `json:"unit_price"`
	AllergenInfo string  `json:"allergen_info"`
}

type UpdatePurchaseStatusRequest struct {
	Status  models.PurchaseStatus `json:"status"`
	Remarks string                `json:"remarks"`
}

func generateOrderNo() string {
	now := time.Now()
	var count int64
	database.DB.Model(&models.PurchaseOrder{}).Where("created_at >= ?", time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())).Count(&count)
	return fmt.Sprintf("PO-%d%02d%02d-%04d", now.Year(), now.Month(), now.Day(), count+1)
}

func CreatePurchaseOrder(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)

	var req CreatePurchaseOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	orderNo := generateOrderNo()

	po := models.PurchaseOrder{
		OrderNo:      orderNo,
		SupplierName: req.SupplierName,
		TotalAmount:  req.TotalAmount,
		Status:       models.PurchaseStatusDraft,
		ExpectedDate: req.ExpectedDate,
		CreatedBy:    userID,
	}

	items := make([]models.PurchaseItem, len(req.Items))
	for i, item := range req.Items {
		items[i] = models.PurchaseItem{
			MaterialName: item.MaterialName,
			SKU:          item.SKU,
			Quantity:     item.Quantity,
			Unit:         item.Unit,
			UnitPrice:    item.UnitPrice,
			AllergenInfo: item.AllergenInfo,
		}
	}
	po.Items = items

	tx := database.DB.Begin()
	if err := tx.Create(&po).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError, "failed to create purchase order")
	}

	if err := service.LogAction(
		tx,
		po.ID, "purchase_order",
		models.ActionTypeCreate, "创建采购单",
		fmt.Sprintf("创建采购单 %s，供应商：%s", po.OrderNo, po.SupplierName),
		"", string(po.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, po)
}

func GetPurchaseOrders(c *fiber.Ctx) error {
	status := c.Query("status")

	var pos []models.PurchaseOrder
	query := database.DB.Preload("CreatedByUser").Preload("Items")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at desc").Find(&pos).Error; err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, pos)
}

func GetPurchaseOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	poID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid purchase order id")
	}

	var po models.PurchaseOrder
	if err := database.DB.Preload("CreatedByUser").
		Preload("Items").
		Preload("Requisition").
		Where("id = ?", poID).First(&po).Error; err != nil {
		return response.Error(c, errcode.ErrPurchaseOrderNotFound)
	}

	return response.Success(c, po)
}

func UpdatePurchaseOrderStatus(c *fiber.Ctx) error {
	userID, _ := middleware.GetCurrentUser(c)
	id := c.Params("id")
	poID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid purchase order id")
	}

	var req UpdatePurchaseStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, errcode.ErrInvalidParams)
	}

	var po models.PurchaseOrder
	if err := database.DB.Where("id = ?", poID).First(&po).Error; err != nil {
		return response.Error(c, errcode.ErrPurchaseOrderNotFound)
	}

	oldStatus := po.Status

	validTransitions := map[models.PurchaseStatus][]models.PurchaseStatus{
		models.PurchaseStatusDraft:     {models.PurchaseStatusApproved, models.PurchaseStatusRejected},
		models.PurchaseStatusApproved:  {models.PurchaseStatusInTransit},
		models.PurchaseStatusInTransit: {models.PurchaseStatusReceived},
	}

	valid := false
	for _, s := range validTransitions[oldStatus] {
		if s == req.Status {
			valid = true
			break
		}
	}
	if !valid {
		return response.Error(c, errcode.ErrPurchaseOrderStatus,
			fmt.Sprintf("cannot transition from %s to %s", oldStatus, req.Status))
	}

	po.Status = req.Status
	if req.Status == models.PurchaseStatusReceived {
		now := time.Now()
		po.ReceivedDate = &now
	}

	tx := database.DB.Begin()
	if err := tx.Save(&po).Error; err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	actionName := map[models.PurchaseStatus]string{
		models.PurchaseStatusApproved:  "审批通过",
		models.PurchaseStatusInTransit: "标记发货",
		models.PurchaseStatusReceived:  "确认收货",
		models.PurchaseStatusRejected:  "驳回",
	}[req.Status]

	if err := service.LogAction(
		tx,
		po.ID, "purchase_order",
		models.ActionTypeStatusChange, actionName,
		fmt.Sprintf("采购单状态变更：%s → %s，备注：%s", oldStatus, req.Status, req.Remarks),
		string(oldStatus), string(req.Status),
		userID, req,
	); err != nil {
		tx.Rollback()
		return response.Error(c, errcode.ErrInternalError)
	}

	tx.Commit()

	return response.Success(c, po)
}

func GetPurchaseOrderLogs(c *fiber.Ctx) error {
	id := c.Params("id")
	poID, err := uuid.Parse(id)
	if err != nil {
		return response.Error(c, errcode.ErrInvalidParams, "invalid purchase order id")
	}

	logs, err := service.GetActionLogs(poID, "purchase_order")
	if err != nil {
		return response.Error(c, errcode.ErrInternalError)
	}

	return response.Success(c, logs)
}
