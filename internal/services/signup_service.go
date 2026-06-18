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
	db            *gorm.DB
	idempotentSvc *IdempotentService
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
	idempotentKey := fmt.Sprintf("signup:%s", req.IdempotencyKey)

	if req.IdempotencyKey != "" {
		isDuplicate, result := s.idempotentSvc.Check(idempotentKey)
		if isDuplicate {
			if result != nil {
				if result.Success {
					dataBytes, _ := json.Marshal(result.Data)
					var signup database.ActivitySignup
					if err := json.Unmarshal(dataBytes, &signup); err == nil {
						return &signup, nil
					}
				} else {
					return nil, errors.New(result.Error)
				}
			}
		}

		isLocked, err := s.idempotentSvc.Lock(idempotentKey, 10)
		if err != nil {
			return nil, err
		}
		if isLocked {
			isDuplicate, result := s.idempotentSvc.WaitForResult(idempotentKey, 20, 50*time.Millisecond)
			if isDuplicate && result != nil {
				if result.Success {
					dataBytes, _ := json.Marshal(result.Data)
					var signup database.ActivitySignup
					if err := json.Unmarshal(dataBytes, &signup); err == nil {
						return &signup, nil
					}
				} else {
					return nil, errors.New(result.Error)
				}
			}
			return nil, errors.New("timeout waiting for idempotent operation")
		}
	}

	var course database.Course
	if err := s.db.Where("id = ?", req.CourseID).First(&course).Error; err != nil {
		if req.IdempotencyKey != "" {
			s.idempotentSvc.CommitError(idempotentKey, err.Error(), 10)
		}
		return nil, err
	}

	var count int
	s.db.Model(&database.ActivitySignup{}).Where("course_id = ? AND status = ?", req.CourseID, "confirmed").Count(&count)
	if count >= course.Capacity {
		errMsg := "course capacity reached"
		if req.IdempotencyKey != "" {
			s.idempotentSvc.CommitError(idempotentKey, errMsg, 10)
		}
		return nil, errors.New(errMsg)
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
		if req.IdempotencyKey != "" {
			s.idempotentSvc.CommitError(idempotentKey, err.Error(), 10)
		}
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
		s.idempotentSvc.CommitSuccess(idempotentKey, signup, 10)
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
		TargetID:  signup.ID,
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &signup, nil
}

func (s *SignupService) CancelSignup(id string) (*database.ActivitySignup, error) {
	return s.UpdateSignup(id, UpdateSignupRequest{Status: "cancelled"})
}
