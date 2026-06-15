package handlers

import (
	"moving-company/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ DB *gorm.DB }
func NewHandler(db *gorm.DB) *Handler { return &Handler{DB: db} }

type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type CreateScheduleReq struct {
	BookingID    uuid.UUID `json:"booking_id"`
	VehicleID    uuid.UUID `json:"vehicle_id"`
	PlannedStart time.Time `json:"planned_start"`
	PlannedEnd   time.Time `json:"planned_end"`
	Remarks      string    `json:"remarks"`
	CrewList     []struct {
		CrewID uuid.UUID `json:"crew_id"`
		Role   string    `json:"role"`
	} `json:"crew_list"`
}

type UpdateScheduleStatusReq struct {
	Status models.ScheduleStatus `json:"status"`
}

type BatchAssignReq struct {
	ScheduleID uuid.UUID `json:"schedule_id"`
	BookingID  uuid.UUID `json:"booking_id"`
	CrewList   []struct {
		CrewID uuid.UUID `json:"crew_id"`
		Role   string    `json:"role"`
	} `json:"crew_list"`
}

type UpdateAssignmentReq struct {
	Status       models.AssignmentStatus `json:"status"`
	RejectReason string                 `json:"reject_reason"`
}

type CreateExceptionReq struct {
	BookingID       uuid.UUID            `json:"booking_id"`
	ScheduleID      uuid.UUID            `json:"schedule_id"`
	ReporterID      uuid.UUID            `json:"reporter_id"`
	Type            models.ExceptionType `json:"type"`
	Title           string               `json:"title"`
	Description     string               `json:"description"`
	RefundAmount    float64              `json:"refund_amount"`
	SurchargeAmount float64              `json:"surcharge_amount"`
	Photos          []struct {
		URL         string `json:"url"`
		FileName    string `json:"file_name"`
		Description string `json:"description"`
	} `json:"photos"`
}

type HandleExceptionReq struct {
	Status          models.ExceptionStatus `json:"status"`
	HandlerID       uuid.UUID              `json:"handler_id"`
	HandleRemark    string                 `json:"handle_remark"`
	RejectReason    string                 `json:"reject_reason"`
	RefundAmount    float64                `json:"refund_amount"`
	SurchargeAmount float64                `json:"surcharge_amount"`
}

func (h *Handler) createNotification(userID uuid.UUID, typ models.NotificationType, title, content string, relatedID *uuid.UUID) {
	h.DB.Create(&models.Notification{
		UserID:    userID,
		Type:      typ,
		Title:     title,
		Content:   content,
		RelatedID: relatedID,
	})
}

func (h *Handler) createNotificationTx(tx *gorm.DB, userID uuid.UUID, typ models.NotificationType, title, content string, relatedID *uuid.UUID) {
	tx.Create(&models.Notification{
		UserID:    userID,
		Type:      typ,
		Title:     title,
		Content:   content,
		RelatedID: relatedID,
	})
}

func (h *Handler) getUserIDsByRole(role models.Role) []uuid.UUID {
	var users []models.User
	h.DB.Where("role = ?", role).Find(&users)
	ids := make([]uuid.UUID, 0, len(users))
	for _, u := range users { ids = append(ids, u.ID) }
	return ids
}
