package main

import (
	"log"
	"meat-inspection-system/database"
	_ "meat-inspection-system/docs"
	"meat-inspection-system/handlers"
	"meat-inspection-system/middleware"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/swagger"
)

// @title 肉类分割厂-检疫证明与质检放行系统
// @version 1.0
// @description 肉类分割厂检疫证明管理、质检放行全流程管理系统，支持角色权限控制、状态流转、历史追溯
// @contact.name API Support
// @contact.email support@example.com
// @host localhost:3000
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
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
	certificates.Post("/:id/releases", middleware.IdempotencyCheck, handlers.CreateReleaseFromCertificate)

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
