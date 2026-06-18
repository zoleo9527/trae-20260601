package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type CheckinService struct {
	db            *gorm.DB
	idempotentSvc *IdempotentService
}

func NewCheckinService(db *gorm.DB, idempotentSvc *IdempotentService) *CheckinService {
	return &CheckinService{
		db:            db,
		idempotentSvc: idempotentSvc,
	}
}

type CreateCheckinRequest struct {
	IdempotencyKey string `json:"idempotency_key"`
	CourseID       string `json:"course_id" validate:"required"`
	StudentID      string `json:"student_id" validate:"required"`
	StudentName    string `json:"student_name" validate:"required"`
	OperatorID     string `json:"operator_id"`
	OperatorName   string `json:"operator_name"`
	Remarks        string `json:"remarks"`
}

type UpdateCheckinRequest struct {
	Status       string `json:"status"`
	Remarks      string `json:"remarks"`
	OperatorID   string `json:"operator_id"`
	OperatorName string `json:"operator_name"`
}

func (s *CheckinService) CreateCheckin(req CreateCheckinRequest) (*database.ActivityCheckin, error) {
	idempotentKey := fmt.Sprintf("checkin:%s", req.IdempotencyKey)

	if req.IdempotencyKey != "" {
		isDuplicate, result := s.idempotentSvc.Check(idempotentKey)
		if isDuplicate {
			if result != nil {
				if result.Success {
					dataBytes, _ := json.Marshal(result.Data)
					var checkin database.ActivityCheckin
					if err := json.Unmarshal(dataBytes, &checkin); err == nil {
						return &checkin, nil
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
					var checkin database.ActivityCheckin
					if err := json.Unmarshal(dataBytes, &checkin); err == nil {
						return &checkin, nil
					}
				} else {
					return nil, errors.New(result.Error)
				}
			}
			return nil, errors.New("timeout waiting for idempotent operation")
		}
	}

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
		if req.IdempotencyKey != "" {
			s.idempotentSvc.CommitError(idempotentKey, err.Error(), 10)
		}
		return nil, err
	}

	data, _ := json.Marshal(checkin)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "checkin",
		TargetID:  checkin.ID,
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	if req.IdempotencyKey != "" {
		s.idempotentSvc.CommitSuccess(idempotentKey, checkin, 10)
	}

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
		TargetID:  checkin.ID,
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

func (s *CheckinService) BackfillCheckin(req CreateCheckinRequest) (*database.ActivityCheckin, error) {
	idempotentKey := fmt.Sprintf("checkin:backfill:%s", req.IdempotencyKey)

	if req.IdempotencyKey != "" {
		isDuplicate, result := s.idempotentSvc.Check(idempotentKey)
		if isDuplicate {
			if result != nil {
				if result.Success {
					dataBytes, _ := json.Marshal(result.Data)
					var checkin database.ActivityCheckin
					if err := json.Unmarshal(dataBytes, &checkin); err == nil {
						return &checkin, nil
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
					var checkin database.ActivityCheckin
					if err := json.Unmarshal(dataBytes, &checkin); err == nil {
						return &checkin, nil
					}
				} else {
					return nil, errors.New(result.Error)
				}
			}
			return nil, errors.New("timeout waiting for idempotent operation")
		}
	}

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
		if req.IdempotencyKey != "" {
			s.idempotentSvc.CommitError(idempotentKey, err.Error(), 10)
		}
		return nil, err
	}

	data, _ := json.Marshal(checkin)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "backfill",
		Module:    "checkin",
		TargetID:  checkin.ID,
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	if req.IdempotencyKey != "" {
		s.idempotentSvc.CommitSuccess(idempotentKey, checkin, 10)
	}

	return checkin, nil
}
