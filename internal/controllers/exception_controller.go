package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type ExceptionController struct {
	service *services.ExceptionService
}

func NewExceptionController(service *services.ExceptionService) *ExceptionController {
	return &ExceptionController{service: service}
}

func (c *ExceptionController) CreateException(ctx *fiber.Ctx) error {
	var req services.CreateExceptionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	exception, err := c.service.CreateException(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(exception)
}

func (c *ExceptionController) GetExceptionByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	exception, err := c.service.GetExceptionByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Exception not found"})
	}
	return ctx.JSON(exception)
}

func (c *ExceptionController) GetExceptionsByCheckin(ctx *fiber.Ctx) error {
	checkinID := ctx.Params("checkin_id")
	exceptions, err := c.service.GetExceptionsByCheckin(checkinID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(exceptions)
}

func (c *ExceptionController) GetExceptionsByCourse(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	exceptions, err := c.service.GetExceptionsByCourse(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(exceptions)
}

func (c *ExceptionController) GetOpenExceptions(ctx *fiber.Ctx) error {
	exceptions, err := c.service.GetOpenExceptions()
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(exceptions)
}

func (c *ExceptionController) ResolveException(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.ResolveExceptionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	exception, err := c.service.ResolveException(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(exception)
}
