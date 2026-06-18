package main

import (
	"log"
	"museum-education/internal/config"
	"museum-education/internal/database"
	"museum-education/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	config.Load()

	db, err := database.NewDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	database.Migrate(db)

	app := fiber.New()

	app.Use(logger.New())
	app.Use(recover.New())

	routes.Setup(app, db)

	log.Printf("Server starting on port %s", config.Port)
	log.Fatal(app.Listen(":" + config.Port))
}
