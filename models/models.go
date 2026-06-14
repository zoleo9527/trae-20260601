package models

import (
	"time"
)

type LoanStatus string

const (
	LoanStatusNormal     LoanStatus = "normal"
	LoanStatusOverdue    LoanStatus = "overdue"
	LoanStatusExtended   LoanStatus = "extended"
	LoanStatusSettled    LoanStatus = "settled"
	LoanStatusWrittenOff LoanStatus = "written_off"
)

type RepaymentStatus string

const (
	RepaymentStatusPending   RepaymentStatus = "pending"
	RepaymentStatusPartial   RepaymentStatus = "partial"
	RepaymentStatusPaid      RepaymentStatus = "paid"
	RepaymentStatusOverdue   RepaymentStatus = "overdue"
	RepaymentStatusExtended  RepaymentStatus = "extended"
)

type CollectionType string

const (
	CollectionTypePhone    CollectionType = "phone"
	CollectionTypeMessage  CollectionType = "message"
	CollectionTypeVisit    CollectionType = "visit"
	CollectionTypeLetter   CollectionType = "letter"
	CollectionTypeOther    CollectionType = "other"
)

type ContactResult string

const (
	ContactResultConnected    ContactResult = "connected"
	ContactResultLost         ContactResult = "lost"
	ContactResultRefused      ContactResult = "refused"
	ContactResultPromised     ContactResult = "promised"
	ContactResultPartialPaid  ContactResult = "partial_paid"
)

type ExtensionStatus string

const (
	ExtensionStatusPending  ExtensionStatus = "pending"
	ExtensionStatusApproved ExtensionStatus = "approved"
	ExtensionStatusRejected ExtensionStatus = "rejected"
)

type Role string

const (
	RoleManager   Role = "manager"
	RoleRisk      Role = "risk"
	RoleCollector Role = "collector"
)

type Loan struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	LoanNo            string     `gorm:"size:32;uniqueIndex" json:"loan_no"`
	CustomerName      string     `gorm:"size:64" json:"customer_name"`
	CustomerIDCard    string     `gorm:"size:32" json:"customer_id_card"`
	CustomerPhone     string     `gorm:"size:32" json:"customer_phone"`
	PrincipalAmount   float64    `json:"principal_amount"`
	InterestRate      float64    `json:"interest_rate"`
	TermMonths        int        `json:"term_months"`
	StartDate         time.Time  `json:"start_date"`
	EndDate           time.Time  `json:"end_date"`
	Status            LoanStatus `gorm:"size:32;default:normal" json:"status"`
	TotalRepaid       float64    `gorm:"default:0" json:"total_repaid"`
	OutstandingAmount float64    `gorm:"default:0" json:"outstanding_amount"`
	OverdueDays       int        `gorm:"default:0" json:"overdue_days"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`

	RepaymentPlans     []RepaymentPlan      `gorm:"foreignKey:LoanID" json:"repayment_plans,omitempty"`
	CollectionRecords  []CollectionRecord   `gorm:"foreignKey:LoanID" json:"collection_records,omitempty"`
	ExtensionApps      []ExtensionApplication `gorm:"foreignKey:LoanID" json:"extension_apps,omitempty"`
	OperationLogs      []OperationLog       `gorm:"foreignKey:LoanID" json:"operation_logs,omitempty"`
}

type RepaymentPlan struct {
	ID             uint            `gorm:"primaryKey" json:"id"`
	LoanID         uint            `gorm:"index" json:"loan_id"`
	PeriodNo       int             `json:"period_no"`
	DueDate        time.Time       `json:"due_date"`
	Principal      float64         `json:"principal"`
	Interest       float64         `json:"interest"`
	TotalAmount    float64         `json:"total_amount"`
	PaidAmount     float64         `gorm:"default:0" json:"paid_amount"`
	Status         RepaymentStatus `gorm:"size:32;default:pending" json:"status"`
	OverdueDays    int             `gorm:"default:0" json:"overdue_days"`
	ActualPaidDate *time.Time      `json:"actual_paid_date,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type CollectionRecord struct {
	ID               uint          `gorm:"primaryKey" json:"id"`
	LoanID           uint          `gorm:"index" json:"loan_id"`
	CollectorName    string        `gorm:"size:64" json:"collector_name"`
	CollectorRole    Role          `gorm:"size:32" json:"collector_role"`
	CollectionType   CollectionType `gorm:"size:32" json:"collection_type"`
	CollectionTime   time.Time     `json:"collection_time"`
	ContactResult    ContactResult `gorm:"size:32" json:"contact_result"`
	OverdueReason    string        `gorm:"type:text" json:"overdue_reason"`
	PromiseDate      *time.Time    `json:"promise_date,omitempty"`
	PromiseAmount    *float64      `json:"promise_amount,omitempty"`
	HasExtensionHint bool          `gorm:"default:false" json:"has_extension_hint"`
	SupplementFiles  string        `gorm:"type:text" json:"supplement_files"`
	Remark           string        `gorm:"type:text" json:"remark"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

type ExtensionApplication struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	LoanID          uint            `gorm:"index" json:"loan_id"`
	ApplicantName   string          `gorm:"size:64" json:"applicant_name"`
	ApplicantRole   Role            `gorm:"size:32" json:"applicant_role"`
	ApplyTime       time.Time       `json:"apply_time"`
	ExtensionMonths int             `json:"extension_months"`
	NewEndDate      time.Time       `json:"new_end_date"`
	Reason          string          `gorm:"type:text" json:"reason"`
	SupplementFiles string          `gorm:"type:text" json:"supplement_files"`
	Status          ExtensionStatus `gorm:"size:32;default:pending" json:"status"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`

	ApprovalDecision *ApprovalDecision `gorm:"foreignKey:ExtensionAppID" json:"approval_decision,omitempty"`
}

type ApprovalDecision struct {
	ID             uint            `gorm:"primaryKey" json:"id"`
	ExtensionAppID uint            `gorm:"uniqueIndex" json:"extension_app_id"`
	ApproverName   string          `gorm:"size:64" json:"approver_name"`
	ApproverRole   Role            `gorm:"size:32" json:"approver_role"`
	DecisionTime   time.Time       `json:"decision_time"`
	Decision       ExtensionStatus `gorm:"size:32" json:"decision"`
	RiskAssessment string          `gorm:"type:text" json:"risk_assessment"`
	Remark         string          `gorm:"type:text" json:"remark"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type OperationLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	LoanID     uint      `gorm:"index" json:"loan_id"`
	Operator   string    `gorm:"size:64" json:"operator"`
	Role       Role      `gorm:"size:32" json:"role"`
	Action     string    `gorm:"size:64" json:"action"`
	Detail     string    `gorm:"type:text" json:"detail"`
	IPAddress  string    `gorm:"size:64" json:"ip_address"`
	CreatedAt  time.Time  `json:"created_at"`
}
