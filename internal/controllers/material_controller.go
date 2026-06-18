package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type MaterialController struct {
	service *services.MaterialService
}

func NewMaterialController(service *services.MaterialService) *MaterialController {
	return &MaterialController{service: service}
}

func (c *MaterialController) CreateMaterial(ctx *fiber.Ctx) error {
	var req services.CreateMaterialRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	material, err := c.service.CreateMaterial(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(material)
}

func (c *MaterialController) GetMaterialByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	material, err := c.service.GetMaterialByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Material not found"})
	}
	return ctx.JSON(material)
}

func (c *MaterialController) GetMaterialsByCourse(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	materials, err := c.service.GetMaterialsByCourse(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(materials)
}

func (c *MaterialController) UpdateMaterial(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.UpdateMaterialRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	material, err := c.service.UpdateMaterial(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(material)
}

func (c *MaterialController) DeleteMaterial(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := c.service.DeleteMaterial(id); err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(204).Send(nil)
}

func (c *MaterialController) GetMaterialList(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	list, err := c.service.GetMaterialList(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(list)
}
