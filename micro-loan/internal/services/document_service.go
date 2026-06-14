package services

import (
	"encoding/json"
	"errors"
	"time"

	"micro-loan/internal/models"
	"micro-loan/internal/repository"
)

type DocumentService struct {
	docRepo     *repository.DocumentRepository
	loanRepo    *repository.LoanRepository
	warningRepo *repository.WarningRepository
	auditRepo   *repository.AuditLogRepository
}

func NewDocumentService() *DocumentService {
	return &DocumentService{
		docRepo:     repository.NewDocumentRepository(),
		loanRepo:    repository.NewLoanRepository(),
		warningRepo: repository.NewWarningRepository(),
		auditRepo:   repository.NewAuditLogRepository(),
	}
}

type UploadDocumentRequest struct {
	LoanApplicationID uint               `json:"loan_application_id" binding:"required"`
	DocumentType       models.DocumentType `json:"document_type" binding:"required"`
	DocumentURL        string             `json:"document_url" binding:"required"`
	OperatorID         string             `json:"operator_id" binding:"required"`
	OperatorRole       models.RoleType    `json:"operator_role" binding:"required"`
	IPAddress          string             `json:"ip_address"`
	UserAgent          string             `json:"user_agent"`
}

func (s *DocumentService) UploadDocument(req *UploadDocumentRequest) (*models.DocumentCollection, error) {
	_, err := s.loanRepo.GetByID(req.LoanApplicationID)
	if err != nil {
		return nil, errors.New("借款申请不存在")
	}

	doc := &models.DocumentCollection{
		LoanApplicationID: req.LoanApplicationID,
		DocumentType:      req.DocumentType,
		DocumentURL:       req.DocumentURL,
		UploadTime:        time.Now(),
		UploadedBy:        req.OperatorID,
		AuditStatus:       models.DocumentStatusPending,
	}

	err = s.docRepo.Create(doc)
	if err != nil {
		return nil, err
	}

	s.createAuditLog("UPLOAD_DOCUMENT", req.OperatorID, req.OperatorRole, &req.LoanApplicationID, 
		"上传资料: "+string(req.DocumentType), "", "", req.IPAddress, req.UserAgent)

	return doc, nil
}

type ReviewDocumentRequest struct {
	DocumentID     uint   `json:"document_id" binding:"required"`
	IsForged       bool   `json:"is_forged"`
	ForgeryReason  string `json:"forgery_reason"`
	AuditStatus    models.DocumentAuditStatus `json:"audit_status" binding:"required"`
	Remark         string `json:"remark"`
	AuditorID      string `json:"auditor_id" binding:"required"`
	AuditorRole    models.RoleType `json:"auditor_role" binding:"required"`
	IPAddress      string `json:"ip_address"`
	UserAgent      string `json:"user_agent"`
}

func (s *DocumentService) ReviewDocument(req *ReviewDocumentRequest) error {
	doc, err := s.docRepo.GetByID(req.DocumentID)
	if err != nil {
		return errors.New("资料不存在")
	}

	now := time.Now()
	doc.IsForged = req.IsForged
	doc.ForgeryReason = req.ForgeryReason
	doc.AuditStatus = req.AuditStatus
	doc.AuditedBy = req.AuditorID
	doc.AuditedAt = &now
	doc.Remark = req.Remark

	err = s.docRepo.Update(doc)
	if err != nil {
		return err
	}

	if req.IsForged {
		warning := &models.WarningRecord{
			LoanApplicationID: doc.LoanApplicationID,
			WarningType:        models.WarningTypeForgery,
			WarningContent:     "发现资料造假: " + req.ForgeryReason,
			WarningTime:        time.Now(),
			Status:             models.WarningStatusPending,
		}
		s.warningRepo.Create(warning)
	}

	s.createAuditLog("REVIEW_DOCUMENT", req.AuditorID, req.AuditorRole, &doc.LoanApplicationID,
		"审核资料: "+string(doc.DocumentType)+", 结果: "+string(req.AuditStatus), "", "", req.IPAddress, req.UserAgent)

	return nil
}

func (s *DocumentService) GetDocuments(loanID uint) ([]models.DocumentCollection, error) {
	return s.docRepo.GetByLoanID(loanID)
}

func (s *DocumentService) GetDocument(id uint) (*models.DocumentCollection, error) {
	return s.docRepo.GetByID(id)
}

type IdempotentSubmitRequest struct {
	LoanApplicationID uint   `json:"loan_application_id" binding:"required"`
	OperatorID        string `json:"operator_id" binding:"required"`
	OperatorRole      models.RoleType `json:"operator_role" binding:"required"`
	Remark            string `json:"remark"`
	IPAddress         string `json:"ip_address"`
	UserAgent         string `json:"user_agent"`
}

func (s *DocumentService) IdempotentSubmit(req *IdempotentSubmitRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanApplicationID)
	if err != nil {
		return errors.New("借款申请不存在")
	}

	fromStatus := string(loan.Status)
	fromHandler := loan.CurrentHandler
	
	if loan.Status != models.LoanStatusCollecting {
		return errors.New("当前状态不允许提交资料")
	}

	docs, err := s.docRepo.GetByLoanID(req.LoanApplicationID)
	if err != nil {
		return err
	}

	hasPending := false
	for _, doc := range docs {
		if doc.AuditStatus == models.DocumentStatusPending {
			hasPending = true
			break
		}
	}

	if !hasPending {
		return errors.New("所有资料已审核完成，无需重复提交")
	}

	forgedDocs, _ := s.docRepo.GetForgeryDocuments(req.LoanApplicationID)
	if len(forgedDocs) > 0 {
		return errors.New("存在造假资料，无法提交")
	}

	currentTime := time.Now()
	submitRemark := req.Remark
	if submitRemark == "" {
		submitRemark = "资料提交完成，转入风控审核"
	}
	
	nextHandler := models.NodeRiskAuditing
	
	loan.Status = models.LoanStatusRiskAuditing
	loan.StatusUpdatedAt = currentTime
	loan.CurrentHandler = nextHandler
	loan.UpdatedBy = req.OperatorID
	loan.Remark = submitRemark

	err = s.loanRepo.Update(loan)
	if err != nil {
		return err
	}

	statusHistory := &models.StatusHistory{
		LoanApplicationID: req.LoanApplicationID,
		FromStatus:        fromStatus,
		ToStatus:          string(models.LoanStatusRiskAuditing),
		ChangedBy:         req.OperatorID,
		ChangedAt:         currentTime,
		Remark:            submitRemark,
	}
	s.loanRepo.CreateStatusHistory(statusHistory)

	beforeData, _ := json.Marshal(map[string]interface{}{
		"status":          fromStatus,
		"current_handler": fromHandler,
		"handler_role":    "customer_manager",
	})
	afterData, _ := json.Marshal(map[string]interface{}{
		"status":          string(models.LoanStatusRiskAuditing),
		"current_handler": nextHandler,
		"handler_role":    "risk_auditor",
		"submit_time":     currentTime.Format(time.RFC3339),
		"remark":          submitRemark,
	})

	s.createAuditLog("SUBMIT_DOCUMENTS", req.OperatorID, req.OperatorRole, &req.LoanApplicationID,
		"幂等提交资料，转入风控审核", string(beforeData), string(afterData), req.IPAddress, req.UserAgent)

	return nil
}

func (s *DocumentService) createAuditLog(operationType, operatorID string, operatorRole models.RoleType, loanID *uint, operationDesc, beforeData, afterData, ipAddress, userAgent string) {
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
