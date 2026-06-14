package handlers

import (
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	customerManager := api.Group("/customer-manager")
	loanHandler := NewLoanHandler()
	customerManager.Post("/loans", loanHandler.CreateLoan)
	customerManager.Get("/loans/:id", loanHandler.GetLoan)
	customerManager.Get("/loans/:id/details", loanHandler.GetLoanWithDetails)
	customerManager.Get("/loans", loanHandler.ListLoans)
	customerManager.Put("/loans/status", loanHandler.UpdateStatus)

	docHandler := NewDocumentHandler()
	customerManager.Post("/documents", docHandler.UploadDocument)
	customerManager.Get("/documents/:id", docHandler.GetDocument)
	customerManager.Get("/documents/loan/:loan_id", docHandler.GetDocuments)
	customerManager.Post("/documents/submit", docHandler.IdempotentSubmit)

	riskAuditor := api.Group("/risk-auditor")
	riskAuditor.Get("/loans/:id", loanHandler.GetLoan)
	riskAuditor.Get("/loans/:id/details", loanHandler.GetLoanWithDetails)
	riskAuditor.Get("/loans", loanHandler.ListLoans)

	riskAuditHandler := NewRiskAuditHandler()
	riskAuditor.Post("/risk-audits", riskAuditHandler.CreateRiskAudit)
	riskAuditor.Get("/risk-audits/loan/:loan_id", riskAuditHandler.GetRiskAudits)
	riskAuditor.Get("/risk-audits/loan/:loan_id/latest", riskAuditHandler.GetLatestRiskAudit)

	docHandler = NewDocumentHandler()
	riskAuditor.Post("/documents/review", docHandler.ReviewDocument)
	riskAuditor.Get("/documents/:id", docHandler.GetDocument)
	riskAuditor.Get("/documents/loan/:loan_id", docHandler.GetDocuments)

	postLoanOfficer := api.Group("/post-loan-officer")
	postLoanOfficer.Get("/loans/:id", loanHandler.GetLoan)
	postLoanOfficer.Get("/loans/:id/details", loanHandler.GetLoanWithDetails)
	postLoanOfficer.Get("/loans", loanHandler.ListLoans)
	postLoanOfficer.Put("/loans/status", loanHandler.UpdateStatus)

	postLoanHandler := NewPostLoanHandler()
	postLoanOfficer.Post("/collections", postLoanHandler.CreateCollection)
	postLoanOfficer.Get("/collections/loan/:loan_id", postLoanHandler.GetCollections)

	postLoanOfficer.Post("/extensions", postLoanHandler.CreateExtension)
	postLoanOfficer.Put("/extensions/approve", postLoanHandler.ApproveExtension)
	postLoanOfficer.Get("/extensions/loan/:loan_id", postLoanHandler.GetExtensions)
	postLoanOfficer.Post("/overdue-check", postLoanHandler.CheckOverdueRemind)

	warningHandler := NewWarningHandler()
	postLoanOfficer.Post("/warnings/handle", warningHandler.HandleWarning)
	postLoanOfficer.Get("/warnings/loan/:loan_id", warningHandler.GetWarningsByLoanID)
	postLoanOfficer.Get("/warnings/pending", warningHandler.GetPendingWarnings)
	postLoanOfficer.Get("/warnings/type/:type", warningHandler.GetWarningsByType)

	auditHandler := NewAuditHandler()
	api.Get("/audit-logs", auditHandler.ListAuditLogs)
	api.Get("/audit-logs/loan/:loan_id", auditHandler.GetAuditLogsByLoanID)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})
}
