package services

import (
	"micro-loan/internal/models"
	"micro-loan/internal/repository"
)

type AuditService struct {
	auditRepo *repository.AuditLogRepository
}

func NewAuditService() *AuditService {
	return &AuditService{
		auditRepo: repository.NewAuditLogRepository(),
	}
}

type ListAuditLogsRequest struct {
	Page         int    `form:"page" binding:"required,gt=0"`
	PageSize     int    `form:"page_size" binding:"required,gt=0"`
	OperatorID   string `form:"operator_id"`
	OperationType string `form:"operation_type"`
}

func (s *AuditService) ListAuditLogs(req *ListAuditLogsRequest) ([]models.AuditLog, int64, error) {
	return s.auditRepo.List(req.Page, req.PageSize, req.OperatorID, req.OperationType)
}

func (s *AuditService) GetAuditLogsByLoanID(loanID uint) ([]models.AuditLog, error) {
	return s.auditRepo.GetByLoanID(loanID)
}
