package main

import (
	"central-kitchen/internal/database"
	"central-kitchen/internal/routes"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	if err := database.Init(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      "Central Kitchen API",
		ServerHeader: "Central-Kitchen",
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	app.Use(logger.New(logger.Config{
		Format:     "${time} ${status} ${method} ${path} ${latency}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))

	routes.SetupRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Central Kitchen API server starting on port %s", port)
	log.Printf("📋 Default users (password: pass123):")
	log.Printf("   - procurement1 (采购主管)")
	log.Printf("   - production1 (生产班长)")
	log.Printf("   - store1 (门店督导)")
	log.Printf("🔗 API base URL: http://localhost:%s/api", port)

	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
