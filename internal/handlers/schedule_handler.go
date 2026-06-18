package handlers

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

type ScheduleHandler struct {
	store *store.Store
}

func NewScheduleHandler(s *store.Store) *ScheduleHandler {
	return &ScheduleHandler{store: s}
}

func (h *ScheduleHandler) ListSchedules(c *fiber.Ctx) error {
	schedules := h.store.ListSchedules()
	return c.JSON(schedules)
}

func (h *ScheduleHandler) GetSchedule(c *fiber.Ctx) error {
	id := c.Params("id")
	schedule, ok := h.store.GetSchedule(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "schedule not found"})
	}
	return c.JSON(schedule)
}

func (h *ScheduleHandler) CreateSchedule(c *fiber.Ctx) error {
	var req models.CreateScheduleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	schedule := h.store.CreateSchedule(req)
	return c.Status(fiber.StatusCreated).JSON(schedule)
}

func (h *ScheduleHandler) UpdateSchedule(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.UpdateScheduleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	schedule, ok := h.store.UpdateSchedule(id, req)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "schedule not found"})
	}
	return c.JSON(schedule)
}

func (h *ScheduleHandler) GetScheduleDetail(c *fiber.Ctx) error {
	id := c.Params("id")
	detail, ok := h.store.GetScheduleDetail(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "schedule not found"})
	}
	return c.JSON(detail)
}

func (h *ScheduleHandler) ListSchedulesByBooking(c *fiber.Ctx) error {
	bookingID := c.Params("bookingId")
	schedules := h.store.ListSchedulesByBooking(bookingID)
	return c.JSON(schedules)
}
