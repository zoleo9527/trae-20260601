package repository

import (
	"micro-loan/internal/config"
	"micro-loan/internal/models"

	"gorm.io/gorm"
)

type LoanRepository struct {
	db *gorm.DB
}

func NewLoanRepository() *LoanRepository {
	return &LoanRepository{db: config.DB}
}

func (r *LoanRepository) Create(loan *models.LoanApplication) error {
	return r.db.Create(loan).Error
}

func (r *LoanRepository) GetByID(id uint) (*models.LoanApplication, error) {
	var loan models.LoanApplication
	err := r.db.First(&loan, id).Error
	if err != nil {
		return nil, err
	}
	return &loan, nil
}

func (r *LoanRepository) GetByApplicationNo(appNo string) (*models.LoanApplication, error) {
	var loan models.LoanApplication
	err := r.db.Where("application_no = ?", appNo).First(&loan).Error
	if err != nil {
		return nil, err
	}
	return &loan, nil
}

func (r *LoanRepository) Update(loan *models.LoanApplication) error {
	return r.db.Save(loan).Error
}

func (r *LoanRepository) List(page, pageSize int, status string, handler string) ([]models.LoanApplication, int64, error) {
	var loans []models.LoanApplication
	var total int64

	query := r.db.Model(&models.LoanApplication{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if handler != "" {
		query = query.Where("current_handler = ?", handler)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&loans).Error
	if err != nil {
		return nil, 0, err
	}

	return loans, total, nil
}

func (r *LoanRepository) UpdateStatus(id uint, status models.LoanStatus, handler string, remark string) error {
	return r.db.Model(&models.LoanApplication{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":            status,
		"current_handler":   handler,
		"status_updated_at": gorm.Expr("NOW()"),
		"remark":            remark,
	}).Error
}

func (r *LoanRepository) CreateStatusHistory(history *models.StatusHistory) error {
	return r.db.Create(history).Error
}

type DocumentRepository struct {
	db *gorm.DB
}

func NewDocumentRepository() *DocumentRepository {
	return &DocumentRepository{db: config.DB}
}

func (r *DocumentRepository) Create(doc *models.DocumentCollection) error {
	return r.db.Create(doc).Error
}

func (r *DocumentRepository) GetByLoanID(loanID uint) ([]models.DocumentCollection, error) {
	var docs []models.DocumentCollection
	err := r.db.Where("loan_application_id = ?", loanID).Find(&docs).Error
	return docs, err
}

func (r *DocumentRepository) GetByID(id uint) (*models.DocumentCollection, error) {
	var doc models.DocumentCollection
	err := r.db.First(&doc, id).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *DocumentRepository) Update(doc *models.DocumentCollection) error {
	return r.db.Save(doc).Error
}

func (r *DocumentRepository) GetForgeryDocuments(loanID uint) ([]models.DocumentCollection, error) {
	var docs []models.DocumentCollection
	err := r.db.Where("loan_application_id = ? AND is_forged = ?", loanID, true).Find(&docs).Error
	return docs, err
}

type RiskAuditRepository struct {
	db *gorm.DB
}

func NewRiskAuditRepository() *RiskAuditRepository {
	return &RiskAuditRepository{db: config.DB}
}

func (r *RiskAuditRepository) Create(audit *models.RiskAudit) error {
	return r.db.Create(audit).Error
}

func (r *RiskAuditRepository) GetByLoanID(loanID uint) ([]models.RiskAudit, error) {
	var audits []models.RiskAudit
	err := r.db.Where("loan_application_id = ?", loanID).Find(&audits).Error
	return audits, err
}

func (r *RiskAuditRepository) GetLatestByLoanID(loanID uint) (*models.RiskAudit, error) {
	var audit models.RiskAudit
	err := r.db.Where("loan_application_id = ?", loanID).Order("audit_time DESC").First(&audit).Error
	if err != nil {
		return nil, err
	}
	return &audit, nil
}

type CollectionRepository struct {
	db *gorm.DB
}

func NewCollectionRepository() *CollectionRepository {
	return &CollectionRepository{db: config.DB}
}

func (r *CollectionRepository) Create(record *models.CollectionRecord) error {
	return r.db.Create(record).Error
}

func (r *CollectionRepository) GetByLoanID(loanID uint) ([]models.CollectionRecord, error) {
	var records []models.CollectionRecord
	err := r.db.Where("loan_application_id = ?", loanID).Order("collection_time DESC").Find(&records).Error
	return records, err
}

type ExtensionRepository struct {
	db *gorm.DB
}

func NewExtensionRepository() *ExtensionRepository {
	return &ExtensionRepository{db: config.DB}
}

func (r *ExtensionRepository) Create(record *models.ExtensionRecord) error {
	return r.db.Create(record).Error
}

func (r *ExtensionRepository) GetByLoanID(loanID uint) ([]models.ExtensionRecord, error) {
	var records []models.ExtensionRecord
	err := r.db.Where("loan_application_id = ?", loanID).Order("created_at DESC").Find(&records).Error
	return records, err
}

func (r *ExtensionRepository) Update(record *models.ExtensionRecord) error {
	return r.db.Save(record).Error
}

type WarningRepository struct {
	db *gorm.DB
}

func NewWarningRepository() *WarningRepository {
	return &WarningRepository{db: config.DB}
}

func (r *WarningRepository) Create(warning *models.WarningRecord) error {
	return r.db.Create(warning).Error
}

func (r *WarningRepository) GetByLoanID(loanID uint) ([]models.WarningRecord, error) {
	var warnings []models.WarningRecord
	err := r.db.Where("loan_application_id = ?", loanID).Order("warning_time DESC").Find(&warnings).Error
	return warnings, err
}

func (r *WarningRepository) GetPendingWarnings() ([]models.WarningRecord, error) {
	var warnings []models.WarningRecord
	err := r.db.Where("status IN ?", []string{"pending", "processing"}).Order("warning_time DESC").Find(&warnings).Error
	return warnings, err
}

func (r *WarningRepository) UpdateStatus(id uint, status models.WarningStatus, handlerID string, remark string) error {
	return r.db.Model(&models.WarningRecord{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     status,
		"handler_id": handlerID,
		"handled_at": gorm.Expr("NOW()"),
		"remark":     remark,
	}).Error
}

type AuditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository() *AuditLogRepository {
	return &AuditLogRepository{db: config.DB}
}

func (r *AuditLogRepository) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditLogRepository) GetByLoanID(loanID uint) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("loan_application_id = ?", loanID).Order("created_at DESC").Find(&logs).Error
	return logs, err
}

func (r *AuditLogRepository) List(page, pageSize int, operatorID string, operationType string) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := r.db.Model(&models.AuditLog{})

	if operatorID != "" {
		query = query.Where("operator_id = ?", operatorID)
	}
	if operationType != "" {
		query = query.Where("operation_type = ?", operationType)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
