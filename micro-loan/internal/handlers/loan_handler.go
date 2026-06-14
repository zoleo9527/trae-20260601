package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/services"
)

type LoanHandler struct {
	loanService *services.LoanService
}

func NewLoanHandler() *LoanHandler {
	return &LoanHandler{
		loanService: services.NewLoanService(),
	}
}

func (h *LoanHandler) CreateLoan(c *fiber.Ctx) error {
	var req services.CreateLoanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	loan, err := h.loanService.CreateLoan(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "借款申请创建成功",
		"data":    loan,
	})
}

func (h *LoanHandler) GetLoan(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	loan, err := h.loanService.GetLoan(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "借款申请不存在",
		})
	}

	return c.JSON(fiber.Map{
		"data": loan,
	})
}

func (h *LoanHandler) GetLoanWithDetails(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	detail, err := h.loanService.GetLoanWithDetails(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "借款申请不存在",
		})
	}

	return c.JSON(fiber.Map{
		"data": detail,
	})
}

func (h *LoanHandler) ListLoans(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	status := c.Query("status")
	handler := c.Query("handler")

	loans, total, err := h.loanService.ListLoans(&services.ListLoansRequest{
		Page:     page,
		PageSize: pageSize,
		Status:   status,
		Handler:  handler,
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"loans":     loans,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *LoanHandler) UpdateStatus(c *fiber.Ctx) error {
	var req services.UpdateStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.loanService.UpdateStatus(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "状态更新成功",
	})
}
