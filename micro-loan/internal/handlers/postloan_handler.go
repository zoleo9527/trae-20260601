package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/services"
)

type PostLoanHandler struct {
	postLoanService *services.PostLoanService
}

func NewPostLoanHandler() *PostLoanHandler {
	return &PostLoanHandler{
		postLoanService: services.NewPostLoanService(),
	}
}

func (h *PostLoanHandler) CreateCollection(c *fiber.Ctx) error {
	var req services.CreateCollectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.postLoanService.CreateCollection(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "催收记录创建成功",
	})
}

func (h *PostLoanHandler) GetCollections(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	collections, err := h.postLoanService.GetCollections(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": collections,
	})
}

func (h *PostLoanHandler) CreateExtension(c *fiber.Ctx) error {
	var req services.CreateExtensionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.postLoanService.CreateExtension(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "展期申请创建成功",
	})
}

func (h *PostLoanHandler) ApproveExtension(c *fiber.Ctx) error {
	var req services.ApproveExtensionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.postLoanService.ApproveExtension(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "展期审批成功",
	})
}

func (h *PostLoanHandler) GetExtensions(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	extensions, err := h.postLoanService.GetExtensions(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": extensions,
	})
}

func (h *PostLoanHandler) CheckOverdueRemind(c *fiber.Ctx) error {
	var req services.CheckOverdueRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	err := h.postLoanService.CheckOverdueRemind(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "逾期提醒检查完成",
	})
}
