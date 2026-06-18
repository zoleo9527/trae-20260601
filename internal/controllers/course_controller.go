package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type CourseController struct {
	service *services.CourseService
}

func NewCourseController(service *services.CourseService) *CourseController {
	return &CourseController{service: service}
}

func (c *CourseController) CreateCourse(ctx *fiber.Ctx) error {
	var req services.CreateCourseRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	course, err := c.service.CreateCourse(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(course)
}

func (c *CourseController) GetCourseByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	course, err := c.service.GetCourseByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Course not found"})
	}
	return ctx.JSON(course)
}

func (c *CourseController) GetCourses(ctx *fiber.Ctx) error {
	status := ctx.Query("status")
	courses, err := c.service.GetCourses(status)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(courses)
}

func (c *CourseController) UpdateCourse(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.UpdateCourseRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	course, err := c.service.UpdateCourse(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(course)
}

func (c *CourseController) DeleteCourse(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req struct {
		OperatorID   string `json:"operator_id"`
		OperatorName string `json:"operator_name"`
	}
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := c.service.DeleteCourse(id, req.OperatorID, req.OperatorName); err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(204).Send(nil)
}
