package main

import (
	"log"
	"microloan-api/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	if err := SeedData(); err != nil {
		log.Fatalf("Failed to seed data: %v", err)
	}

	handlers.SetDB(DB)

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api/v1")
	{
		loans := api.Group("/loans")
		{
			loans.GET("", handlers.GetLoans)
			loans.GET("/:id", handlers.GetLoan)
			loans.POST("", handlers.CreateLoan)
			loans.PUT("/:id", handlers.UpdateLoan)
			loans.GET("/:id/timeline", handlers.GetLoanFullTimeline)
		}

		repayments := api.Group("/repayments")
		{
			repayments.GET("", handlers.GetRepaymentPlans)
			repayments.POST("", handlers.CreateRepaymentPlan)
			repayments.PUT("/:id", handlers.UpdateRepaymentPlan)
		}

		collections := api.Group("/collections")
		{
			collections.GET("", handlers.GetCollectionRecords)
			collections.GET("/:id", handlers.GetCollectionRecord)
			collections.POST("", handlers.CreateCollectionRecord)
			collections.PUT("/:id", handlers.UpdateCollectionRecord)
		}

		extensions := api.Group("/extensions")
		{
			extensions.GET("", handlers.GetExtensionApplications)
			extensions.GET("/:id", handlers.GetExtensionApplication)
			extensions.POST("", handlers.CreateExtensionApplication)
			extensions.POST("/:id/approve", handlers.ApproveExtensionApplication)
		}

		logs := api.Group("/logs")
		{
			logs.GET("", handlers.GetOperationLogs)
		}
	}

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
