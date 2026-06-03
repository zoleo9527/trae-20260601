package routes

import (
	"central-kitchen/internal/handler"
	"central-kitchen/internal/middleware"
	"central-kitchen/internal/models"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Central Kitchen API is running",
		})
	})

	auth := api.Group("/auth")
	auth.Post("/login", handler.Login)

	auth.Get("/me", middleware.AuthRequired(), handler.GetCurrentUser)
	auth.Get("/users", middleware.AuthRequired(), handler.GetUsers)

	purchase := api.Group("/purchase-orders", middleware.AuthRequired())
	purchase.Get("/", handler.GetPurchaseOrders)
	purchase.Get("/:id", handler.GetPurchaseOrder)
	purchase.Get("/:id/logs", handler.GetPurchaseOrderLogs)

	purchase.Post("/", middleware.RoleRequired(models.RoleProcurementManager), handler.CreatePurchaseOrder)
	purchase.Patch("/:id/status", middleware.RoleRequired(models.RoleProcurementManager), handler.UpdatePurchaseOrderStatus)

	requisition := api.Group("/requisitions", middleware.AuthRequired())
	requisition.Get("/", handler.GetRequisitions)
	requisition.Get("/:id", handler.GetRequisition)
	requisition.Get("/:id/logs", handler.GetRequisitionLogs)

	requisition.Post("/", middleware.RoleRequired(models.RoleProductionForeman), handler.CreateRequisition)
	requisition.Post("/:id/pick", middleware.RoleRequired(models.RoleProductionForeman), handler.PickRequisitionItems)
	requisition.Post("/:id/initiate-allergen-review", middleware.RoleRequired(models.RoleProductionForeman), handler.InitiateAllergenReview)
	requisition.Patch("/:id/status", handler.UpdateRequisitionStatus)

	allergen := api.Group("/allergen-reviews", middleware.AuthRequired())
	allergen.Get("/", handler.GetAllergenReviews)
	allergen.Get("/history", handler.GetAllergenReviewHistory)
	allergen.Get("/:id", handler.GetAllergenReview)
	allergen.Get("/:id/logs", handler.GetAllergenReviewLogs)
	allergen.Get("/requisition/:requisitionId", handler.GetAllergenReviewByRequisition)

	allergen.Post("/:id/submit", middleware.RoleRequired(models.RoleProductionForeman), handler.SubmitAllergenReview)
	allergen.Post("/:id/verify", middleware.RoleRequired(models.RoleStoreSupervisor), handler.VerifyAllergenReview)

	api.Get("/error-codes", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"general": fiber.Map{
				"0":     "success",
				"10001": "invalid parameters",
				"10002": "unauthorized",
				"10003": "forbidden",
				"10004": "resource not found",
				"10005": "internal server error",
				"10006": "resource conflict",
			},
			"user": fiber.Map{
				"20001": "user not found",
				"20002": "invalid username or password",
				"20003": "username already exists",
			},
			"purchase_order": fiber.Map{
				"30001": "purchase order not found",
				"30002": "invalid purchase order status for this operation",
				"30003": "order number already exists",
			},
			"requisition": fiber.Map{
				"40001": "requisition not found",
				"40002": "invalid requisition status for this operation",
				"40003": "requisition number already exists",
				"40004": "purchase order not received yet",
				"40005": "insufficient stock for requisition",
			},
			"allergen_review": fiber.Map{
				"50001": "allergen review not found",
				"50002": "invalid allergen review status for this operation",
				"50003": "allergen review already exists for this requisition",
				"50004": "only production foreman who picked can initiate allergen review",
			},
			"role_permission": fiber.Map{
				"60001": "insufficient role permissions",
				"60002": "invalid role",
			},
		})
	})
}
