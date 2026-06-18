files = {}

files['internal/store/complaint.go'] = '''package store

import (
	"fmt"
	"sort"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateComplaint(req models.CreateComplaintRequest) *models.Complaint {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("CP%06d", s.complaintSeq)
	s.complaintSeq++

	var bookingNo string
	booking, ok := s.bookings[req.BookingID]
	if ok {
		bookingNo = booking.BookingNo
	}

	now := time.Now()
	complaint := models.Complaint{
		ID:            id,
		ComplaintNo:   id,
		BookingID:     req.BookingID,
		BookingNo:     bookingNo,
		ScheduleID:    req.ScheduleID,
		Complainant:   req.Complainant,
		ContactPhone:  req.ContactPhone,
		ComplaintType: req.ComplaintType,
		Content:       req.Content,
		Status:        models.ComplaintOpen,
		CreatedAt:     now,
	}

	s.complaints[id] = complaint
	return &complaint
}

func (s *Store) GetComplaint(id string) (*models.Complaint, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	complaint, ok := s.complaints[id]
	if !ok {
		return nil, false
	}
	return &complaint, true
}

func (s *Store) ListComplaints() []models.Complaint {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Complaint, 0, len(s.complaints))
	for _, complaint := range s.complaints {
		result = append(result, complaint)
	}
	return result
}

func (s *Store) HandleComplaint(id string, req models.HandleComplaintRequest) (*models.Complaint, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	complaint, ok := s.complaints[id]
	if !ok {
		return nil, false
	}

	now := time.Now()

	if req.Handler != "" {
		complaint.Handler = req.Handler
	}
	if req.HandleResult != "" {
		complaint.HandleResult = req.HandleResult
	}
	if req.Status != "" {
		complaint.Status = models.ComplaintStatus(req.Status)
	}

	if complaint.Status == models.ComplaintHandling && complaint.HandledAt == nil {
		complaint.HandledAt = &now
	}
	if complaint.Status == models.ComplaintResolved && complaint.ResolvedAt == nil {
		complaint.ResolvedAt = &now
	}

	s.complaints[id] = complaint
	return &complaint, true
}

func (s *Store) GetComplaintDetail(id string) (*models.ComplaintDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	complaint, ok := s.complaints[id]
	if !ok {
		return nil, false
	}

	detail := &models.ComplaintDetail{
		Complaint:     complaint,
		Booking:       nil,
		Schedule:      nil,
		ChangeLogs:    []models.BookingChangeLog{},
		Checkins:      []models.CheckinRecord{},
		Notifications: []models.Notification{},
	}

	bookingID := complaint.BookingID

	if bookingID != "" {
		booking, ok := s.bookings[bookingID]
		if ok {
			b := booking
			detail.Booking = &b
			logs := make([]models.BookingChangeLog, len(s.changeLogs[bookingID]))
			copy(logs, s.changeLogs[bookingID])
			detail.ChangeLogs = logs

			checkins := make([]models.CheckinRecord, 0)
			for _, ci := range s.checkins {
				if ci.BookingID == bookingID {
					checkins = append(checkins, ci)
				}
			}
			sort.Slice(checkins, func(i, j int) bool {
				return checkins[i].CheckinTime.Before(checkins[j].CheckinTime)
			})
			detail.Checkins = checkins
		}
	}

	if complaint.ScheduleID != "" {
		schedule, ok := s.schedules[complaint.ScheduleID]
		if ok {
			sc := schedule
			detail.Schedule = &sc
		}
	}

	notifications := make([]models.Notification, 0)
	for _, n := range s.notifications {
		if (n.RelatedType == "complaint" && n.RelatedID == id) ||
			(n.RelatedType == "booking" && n.RelatedID == bookingID) {
			notifications = append(notifications, n)
		}
	}
	detail.Notifications = notifications

	return detail, true
}
'''

files['internal/store/booking.go'] = '''package store

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"scenic-ticket-system/internal/models"
)

func (s *Store) CreateBooking(req models.CreateBookingRequest) *models.TeamBooking {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("BK%06d", s.bookingSeq)
	s.bookingSeq++
	now := time.Now()

	booking := models.TeamBooking{
		ID:            id,
		BookingNo:     id,
		TeamName:      req.TeamName,
		ContactName:   req.ContactName,
		ContactPhone:  req.ContactPhone,
		VisitorCount:  req.VisitorCount,
		VisitDate:     req.VisitDate,
		VisitTimeSlot: req.VisitTimeSlot,
		TicketType:    req.TicketType,
		GuideRequired: req.GuideRequired,
		GuideLanguage: req.GuideLanguage,
		Status:        models.BookingConfirmed,
		Remark:        req.Remark,
		CreatedAt:     now,
		UpdatedAt:     now,
		CreatedBy:     req.Operator,
	}

	var operatorRole models.Role
	if strings.Contains(req.Operator, "票务主管") {
		operatorRole = models.RoleTicketSupervisor
	} else {
		operatorRole = models.RoleCustomerService
	}
	s.addChangeLogLocked(id, "create", "", "", "", req.Remark, req.Operator, operatorRole)
	s.bookings[id] = booking
	return &booking
}

func (s *Store) GetBooking(id string) (*models.TeamBooking, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}
	return &booking, true
}

func (s *Store) GetBookingByNo(bookingNo string) (*models.TeamBooking, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, booking := range s.bookings {
		if booking.BookingNo == bookingNo {
			b := booking
			return &b, true
		}
	}
	return nil, false
}

func (s *Store) ListBookings() []models.TeamBooking {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.TeamBooking, 0, len(s.bookings))
	for _, booking := range s.bookings {
		result = append(result, booking)
	}
	return result
}

func (s *Store) UpdateBooking(id string, req models.UpdateBookingRequest) (*models.TeamBooking, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}

	oldBooking := booking

	var operatorRole models.Role
	if strings.Contains(req.Operator, "票务主管") {
		operatorRole = models.RoleTicketSupervisor
	} else {
		operatorRole = models.RoleCustomerService
	}

	keyFieldsChanged := false

	if req.VisitorCount != nil {
		oldVal := fmt.Sprintf("%d", booking.VisitorCount)
		newVal := fmt.Sprintf("%d", *req.VisitorCount)
		booking.VisitorCount = *req.VisitorCount
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "visitor_count", oldVal, newVal, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.VisitDate != nil && *req.VisitDate != booking.VisitDate {
		booking.VisitDate = *req.VisitDate
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "visit_date", oldBooking.VisitDate, *req.VisitDate, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.VisitTimeSlot != nil && *req.VisitTimeSlot != booking.VisitTimeSlot {
		booking.VisitTimeSlot = *req.VisitTimeSlot
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "visit_time_slot", oldBooking.VisitTimeSlot, *req.VisitTimeSlot, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.TicketType != nil && *req.TicketType != booking.TicketType {
		booking.TicketType = *req.TicketType
		s.addChangeLogLocked(id, "update", "ticket_type", oldBooking.TicketType, *req.TicketType, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.GuideRequired != nil && *req.GuideRequired != booking.GuideRequired {
		oldVal := fmt.Sprintf("%t", booking.GuideRequired)
		newVal := fmt.Sprintf("%t", *req.GuideRequired)
		booking.GuideRequired = *req.GuideRequired
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "guide_required", oldVal, newVal, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.GuideLanguage != nil && *req.GuideLanguage != booking.GuideLanguage {
		booking.GuideLanguage = *req.GuideLanguage
		keyFieldsChanged = true
		s.addChangeLogLocked(id, "update", "guide_language", oldBooking.GuideLanguage, *req.GuideLanguage, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.Status != nil && models.BookingStatus(*req.Status) != booking.Status {
		oldStatus := string(booking.Status)
		newStatus := *req.Status
		booking.Status = models.BookingStatus(*req.Status)
		s.addChangeLogLocked(id, "status_change", "status", oldStatus, newStatus, req.ChangeReason, req.Operator, operatorRole)
	}
	if req.Remark != nil && *req.Remark != booking.Remark {
		booking.Remark = *req.Remark
		s.addChangeLogLocked(id, "update", "remark", oldBooking.Remark, *req.Remark, req.ChangeReason, req.Operator, operatorRole)
	}

	booking.UpdatedAt = time.Now()
	s.bookings[id] = booking

	if keyFieldsChanged && booking.Status != models.BookingCancelled && booking.Status != models.BookingCompleted {
		isFirstChange := oldBooking.Status == models.BookingConfirmed
		if isFirstChange {
			booking.Status = models.BookingModified
			s.bookings[id] = booking
			s.addChangeLogLocked(id, "status_change", "status", string(models.BookingConfirmed), string(models.BookingModified), "关键信息变更，状态自动更新", req.Operator, operatorRole)
		}
		s.adjustSchedulesForBookingLocked(id, req.ChangeReason)
		notificationTitle := "预约信息变更"
		notificationContentGuide := "预约 " + booking.BookingNo + " 的关键信息已变更，请关注排班调整"
		notificationContentSupervisor := "预约 " + booking.BookingNo + " 的关键信息已变更，请关注"
		if !isFirstChange {
			notificationTitle = "预约再次变更"
			notificationContentGuide = "预约 " + booking.BookingNo + " 再次发生变更，请关注最新排班调整"
			notificationContentSupervisor = "预约 " + booking.BookingNo + " 再次发生变更，请关注"
		}
		s.createNotificationLocked(
			notificationTitle,
			notificationContentGuide,
			models.RoleGuide,
			"",
			"booking",
			id,
		)
		s.createNotificationLocked(
			notificationTitle,
			notificationContentSupervisor,
			models.RoleTicketSupervisor,
			"",
			"booking",
			id,
		)
	}

	return &booking, true
}

func (s *Store) addChangeLogLocked(bookingID, changeType, fieldChanged, oldValue, newValue, changeReason, changedBy string, changedByRole models.Role) {
	id := fmt.Sprintf("LG%06d", s.changeLogSeq)
	s.changeLogSeq++

	log := models.BookingChangeLog{
		ID:            id,
		BookingID:     bookingID,
		ChangeType:    changeType,
		FieldChanged:  fieldChanged,
		OldValue:      oldValue,
		NewValue:      newValue,
		ChangeReason:  changeReason,
		ChangedBy:     changedBy,
		ChangedByRole: changedByRole,
		ChangedAt:     time.Now(),
	}

	s.changeLogs[bookingID] = append(s.changeLogs[bookingID], log)
}

func (s *Store) adjustSchedulesForBookingLocked(bookingID string, reason string) {
	for id, schedule := range s.schedules {
		if schedule.BookingID == bookingID {
			schedule.Status = models.ScheduleAdjusted
			schedule.Remark = reason
			schedule.UpdatedAt = time.Now()
			s.schedules[id] = schedule
		}
	}
}

func (s *Store) createNotificationLocked(title, content string, targetRole models.Role, targetUser string, relatedType, relatedID string) {
	s.notificationSeq++
	id := fmt.Sprintf("NF%06d", s.notificationSeq)

	notification := models.Notification{
		ID:          id,
		Title:       title,
		Content:     content,
		TargetRole:  targetRole,
		TargetUser:  targetUser,
		RelatedType: relatedType,
		RelatedID:   relatedID,
		Status:      models.NotificationUnread,
		CreatedAt:   time.Now(),
	}

	s.notifications[id] = notification
}

func (s *Store) GetBookingChangeLogs(bookingID string) []models.BookingChangeLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	logs := make([]models.BookingChangeLog, len(s.changeLogs[bookingID]))
	copy(logs, s.changeLogs[bookingID])
	return logs
}

func (s *Store) GetBookingDetail(id string) (*models.BookingDetail, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[id]
	if !ok {
		return nil, false
	}

	changeLogs := make([]models.BookingChangeLog, len(s.changeLogs[id]))
	copy(changeLogs, s.changeLogs[id])

	var schedules []models.GuideSchedule
	for _, sc := range s.schedules {
		if sc.BookingID == id {
			schedules = append(schedules, sc)
		}
	}

	var checkins []models.CheckinRecord
	for _, ci := range s.checkins {
		if ci.BookingID == id {
			checkins = append(checkins, ci)
		}
	}

	var complaints []models.Complaint
	for _, cp := range s.complaints {
		if cp.BookingID == id {
			complaints = append(complaints, cp)
		}
	}

	detail := &models.BookingDetail{
		Booking:    booking,
		ChangeLogs: changeLogs,
		Schedules:  schedules,
		Checkins:   checkins,
		Complaints: complaints,
	}

	return detail, true
}

func (s *Store) GetBookingTimeline(bookingID string) (*models.TimelineResponse, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	booking, ok := s.bookings[bookingID]
	if !ok {
		return nil, false
	}

	resp := &models.TimelineResponse{
		BookingNo: booking.BookingNo,
		TeamName:  booking.TeamName,
		Events:    []models.TimelineEvent{},
	}

	resp.Events = append(resp.Events, models.TimelineEvent{
		EventType:   models.TimelineBookingCreated,
		EventTime:   booking.CreatedAt,
		Title:       "预约创建",
		Content:     "创建成功，状态：已确认",
		Operator:    booking.CreatedBy,
		OperatorRole: models.RoleTicketSupervisor,
		RelatedID:   booking.ID,
		RawData:     booking,
	})

	for _, log := range s.changeLogs[bookingID] {
		if log.ChangeType == "create" {
			continue
		}
		content := log.ChangeReason
		if log.FieldChanged != "" {
			content = log.ChangeReason + "，变更字段：" + log.FieldChanged
			if log.OldValue != "" && log.NewValue != "" {
				content += "（" + log.OldValue + " → " + log.NewValue + "）"
			}
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineBookingChanged,
			EventTime:    log.ChangedAt,
			Title:        "预约变更",
			Content:      content,
			Operator:     log.ChangedBy,
			OperatorRole: log.ChangedByRole,
			RelatedID:    log.ID,
			RawData:      log,
		})
	}

	for _, sc := range s.schedules {
		if sc.BookingID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineScheduleCreated,
			EventTime:    sc.CreatedAt,
			Title:        "讲解排班创建",
			Content:      "讲解员：" + sc.GuideName + "，时间：" + sc.VisitDate + " " + sc.StartTime + "-" + sc.EndTime,
			Operator:     "系统",
			OperatorRole: models.RoleTicketSupervisor,
			RelatedID:    sc.ID,
			RawData:      sc,
		})
		if sc.Status == models.ScheduleAdjusted {
			resp.Events = append(resp.Events, models.TimelineEvent{
				EventType:    models.TimelineScheduleAdjusted,
				EventTime:    sc.UpdatedAt,
				Title:        "讲解排班已调整",
				Content:      sc.Remark,
				Operator:     "系统",
				OperatorRole: models.RoleTicketSupervisor,
				RelatedID:    sc.ID,
				RawData:      sc,
			})
		}
	}

	for _, ci := range s.checkins {
		if ci.BookingID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineCheckin,
			EventTime:    ci.CheckinTime,
			Title:        "检票入园",
			Content:      "闸机号：" + ci.GateNo + "，人数：" + strconv.Itoa(ci.VisitorCount),
			Operator:     ci.CheckerName,
			OperatorRole: models.RoleTicketChecker,
			RelatedID:    ci.ID,
			RawData:      ci,
		})
	}

	for _, cp := range s.complaints {
		if cp.BookingID != bookingID {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineComplaintCreated,
			EventTime:    cp.CreatedAt,
			Title:        "投诉提交",
			Content:      "投诉类型：" + cp.ComplaintType + "，内容：" + cp.Content,
			Operator:     cp.Complainant,
			OperatorRole: models.RoleCustomerService,
			RelatedID:    cp.ID,
			RawData:      cp,
		})
		if cp.HandledAt != nil {
			resp.Events = append(resp.Events, models.TimelineEvent{
				EventType:    models.TimelineComplaintHandled,
				EventTime:    *cp.HandledAt,
				Title:        "投诉处理",
				Content:      cp.HandleResult,
				Operator:     cp.Handler,
				OperatorRole: models.RoleCustomerService,
				RelatedID:    cp.ID,
				RawData:      cp,
			})
		}
	}

	for _, n := range s.notifications {
		if n.RelatedID != bookingID || n.RelatedType != "booking" {
			continue
		}
		resp.Events = append(resp.Events, models.TimelineEvent{
			EventType:    models.TimelineNotification,
			EventTime:    n.CreatedAt,
			Title:        "通知推送",
			Content:      n.Title + "：" + n.Content,
			Operator:     "系统",
			OperatorRole: n.TargetRole,
			RelatedID:    n.ID,
			RawData:      n,
		})
	}

	sort.Slice(resp.Events, func(i, j int) bool {
		return resp.Events[i].EventTime.Before(resp.Events[j].EventTime)
	})

	return resp, true
}
'''

files['internal/handlers/booking_handler.go'] = '''package handlers

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

type BookingHandler struct {
	store *store.Store
}

func NewBookingHandler(s *store.Store) *BookingHandler {
	return &BookingHandler{store: s}
}

func (h *BookingHandler) ListBookings(c *fiber.Ctx) error {
	bookings := h.store.ListBookings()
	return c.JSON(bookings)
}

func (h *BookingHandler) GetBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	booking, ok := h.store.GetBooking(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	return c.JSON(booking)
}

func (h *BookingHandler) CreateBooking(c *fiber.Ctx) error {
	var req models.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	booking := h.store.CreateBooking(req)
	return c.Status(fiber.StatusCreated).JSON(booking)
}

func (h *BookingHandler) UpdateBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	var req models.UpdateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	booking, ok := h.store.UpdateBooking(id, req)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}

	return c.JSON(booking)
}

func (h *BookingHandler) GetBookingDetail(c *fiber.Ctx) error {
	id := c.Params("id")
	detail, ok := h.store.GetBookingDetail(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	return c.JSON(detail)
}

func (h *BookingHandler) GetTimeline(c *fiber.Ctx) error {
	id := c.Params("id")
	timeline, ok := h.store.GetBookingTimeline(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "booking not found"})
	}
	return c.JSON(timeline)
}
'''

files['main.go'] = '''package main

import (
	"log"
	"os"

	"scenic-ticket-system/internal/handlers"
	"scenic-ticket-system/internal/seed"
	"scenic-ticket-system/internal/store"

	"github.com/gofiber/fiber/v2"
)

func main() {

	s := store.NewStore()

	seed.Seed(s)

	app := fiber.New()

	bookingHandler := handlers.NewBookingHandler(s)

	scheduleHandler := handlers.NewScheduleHandler(s)

	checkinHandler := handlers.NewCheckinHandler(s)

	complaintHandler := handlers.NewComplaintHandler(s)

	notificationHandler := handlers.NewNotificationHandler(s)

	api := app.Group("/api")

	bookings := api.Group("/bookings")
	bookings.Get("/", bookingHandler.ListBookings)
	bookings.Post("/", bookingHandler.CreateBooking)
	bookings.Get("/:id", bookingHandler.GetBooking)
	bookings.Put("/:id", bookingHandler.UpdateBooking)
	bookings.Get("/:id/detail", bookingHandler.GetBookingDetail)
	bookings.Get("/:id/timeline", bookingHandler.GetTimeline)

	schedules := api.Group("/schedules")
	schedules.Get("/", scheduleHandler.ListSchedules)
	schedules.Post("/", scheduleHandler.CreateSchedule)
	schedules.Get("/:id", scheduleHandler.GetSchedule)
	schedules.Put("/:id", scheduleHandler.UpdateSchedule)
	schedules.Get("/:id/detail", scheduleHandler.GetScheduleDetail)
	schedules.Get("/booking/:bookingId", scheduleHandler.ListSchedulesByBooking)

	checkins := api.Group("/checkins")
	checkins.Get("/", checkinHandler.ListCheckins)
	checkins.Post("/", checkinHandler.CreateCheckin)
	checkins.Get("/booking/:bookingId", checkinHandler.ListCheckinsByBooking)

	complaints := api.Group("/complaints")
	complaints.Get("/", complaintHandler.ListComplaints)
	complaints.Post("/", complaintHandler.CreateComplaint)
	complaints.Get("/:id", complaintHandler.GetComplaint)
	complaints.Get("/:id/detail", complaintHandler.GetComplaintDetail)
	complaints.Put("/:id/handle", complaintHandler.HandleComplaint)

	notifications := api.Group("/notifications")
	notifications.Get("/", notificationHandler.ListNotifications)
	notifications.Put("/:id/read", notificationHandler.MarkRead)

	log.Println("Server starting on :3000 ...")
	if err := app.Listen(":3000"); err != nil {
		log.Printf("Server failed to start: %v", err)
		os.Exit(1)
	}
}
'''

files['internal/seed/seed.go'] = '''package seed

import (
	"scenic-ticket-system/internal/models"
	"scenic-ticket-system/internal/store"
)

func Seed(s *store.Store) {
	booking1 := s.CreateBooking(models.CreateBookingRequest{
		TeamName:      "阳光旅行团",
		ContactName:   "张三",
		ContactPhone:  "13800138001",
		VisitorCount:  25,
		VisitDate:     "2026-06-20",
		VisitTimeSlot: "09:00-12:00",
		TicketType:    "adult",
		GuideRequired: true,
		GuideLanguage: "中文",
		Remark:        "团体票，需要讲解员",
		Operator:      "票务主管-李经理",
	})

	booking2 := s.CreateBooking(models.CreateBookingRequest{
		TeamName:      "红星小学",
		ContactName:   "王老师",
		ContactPhone:  "13900139002",
		VisitorCount:  45,
		VisitDate:     "2026-06-21",
		VisitTimeSlot: "10:00-14:00",
		TicketType:    "student",
		GuideRequired: true,
		GuideLanguage: "中文",
		Remark:        "学生团体，优惠票",
		Operator:      "票务主管-李经理",
	})

	_ = s.CreateBooking(models.CreateBookingRequest{
		TeamName:      "自由行散客",
		ContactName:   "赵六",
		ContactPhone:  "13700137003",
		VisitorCount:  5,
		VisitDate:     "2026-06-22",
		VisitTimeSlot: "14:00-17:00",
		TicketType:    "adult",
		GuideRequired: false,
		Remark:        "散客，不需要讲解",
		Operator:      "客服-小陈",
	})

	s.CreateSchedule(models.CreateScheduleRequest{
		BookingID:     booking1.ID,
		GuideID:       "G001",
		GuideName:     "讲解员-刘导",
		GuideLanguage: "中文",
		VisitDate:     "2026-06-20",
		StartTime:     "09:00",
		EndTime:       "11:30",
		Remark:        "上午场讲解",
	})

	schedule2 := s.CreateSchedule(models.CreateScheduleRequest{
		BookingID:     booking2.ID,
		GuideID:       "G002",
		GuideName:     "讲解员-陈导",
		GuideLanguage: "中文",
		VisitDate:     "2026-06-21",
		StartTime:     "10:00",
		EndTime:       "12:30",
		Remark:        "学生团讲解",
	})

	s.CreateCheckin(models.CreateCheckinRequest{
		BookingID:    booking1.ID,
		GateNo:       "1号门",
		VisitorCount: 25,
		CheckerName:  "检票员-孙师傅",
		Remark:       "全员到齐",
	})

	s.CreateCheckin(models.CreateCheckinRequest{
		BookingID:    booking2.ID,
		GateNo:       "2号门",
		VisitorCount: 40,
		CheckerName:  "检票员-周师傅",
		Remark:       "5名学生请假未到",
	})

	complaint1 := s.CreateComplaint(models.CreateComplaintRequest{
		BookingID:     booking2.ID,
		ScheduleID:    schedule2.ID,
		Complainant:   "王老师",
		ContactPhone:  "13900139002",
		ComplaintType: "服务态度",
		Content:       "讲解员讲解不够耐心，对学生问题回答敷衍",
	})

	newVisitorCount := 30
	newTimeSlot := "13:00-16:00"
	s.UpdateBooking(booking1.ID, models.UpdateBookingRequest{
		VisitorCount:  &newVisitorCount,
		VisitTimeSlot: &newTimeSlot,
		ChangeReason:  "团队人数调整，时间变更",
		Operator:      "票务主管-李经理",
	})
	newVisitorCount2 := 35
	newTimeSlot2 := "14:00-17:00"
	s.UpdateBooking(booking1.ID, models.UpdateBookingRequest{
		VisitorCount:  &newVisitorCount2,
		VisitTimeSlot: &newTimeSlot2,
		ChangeReason:  "人数再次调整，时间延后",
		Operator:      "票务主管-李经理",
	})

	s.HandleComplaint(complaint1.ID, models.HandleComplaintRequest{
		Handler:      "客服-小陈",
		HandleResult: "已与讲解员沟通，向游客致歉，赠送下次免费讲解券",
		Status:       "resolved",
	})
}
'''

import os
base = '/Users/liu/Documents/private/model-test/trae-20260601-3'
for path, content in files.items():
    full_path = os.path.join(base, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f'Written: {path}')

print('All files written successfully!')
