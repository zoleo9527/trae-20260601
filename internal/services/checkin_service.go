package services

import (
	"encoding/json"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type CheckinService struct {
	db *gorm.DB
}

func NewCheckinService(db *gorm.DB) *CheckinService {
	return &CheckinService{db: db}
}

type CreateCheckinRequest struct {
	CourseID      string `json:"course_id" validate:"required"`
	StudentID     string `json:"student_id" validate:"required"`
	StudentName   string `json:"student_name" validate:"required"`
	OperatorID    string `json:"operator_id"`
	OperatorName  string `json:"operator_name"`
	Remarks       string `json:"remarks"`
}

type UpdateCheckinRequest struct {
	Status       string `json:"status"`
	Remarks      string `json:"remarks"`
	OperatorID   string `json:"operator_id"`
	OperatorName string `json:"operator_name"`
}

func (s *CheckinService) CreateCheckin(req CreateCheckinRequest) (*database.ActivityCheckin, error) {
	checkin := &database.ActivityCheckin{
		ID:            database.GenerateID(),
		CourseID:      req.CourseID,
		StudentID:     req.StudentID,
		StudentName:   req.StudentName,
		CheckinTime:   time.Now(),
		Status:        "checked_in",
		Remarks:       req.Remarks,
		OperatorID:    req.OperatorID,
		OperatorName:  req.OperatorName,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.db.Create(checkin).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(checkin)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "checkin",
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return checkin, nil
}

func (s *CheckinService) GetCheckinByID(id string) (*database.ActivityCheckin, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", id).First(&checkin).Error; err != nil {
		return nil, err
	}
	return &checkin, nil
}

func (s *CheckinService) GetCheckinsByCourse(courseID string) ([]database.ActivityCheckin, error) {
	var checkins []database.ActivityCheckin
	if err := s.db.Where("course_id = ?", courseID).Find(&checkins).Error; err != nil {
		return nil, err
	}
	return checkins, nil
}

func (s *CheckinService) UpdateCheckin(id string, req UpdateCheckinRequest) (*database.ActivityCheckin, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", id).First(&checkin).Error; err != nil {
		return nil, err
	}

	oldData, _ := json.Marshal(checkin)

	if req.Status != "" {
		checkin.Status = req.Status
	}
	if req.Remarks != "" {
		checkin.Remarks = req.Remarks
	}
	if req.OperatorID != "" {
		checkin.OperatorID = req.OperatorID
	}
	if req.OperatorName != "" {
		checkin.OperatorName = req.OperatorName
	}
	checkin.UpdatedAt = time.Now()

	if err := s.db.Save(&checkin).Error; err != nil {
		return nil, err
	}

	newData, _ := json.Marshal(checkin)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "update",
		Module:    "checkin",
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &checkin, nil
}

func (s *CheckinService) RejectCheckin(id string, operatorID, operatorName, reason string) (*database.ActivityCheckin, error) {
	return s.UpdateCheckin(id, UpdateCheckinRequest{
		Status:       "rejected",
		Remarks:      reason,
		OperatorID:   operatorID,
		OperatorName: operatorName,
	})
}

func (s *CheckinService)补录Checkin(req CreateCheckinRequest) (*database.ActivityCheckin, error) {
	checkin := &database.ActivityCheckin{
		ID:            database.GenerateID(),
		CourseID:      req.CourseID,
		StudentID:     req.StudentID,
		StudentName:   req.StudentName,
		CheckinTime:   time.Now(),
		Status:        "backfilled",
		Remarks:       "[补录] " + req.Remarks,
		OperatorID:    req.OperatorID,
		OperatorName:  req.OperatorName,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.db.Create(checkin).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(checkin)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "backfill",
		Module:    "checkin",
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return checkin, nil
}
