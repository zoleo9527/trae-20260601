package routes

import (
	"moving-company/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, h *handlers.Handler) {
	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/login", h.Login())
	auth.Get("/me", h.GetCurrentUser())
	auth.Get("/users", h.ListUsers())

	bookings := api.Group("/bookings")
	bookings.Get("/", h.ListBookings())
	bookings.Get("/:id", h.GetBooking())
	bookings.Post("/", h.CreateBooking())
	bookings.Patch("/:id", h.UpdateBooking())
	bookings.Delete("/:id", h.DeleteBooking())

	vehicles := api.Group("/vehicles")
	vehicles.Get("/", h.ListVehicles())
	vehicles.Get("/:id", h.GetVehicle())
	vehicles.Post("/", h.CreateVehicle())
	vehicles.Patch("/:id", h.UpdateVehicle())
	vehicles.Delete("/:id", h.DeleteVehicle())

	crew := api.Group("/crew")
	crew.Get("/", h.ListCrews())
	crew.Get("/:id", h.GetCrew())
	crew.Post("/", h.CreateCrew())
	crew.Patch("/:id", h.UpdateCrew())
	crew.Delete("/:id", h.DeleteCrew())

	damagePhotos := api.Group("/damage-photos")
	damagePhotos.Get("/", h.ListDamagePhotos())
	damagePhotos.Post("/", h.CreateDamagePhoto())
	damagePhotos.Delete("/:id", h.DeleteDamagePhoto())

	notifications := api.Group("/notifications")
	notifications.Get("/", h.ListNotifications())
	notifications.Patch("/:id/read", h.MarkNotificationRead())
	notifications.Post("/mark-all-read", h.MarkAllRead())

	schedules := api.Group("/schedules")
	schedules.Post("/", h.CreateScheduleAndAssign())
	schedules.Get("/", h.ListSchedules())
	schedules.Get("/timeline/:date", h.GetTimeline())
	schedules.Get("/:id", h.GetSchedule())
	schedules.Patch("/:id/status", h.UpdateScheduleStatus())

	assignments := api.Group("/assignments")
	assignments.Post("/batch", h.BatchAssign())
	assignments.Get("/", h.ListAssignments())
	assignments.Get("/review/:member_id", h.GetCrewReview())
	assignments.Get("/review", h.GetCrewReview())
	assignments.Patch("/:id", h.UpdateAssignment())

	exceptions := api.Group("/exceptions")
	exceptions.Post("/", h.CreateException())
	exceptions.Get("/", h.ListExceptions())
	exceptions.Get("/trigger/:booking_id", h.TriggerTestException())
	exceptions.Patch("/:id/handle", h.HandleException())
}
