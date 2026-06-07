package models

import (
	"time"
)

type UserRole string

const (
	RoleProductionForeman UserRole = "production_foreman"
	RoleQualityInspector  UserRole = "quality_inspector"
	RoleColdStorageAdmin  UserRole = "cold_storage_admin"
)

type CertificateStatus string

const (
	CertStatusPending    CertificateStatus = "pending"
	CertStatusProcessing CertificateStatus = "processing"
	CertStatusApproved   CertificateStatus = "approved"
	CertStatusRejected   CertificateStatus = "rejected"
	CertStatusBlocked    CertificateStatus = "blocked"
)

type ReleaseStatus string

const (
	ReleaseStatusPending     ReleaseStatus = "pending"
	ReleaseStatusReviewing   ReleaseStatus = "reviewing"
	ReleaseStatusPassed      ReleaseStatus = "passed"
	ReleaseStatusFailed      ReleaseStatus = "failed"
	ReleaseStatusOnHold      ReleaseStatus = "on_hold"
	ReleaseStatusReleased    ReleaseStatus = "released"
)

type User struct {
	ID       uint     `gorm:"primaryKey" json:"id"`
	Username string   `gorm:"uniqueIndex;not null" json:"username"`
	Password string   `gorm:"not null" json:"-"`
	Name     string   `gorm:"not null" json:"name"`
	Role     UserRole `gorm:"not null" json:"role"`
}

type QuarantineCertificate struct {
	ID              uint              `gorm:"primaryKey" json:"id"`
	CertificateNo   string            `gorm:"uniqueIndex;not null" json:"certificate_no"`
	IdempotencyKey  *string           `gorm:"uniqueIndex" json:"-"`
	BatchNo         string            `gorm:"not null" json:"batch_no"`
	ProductName     string            `gorm:"not null" json:"product_name"`
	Weight          float64           `gorm:"not null" json:"weight"`
	Source          string            `gorm:"not null" json:"source"`
	SlaughterDate   *time.Time        `json:"slaughter_date"`
	Status          CertificateStatus `gorm:"not null;default:pending" json:"status"`
	InspectorID     *uint             `json:"inspector_id"`
	Inspector       *User             `gorm:"foreignKey:InspectorID" json:"inspector,omitempty"`
	SubmittedByID   uint              `gorm:"not null" json:"submitted_by_id"`
	SubmittedBy     User              `gorm:"foreignKey:SubmittedByID" json:"submitted_by"`
	BlockedReason   string            `json:"blocked_reason,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
	Notes           []CertificateNote `gorm:"foreignKey:CertificateID" json:"notes,omitempty"`
}

type CertificateNote struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	CertificateID uint      `gorm:"not null" json:"certificate_id"`
	Content       string    `gorm:"not null" json:"content"`
	CreatedByID   uint      `gorm:"not null" json:"created_by_id"`
	CreatedBy     User      `gorm:"foreignKey:CreatedByID" json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
}

type QualityRelease struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ReleaseNo       string         `gorm:"uniqueIndex;not null" json:"release_no"`
	IdempotencyKey  *string        `gorm:"uniqueIndex" json:"-"`
	CertificateID   *uint          `json:"certificate_id"`
	Certificate     *QuarantineCertificate `gorm:"foreignKey:CertificateID" json:"certificate,omitempty"`
	BatchNo         string         `gorm:"not null" json:"batch_no"`
	ProductName     string         `gorm:"not null" json:"product_name"`
	InspectionItems string         `json:"inspection_items"`
	InspectionResult string        `json:"inspection_result"`
	Status          ReleaseStatus  `gorm:"not null;default:pending" json:"status"`
	ReviewerID      *uint          `json:"reviewer_id"`
	Reviewer        *User          `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	SubmittedByID   uint           `gorm:"not null" json:"submitted_by_id"`
	SubmittedBy     User           `gorm:"foreignKey:SubmittedByID" json:"submitted_by"`
	HoldReason      string         `json:"hold_reason,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	Notes           []ReleaseNote  `gorm:"foreignKey:ReleaseID" json:"notes,omitempty"`
}

type ReleaseNote struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ReleaseID   uint      `gorm:"not null" json:"release_id"`
	Content     string    `gorm:"not null" json:"content"`
	CreatedByID uint      `gorm:"not null" json:"created_by_id"`
	CreatedBy   User      `gorm:"foreignKey:CreatedByID" json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}

type IdempotencyRecord struct {
	ID           uint      `gorm:"primaryKey"`
	Key          string    `gorm:"uniqueIndex;not null"`
	ResponseJSON string    `gorm:"type:text"`
	CreatedAt    time.Time
}
