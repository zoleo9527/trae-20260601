package main

import (
	"log"
	"os"

	"scenic-ticket-system/internal/handlers"
	"scenic-ticket-system/internal/seed"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

func main() {

	s := store.NewStore()

	seed.Seed(s)

	app := fiber.New()

	bookingHandler := handlers.NewBookingHandler(s)

	scheduleHandler := handlers.NewScheduleHandler(s)

	checkinHandler := handlers.NewCheckinHandler(s)

	complaintHandler := handlers.NewComplaintHandler(s)

	notificationHandler := handlers.NewNotificationHandler(s)

	api := app.Group("/api")

	bookings := api.Group("/bookings")
	bookings.Get("/", bookingHandler.ListBookings)
	bookings.Post("/", bookingHandler.CreateBooking)
	bookings.Get("/:id", bookingHandler.GetBooking)
	bookings.Put("/:id", bookingHandler.UpdateBooking)
	bookings.Get("/:id/detail", bookingHandler.GetBookingDetail)

	schedules := api.Group("/schedules")
	schedules.Get("/", scheduleHandler.ListSchedules)
	schedules.Post("/", scheduleHandler.CreateSchedule)
	schedules.Get("/:id", scheduleHandler.GetSchedule)
	schedules.Put("/:id", scheduleHandler.UpdateSchedule)
	schedules.Get("/:id/detail", scheduleHandler.GetScheduleDetail)
	schedules.Get("/booking/:bookingId", scheduleHandler.ListSchedulesByBooking)

	checkins := api.Group("/checkins")
	checkins.Get("/", checkinHandler.ListCheckins)
	checkins.Post("/", checkinHandler.CreateCheckin)
	checkins.Get("/booking/:bookingId", checkinHandler.ListCheckinsByBooking)

	complaints := api.Group("/complaints")
	complaints.Get("/", complaintHandler.ListComplaints)
	complaints.Post("/", complaintHandler.CreateComplaint)
	complaints.Get("/:id", complaintHandler.GetComplaint)
	complaints.Get("/:id/detail", complaintHandler.GetComplaintDetail)
	complaints.Put("/:id/handle", complaintHandler.HandleComplaint)

	notifications := api.Group("/notifications")
	notifications.Get("/", notificationHandler.ListNotifications)
	notifications.Put("/:id/read", notificationHandler.MarkRead)

	log.Println("Server starting on :3000 ...")
	if err := app.Listen(":3000"); err != nil {
		log.Printf("Server failed to start: %v", err)
		os.Exit(1)
	}
}
