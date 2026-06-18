package controllers

import (
	"museum-education/internal/services"

	"github.com/gofiber/fiber/v2"
)

type InstructorController struct {
	service *services.InstructorService
}

func NewInstructorController(service *services.InstructorService) *InstructorController {
	return &InstructorController{service: service}
}

func (c *InstructorController) CreateInstructor(ctx *fiber.Ctx) error {
	var req services.CreateInstructorRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	instructor, err := c.service.CreateInstructor(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(instructor)
}

func (c *InstructorController) GetInstructorByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	instructor, err := c.service.GetInstructorByID(id)
	if err != nil {
		return ctx.Status(404).JSON(fiber.Map{"error": "Instructor not found"})
	}
	return ctx.JSON(instructor)
}

func (c *InstructorController) GetInstructors(ctx *fiber.Ctx) error {
	status := ctx.Query("status")
	instructors, err := c.service.GetInstructors(status)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(instructors)
}

func (c *InstructorController) UpdateInstructor(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	var req services.UpdateInstructorRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	instructor, err := c.service.UpdateInstructor(id, req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.JSON(instructor)
}

func (c *InstructorController) ScheduleCourse(ctx *fiber.Ctx) error {
	var req services.ScheduleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	schedule, err := c.service.ScheduleCourse(req)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON(schedule)
}

func (c *InstructorController) GetInstructorSchedule(ctx *fiber.Ctx) error {
	instructorID := ctx.Params("instructor_id")
	schedules, err := c.service.GetInstructorSchedule(instructorID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(schedules)
}

func (c *InstructorController) GetCourseSchedule(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")
	schedules, err := c.service.GetCourseSchedule(courseID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(schedules)
}
