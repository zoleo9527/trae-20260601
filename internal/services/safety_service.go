package services

import (
	"encoding/json"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type SafetyService struct {
	db *gorm.DB
}

func NewSafetyService(db *gorm.DB) *SafetyService {
	return &SafetyService{db: db}
}

type CreateSafetyRecordRequest struct {
	CheckinID    string `json:"checkin_id" validate:"required"`
	OperatorID   string `json:"operator_id"`
	OperatorName string `json:"operator_name"`
	SafetyStatus string `json:"safety_status"`
	SafetyRemarks string `json:"safety_remarks"`
}

type UpdateSafetyRecordRequest struct {
	SafetyStatus  string `json:"safety_status"`
	SafetyRemarks string `json:"safety_remarks"`
	OperatorID    string `json:"operator_id"`
	OperatorName  string `json:"operator_name"`
}

func (s *SafetyService) CreateSafetyRecord(req CreateSafetyRecordRequest) (*database.SafetyRecord, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", req.CheckinID).First(&checkin).Error; err != nil {
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
		return nil, err
	}

	data, _ := json.Marshal(safetyRecord)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "safety",
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

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
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &record, nil
}

func (s *SafetyService) GetFullTrace(checkinID string) (*SafetyTrace, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", checkinID).First(&checkin).Error; err != nil {
		return nil, err
	}

	var safetyRecords []database.SafetyRecord
	if err := s.db.Where("checkin_id = ?", checkinID).Order("created_at DESC").Find(&safetyRecords).Error; err != nil {
		return nil, err
	}

	var audits []database.AuditLog
	if err := s.db.Where("module IN (?,?) AND data LIKE ?", "checkin", "safety", "%\"id\":\""+checkinID+"%").Order("created_at DESC").Find(&audits).Error; err != nil {
		return nil, err
	}

	return &SafetyTrace{
		Checkin:       checkin,
		SafetyRecords: safetyRecords,
		Audits:        audits,
	}, nil
}

type SafetyTrace struct {
	Checkin       database.ActivityCheckin  `json:"checkin"`
	SafetyRecords []database.SafetyRecord   `json:"safety_records"`
	Audits        []database.AuditLog       `json:"audits"`
}
