package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/services"
)

type AuditHandler struct {
	auditService *services.AuditService
}

func NewAuditHandler() *AuditHandler {
	return &AuditHandler{
		auditService: services.NewAuditService(),
	}
}

func (h *AuditHandler) ListAuditLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	operatorID := c.Query("operator_id")
	operationType := c.Query("operation_type")

	logs, total, err := h.auditService.ListAuditLogs(&services.ListAuditLogsRequest{
		Page:         page,
		PageSize:     pageSize,
		OperatorID:   operatorID,
		OperationType: operationType,
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"logs":      logs,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *AuditHandler) GetAuditLogsByLoanID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	logs, err := h.auditService.GetAuditLogsByLoanID(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": logs,
	})
}
