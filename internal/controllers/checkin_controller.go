package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type CheckinController struct {
	service *services.CheckinService
}

func NewCheckinController(service *services.CheckinService) *CheckinController {
	return &CheckinController{service: service}
}

func (c *CheckinController) CreateCheckin(ctx *fiber.Ctx) error {
	var req services.CreateCheckinRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	checkin, err := c.service.CreateCheckin(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(checkin)
}

func (c *CheckinController) GetCheckinByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	checkin, err := c.service.GetCheckinByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Checkin not found"})
	}
	return ctx.JSON(checkin)
}

func (c *CheckinController) GetCheckinsByCourse(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	checkins, err := c.service.GetCheckinsByCourse(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(checkins)
}

func (c *CheckinController) UpdateCheckin(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.UpdateCheckinRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	checkin, err := c.service.UpdateCheckin(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(checkin)
}

func (c *CheckinController) RejectCheckin(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req struct {
		OperatorID   string `json:"operator_id"`
		OperatorName string `json:"operator_name"`
		Reason       string `json:"reason"`
	}
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	checkin, err := c.service.RejectCheckin(id, req.OperatorID, req.OperatorName, req.Reason)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(checkin)
}

func (c *CheckinController) BackfillCheckin(ctx *fiber.Ctx) error {
	var req services.CreateCheckinRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	checkin, err := c.service.BackfillCheckin(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(checkin)
}
