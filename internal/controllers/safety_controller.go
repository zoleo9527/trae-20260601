package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type SafetyController struct {
	service *services.SafetyService
}

func NewSafetyController(service *services.SafetyService) *SafetyController {
	return &SafetyController{service: service}
}

func (c *SafetyController) CreateSafetyRecord(ctx *fiber.Ctx) error {
	var req services.CreateSafetyRecordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	record, err := c.service.CreateSafetyRecord(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(record)
}

func (c *SafetyController) GetSafetyRecordByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	record, err := c.service.GetSafetyRecordByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Safety record not found"})
	}
	return ctx.JSON(record)
}

func (c *SafetyController) GetSafetyRecordsByCourse(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	records, err := c.service.GetSafetyRecordsByCourse(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(records)
}

func (c *SafetyController) GetSafetyRecordsByCheckin(ctx *fiber.Ctx) error {
	checkinID := ctx.Params("checkin_id")
	records, err := c.service.GetSafetyRecordsByCheckin(checkinID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(records)
}

func (c *SafetyController) UpdateSafetyRecord(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.UpdateSafetyRecordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	record, err := c.service.UpdateSafetyRecord(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(record)
}


