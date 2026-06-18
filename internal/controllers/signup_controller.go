package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type SignupController struct {
	service *services.SignupService
}

func NewSignupController(service *services.SignupService) *SignupController {
	return &SignupController{service: service}
}

func (c *SignupController) CreateSignup(ctx *fiber.Ctx) error {
	var req services.CreateSignupRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	signup, err := c.service.CreateSignup(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(signup)
}

func (c *SignupController) GetSignupByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	signup, err := c.service.GetSignupByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Signup not found"})
	}
	return ctx.JSON(signup)
}

func (c *SignupController) GetSignupsByCourse(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	signups, err := c.service.GetSignupsByCourse(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(signups)
}

func (c *SignupController) GetSignupsByStudent(ctx *fiber.Ctx) error {
	studentID := ctx.Params("student_id")
	signups, err := c.service.GetSignupsByStudent(studentID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(signups)
}

func (c *SignupController) UpdateSignup(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.UpdateSignupRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	signup, err := c.service.UpdateSignup(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(signup)
}

func (c *SignupController) CancelSignup(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	signup, err := c.service.CancelSignup(id)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(signup)
}
