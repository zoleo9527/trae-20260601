package controllers

import (
	"museum-education/internal/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

type AuditController struct {
	service *services.AuditService
}

func NewAuditController(service *services.AuditService) *AuditController {
	return &AuditController{service: service}
}

func (c *AuditController) GetAuditLogs(ctx *fiber.Ctx) error {
	var req services.GetAuditLogsRequest
	
	if module := ctx.Query("module"); module != "" {
		req.Module = module
	}
	if userID := ctx.Query("user_id"); userID != "" {
		req.UserID = userID
	}
	if action := ctx.Query("action"); action != "" {
		req.Action = action
	}
	if startAt := ctx.Query("start_at"); startAt != "" {
		if t, err := time.Parse(time.RFC3339, startAt); err == nil {
			req.StartAt = t
		}
	}
	if endAt := ctx.Query("end_at"); endAt != "" {
		if t, err := time.Parse(time.RFC3339, endAt); err == nil {
			req.EndAt = t
		}
	}

	logs, err := c.service.GetAuditLogs(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(logs)
}

func (c *AuditController) GetAuditLogByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	log, err := c.service.GetAuditLogByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Audit log not found"})
	}
	return ctx.JSON(log)
}
