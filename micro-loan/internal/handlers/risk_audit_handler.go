package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/services"
)

type RiskAuditHandler struct {
	riskService *services.RiskAuditService
}

func NewRiskAuditHandler() *RiskAuditHandler {
	return &RiskAuditHandler{
		riskService: services.NewRiskAuditService(),
	}
}

func (h *RiskAuditHandler) CreateRiskAudit(c *fiber.Ctx) error {
	var req services.CreateRiskAuditRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.riskService.CreateRiskAudit(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "风控审核创建成功",
	})
}

func (h *RiskAuditHandler) GetRiskAudits(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	audits, err := h.riskService.GetRiskAudits(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": audits,
	})
}

func (h *RiskAuditHandler) GetLatestRiskAudit(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	audit, err := h.riskService.GetLatestRiskAudit(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "风控审核记录不存在",
		})
	}

	return c.JSON(fiber.Map{
		"data": audit,
	})
}
