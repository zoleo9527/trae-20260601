package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type SignupService struct {
	db               *gorm.DB
	idempotentSvc    *IdempotentService
}

func NewSignupService(db *gorm.DB, idempotentSvc *IdempotentService) *SignupService {
	return &SignupService{
		db:            db,
		idempotentSvc: idempotentSvc,
	}
}

type CreateSignupRequest struct {
	IdempotencyKey string `json:"idempotency_key"`
	CourseID       string `json:"course_id" validate:"required"`
	StudentID      string `json:"student_id" validate:"required"`
	StudentName    string `json:"student_name" validate:"required"`
	Phone          string `json:"phone"`
}

type UpdateSignupRequest struct {
	Status string `json:"status"`
}

func (s *SignupService) CreateSignup(req CreateSignupRequest) (*database.ActivitySignup, error) {
	if req.IdempotencyKey != "" {
		isDup, existingData := s.idempotentSvc.CheckAndSet(
			fmt.Sprintf("signup:%s", req.IdempotencyKey),
			"",
			10,
		)
		if isDup && existingData != "" {
			var existing database.ActivitySignup
			if json.Unmarshal([]byte(existingData), &existing) == nil {
				return &existing, nil
			}
		}
	}

	var course database.Course
	if err := s.db.Where("id = ?", req.CourseID).First(&course).Error; err != nil {
		return nil, err
	}

	var count int
	s.db.Model(&database.ActivitySignup{}).Where("course_id = ? AND status = ?", req.CourseID, "confirmed").Count(&count)
	if count >= course.Capacity {
		return nil, errors.New("course capacity reached")
	}

	signup := &database.ActivitySignup{
		ID:          database.GenerateID(),
		CourseID:    req.CourseID,
		StudentID:   req.StudentID,
		StudentName: req.StudentName,
		Phone:       req.Phone,
		Status:      "confirmed",
		SignupTime:  time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(signup).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(signup)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "signup",
		TargetID:  signup.ID,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	if req.IdempotencyKey != "" {
		s.idempotentSvc.CheckAndSet(
			fmt.Sprintf("signup:%s", req.IdempotencyKey),
			string(data),
			10,
		)
	}

	return signup, nil
}

func (s *SignupService) GetSignupByID(id string) (*database.ActivitySignup, error) {
	var signup database.ActivitySignup
	if err := s.db.Where("id = ?", id).First(&signup).Error; err != nil {
		return nil, err
	}
	return &signup, nil
}

func (s *SignupService) GetSignupsByCourse(courseID string) ([]database.ActivitySignup, error) {
	var signups []database.ActivitySignup
	if err := s.db.Where("course_id = ?", courseID).Order("signup_time DESC").Find(&signups).Error; err != nil {
		return nil, err
	}
	return signups, nil
}

func (s *SignupService) GetSignupsByStudent(studentID string) ([]database.ActivitySignup, error) {
	var signups []database.ActivitySignup
	if err := s.db.Where("student_id = ?", studentID).Order("signup_time DESC").Find(&signups).Error; err != nil {
		return nil, err
	}
	return signups, nil
}

func (s *SignupService) UpdateSignup(id string, req UpdateSignupRequest) (*database.ActivitySignup, error) {
	var signup database.ActivitySignup
	if err := s.db.Where("id = ?", id).First(&signup).Error; err != nil {
		return nil, err
	}

	oldData, _ := json.Marshal(signup)

	if req.Status != "" {
		signup.Status = req.Status
	}
	signup.UpdatedAt = time.Now()

	if err := s.db.Save(&signup).Error; err != nil {
		return nil, err
	}

	newData, _ := json.Marshal(signup)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "update",
		Module:    "signup",
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &signup, nil
}

func (s *SignupService) CancelSignup(id string) (*database.ActivitySignup, error) {
	return s.UpdateSignup(id, UpdateSignupRequest{Status: "cancelled"})
}
