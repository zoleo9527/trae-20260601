package services

import (
	"errors"
	"time"

	"micro-loan/internal/models"
	"micro-loan/internal/repository"
)

type RiskAuditService struct {
	riskRepo    *repository.RiskAuditRepository
	loanRepo    *repository.LoanRepository
	docRepo     *repository.DocumentRepository
	warningRepo *repository.WarningRepository
	auditRepo   *repository.AuditLogRepository
}

func NewRiskAuditService() *RiskAuditService {
	return &RiskAuditService{
		riskRepo:    repository.NewRiskAuditRepository(),
		loanRepo:    repository.NewLoanRepository(),
		docRepo:     repository.NewDocumentRepository(),
		warningRepo: repository.NewWarningRepository(),
		auditRepo:   repository.NewAuditLogRepository(),
	}
}

type CreateRiskAuditRequest struct {
	LoanApplicationID  uint    `json:"loan_application_id" binding:"required"`
	RiskScore           float64 `json:"risk_score" binding:"required"`
	RiskConclusion     string  `json:"risk_conclusion" binding:"required"`
	RiskSuggestion     string  `json:"risk_suggestion"`
	IsForgery           bool    `json:"is_forgery"`
	ForgeryDescription string  `json:"forgery_description"`
	Remark              string  `json:"remark"`
	AuditorID          string  `json:"auditor_id" binding:"required"`
	OperatorRole       models.RoleType `json:"operator_role" binding:"required"`
	IPAddress          string  `json:"ip_address"`
	UserAgent          string  `json:"user_agent"`
}

func (s *RiskAuditService) CreateRiskAudit(req *CreateRiskAuditRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanApplicationID)
	if err != nil {
		return errors.New("借款申请不存在")
	}

	if loan.Status != models.LoanStatusRiskAuditing {
		return errors.New("当前状态不允许进行风控审核")
	}

	audit := &models.RiskAudit{
		LoanApplicationID:  req.LoanApplicationID,
		RiskScore:         req.RiskScore,
		RiskConclusion:    req.RiskConclusion,
		RiskSuggestion:    req.RiskSuggestion,
		AuditorID:         req.AuditorID,
		AuditTime:         time.Now(),
		IsForgery:         req.IsForgery,
		ForgeryDescription: req.ForgeryDescription,
		Remark:            req.Remark,
	}

	err = s.riskRepo.Create(audit)
	if err != nil {
		return err
	}

	if req.IsForgery {
		warning := &models.WarningRecord{
			LoanApplicationID: req.LoanApplicationID,
			WarningType:       models.WarningTypeForgery,
			WarningContent:    "风控审核发现造假: " + req.ForgeryDescription,
			WarningTime:       time.Now(),
			Status:            models.WarningStatusPending,
		}
		s.warningRepo.Create(warning)

		forgedDocs, _ := s.docRepo.GetForgeryDocuments(req.LoanApplicationID)
		for _, doc := range forgedDocs {
			doc.IsForged = true
			doc.ForgeryReason = "风控审核标记"
			s.docRepo.Update(&doc)
		}
	}

	s.createAuditLog("CREATE_RISK_AUDIT", req.AuditorID, req.OperatorRole, &req.LoanApplicationID,
		"创建风控审核", "", "", req.IPAddress, req.UserAgent)

	return nil
}

func (s *RiskAuditService) GetRiskAudits(loanID uint) ([]models.RiskAudit, error) {
	return s.riskRepo.GetByLoanID(loanID)
}

func (s *RiskAuditService) GetLatestRiskAudit(loanID uint) (*models.RiskAudit, error) {
	return s.riskRepo.GetLatestByLoanID(loanID)
}

func (s *RiskAuditService) createAuditLog(operationType, operatorID string, operatorRole models.RoleType, loanID *uint, operationDesc, beforeData, afterData, ipAddress, userAgent string) {
	auditLog := &models.AuditLog{
		OperationType:     operationType,
		OperatorID:        operatorID,
		OperatorRole:      operatorRole,
		LoanApplicationID: loanID,
		OperationDesc:     operationDesc,
		BeforeData:        beforeData,
		AfterData:         afterData,
		IPAddress:         ipAddress,
		UserAgent:         userAgent,
		CreatedAt:         time.Now(),
	}
	s.auditRepo.Create(auditLog)
}
