package services

import (
	"errors"
	"time"

	"micro-loan/internal/models"
	"micro-loan/internal/repository"
)

type PostLoanService struct {
	collectionRepo *repository.CollectionRepository
	extensionRepo *repository.ExtensionRepository
	loanRepo      *repository.LoanRepository
	warningRepo   *repository.WarningRepository
	auditRepo     *repository.AuditLogRepository
}

func NewPostLoanService() *PostLoanService {
	return &PostLoanService{
		collectionRepo: repository.NewCollectionRepository(),
		extensionRepo:  repository.NewExtensionRepository(),
		loanRepo:       repository.NewLoanRepository(),
		warningRepo:    repository.NewWarningRepository(),
		auditRepo:      repository.NewAuditLogRepository(),
	}
}

type CreateCollectionRequest struct {
	LoanApplicationID  uint   `json:"loan_application_id" binding:"required"`
	CollectionMethod   string `json:"collection_method" binding:"required"`
	CollectionResult   string `json:"collection_result"`
	Remark             string `json:"remark"`
	OfficerID          string `json:"officer_id" binding:"required"`
	OperatorRole       models.RoleType `json:"operator_role" binding:"required"`
	IPAddress          string `json:"ip_address"`
	UserAgent          string `json:"user_agent"`
}

func (s *PostLoanService) CreateCollection(req *CreateCollectionRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanApplicationID)
	if err != nil {
		return errors.New("借款申请不存在")
	}

	if loan.Status != models.LoanStatusOverdue {
		return errors.New("当前状态不允许创建催收记录")
	}

	collection := &models.CollectionRecord{
		LoanApplicationID:  req.LoanApplicationID,
		CollectionMethod:   req.CollectionMethod,
		CollectionTime:     time.Now(),
		CollectionOfficerID: req.OfficerID,
		CollectionResult:   req.CollectionResult,
		Remark:             req.Remark,
	}

	err = s.collectionRepo.Create(collection)
	if err != nil {
		return err
	}

	s.createAuditLog("CREATE_COLLECTION", req.OfficerID, req.OperatorRole, &req.LoanApplicationID,
		"创建催收记录", "", "", req.IPAddress, req.UserAgent)

	return nil
}

func (s *PostLoanService) GetCollections(loanID uint) ([]models.CollectionRecord, error) {
	return s.collectionRepo.GetByLoanID(loanID)
}

type CreateExtensionRequest struct {
	LoanApplicationID uint    `json:"loan_application_id" binding:"required"`
	ExtensionReason   string  `json:"extension_reason" binding:"required"`
	ExtensionAmount   float64 `json:"extension_amount"`
	ExtensionRate     float64 `json:"extension_rate"`
	NewDueDate        string  `json:"new_due_date" binding:"required"`
	ApplicantID       string  `json:"applicant_id" binding:"required"`
	OperatorRole      models.RoleType `json:"operator_role" binding:"required"`
	IPAddress         string  `json:"ip_address"`
	UserAgent         string  `json:"user_agent"`
}

func (s *PostLoanService) CreateExtension(req *CreateExtensionRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanApplicationID)
	if err != nil {
		return errors.New("借款申请不存在")
	}

	if loan.Status != models.LoanStatusDisbursed && loan.Status != models.LoanStatusOverdue {
		return errors.New("当前状态不允许申请展期")
	}

	newDueDate, err := time.Parse("2006-01-02", req.NewDueDate)
	if err != nil {
		return errors.New("日期格式错误，请使用YYYY-MM-DD")
	}

	originalDueDate := time.Now()
	if loan.DueDate != nil {
		originalDueDate = *loan.DueDate
	}

	extensions, _ := s.extensionRepo.GetByLoanID(req.LoanApplicationID)
	if len(extensions) > 0 {
		var latestExtension = extensions[0]
		if latestExtension.NewDueDate.Format("2006-01-02") != originalDueDate.Format("2006-01-02") {
			warning := &models.WarningRecord{
				LoanApplicationID: req.LoanApplicationID,
				WarningType:        models.WarningTypeExtension,
				WarningContent:     "展期口径不统一：历史展期到期日为" + latestExtension.NewDueDate.Format("2006-01-02") + "，本次申请为" + req.NewDueDate,
				WarningTime:        time.Now(),
				Status:             models.WarningStatusPending,
			}
			s.warningRepo.Create(warning)
		}
	}

	extension := &models.ExtensionRecord{
		LoanApplicationID: req.LoanApplicationID,
		ExtensionReason:   req.ExtensionReason,
		OriginalDueDate:   originalDueDate,
		NewDueDate:         newDueDate,
		ExtensionAmount:    req.ExtensionAmount,
		ExtensionRate:      req.ExtensionRate,
		ApplicantID:        req.ApplicantID,
		ApprovalStatus:     "pending",
	}

	err = s.extensionRepo.Create(extension)
	if err != nil {
		return err
	}

	s.createAuditLog("CREATE_EXTENSION", req.ApplicantID, req.OperatorRole, &req.LoanApplicationID,
		"申请展期", "", "", req.IPAddress, req.UserAgent)

	return nil
}

type ApproveExtensionRequest struct {
	ExtensionID   uint   `json:"extension_id" binding:"required"`
	Approved      bool   `json:"approved"`
	ApprovedByID  string `json:"approved_by_id" binding:"required"`
	Remark        string `json:"remark"`
	OperatorRole  models.RoleType `json:"operator_role" binding:"required"`
	IPAddress     string `json:"ip_address"`
	UserAgent     string `json:"user_agent"`
}

func (s *PostLoanService) ApproveExtension(req *ApproveExtensionRequest) error {
	extensions, err := s.extensionRepo.GetByLoanID(0)
	if err != nil {
		return errors.New("展期记录不存在")
	}

	var extension *models.ExtensionRecord
	for _, ext := range extensions {
		if ext.ID == req.ExtensionID {
			extension = &ext
			break
		}
	}
	if extension == nil {
		return errors.New("展期记录不存在")
	}

	if extension.ApprovalStatus != "pending" {
		return errors.New("展期记录已审批")
	}

	if req.Approved {
		extension.ApprovalStatus = "approved"
		loan, _ := s.loanRepo.GetByID(extension.LoanApplicationID)
		if loan != nil {
			loan.Status = models.LoanStatusExtension
			loan.DueDate = &extension.NewDueDate
			loan.StatusUpdatedAt = time.Now()
			s.loanRepo.Update(loan)
		}
	} else {
		extension.ApprovalStatus = "rejected"
	}

	now := time.Now()
	extension.ApprovedBy = req.ApprovedByID
	extension.ApprovedAt = &now
	extension.Remark = req.Remark

	err = s.extensionRepo.Update(extension)
	if err != nil {
		return err
	}

	s.createAuditLog("APPROVE_EXTENSION", req.ApprovedByID, req.OperatorRole, &extension.LoanApplicationID,
		"审批展期: "+extension.ApprovalStatus, "", "", req.IPAddress, req.UserAgent)

	return nil
}

func (s *PostLoanService) GetExtensions(loanID uint) ([]models.ExtensionRecord, error) {
	return s.extensionRepo.GetByLoanID(loanID)
}

type CheckOverdueRequest struct {
	LoanApplicationID uint   `json:"loan_application_id"`
	OfficerID         string `json:"officer_id" binding:"required"`
	OperatorRole      models.RoleType `json:"operator_role" binding:"required"`
}

func (s *PostLoanService) CheckOverdueRemind(req *CheckOverdueRequest) error {
	loan, err := s.loanRepo.GetByID(req.LoanApplicationID)
	if err != nil {
		return errors.New("借款申请不存在")
	}

	if loan.DueDate == nil {
		return nil
	}

	if time.Now().After(*loan.DueDate) && loan.Status == models.LoanStatusDisbursed {
		collections, _ := s.collectionRepo.GetByLoanID(req.LoanApplicationID)
		
		var lastCollectionTime time.Time
		if len(collections) > 0 {
			lastCollectionTime = collections[0].CollectionTime
		} else {
			lastCollectionTime = *loan.DueDate
		}

		hoursSinceDue := time.Since(*loan.DueDate).Hours()
		hoursSinceLastCollection := time.Since(lastCollectionTime).Hours()

		if hoursSinceDue > 24 && hoursSinceLastCollection > 48 {
			warning := &models.WarningRecord{
				LoanApplicationID: req.LoanApplicationID,
				WarningType:        models.WarningTypeOverdueRemind,
				WarningContent:    "逾期提醒失效：已逾期" + string(rune(int(hoursSinceDue/24))) + "天，最后催收时间为"+lastCollectionTime.Format("2006-01-02 15:04:05"),
				WarningTime:        time.Now(),
				Status:             models.WarningStatusPending,
			}
			s.warningRepo.Create(warning)
		}
	}

	return nil
}

func (s *PostLoanService) createAuditLog(operationType, operatorID string, operatorRole models.RoleType, loanID *uint, operationDesc, beforeData, afterData, ipAddress, userAgent string) {
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
