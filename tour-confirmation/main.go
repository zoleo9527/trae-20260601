package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"tour-confirmation/handler"
	"tour-confirmation/store"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "旅游地接社-团队行程与资源确认",
	})
	app.Use(cors.New())

	s := store.New()
	itinH := handler.NewItineraryHandler(s)
	confirmH := handler.NewConfirmationHandler(s)
	exportH := handler.NewExportHandler(s)

	api := app.Group("/api/v1")

	itin := api.Group("/itineraries")
	itin.Post("/", itinH.Create)
	itin.Get("/", itinH.List)
	itin.Get("/:id", itinH.Get)
	itin.Put("/:id", itinH.Update)
	itin.Post("/:id/submit", itinH.Submit)
	itin.Post("/:id/withdraw", itinH.Withdraw)
	itin.Post("/:id/remind", itinH.Remind)
	itin.Get("/:id/audit", itinH.AuditHistory)

	confirm := api.Group("/confirmations")
	confirm.Post("/", confirmH.Create)
	confirm.Get("/", confirmH.List)
	confirm.Get("/:id", confirmH.Get)
	confirm.Post("/:id/confirm", confirmH.Confirm)
	confirm.Post("/:id/reject", confirmH.Reject)
	confirm.Post("/:id/revise", confirmH.Revise)
	confirm.Post("/:id/materials", confirmH.AddMaterial)
	confirm.Post("/:id/notes", confirmH.AddNote)
	confirm.Get("/:id/audit", confirmH.AuditHistory)

	exports := api.Group("/exports")
	exports.Post("/", exportH.Create)
	exports.Get("/:id", exportH.Get)
	exports.Get("/:id/download", exportH.Download)

	app.Listen(":3000")
}
