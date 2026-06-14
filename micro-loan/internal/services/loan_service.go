package services

import (
	"encoding/json"
	"fmt"
	"time"

	"micro-loan/internal/models"
	"micro-loan/internal/repository"
	"micro-loan/pkg/utils"
)

type LoanService struct {
	loanRepo       *repository.LoanRepository
	docRepo        *repository.DocumentRepository
	riskRepo       *repository.RiskAuditRepository
	collectionRepo *repository.CollectionRepository
	extensionRepo  *repository.ExtensionRepository
	warningRepo    *repository.WarningRepository
	auditRepo      *repository.AuditLogRepository
}

func NewLoanService() *LoanService {
	return &LoanService{
		loanRepo:       repository.NewLoanRepository(),
		docRepo:        repository.NewDocumentRepository(),
		riskRepo:       repository.NewRiskAuditRepository(),
		collectionRepo: repository.NewCollectionRepository(),
		extensionRepo:  repository.NewExtensionRepository(),
		warningRepo:    repository.NewWarningRepository(),
		auditRepo:      repository.NewAuditLogRepository(),
	}
}

type CreateLoanRequest struct {
	CustomerID   string  `json:"customer_id" binding:"required"`
	CustomerName string  `json:"customer_name" binding:"required"`
	LoanAmount   float64 `json:"loan_amount" binding:"required,gt=0"`
	LoanTerm     int     `json:"loan_term" binding:"required,gt=0"`
	InterestRate float64 `json:"interest_rate" binding:"required,gt=0"`
	OperatorID   string  `json:"operator_id" binding:"required"`
	OperatorRole models.RoleType `json:"operator_role" binding:"required"`
	IPAddress    string  `json:"ip_address"`
	UserAgent    string  `json:"user_agent"`
}

func (s *LoanService) CreateLoan(req *CreateLoanRequest) (*models.LoanApplication, error) {
	loan := &models.LoanApplication{
		ApplicationNo:   utils.GenerateApplicationNo(),
		CustomerID:       req.CustomerID,
		CustomerName:     req.CustomerName,
		LoanAmount:       req.LoanAmount,
		LoanTerm:         req.LoanTerm,
		InterestRate:     req.InterestRate,
		Status:           models.LoanStatusCollecting,
		StatusUpdatedAt:  time.Now(),
		CurrentHandler:   req.OperatorID,
		CreatedBy:        req.OperatorID,
		UpdatedBy:        req.OperatorID,
	}

	err := s.loanRepo.Create(loan)
	if err != nil {
		return nil, err
	}

	s.createAuditLog("CREATE_LOAN", req.OperatorID, req.OperatorRole, &loan.ID, fmt.Sprintf("创建借款申请 %s", loan.ApplicationNo), "", "", req.IPAddress, req.UserAgent)

	return loan, nil
}

func (s *LoanService) GetLoan(id uint) (*models.LoanApplication, error) {
	return s.loanRepo.GetByID(id)
}

func (s *LoanService) GetLoanWithDetails(id uint) (*models.LoanApplication, []models.DocumentCollection, []models.RiskAudit, []models.CollectionRecord, []models.ExtensionRecord, []models.WarningRecord, error) {
	loan, err := s.loanRepo.GetByID(id)
	if err != nil {
		return nil, nil, nil, nil, nil, nil, err
	}

	docs, _ := s.docRepo.GetByLoanID(id)
	audits, _ := s.riskRepo.GetByLoanID(id)
	collections, _ := s.collectionRepo.GetByLoanID(id)
	extensions, _ := s.extensionRepo.GetByLoanID(id)
	warnings, _ := s.warningRepo.GetByLoanID(id)

	return loan, docs, audits, collections, extensions, warnings, nil
}

type ListLoansRequest struct {
	Page       int    `form:"page" binding:"required,gt=0"`
	PageSize   int    `form:"page_size" binding:"required,gt=0"`
	Status     string `form:"status"`
	Handler    string `form:"handler"`
}

func (s *LoanService) ListLoans(req *ListLoansRequest) ([]models.LoanApplication, int64, error) {
	return s.loanRepo.List(req.Page, req.PageSize, req.Status, req.Handler)
}

type UpdateStatusRequest struct {
	LoanID      uint   `json:"loan_id" binding:"required"`
	ToStatus    string `json:"to_status" binding:"required"`
	OperatorID  string `json:"operator_id" binding:"required"`
	OperatorRole models.RoleType `json:"operator_role" binding:"required"`
	Remark      string `json:"remark"`
	IPAddress   string `json:"ip_address"`
	UserAgent   string `json:"user_agent"`
}

func (s *LoanService) UpdateStatus(req *UpdateStatusRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanID)
	if err != nil {
		return err
	}

	fromStatus := string(loan.Status)
	if !utils.IsValidStatusTransition(fromStatus, req.ToStatus) {
		return fmt.Errorf("无效的状态转换: %s -> %s", fromStatus, req.ToStatus)
	}

	var handler string
	switch models.LoanStatus(req.ToStatus) {
	case models.LoanStatusCollecting, models.LoanStatusPending:
		handler = req.OperatorID
	case models.LoanStatusRiskAuditing:
		handler = req.OperatorID
	case models.LoanStatusDisbursed:
		now := time.Now()
		loan.DisbursedAt = &now
		dueDate := now.AddDate(0, loan.LoanTerm, 0)
		loan.DueDate = &dueDate
	case models.LoanStatusExtension:
		handler = req.OperatorID
	}

	loan.Status = models.LoanStatus(req.ToStatus)
	loan.StatusUpdatedAt = time.Now()
	loan.CurrentHandler = handler
	loan.UpdatedBy = req.OperatorID
	if req.Remark != "" {
		loan.Remark = req.Remark
	}

	err = s.loanRepo.Update(loan)
	if err != nil {
		return err
	}

	history := &models.StatusHistory{
		LoanApplicationID: req.LoanID,
		FromStatus:        fromStatus,
		ToStatus:          req.ToStatus,
		ChangedBy:         req.OperatorID,
		ChangedAt:         time.Now(),
		Remark:            req.Remark,
	}
	s.loanRepo.CreateStatusHistory(history)

	beforeData, _ := json.Marshal(map[string]string{"status": fromStatus})
	afterData, _ := json.Marshal(map[string]string{"status": req.ToStatus})
	s.createAuditLog("UPDATE_STATUS", req.OperatorID, req.OperatorRole, &req.LoanID, fmt.Sprintf("更新状态: %s -> %s", fromStatus, req.ToStatus), string(beforeData), string(afterData), req.IPAddress, req.UserAgent)

	return nil
}

type RiskAuditStatusRequest struct {
	LoanID         uint   `json:"loan_id" binding:"required"`
	ToStatus       string `json:"to_status" binding:"required"`
	AuditorID      string `json:"auditor_id" binding:"required"`
	AuditorRole    models.RoleType `json:"auditor_role" binding:"required"`
	Remark         string `json:"remark"`
	RiskAuditID    *uint  `json:"risk_audit_id"`
	IPAddress      string `json:"ip_address"`
	UserAgent      string `json:"user_agent"`
}

func (s *LoanService) RiskAuditUpdateStatus(req *RiskAuditStatusRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanID)
	if err != nil {
		return err
	}

	fromStatus := string(loan.Status)
	if loan.Status != models.LoanStatusRiskAuditing {
		return fmt.Errorf("当前状态不是风控审核中，无法进行风控审核操作: %s", fromStatus)
	}

	validStatuses := []string{"approved", "rejected", "risk_auditing"}
	isValid := false
	for _, status := range validStatuses {
		if req.ToStatus == status {
			isValid = true
			break
		}
	}
	if !isValid {
		return fmt.Errorf("无效的风控审核状态转换: %s -> %s", fromStatus, req.ToStatus)
	}

	currentTime := time.Now()
	var handler string
	var updateData map[string]interface{} = map[string]interface{}{
		"status":            models.LoanStatus(req.ToStatus),
		"status_updated_at": currentTime,
		"updated_by":        req.AuditorID,
	}

	switch models.LoanStatus(req.ToStatus) {
	case models.LoanStatusApproved:
		handler = ""
		updateData["current_handler"] = handler
	case models.LoanStatusRejected:
		handler = ""
		updateData["current_handler"] = handler
	case models.LoanStatusRiskAuditing:
		handler = req.AuditorID
		updateData["current_handler"] = handler
	}

	if req.Remark != "" {
		updateData["remark"] = req.Remark
	}

	err = s.loanRepo.DB.Model(&models.LoanApplication{}).Where("id = ?", req.LoanID).Updates(updateData).Error
	if err != nil {
		return err
	}

	history := &models.StatusHistory{
		LoanApplicationID: req.LoanID,
		FromStatus:        fromStatus,
		ToStatus:          req.ToStatus,
		ChangedBy:         req.AuditorID,
		ChangedAt:         currentTime,
		Remark:            req.Remark,
	}
	s.loanRepo.CreateStatusHistory(history)

	beforeData, _ := json.Marshal(map[string]interface{}{
		"status":           fromStatus,
		"current_handler":  loan.CurrentHandler,
	})
	afterData, _ := json.Marshal(map[string]interface{}{
		"status":           req.ToStatus,
		"current_handler":  handler,
		"risk_audit_id":    req.RiskAuditID,
	})
	s.createAuditLog("RISK_AUDIT_UPDATE_STATUS", req.AuditorID, req.AuditorRole, &req.LoanID, 
		fmt.Sprintf("风控审核更新状态: %s -> %s", fromStatus, req.ToStatus), 
		string(beforeData), string(afterData), req.IPAddress, req.UserAgent)

	return nil
}

func (s *LoanService) createAuditLog(operationType, operatorID string, operatorRole models.RoleType, loanID *uint, operationDesc, beforeData, afterData, ipAddress, userAgent string) {
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
