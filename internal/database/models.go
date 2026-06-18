package database

import (
	"time"

	"github.com/google/uuid"
)

type Course struct {
	ID          string     `gorm:"primary_key" json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Capacity    int        `json:"capacity"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     time.Time  `json:"end_time"`
	Location    string     `json:"location"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

type Instructor struct {
	ID            string     `gorm:"primary_key" json:"id"`
	Name          string     `json:"name"`
	Phone         string     `json:"phone"`
	Email         string     `json:"email"`
	Specialty     string     `json:"specialty"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

type Material struct {
	ID          string     `gorm:"primary_key" json:"id"`
	Name        string     `json:"name"`
	Quantity    int        `json:"quantity"`
	Unit        string     `json:"unit"`
	Description string     `json:"description"`
	CourseID    string     `json:"course_id"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

type ActivitySignup struct {
	ID         string     `gorm:"primary_key" json:"id"`
	CourseID   string     `json:"course_id"`
	StudentID  string     `json:"student_id"`
	StudentName string    `json:"student_name"`
	Phone      string     `json:"phone"`
	Status     string     `json:"status"`
	SignupTime time.Time  `json:"signup_time"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type ActivityCheckin struct {
	ID            string     `gorm:"primary_key" json:"id"`
	CourseID      string     `json:"course_id"`
	StudentID     string     `json:"student_id"`
	StudentName   string     `json:"student_name"`
	CheckinTime   time.Time  `json:"checkin_time"`
	Status        string     `json:"status"`
	Remarks       string     `json:"remarks"`
	OperatorID    string     `json:"operator_id"`
	OperatorName  string     `json:"operator_name"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type SafetyRecord struct {
	ID             string     `gorm:"primary_key" json:"id"`
	CheckinID      string     `json:"checkin_id"`
	CourseID       string     `json:"course_id"`
	StudentID      string     `json:"student_id"`
	StudentName    string     `json:"student_name"`
	CheckinRemarks string     `json:"checkin_remarks"`
	SafetyStatus   string     `json:"safety_status"`
	SafetyRemarks  string     `json:"safety_remarks"`
	OperatorID     string     `json:"operator_id"`
	OperatorName   string     `json:"operator_name"`
	RecordTime     time.Time  `json:"record_time"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type AuditLog struct {
	ID        string     `gorm:"primary_key" json:"id"`
	Action    string     `json:"action"`
	Module    string     `json:"module"`
	TargetID  string     `json:"target_id"`
	UserID    string     `json:"user_id"`
	UserName  string     `json:"user_name"`
	Data      string     `json:"data"`
	IP        string     `json:"ip"`
	CreatedAt time.Time  `json:"created_at"`
}

type Exception struct {
	ID           string     `gorm:"primary_key" json:"id"`
	CheckinID    string     `json:"checkin_id"`
	CourseID     string     `json:"course_id"`
	StudentID    string     `json:"student_id"`
	StudentName  string     `json:"student_name"`
	Type        string     `json:"type"`
	Description  string     `json:"description"`
	Severity     string     `json:"severity"`
	Status       string     `json:"status"`
	ResolvedBy   string     `json:"resolved_by"`
	ResolvedName string     `json:"resolved_name"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
	ResolvedNote string     `json:"resolved_note"`
	OperatorID   string     `json:"operator_id"`
	OperatorName string     `json:"operator_name"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type InstructorSchedule struct {
	ID            string    `gorm:"primary_key" json:"id"`
	InstructorID  string    `json:"instructor_id"`
	InstructorName string  `json:"instructor_name"`
	CourseID      string    `json:"course_id"`
	CourseName    string    `json:"course_name"`
	StartTime     time.Time `json:"start_time"`
	EndTime       time.Time `json:"end_time"`
	Location      string    `json:"location"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func GenerateID() string {
	return uuid.New().String()
}
