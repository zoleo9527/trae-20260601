package handlers

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

type ComplaintHandler struct {
	store *store.Store
}

func NewComplaintHandler(s *store.Store) *ComplaintHandler {
	return &ComplaintHandler{store: s}
}

func (h *ComplaintHandler) CreateComplaint(c *fiber.Ctx) error {
	var req models.CreateComplaintRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	complaint := h.store.CreateComplaint(req)

	h.store.CreateNotification(
		"新投诉待处理",
		"投诉编号 "+complaint.ComplaintNo+"："+complaint.ComplaintType,
		models.RoleCustomerService,
		"",
		"complaint",
		complaint.ID,
	)

	return c.Status(fiber.StatusCreated).JSON(complaint)
}

func (h *ComplaintHandler) ListComplaints(c *fiber.Ctx) error {
	complaints := h.store.ListComplaints()
	return c.JSON(complaints)
}

func (h *ComplaintHandler) GetComplaint(c *fiber.Ctx) error {
	id := c.Params("id")
	complaint, ok := h.store.GetComplaint(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "complaint not found"})
	}
	return c.JSON(complaint)
}

func (h *ComplaintHandler) HandleComplaint(c *fiber.Ctx) error {
	id := c.Params("id")

	var req models.HandleComplaintRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	complaint, ok := h.store.HandleComplaint(id, req)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "complaint not found"})
	}

	return c.JSON(complaint)
}

func (h *ComplaintHandler) GetComplaintDetail(c *fiber.Ctx) error {
	id := c.Params("id")
	detail, ok := h.store.GetComplaintDetail(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "complaint not found"})
	}
	return c.JSON(detail)
}
