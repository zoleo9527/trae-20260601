package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"micro-loan/internal/config"
	"micro-loan/internal/handlers"
	"micro-loan/internal/middleware"
)

func main() {
	cfg := config.LoadConfig()

	config.InitDB(cfg)

	app := fiber.New(fiber.Config{
		AppName: "Micro Loan API",
	})

	middleware.SetupMiddleware(app)

	handlers.SetupRoutes(app)

	log.Printf("Server starting on port %s", cfg.ServerPort)
	err := app.Listen(fmt.Sprintf(":%s", cfg.ServerPort))
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
