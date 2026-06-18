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
	Name      string `json:"name" validate:"required"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Specialty string `json:"specialty"`
}

type UpdateInstructorRequest struct {
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Specialty string `json:"specialty"`
	Status    string `json:"status"`
}

type ScheduleRequest struct {
	InstructorID string    `json:"instructor_id"`
	CourseID     string    `json:"course_id"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	Location     string    `json:"location"`
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

func (s *InstructorService) ScheduleCourse(req ScheduleRequest) (*database.InstructorSchedule, error) {
	var instructor database.Instructor
	if err := s.db.Where("id = ?", req.InstructorID).First(&instructor).Error; err != nil {
		return nil, err
	}

	var course database.Course
	if err := s.db.Where("id = ?", req.CourseID).First(&course).Error; err != nil {
		return nil, err
	}

	schedule := &database.InstructorSchedule{
		ID:             database.GenerateID(),
		InstructorID:   req.InstructorID,
		InstructorName: instructor.Name,
		CourseID:       req.CourseID,
		CourseName:     course.Name,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		Location:       req.Location,
		Status:         "scheduled",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.db.Create(schedule).Error; err != nil {
		return nil, err
	}

	data, _ := json.Marshal(schedule)
	auditLog := &database.AuditLog{
		ID:        database.GenerateID(),
		Action:    "schedule",
		Module:    "instructor",
		TargetID:  schedule.ID,
		UserID:    req.InstructorID,
		UserName:  instructor.Name,
		Data:      string(data),
		CreatedAt: time.Now(),
	}
	s.db.Create(auditLog)

	return schedule, nil
}

func (s *InstructorService) GetInstructorSchedule(instructorID string) ([]database.InstructorSchedule, error) {
	var schedules []database.InstructorSchedule
	if err := s.db.Where("instructor_id = ?", instructorID).Order("start_time DESC").Find(&schedules).Error; err != nil {
		return nil, err
	}
	return schedules, nil
}

func (s *InstructorService) GetCourseSchedule(courseID string) ([]database.InstructorSchedule, error) {
	var schedules []database.InstructorSchedule
	if err := s.db.Where("course_id = ?", courseID).Order("start_time ASC").Find(&schedules).Error; err != nil {
		return nil, err
	}
	return schedules, nil
}

func (s *InstructorService) GetSchedulesByDateRange(startTime, endTime time.Time) ([]database.InstructorSchedule, error) {
	var schedules []database.InstructorSchedule
	if err := s.db.Where("start_time >= ? AND start_time <= ?", startTime, endTime).
		Order("start_time ASC").
		Find(&schedules).Error; err != nil {
		return nil, err
	}
	return schedules, nil
}

func (s *InstructorService) GetInstructorSchedulesByDate(instructorID string, date time.Time) ([]database.InstructorSchedule, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	var schedules []database.InstructorSchedule
	if err := s.db.Where("instructor_id = ? AND start_time >= ? AND start_time < ?",
		instructorID, startOfDay, endOfDay).
		Order("start_time ASC").
		Find(&schedules).Error; err != nil {
		return nil, err
	}
	return schedules, nil
}
