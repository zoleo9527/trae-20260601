package services

import (
	"encoding/json"
	"museum-education/internal/database"
	"time"

	"github.com/jinzhu/gorm"
)

type InstructorService struct {
	db *gorm.DB
}

func NewInstructorService(db *gorm.DB) *InstructorService {
	return &InstructorService{db: db}
}

type CreateInstructorRequest struct {
	Name     string `json:"name" validate:"required"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Specialty string `json:"specialty"`
}

type UpdateInstructorRequest struct {
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Specialty string `json:"specialty"`
	Status   string `json:"status"`
}

type ScheduleRequest struct {
	InstructorID string    `json:"instructor_id"`
	CourseID     string    `json:"course_id"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
}

type InstructorSchedule struct {
	ID           string    `gorm:"primary_key" json:"id"`
	InstructorID string    `json:"instructor_id"`
	CourseID     string    `json:"course_id"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *InstructorService) CreateInstructor(req CreateInstructorRequest) (*database.Instructor, error) {
	instructor := &database.Instructor{
		ID:        database.GenerateID(),
		Name:      req.Name,
		Phone:     req.Phone,
		Email:     req.Email,
		Specialty: req.Specialty,
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(instructor).Error; err != nil {
		return nil, err
	}

	return instructor, nil
}

func (s *InstructorService) GetInstructorByID(id string) (*database.Instructor, error) {
	var instructor database.Instructor
	if err := s.db.Where("id = ?", id).First(&instructor).Error; err != nil {
		return nil, err
	}
	return &instructor, nil
}

func (s *InstructorService) GetInstructors(status string) ([]database.Instructor, error) {
	var instructors []database.Instructor
	query := s.db.Model(&database.Instructor{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if err := query.Find(&instructors).Error; err != nil {
		return nil, err
	}
	return instructors, nil
}

func (s *InstructorService) UpdateInstructor(id string, req UpdateInstructorRequest) (*database.Instructor, error) {
	var instructor database.Instructor
	if err := s.db.Where("id = ?", id).First(&instructor).Error; err != nil {
		return nil, err
	}

	if req.Name != "" {
		instructor.Name = req.Name
	}
	if req.Phone != "" {
		instructor.Phone = req.Phone
	}
	if req.Email != "" {
		instructor.Email = req.Email
	}
	if req.Specialty != "" {
		instructor.Specialty = req.Specialty
	}
	if req.Status != "" {
		instructor.Status = req.Status
	}
	instructor.UpdatedAt = time.Now()

	if err := s.db.Save(&instructor).Error; err != nil {
		return nil, err
	}

	return &instructor, nil
}

func (s *InstructorService) ScheduleCourse(req ScheduleRequest) (*InstructorSchedule, error) {
	schedule := &InstructorSchedule{
		ID:           database.GenerateID(),
		InstructorID: req.InstructorID,
		CourseID:     req.CourseID,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		CreatedAt:    time.Now(),
	}

	if err := s.db.Create(schedule).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(schedule)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "schedule",
		Module:    "instructor",
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return schedule, nil
}

func (s *InstructorService) GetInstructorSchedule(instructorID string) ([]InstructorSchedule, error) {
	var schedules []InstructorSchedule
	if err := s.db.Where("instructor_id = ?", instructorID).Order("start_time DESC").Find(&schedules).Error; err != nil {
		return nil, err
	}
	return schedules, nil
}

func (s *InstructorService) GetCourseSchedule(courseID string) (*InstructorSchedule, error) {
	var schedule InstructorSchedule
	if err := s.db.Where("course_id = ?", courseID).First(&schedule).Error; err != nil {
		return nil, err
	}
	return &schedule, nil
}
