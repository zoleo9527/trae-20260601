package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/models"
	"micro-loan/internal/services"
)

type WarningHandler struct {
	warningService *services.WarningService
}

func NewWarningHandler() *WarningHandler {
	return &WarningHandler{
		warningService: services.NewWarningService(),
	}
}

func (h *WarningHandler) HandleWarning(c *fiber.Ctx) error {
	var req services.HandleWarningRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.warningService.HandleWarning(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "预警处理成功",
	})
}

func (h *WarningHandler) GetWarningsByLoanID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	warnings, err := h.warningService.GetWarningsByLoanID(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": warnings,
	})
}

func (h *WarningHandler) GetPendingWarnings(c *fiber.Ctx) error {
	warnings, err := h.warningService.GetPendingWarnings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": warnings,
	})
}

func (h *WarningHandler) GetWarningsByType(c *fiber.Ctx) error {
	warningType := c.Params("type")
	var wType models.WarningType
	switch warningType {
	case "forgery":
		wType = models.WarningTypeForgery
	case "overdue_remind":
		wType = models.WarningTypeOverdueRemind
	case "extension":
		wType = models.WarningTypeExtension
	default:
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的预警类型",
		})
	}

	warnings, err := h.warningService.GetWarningsByType(wType)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": warnings,
	})
}
