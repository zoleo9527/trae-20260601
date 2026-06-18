package handlers

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

type CheckinHandler struct {
	store *store.Store
}

func NewCheckinHandler(s *store.Store) *CheckinHandler {
	return &CheckinHandler{store: s}
}

func (h *CheckinHandler) CreateCheckin(c *fiber.Ctx) error {
	var req models.CreateCheckinRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	record := h.store.CreateCheckin(req)
	return c.Status(fiber.StatusCreated).JSON(record)
}

func (h *CheckinHandler) ListCheckins(c *fiber.Ctx) error {
	records := h.store.ListCheckins()
	return c.JSON(records)
}

func (h *CheckinHandler) ListCheckinsByBooking(c *fiber.Ctx) error {
	bookingID := c.Params("bookingId")
	records := h.store.ListCheckinsByBooking(bookingID)
	return c.JSON(records)
}
