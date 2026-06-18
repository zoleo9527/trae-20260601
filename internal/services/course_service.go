package services

import (
	"encoding/json"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type CourseService struct {
	db *gorm.DB
}

func NewCourseService(db *gorm.DB) *CourseService {
	return &CourseService{db: db}
}

type CreateCourseRequest struct {
	Name        string    `json:"name" validate:"required"`
	Description string    `json:"description"`
	Capacity    int       `json:"capacity"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location"`
	OperatorID  string    `json:"operator_id"`
	OperatorName string   `json:"operator_name"`
}

type UpdateCourseRequest struct {
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Capacity    int       `json:"capacity"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location"`
	Status      string    `json:"status"`
	OperatorID  string    `json:"operator_id"`
	OperatorName string   `json:"operator_name"`
}

func (s *CourseService) CreateCourse(req CreateCourseRequest) (*database.Course, error) {
	course := &database.Course{
		ID:          database.GenerateID(),
		Name:        req.Name,
		Description: req.Description,
		Capacity:    req.Capacity,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Location:    req.Location,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(course).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(course)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "create",
		Module:    "course",
		TargetID:  course.ID,
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return course, nil
}

func (s *CourseService) GetCourseByID(id string) (*database.Course, error) {
	var course database.Course
	if err := s.db.Where("id = ?", id).First(&course).Error; err != nil {
		return nil, err
	}
	return &course, nil
}

func (s *CourseService) GetCourses(status string) ([]database.Course, error) {
	var courses []database.Course
	query := s.db.Model(&database.Course{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if err := query.Order("start_time DESC").Find(&courses).Error; err != nil {
		return nil, err
	}
	return courses, nil
}

func (s *CourseService) UpdateCourse(id string, req UpdateCourseRequest) (*database.Course, error) {
	var course database.Course
	if err := s.db.Where("id = ?", id).First(&course).Error; err != nil {
		return nil, err
	}

	oldData, _ := json.Marshal(course)

	if req.Name != "" {
		course.Name = req.Name
	}
	if req.Description != "" {
		course.Description = req.Description
	}
	if req.Capacity > 0 {
		course.Capacity = req.Capacity
	}
	if !req.StartTime.IsZero() {
		course.StartTime = req.StartTime
	}
	if !req.EndTime.IsZero() {
		course.EndTime = req.EndTime
	}
	if req.Location != "" {
		course.Location = req.Location
	}
	if req.Status != "" {
		course.Status = req.Status
	}
	course.UpdatedAt = time.Now()

	if err := s.db.Save(&course).Error; err != nil {
		return nil, err
	}

	newData, _ := json.Marshal(course)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "update",
		Module:    "course",
		TargetID:  course.ID,
		UserID:    req.OperatorID,
		UserName:  req.OperatorName,
		Data:      "{\"old\":" + string(oldData) + ",\"new\":" + string(newData) + "}",
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return &course, nil
}

func (s *CourseService) DeleteCourse(id string, operatorID, operatorName string) error {
	var course database.Course
	if err := s.db.Where("id = ?", id).First(&course).Error; err != nil {
		return err
	}

	data, _ := json.Marshal(course)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "delete",
		Module:    "course",
		TargetID:  course.ID,
		UserID:    operatorID,
		UserName:  operatorName,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return s.db.Delete(&course).Error
}
