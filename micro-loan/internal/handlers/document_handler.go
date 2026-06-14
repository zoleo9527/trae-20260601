package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/services"
)

type DocumentHandler struct {
	docService *services.DocumentService
}

func NewDocumentHandler() *DocumentHandler {
	return &DocumentHandler{
		docService: services.NewDocumentService(),
	}
}

func (h *DocumentHandler) UploadDocument(c *fiber.Ctx) error {
	var req services.UploadDocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	doc, err := h.docService.UploadDocument(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "资料上传成功",
		"data":    doc,
	})
}

func (h *DocumentHandler) ReviewDocument(c *fiber.Ctx) error {
	var req services.ReviewDocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.docService.ReviewDocument(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "资料审核成功",
	})
}

func (h *DocumentHandler) GetDocuments(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("loan_id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的借款申请ID",
		})
	}

	docs, err := h.docService.GetDocuments(uint(id))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": docs,
	})
}

func (h *DocumentHandler) GetDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的资料ID",
		})
	}

	doc, err := h.docService.GetDocument(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "资料不存在",
		})
	}

	return c.JSON(fiber.Map{
		"data": doc,
	})
}

func (h *DocumentHandler) IdempotentSubmit(c *fiber.Ctx) error {
	var req services.IdempotentSubmitRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "无效的请求数据",
		})
	}

	req.IPAddress = c.IP()
	req.UserAgent = c.Get("User-Agent")

	err := h.docService.IdempotentSubmit(&req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "资料提交成功",
	})
}
