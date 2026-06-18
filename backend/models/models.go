package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
RoleDispatcher Role = "dispatcher"
RoleLeader     Role = "leader"
RoleCustomer   Role = "customer"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Name      string    `gorm:"size:50;not null" json:"name"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Role      Role      `gorm:"size:20;not null" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}

type BookingStatus string

const (
	BookingCreated    BookingStatus = "pending"
	BookingAssigned   BookingStatus = "assigned"
	BookingInProgress BookingStatus = "in_progress"
	BookingDelayed    BookingStatus = "delayed"
	BookingSurcharged BookingStatus = "surcharged"
	BookingCompleted  BookingStatus = "completed"
	BookingCancelled  BookingStatus = "cancelled"
)

type Booking struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CustomerName  string         `gorm:"size:100;not null" json:"customer_name"`
	CustomerPhone string         `gorm:"size:20;not null" json:"customer_phone"`
	FromAddress   string         `gorm:"size:500;not null" json:"from_address"`
	ToAddress     string         `gorm:"size:500;not null" json:"to_address"`
	MoveDate      time.Time      `json:"move_date"`
	MoveTime      string         `gorm:"size:20" json:"move_time"`
	HouseSize     string         `gorm:"size:50" json:"house_size"`
	Items         string         `gorm:"type:text" json:"items"`
	Remarks       string         `gorm:"type:text" json:"remarks"`
	BasePrice     float64        `json:"base_price"`
	ExtraPrice    float64        `json:"extra_price"`
	TotalPrice    float64        `json:"total_price"`
	PriceRemark   string         `json:"price_remark"`
	PriceAdjusted bool           `json:"price_adjusted"`
	Status        BookingStatus  `gorm:"size:20;index;default:pending" json:"status"`
	VehicleID     *uuid.UUID     `gorm:"type:uuid" json:"vehicle_id"`
	ScheduleID    *uuid.UUID     `gorm:"type:uuid" json:"schedule_id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	Vehicle       *Vehicle       `gorm:"foreignKey:VehicleID" json:"vehicle,omitempty"`
	Schedule      *VehicleSchedule `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	b.ID = uuid.New()
	return nil
}

type VehicleStatus string

const (
	VehicleIdle        VehicleStatus = "idle"
	VehicleAssigned    VehicleStatus = "assigned"
	VehicleInTransit   VehicleStatus = "in_transit"
	VehicleMaintenance VehicleStatus = "maintenance"
)

type Vehicle struct {
	ID          uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	PlateNumber string        `gorm:"uniqueIndex;size:20;not null" json:"plate_number"`
	VehicleType string        `gorm:"size:50;not null" json:"vehicle_type"`
	Capacity    string        `gorm:"size:50" json:"capacity"`
	Status      VehicleStatus `gorm:"size:20;index;default:idle" json:"status"`
	DriverName  string        `gorm:"size:50" json:"driver_name"`
	DriverPhone string        `gorm:"size:20" json:"driver_phone"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

func (v *Vehicle) BeforeCreate(tx *gorm.DB) error {
	v.ID = uuid.New()
	return nil
}

type ScheduleStatus string

const (
	ScheduleCreated   ScheduleStatus = "created"
	ScheduleAssigned  ScheduleStatus = "assigned"
	ScheduleDeparted  ScheduleStatus = "departed"
	ScheduleArrived   ScheduleStatus = "arrived"
	ScheduleLoading   ScheduleStatus = "loading"
	ScheduleMoving    ScheduleStatus = "moving"
	ScheduleUnloading ScheduleStatus = "unloading"
	ScheduleDone      ScheduleStatus = "done"
	ScheduleException ScheduleStatus = "exception"
)

type VehicleSchedule struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	VehicleID   uuid.UUID      `gorm:"type:uuid;index;not null" json:"vehicle_id"`
	BookingID   uuid.UUID      `gorm:"type:uuid;index;not null" json:"booking_id"`
	LeaderID    uuid.UUID      `gorm:"type:uuid;index" json:"leader_id"`
	Leader      *CrewMember    `gorm:"foreignKey:LeaderID" json:"leader,omitempty"`
	PlannedStart time.Time     `json:"planned_start"`
	PlannedEnd  time.Time      `json:"planned_end"`
	ActualStart *time.Time     `json:"actual_start"`
	ActualEnd   *time.Time     `json:"actual_end"`
	Status      ScheduleStatus `gorm:"size:20;index;default:created" json:"status"`
	Remarks     string         `gorm:"type:text" json:"remarks"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	Vehicle     *Vehicle       `gorm:"foreignKey:VehicleID" json:"vehicle,omitempty"`
	Booking     *Booking       `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
	Assignments []CrewAssignment `gorm:"foreignKey:ScheduleID" json:"assignments,omitempty"`
}

func (vs *VehicleSchedule) BeforeCreate(tx *gorm.DB) error {
	vs.ID = uuid.New()
	return nil
}

type CrewStatus string

const (
	CrewActive   CrewStatus = "active"
	CrewRest     CrewStatus = "rest"
	CrewAssigned CrewStatus = "assigned"
	CrewLeave    CrewStatus = "leave"
)

type CrewMember struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
UserID    *uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Name      string     `gorm:"size:50;not null" json:"name"`
	Phone     string     `gorm:"size:20;not null" json:"phone"`
	IDCard    string     `gorm:"size:20" json:"id_card"`
	Position  string     `gorm:"size:50" json:"position"`
	Status    CrewStatus `gorm:"size:20;index;default:active" json:"status"`
	Skill     string     `gorm:"size:100" json:"skill"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (c *CrewMember) BeforeCreate(tx *gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

type AssignmentStatus string

const (
	AssignmentPending   AssignmentStatus = "pending"
	AssignmentAccepted  AssignmentStatus = "accepted"
	AssignmentArrived   AssignmentStatus = "arrived"
	AssignmentWorking   AssignmentStatus = "working"
	AssignmentCompleted AssignmentStatus = "completed"
	AssignmentRejected  AssignmentStatus = "rejected"
)

type CrewAssignment struct {
	ID          uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
	ScheduleID  uuid.UUID        `gorm:"type:uuid;index;not null" json:"schedule_id"`
	CrewID      uuid.UUID        `gorm:"type:uuid;index;not null" json:"crew_id"`
	BookingID   uuid.UUID        `gorm:"type:uuid;index;not null" json:"booking_id"`
	Role        string           `gorm:"size:50" json:"role"`
	Status      AssignmentStatus `gorm:"size:20;index;default:pending" json:"status"`
	RejectCount int              `gorm:"default:0" json:"reject_count"`
	RejectReason string          `gorm:"type:text" json:"reject_reason"`
	ArrivedAt   *time.Time       `json:"arrived_at"`
	CompletedAt *time.Time       `json:"completed_at"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Schedule    *VehicleSchedule `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
	Crew        *CrewMember      `gorm:"foreignKey:CrewID" json:"crew,omitempty"`
	Booking     *Booking         `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
}

func (ca *CrewAssignment) BeforeCreate(tx *gorm.DB) error {
	ca.ID = uuid.New()
	return nil
}

type ExceptionStatus string

const (
	ExceptionPending   ExceptionStatus = "pending"
	ExceptionConfirmed ExceptionStatus = "confirmed"
	ExceptionRejected  ExceptionStatus = "rejected"
	ExceptionRefunded  ExceptionStatus = "refunded"
	ExceptionResolved  ExceptionStatus = "resolved"
)

type ExceptionType string

const (
	ExceptionDamage    ExceptionType = "damage"
	ExceptionDelay     ExceptionType = "delay"
	ExceptionSurcharge ExceptionType = "surcharge"
	ExceptionOther     ExceptionType = "other"
)

type ExceptionRecord struct {
	ID             uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	BookingID      uuid.UUID       `gorm:"type:uuid;index;not null" json:"booking_id"`
	ScheduleID     uuid.UUID       `gorm:"type:uuid;index" json:"schedule_id"`
	ReporterID     uuid.UUID       `gorm:"type:uuid;not null" json:"reporter_id"`
	Type           ExceptionType   `gorm:"size:20;not null" json:"type"`
	Title          string          `gorm:"size:200;not null" json:"title"`
	Description    string          `gorm:"type:text;not null" json:"description"`
	Status         ExceptionStatus `gorm:"size:20;index;default:pending" json:"status"`
	RefundAmount   float64         `json:"refund_amount"`
	SurchargeAmount float64        `json:"surcharge_amount"`
	RejectCount    int             `gorm:"default:0" json:"reject_count"`
	RejectReason   string          `gorm:"type:text" json:"reject_reason"`
	HandlerID      *uuid.UUID      `gorm:"type:uuid" json:"handler_id"`
	HandleRemark   string          `gorm:"type:text" json:"handle_remark"`
	HandledAt      *time.Time      `json:"handled_at"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	Booking        *Booking        `gorm:"foreignKey:BookingID" json:"booking,omitempty"`
	Schedule       *VehicleSchedule `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
	Photos         []DamagePhoto   `gorm:"foreignKey:ExceptionID" json:"photos,omitempty"`
}

func (e *ExceptionRecord) BeforeCreate(tx *gorm.DB) error {
	e.ID = uuid.New()
	return nil
}

type NotificationType string

const (
	NotificationException  NotificationType = "exception"
	NotificationSchedule   NotificationType = "schedule"
	NotificationAssignment NotificationType = "assignment"
	NotificationSystem     NotificationType = "system"
)

type Notification struct {
	ID        uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID        `gorm:"type:uuid;index;not null" json:"user_id"`
	Type      NotificationType `gorm:"size:20;not null" json:"type"`
	Title     string           `gorm:"size:200;not null" json:"title"`
	Content   string           `gorm:"type:text;not null" json:"content"`
	RelatedID *uuid.UUID       `gorm:"type:uuid" json:"related_id"`
	Read      bool             `gorm:"index;default:false" json:"read"`
	ReadAt    *time.Time       `json:"read_at"`
	CreatedAt time.Time        `json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	n.ID = uuid.New()
	return nil
}

type DamagePhoto struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	ExceptionID uuid.UUID       `gorm:"type:uuid;index;not null" json:"exception_id"`
	BookingID   uuid.UUID       `gorm:"type:uuid;index" json:"booking_id"`
	UploaderID  uuid.UUID       `gorm:"type:uuid;not null" json:"uploader_id"`
	URL         string          `gorm:"size:500;not null" json:"url"`
	FileName    string          `gorm:"size:200" json:"file_name"`
	Description string          `gorm:"type:text" json:"description"`
	CreatedAt   time.Time       `json:"created_at"`
	Exception   *ExceptionRecord `gorm:"foreignKey:ExceptionID" json:"-"`
}

func (dp *DamagePhoto) BeforeCreate(tx *gorm.DB) error {
	dp.ID = uuid.New()
	return nil
}

type PaginationResult struct {
	Total     int64       `json:"total"`
	Page      int         `json:"page"`
	PageSize  int         `json:"page_size"`
	PageCount int         `json:"page_count"`
	Data      interface{} `json:"data"`
}

func Paginate(query *gorm.DB, page, pageSize int, dest interface{}) (*PaginationResult, error) {
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(dest).Error; err != nil {
		return nil, err
	}
	pageCount := int(total) / pageSize
	if int(total)%pageSize > 0 {
		pageCount++
	}
	return &PaginationResult{Total: total, Page: page, PageSize: pageSize, PageCount: pageCount, Data: dest}, nil
}

func SeedData(db *gorm.DB) error {
	var count int64
	db.Model(&User{}).Count(&count)
	if count > 0 {
		return nil
	}

	users := []User{
		{Username: "dispatcher", Password: "123456", Name: "张调度", Phone: "13800000002", Role: RoleDispatcher},
		{Username: "customer", Password: "123456", Name: "李客服", Phone: "13800000003", Role: RoleCustomer},
		{Username: "crew1", Password: "123456", Name: "王师傅", Phone: "13800000004", Role: RoleLeader},
		{Username: "crew2", Password: "123456", Name: "赵师傅", Phone: "13800000005", Role: RoleLeader},
		{Username: "crew3", Password: "123456", Name: "钱师傅", Phone: "13800000006", Role: RoleLeader},
	}
	for _, u := range users {
		if err := db.Create(&u).Error; err != nil {
			return err
		}
	}

	vehicles := []Vehicle{
		{PlateNumber: "京A12345", VehicleType: "厢式货车", Capacity: "4.2米/5吨", DriverName: "陈司机", DriverPhone: "13900000001"},
		{PlateNumber: "京A67890", VehicleType: "平板货车", Capacity: "6.8米/10吨", DriverName: "孙司机", DriverPhone: "13900000002"},
		{PlateNumber: "京B11111", VehicleType: "厢式货车", Capacity: "9.6米/15吨", DriverName: "周司机", DriverPhone: "13900000003"},
	}
	for _, v := range vehicles {
		if err := db.Create(&v).Error; err != nil {
			return err
		}
	}

	var crewUserIDs []uuid.UUID
	for _, u := range users {
		if u.Role == RoleLeader {
			crewUserIDs = append(crewUserIDs, u.ID)
		}
	}
	crewMembers := []CrewMember{
		{Name: "王师傅", Phone: "13800000004", IDCard: "110101199001010001", Position: "组长", Skill: "家具拆装,钢琴搬运"},
		{Name: "赵师傅", Phone: "13800000005", IDCard: "110101199001010002", Position: "搬运工", Skill: "重物搬运,空调移机"},
		{Name: "钱师傅", Phone: "13800000006", IDCard: "110101199001010003", Position: "搬运工", Skill: "易碎品搬运,打包"},
	}
	for i := range crewMembers {
		if len(crewUserIDs) > i {
			crewMembers[i].UserID = &crewUserIDs[i]
		}
		if err := db.Create(&crewMembers[i]).Error; err != nil {
			return err
		}
	}

	return nil
}
