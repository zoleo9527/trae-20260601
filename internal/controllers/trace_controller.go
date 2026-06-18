package controllers

import (
	"museum-education/internal/services"
	"time"

	"github.com/gofiber/fiber/v2"
)

type TraceController struct {
	service *services.TraceService
}

func NewTraceController(service *services.TraceService) *TraceController {
	return &TraceController{service: service}
}

func (c *TraceController) GetFullTrace(ctx *fiber.Ctx) error {
	checkinID := ctx.Params("checkin_id")
	trace, err := c.service.GetFullTrace(checkinID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(trace)
}

func (c *TraceController) GetCourseTrace(ctx *fiber.Ctx) error {
	courseID := ctx.Params("course_id")

	var startTime, endTime time.Time
	if start := ctx.Query("start_time"); start != "" {
		if t, err := time.Parse(time.RFC3339, start); err == nil {
			startTime = t
		}
	}
	if end := ctx.Query("end_time"); end != "" {
		if t, err := time.Parse(time.RFC3339, end); err == nil {
			endTime = t
		}
	}

	trace, err := c.service.GetCourseTrace(courseID, startTime, endTime)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return ctx.JSON(trace)
}
