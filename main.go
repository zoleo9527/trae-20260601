package main

import (
	"log"
	"meat-inspection-system/database"
	"meat-inspection-system/handlers"
	"meat-inspection-system/middleware"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/swagger"
)

func main() {
	database.InitDB()

	app := fiber.New(fiber.Config{
		AppName: "肉类分割厂-检疫证明与质检放行系统",
	})

	app.Use(cors.New())
	app.Use(logger.New())

	app.Static("/", "./public")

	api := app.Group("/api")
	api.Post("/login", handlers.Login)

	api.Use(middleware.AuthRequired)

	certificates := api.Group("/certificates")
	certificates.Get("/", handlers.ListCertificates)
	certificates.Get("/:id", handlers.GetCertificate)
	certificates.Post("/", middleware.IdempotencyCheck, handlers.CreateCertificate)
	certificates.Put("/:id/status", handlers.UpdateCertificateStatus)
	certificates.Post("/:id/notes", handlers.AddCertificateNote)

	releases := api.Group("/releases")
	releases.Get("/", handlers.ListReleases)
	releases.Get("/:id", handlers.GetRelease)
	releases.Post("/", middleware.IdempotencyCheck, handlers.CreateRelease)
	releases.Put("/:id/status", handlers.UpdateReleaseStatus)
	releases.Post("/:id/notes", handlers.AddReleaseNote)

	dashboard := api.Group("/dashboard")
	dashboard.Get("/stats", handlers.GetDashboardStats)
	dashboard.Get("/blocked", handlers.GetBlockedItems)

	app.Get("/swagger/*", swagger.HandlerDefault)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 服务器启动在 http://localhost:%s", port)
	log.Fatal(app.Listen(":" + port))
}
