package services

import (
	"encoding/json"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type ExceptionService struct {
	db *gorm.DB
}

func NewExceptionService(db *gorm.DB) *ExceptionService {
	return &ExceptionService{db: db}
}

type CreateExceptionRequest struct {
	CheckinID    string `json:"checkin_id" validate:"required"`
	Type         string `json:"type" validate:"required"`
	Description  string `json:"description"`
	Severity     string `json:"severity"`
	OperatorID   string `json:"operator_id"`
	OperatorName string `json:"operator_name"`
}

type ResolveExceptionRequest struct {
	ResolvedBy   string `json:"resolved_by"`
	ResolvedName string `json:"resolved_name"`
	ResolvedNote string `json:"resolved_note"`
}

func (s *ExceptionService) CreateException(req CreateExceptionRequest) (*database.Exception, error) {
	var checkin database.ActivityCheckin
	if err := s.db.Where("id = ?", req.CheckinID).First(&checkin).Error; err != nil {
		return nil, err
	}

	exception := &database.Exception{
		ID:           database.GenerateID(),
		CheckinID:    req.CheckinID,
		CourseID:     checkin.CourseID,
		StudentID:    checkin.StudentID,
		StudentName:  checkin.StudentName,
		Type:         req.Type,
		Description:  req.Description,
		Severity:     req.Severity,
		Status:       "open",
		OperatorID:   req.OperatorID,
		OperatorName: req.OperatorName,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.db.Create(exception).Error; err != nil {
		return nil, err
	}

	s.createAuditLog("create", "exception", exception.ID, req.OperatorID, req.OperatorName, exception)

	return exception, nil
}

func (s *ExceptionService) ResolveException(id string, req ResolveExceptionRequest) (*database.Exception, error) {
	var exception database.Exception
	if err := s.db.Where("id = ?", id).First(&exception).Error; err != nil {
		return nil, err
	}

	exception.Status = "resolved"
	exception.ResolvedBy = req.ResolvedBy
	exception.ResolvedName = req.ResolvedName
	exception.ResolvedNote = req.ResolvedNote
	now := time.Now()
	exception.ResolvedAt = &now
	exception.UpdatedAt = time.Now()

	if err := s.db.Save(&exception).Error; err != nil {
		return nil, err
	}

	s.createAuditLog("resolve", "exception", exception.ID, req.ResolvedBy, req.ResolvedName, exception)

	return &exception, nil
}

func (s *ExceptionService) GetExceptionByID(id string) (*database.Exception, error) {
	var exception database.Exception
	if err := s.db.Where("id = ?", id).First(&exception).Error; err != nil {
		return nil, err
	}
	return &exception, nil
}

func (s *ExceptionService) GetExceptionsByCheckin(checkinID string) ([]database.Exception, error) {
	var exceptions []database.Exception
	if err := s.db.Where("checkin_id = ?", checkinID).Order("created_at DESC").Find(&exceptions).Error; err != nil {
		return nil, err
	}
	return exceptions, nil
}

func (s *ExceptionService) GetExceptionsByCourse(courseID string) ([]database.Exception, error) {
	var exceptions []database.Exception
	if err := s.db.Where("course_id = ?", courseID).Order("created_at DESC").Find(&exceptions).Error; err != nil {
		return nil, err
	}
	return exceptions, nil
}

func (s *ExceptionService) GetOpenExceptions() ([]database.Exception, error) {
	var exceptions []database.Exception
	if err := s.db.Where("status = ?", "open").Order("severity DESC, created_at ASC").Find(&exceptions).Error; err != nil {
		return nil, err
	}
	return exceptions, nil
}

func (s *ExceptionService) createAuditLog(action, module, targetID, userID, userName string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    action,
		Module:    module,
		TargetID:  targetID,
		UserID:    userID,
		UserName:  userName,
		Data:      string(jsonData),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)
}
