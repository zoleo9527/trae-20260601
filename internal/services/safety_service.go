package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type SafetyService struct {
	db            *gorm.DB
	idempotentSvc *IdempotentService
}

func NewSafetyService(db *gorm.DB, idempotentSvc *IdempotentService) *SafetyService {
	return &SafetyService{
		db:            db,
		idempotentSvc: idempotentSvc,
	}
}

type CreateSafetyRecordRequest struct {
	IdempotencyKey string `json:"idempotency_key"`
	CheckinID      string `json:"checkin_id" validate:"required"`
	OperatorID     string `json:"operator_id"`
	OperatorName   string `json:"operator_name"`
	SafetyStatus   string `json:"safety_status"`
	SafetyRemarks  string `json:"safety_remarks"`
}

type UpdateSafetyRecordRequest struct {
	SafetyStatus  string `json:"safety_status"`
	SafetyRemarks string `json:"safety_remarks"`
	OperatorID    string `json:"operator_id"`
	OperatorName  string `json:"operator_name"`
}

func (s *SafetyService) CreateSafetyRecord(req CreateSafetyRecordRequest) (*database.SafetyRecord, error) {
	idempotentKey := fmt.Sprintf("safety:%s", req.IdempotencyKey)

	if req.IdempotencyKey != "" {
		isDup, existingData := s.idempotentSvc.CheckAndGet(idempotentKey)
		if isDup {
			var existing database.SafetyRecord
			if err := json.Unmarshal([]byte(existingData), &existing); err == nil {
				return &existing, nil
			}
		}

		isLocked, err := s.idempotentSvc.Lock(idempotentKey, 10)
		if err != nil {
			return nil, err
		}
		if isLocked {
			for i := 0; i < 10; i++ {
				isDup, existingData := s.idempotentSvc.CheckAndGet(idempotentKey)
				if isDup {
					var existing database.SafetyRecord
					if err := json.Unmarshal([]byte(existingData), &existing); err == nil {
						return &existing, nil
					}
				}
				time.Sleep(100 * time.Millisecond)
			}
			return nil, errors.New("timeout waiting for idempotent operation")
		}
	}

	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", req.CheckinID).First(&checkin).Error; err != nil {
		if req.IdempotencyKey != "" {
			s.idempotentSvc.Commit(idempotentKey, `{"error":"checkin not found"}`, 10)
		}
		return nil, err
	}

	safetyRecord := &database.SafetyRecord{
		ID:             database.GenerateID(),
		CheckinID:      req.CheckinID,
		CourseID:       checkin.CourseID,
		StudentID:      checkin.StudentID,
		StudentName:    checkin.StudentName,
		CheckinRemarks: checkin.Remarks,
		SafetyStatus:   req.SafetyStatus,
		SafetyRemarks:  req.SafetyRemarks,
		OperatorID:     req.OperatorID,
		OperatorName:   req.OperatorName,
		RecordTime:     time.Now(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.db.Create(safetyRecord).Error; err != nil {
		if req.IdempotencyKey != "" {
			s.idempotentSvc.Commit(idempotentKey, fmt.Sprintf(`{"error":"%s"}`, err.Error()), 10)
		}
		return nil, err
	}

	data, _ := json.Marshal(safetyRecord)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "safety",
		TargetID:  safetyRecord.ID,
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	if req.IdempotencyKey != "" {
		s.idempotentSvc.Commit(idempotentKey, string(data), 10)
	}

	return safetyRecord, nil
}

func (s *SafetyService) GetSafetyRecordByID(id string) (*database.SafetyRecord, error) {
	var record database.SafetyRecord
	if err := s.db.Where("id = ?", id).First(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (s *SafetyService) GetSafetyRecordsByCourse(courseID string) ([]database.SafetyRecord, error) {
	var records []database.SafetyRecord
	if err := s.db.Where("course_id = ?", courseID).Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (s *SafetyService) GetSafetyRecordsByCheckin(checkinID string) ([]database.SafetyRecord, error) {
	var records []database.SafetyRecord
	if err := s.db.Where("checkin_id = ?", checkinID).Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (s *SafetyService) UpdateSafetyRecord(id string, req UpdateSafetyRecordRequest) (*database.SafetyRecord, error) {
	var record database.SafetyRecord
	if err := s.db.Where("id = ?", id).First(&record).Error; err != nil {
		return nil, err
	}

	oldData, _ := json.Marshal(record)

	if req.SafetyStatus != "" {
		record.SafetyStatus = req.SafetyStatus
	}
	if req.SafetyRemarks != "" {
		record.SafetyRemarks = req.SafetyRemarks
	}
	if req.OperatorID != "" {
		record.OperatorID = req.OperatorID
	}
	if req.OperatorName != "" {
		record.OperatorName = req.OperatorName
	}
	record.UpdatedAt = time.Now()

	if err := s.db.Save(&record).Error; err != nil {
		return nil, err
	}

	newData, _ := json.Marshal(record)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "update",
		Module:    "safety",
		TargetID:  record.ID,
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &record, nil
}
