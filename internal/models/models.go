package models

import "time"

type BookingStatus string

const (
	BookingPending   BookingStatus = "pending"
	BookingConfirmed BookingStatus = "confirmed"
	BookingModified  BookingStatus = "modified"
	BookingCancelled BookingStatus = "cancelled"
	BookingCompleted BookingStatus = "completed"
)

type GuideScheduleStatus string

const (
	ScheduleScheduled GuideScheduleStatus = "scheduled"
	ScheduleAdjusted  GuideScheduleStatus = "adjusted"
	ScheduleInService GuideScheduleStatus = "in_service"
	ScheduleCompleted GuideScheduleStatus = "completed"
	ScheduleCancelled GuideScheduleStatus = "cancelled"
)

type NotificationStatus string

const (
	NotificationUnread NotificationStatus = "unread"
	NotificationRead   NotificationStatus = "read"
)

type ComplaintStatus string

const (
	ComplaintOpen     ComplaintStatus = "open"
	ComplaintHandling ComplaintStatus = "handling"
	ComplaintResolved ComplaintStatus = "resolved"
	ComplaintClosed   ComplaintStatus = "closed"
)

type Role string

const (
	RoleTicketSupervisor Role = "ticket_supervisor"
	RoleTicketChecker    Role = "ticket_checker"
	RoleCustomerService  Role = "customer_service"
	RoleGuide            Role = "guide"
)

type TeamBooking struct {
	ID            string        `json:"id"`
	BookingNo     string        `json:"booking_no"`
	TeamName      string        `json:"team_name"`
	ContactName   string        `json:"contact_name"`
	ContactPhone  string        `json:"contact_phone"`
	VisitorCount  int           `json:"visitor_count"`
	VisitDate     string        `json:"visit_date"`
	VisitTimeSlot string        `json:"visit_time_slot"`
	TicketType    string        `json:"ticket_type"`
	GuideRequired bool          `json:"guide_required"`
	GuideLanguage string        `json:"guide_language"`
	Status        BookingStatus `json:"status"`
	Remark        string        `json:"remark"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	CreatedBy     string        `json:"created_by"`
}

type BookingChangeLog struct {
	ID             string    `json:"id"`
	BookingID      string    `json:"booking_id"`
	ChangeType     string    `json:"change_type"`
	FieldChanged   string    `json:"field_changed"`
	OldValue       string    `json:"old_value"`
	NewValue       string    `json:"new_value"`
	ChangeReason   string    `json:"change_reason"`
	ChangedBy      string    `json:"changed_by"`
	ChangedByRole  Role      `json:"changed_by_role"`
	ChangedAt      time.Time `json:"changed_at"`
}

type GuideSchedule struct {
	ID             string              `json:"id"`
	ScheduleNo     string              `json:"schedule_no"`
	BookingID      string              `json:"booking_id"`
	BookingNo      string              `json:"booking_no"`
	GuideID        string              `json:"guide_id"`
	GuideName      string              `json:"guide_name"`
	GuideLanguage  string              `json:"guide_language"`
	VisitDate      string              `json:"visit_date"`
	StartTime      string              `json:"start_time"`
	EndTime        string              `json:"end_time"`
	TeamName       string              `json:"team_name"`
	VisitorCount   int                 `json:"visitor_count"`
	Status         GuideScheduleStatus `json:"status"`
	Remark         string              `json:"remark"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}

type CheckinRecord struct {
	ID           string    `json:"id"`
	BookingID    string    `json:"booking_id"`
	BookingNo    string    `json:"booking_no"`
	GateNo       string    `json:"gate_no"`
	CheckinTime  time.Time `json:"checkin_time"`
	VisitorCount int       `json:"visitor_count"`
	CheckerName  string    `json:"checker_name"`
	Remark       string    `json:"remark"`
}

type Complaint struct {
	ID             string          `json:"id"`
	ComplaintNo    string          `json:"complaint_no"`
	BookingID      string          `json:"booking_id"`
	BookingNo      string          `json:"booking_no"`
	ScheduleID     string          `json:"schedule_id"`
	Complainant    string          `json:"complainant"`
	ContactPhone   string          `json:"contact_phone"`
	ComplaintType  string          `json:"complaint_type"`
	Content        string          `json:"content"`
	Status         ComplaintStatus `json:"status"`
	Handler        string          `json:"handler"`
	HandleResult   string          `json:"handle_result"`
	CreatedAt      time.Time       `json:"created_at"`
	HandledAt      *time.Time      `json:"handled_at"`
	ResolvedAt     *time.Time      `json:"resolved_at"`
}

type Notification struct {
	ID             string             `json:"id"`
	Title          string             `json:"title"`
	Content        string             `json:"content"`
	TargetRole     Role               `json:"target_role"`
	TargetUser     string             `json:"target_user"`
	RelatedType    string             `json:"related_type"`
	RelatedID      string             `json:"related_id"`
	Status         NotificationStatus `json:"status"`
	CreatedAt      time.Time          `json:"created_at"`
	ReadAt         *time.Time         `json:"read_at"`
}

type BookingDetail struct {
	Booking     TeamBooking         `json:"booking"`
	ChangeLogs  []BookingChangeLog  `json:"change_logs"`
	Schedules   []GuideSchedule     `json:"schedules"`
	Checkins    []CheckinRecord     `json:"checkins"`
	Complaints  []Complaint         `json:"complaints"`
}

type ScheduleDetail struct {
	Schedule    GuideSchedule       `json:"schedule"`
	Booking     TeamBooking         `json:"booking"`
	ChangeLogs  []BookingChangeLog  `json:"booking_change_logs"`
	Checkins    []CheckinRecord     `json:"checkins"`
}

type CreateBookingRequest struct {
	TeamName      string `json:"team_name" validate:"required"`
	ContactName   string `json:"contact_name" validate:"required"`
	ContactPhone  string `json:"contact_phone" validate:"required"`
	VisitorCount  int    `json:"visitor_count" validate:"required,min=1"`
	VisitDate     string `json:"visit_date" validate:"required"`
	VisitTimeSlot string `json:"visit_time_slot" validate:"required"`
	TicketType    string `json:"ticket_type" validate:"required"`
	GuideRequired bool   `json:"guide_required"`
	GuideLanguage string `json:"guide_language"`
	Remark        string `json:"remark"`
	Operator      string `json:"operator"`
}

type UpdateBookingRequest struct {
	VisitorCount  *int      `json:"visitor_count"`
	VisitDate     *string   `json:"visit_date"`
	VisitTimeSlot *string   `json:"visit_time_slot"`
	TicketType    *string   `json:"ticket_type"`
	GuideRequired *bool     `json:"guide_required"`
	GuideLanguage *string   `json:"guide_language"`
	Status        *string   `json:"status"`
	Remark        *string   `json:"remark"`
	ChangeReason  string    `json:"change_reason" validate:"required"`
	Operator      string    `json:"operator"`
}

type CreateScheduleRequest struct {
	BookingID     string `json:"booking_id" validate:"required"`
	GuideID       string `json:"guide_id" validate:"required"`
	GuideName     string `json:"guide_name" validate:"required"`
	GuideLanguage string `json:"guide_language"`
	VisitDate     string `json:"visit_date" validate:"required"`
	StartTime     string `json:"start_time" validate:"required"`
	EndTime       string `json:"end_time" validate:"required"`
	Remark        string `json:"remark"`
}

type UpdateScheduleRequest struct {
	GuideID   *string `json:"guide_id"`
	GuideName *string `json:"guide_name"`
	StartTime *string `json:"start_time"`
	EndTime   *string `json:"end_time"`
	Status    *string `json:"status"`
	Remark    *string `json:"remark"`
}

type CreateCheckinRequest struct {
	BookingID    string `json:"booking_id" validate:"required"`
	GateNo       string `json:"gate_no" validate:"required"`
	VisitorCount int    `json:"visitor_count" validate:"required,min=1"`
	CheckerName  string `json:"checker_name" validate:"required"`
	Remark       string `json:"remark"`
}

type CreateComplaintRequest struct {
	BookingID     string `json:"booking_id"`
	ScheduleID    string `json:"schedule_id"`
	Complainant   string `json:"complainant" validate:"required"`
	ContactPhone  string `json:"contact_phone" validate:"required"`
	ComplaintType string `json:"complaint_type" validate:"required"`
	Content       string `json:"content" validate:"required"`
}

type HandleComplaintRequest struct {
	Handler      string `json:"handler" validate:"required"`
	HandleResult string `json:"handle_result"`
	Status       string `json:"status"`
}
