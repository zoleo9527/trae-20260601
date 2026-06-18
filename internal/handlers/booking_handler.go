package handlers

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

type BookingHandler struct {
	store *store.Store
}

func NewBookingHandler(s *store.Store) *BookingHandler {
	return &BookingHandler{store: s}
}

func (h *BookingHandler) ListBookings(c *fiber.Ctx) error {
	bookings := h.store.ListBookings()
	return c.JSON(bookings)
}

func (h *BookingHandler) GetBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	booking, ok := h.store.GetBooking(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	return c.JSON(booking)
}

func (h *BookingHandler) CreateBooking(c *fiber.Ctx) error {
	var req models.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	booking := h.store.CreateBooking(req)
	return c.Status(fiber.StatusCreated).JSON(booking)
}

func (h *BookingHandler) UpdateBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.UpdateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	booking, ok := h.store.UpdateBooking(id, req)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}

	return c.JSON(booking)
}

func (h *BookingHandler) GetBookingDetail(c *fiber.Ctx) error {
	id := c.Params("id")
	detail, ok := h.store.GetBookingDetail(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	return c.JSON(detail)
}
