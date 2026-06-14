package services

import (
	"time"

	"micro-loan/internal/models"
	"micro-loan/internal/repository"
)

type WarningService struct {
	warningRepo *repository.WarningRepository
	auditRepo   *repository.AuditLogRepository
}

func NewWarningService() *WarningService {
	return &WarningService{
		warningRepo: repository.NewWarningRepository(),
		auditRepo:   repository.NewAuditLogRepository(),
	}
}

type HandleWarningRequest struct {
	WarningID   uint   `json:"warning_id" binding:"required"`
	Status      models.WarningStatus `json:"status" binding:"required"`
	HandlerID   string `json:"handler_id" binding:"required"`
	OperatorRole models.RoleType `json:"operator_role" binding:"required"`
	Remark      string `json:"remark"`
	IPAddress   string `json:"ip_address"`
	UserAgent   string `json:"user_agent"`
}

func (s *WarningService) HandleWarning(req *HandleWarningRequest) error {
	err := s.warningRepo.UpdateStatus(req.WarningID, req.Status, req.HandlerID, req.Remark)
	if err != nil {
		return err
	}

	now := time.Now()
	s.auditRepo.Create(&models.AuditLog{
		OperationType: "HANDLE_WARNING",
		OperatorID:    req.HandlerID,
		OperatorRole:  req.OperatorRole,
		OperationDesc: "处理预警 ID:" + string(rune(req.WarningID)),
		IPAddress:     req.IPAddress,
		UserAgent:     req.UserAgent,
		CreatedAt:    now,
	})

	return nil
}

func (s *WarningService) GetWarningsByLoanID(loanID uint) ([]models.WarningRecord, error) {
	return s.warningRepo.GetByLoanID(loanID)
}

func (s *WarningService) GetPendingWarnings() ([]models.WarningRecord, error) {
	return s.warningRepo.GetPendingWarnings()
}

func (s *WarningService) GetWarningsByType(warningType models.WarningType) ([]models.WarningRecord, error) {
	var warnings []models.WarningRecord
	pendingWarnings, err := s.warningRepo.GetPendingWarnings()
	if err != nil {
		return nil, err
	}

	for _, w := range pendingWarnings {
		if w.WarningType == warningType {
			warnings = append(warnings, w)
		}
	}

	return warnings, nil
}
