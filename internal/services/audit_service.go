package services

import (
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

type GetAuditLogsRequest struct {
	Module   string    `json:"module"`
	UserID   string    `json:"user_id"`
	Action   string    `json:"action"`
	StartAt  time.Time `json:"start_at"`
	EndAt    time.Time `json:"end_at"`
}

func (s *AuditService) GetAuditLogs(req GetAuditLogsRequest) ([]database.AuditLog, error) {
	var logs []database.AuditLog
	query := s.db.Model(&database.AuditLog{})

	if req.Module != "" {
		query = query.Where("module = ?", req.Module)
	}
	if req.UserID != "" {
		query = query.Where("user_id = ?", req.UserID)
	}
	if req.Action != "" {
		query = query.Where("action = ?", req.Action)
	}
	if !req.StartAt.IsZero() {
		query = query.Where("created_at >= ?", req.StartAt)
	}
	if !req.EndAt.IsZero() {
		query = query.Where("created_at <= ?", req.EndAt)
	}

	if err := query.Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, err
	}

	return logs, nil
}

func (s *AuditService) GetAuditLogByID(id string) (*database.AuditLog, error) {
	var log database.AuditLog
	if err := s.db.Where("id = ?", id).First(&log).Error; err != nil {
		return nil, err
	}
	return &log, nil
}
